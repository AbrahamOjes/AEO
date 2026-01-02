/**
 * Competitor Teardown Service
 * Analyzes competitor content to understand why they're winning
 */

import {
  BrandConfig,
  Competitor,
  CompetitorTeardown,
  ContentSignals,
  KeywordPresence,
  WinLossResult,
  QueryGap,
  QueryCategory,
  GapDifficulty
} from '../types/competitive';

// Generate unique ID
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Analyze a competitor's website for content signals
 * Note: Full implementation would require server-side crawling
 * This provides the structure and simulated analysis
 */
export async function analyzeCompetitor(
  competitor: Competitor,
  brandConfig: BrandConfig,
  queriesLostToCompetitor: WinLossResult[]
): Promise<CompetitorTeardown> {
  // Extract keywords from lost queries
  const keywords = extractKeywordsFromQueries(queriesLostToCompetitor);
  
  // Simulate content analysis (in production, this would crawl the site)
  const contentSignals = await analyzeContentSignals(competitor.websiteUrl);
  
  // Analyze keyword presence
  const keywordPresence = await analyzeKeywordPresence(competitor.websiteUrl, keywords);
  
  // Determine advantages
  const advantages = determineAdvantages(
    contentSignals,
    keywordPresence,
    brandConfig
  );
  
  return {
    id: generateId(),
    competitor: competitor.name,
    websiteUrl: competitor.websiteUrl,
    contentSignals,
    keywordPresence,
    advantages,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Extract keywords from lost queries
 */
function extractKeywordsFromQueries(results: WinLossResult[]): string[] {
  const keywords = new Set<string>();
  
  for (const result of results) {
    const queryText = result.query.text.toLowerCase();
    
    // Extract meaningful words (skip common words)
    const stopWords = new Set(['best', 'the', 'a', 'an', 'for', 'to', 'in', 'is', 'vs', 'or', 'and', 'what', 'how', 'why']);
    const words = queryText.split(/\s+/).filter(w => 
      w.length > 2 && !stopWords.has(w)
    );
    
    words.forEach(w => keywords.add(w));
  }
  
  return Array.from(keywords);
}

/**
 * Analyze content signals from a website
 * In production, this would actually crawl the site
 */
async function analyzeContentSignals(websiteUrl: string): Promise<ContentSignals> {
  // This is a simulated analysis - in production you'd:
  // 1. Fetch the homepage and key pages
  // 2. Parse HTML for schema markup
  // 3. Check for comparison pages
  // 4. Analyze content patterns
  
  // For now, return a structure that can be populated
  // when actual crawling is implemented
  return {
    hasComparisonPages: false,
    comparisonPagesFound: [],
    hasFaqSchema: false,
    faqPagesFound: [],
    hasProductSchema: false,
    hasOrganizationSchema: false,
    hasLlmTxt: false,
    avgWordCount: 0,
    usesComparisonTables: false,
    usesDefinitiveLanguage: false,
    hasTargetAudiencePages: false,
    hasPricingTransparency: false,
    hasTrustSignals: false
  };
}

/**
 * Analyze keyword presence on competitor site
 * In production, this would crawl and analyze pages
 */
async function analyzeKeywordPresence(
  websiteUrl: string,
  keywords: string[]
): Promise<Record<string, KeywordPresence>> {
  const presence: Record<string, KeywordPresence> = {};
  
  for (const keyword of keywords) {
    presence[keyword] = {
      keyword,
      count: 0,
      inH1: false,
      inH2: false,
      inFirstParagraph: false
    };
  }
  
  return presence;
}

/**
 * Determine competitor advantages based on analysis
 */
function determineAdvantages(
  contentSignals: ContentSignals,
  keywordPresence: Record<string, KeywordPresence>,
  brandConfig: BrandConfig
): string[] {
  const advantages: string[] = [];
  
  if (contentSignals.hasComparisonPages) {
    advantages.push(
      `Has ${contentSignals.comparisonPagesFound.length} comparison page(s)`
    );
  }
  
  if (contentSignals.hasFaqSchema) {
    advantages.push("Has FAQ schema implemented");
  }
  
  if (contentSignals.hasProductSchema) {
    advantages.push("Has Product schema implemented");
  }
  
  if (contentSignals.hasOrganizationSchema) {
    advantages.push("Has Organization schema implemented");
  }
  
  if (contentSignals.hasLlmTxt) {
    advantages.push("Has llm.txt file for AI crawlers");
  }
  
  if (contentSignals.usesComparisonTables) {
    advantages.push("Uses comparison tables for feature breakdowns");
  }
  
  if (contentSignals.usesDefinitiveLanguage) {
    advantages.push("Uses definitive claims ('best', 'leading', '#1')");
  }
  
  if (contentSignals.hasTargetAudiencePages) {
    advantages.push("Has dedicated pages for target audiences");
  }
  
  if (contentSignals.hasPricingTransparency) {
    advantages.push("Has transparent pricing information");
  }
  
  if (contentSignals.hasTrustSignals) {
    advantages.push("Displays trust signals (reviews, testimonials, logos)");
  }
  
  // Check keyword advantages
  for (const [keyword, data] of Object.entries(keywordPresence)) {
    if (data.inH1) {
      advantages.push(`Targets "${keyword}" in H1 heading`);
    } else if (data.inH2) {
      advantages.push(`Targets "${keyword}" in H2 headings`);
    }
  }
  
  return advantages;
}

/**
 * Analyze query gaps - identify queries where competitors rank and you don't
 */
export function analyzeQueryGaps(
  results: WinLossResult[],
  teardowns: CompetitorTeardown[],
  brandConfig: BrandConfig
): QueryGap[] {
  const gaps: QueryGap[] = [];
  
  // Filter to lost queries
  const lostQueries = results.filter(r => r.overallResult === "loss");
  
  for (const result of lostQueries) {
    const winningCompetitor = result.winningBrand;
    if (!winningCompetitor) continue;
    
    const teardown = teardowns.find(t => t.competitor === winningCompetitor);
    
    const whyTheyWin: string[] = [];
    const whatYouNeed: string[] = [];
    
    // Analyze based on query type
    if (result.query.category === QueryCategory.COMPARISON) {
      // For comparison queries, check for comparison pages
      if (teardown?.contentSignals.hasComparisonPages) {
        whyTheyWin.push("Has dedicated comparison page");
      } else {
        whyTheyWin.push("May have comparison content");
      }
      whatYouNeed.push(
        `Create page: "${brandConfig.brandName} vs ${winningCompetitor}"`
      );
    }
    
    if (result.query.category === QueryCategory.RECOMMENDATION) {
      // Check for keyword targeting
      const queryKeywords = result.query.text.toLowerCase().split(/\s+/);
      
      for (const kw of queryKeywords) {
        if (teardown?.keywordPresence[kw]?.inH1) {
          whyTheyWin.push(`Targets "${kw}" in H1`);
          whatYouNeed.push(`Add "${kw}" to a page heading`);
        }
      }
      
      if (teardown?.contentSignals.usesDefinitiveLanguage) {
        whyTheyWin.push("Uses definitive claims");
        whatYouNeed.push("Add definitive language to product description");
      }
      
      if (teardown?.contentSignals.hasTargetAudiencePages) {
        whyTheyWin.push("Has audience-specific landing pages");
        whatYouNeed.push(`Create landing page for ${brandConfig.targetCustomer}`);
      }
      
      // Default reasons if none found
      if (whyTheyWin.length === 0) {
        whyTheyWin.push("Stronger brand recognition in AI training data");
        whyTheyWin.push("More comprehensive content coverage");
      }
      
      if (whatYouNeed.length === 0) {
        whatYouNeed.push("Create content specifically targeting this query");
        whatYouNeed.push("Add FAQ schema with this question");
      }
    }
    
    if (result.query.category === QueryCategory.FEATURE) {
      whyTheyWin.push("Better feature documentation");
      whatYouNeed.push("Create detailed feature comparison content");
      whatYouNeed.push("Add structured data for product features");
    }
    
    // Calculate difficulty
    const difficulty = calculateDifficulty(whatYouNeed);
    
    // Calculate priority based on query importance
    const priority = calculatePriority(result.query, brandConfig);
    
    gaps.push({
      id: generateId(),
      query: result.query.text,
      queryCategory: result.query.category,
      winningCompetitor,
      whyTheyWin,
      whatYouNeed,
      difficulty,
      priority
    });
  }
  
  // Sort by priority (highest first)
  return gaps.sort((a, b) => b.priority - a.priority);
}

/**
 * Calculate difficulty of implementing fixes
 */
function calculateDifficulty(whatYouNeed: string[]): GapDifficulty {
  const hasPageCreation = whatYouNeed.some(n => 
    n.includes("Create page") || n.includes("Create landing page")
  );
  const hasSchemaWork = whatYouNeed.some(n => 
    n.includes("schema") || n.includes("structured data")
  );
  const hasContentWork = whatYouNeed.some(n => 
    n.includes("content") || n.includes("heading")
  );
  
  if (hasPageCreation) return "hard";
  if (hasSchemaWork && hasContentWork) return "medium";
  return "easy";
}

/**
 * Calculate priority score for a query gap
 */
function calculatePriority(query: any, brandConfig: BrandConfig): number {
  let priority = 5; // Base priority
  
  // Higher priority for recommendation queries
  if (query.category === QueryCategory.RECOMMENDATION) {
    priority += 3;
  }
  
  // Higher priority for comparison queries with primary competitors
  if (query.category === QueryCategory.COMPARISON) {
    const primaryCompetitors = brandConfig.competitors
      .filter(c => c.isPrimary)
      .map(c => c.name.toLowerCase());
    
    const queryLower = query.text.toLowerCase();
    if (primaryCompetitors.some(c => queryLower.includes(c))) {
      priority += 2;
    }
  }
  
  // Higher priority for queries mentioning target customer
  if (brandConfig.targetCustomer && 
      query.text.toLowerCase().includes(brandConfig.targetCustomer.toLowerCase())) {
    priority += 2;
  }
  
  // Cap at 10
  return Math.min(priority, 10);
}

/**
 * Get top competitors by losses
 */
export function getTopCompetitorsByLosses(
  results: WinLossResult[],
  limit: number = 5
): { competitor: string; losses: number }[] {
  const lossCounts: Record<string, number> = {};
  
  for (const result of results) {
    if (result.overallResult === "loss" && result.winningBrand) {
      lossCounts[result.winningBrand] = (lossCounts[result.winningBrand] || 0) + 1;
    }
  }
  
  return Object.entries(lossCounts)
    .map(([competitor, losses]) => ({ competitor, losses }))
    .sort((a, b) => b.losses - a.losses)
    .slice(0, limit);
}

/**
 * Get queries lost to a specific competitor
 */
export function getQueriesLostToCompetitor(
  results: WinLossResult[],
  competitorName: string
): WinLossResult[] {
  return results.filter(r => 
    r.overallResult === "loss" && 
    r.winningBrand === competitorName
  );
}

/**
 * Generate competitor comparison summary
 */
export function generateCompetitorSummary(
  teardown: CompetitorTeardown,
  lostQueries: WinLossResult[]
): string {
  const advantages = teardown.advantages.slice(0, 3);
  
  return `${teardown.competitor} is winning ${lostQueries.length} queries against you. ` +
    `Key advantages: ${advantages.length > 0 ? advantages.join(', ') : 'Strong brand presence'}.`;
}
