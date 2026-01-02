
import { AIModel, AnalysisResult, MentionPosition, Sentiment, CompetitorIntel, AEOPlaybook, QueryResult } from "../types";
import { 
  fetchOpenRouterResponse, 
  isOpenRouterConfigured, 
  analyzeResponseViaOpenRouter,
  getCompetitorIntelViaOpenRouter,
  generatePlaybookViaOpenRouter
} from './openrouterService';

// All LLM calls now go through OpenRouter

export const fetchAIResponse = async (model: AIModel, query: string, useDeepThinking: boolean = false): Promise<string> => {
  const fullQuery = `${query} Provide a direct answer with specific product/service recommendations. Include the names of companies or products you recommend and briefly explain why.`;
  
  if (!isOpenRouterConfigured()) {
    throw new Error('OpenRouter API key is required. Please set VITE_OPENROUTER_API_KEY in your .env file.');
  }
  
  return await fetchOpenRouterResponse(model, fullQuery);
};

export const analyzeResponse = async (brandName: string, aiResponse: string): Promise<AnalysisResult> => {
  return analyzeResponseViaOpenRouter(brandName, aiResponse);
};

export const getCompetitorMarketIntel = async (competitorName: string, competitorUrl?: string): Promise<CompetitorIntel> => {
  return getCompetitorIntelViaOpenRouter(competitorName, competitorUrl);
};

export const generateOptimizationPlaybook = async (
  brandName: string, 
  results: QueryResult[], 
  competitors: CompetitorIntel[]
): Promise<AEOPlaybook> => {
  return generatePlaybookViaOpenRouter(brandName, results, competitors);
};
