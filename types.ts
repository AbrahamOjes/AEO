
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
  industry?: string;
  template_id?: string;
}

// Historical data for trend tracking
export interface ScoreSnapshot {
  date: number;
  overall_score: number;
  model_scores: Record<AIModel, number>;
  query_count: number;
}

export interface BrandHistory {
  brand_name: string;
  snapshots: ScoreSnapshot[];
  first_seen: number;
  last_updated: number;
}

// Competitor benchmark data
export interface CompetitorBenchmark {
  name: string;
  overall_score: number;
  model_scores: Record<AIModel, number>;
  mention_rate: number;
  avg_position: number;
  last_checked: number;
}

// ============================================
// ACTION ENGINE TYPES (v1.1 Extension)
// ============================================

export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';
export type ContentFixSeverity = 'critical' | 'high' | 'medium' | 'low';
export type SchemaType = 'FAQPage' | 'HowTo' | 'ItemList' | 'Product' | 'DefinedTerm' | 'Review' | 'Article';

// JSON-LD Schema Recommendation
export interface SchemaRecommendation {
  type: SchemaType;
  reason: string;
  implementation_priority: ActionPriority;
  jsonld_snippet: Record<string, unknown>;
}

// Content Fix Item
export interface ContentFix {
  issue: string;
  severity: ContentFixSeverity;
  current: string | null;
  recommended: string;
  rationale: string;
}

// Winner in Answer Gap Analysis
export interface AnswerWinner {
  brand: string;
  position: MentionPosition;
  why_they_won: string[];
}

// Answer Gap Analysis
export interface AnswerGapAnalysis {
  query: string;
  your_position: MentionPosition;
  winners: AnswerWinner[];
  patterns_to_copy: string[];
  content_gaps: string[];
}

// llm.txt Readability Status
export interface LlmTxtStatus {
  status: 'present' | 'missing' | 'incomplete';
  impact: ActionPriority;
  current_files_detected: string[];
  recommended_fix: {
    file: string;
    content: string;
  } | null;
}

// Main ActionPlan Object - attached to each QueryResult
export interface ActionPlan {
  id: string;
  query_result_id: string;
  diagnosis: string;
  priority: ActionPriority;
  schema_recommendation: SchemaRecommendation | null;
  content_fixes: ContentFix[];
  answer_gap_analysis: AnswerGapAnalysis | null;
}

// Brand-level llm.txt recommendation (generated once per analysis)
export interface BrandLlmTxt {
  brand_name: string;
  brand_url: string;
  llm_readability: LlmTxtStatus;
  generated_content: string;
}

// Extended QueryResult with ActionPlan
export interface QueryResultWithAction extends QueryResult {
  action_plan?: ActionPlan;
}

// Extended AEOReport with Action Engine data
export interface AEOReportWithActions extends AEOReport {
  results: QueryResultWithAction[];
  llm_txt?: BrandLlmTxt;
}
