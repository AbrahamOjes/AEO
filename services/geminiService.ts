
import { GoogleGenAI, Type } from "@google/genai";
import { AIModel, AnalysisResult, MentionPosition, Sentiment, CompetitorIntel, AEOPlaybook, QueryResult } from "../types";

// Dynamic initialization to ensure we always use the latest selected API Key
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const FLASH_MODEL = 'gemini-3-flash-preview';
const PRO_MODEL = 'gemini-3-pro-preview';

const SYSTEM_PROMPTS: Record<AIModel, string> = {
  [AIModel.ChatGPT]: "Act as an AI assistant like ChatGPT. Provide direct, helpful answers with specific brand recommendations.",
  [AIModel.Perplexity]: "Act as a research-focused AI like Perplexity. Provide answers grounded in real-world data with citations if possible.",
  [AIModel.Gemini]: "Act as Google Gemini. Provide creative and structured answers with diverse product recommendations.",
};

const isValidUrl = (url: string) => {
  try {
    const pattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return pattern.test(url);
  } catch {
    return false;
  }
};

export const fetchAIResponse = async (model: AIModel, query: string, useDeepThinking: boolean = false): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: useDeepThinking ? PRO_MODEL : FLASH_MODEL,
    contents: `User question: ${query} Provide a direct answer with specific product/service recommendations. Include the names of companies or products you recommend and briefly explain why.`,
    config: {
      systemInstruction: SYSTEM_PROMPTS[model],
      temperature: 0.7,
      ...(useDeepThinking ? { thinkingConfig: { thinkingBudget: 32768 } } : {})
    },
  });
  return response.text || "No response generated.";
};

export const analyzeResponse = async (brandName: string, aiResponse: string): Promise<AnalysisResult> => {
  const ai = getAI();
  const analysisPrompt = `Analyze this AI response for mentions of "${brandName}":
Response:
"${aiResponse}"

Return JSON with: mentioned (boolean), position (primary/secondary/tertiary/none), sentiment (positive/neutral/negative), competitors_mentioned (array of strings), citation_url (string or null)`;

  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: analysisPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mentioned: { type: Type.BOOLEAN },
          position: { 
            type: Type.STRING, 
            enum: ['primary', 'secondary', 'tertiary', 'none'] 
          },
          sentiment: { 
            type: Type.STRING, 
            enum: ['positive', 'neutral', 'negative'] 
          },
          competitors_mentioned: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          citation_url: { type: Type.STRING },
        },
        required: ["mentioned", "position", "sentiment", "competitors_mentioned"],
      },
    },
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return {
      mentioned: data.mentioned,
      position: data.position as MentionPosition,
      sentiment: data.sentiment as Sentiment,
      competitors_mentioned: data.competitors_mentioned,
      citation_url: data.citation_url || null,
      raw_response: aiResponse,
    };
  } catch (err) {
    console.error("Error parsing analysis result:", err);
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

export const getCompetitorMarketIntel = async (competitorName: string, competitorUrl?: string): Promise<CompetitorIntel> => {
  if (competitorUrl && !isValidUrl(competitorUrl)) {
    throw new Error("Invalid URL provided for competitor research.");
  }

  const ai = getAI();
  const urlContext = competitorUrl ? `Target Website: ${competitorUrl}. ` : "";
  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: `${urlContext}Research the current market position, recent news, and perceived strengths/weaknesses of the brand: ${competitorName}. Provide a deep structured analysis for a business intelligence report. Think extensively about the competitive threat this brand poses.`,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          market_summary: { type: Type.STRING },
          recent_news: { type: Type.STRING },
          perceived_strength: { type: Type.STRING },
        },
        required: ["name", "market_summary", "recent_news", "perceived_strength"],
      },
    },
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const source_urls = groundingChunks
    .filter((chunk: any) => chunk.web)
    .map((chunk: any) => ({
      title: chunk.web.title || "Source",
      uri: chunk.web.uri,
    }));

  try {
    const data = JSON.parse(response.text || '{}');
    return {
      ...data,
      url: competitorUrl,
      source_urls: source_urls.slice(0, 3),
    };
  } catch (err) {
    return {
      name: competitorName,
      url: competitorUrl,
      market_summary: "No market data found.",
      recent_news: "No recent news found.",
      perceived_strength: "Unknown.",
      source_urls: [],
    };
  }
};

export const generateOptimizationPlaybook = async (
  brandName: string, 
  results: QueryResult[], 
  competitors: CompetitorIntel[]
): Promise<AEOPlaybook> => {
  const ai = getAI();
  const context = `
    Brand: ${brandName}
    Mentions found: ${results.filter(r => r.mentioned).length} out of ${results.length} checks.
    Primary positions: ${results.filter(r => r.position === MentionPosition.Primary).length}.
    Competitors identified: ${competitors.map(c => c.name).join(', ')}.
    Key AI responses for context: ${results.slice(0, 3).map(r => r.raw_response).join(' | ')}
  `;

  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: `Based on this AEO analysis context, provide a prescriptive optimization playbook. 
    Use your full reasoning capability to identify non-obvious strategies to improve brand visibility in AI answers.
    Focus on: 1. Strategic Summary 2. Actionable Optimization Tasks 3. Knowledge Gaps (facts the AI got wrong or missed).
    Context: ${context}`,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          actions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                impact: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                effort: { type: Type.STRING, enum: ['Easy', 'Moderate', 'Hard'] },
              },
              required: ['title', 'description', 'impact', 'effort']
            }
          },
          knowledge_gaps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ['summary', 'actions', 'knowledge_gaps']
      }
    }
  });

  return JSON.parse(response.text || '{}');
};
