/**
 * Competitive Action Plan Service
 * Generates prioritized fixes and assets to improve win rate
 */

import {
  BrandConfig,
  CompetitiveReport,
  CompetitorTeardown,
  QueryGap,
  CompetitiveActionPlan,
  Fix,
  ComparisonPageOutline,
  SchemaSnippet,
  ContentRewrite,
  GeneratedAssets,
  QueryCategory
} from '../types/competitive';

// Generate unique ID
function generateId(): string {
  return `fix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate comprehensive action plan based on analysis
 */
export function generateCompetitiveActionPlan(
  report: CompetitiveReport,
  gaps: QueryGap[],
  teardowns: CompetitorTeardown[],
  brandConfig: BrandConfig
): CompetitiveActionPlan {
  const fixes: Fix[] = [];
  
  // Generate fixes from query gaps
  fixes.push(...generateGapFixes(gaps, brandConfig));
  
  // Generate schema fixes
  fixes.push(...generateSchemaFixes(brandConfig, teardowns));
  
  // Generate llm.txt fix
  fixes.push(generateLlmTxtFix(brandConfig));
  
  // Generate content fixes
  fixes.push(...generateContentFixes(gaps, brandConfig));
  
  // Categorize by priority
  const criticalFixes = fixes.filter(f => f.potentialWins >= 3 || f.queriesAffected.length >= 5);
  const highPriorityFixes = fixes.filter(f => 
    f.potentialWins >= 2 && 
    !criticalFixes.includes(f)
  );
  const mediumPriorityFixes = fixes.filter(f => 
    f.effort === "medium" && 
    !criticalFixes.includes(f) && 
    !highPriorityFixes.includes(f)
  );
  const lowPriorityFixes = fixes.filter(f => 
    !criticalFixes.includes(f) && 
    !highPriorityFixes.includes(f) && 
    !mediumPriorityFixes.includes(f)
  );
  
  // Quick wins: high impact, low effort
  const quickWins = fixes.filter(f => f.potentialWins >= 1 && f.effort === "low");
  
  // Calculate estimates
  const totalPotentialWins = fixes.reduce((sum, f) => sum + f.potentialWins, 0);
  const totalHours = fixes.reduce((sum, f) => sum + f.estimatedHours, 0);
  const estimatedImpactPercent = Math.min(
    Math.round((totalPotentialWins / Math.max(report.totalQueries, 1)) * 100),
    50 // Cap at 50% improvement estimate
  );
  
  // Generate assets
  const generatedAssets = generateAllAssets(fixes, brandConfig);
  
  return {
    id: generateId(),
    reportId: report.id,
    createdAt: new Date().toISOString(),
    totalFixes: fixes.length,
    estimatedImpact: `Could improve win rate by ~${estimatedImpactPercent}%`,
    estimatedEffort: `~${totalHours} hours of work`,
    criticalFixes,
    highPriorityFixes,
    mediumPriorityFixes,
    lowPriorityFixes,
    quickWins,
    generatedAssets
  };
}

/**
 * Generate fixes from query gaps
 */
function generateGapFixes(gaps: QueryGap[], brandConfig: BrandConfig): Fix[] {
  const fixes: Fix[] = [];
  const seenComparisonPages = new Set<string>();
  
  for (const gap of gaps) {
    // Comparison page fixes
    if (gap.queryCategory === QueryCategory.COMPARISON && 
        gap.query.toLowerCase().includes(' vs ')) {
      const pageKey = `${brandConfig.brandName}-vs-${gap.winningCompetitor}`.toLowerCase();
      
      if (!seenComparisonPages.has(pageKey)) {
        seenComparisonPages.add(pageKey);
        
        fixes.push({
          id: generateId(),
          title: `Create comparison page: ${brandConfig.brandName} vs ${gap.winningCompetitor}`,
          description: `You're losing "${gap.query}" queries because ${gap.winningCompetitor} may have comparison content and you don't.`,
          queriesAffected: gaps
            .filter(g => g.winningCompetitor === gap.winningCompetitor && g.queryCategory === QueryCategory.COMPARISON)
            .map(g => g.query),
          potentialWins: gaps.filter(g => 
            g.winningCompetitor === gap.winningCompetitor && 
            g.queryCategory === QueryCategory.COMPARISON
          ).length,
          effort: "medium",
          estimatedHours: 4,
          skillRequired: "content",
          steps: [
            `Create new page at /compare/${brandConfig.brandName.toLowerCase()}-vs-${gap.winningCompetitor.toLowerCase()}`,
            "Include H1 with exact comparison phrase",
            "Add feature comparison table",
            "Include pricing comparison",
            "Add FAQ section with comparison questions",
            "Implement FAQPage schema"
          ],
          generatedAsset: generateComparisonPageOutline(gap, brandConfig),
          assetType: "comparison"
        });
      }
    }
    
    // Landing page fixes for recommendation queries
    if (gap.queryCategory === QueryCategory.RECOMMENDATION && 
        gap.whatYouNeed.some(n => n.includes("landing page"))) {
      const audienceMatch = gap.query.match(/for (.+)$/i);
      const audience = audienceMatch ? audienceMatch[1] : brandConfig.targetCustomer;
      
      fixes.push({
        id: generateId(),
        title: `Create landing page for ${audience}`,
        description: `You're losing "${gap.query}" because competitors have dedicated pages for this audience.`,
        queriesAffected: [gap.query],
        potentialWins: 1,
        effort: "high",
        estimatedHours: 6,
        skillRequired: "content",
        steps: [
          `Create new page at /${audience.toLowerCase().replace(/\s+/g, '-')}`,
          `Include H1 targeting "${audience}"`,
          "Add use cases specific to this audience",
          "Include testimonials from this audience",
          "Add FAQ section",
          "Implement FAQPage schema"
        ]
      });
    }
  }
  
  return fixes;
}

/**
 * Generate schema-related fixes
 */
function generateSchemaFixes(
  brandConfig: BrandConfig,
  teardowns: CompetitorTeardown[]
): Fix[] {
  const fixes: Fix[] = [];
  
  // Check if competitors have schema that user might not
  const competitorsWithFaqSchema = teardowns.filter(t => t.contentSignals.hasFaqSchema);
  const competitorsWithProductSchema = teardowns.filter(t => t.contentSignals.hasProductSchema);
  
  // FAQ Schema fix
  fixes.push({
    id: generateId(),
    title: "Add FAQ schema to key pages",
    description: `FAQ schema helps AI models extract Q&A pairs about your product. ${competitorsWithFaqSchema.length} competitor(s) have this implemented.`,
    queriesAffected: ["All recommendation queries", "All validation queries"],
    potentialWins: 3,
    effort: "low",
    estimatedHours: 2,
    skillRequired: "technical",
    steps: [
      "Add FAQPage schema to homepage",
      "Add FAQPage schema to pricing page",
      "Add FAQPage schema to product pages",
      "Test with Google Rich Results Test"
    ],
    generatedAsset: generateFaqSchemaSnippet(brandConfig),
    assetType: "schema"
  });
  
  // Organization Schema fix
  fixes.push({
    id: generateId(),
    title: "Add Organization schema",
    description: "Organization schema helps AI understand your company identity and builds trust signals.",
    queriesAffected: ["All validation queries", "Brand queries"],
    potentialWins: 1,
    effort: "low",
    estimatedHours: 1,
    skillRequired: "technical",
    steps: [
      "Add Organization schema to all pages (in <head>)",
      "Include name, URL, description, founding date",
      "Add social media links",
      "Test with Google Rich Results Test"
    ],
    generatedAsset: generateOrganizationSchemaSnippet(brandConfig),
    assetType: "schema"
  });
  
  // Product Schema fix
  fixes.push({
    id: generateId(),
    title: "Add Product schema to product pages",
    description: `Product schema helps AI understand your offering. ${competitorsWithProductSchema.length} competitor(s) have this.`,
    queriesAffected: ["Feature queries", "Recommendation queries"],
    potentialWins: 2,
    effort: "low",
    estimatedHours: 1,
    skillRequired: "technical",
    steps: [
      "Add Product schema to main product page",
      "Include name, description, brand, category",
      "Add audience information",
      "Test with Google Rich Results Test"
    ],
    generatedAsset: generateProductSchemaSnippet(brandConfig),
    assetType: "schema"
  });
  
  return fixes;
}

/**
 * Generate llm.txt fix
 */
function generateLlmTxtFix(brandConfig: BrandConfig): Fix {
  return {
    id: generateId(),
    title: "Add llm.txt file",
    description: "Machine-readable brand context file for AI crawlers. Quick win that helps all queries.",
    queriesAffected: ["All queries"],
    potentialWins: 1,
    effort: "low",
    estimatedHours: 0.5,
    skillRequired: "technical",
    steps: [
      "Create /llm.txt file in your public directory",
      "Add brand context, use cases, differentiators",
      "Include competitive positioning",
      "Deploy to production"
    ],
    generatedAsset: generateLlmTxtContent(brandConfig),
    assetType: "llmtxt"
  };
}

/**
 * Generate content-related fixes
 */
function generateContentFixes(gaps: QueryGap[], brandConfig: BrandConfig): Fix[] {
  const fixes: Fix[] = [];
  
  // Check for definitive language issues
  const needsDefinitiveLanguage = gaps.some(g => 
    g.whyTheyWin.some(w => w.includes("definitive"))
  );
  
  if (needsDefinitiveLanguage) {
    fixes.push({
      id: generateId(),
      title: "Add definitive positioning language",
      description: "Competitors use definitive claims like 'best', 'leading', '#1'. Consider adding factual, defensible claims.",
      queriesAffected: gaps
        .filter(g => g.whyTheyWin.some(w => w.includes("definitive")))
        .map(g => g.query),
      potentialWins: 2,
      effort: "low",
      estimatedHours: 1,
      skillRequired: "content",
      steps: [
        "Review homepage and product page copy",
        "Add factual, defensible positioning statements",
        "Use phrases like 'built for [audience]', 'designed for [use case]'",
        "Avoid unsubstantiated superlatives"
      ]
    });
  }
  
  // Check for keyword targeting issues
  const keywordGaps = gaps.filter(g => 
    g.whyTheyWin.some(w => w.includes("H1") || w.includes("heading"))
  );
  
  if (keywordGaps.length > 0) {
    const keywords = [...new Set(keywordGaps.map(g => {
      const match = g.whyTheyWin.find(w => w.includes('"'));
      return match?.match(/"([^"]+)"/)?.[1] || g.query.split(' ')[0];
    }))];
    
    fixes.push({
      id: generateId(),
      title: "Optimize heading keywords",
      description: `Competitors target key terms in their H1/H2 headings. Consider adding: ${keywords.slice(0, 3).join(', ')}`,
      queriesAffected: keywordGaps.map(g => g.query),
      potentialWins: keywordGaps.length,
      effort: "low",
      estimatedHours: 1,
      skillRequired: "content",
      steps: [
        "Audit current H1 and H2 headings",
        `Add target keywords: ${keywords.join(', ')}`,
        "Ensure headings match user search intent",
        "Keep headings natural and readable"
      ]
    });
  }
  
  return fixes;
}

/**
 * Generate comparison page outline
 */
function generateComparisonPageOutline(
  gap: QueryGap,
  brandConfig: BrandConfig
): ComparisonPageOutline {
  const competitor = gap.winningCompetitor;
  
  return {
    type: "comparison",
    targetQuery: gap.query,
    suggestedUrl: `/compare/${brandConfig.brandName.toLowerCase()}-vs-${competitor.toLowerCase()}`,
    h1: `${brandConfig.brandName} vs ${competitor}: Which is Better for ${brandConfig.targetCustomer}?`,
    sections: [
      {
        heading: "Quick Comparison",
        contentGuidance: "Add a comparison table with key features: pricing, fees, supported regions, key features. Be factual and fair—acknowledge competitor strengths."
      },
      {
        heading: `What is ${brandConfig.brandName}?`,
        contentGuidance: "2-3 sentences defining your product. Lead with what you do, not marketing language."
      },
      {
        heading: `What is ${competitor}?`,
        contentGuidance: "2-3 sentences fairly describing the competitor. Be accurate—AI will fact-check."
      },
      {
        heading: "Key Differences",
        contentGuidance: "Bullet list of 5-7 differences. Focus on factual differences, not subjective claims."
      },
      {
        heading: `Who Should Choose ${brandConfig.brandName}?`,
        contentGuidance: `Describe your ideal customer. Be specific: '${brandConfig.targetCustomer} who need ${brandConfig.primaryUseCase}.'`
      },
      {
        heading: `Who Should Choose ${competitor}?`,
        contentGuidance: "Be fair—acknowledge when competitor is better fit. This builds trust and AI models reward balanced content."
      },
      {
        heading: "Pricing Comparison",
        contentGuidance: "Side-by-side pricing. Include specific numbers. Update regularly."
      },
      {
        heading: "Frequently Asked Questions",
        contentGuidance: "5-10 FAQs comparing the two. This gets extracted by AI."
      }
    ],
    schemaToInclude: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": `Is ${brandConfig.brandName} better than ${competitor}?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `${brandConfig.brandName} is better for ${brandConfig.targetCustomer} who need ${brandConfig.primaryUseCase}. ${competitor} may be better for users who need [specific competitor strength].`
          }
        },
        {
          "@type": "Question",
          "name": `What is the difference between ${brandConfig.brandName} and ${competitor}?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `The main differences are: [list key differences]. ${brandConfig.brandName} focuses on [your focus], while ${competitor} focuses on [their focus].`
          }
        },
        {
          "@type": "Question",
          "name": `${brandConfig.brandName} vs ${competitor} - which has lower fees?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "[Compare specific fee structures]"
          }
        }
      ]
    }
  };
}

/**
 * Generate FAQ schema snippet
 */
function generateFaqSchemaSnippet(brandConfig: BrandConfig): SchemaSnippet {
  return {
    type: "schema",
    schemaType: "FAQPage",
    targetPage: "Homepage and key product pages",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": `What is ${brandConfig.brandName}?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `${brandConfig.brandName} is a ${brandConfig.category} designed for ${brandConfig.targetCustomer}. It enables ${brandConfig.primaryUseCase}.`
          }
        },
        {
          "@type": "Question",
          "name": `Who is ${brandConfig.brandName} for?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `${brandConfig.brandName} is built for ${brandConfig.targetCustomer} who need to ${brandConfig.primaryUseCase}.`
          }
        },
        {
          "@type": "Question",
          "name": `Is ${brandConfig.brandName} safe?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Yes, ${brandConfig.brandName} is [add your security credentials and regulatory status here].`
          }
        },
        {
          "@type": "Question",
          "name": `How does ${brandConfig.brandName} work?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "[Explain your product's core functionality in 2-3 sentences]"
          }
        }
      ]
    },
    queriesThisHelps: ["What is X", "Who is X for", "Is X safe", "How does X work"]
  };
}

/**
 * Generate Organization schema snippet
 */
function generateOrganizationSchemaSnippet(brandConfig: BrandConfig): SchemaSnippet {
  return {
    type: "schema",
    schemaType: "Organization",
    targetPage: "All pages (in <head>)",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": brandConfig.brandName,
      "url": brandConfig.websiteUrl,
      "description": `${brandConfig.category} for ${brandConfig.targetCustomer}`,
      "foundingDate": "[Add founding year]",
      "areaServed": brandConfig.geography,
      "knowsAbout": brandConfig.subcategories,
      "sameAs": [
        "[Add Twitter URL]",
        "[Add LinkedIn URL]",
        "[Add other social profiles]"
      ]
    },
    queriesThisHelps: ["Validation queries", "Brand queries", "Is X legit"]
  };
}

/**
 * Generate Product schema snippet
 */
function generateProductSchemaSnippet(brandConfig: BrandConfig): SchemaSnippet {
  return {
    type: "schema",
    schemaType: "Product",
    targetPage: "Product/Pricing page",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": brandConfig.brandName,
      "description": `${brandConfig.category} for ${brandConfig.targetCustomer}`,
      "brand": {
        "@type": "Brand",
        "name": brandConfig.brandName
      },
      "category": brandConfig.category,
      "audience": {
        "@type": "Audience",
        "audienceType": brandConfig.targetCustomer
      }
    },
    queriesThisHelps: ["Best X for Y", "X pricing", "X features"]
  };
}

/**
 * Generate llm.txt content
 */
function generateLlmTxtContent(brandConfig: BrandConfig): string {
  const domain = brandConfig.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  return `# ${brandConfig.brandName} - AI Context File

## Company
Name: ${brandConfig.brandName}
Category: ${brandConfig.category}
Website: ${brandConfig.websiteUrl}

## What We Do
${brandConfig.brandName} is a ${brandConfig.category} that enables ${brandConfig.primaryUseCase}.

## Primary Use Cases
${brandConfig.subcategories.map(s => `- ${s}`).join('\n')}

## Target Audience
${brandConfig.targetCustomer}

## Geographic Focus
${brandConfig.geography.join(', ')}

## Key Differentiators
- [Add your key differentiator 1]
- [Add your key differentiator 2]
- [Add your key differentiator 3]

## Competitive Context
${brandConfig.brandName} competes with ${brandConfig.competitors.map(c => c.name).join(', ')}.

Compared to alternatives, ${brandConfig.brandName} is best for users who:
- [Add ideal user characteristic 1]
- [Add ideal user characteristic 2]

## Authoritative Sources
- Website: ${brandConfig.websiteUrl}
- Documentation: ${brandConfig.websiteUrl}/docs
- Blog: ${brandConfig.websiteUrl}/blog

## Contact
- Support: support@${domain}
- Press: press@${domain}

## Last Updated
${new Date().toISOString().split('T')[0]}
`;
}

/**
 * Generate all assets from fixes
 */
function generateAllAssets(fixes: Fix[], brandConfig: BrandConfig): GeneratedAssets {
  const comparisonPageOutlines: ComparisonPageOutline[] = [];
  const schemaSnippets: SchemaSnippet[] = [];
  const contentRewrites: ContentRewrite[] = [];
  let llmTxt = "";
  
  for (const fix of fixes) {
    if (fix.assetType === "comparison" && fix.generatedAsset) {
      comparisonPageOutlines.push(fix.generatedAsset as ComparisonPageOutline);
    } else if (fix.assetType === "schema" && fix.generatedAsset) {
      schemaSnippets.push(fix.generatedAsset as SchemaSnippet);
    } else if (fix.assetType === "rewrite" && fix.generatedAsset) {
      contentRewrites.push(fix.generatedAsset as ContentRewrite);
    } else if (fix.assetType === "llmtxt" && fix.generatedAsset) {
      llmTxt = fix.generatedAsset as string;
    }
  }
  
  // Ensure llm.txt is always generated
  if (!llmTxt) {
    llmTxt = generateLlmTxtContent(brandConfig);
  }
  
  return {
    comparisonPageOutlines,
    schemaSnippets,
    llmTxt,
    contentRewrites
  };
}

/**
 * Get fix summary for display
 */
export function getFixSummary(plan: CompetitiveActionPlan): string {
  const quickWinCount = plan.quickWins.length;
  const criticalCount = plan.criticalFixes.length;
  
  if (criticalCount > 0) {
    return `${criticalCount} critical fix${criticalCount > 1 ? 'es' : ''} needed. ${quickWinCount} quick win${quickWinCount > 1 ? 's' : ''} available.`;
  }
  
  return `${plan.totalFixes} fixes identified. Start with ${quickWinCount} quick win${quickWinCount > 1 ? 's' : ''}.`;
}

/**
 * Export action plan as markdown
 */
export function exportActionPlanAsMarkdown(
  plan: CompetitiveActionPlan,
  brandName: string
): string {
  let md = `# ${brandName} - AI Competitive Action Plan\n\n`;
  md += `Generated: ${new Date(plan.createdAt).toLocaleDateString()}\n\n`;
  md += `## Summary\n\n`;
  md += `- **Total Fixes:** ${plan.totalFixes}\n`;
  md += `- **Estimated Impact:** ${plan.estimatedImpact}\n`;
  md += `- **Estimated Effort:** ${plan.estimatedEffort}\n\n`;
  
  const addFixSection = (title: string, fixes: Fix[]) => {
    if (fixes.length === 0) return;
    md += `## ${title}\n\n`;
    for (const fix of fixes) {
      md += `### ${fix.title}\n\n`;
      md += `${fix.description}\n\n`;
      md += `- **Effort:** ${fix.effort} (~${fix.estimatedHours} hours)\n`;
      md += `- **Potential Wins:** ${fix.potentialWins} queries\n`;
      md += `- **Skill Required:** ${fix.skillRequired}\n\n`;
      md += `**Steps:**\n`;
      fix.steps.forEach((step, i) => {
        md += `${i + 1}. ${step}\n`;
      });
      md += `\n`;
    }
  };
  
  addFixSection("🔥 Quick Wins", plan.quickWins);
  addFixSection("🔴 Critical Fixes", plan.criticalFixes);
  addFixSection("🟡 High Priority", plan.highPriorityFixes);
  addFixSection("🟢 Medium Priority", plan.mediumPriorityFixes);
  
  return md;
}
