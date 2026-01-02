/**
 * Competitive AI Win/Loss Intelligence Types
 * Core data structures for competitive analysis
 */

// ============================================
// Brand Configuration
// ============================================

export interface BrandConfig {
  id: string;
  
  // Core identity
  brandName: string;
  websiteUrl: string;
  
  // Market position
  category: string;
  subcategories: string[];
  
  // Target market
  targetCustomer: string;
  primaryUseCase: string;
  geography: string[];
  
  // Competitors
  competitors: Competitor[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface Competitor {
  id: string;
  name: string;
  websiteUrl: string;
  isPrimary: boolean; // true = direct competitor, false = adjacent
}

// ============================================
// Query Generation
// ============================================

export enum QueryCategory {
  RECOMMENDATION = "recommendation",  // "Best X for Y"
  COMPARISON = "comparison",          // "A vs B"
  VALIDATION = "validation",          // "Is X legit?"
  FEATURE = "feature"                 // Specific capability queries
}

export interface GeneratedQuery {
  id: string;
  text: string;
  category: QueryCategory;
  intent: string;                     // Why buyer asks this
  competitorsMentioned: string[];     // Which competitors might appear
}

export interface QuerySet {
  category: QueryCategory;
  queries: GeneratedQuery[];
}

// ============================================
// Query Execution
// ============================================

export type AIModelType = "chatgpt" | "perplexity" | "gemini";

export interface QueryExecution {
  id: string;
  queryId: string;
  queryText: string;
  model: AIModelType;
  
  // Raw response
  rawResponse: string;
  
  // Parsed results
  brandsMentioned: BrandMention[];
  winner: string | null;           // Brand recommended first/most strongly
  sentiment: "positive" | "neutral" | "negative" | null;
  
  // Metadata
  executedAt: string;
  latencyMs: number;
}

export type MentionPosition = "primary" | "secondary" | "tertiary" | "mentioned" | "none";
export type MentionSentiment = "positive" | "neutral" | "negative";

export interface BrandMention {
  brand: string;
  position: MentionPosition;
  sentiment: MentionSentiment;
  context: string;                 // Snippet of text where mentioned
  citationUrl: string | null;      // If model provided source
}

// ============================================
// Win/Loss Analysis
// ============================================

export type WinLossOutcome = "win" | "loss" | "partial" | "unclear";

export interface ModelResult {
  winner: string | null;
  userBrandPosition: MentionPosition;
  userBrandSentiment: MentionSentiment | null;
  competitorPositions: Record<string, MentionPosition>;
}

export interface WinLossResult {
  id: string;
  query: GeneratedQuery;
  executions: QueryExecution[];  // One per model
  
  // Aggregated result
  overallResult: WinLossOutcome;
  winningBrand: string | null;
  
  // Per-model breakdown
  modelResults: {
    chatgpt?: ModelResult;
    perplexity?: ModelResult;
    gemini?: ModelResult;
  };
}

// ============================================
// Aggregate Statistics
// ============================================

export interface CategoryStats {
  total: number;
  wins: number;
  losses: number;
  partial: number;
  winRate: number;
}

export interface ModelStats {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  avgUserPosition: number;  // 1 = primary, 5 = not mentioned
}

export interface CompetitorStats {
  competitor: string;
  queriesAgainst: number;
  winsAgainst: number;
  lossesAgainst: number;
  winRate: number;
}

export interface CompetitiveReport {
  id: string;
  brandId: string;
  createdAt: string;
  
  // Overall stats
  totalQueries: number;
  wins: number;
  losses: number;
  partial: number;
  winRate: number;  // 0-100
  
  // By category
  categoryBreakdown: {
    recommendation: CategoryStats;
    comparison: CategoryStats;
    validation: CategoryStats;
    feature: CategoryStats;
  };
  
  // By competitor
  competitorBreakdown: Record<string, CompetitorStats>;
  
  // By model
  modelBreakdown: {
    chatgpt: ModelStats;
    perplexity: ModelStats;
    gemini: ModelStats;
  };
  
  // Key queries
  biggestWins: WinLossResult[];     // Top 5 queries where user wins convincingly
  biggestLosses: WinLossResult[];   // Top 5 queries where user loses badly
  closeCalls: WinLossResult[];      // Top 5 partial/contested queries
}

// ============================================
// Competitor Teardown
// ============================================

export interface ContentSignals {
  hasComparisonPages: boolean;
  comparisonPagesFound: string[];      // URLs
  hasFaqSchema: boolean;
  faqPagesFound: string[];
  hasProductSchema: boolean;
  hasOrganizationSchema: boolean;
  hasLlmTxt: boolean;
  
  // Content patterns
  avgWordCount: number;
  usesComparisonTables: boolean;
  usesDefinitiveLanguage: boolean;     // "best", "leading", "#1"
  hasTargetAudiencePages: boolean;     // "for freelancers", "for SMBs"
  hasPricingTransparency: boolean;
  hasTrustSignals: boolean;            // Reviews, testimonials, logos
}

export interface KeywordPresence {
  keyword: string;
  count: number;
  inH1: boolean;
  inH2: boolean;
  inFirstParagraph: boolean;
}

export interface CompetitorTeardown {
  id: string;
  competitor: string;
  websiteUrl: string;
  
  // Content analysis
  contentSignals: ContentSignals;
  
  // Keyword analysis
  keywordPresence: Record<string, KeywordPresence>;
  
  // What they have that you don't
  advantages: string[];
  
  analyzedAt: string;
}

// ============================================
// Query Gap Analysis
// ============================================

export type GapDifficulty = "easy" | "medium" | "hard";

export interface QueryGap {
  id: string;
  query: string;
  queryCategory: QueryCategory;
  winningCompetitor: string;
  whyTheyWin: string[];
  whatYouNeed: string[];
  difficulty: GapDifficulty;
  priority: number;  // 1-10
}

// ============================================
// Action Plan
// ============================================

export type FixEffort = "low" | "medium" | "high";
export type FixSkill = "content" | "technical" | "both";

export interface Fix {
  id: string;
  title: string;
  description: string;
  
  // Impact
  queriesAffected: string[];       // Which queries this would help
  potentialWins: number;           // How many queries could flip
  
  // Effort
  effort: FixEffort;
  estimatedHours: number;
  skillRequired: FixSkill;
  
  // Implementation
  steps: string[];
  
  // Generated asset (if applicable)
  generatedAsset?: ComparisonPageOutline | SchemaSnippet | ContentRewrite | string;
  assetType?: "comparison" | "schema" | "rewrite" | "llmtxt";
}

export interface ComparisonPageOutline {
  type: "comparison";
  targetQuery: string;             // "Autospend vs Wise"
  suggestedUrl: string;            // "/compare/autospend-vs-wise"
  h1: string;
  sections: {
    heading: string;
    contentGuidance: string;
  }[];
  schemaToInclude: object;         // FAQPage schema for this page
}

export interface SchemaSnippet {
  type: "schema";
  schemaType: string;              // "FAQPage", "Product", etc.
  targetPage: string;              // Where to add it
  jsonLd: object;                  // The actual schema
  queriesThisHelps: string[];
}

export interface ContentRewrite {
  type: "rewrite";
  targetPage: string;
  currentIssue: string;
  suggestedRewrite: string;
  queriesThisHelps: string[];
}

export interface GeneratedAssets {
  comparisonPageOutlines: ComparisonPageOutline[];
  schemaSnippets: SchemaSnippet[];
  llmTxt: string;
  contentRewrites: ContentRewrite[];
}

export interface CompetitiveActionPlan {
  id: string;
  reportId: string;
  createdAt: string;
  
  // Summary
  totalFixes: number;
  estimatedImpact: string;         // "Could improve win rate by ~15-25%"
  estimatedEffort: string;         // "~20 hours of content work"
  
  // Prioritized actions
  criticalFixes: Fix[];            // Do immediately
  highPriorityFixes: Fix[];        // Do this week
  mediumPriorityFixes: Fix[];      // Do this month
  lowPriorityFixes: Fix[];         // Nice to have
  
  // Quick wins
  quickWins: Fix[];                // High impact, low effort
  
  // Generated assets
  generatedAssets: GeneratedAssets;
}

// ============================================
// Monitoring & Alerts
// ============================================

export type MonitoringFrequency = "daily" | "weekly" | "monthly";
export type AlertType = "win_rate_drop" | "new_loss" | "competitor_gain";
export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertThresholds {
  winRateDropPercent: number;      // Alert if win rate drops by X%
  newLoss: boolean;                 // Alert on any new lost query
  competitorGain: boolean;          // Alert if competitor gains
}

export interface NotificationChannels {
  email: string[];
  slack?: string;                   // Webhook URL
}

export interface MonitoringConfig {
  id: string;
  brandId: string;
  frequency: MonitoringFrequency;
  alertThresholds: AlertThresholds;
  notificationChannels: NotificationChannels;
  isActive: boolean;
  nextCheckAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  details: any;
  createdAt: string;
}

export interface CompetitorChange {
  competitor: string;
  change: "gained" | "lost";
  queries: string[];
}

export interface MonitoringChanges {
  winRateChange: number;           // +5 or -3
  newWins: WinLossResult[];        // Queries that flipped to wins
  newLosses: WinLossResult[];      // Queries that flipped to losses
  competitorChanges: CompetitorChange[];
}

export interface MonitoringResult {
  id: string;
  brandId: string;
  reportId: string;
  checkedAt: string;
  
  // Current state
  currentWinRate: number;
  currentWins: number;
  currentLosses: number;
  
  // Changes since last check
  changes: MonitoringChanges;
  
  // Alerts triggered
  alertsTriggered: Alert[];
}

// ============================================
// UI State Types
// ============================================

export type SetupStep = "brand" | "competitors" | "review";

export interface CompetitiveSetupState {
  step: SetupStep;
  brandConfig: Partial<BrandConfig>;
  isAnalyzing: boolean;
  analysisProgress: {
    currentQuery: number;
    totalQueries: number;
    currentModel: AIModelType | null;
    status: string;
  };
}

export type DashboardTab = "overview" | "results" | "gaps" | "actions" | "monitoring";

export interface DashboardState {
  activeTab: DashboardTab;
  selectedQuery: WinLossResult | null;
  filterCategory: QueryCategory | "all";
  filterResult: WinLossOutcome | "all";
  searchTerm: string;
}
