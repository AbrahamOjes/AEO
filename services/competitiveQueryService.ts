/**
 * Competitive Query Generation Service
 * Automatically generates queries based on brand configuration
 */

import {
  BrandConfig,
  GeneratedQuery,
  QueryCategory,
  QuerySet
} from '../types/competitive';

// Generate unique ID
function generateId(): string {
  return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate all competitive queries based on brand configuration
 */
export function generateQueries(config: BrandConfig): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];
  
  // RECOMMENDATION QUERIES
  queries.push(...generateRecommendationQueries(config));
  
  // COMPARISON QUERIES
  queries.push(...generateComparisonQueries(config));
  
  // VALIDATION QUERIES
  queries.push(...generateValidationQueries(config));
  
  // FEATURE QUERIES
  queries.push(...generateFeatureQueries(config));
  
  return queries;
}

/**
 * Generate recommendation queries ("Best X for Y")
 */
function generateRecommendationQueries(config: BrandConfig): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];
  const competitorNames = config.competitors.map(c => c.name);
  
  // Basic category query
  queries.push({
    id: generateId(),
    text: `Best ${config.category}`,
    category: QueryCategory.RECOMMENDATION,
    intent: "Category exploration",
    competitorsMentioned: competitorNames
  });
  
  // Category + target customer
  if (config.targetCustomer) {
    queries.push({
      id: generateId(),
      text: `Best ${config.category} for ${config.targetCustomer}`,
      category: QueryCategory.RECOMMENDATION,
      intent: "Targeted solution search",
      competitorsMentioned: competitorNames
    });
  }
  
  // Category + primary use case
  if (config.primaryUseCase) {
    queries.push({
      id: generateId(),
      text: `Best ${config.category} for ${config.primaryUseCase}`,
      category: QueryCategory.RECOMMENDATION,
      intent: "Use case specific",
      competitorsMentioned: competitorNames
    });
    
    // Also as a direct question
    queries.push({
      id: generateId(),
      text: `Best way to ${config.primaryUseCase.toLowerCase()}`,
      category: QueryCategory.RECOMMENDATION,
      intent: "Use case search",
      competitorsMentioned: competitorNames
    });
  }
  
  // Geography variations
  for (const geo of config.geography) {
    queries.push({
      id: generateId(),
      text: `Best ${config.category} in ${geo}`,
      category: QueryCategory.RECOMMENDATION,
      intent: "Geography specific",
      competitorsMentioned: competitorNames
    });
    
    // Combine geography with use case
    if (config.primaryUseCase) {
      queries.push({
        id: generateId(),
        text: `Best way to ${config.primaryUseCase.toLowerCase()} in ${geo}`,
        category: QueryCategory.RECOMMENDATION,
        intent: "Geography + use case",
        competitorsMentioned: competitorNames
      });
    }
  }
  
  // Subcategory variations
  for (const subcat of config.subcategories) {
    queries.push({
      id: generateId(),
      text: `Best ${subcat}`,
      category: QueryCategory.RECOMMENDATION,
      intent: "Alternative category framing",
      competitorsMentioned: competitorNames
    });
    
    if (config.targetCustomer) {
      queries.push({
        id: generateId(),
        text: `Best ${subcat} for ${config.targetCustomer}`,
        category: QueryCategory.RECOMMENDATION,
        intent: "Subcategory + audience",
        competitorsMentioned: competitorNames
      });
    }
  }
  
  // "Alternative to" queries for primary competitors
  for (const competitor of config.competitors.filter(c => c.isPrimary)) {
    queries.push({
      id: generateId(),
      text: `Best alternative to ${competitor.name}`,
      category: QueryCategory.RECOMMENDATION,
      intent: "Competitor displacement",
      competitorsMentioned: [competitor.name]
    });
    
    queries.push({
      id: generateId(),
      text: `${competitor.name} alternatives`,
      category: QueryCategory.RECOMMENDATION,
      intent: "Competitor alternatives search",
      competitorsMentioned: [competitor.name]
    });
  }
  
  return queries;
}

/**
 * Generate comparison queries ("A vs B")
 */
function generateComparisonQueries(config: BrandConfig): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];
  
  for (const competitor of config.competitors) {
    // Brand vs Competitor
    queries.push({
      id: generateId(),
      text: `${config.brandName} vs ${competitor.name}`,
      category: QueryCategory.COMPARISON,
      intent: "Direct comparison",
      competitorsMentioned: [competitor.name]
    });
    
    // Reverse order (some users search this way)
    queries.push({
      id: generateId(),
      text: `${competitor.name} vs ${config.brandName}`,
      category: QueryCategory.COMPARISON,
      intent: "Direct comparison (reverse)",
      competitorsMentioned: [competitor.name]
    });
    
    // "or" variant
    queries.push({
      id: generateId(),
      text: `${config.brandName} or ${competitor.name}`,
      category: QueryCategory.COMPARISON,
      intent: "Choice comparison",
      competitorsMentioned: [competitor.name]
    });
  }
  
  // Multi-way comparison with top primary competitors
  const primaryCompetitors = config.competitors.filter(c => c.isPrimary);
  if (primaryCompetitors.length >= 2) {
    const topTwo = primaryCompetitors.slice(0, 2).map(c => c.name);
    
    queries.push({
      id: generateId(),
      text: `${config.brandName} vs ${topTwo.join(' vs ')}`,
      category: QueryCategory.COMPARISON,
      intent: "Multi-way comparison",
      competitorsMentioned: topTwo
    });
  }
  
  // Competitor vs competitor (to understand market positioning)
  if (primaryCompetitors.length >= 2) {
    queries.push({
      id: generateId(),
      text: `${primaryCompetitors[0].name} vs ${primaryCompetitors[1].name}`,
      category: QueryCategory.COMPARISON,
      intent: "Competitor landscape",
      competitorsMentioned: [primaryCompetitors[0].name, primaryCompetitors[1].name]
    });
  }
  
  return queries;
}

/**
 * Generate validation queries ("Is X legit?")
 */
function generateValidationQueries(config: BrandConfig): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];
  
  const validationPatterns = [
    { suffix: "legit", intent: "Trust verification" },
    { suffix: "safe", intent: "Safety check" },
    { suffix: "reliable", intent: "Reliability check" },
    { suffix: "trustworthy", intent: "Trust assessment" },
    { suffix: "good", intent: "Quality check" },
    { suffix: "worth it", intent: "Value assessment" }
  ];
  
  for (const pattern of validationPatterns) {
    queries.push({
      id: generateId(),
      text: `Is ${config.brandName} ${pattern.suffix}`,
      category: QueryCategory.VALIDATION,
      intent: pattern.intent,
      competitorsMentioned: []
    });
  }
  
  // Review queries
  queries.push({
    id: generateId(),
    text: `${config.brandName} reviews`,
    category: QueryCategory.VALIDATION,
    intent: "Social proof",
    competitorsMentioned: []
  });
  
  queries.push({
    id: generateId(),
    text: `${config.brandName} review`,
    category: QueryCategory.VALIDATION,
    intent: "Social proof (singular)",
    competitorsMentioned: []
  });
  
  // Negative validation (risk assessment)
  queries.push({
    id: generateId(),
    text: `${config.brandName} complaints`,
    category: QueryCategory.VALIDATION,
    intent: "Risk assessment",
    competitorsMentioned: []
  });
  
  queries.push({
    id: generateId(),
    text: `${config.brandName} problems`,
    category: QueryCategory.VALIDATION,
    intent: "Issue discovery",
    competitorsMentioned: []
  });
  
  // "What is" query
  queries.push({
    id: generateId(),
    text: `What is ${config.brandName}`,
    category: QueryCategory.VALIDATION,
    intent: "Brand discovery",
    competitorsMentioned: []
  });
  
  return queries;
}

/**
 * Generate feature-specific queries
 */
function generateFeatureQueries(config: BrandConfig): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];
  const competitorNames = config.competitors.map(c => c.name);
  
  // Common feature patterns
  const featurePatterns = [
    "lowest fees",
    "cheapest",
    "fastest",
    "easiest to use",
    "most secure"
  ];
  
  for (const feature of featurePatterns) {
    queries.push({
      id: generateId(),
      text: `${config.category} with ${feature}`,
      category: QueryCategory.FEATURE,
      intent: "Feature-specific search",
      competitorsMentioned: competitorNames
    });
  }
  
  // Primary use case as direct query
  if (config.primaryUseCase) {
    queries.push({
      id: generateId(),
      text: config.primaryUseCase,
      category: QueryCategory.FEATURE,
      intent: "Direct use case search",
      competitorsMentioned: competitorNames
    });
    
    // "How to" variant
    queries.push({
      id: generateId(),
      text: `How to ${config.primaryUseCase.toLowerCase()}`,
      category: QueryCategory.FEATURE,
      intent: "How-to search",
      competitorsMentioned: competitorNames
    });
  }
  
  // Target customer + category
  if (config.targetCustomer) {
    queries.push({
      id: generateId(),
      text: `${config.category} for ${config.targetCustomer}`,
      category: QueryCategory.FEATURE,
      intent: "Audience-specific feature",
      competitorsMentioned: competitorNames
    });
  }
  
  return queries;
}

/**
 * Group queries by category
 */
export function groupQueriesByCategory(queries: GeneratedQuery[]): QuerySet[] {
  const categories = [
    QueryCategory.RECOMMENDATION,
    QueryCategory.COMPARISON,
    QueryCategory.VALIDATION,
    QueryCategory.FEATURE
  ];
  
  return categories.map(category => ({
    category,
    queries: queries.filter(q => q.category === category)
  }));
}

/**
 * Get query count summary
 */
export function getQuerySummary(queries: GeneratedQuery[]): Record<QueryCategory, number> {
  return {
    [QueryCategory.RECOMMENDATION]: queries.filter(q => q.category === QueryCategory.RECOMMENDATION).length,
    [QueryCategory.COMPARISON]: queries.filter(q => q.category === QueryCategory.COMPARISON).length,
    [QueryCategory.VALIDATION]: queries.filter(q => q.category === QueryCategory.VALIDATION).length,
    [QueryCategory.FEATURE]: queries.filter(q => q.category === QueryCategory.FEATURE).length
  };
}

/**
 * Filter queries by category
 */
export function filterQueriesByCategory(
  queries: GeneratedQuery[],
  category: QueryCategory
): GeneratedQuery[] {
  return queries.filter(q => q.category === category);
}

/**
 * Get queries mentioning a specific competitor
 */
export function getQueriesForCompetitor(
  queries: GeneratedQuery[],
  competitorName: string
): GeneratedQuery[] {
  return queries.filter(q => 
    q.competitorsMentioned.includes(competitorName) ||
    q.text.toLowerCase().includes(competitorName.toLowerCase())
  );
}

/**
 * Deduplicate similar queries
 */
export function deduplicateQueries(queries: GeneratedQuery[]): GeneratedQuery[] {
  const seen = new Set<string>();
  return queries.filter(q => {
    const normalized = q.text.toLowerCase().trim();
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

/**
 * Limit queries to a maximum count per category
 */
export function limitQueriesPerCategory(
  queries: GeneratedQuery[],
  maxPerCategory: number
): GeneratedQuery[] {
  const grouped = groupQueriesByCategory(queries);
  return grouped.flatMap(group => group.queries.slice(0, maxPerCategory));
}
