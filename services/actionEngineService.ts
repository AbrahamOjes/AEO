// Action Engine Service - Transforms visibility data into executable fixes
// Features: JSON-LD Schema Generation, llm.txt Generation, Content Fixes, Answer Gap Analysis

import {
  ActionPlan,
  ActionPriority,
  SchemaRecommendation,
  ContentFix,
  AnswerGapAnalysis,
  BrandLlmTxt,
  LlmTxtStatus,
  QueryResult,
  MentionPosition,
  AIModel,
} from '../types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const ACTION_MODEL = 'google/gemini-2.0-flash-001';

const getOpenRouterApiKey = (): string | undefined => {
  return (import.meta as any).env?.VITE_OPENROUTER_API_KEY || undefined;
};

const callOpenRouter = async (
  systemPrompt: string,
  userPrompt: string,
  jsonMode: boolean = true
): Promise<string> => {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    throw new Error('OpenRouter API key is required for Action Engine');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AEO Action Engine',
    },
    body: JSON.stringify({
      model: ACTION_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Action Engine API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '{}';
};

// Generate ActionPlan for a single QueryResult
export const generateActionPlan = async (
  brandName: string,
  brandUrl: string,
  queryResult: QueryResult
): Promise<ActionPlan> => {
  const systemPrompt = `You are an AEO (Answer Engine Optimization) analyst. Generate actionable fixes to improve brand visibility in AI answers. Always respond with valid JSON only, no markdown.`;

  const userPrompt = `CONTEXT:
- Brand: ${brandName}
- Brand URL: ${brandUrl || 'Not provided'}
- Query: ${queryResult.query_text}
- AI Model: ${queryResult.model}
- AI Response: ${queryResult.raw_response.substring(0, 2000)}
- Brand Mentioned: ${queryResult.mentioned}
- Position: ${queryResult.position}
- Competitors Mentioned: ${queryResult.competitors_mentioned.join(', ') || 'None'}

TASK: Generate an ActionPlan with:

1. DIAGNOSIS: One sentence explaining why the brand did/didn't appear well

2. PRIORITY: Rate as critical/high/medium/low based on:
   - critical: Not mentioned at all, high-intent query
   - high: Mentioned but poor position, or competitor dominated
   - medium: Mentioned secondary, room for improvement
   - low: Good position, minor optimizations

3. SCHEMA_RECOMMENDATION: Analyze the query pattern and recommend schema:
   - "What is..." → DefinedTerm or FAQPage
   - "Best X for Y" → FAQPage + ItemList
   - "How do I..." → HowTo
   - "X vs Y" → FAQPage with comparison
   - "Is X good for..." → FAQPage or Review
   
   Generate complete, valid JSON-LD the brand can copy-paste. Use the exact query as the Question.

4. CONTENT_FIXES: Array of 2-4 specific fixes, each with:
   - issue: What's wrong
   - severity: critical/high/medium/low
   - current: What likely exists now (infer from response)
   - recommended: Exact replacement text or addition
   - rationale: Why this matters for AI extraction

5. ANSWER_GAP_ANALYSIS (if brand not in primary position):
   - winners: Who appeared and why (infer from response)
   - patterns_to_copy: What content patterns to adopt
   - content_gaps: What's missing from brand's content

Return JSON with this exact structure:
{
  "diagnosis": "string",
  "priority": "critical|high|medium|low",
  "schema_recommendation": {
    "type": "FAQPage|HowTo|ItemList|Product|DefinedTerm|Review|Article",
    "reason": "string",
    "implementation_priority": "critical|high|medium|low",
    "jsonld_snippet": { valid JSON-LD object }
  },
  "content_fixes": [
    {
      "issue": "string",
      "severity": "critical|high|medium|low",
      "current": "string or null",
      "recommended": "string",
      "rationale": "string"
    }
  ],
  "answer_gap_analysis": {
    "query": "string",
    "your_position": "primary|secondary|tertiary|none",
    "winners": [
      {
        "brand": "string",
        "position": "primary|secondary|tertiary",
        "why_they_won": ["string"]
      }
    ],
    "patterns_to_copy": ["string"],
    "content_gaps": ["string"]
  }
}`;

  try {
    console.log(`[ActionEngine] Generating plan for query: ${queryResult.query_text}`);
    const result = await callOpenRouter(systemPrompt, userPrompt, true);
    const data = JSON.parse(result);

    return {
      id: `ap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query_result_id: queryResult.id,
      diagnosis: data.diagnosis || 'Unable to generate diagnosis',
      priority: data.priority || 'medium',
      schema_recommendation: data.schema_recommendation || null,
      content_fixes: data.content_fixes || [],
      answer_gap_analysis: data.answer_gap_analysis || null,
    };
  } catch (err) {
    console.error('[ActionEngine] Error generating action plan:', err);
    // Return a basic fallback plan
    return {
      id: `ap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query_result_id: queryResult.id,
      diagnosis: queryResult.mentioned 
        ? `${brandName} was mentioned but could improve positioning.`
        : `${brandName} was not mentioned in the AI response.`,
      priority: queryResult.mentioned ? 'medium' : 'high',
      schema_recommendation: null,
      content_fixes: [],
      answer_gap_analysis: null,
    };
  }
};

// Generate llm.txt content for a brand
export const generateLlmTxt = async (
  brandName: string,
  brandUrl: string,
  category: string,
  queries: string[]
): Promise<BrandLlmTxt> => {
  const systemPrompt = `You are an expert in AI-readable content optimization. Generate llm.txt files that help AI assistants understand brand identity. Return valid JSON only.`;

  const userPrompt = `Generate an llm.txt file for:

Brand: ${brandName}
URL: ${brandUrl || 'Not provided'}
Category: ${category || 'General'}
Queries they want to win:
${queries.slice(0, 10).map((q, i) => `${i + 1}. ${q}`).join('\n')}

The llm.txt should follow this structure:
- Start with # ${brandName} - AI Context File
- Include sections: Company, Primary Use Cases, Target Audience, Authoritative Sources, Key Differentiators, Contact
- Map use cases directly to the queries they want to rank for
- Use declarative, factual language (not marketing fluff)
- Include specific details where possible

Return JSON with:
{
  "llm_readability": {
    "status": "missing",
    "impact": "high",
    "current_files_detected": [],
    "recommended_fix": {
      "file": "/llm.txt",
      "content": "the full llm.txt content as a string"
    }
  },
  "generated_content": "the full llm.txt content as a string (same as above)"
}`;

  try {
    console.log(`[ActionEngine] Generating llm.txt for: ${brandName}`);
    const result = await callOpenRouter(systemPrompt, userPrompt, true);
    const data = JSON.parse(result);

    return {
      brand_name: brandName,
      brand_url: brandUrl || '',
      llm_readability: data.llm_readability || {
        status: 'missing',
        impact: 'high',
        current_files_detected: [],
        recommended_fix: null,
      },
      generated_content: data.generated_content || data.llm_readability?.recommended_fix?.content || '',
    };
  } catch (err) {
    console.error('[ActionEngine] Error generating llm.txt:', err);
    // Return a basic fallback
    const fallbackContent = `# ${brandName} - AI Context File

## Company
Name: ${brandName}
Website: ${brandUrl || 'N/A'}
Category: ${category || 'General'}

## Primary Use Cases
${queries.slice(0, 5).map(q => `- ${q.replace(/\?/g, '')}`).join('\n')}

## Target Audience
- Users searching for ${category || brandName} solutions
- Professionals and consumers in this space

## Authoritative Sources
- Website: ${brandUrl || 'N/A'}

## Key Differentiators
- [Add your unique value propositions here]

## Contact
- Website: ${brandUrl || 'N/A'}
`;

    return {
      brand_name: brandName,
      brand_url: brandUrl || '',
      llm_readability: {
        status: 'missing',
        impact: 'high',
        current_files_detected: [],
        recommended_fix: {
          file: '/llm.txt',
          content: fallbackContent,
        },
      },
      generated_content: fallbackContent,
    };
  }
};

// Batch generate ActionPlans for multiple QueryResults
export const generateActionPlansForResults = async (
  brandName: string,
  brandUrl: string,
  results: QueryResult[],
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, ActionPlan>> => {
  const actionPlans = new Map<string, ActionPlan>();
  
  // Prioritize results where brand is not mentioned or poorly positioned
  const prioritizedResults = [...results].sort((a, b) => {
    const scoreA = a.mentioned ? (a.position === MentionPosition.Primary ? 3 : a.position === MentionPosition.Secondary ? 2 : 1) : 0;
    const scoreB = b.mentioned ? (b.position === MentionPosition.Primary ? 3 : b.position === MentionPosition.Secondary ? 2 : 1) : 0;
    return scoreA - scoreB; // Lower scores (worse visibility) first
  });

  for (let i = 0; i < prioritizedResults.length; i++) {
    const result = prioritizedResults[i];
    try {
      const plan = await generateActionPlan(brandName, brandUrl, result);
      actionPlans.set(result.id, plan);
      onProgress?.(i + 1, prioritizedResults.length);
    } catch (err) {
      console.error(`[ActionEngine] Failed to generate plan for ${result.id}:`, err);
    }
    
    // Small delay to avoid rate limiting
    if (i < prioritizedResults.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return actionPlans;
};

// Export all JSON-LD schemas as a single file
export const exportAllSchemas = (actionPlans: ActionPlan[]): string => {
  const schemas = actionPlans
    .filter(plan => plan.schema_recommendation?.jsonld_snippet)
    .map(plan => plan.schema_recommendation!.jsonld_snippet);

  return JSON.stringify(schemas, null, 2);
};

// Export llm.txt content
export const exportLlmTxt = (llmTxt: BrandLlmTxt): string => {
  return llmTxt.generated_content;
};

// Calculate priority score for sorting
export const getPriorityScore = (priority: ActionPriority): number => {
  switch (priority) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
};

// Get color class for priority
export const getPriorityColor = (priority: ActionPriority): string => {
  switch (priority) {
    case 'critical': return 'text-rose-600 bg-rose-50';
    case 'high': return 'text-orange-600 bg-orange-50';
    case 'medium': return 'text-amber-600 bg-amber-50';
    case 'low': return 'text-emerald-600 bg-emerald-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

// Get icon for schema type
export const getSchemaTypeIcon = (type: string): string => {
  switch (type) {
    case 'FAQPage': return '❓';
    case 'HowTo': return '📋';
    case 'ItemList': return '📝';
    case 'Product': return '📦';
    case 'DefinedTerm': return '📖';
    case 'Review': return '⭐';
    case 'Article': return '📰';
    default: return '📄';
  }
};
