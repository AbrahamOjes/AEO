/**
 * Win/Loss Analysis Service
 * Calculates win/loss results and generates competitive reports
 */

import {
  BrandConfig,
  GeneratedQuery,
  QueryExecution,
  BrandMention,
  MentionPosition,
  WinLossResult,
  WinLossOutcome,
  ModelResult,
  CompetitiveReport,
  CategoryStats,
  ModelStats,
  CompetitorStats,
  QueryCategory,
  AIModelType
} from '../types/competitive';

// Generate unique ID
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse AI response to extract brand mentions using LLM
 */
export async function parseResponseForBrands(
  response: string,
  brandConfig: BrandConfig,
  parseWithLLM: (prompt: string) => Promise<string>
): Promise<BrandMention[]> {
  const allBrands = [brandConfig.brandName, ...brandConfig.competitors.map(c => c.name)];
  
  const parsePrompt = `Analyze this AI response for brand/product mentions.

RESPONSE TO ANALYZE:
"""
${response}
"""

BRANDS TO LOOK FOR:
${allBrands.map(b => `- ${b}`).join('\n')}

For each brand mentioned, extract:
1. brand: The brand name (exactly as listed above)
2. position: 
   - "primary" = recommended first or most strongly
   - "secondary" = mentioned as a good alternative
   - "tertiary" = briefly mentioned
   - "mentioned" = named but not recommended
   - "none" = not mentioned at all
3. sentiment: "positive", "neutral", or "negative"
4. context: The exact sentence where the brand is mentioned (empty if not mentioned)

Return JSON array:
[
  {
    "brand": "BrandName",
    "position": "primary|secondary|tertiary|mentioned|none",
    "sentiment": "positive|neutral|negative",
    "context": "exact quote from response"
  }
]

Include an entry for EVERY brand in the list, even if position is "none".
Return ONLY valid JSON, no other text.`;

  try {
    const parseResponse = await parseWithLLM(parsePrompt);
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = parseResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((m: any) => ({
        brand: m.brand,
        position: m.position as MentionPosition,
        sentiment: m.sentiment as "positive" | "neutral" | "negative",
        context: m.context || "",
        citationUrl: null
      }));
    }
  } catch (e) {
    console.error("Failed to parse response with LLM, using fallback:", e);
  }
  
  // Fallback: simple string matching
  return fallbackBrandParsing(response, brandConfig);
}

/**
 * Fallback parsing using simple string matching
 */
function fallbackBrandParsing(
  response: string,
  brandConfig: BrandConfig
): BrandMention[] {
  const mentions: BrandMention[] = [];
  const responseLower = response.toLowerCase();
  const allBrands = [brandConfig.brandName, ...brandConfig.competitors.map(c => c.name)];
  
  // Track positions to determine primary/secondary
  const mentionedBrands: { brand: string; index: number }[] = [];
  
  for (const brand of allBrands) {
    const index = responseLower.indexOf(brand.toLowerCase());
    if (index !== -1) {
      mentionedBrands.push({ brand, index });
    }
  }
  
  // Sort by position in response
  mentionedBrands.sort((a, b) => a.index - b.index);
  
  for (const brand of allBrands) {
    const mentioned = responseLower.includes(brand.toLowerCase());
    const positionIndex = mentionedBrands.findIndex(m => m.brand === brand);
    
    let position: MentionPosition = "none";
    if (mentioned) {
      if (positionIndex === 0) position = "primary";
      else if (positionIndex === 1) position = "secondary";
      else if (positionIndex === 2) position = "tertiary";
      else position = "mentioned";
    }
    
    mentions.push({
      brand,
      position,
      sentiment: mentioned ? "neutral" : "neutral",
      context: mentioned ? extractContext(response, brand) : "",
      citationUrl: null
    });
  }
  
  return mentions;
}

/**
 * Extract context sentence for a brand mention
 */
function extractContext(response: string, brand: string): string {
  const sentences = response.split(/[.!?]+/);
  const relevantSentence = sentences.find(s => 
    s.toLowerCase().includes(brand.toLowerCase())
  );
  return relevantSentence?.trim().substring(0, 200) || "";
}

/**
 * Determine the winner of a query based on brand mentions
 */
export function determineWinner(mentions: BrandMention[]): string | null {
  // Find primary recommendation
  const primary = mentions.find(m => m.position === "primary");
  if (primary) return primary.brand;
  
  // If no clear primary, find most positive secondary
  const secondaries = mentions.filter(m => m.position === "secondary");
  if (secondaries.length === 1) return secondaries[0].brand;
  
  const positiveSecondary = secondaries.find(m => m.sentiment === "positive");
  if (positiveSecondary) return positiveSecondary.brand;
  
  // No clear winner
  return null;
}

/**
 * Calculate overall sentiment from brand mentions
 */
export function calculateOverallSentiment(
  mentions: BrandMention[],
  userBrand: string
): "positive" | "neutral" | "negative" | null {
  const userMention = mentions.find(m => m.brand === userBrand);
  return userMention?.sentiment || null;
}

/**
 * Calculate win/loss result for a single query across all models
 */
export function calculateWinLoss(
  query: GeneratedQuery,
  executions: QueryExecution[],
  userBrand: string
): WinLossResult {
  const modelResults: WinLossResult["modelResults"] = {};
  
  for (const exec of executions) {
    const userMention = exec.brandsMentioned.find(m => m.brand === userBrand);
    const competitorPositions: Record<string, MentionPosition> = {};
    
    for (const mention of exec.brandsMentioned) {
      if (mention.brand !== userBrand) {
        competitorPositions[mention.brand] = mention.position;
      }
    }
    
    modelResults[exec.model] = {
      winner: exec.winner,
      userBrandPosition: userMention?.position || "none",
      userBrandSentiment: userMention?.sentiment || null,
      competitorPositions
    };
  }
  
  // Determine overall result
  const modelResultsArray = Object.values(modelResults).filter(Boolean) as ModelResult[];
  const wins = modelResultsArray.filter(r => r.winner === userBrand).length;
  const total = modelResultsArray.length;
  
  let overallResult: WinLossOutcome;
  if (total === 0) {
    overallResult = "unclear";
  } else if (wins === total) {
    overallResult = "win";
  } else if (wins === 0) {
    overallResult = "loss";
  } else {
    overallResult = "partial";
  }
  
  // Determine overall winner
  const winnerCounts: Record<string, number> = {};
  for (const result of modelResultsArray) {
    if (result.winner) {
      winnerCounts[result.winner] = (winnerCounts[result.winner] || 0) + 1;
    }
  }
  
  const sortedWinners = Object.entries(winnerCounts)
    .sort((a, b) => b[1] - a[1]);
  
  return {
    id: generateId(),
    query,
    executions,
    overallResult,
    winningBrand: sortedWinners[0]?.[0] || null,
    modelResults
  };
}

/**
 * Calculate category statistics
 */
function calculateCategoryStats(
  results: WinLossResult[],
  category: QueryCategory
): CategoryStats {
  const categoryResults = results.filter(r => r.query.category === category);
  const wins = categoryResults.filter(r => r.overallResult === "win").length;
  const losses = categoryResults.filter(r => r.overallResult === "loss").length;
  const partial = categoryResults.filter(r => r.overallResult === "partial").length;
  const total = categoryResults.length;
  
  return {
    total,
    wins,
    losses,
    partial,
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0
  };
}

/**
 * Calculate model statistics
 */
function calculateModelStats(
  results: WinLossResult[],
  model: AIModelType,
  userBrand: string
): ModelStats {
  let wins = 0;
  let losses = 0;
  let totalPosition = 0;
  let positionCount = 0;
  
  for (const result of results) {
    const modelResult = result.modelResults[model];
    if (!modelResult) continue;
    
    if (modelResult.winner === userBrand) {
      wins++;
    } else if (modelResult.winner && modelResult.winner !== userBrand) {
      losses++;
    }
    
    // Calculate position score
    const positionScore = getPositionScore(modelResult.userBrandPosition);
    totalPosition += positionScore;
    positionCount++;
  }
  
  const total = wins + losses;
  
  return {
    total: results.length,
    wins,
    losses,
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    avgUserPosition: positionCount > 0 ? totalPosition / positionCount : 5
  };
}

/**
 * Convert position to numeric score
 */
function getPositionScore(position: MentionPosition): number {
  switch (position) {
    case "primary": return 1;
    case "secondary": return 2;
    case "tertiary": return 3;
    case "mentioned": return 4;
    case "none": return 5;
    default: return 5;
  }
}

/**
 * Calculate competitor statistics
 */
function calculateCompetitorStats(
  results: WinLossResult[],
  competitorName: string,
  userBrand: string
): CompetitorStats {
  // Filter to queries where this competitor is relevant
  const relevantResults = results.filter(r => 
    r.query.competitorsMentioned.includes(competitorName) ||
    r.winningBrand === competitorName
  );
  
  let winsAgainst = 0;
  let lossesAgainst = 0;
  
  for (const result of relevantResults) {
    if (result.overallResult === "win") {
      winsAgainst++;
    } else if (result.overallResult === "loss" && result.winningBrand === competitorName) {
      lossesAgainst++;
    }
  }
  
  const total = winsAgainst + lossesAgainst;
  
  return {
    competitor: competitorName,
    queriesAgainst: relevantResults.length,
    winsAgainst,
    lossesAgainst,
    winRate: total > 0 ? Math.round((winsAgainst / total) * 100) : 0
  };
}

/**
 * Calculate impact score for sorting key queries
 */
function getImpactScore(result: WinLossResult, userBrand: string): number {
  let score = 0;
  
  // Base score from result
  if (result.overallResult === "win") score += 10;
  else if (result.overallResult === "loss") score -= 10;
  else if (result.overallResult === "partial") score += 2;
  
  // Bonus for recommendation queries (higher value)
  if (result.query.category === QueryCategory.RECOMMENDATION) score *= 1.5;
  if (result.query.category === QueryCategory.COMPARISON) score *= 1.3;
  
  // Bonus for consistent results across models
  const modelResults = Object.values(result.modelResults).filter(Boolean) as ModelResult[];
  const unanimousWin = modelResults.every(r => r.winner === userBrand);
  const unanimousLoss = modelResults.every(r => r.winner && r.winner !== userBrand);
  
  if (unanimousWin) score += 5;
  if (unanimousLoss) score -= 5;
  
  return score;
}

/**
 * Generate comprehensive competitive report
 */
export function generateCompetitiveReport(
  brandConfig: BrandConfig,
  results: WinLossResult[]
): CompetitiveReport {
  const userBrand = brandConfig.brandName;
  
  const wins = results.filter(r => r.overallResult === "win").length;
  const losses = results.filter(r => r.overallResult === "loss").length;
  const partial = results.filter(r => r.overallResult === "partial").length;
  
  // Category breakdown
  const categoryBreakdown = {
    recommendation: calculateCategoryStats(results, QueryCategory.RECOMMENDATION),
    comparison: calculateCategoryStats(results, QueryCategory.COMPARISON),
    validation: calculateCategoryStats(results, QueryCategory.VALIDATION),
    feature: calculateCategoryStats(results, QueryCategory.FEATURE)
  };
  
  // Competitor breakdown
  const competitorBreakdown: Record<string, CompetitorStats> = {};
  for (const competitor of brandConfig.competitors) {
    competitorBreakdown[competitor.name] = calculateCompetitorStats(
      results,
      competitor.name,
      userBrand
    );
  }
  
  // Model breakdown
  const modelBreakdown = {
    chatgpt: calculateModelStats(results, "chatgpt", userBrand),
    perplexity: calculateModelStats(results, "perplexity", userBrand),
    gemini: calculateModelStats(results, "gemini", userBrand)
  };
  
  // Sort for key queries
  const sortedByImpact = [...results].sort((a, b) => {
    return getImpactScore(b, userBrand) - getImpactScore(a, userBrand);
  });
  
  const biggestWins = sortedByImpact
    .filter(r => r.overallResult === "win")
    .slice(0, 5);
  
  const biggestLosses = [...results]
    .filter(r => r.overallResult === "loss")
    .sort((a, b) => getImpactScore(a, userBrand) - getImpactScore(b, userBrand))
    .slice(0, 5);
  
  const closeCalls = sortedByImpact
    .filter(r => r.overallResult === "partial")
    .slice(0, 5);
  
  return {
    id: generateId(),
    brandId: brandConfig.id,
    createdAt: new Date().toISOString(),
    totalQueries: results.length,
    wins,
    losses,
    partial,
    winRate: results.length > 0 ? Math.round((wins / results.length) * 100) : 0,
    categoryBreakdown,
    competitorBreakdown,
    modelBreakdown,
    biggestWins,
    biggestLosses,
    closeCalls
  };
}

/**
 * Get win/loss summary text
 */
export function getWinLossSummary(report: CompetitiveReport, brandName: string): string {
  const topCompetitor = Object.entries(report.competitorBreakdown)
    .sort((a, b) => b[1].lossesAgainst - a[1].lossesAgainst)[0];
  
  if (report.winRate >= 70) {
    return `${brandName} is winning ${report.winRate}% of AI recommendation queries. Strong competitive position.`;
  } else if (report.winRate >= 40) {
    return `${brandName} is winning ${report.winRate}% of queries. ${topCompetitor ? `Losing most to ${topCompetitor[0]}.` : ''} Room for improvement.`;
  } else {
    return `${brandName} is losing ${report.losses} out of ${report.totalQueries} AI queries${topCompetitor ? ` to ${topCompetitor[0]}` : ''}. Significant optimization needed.`;
  }
}

/**
 * Get position display text
 */
export function getPositionDisplay(position: MentionPosition): string {
  switch (position) {
    case "primary": return "1st";
    case "secondary": return "2nd";
    case "tertiary": return "3rd";
    case "mentioned": return "Mentioned";
    case "none": return "—";
    default: return "—";
  }
}

/**
 * Get result badge color
 */
export function getResultColor(result: WinLossOutcome): string {
  switch (result) {
    case "win": return "emerald";
    case "loss": return "rose";
    case "partial": return "amber";
    case "unclear": return "gray";
    default: return "gray";
  }
}

/**
 * Get result emoji
 */
export function getResultEmoji(result: WinLossOutcome): string {
  switch (result) {
    case "win": return "✅";
    case "loss": return "❌";
    case "partial": return "⚠️";
    case "unclear": return "❓";
    default: return "❓";
  }
}
