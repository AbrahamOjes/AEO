# AEO Vision: The Ultimate Answer Engine Optimization Tool

AEO Vision is a world-class platform designed to help brands, startups, and marketers navigate the shift from traditional Search Engine Optimization (SEO) to **Answer Engine Optimization (AEO)**.

**Project Repository:** [https://github.com/AbrahamOjes/AEO.git](https://github.com/AbrahamOjes/AEO.git)

## 🚀 Core Features

### 1. Omni-Model Visibility Tracking
- Simultaneous querying of multiple AI models (ChatGPT, Gemini, Perplexity)
- Eliminates "model bias" - see where you're strong across different AI platforms

### 2. Deep Reasoning & Thinking Mode
- Utilizes **Gemini 3 Pro** with 32k token thinking budget
- Provides non-obvious, high-level strategic insights

### 3. AI-Powered Optimization Playbook
- Generates prescriptive strategic roadmap
- Includes specific actions, impact levels, and effort requirements

### 4. Competitive Intelligence & Market Grounding
- Automated competitor research using Google Search grounding
- Identifies content gaps compared to market leaders

### 5. Competitor Tracking (NEW)
- Track up to 3 specific competitors in your analysis
- Side-by-side visibility comparison

### 6. Export Reports (NEW)
- **CSV Export** - Full data export for spreadsheet analysis
- **PDF Export** - Professional reports for stakeholders

### 7. Report History (NEW)
- Save reports to Supabase database
- View and manage historical analyses
- Track visibility trends over time

### 8. OpenRouter Integration (NEW)
- **Single API Key** - Access 100+ models with one key
- **Real ChatGPT** - GPT-4 Turbo via OpenRouter
- **Real Perplexity** - Llama 3.1 Sonar with web search
- **Gemini Fallback** - Simulates other models if OpenRouter not configured

## 🛠 Technical Architecture

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide React
- **Build Tool:** Vite
- **Intelligence Layer:** @google/genai (Gemini 3 Flash & Pro)
- **LLM Gateway:** OpenRouter (100+ models)
- **Database:** Supabase (PostgreSQL)

## 📦 Local Setup

### 1. Clone and Install

```bash
git clone https://github.com/AbrahamOjes/AEO.git
cd AEO
npm install
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Configure your API keys in `.env`:
```env
# Required: Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Optional: OpenRouter for real ChatGPT/Perplexity
VITE_OPENROUTER_API_KEY=sk-or-...

# Optional: Database persistence
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Setup (Optional)

If using Supabase for report persistence, run this SQL in your Supabase SQL editor:

```sql
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_results_report_id ON query_results(report_id);
CREATE INDEX IF NOT EXISTS idx_competitor_intel_report_id ON competitor_intel(report_id);
```

### 4. Start Development Server

```bash
npm run dev
```

## 🔑 API Keys

| API | Required | Purpose |
|-----|----------|---------|
| Gemini | Yes | Core analysis, playbook generation, competitor intel |
| OpenRouter | No | Real ChatGPT & Perplexity responses (falls back to Gemini simulation) |
| Supabase | No | Report persistence and history |

### Getting an OpenRouter Key
1. Go to [openrouter.ai/keys](https://openrouter.ai/keys)
2. Create an account or sign in
3. Generate a new API key
4. Add credits (pay-as-you-go pricing)

## 📊 Scoring Formula

```
Score = Σ (Position Points × Sentiment Modifier) / Max Possible Points × 100
```

**Position Points:** Primary (3), Secondary (2), Tertiary (1), None (0)

**Sentiment Modifier:** Positive (1.2×), Neutral (1.0×), Negative (0.5×)

---
*Built for the future of search by world-class engineers.*