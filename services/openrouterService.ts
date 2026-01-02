import { AIModel, MentionPosition, Sentiment, AnalysisResult, CompetitorIntel, AEOPlaybook, QueryResult } from '../types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Model mappings for OpenRouter
const MODEL_MAP: Record<AIModel, string> = {
  [AIModel.ChatGPT]: 'openai/gpt-4-turbo-preview',
  [AIModel.Perplexity]: 'perplexity/sonar-pro',
  [AIModel.Gemini]: 'google/gemini-2.0-flash-001',
};

// Fast model for analysis tasks
const ANALYSIS_MODEL = 'google/gemini-2.0-flash-001';
const PRO_MODEL = 'google/gemini-2.5-flash';

const SYSTEM_PROMPTS: Record<AIModel, string> = {
  [AIModel.ChatGPT]: 'You are a helpful AI assistant like ChatGPT. Provide direct, helpful answers with specific brand and product recommendations. Include the names of companies or products you recommend and briefly explain why.',
  [AIModel.Perplexity]: 'You are a research-focused AI assistant like Perplexity. Provide answers grounded in real-world data with citations when possible. Include specific brand and product recommendations with explanations.',
  [AIModel.Gemini]: 'You are Google Gemini. Provide creative and structured answers with diverse product recommendations. Include the names of companies or products you recommend and briefly explain why.',
};

// Read API key from environment variable
const getOpenRouterApiKey = (): string | undefined => {
  return import.meta.env.VITE_OPENROUTER_API_KEY || undefined;
};

export const isOpenRouterConfigured = (): boolean => !!getOpenRouterApiKey();

// Generic OpenRouter call
const callOpenRouter = async (
  model: string,
  systemPrompt: string,
  userPrompt: string,
  jsonMode: boolean = false
): Promise<string> => {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AEO Vision',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response generated.';
};

export const fetchOpenRouterResponse = async (
  model: AIModel,
  query: string
): Promise<string> => {
  const openRouterModel = MODEL_MAP[model];
  const systemPrompt = SYSTEM_PROMPTS[model];
  console.log(`[OpenRouter] Fetching ${model} response using ${openRouterModel}`);
  const result = await callOpenRouter(openRouterModel, systemPrompt, query);
  console.log(`[OpenRouter] ${model} response:`, result.substring(0, 150) + '...');
  return result;
};

// Smart brand analysis and query generation
export interface BrandAnalysis {
  industry: string;
  category: string;
  description: string;
  competitors: string[];
  queries: string[];
}

export const analyzeBrandAndGenerateQueries = async (
  brandName: string,
  brandUrl?: string
): Promise<BrandAnalysis> => {
  const systemPrompt = `You are a brand research expert and AEO (Answer Engine Optimization) strategist. Analyze brands and generate strategic queries to test their visibility in AI assistants. Always respond with valid JSON only.`;
  
  const userPrompt = `Analyze the brand "${brandName}"${brandUrl ? ` (website: ${brandUrl})` : ''} and generate strategic queries for AEO analysis.

Based on your knowledge of this brand, provide:
1. The industry they operate in
2. Their specific product/service category
3. A brief description of what they do
4. Their top 3-5 competitors
5. 15 strategic queries that would test this brand's visibility in AI assistants

The queries should cover:
- Direct brand queries ("Is [brand] good?", "What is [brand]?")
- Comparison queries ("[brand] vs [competitor]")
- Category queries ("Best [category] brands", "Top [category] companies")
- Use case queries ("Best [product] for [use case]")
- Reputation queries ("[brand] reviews", "Is [brand] legit?")
- Feature queries ("Does [brand] have [feature]?")
- Price/value queries ("[brand] pricing", "Is [brand] worth it?")

Return JSON with this exact structure:
{
  "industry": "string (e.g., 'E-commerce / Retail', 'SaaS / Software')",
  "category": "string (e.g., 'Fast Fashion', 'CRM Software')",
  "description": "string (1-2 sentence description of the brand)",
  "competitors": ["competitor1", "competitor2", "competitor3"],
  "queries": ["query1", "query2", ... up to 15 queries]
}`;

  try {
    console.log('[OpenRouter] Analyzing brand:', brandName);
    const result = await callOpenRouter(ANALYSIS_MODEL, systemPrompt, userPrompt, true);
    console.log('[OpenRouter] Brand analysis result:', result);
    const data = JSON.parse(result);
    
    return {
      industry: data.industry || 'Custom',
      category: data.category || brandName,
      description: data.description || '',
      competitors: data.competitors || [],
      queries: data.queries || [],
    };
  } catch (err) {
    console.error('[OpenRouter] Error analyzing brand:', err);
    // Fallback to generic queries
    return {
      industry: 'Custom',
      category: brandName,
      description: '',
      competitors: [],
      queries: [
        `What is ${brandName}?`,
        `Is ${brandName} good?`,
        `${brandName} reviews`,
        `Is ${brandName} legit?`,
        `${brandName} alternatives`,
        `Best alternatives to ${brandName}`,
        `${brandName} vs competitors`,
        `Is ${brandName} worth it?`,
        `${brandName} pricing`,
        `${brandName} pros and cons`,
      ],
    };
  }
};

// Analyze AI response for brand mentions
export const analyzeResponseViaOpenRouter = async (
  brandName: string,
  aiResponse: string
): Promise<AnalysisResult> => {
  const systemPrompt = 'You are an analysis assistant. Always respond with valid JSON only, no markdown.';
  const userPrompt = `Analyze this AI response for mentions of "${brandName}":

Response to analyze:
"${aiResponse}"

Return JSON with these exact fields:
{
  "mentioned": boolean (true if brand is mentioned),
  "position": "primary" | "secondary" | "tertiary" | "none" (how prominently featured),
  "sentiment": "positive" | "neutral" | "negative",
  "competitors_mentioned": ["array", "of", "competitor", "names"],
  "citation_url": "url string or null"
}`;

  try {
    console.log('[OpenRouter] Analyzing response for brand:', brandName);
    const result = await callOpenRouter(ANALYSIS_MODEL, systemPrompt, userPrompt, true);
    console.log('[OpenRouter] Raw analysis result:', result);
    const data = JSON.parse(result);
    console.log('[OpenRouter] Parsed analysis:', data);
    return {
      mentioned: data.mentioned ?? false,
      position: (data.position as MentionPosition) || MentionPosition.None,
      sentiment: (data.sentiment as Sentiment) || Sentiment.Neutral,
      competitors_mentioned: data.competitors_mentioned || [],
      citation_url: data.citation_url || null,
      raw_response: aiResponse,
    };
  } catch (err) {
    console.error('[OpenRouter] Error parsing analysis:', err);
    return {
      mentioned: false,
      position: MentionPosition.None,
      sentiment: Sentiment.Neutral,
      competitors_mentioned: [],
      citation_url: null,
      raw_response: aiResponse,
    };
  }
};

// Get competitor market intelligence
export const getCompetitorIntelViaOpenRouter = async (
  competitorName: string,
  competitorUrl?: string
): Promise<CompetitorIntel> => {
  const systemPrompt = 'You are a business intelligence analyst. Always respond with valid JSON only.';
  const urlContext = competitorUrl ? `Target Website: ${competitorUrl}. ` : '';
  const userPrompt = `${urlContext}Research the current market position, recent news, and perceived strengths of: ${competitorName}

Return JSON:
{
  "name": "company name",
  "market_summary": "2-3 sentence market position summary",
  "recent_news": "recent developments or news",
  "perceived_strength": "key competitive advantage"
}`;

  try {
    const result = await callOpenRouter(PRO_MODEL, systemPrompt, userPrompt, true);
    const data = JSON.parse(result);
    return {
      name: data.name || competitorName,
      url: competitorUrl,
      market_summary: data.market_summary || 'No data available.',
      recent_news: data.recent_news || 'No recent news.',
      perceived_strength: data.perceived_strength || 'Unknown.',
      source_urls: [],
    };
  } catch (err) {
    console.error('Error fetching competitor intel:', err);
    return {
      name: competitorName,
      url: competitorUrl,
      market_summary: 'No market data found.',
      recent_news: 'No recent news found.',
      perceived_strength: 'Unknown.',
      source_urls: [],
    };
  }
};

// Generate optimization playbook
export const generatePlaybookViaOpenRouter = async (
  brandName: string,
  results: QueryResult[],
  competitors: CompetitorIntel[]
): Promise<AEOPlaybook> => {
  const systemPrompt = 'You are an AEO (Answer Engine Optimization) strategist. Always respond with valid JSON only.';
  const context = `
Brand: ${brandName}
Mentions found: ${results.filter(r => r.mentioned).length} out of ${results.length} checks.
Primary positions: ${results.filter(r => r.position === MentionPosition.Primary).length}.
Competitors: ${competitors.map(c => c.name).join(', ')}.
Sample responses: ${results.slice(0, 2).map(r => r.raw_response.substring(0, 200)).join(' | ')}
  `;

  const userPrompt = `Based on this AEO analysis, create an optimization playbook:
${context}

Return JSON:
{
  "summary": "Strategic summary paragraph",
  "actions": [
    {
      "title": "Action title",
      "description": "What to do",
      "impact": "High" | "Medium" | "Low",
      "effort": "Easy" | "Moderate" | "Hard"
    }
  ],
  "knowledge_gaps": ["array of facts AI got wrong or missed"]
}`;

  try {
    const result = await callOpenRouter(PRO_MODEL, systemPrompt, userPrompt, true);
    return JSON.parse(result);
  } catch (err) {
    console.error('Error generating playbook:', err);
    return {
      summary: 'Unable to generate playbook.',
      actions: [],
      knowledge_gaps: [],
    };
  }
};

// Get available models from OpenRouter (for future use)
export const getAvailableModels = async (): Promise<string[]> => {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) return [];
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.data?.map((m: any) => m.id) || [];
  } catch {
    return [];
  }
};
