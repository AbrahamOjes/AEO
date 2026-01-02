import { AEOReport, QueryResult, CompetitorIntel, AEOPlaybook, BrandHistory, ScoreSnapshot, AIModel } from '../types';

// Supabase configuration - set these via environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let supabaseConfig: SupabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
};

export const setSupabaseConfig = (config: Partial<SupabaseConfig>) => {
  supabaseConfig = { ...supabaseConfig, ...config };
};

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseConfig.url && supabaseConfig.anonKey);
};

const supabaseFetch = async (endpoint: string, options: RequestInit = {}) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const response = await fetch(`${supabaseConfig.url}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseConfig.anonKey,
      'Authorization': `Bearer ${supabaseConfig.anonKey}`,
      'Prefer': options.method === 'POST' ? 'return=representation' : 'return=minimal',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Supabase error: ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

// Database types matching Supabase schema
interface DBReport {
  id: string;
  brand_name: string;
  brand_url: string | null;
  created_at: string;
  overall_score: number;
  model_scores: Record<string, number>;
  playbook: AEOPlaybook | null;
}

interface DBQueryResult {
  id: string;
  report_id: string;
  query_text: string;
  model: string;
  mentioned: boolean;
  position: string;
  sentiment: string;
  competitors_mentioned: string[];
  citation_url: string | null;
  raw_response: string;
}

interface DBCompetitorIntel {
  id: string;
  report_id: string;
  name: string;
  url: string | null;
  market_summary: string;
  recent_news: string;
  perceived_strength: string;
  source_urls: { title: string; uri: string }[];
}

// Save a report to Supabase
export const saveReport = async (report: AEOReport): Promise<string> => {
  // Insert main report
  const reportData = {
    id: report.id,
    brand_name: report.brand_name,
    brand_url: report.brand_url || null,
    created_at: new Date(report.created_at).toISOString(),
    overall_score: report.overall_score,
    model_scores: report.model_scores,
    playbook: report.playbook || null,
  };

  await supabaseFetch('reports', {
    method: 'POST',
    body: JSON.stringify(reportData),
  });

  // Insert query results
  if (report.results.length > 0) {
    const queryResults = report.results.map(r => ({
      id: r.id,
      report_id: report.id,
      query_text: r.query_text,
      model: r.model,
      mentioned: r.mentioned,
      position: r.position,
      sentiment: r.sentiment,
      competitors_mentioned: r.competitors_mentioned,
      citation_url: r.citation_url,
      raw_response: r.raw_response,
    }));

    await supabaseFetch('query_results', {
      method: 'POST',
      body: JSON.stringify(queryResults),
    });
  }

  // Insert competitor intel
  if (report.competitor_intel.length > 0) {
    const competitorData = report.competitor_intel.map((c, idx) => ({
      id: `${report.id}-comp-${idx}`,
      report_id: report.id,
      name: c.name,
      url: c.url || null,
      market_summary: c.market_summary,
      recent_news: c.recent_news,
      perceived_strength: c.perceived_strength,
      source_urls: c.source_urls,
    }));

    await supabaseFetch('competitor_intel', {
      method: 'POST',
      body: JSON.stringify(competitorData),
    });
  }

  return report.id;
};

// Get all reports (summary only)
export const getReports = async (): Promise<AEOReport[]> => {
  const reports: DBReport[] = await supabaseFetch('reports?order=created_at.desc&limit=50');
  
  return reports.map(r => ({
    id: r.id,
    brand_name: r.brand_name,
    brand_url: r.brand_url || undefined,
    created_at: new Date(r.created_at).getTime(),
    overall_score: r.overall_score,
    model_scores: r.model_scores as any,
    results: [],
    competitor_intel: [],
    playbook: r.playbook || undefined,
  }));
};

// Get a single report with all details
export const getReportById = async (reportId: string): Promise<AEOReport | null> => {
  const reports: DBReport[] = await supabaseFetch(`reports?id=eq.${reportId}`);
  
  if (reports.length === 0) return null;
  
  const report = reports[0];
  
  // Fetch query results
  const queryResults: DBQueryResult[] = await supabaseFetch(`query_results?report_id=eq.${reportId}`);
  
  // Fetch competitor intel
  const competitorIntel: DBCompetitorIntel[] = await supabaseFetch(`competitor_intel?report_id=eq.${reportId}`);
  
  return {
    id: report.id,
    brand_name: report.brand_name,
    brand_url: report.brand_url || undefined,
    created_at: new Date(report.created_at).getTime(),
    overall_score: report.overall_score,
    model_scores: report.model_scores as any,
    results: queryResults.map(r => ({
      id: r.id,
      query_text: r.query_text,
      model: r.model as any,
      mentioned: r.mentioned,
      position: r.position as any,
      sentiment: r.sentiment as any,
      competitors_mentioned: r.competitors_mentioned,
      citation_url: r.citation_url,
      raw_response: r.raw_response,
    })),
    competitor_intel: competitorIntel.map(c => ({
      name: c.name,
      url: c.url || undefined,
      market_summary: c.market_summary,
      recent_news: c.recent_news,
      perceived_strength: c.perceived_strength,
      source_urls: c.source_urls,
    })),
    playbook: report.playbook || undefined,
  };
};

// Delete a report
export const deleteReport = async (reportId: string): Promise<void> => {
  // Delete in order due to foreign keys
  await supabaseFetch(`competitor_intel?report_id=eq.${reportId}`, { method: 'DELETE' });
  await supabaseFetch(`query_results?report_id=eq.${reportId}`, { method: 'DELETE' });
  await supabaseFetch(`reports?id=eq.${reportId}`, { method: 'DELETE' });
};

// SQL schema for Supabase (run this in Supabase SQL editor)
export const SUPABASE_SCHEMA = `
-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  brand_name TEXT NOT NULL,
  brand_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  overall_score INTEGER NOT NULL,
  model_scores JSONB NOT NULL,
  playbook JSONB
);

-- Query results table
CREATE TABLE IF NOT EXISTS query_results (
  id TEXT PRIMARY KEY,
  report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  model TEXT NOT NULL,
  mentioned BOOLEAN NOT NULL,
  position TEXT NOT NULL,
  sentiment TEXT NOT NULL,
  competitors_mentioned TEXT[] DEFAULT '{}',
  citation_url TEXT,
  raw_response TEXT NOT NULL
);

-- Competitor intel table
CREATE TABLE IF NOT EXISTS competitor_intel (
  id TEXT PRIMARY KEY,
  report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  market_summary TEXT NOT NULL,
  recent_news TEXT NOT NULL,
  perceived_strength TEXT NOT NULL,
  source_urls JSONB DEFAULT '[]'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_brand_name ON reports(brand_name);
CREATE INDEX IF NOT EXISTS idx_query_results_report_id ON query_results(report_id);
CREATE INDEX IF NOT EXISTS idx_competitor_intel_report_id ON competitor_intel(report_id);

-- Enable Row Level Security (optional, for multi-user support)
-- ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE query_results ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE competitor_intel ENABLE ROW LEVEL SECURITY;
`;

// Get brand history with score trends
export const getBrandHistory = async (brandName: string): Promise<BrandHistory | null> => {
  const reports: DBReport[] = await supabaseFetch(
    `reports?brand_name=eq.${encodeURIComponent(brandName)}&order=created_at.asc&limit=100`
  );
  
  if (reports.length === 0) return null;
  
  const snapshots: ScoreSnapshot[] = reports.map(r => ({
    date: new Date(r.created_at).getTime(),
    overall_score: r.overall_score,
    model_scores: r.model_scores as Record<AIModel, number>,
    query_count: 0, // Will be populated if needed
  }));
  
  return {
    brand_name: brandName,
    snapshots,
    first_seen: snapshots[0].date,
    last_updated: snapshots[snapshots.length - 1].date,
  };
};

// Get all unique brands with their latest scores
export const getAllBrands = async (): Promise<{ name: string; latest_score: number; report_count: number; last_updated: number }[]> => {
  const reports: DBReport[] = await supabaseFetch('reports?order=created_at.desc');
  
  const brandMap = new Map<string, { latest_score: number; report_count: number; last_updated: number }>();
  
  reports.forEach(r => {
    const existing = brandMap.get(r.brand_name);
    if (!existing) {
      brandMap.set(r.brand_name, {
        latest_score: r.overall_score,
        report_count: 1,
        last_updated: new Date(r.created_at).getTime(),
      });
    } else {
      existing.report_count++;
    }
  });
  
  return Array.from(brandMap.entries()).map(([name, data]) => ({
    name,
    ...data,
  }));
};

// Get reports for a specific brand
export const getReportsByBrand = async (brandName: string): Promise<AEOReport[]> => {
  const reports: DBReport[] = await supabaseFetch(
    `reports?brand_name=eq.${encodeURIComponent(brandName)}&order=created_at.desc&limit=50`
  );
  
  return reports.map(r => ({
    id: r.id,
    brand_name: r.brand_name,
    brand_url: r.brand_url || undefined,
    created_at: new Date(r.created_at).getTime(),
    overall_score: r.overall_score,
    model_scores: r.model_scores as Record<AIModel, number>,
    results: [],
    competitor_intel: [],
    playbook: r.playbook || undefined,
  }));
};

// Calculate score change between two reports
export const calculateScoreChange = (current: number, previous: number): { change: number; trend: 'up' | 'down' | 'stable' } => {
  const change = current - previous;
  const trend = change > 2 ? 'up' : change < -2 ? 'down' : 'stable';
  return { change, trend };
};
