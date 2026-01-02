/**
 * Competitive Analysis Service
 * Main orchestrator for running competitive AI win/loss analysis
 */

import {
  BrandConfig,
  Competitor,
  GeneratedQuery,
  QueryExecution,
  AIModelType,
  WinLossResult,
  CompetitiveReport,
  CompetitorTeardown,
  QueryGap,
  CompetitiveActionPlan
} from '../types/competitive';

import { generateQueries, deduplicateQueries, limitQueriesPerCategory } from './competitiveQueryService';
import { parseResponseForBrands, determineWinner, calculateWinLoss, generateCompetitiveReport } from './winLossAnalysisService';
import { analyzeCompetitor, analyzeQueryGaps, getQueriesLostToCompetitor } from './competitorTeardownService';
import { generateCompetitiveActionPlan } from './competitiveActionPlanService';

// Generate unique ID
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Progress callback type
export type ProgressCallback = (progress: {
  stage: 'generating' | 'executing' | 'analyzing' | 'complete';
  currentQuery?: number;
  totalQueries?: number;
  currentModel?: AIModelType;
  message: string;
}) => void;

/**
 * Create a new brand configuration
 */
export function createBrandConfig(
  brandName: string,
  websiteUrl: string,
  category: string,
  options?: {
    subcategories?: string[];
    targetCustomer?: string;
    primaryUseCase?: string;
    geography?: string[];
    competitors?: Competitor[];
  }
): BrandConfig {
  return {
    id: `brand_${generateId()}`,
    brandName,
    websiteUrl: websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`,
    category,
    subcategories: options?.subcategories || [],
    targetCustomer: options?.targetCustomer || '',
    primaryUseCase: options?.primaryUseCase || '',
    geography: options?.geography || [],
    competitors: options?.competitors || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Add a competitor to brand config
 */
export function addCompetitor(
  config: BrandConfig,
  name: string,
  websiteUrl: string,
  isPrimary: boolean = true
): BrandConfig {
  const competitor: Competitor = {
    id: `comp_${generateId()}`,
    name,
    websiteUrl: websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`,
    isPrimary
  };
  
  return {
    ...config,
    competitors: [...config.competitors, competitor],
    updatedAt: new Date().toISOString()
  };
}

/**
 * Remove a competitor from brand config
 */
export function removeCompetitor(config: BrandConfig, competitorId: string): BrandConfig {
  return {
    ...config,
    competitors: config.competitors.filter(c => c.id !== competitorId),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Execute a single query against one AI model
 */
async function executeQueryOnModel(
  query: GeneratedQuery,
  model: AIModelType,
  brandConfig: BrandConfig,
  queryAI: (model: AIModelType, prompt: string) => Promise<string>,
  parseWithLLM: (prompt: string) => Promise<string>
): Promise<QueryExecution> {
  const startTime = Date.now();
  
  // Build the query prompt
  const prompt = `${query.text}

Please provide a direct, helpful answer with specific recommendations if applicable. Include the names of specific products, services, or companies you recommend and briefly explain why you recommend them.`;

  // Execute query
  const rawResponse = await queryAI(model, prompt);
  const latencyMs = Date.now() - startTime;
  
  // Parse response for brand mentions
  const brandsMentioned = await parseResponseForBrands(rawResponse, brandConfig, parseWithLLM);
  
  // Determine winner
  const winner = determineWinner(brandsMentioned);
  
  // Get user brand sentiment
  const userMention = brandsMentioned.find(m => m.brand === brandConfig.brandName);
  
  return {
    id: `exec_${generateId()}`,
    queryId: query.id,
    queryText: query.text,
    model,
    rawResponse,
    brandsMentioned,
    winner,
    sentiment: userMention?.sentiment || null,
    executedAt: new Date().toISOString(),
    latencyMs
  };
}

/**
 * Run full competitive analysis
 */
export async function runCompetitiveAnalysis(
  brandConfig: BrandConfig,
  queryAI: (model: AIModelType, prompt: string) => Promise<string>,
  parseWithLLM: (prompt: string) => Promise<string>,
  options?: {
    maxQueriesPerCategory?: number;
    models?: AIModelType[];
    onProgress?: ProgressCallback;
  }
): Promise<{
  report: CompetitiveReport;
  results: WinLossResult[];
  gaps: QueryGap[];
  actionPlan: CompetitiveActionPlan;
  teardowns: CompetitorTeardown[];
}> {
  const onProgress = options?.onProgress || (() => {});
  const models = options?.models || ['chatgpt', 'perplexity', 'gemini'];
  const maxPerCategory = options?.maxQueriesPerCategory || 10;
  
  // Stage 1: Generate queries
  onProgress({
    stage: 'generating',
    message: 'Generating competitive queries...'
  });
  
  let queries = generateQueries(brandConfig);
  queries = deduplicateQueries(queries);
  queries = limitQueriesPerCategory(queries, maxPerCategory);
  
  // Stage 2: Execute queries across all models
  const executions: QueryExecution[] = [];
  const totalExecutions = queries.length * models.length;
  let currentExecution = 0;
  
  for (const query of queries) {
    const queryExecutions: QueryExecution[] = [];
    
    for (const model of models) {
      currentExecution++;
      onProgress({
        stage: 'executing',
        currentQuery: currentExecution,
        totalQueries: totalExecutions,
        currentModel: model,
        message: `Querying ${model}: "${query.text.substring(0, 50)}..."`
      });
      
      try {
        const execution = await executeQueryOnModel(
          query,
          model,
          brandConfig,
          queryAI,
          parseWithLLM
        );
        queryExecutions.push(execution);
        executions.push(execution);
      } catch (error) {
        console.error(`Error executing query on ${model}:`, error);
        // Continue with other models
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Stage 3: Calculate win/loss results
  onProgress({
    stage: 'analyzing',
    message: 'Analyzing win/loss results...'
  });
  
  const results: WinLossResult[] = [];
  for (const query of queries) {
    const queryExecutions = executions.filter(e => e.queryId === query.id);
    if (queryExecutions.length > 0) {
      const result = calculateWinLoss(query, queryExecutions, brandConfig.brandName);
      results.push(result);
    }
  }
  
  // Stage 4: Generate report
  const report = generateCompetitiveReport(brandConfig, results);
  
  // Stage 5: Analyze competitors
  onProgress({
    stage: 'analyzing',
    message: 'Analyzing competitor content...'
  });
  
  const teardowns: CompetitorTeardown[] = [];
  for (const competitor of brandConfig.competitors) {
    const lostToCompetitor = getQueriesLostToCompetitor(results, competitor.name);
    const teardown = await analyzeCompetitor(competitor, brandConfig, lostToCompetitor);
    teardowns.push(teardown);
  }
  
  // Stage 6: Identify gaps
  const gaps = analyzeQueryGaps(results, teardowns, brandConfig);
  
  // Stage 7: Generate action plan
  onProgress({
    stage: 'analyzing',
    message: 'Generating action plan...'
  });
  
  const actionPlan = generateCompetitiveActionPlan(report, gaps, teardowns, brandConfig);
  
  // Complete
  onProgress({
    stage: 'complete',
    message: `Analysis complete. Win rate: ${report.winRate}%`
  });
  
  return {
    report,
    results,
    gaps,
    actionPlan,
    teardowns
  };
}

/**
 * Save analysis to localStorage
 */
export function saveAnalysis(
  brandConfig: BrandConfig,
  report: CompetitiveReport,
  results: WinLossResult[],
  actionPlan: CompetitiveActionPlan
): void {
  const key = `aeo_competitive_${brandConfig.id}`;
  const data = {
    brandConfig,
    report,
    results,
    actionPlan,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(key, JSON.stringify(data));
  
  // Also save to list of analyses
  const listKey = 'aeo_competitive_analyses';
  const list = JSON.parse(localStorage.getItem(listKey) || '[]');
  const existingIndex = list.findIndex((item: any) => item.brandId === brandConfig.id);
  
  const listItem = {
    brandId: brandConfig.id,
    brandName: brandConfig.brandName,
    reportId: report.id,
    winRate: report.winRate,
    totalQueries: report.totalQueries,
    createdAt: report.createdAt
  };
  
  if (existingIndex >= 0) {
    list[existingIndex] = listItem;
  } else {
    list.push(listItem);
  }
  
  localStorage.setItem(listKey, JSON.stringify(list));
}

/**
 * Load analysis from localStorage
 */
export function loadAnalysis(brandId: string): {
  brandConfig: BrandConfig;
  report: CompetitiveReport;
  results: WinLossResult[];
  actionPlan: CompetitiveActionPlan;
} | null {
  const key = `aeo_competitive_${brandId}`;
  const data = localStorage.getItem(key);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Get list of saved analyses
 */
export function getSavedAnalyses(): {
  brandId: string;
  brandName: string;
  reportId: string;
  winRate: number;
  totalQueries: number;
  createdAt: string;
}[] {
  const listKey = 'aeo_competitive_analyses';
  try {
    return JSON.parse(localStorage.getItem(listKey) || '[]');
  } catch {
    return [];
  }
}

/**
 * Delete saved analysis
 */
export function deleteAnalysis(brandId: string): void {
  const key = `aeo_competitive_${brandId}`;
  localStorage.removeItem(key);
  
  const listKey = 'aeo_competitive_analyses';
  const list = JSON.parse(localStorage.getItem(listKey) || '[]');
  const filtered = list.filter((item: any) => item.brandId !== brandId);
  localStorage.setItem(listKey, JSON.stringify(filtered));
}

/**
 * Export analysis as JSON
 */
export function exportAnalysisAsJSON(
  brandConfig: BrandConfig,
  report: CompetitiveReport,
  results: WinLossResult[],
  actionPlan: CompetitiveActionPlan
): string {
  return JSON.stringify({
    brandConfig,
    report,
    results,
    actionPlan,
    exportedAt: new Date().toISOString()
  }, null, 2);
}
