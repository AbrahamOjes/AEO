
export enum AIModel {
  ChatGPT = 'ChatGPT',
  Perplexity = 'Perplexity',
  Gemini = 'Gemini'
}

export enum MentionPosition {
  Primary = 'primary',
  Secondary = 'secondary',
  Tertiary = 'tertiary',
  None = 'none'
}

export enum Sentiment {
  Positive = 'positive',
  Neutral = 'neutral',
  Negative = 'negative'
}

export interface AnalysisResult {
  mentioned: boolean;
  position: MentionPosition;
  sentiment: Sentiment;
  competitors_mentioned: string[];
  citation_url: string | null;
  raw_response: string;
}

export interface QueryResult extends AnalysisResult {
  id: string;
  query_text: string;
  model: AIModel;
}

export interface CompetitorIntel {
  name: string;
  url?: string;
  market_summary: string;
  recent_news: string;
  perceived_strength: string;
  source_urls: { title: string; uri: string }[];
}

export interface PlaybookAction {
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  effort: 'Easy' | 'Moderate' | 'Hard';
}

export interface AEOPlaybook {
  summary: string;
  actions: PlaybookAction[];
  knowledge_gaps: string[];
}

export interface AEOReport {
  id: string;
  brand_name: string;
  brand_url?: string;
  created_at: number;
  overall_score: number;
  model_scores: Record<AIModel, number>;
  results: QueryResult[];
  competitor_intel: CompetitorIntel[];
  playbook?: AEOPlaybook;
}
