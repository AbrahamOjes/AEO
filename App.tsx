
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  BarChart, 
  Search, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  ChevronRight, 
  ChevronDown,
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Download,
  ExternalLink,
  Users,
  Target,
  Newspaper,
  Award,
  Link as LinkIcon,
  RefreshCw,
  Globe,
  Info,
  Edit2,
  Check,
  Lightbulb,
  Rocket,
  BrainCircuit,
  LayoutDashboard,
  FileText,
  ToggleLeft,
  ToggleRight,
  Cpu,
  Key,
  Github,
  Layers,
  Copy,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  LineChart,
  PieChart,
  Code,
  Wrench,
  FileCode
} from 'lucide-react';
import { AIModel, AEOReport, QueryResult, MentionPosition, Sentiment, CompetitorIntel, AEOPlaybook, BrandHistory, ActionPlan, BrandLlmTxt, QueryResultWithAction } from './types';
import { fetchAIResponse, analyzeResponse, getCompetitorMarketIntel, generateOptimizationPlaybook } from './services/geminiService';
import { saveReport, getReports, getReportById, deleteReport, isSupabaseConfigured, setSupabaseConfig, getBrandHistory, getAllBrands, getReportsByBrand, calculateScoreChange } from './services/supabaseService';
import { exportToCSV, exportToPDF } from './services/exportService';
import { analyzeBrandAndGenerateQueries, isOpenRouterConfigured, type BrandAnalysis } from './services/openrouterService';
import { generateActionPlan, generateLlmTxt, exportAllSchemas, exportLlmTxt, getPriorityColor, getSchemaTypeIcon } from './services/actionEngineService';
import { triggerRecrawl, saveSubmission, getSubmissions, generateSubmissionId, estimateRecrawlTime, getIndexNowSetupInstructions, type CrawlSubmission, type CrawlSubmissionResult } from './services/crawlSubmissionService';
import { createProfileFromReport, saveProfile, getProfiles, publishProfile, downloadProfileHTML, generateBrandProfileHTML, type BrandProfile } from './services/brandProfileService';
import { isPlatformConnected, getConnection, PLATFORM_INFO, generateSchemaInjection, generatePRDescription, type PlatformConnection } from './services/platformIntegrationService';
import { POSITION_POINTS, SENTIMENT_MODIFIER, MAX_POINTS_PER_CHECK } from './constants';
import { INDUSTRIES, QUERY_TEMPLATES, getTemplatesByIndustry, generateCustomQueries, type Industry, type QueryTemplate } from './data/queryTemplates';

// Declare external AI Studio functions
// Fixed: Simplified global window augmentation to resolve identical modifiers error
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

// --- Utility Components ---

const Navbar: React.FC<{ onHistoryClick?: () => void }> = ({ onHistoryClick }) => (
  <nav className="bg-white border-b border-gray-100 py-4 px-6 flex items-center justify-between sticky top-0 z-50">
    <div className="flex items-center gap-2">
      <div className="bg-indigo-600 p-1.5 rounded-lg">
        <ShieldCheck className="text-white w-6 h-6" />
      </div>
      <span className="font-bold text-xl tracking-tight text-gray-900">AEO Vision</span>
    </div>
    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
      <a href="#" className="hover:text-indigo-600 transition">How it works</a>
      <a href="#" className="hover:text-indigo-600 transition">Pricing</a>
      {onHistoryClick && (
        <button onClick={onHistoryClick} className="flex items-center gap-2 hover:text-indigo-600 transition">
          <BarChart className="w-4 h-4" />
          History
        </button>
      )}
      <a href="https://github.com/AbrahamOjes/AEO.git" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-indigo-600 transition">
        <Github className="w-4 h-4" />
        GitHub
      </a>
    </div>
  </nav>
);

const Footer = () => (
  <footer className="bg-gray-50 border-t border-gray-200 py-12 mt-20">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="col-span-1 md:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="text-indigo-600 w-6 h-6" />
          <span className="font-bold text-xl text-gray-900">AEO Vision</span>
        </div>
        <p className="text-gray-500 max-w-sm">
          Empowering brands to understand and optimize their visibility in the era of AI-first search.
        </p>
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
        <ul className="space-y-2 text-gray-600 text-sm">
          <li><a href="#" className="hover:text-indigo-600">Features</a></li>
          <li><a href="#" className="hover:text-indigo-600">API Access</a></li>
          <li><a href="https://github.com/AbrahamOjes/AEO.git" className="hover:text-indigo-600">Source Code</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
        <ul className="space-y-2 text-gray-600 text-sm">
          <li><a href="#" className="hover:text-indigo-600">Help Center</a></li>
          <li><a href="#" className="hover:text-indigo-600">Contact Us</a></li>
          <li><a href="#" className="hover:text-indigo-600">Status</a></li>
        </ul>
      </div>
    </div>
  </footer>
);

// --- View Components ---

const LandingView: React.FC<{ 
  onStart: (brand: string, url: string, queries: string[], competitors: string[], deepThinking: boolean, industry?: string) => void 
}> = ({ onStart }) => {
  const [brand, setBrand] = useState('');
  const [url, setUrl] = useState('');
  const [queriesStr, setQueriesStr] = useState('');
  const [competitorsStr, setCompetitorsStr] = useState('');
  const [deepThinking, setDeepThinking] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>('Custom');
  const [selectedTemplate, setSelectedTemplate] = useState<QueryTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [productCategory, setProductCategory] = useState('');
  
  // Smart brand analysis state
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);
  const [brandAnalysis, setBrandAnalysis] = useState<BrandAnalysis | null>(null);
  const [brandDescription, setBrandDescription] = useState('');

  const availableTemplates = useMemo(() => getTemplatesByIndustry(selectedIndustry), [selectedIndustry]);

  const handleTemplateSelect = (template: QueryTemplate) => {
    setSelectedTemplate(template);
    setQueriesStr(template.queries.join('\n'));
    setShowTemplates(false);
  };

  const handleGenerateCustom = () => {
    if (brand && productCategory) {
      const queries = generateCustomQueries(brand, productCategory);
      setQueriesStr(queries.join('\n'));
    }
  };

  // Smart brand analysis - generates queries based on brand name/URL
  const handleSmartAnalyze = async () => {
    if (!brand.trim()) return;
    
    setIsAnalyzingBrand(true);
    setBrandAnalysis(null);
    
    try {
      const analysis = await analyzeBrandAndGenerateQueries(brand.trim(), url.trim() || undefined);
      setBrandAnalysis(analysis);
      setBrandDescription(analysis.description);
      setQueriesStr(analysis.queries.join('\n'));
      setCompetitorsStr(analysis.competitors.join(', '));
      
      // Try to match detected industry to our list
      const matchedIndustry = INDUSTRIES.find(ind => 
        analysis.industry.toLowerCase().includes(ind.toLowerCase().split(' ')[0]) ||
        ind.toLowerCase().includes(analysis.industry.toLowerCase().split(' ')[0])
      );
      if (matchedIndustry) {
        setSelectedIndustry(matchedIndustry);
      }
      setProductCategory(analysis.category);
    } catch (err) {
      console.error('Brand analysis failed:', err);
    } finally {
      setIsAnalyzingBrand(false);
    }
  };

  const handleRun = async () => {
    if (!brand || !queriesStr) return;
    
    const queries = queriesStr.split('\n').filter(q => q.trim().length > 0).slice(0, 20);
    const competitors = competitorsStr.split(',').map(c => c.trim()).filter(c => c.length > 0).slice(0, 5);
    onStart(brand, url, queries, competitors, deepThinking, selectedIndustry);
  };

  const queryCount = queriesStr.split('\n').filter(q => q.trim().length > 0).length;

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Answer Economy</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Track your brand visibility across AI assistants with industry-specific templates, 
          historical trends, and actionable optimization playbooks.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Search className="w-64 h-64 text-indigo-600" />
        </div>
        
        <div className="space-y-8 relative z-10">
          {/* Brand Info with Smart Analyze */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Shein, Nike, Salesforce"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Website (Optional)</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="e.g. shein.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition text-lg"
                  />
                </div>
              </div>
            </div>
            
            {/* Smart Analyze Button */}
            <button
              onClick={handleSmartAnalyze}
              disabled={!brand.trim() || isAnalyzingBrand}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3"
            >
              {isAnalyzingBrand ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing {brand}...
                </>
              ) : (
                <>
                  <BrainCircuit className="w-5 h-5" />
                  Auto-Generate Queries for "{brand || 'Brand'}"
                </>
              )}
            </button>
            
            {/* Brand Analysis Result */}
            {brandAnalysis && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-emerald-800 mb-1">
                      {brandAnalysis.category} • {brandAnalysis.industry}
                    </div>
                    <p className="text-emerald-700 text-sm">{brandDescription}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                        {brandAnalysis.queries.length} queries generated
                      </span>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                        {brandAnalysis.competitors.length} competitors detected
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Industry & Template Selection */}
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-6 border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900">Manual Templates</h3>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-semibold">Optional</span>
              </div>
              <span className="text-xs text-gray-500">Or use templates below</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Industry</label>
                <select 
                  value={selectedIndustry}
                  onChange={(e) => {
                    setSelectedIndustry(e.target.value as Industry);
                    setSelectedTemplate(null);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition"
                >
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              
              {selectedIndustry !== 'Custom' && availableTemplates.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Template</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-left flex items-center justify-between hover:border-indigo-300 transition"
                    >
                      <span className={selectedTemplate ? 'text-gray-900' : 'text-gray-400'}>
                        {selectedTemplate?.name || 'Select a template...'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition ${showTemplates ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showTemplates && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-20 max-h-64 overflow-y-auto">
                        {availableTemplates.map(template => (
                          <button
                            key={template.id}
                            onClick={() => handleTemplateSelect(template)}
                            className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition border-b border-gray-100 last:border-0"
                          >
                            <div className="font-semibold text-gray-900">{template.name}</div>
                            <div className="text-xs text-gray-500">{template.description} • {template.queries.length} queries</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedIndustry === 'Custom' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Product Category</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. CRM software"
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition"
                    />
                    <button
                      onClick={handleGenerateCustom}
                      disabled={!brand || !productCategory}
                      className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 transition font-semibold text-sm"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {selectedTemplate && (
              <div className="flex items-center gap-2 text-sm text-indigo-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Loaded {selectedTemplate.queries.length} queries from "{selectedTemplate.name}" template</span>
              </div>
            )}
          </div>

          {/* Queries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">Target Questions</label>
              <span className={`text-xs font-semibold ${queryCount > 20 ? 'text-rose-600' : queryCount > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                {queryCount}/20 queries
              </span>
            </div>
            <textarea 
              rows={6}
              placeholder="What is the best CRM for remote teams?&#10;Which cloud hosting is most secure?&#10;How does Acme SaaS compare to competitors?&#10;&#10;Use templates above or write your own queries (one per line)"
              value={queriesStr}
              onChange={(e) => setQueriesStr(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition font-mono text-sm"
            />
          </div>

          {/* Competitors */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Competitors to Track (Optional, comma-separated, max 5)</label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="e.g. Competitor A, Competitor B, Competitor C"
                value={competitorsStr}
                onChange={(e) => setCompetitorsStr(e.target.value)}
                className="w-full pl-12 pr-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition text-lg"
              />
            </div>
          </div>

          {/* Deep Thinking Toggle */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-2.5 rounded-xl">
                <BrainCircuit className="text-white w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-indigo-900 text-sm">Deep Thinking Mode</h4>
                <p className="text-indigo-600 text-xs">Enhanced analysis with advanced reasoning for better insights.</p>
              </div>
            </div>
            <button 
              onClick={() => setDeepThinking(!deepThinking)}
              className="transition-all"
            >
              {deepThinking ? (
                <ToggleRight className="w-12 h-12 text-indigo-600" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-gray-300" />
              )}
            </button>
          </div>

          {/* Run Button */}
          <button 
            onClick={handleRun}
            disabled={!brand || queryCount === 0 || queryCount > 20}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-5 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3 text-xl"
          >
            <Zap className="w-6 h-6" />
            {queryCount > 0 ? `Analyze ${queryCount} Queries Across 3 AI Models` : 'Run Analysis'}
          </button>
          
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            <Cpu className="w-3 h-3" />
            Powered by GPT-4, Perplexity & Gemini via OpenRouter
          </div>
        </div>
      </div>
    </div>
  );
};

const ProcessingView: React.FC<{ 
  brand: string; 
  brandUrl: string;
  queries: string[];
  trackedCompetitors: string[];
  deepThinking: boolean;
  onComplete: (report: AEOReport) => void;
}> = ({ brand, brandUrl, queries, trackedCompetitors, deepThinking, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing agents...');

  const totalSteps = (queries.length * 3) + 3; // AI models + Intel + Playbook

  React.useEffect(() => {
    const runAnalysis = async () => {
      const results: QueryResult[] = [];
      const models = [AIModel.ChatGPT, AIModel.Perplexity, AIModel.Gemini];
      let completed = 0;
      const competitorSet = new Set<string>(trackedCompetitors);

      // Step 1: AI Responses
      for (const query of queries) {
        for (const model of models) {
          setStatus(`${deepThinking ? 'Deep' : 'Analyzing'} ${model} answer for "${query.length > 30 ? query.substring(0, 30) + '...' : query}"`);
          
          try {
            console.log(`[AEO] Fetching ${model} response for: ${query}`);
            const raw = await fetchAIResponse(model, query, deepThinking);
            console.log(`[AEO] Got response from ${model}:`, raw.substring(0, 100) + '...');
            const analysis = await analyzeResponse(brand, raw);
            console.log(`[AEO] Analysis result:`, analysis);
            
            results.push({
              id: Math.random().toString(36).substr(2, 9),
              query_text: query,
              model,
              ...analysis
            });

            analysis.competitors_mentioned.forEach(c => competitorSet.add(c));
          } catch (err: any) {
            console.error('[AEO] Error:', err);
            results.push({
              id: Math.random().toString(36).substr(2, 9),
              query_text: query,
              model,
              mentioned: false,
              position: MentionPosition.None,
              sentiment: Sentiment.Neutral,
              competitors_mentioned: [],
              citation_url: null,
              raw_response: "Analysis failed."
            });
          }
          
          completed++;
          setProgress(Math.min(80, Math.round((completed / totalSteps) * 100)));
        }
      }

      // Step 2: Competitive Intel
      setStatus('Deep reasoning on competitor landscape...');
      // Prioritize user-specified competitors, then add discovered ones
      const userCompetitors = trackedCompetitors.slice(0, 3);
      const discoveredCompetitors = Array.from(competitorSet).filter(c => !userCompetitors.includes(c));
      const topCompetitors = [...userCompetitors, ...discoveredCompetitors].slice(0, 3);
      const competitorIntel: CompetitorIntel[] = [];

      for (const comp of topCompetitors) {
        try {
          const intel = await getCompetitorMarketIntel(comp);
          competitorIntel.push(intel);
        } catch (e) {
          console.error("Failed to fetch intel for", comp);
        }
      }
      setProgress(90);

      // Step 3: Optimization Playbook
      setStatus('Synthesizing optimization playbook with Gemini 3 Pro...');
      let playbook: AEOPlaybook | undefined;
      try {
        playbook = await generateOptimizationPlaybook(brand, results, competitorIntel);
      } catch (e) {
        console.error("Failed to generate playbook", e);
      }
      
      setProgress(100);

      // Calculate Scores
      const maxPoints = (queries.length * 3) * MAX_POINTS_PER_CHECK;
      let actualPoints = 0;
      const modelPoints: Record<AIModel, number> = {
        [AIModel.ChatGPT]: 0,
        [AIModel.Perplexity]: 0,
        [AIModel.Gemini]: 0,
      };

      results.forEach(r => {
        const p = POSITION_POINTS[r.position] * SENTIMENT_MODIFIER[r.sentiment];
        actualPoints += p;
        modelPoints[r.model] += p;
      });

      onComplete({
        id: Math.random().toString(36).substr(2, 9),
        brand_name: brand,
        brand_url: brandUrl,
        created_at: Date.now(),
        overall_score: Math.round((actualPoints / maxPoints) * 100),
        model_scores: {
          [AIModel.ChatGPT]: Math.round((modelPoints[AIModel.ChatGPT] / (queries.length * MAX_POINTS_PER_CHECK)) * 100),
          [AIModel.Perplexity]: Math.round((modelPoints[AIModel.Perplexity] / (queries.length * MAX_POINTS_PER_CHECK)) * 100),
          [AIModel.Gemini]: Math.round((modelPoints[AIModel.Gemini] / (queries.length * MAX_POINTS_PER_CHECK)) * 100),
        },
        results,
        competitor_intel: competitorIntel,
        playbook
      });
    };

    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-xl mx-auto py-24 px-6 text-center">
      <div className="mb-12 relative flex justify-center">
        <div className={`w-32 h-32 border-4 rounded-full flex items-center justify-center transition-colors duration-1000 ${deepThinking ? 'border-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.3)]' : 'border-indigo-100'}`}>
          <Loader2 className={`w-12 h-12 text-indigo-600 animate-spin`} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
           {deepThinking ? <Cpu className="w-8 h-8 text-indigo-600" /> : <BrainCircuit className="w-6 h-6 text-indigo-200" />}
        </div>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">{deepThinking ? 'Advanced Reasoning Active' : 'Building Optimization Playbook'}</h2>
      <p className="text-gray-600 mb-8 h-6 italic">"{status}"</p>
      
      <div className="w-full bg-gray-100 rounded-full h-4 mb-4">
        <div 
          className="bg-indigo-600 h-4 rounded-full transition-all duration-500" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-sm font-medium">
        <span className="text-indigo-600 font-bold">{progress}% Complete</span>
        <span className="text-gray-400 flex items-center gap-1.5">
          {deepThinking && <Cpu className="w-3 h-3 text-indigo-400" />}
          {deepThinking ? 'Deep Thinking takes longer but yields better data' : 'Synthesizing strategic insights...'}
        </span>
      </div>
    </div>
  );
};

// --- Playbook Component ---
const PlaybookView: React.FC<{ playbook: AEOPlaybook; brandName?: string }> = ({ playbook, brandName }) => {
  const [copiedAction, setCopiedAction] = useState<number | null>(null);

  const copyActionToClipboard = (action: typeof playbook.actions[0], idx: number) => {
    const text = `## ${action.title}\n\n${action.description}\n\nImpact: ${action.impact} | Effort: ${action.effort}`;
    navigator.clipboard.writeText(text);
    setCopiedAction(idx);
    setTimeout(() => setCopiedAction(null), 2000);
  };

  const exportPlaybookAsMarkdown = () => {
    const md = `# AEO Optimization Playbook${brandName ? ` for ${brandName}` : ''}

## Executive Summary

${playbook.summary}

## Recommended Actions

${playbook.actions.map((a, i) => `### ${i + 1}. ${a.title}

${a.description}

- **Impact:** ${a.impact}
- **Effort:** ${a.effort}
`).join('\n')}

## Knowledge Gaps to Address

${playbook.knowledge_gaps.length > 0 
  ? playbook.knowledge_gaps.map((g, i) => `${i + 1}. ${g}`).join('\n')
  : 'No specific gaps identified.'}

---
*Generated by AEO Vision*
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aeo-playbook${brandName ? `-${brandName.toLowerCase().replace(/\s+/g, '-')}` : ''}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportActionsAsJSON = () => {
    const tasks = playbook.actions.map((a, i) => ({
      id: i + 1,
      title: a.title,
      description: a.description,
      priority: a.impact === 'High' ? 'high' : a.impact === 'Medium' ? 'medium' : 'low',
      effort: a.effort.toLowerCase(),
      status: 'todo',
      category: 'aeo-optimization',
    }));
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aeo-tasks.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      {/* Export Actions Bar */}
      <div className="flex flex-wrap gap-3 justify-end">
        <button
          onClick={exportPlaybookAsMarkdown}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition"
        >
          <Download className="w-4 h-4" />
          Export as Markdown
        </button>
        <button
          onClick={exportActionsAsJSON}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 rounded-xl text-sm font-semibold text-indigo-700 transition"
        >
          <FileText className="w-4 h-4" />
          Export Tasks (JSON)
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <Cpu className="w-40 h-40 text-indigo-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <FileText className="text-indigo-600 w-7 h-7" />
          Strategic Executive Summary
        </h3>
        <p className="text-gray-600 leading-relaxed text-lg max-w-4xl relative z-10">
          {playbook.summary}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900 px-2 flex items-center gap-2">
            <Rocket className="text-indigo-600 w-5 h-5" />
            Recommended Actions ({playbook.actions.length})
          </h3>
          {playbook.actions.map((action, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all group relative">
              <button
                onClick={() => copyActionToClipboard(action, idx)}
                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                title="Copy to clipboard"
              >
                {copiedAction === idx ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <div className="flex items-start justify-between mb-4 pr-10">
                <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{action.title}</h4>
              </div>
              <div className="flex gap-2 mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${action.impact === 'High' ? 'bg-emerald-50 text-emerald-600' : action.impact === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500'}`}>
                  {action.impact} Impact
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${action.effort === 'Easy' ? 'bg-emerald-50 text-emerald-600' : action.effort === 'Moderate' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                  {action.effort} Effort
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{action.description}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900 px-2 flex items-center gap-2">
            <AlertCircle className="text-rose-500 w-5 h-5" />
            Detected Knowledge Gaps ({playbook.knowledge_gaps.length})
          </h3>
          <div className="bg-rose-50/50 rounded-3xl p-8 border border-rose-100 h-full">
            <p className="text-rose-800 text-sm font-medium mb-6">
              AI models identified these gaps or outdated facts during analysis. Addressing these in your technical docs, FAQ, and PR will improve AEO performance.
            </p>
            <ul className="space-y-4">
              {playbook.knowledge_gaps.map((gap, idx) => (
                <li key={idx} className="flex gap-3 items-start bg-white p-4 rounded-xl shadow-sm border border-rose-50">
                  <div className="w-5 h-5 rounded-full bg-rose-100 flex-shrink-0 flex items-center justify-center text-rose-600 font-bold text-[10px]">!</div>
                  <span className="text-gray-700 text-sm leading-snug">{gap}</span>
                </li>
              ))}
              {playbook.knowledge_gaps.length === 0 && (
                <li className="text-rose-500 italic text-sm">No specific gaps identified. AI appears to have up-to-date data.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Action Plan Panel Component (Fix This) ---
const ActionPlanPanel: React.FC<{
  result: QueryResultWithAction;
  brandName: string;
  brandUrl: string;
  onGeneratePlan: () => Promise<void>;
  isGenerating: boolean;
}> = ({ result, brandName, brandUrl, onGeneratePlan, isGenerating }) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'content' | 'llmtxt' | 'gap'>('schema');
  const [copied, setCopied] = useState(false);
  const plan = result.action_plan;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!plan) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="text-center">
          <Zap className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Generate an action plan to see specific fixes for this query</p>
          <button
            onClick={onGeneratePlan}
            disabled={isGenerating}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition flex items-center gap-2 mx-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate Action Plan
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Diagnosis Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${getPriorityColor(plan.priority)}`}>
                {plan.priority} priority
              </span>
            </div>
            <p className="text-gray-700 text-sm">{plan.diagnosis}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('schema')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition ${activeTab === 'schema' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          📋 Schema
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition ${activeTab === 'content' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          ✏️ Content Fixes
        </button>
        <button
          onClick={() => setActiveTab('gap')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition ${activeTab === 'gap' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          🎯 Gap Analysis
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'schema' && (
          <div className="space-y-4">
            {plan.schema_recommendation ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getSchemaTypeIcon(plan.schema_recommendation.type)}</span>
                    <div>
                      <h4 className="font-bold text-gray-900">{plan.schema_recommendation.type}</h4>
                      <p className="text-xs text-gray-500">{plan.schema_recommendation.reason}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(plan.schema_recommendation!.jsonld_snippet, null, 2))}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-semibold transition"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy JSON-LD'}
                  </button>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{JSON.stringify(plan.schema_recommendation.jsonld_snippet, null, 2)}</code>
                </pre>
                <p className="text-xs text-gray-500">
                  Add this JSON-LD to your page's &lt;head&gt; section or use Google Tag Manager.
                </p>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No schema recommendation for this query type</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-4">
            {plan.content_fixes.length > 0 ? (
              plan.content_fixes.map((fix, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                        fix.severity === 'critical' ? 'bg-rose-100 text-rose-700' :
                        fix.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        fix.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {fix.severity}
                      </span>
                      <span className="font-semibold text-gray-900 text-sm">{fix.issue}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {fix.current && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">CURRENT:</p>
                        <p className="text-sm text-gray-600 bg-rose-50 p-2 rounded border-l-2 border-rose-300">{fix.current}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">RECOMMENDED:</p>
                      <p className="text-sm text-gray-800 bg-emerald-50 p-2 rounded border-l-2 border-emerald-400">{fix.recommended}</p>
                    </div>
                    <p className="text-xs text-gray-500 italic">{fix.rationale}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No specific content fixes identified</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gap' && (
          <div className="space-y-4">
            {plan.answer_gap_analysis ? (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-bold text-amber-800 mb-2">Your Position: {plan.answer_gap_analysis.your_position}</h4>
                  <p className="text-sm text-amber-700">Query: "{plan.answer_gap_analysis.query}"</p>
                </div>

                {plan.answer_gap_analysis.winners.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">🏆 Who Won This Query</h4>
                    <div className="space-y-2">
                      {plan.answer_gap_analysis.winners.map((winner, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-gray-900">{winner.brand}</span>
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{winner.position}</span>
                          </div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {winner.why_they_won.map((reason, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-1">✓</span>
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {plan.answer_gap_analysis.patterns_to_copy.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">📝 Patterns to Copy</h4>
                    <ul className="bg-indigo-50 rounded-lg p-3 space-y-1">
                      {plan.answer_gap_analysis.patterns_to_copy.map((pattern, idx) => (
                        <li key={idx} className="text-sm text-indigo-800 flex items-start gap-2">
                          <span className="text-indigo-500">→</span>
                          {pattern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.answer_gap_analysis.content_gaps.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">⚠️ Content Gaps</h4>
                    <ul className="bg-rose-50 rounded-lg p-3 space-y-1">
                      {plan.answer_gap_analysis.content_gaps.map((gap, idx) => (
                        <li key={idx} className="text-sm text-rose-800 flex items-start gap-2">
                          <span className="text-rose-500">✗</span>
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Gap analysis not available for this query</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- LLM.txt Panel Component ---
const LlmTxtPanel: React.FC<{
  llmTxt: BrandLlmTxt | null;
  brandName: string;
  brandUrl: string;
  queries: string[];
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
}> = ({ llmTxt, brandName, brandUrl, queries, onGenerate, isGenerating }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (llmTxt?.generated_content) {
      navigator.clipboard.writeText(llmTxt.generated_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadLlmTxt = () => {
    if (llmTxt?.generated_content) {
      const blob = new Blob([llmTxt.generated_content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'llm.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!llmTxt) {
    return (
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl p-8 border border-indigo-100">
        <div className="text-center">
          <FileText className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Generate llm.txt</h3>
          <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
            llm.txt is a machine-readable brand identity file that helps AI assistants understand who you are and what you do.
          </p>
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition flex items-center gap-2 mx-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Generate llm.txt
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`rounded-xl p-4 border ${
        llmTxt.llm_readability.status === 'present' ? 'bg-emerald-50 border-emerald-200' :
        llmTxt.llm_readability.status === 'incomplete' ? 'bg-amber-50 border-amber-200' :
        'bg-rose-50 border-rose-200'
      }`}>
        <div className="flex items-center gap-3">
          {llmTxt.llm_readability.status === 'present' ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          ) : llmTxt.llm_readability.status === 'incomplete' ? (
            <AlertCircle className="w-6 h-6 text-amber-600" />
          ) : (
            <AlertCircle className="w-6 h-6 text-rose-600" />
          )}
          <div>
            <h4 className={`font-bold ${
              llmTxt.llm_readability.status === 'present' ? 'text-emerald-800' :
              llmTxt.llm_readability.status === 'incomplete' ? 'text-amber-800' :
              'text-rose-800'
            }`}>
              llm.txt Status: {llmTxt.llm_readability.status.toUpperCase()}
            </h4>
            <p className={`text-sm ${
              llmTxt.llm_readability.status === 'present' ? 'text-emerald-700' :
              llmTxt.llm_readability.status === 'incomplete' ? 'text-amber-700' :
              'text-rose-700'
            }`}>
              Impact: {llmTxt.llm_readability.impact}
            </p>
          </div>
        </div>
      </div>

      {/* Generated Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h4 className="font-bold text-gray-900">Generated llm.txt</h4>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={downloadLlmTxt}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-semibold transition"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
        <pre className="p-4 bg-gray-900 text-gray-100 overflow-x-auto text-sm max-h-96">
          <code>{llmTxt.generated_content}</code>
        </pre>
      </div>

      {/* Instructions */}
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
        <h4 className="font-bold text-indigo-900 mb-2">📍 Where to Place llm.txt</h4>
        <ul className="text-sm text-indigo-800 space-y-1">
          <li>• <code className="bg-indigo-100 px-1 rounded">/llm.txt</code> — Primary location (recommended)</li>
          <li>• <code className="bg-indigo-100 px-1 rounded">/.well-known/llm.txt</code> — Formal location</li>
          <li>• <code className="bg-indigo-100 px-1 rounded">/ai.txt</code> — Alternative location</li>
        </ul>
      </div>
    </div>
  );
};

// --- Crawl Submission Panel Component ---
const CrawlSubmissionPanel: React.FC<{
  brandName: string;
  brandUrl: string;
  suggestedUrls: string[];
  onSubmissionComplete: (submission: CrawlSubmission) => void;
}> = ({ brandName, brandUrl, suggestedUrls, onSubmissionComplete }) => {
  const [urls, setUrls] = useState<string[]>(suggestedUrls.length > 0 ? suggestedUrls : [brandUrl]);
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CrawlSubmissionResult | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  const addUrl = () => {
    if (customUrl && !urls.includes(customUrl)) {
      setUrls([...urls, customUrl]);
      setCustomUrl('');
    }
  };

  const removeUrl = (urlToRemove: string) => {
    setUrls(urls.filter(u => u !== urlToRemove));
  };

  const handleSubmit = async () => {
    if (urls.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const submissionResult = await triggerRecrawl(
        brandUrl,
        urls,
        sitemapUrl || undefined
      );
      
      setResult(submissionResult);
      
      // Save submission for tracking
      const submission: CrawlSubmission = {
        id: generateSubmissionId(),
        brandName,
        brandUrl,
        urls,
        sitemapUrl: sitemapUrl || undefined,
        result: submissionResult,
        createdAt: new Date().toISOString(),
        recheckScheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      saveSubmission(submission);
      onSubmissionComplete(submission);
    } catch (error) {
      console.error('Crawl submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimate = estimateRecrawlTime();

  if (result) {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-emerald-800 mb-2">Crawl Request Submitted!</h4>
              <p className="text-emerald-700 text-sm mb-4">
                Your URLs have been submitted to search engines for re-crawling.
              </p>
              
              <div className="space-y-3">
                <div className={`flex items-center gap-2 text-sm ${result.indexNow.success ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {result.indexNow.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span><strong>IndexNow:</strong> {result.indexNow.message}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${result.googlePing.success ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {result.googlePing.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span><strong>Google:</strong> {result.googlePing.message}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <h4 className="font-semibold text-indigo-800 mb-2">📅 What's Next?</h4>
          <p className="text-sm text-indigo-700">
            {estimate.message}
          </p>
          <p className="text-sm text-indigo-600 mt-2">
            We recommend re-running your AEO analysis in <strong>{estimate.minDays}-{estimate.maxDays} days</strong> to check for improvements.
          </p>
        </div>

        <button
          onClick={() => setResult(null)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
        >
          ← Submit more URLs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-indigo-100">
        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-600" />
          Request Search Engine Re-Crawl
        </h4>
        <p className="text-gray-600 text-sm">
          After implementing fixes, submit your URLs to search engines to speed up re-indexing. 
          This uses IndexNow (Bing, Yandex) and Google Sitemap ping.
        </p>
      </div>

      {/* URL List */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          URLs to Submit for Re-Crawling
        </label>
        <div className="space-y-2 mb-3">
          {urls.map((url, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
              <Globe className="w-4 h-4 text-gray-400" />
              <span className="flex-1 text-sm text-gray-700 truncate">{url}</span>
              <button
                onClick={() => removeUrl(url)}
                className="text-gray-400 hover:text-rose-500 transition"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Add another URL..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            onKeyDown={(e) => e.key === 'Enter' && addUrl()}
          />
          <button
            onClick={addUrl}
            disabled={!customUrl}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg text-sm font-semibold transition"
          >
            Add
          </button>
        </div>
      </div>

      {/* Sitemap URL (Optional) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Sitemap URL <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="url"
          value={sitemapUrl}
          onChange={(e) => setSitemapUrl(e.target.value)}
          placeholder="https://yoursite.com/sitemap.xml"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          If provided, we'll ping Google with your sitemap. Otherwise, we'll try common locations.
        </p>
      </div>

      {/* IndexNow Setup Info */}
      <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-amber-800">IndexNow Setup (for best results)</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-amber-600 transition ${showInstructions ? 'rotate-180' : ''}`} />
        </button>
        
        {showInstructions && (
          <div className="mt-4 text-sm text-amber-800 space-y-2">
            <p>
              For IndexNow to work optimally, you should host a verification key file on your domain.
              Without it, submissions may still work but with lower priority.
            </p>
            <p>
              <strong>Quick setup:</strong> Create a text file with a random 32-character key and host it at your domain root.
            </p>
            <a
              href="https://www.indexnow.org/documentation"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-semibold"
            >
              Learn more about IndexNow <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || urls.length === 0}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Submitting to Search Engines...
          </>
        ) : (
          <>
            <Rocket className="w-5 h-5" />
            Submit {urls.length} URL{urls.length !== 1 ? 's' : ''} for Re-Crawling
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Submissions are sent to IndexNow (Bing, Yandex, Seznam, Naver) and Google.
      </p>
    </div>
  );
};

// --- Brand Profile Panel Component ---
const BrandProfilePanel: React.FC<{
  brandName: string;
  brandUrl: string;
  description: string;
  queries: string[];
  onProfileCreated: (profile: BrandProfile) => void;
}> = ({ brandName, brandUrl, description, queries, onProfileCreated }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Form state
  const [tagline, setTagline] = useState('');
  const [categories, setCategories] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [useCases, setUseCases] = useState('');
  const [foundingYear, setFoundingYear] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  
  // FAQ answers for queries
  const [faqAnswers, setFaqAnswers] = useState<Record<string, string>>({});

  const handleCreateProfile = () => {
    setIsCreating(true);
    
    // Build target queries with answers
    const targetQueries = queries
      .filter(q => faqAnswers[q]?.trim())
      .map(q => ({
        question: q,
        answer: faqAnswers[q].trim()
      }));

    const newProfile = createProfileFromReport(
      brandName,
      brandUrl,
      description,
      targetQueries,
      {
        tagline: tagline.trim() || undefined,
        categories: categories.split(',').map(c => c.trim()).filter(Boolean),
        targetAudience: targetAudience.trim() || undefined,
        useCases: useCases.split('\n').map(u => u.trim()).filter(Boolean),
        foundingYear: foundingYear.trim() || undefined,
        headquarters: headquarters.trim() || undefined,
        twitterUrl: twitterUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
      }
    );

    saveProfile(newProfile);
    setProfile(newProfile);
    onProfileCreated(newProfile);
    setIsCreating(false);
  };

  const handlePublish = () => {
    if (profile) {
      const published = publishProfile(profile.id);
      if (published) {
        setProfile(published);
      }
    }
  };

  const handleDownload = () => {
    if (profile) {
      downloadProfileHTML(profile);
    }
  };

  if (profile) {
    return (
      <div className="space-y-6">
        <div className={`rounded-xl p-6 border ${profile.isPublished ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-start gap-3">
            {profile.isPublished ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-bold mb-2 ${profile.isPublished ? 'text-emerald-800' : 'text-amber-800'}`}>
                {profile.isPublished ? 'Brand Profile Published!' : 'Brand Profile Created (Draft)'}
              </h4>
              <p className={`text-sm mb-3 ${profile.isPublished ? 'text-emerald-700' : 'text-amber-700'}`}>
                {profile.isPublished 
                  ? 'Your brand profile page is ready. Download and host it on your domain for maximum AI visibility.'
                  : 'Review your profile and publish when ready.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  {showPreview ? 'Hide Preview' : 'Preview Page'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition"
                >
                  <Download className="w-4 h-4" />
                  Download HTML
                </button>
                {!profile.isPublished && (
                  <button
                    onClick={handlePublish}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
                  >
                    <Check className="w-4 h-4" />
                    Mark as Published
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {showPreview && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600">Page Preview</span>
              <span className="text-xs text-gray-400">brands/{profile.slug}</span>
            </div>
            <iframe
              srcDoc={generateBrandProfileHTML(profile)}
              className="w-full h-[600px] bg-white"
              title="Brand Profile Preview"
            />
          </div>
        )}

        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <h4 className="font-bold text-indigo-900 mb-2">📍 How to Use This Page</h4>
          <ul className="text-sm text-indigo-800 space-y-1">
            <li>• <strong>Self-host:</strong> Download the HTML and host at <code className="bg-indigo-100 px-1 rounded">/about</code> or <code className="bg-indigo-100 px-1 rounded">/brand</code></li>
            <li>• <strong>Schema extraction:</strong> The JSON-LD schemas are embedded and ready for AI crawlers</li>
            <li>• <strong>Link building:</strong> Link to this page from your main site to boost authority</li>
          </ul>
        </div>

        <button
          onClick={() => setProfile(null)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
        >
          ← Create a new profile
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl p-6 border border-indigo-100">
        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          Create Brand Facts Page
        </h4>
        <p className="text-gray-600 text-sm">
          Generate a structured brand profile page with embedded JSON-LD schemas. 
          This page is optimized for AI crawlers and can be hosted on your domain.
        </p>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Tagline</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g., Banking on stablecoins"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Categories</label>
          <input
            type="text"
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            placeholder="e.g., Fintech, Payments, Crypto"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Target Audience</label>
        <input
          type="text"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          placeholder="e.g., Freelancers in emerging markets looking for stable payment solutions"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Primary Use Cases</label>
        <textarea
          value={useCases}
          onChange={(e) => setUseCases(e.target.value)}
          placeholder="One use case per line, e.g.:&#10;Receive freelance payments in USDC&#10;Send money internationally&#10;Earn yield on holdings"
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Company Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Founded</label>
          <input
            type="text"
            value={foundingYear}
            onChange={(e) => setFoundingYear(e.target.value)}
            placeholder="e.g., 2024"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Headquarters</label>
          <input
            type="text"
            value={headquarters}
            onChange={(e) => setHeadquarters(e.target.value)}
            placeholder="e.g., San Francisco, CA"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Twitter URL</label>
          <input
            type="url"
            value={twitterUrl}
            onChange={(e) => setTwitterUrl(e.target.value)}
            placeholder="https://twitter.com/..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* FAQ Answers */}
      {queries.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            FAQ Answers <span className="font-normal text-gray-400">(for target queries)</span>
          </label>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {queries.slice(0, 5).map((query, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Q: {query}</p>
                <textarea
                  value={faqAnswers[query] || ''}
                  onChange={(e) => setFaqAnswers(prev => ({ ...prev, [query]: e.target.value }))}
                  placeholder="Write a concise answer that positions your brand..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
          {queries.length > 5 && (
            <p className="text-xs text-gray-400 mt-2">Showing first 5 queries. More can be added after creation.</p>
          )}
        </div>
      )}

      {/* Create Button */}
      <button
        onClick={handleCreateProfile}
        disabled={isCreating}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
      >
        {isCreating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating Profile...
          </>
        ) : (
          <>
            <FileText className="w-5 h-5" />
            Create Brand Profile Page
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        The generated page includes Organization and FAQPage schemas for optimal AI visibility.
      </p>
    </div>
  );
};

// --- Platform Connections Panel Component ---
const PlatformConnectionsPanel: React.FC<{
  schemaJson?: object;
  llmTxtContent?: string;
  brandName: string;
}> = ({ schemaJson, llmTxtContent, brandName }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<'github' | 'vercel' | 'netlify' | null>(null);
  const [showCode, setShowCode] = useState(false);

  const platforms: ('github' | 'vercel' | 'netlify')[] = ['github', 'vercel', 'netlify'];

  const getStatusBadge = (platform: 'github' | 'vercel' | 'netlify') => {
    const connected = isPlatformConnected(platform);
    return connected ? (
      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Connected</span>
    ) : (
      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Not Connected</span>
    );
  };

  const schemaCode = schemaJson ? generateSchemaInjection('html', schemaJson, brandName) : null;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-6 border border-indigo-100">
        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Github className="w-5 h-5 text-gray-700" />
          Platform Integrations
        </h4>
        <p className="text-gray-600 text-sm">
          Connect your deployment platforms to automatically deploy schema fixes and llm.txt files.
        </p>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map((platform) => {
          const info = PLATFORM_INFO[platform];
          const connected = isPlatformConnected(platform);
          
          return (
            <div
              key={platform}
              className={`border rounded-xl p-4 transition cursor-pointer ${
                selectedPlatform === platform 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
              onClick={() => setSelectedPlatform(selectedPlatform === platform ? null : platform)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{info.icon}</span>
                  <span className="font-bold text-gray-900">{info.name}</span>
                </div>
                {getStatusBadge(platform)}
              </div>
              <p className="text-xs text-gray-500 mb-3">{info.description}</p>
              <ul className="text-xs text-gray-400 space-y-1">
                {info.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span className="text-indigo-400">•</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Selected Platform Details */}
      {selectedPlatform && (
        <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-6">
          <h5 className="font-bold text-indigo-900 mb-3">
            {PLATFORM_INFO[selectedPlatform].icon} {PLATFORM_INFO[selectedPlatform].name} Setup
          </h5>
          
          {selectedPlatform === 'github' && (
            <div className="space-y-4">
              <p className="text-sm text-indigo-800">
                GitHub integration allows automatic PR creation with your schema fixes. 
                This requires OAuth setup with a GitHub App.
              </p>
              <div className="bg-white rounded-lg p-4 border border-indigo-200">
                <h6 className="font-semibold text-gray-800 mb-2">Manual Alternative:</h6>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li>1. Copy the schema code below</li>
                  <li>2. Create a new file in your repo</li>
                  <li>3. Commit and push the changes</li>
                </ol>
              </div>
              {schemaCode && (
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                >
                  {showCode ? 'Hide' : 'Show'} Schema Code <ChevronDown className={`w-4 h-4 transition ${showCode ? 'rotate-180' : ''}`} />
                </button>
              )}
              {showCode && schemaCode && (
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-60">
                    {schemaCode.content}
                  </pre>
                  <button
                    onClick={() => navigator.clipboard.writeText(schemaCode.content)}
                    className="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs"
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedPlatform === 'vercel' && (
            <div className="space-y-4">
              <p className="text-sm text-indigo-800">
                Vercel integration enables one-click deployment of llm.txt and schema files.
                This requires connecting your Vercel account via OAuth.
              </p>
              <div className="bg-white rounded-lg p-4 border border-indigo-200">
                <h6 className="font-semibold text-gray-800 mb-2">Manual Alternative:</h6>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li>1. Download your llm.txt file from the section above</li>
                  <li>2. Add it to your project's <code className="bg-gray-100 px-1 rounded">public/</code> folder</li>
                  <li>3. Deploy via <code className="bg-gray-100 px-1 rounded">vercel deploy</code></li>
                </ol>
              </div>
            </div>
          )}

          {selectedPlatform === 'netlify' && (
            <div className="space-y-4">
              <p className="text-sm text-indigo-800">
                Netlify integration allows direct file uploads to your site without rebuilding.
                This requires connecting your Netlify account via OAuth.
              </p>
              <div className="bg-white rounded-lg p-4 border border-indigo-200">
                <h6 className="font-semibold text-gray-800 mb-2">Manual Alternative:</h6>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li>1. Download your llm.txt file from the section above</li>
                  <li>2. Drag and drop to Netlify's deploy UI</li>
                  <li>3. Or add to your repo and trigger a deploy</li>
                </ol>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-indigo-200">
            <p className="text-xs text-indigo-600">
              <strong>Coming Soon:</strong> Full OAuth integration for automated deployments. 
              For now, use the manual steps above.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h5 className="font-semibold text-gray-700 mb-3">Quick Export Options</h5>
        <div className="flex flex-wrap gap-2">
          {schemaCode && (
            <button
              onClick={() => {
                const blob = new Blob([schemaCode.content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = schemaCode.path.split('/').pop() || 'schema.html';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <Download className="w-4 h-4" />
              Download Schema
            </button>
          )}
          {llmTxtContent && (
            <button
              onClick={() => {
                const blob = new Blob([llmTxtContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'llm.txt';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <Download className="w-4 h-4" />
              Download llm.txt
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Perplexity Submission Guide Component ---
const PerplexityGuidePanel: React.FC<{
  brandName: string;
  brandUrl: string;
  perplexityScore?: number;
}> = ({ brandName, brandUrl, perplexityScore }) => {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showPageContent, setShowPageContent] = useState(false);

  const toggleStep = (step: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(step)) {
      newCompleted.delete(step);
    } else {
      newCompleted.add(step);
    }
    setCompletedSteps(newCompleted);
  };

  const generatePerplexityPageContent = () => {
    return `# ${brandName}: Complete Guide

## What is ${brandName}?

${brandName} is a solution designed to help users achieve their goals more effectively. Visit ${brandUrl} to learn more.

## Key Features

- **Feature 1**: Description of your first key feature
- **Feature 2**: Description of your second key feature
- **Feature 3**: Description of your third key feature

## Who is it for?

${brandName} is ideal for [describe your target audience here].

## How does ${brandName} compare to alternatives?

| Feature | ${brandName} | Competitor A | Competitor B |
|---------|-------------|--------------|--------------|
| Feature 1 | ✅ | ❌ | ✅ |
| Feature 2 | ✅ | ✅ | ❌ |
| Pricing | Competitive | Higher | Similar |

## Frequently Asked Questions

### What problem does ${brandName} solve?
[Your answer here]

### How do I get started with ${brandName}?
[Your answer here]

### What makes ${brandName} different?
[Your answer here]

---

*Sources: [Official Website](${brandUrl})*`;
  };

  const steps = [
    {
      title: "Optimize Your Website Content",
      description: "Ensure your website has clear, structured content that answers common questions about your product/service.",
      action: "Review your site's FAQ and About pages",
      link: brandUrl
    },
    {
      title: "Create a Perplexity Page",
      description: "Perplexity allows users to create 'Pages' - research summaries that become citable sources.",
      action: "Create a comprehensive page about your brand",
      link: "https://www.perplexity.ai/page"
    },
    {
      title: "Submit to Perplexity Discover",
      description: "If Perplexity has a content submission form, submit your best content for consideration.",
      action: "Check for submission options",
      link: "https://www.perplexity.ai"
    },
    {
      title: "Build Authoritative Backlinks",
      description: "Perplexity values authoritative sources. Get mentioned on reputable sites in your industry.",
      action: "Focus on PR and content marketing"
    },
    {
      title: "Monitor & Iterate",
      description: "Re-run AEO analysis in 1-2 weeks to track improvements in Perplexity visibility.",
      action: "Schedule a follow-up check"
    }
  ];

  const completionPercent = Math.round((completedSteps.size / steps.length) * 100);

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className={`rounded-xl p-6 border ${
        perplexityScore && perplexityScore >= 60 ? 'bg-emerald-50 border-emerald-200' :
        perplexityScore && perplexityScore >= 30 ? 'bg-amber-50 border-amber-200' :
        'bg-rose-50 border-rose-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`font-bold mb-1 ${
              perplexityScore && perplexityScore >= 60 ? 'text-emerald-800' :
              perplexityScore && perplexityScore >= 30 ? 'text-amber-800' :
              'text-rose-800'
            }`}>
              Perplexity Visibility: {perplexityScore !== undefined ? `${perplexityScore}%` : 'Not Checked'}
            </h4>
            <p className={`text-sm ${
              perplexityScore && perplexityScore >= 60 ? 'text-emerald-700' :
              perplexityScore && perplexityScore >= 30 ? 'text-amber-700' :
              'text-rose-700'
            }`}>
              {perplexityScore && perplexityScore >= 60 
                ? 'Good visibility! Keep optimizing to maintain your position.'
                : perplexityScore && perplexityScore >= 30
                ? 'Moderate visibility. Follow the steps below to improve.'
                : 'Low visibility. Significant optimization needed.'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{completionPercent}%</div>
            <div className="text-xs text-gray-500">guide complete</div>
          </div>
        </div>
      </div>

      {/* Steps Checklist */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div 
            key={idx}
            className={`border rounded-xl p-4 transition ${
              completedSteps.has(idx) 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-white border-gray-200 hover:border-indigo-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleStep(idx)}
                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                  completedSteps.has(idx)
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-gray-300 hover:border-indigo-500'
                }`}
              >
                {completedSteps.has(idx) && <Check className="w-4 h-4" />}
              </button>
              <div className="flex-1">
                <h5 className={`font-semibold ${completedSteps.has(idx) ? 'text-emerald-800' : 'text-gray-900'}`}>
                  {idx + 1}. {step.title}
                </h5>
                <p className={`text-sm mt-1 ${completedSteps.has(idx) ? 'text-emerald-700' : 'text-gray-600'}`}>
                  {step.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-400">→ {step.action}</span>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Perplexity Page Content Generator */}
      <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4">
        <button
          onClick={() => setShowPageContent(!showPageContent)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-indigo-800">Perplexity Page Template</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-indigo-600 transition ${showPageContent ? 'rotate-180' : ''}`} />
        </button>
        
        {showPageContent && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-indigo-700">
              Use this template to create a Perplexity Page about your brand. Customize it with your specific details.
            </p>
            <div className="relative">
              <pre className="bg-white border border-indigo-200 rounded-lg p-4 text-xs text-gray-700 overflow-x-auto max-h-60">
                {generatePerplexityPageContent()}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatePerplexityPageContent());
                }}
                className="absolute top-2 right-2 px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-xs font-semibold transition"
              >
                Copy
              </button>
            </div>
            <a
              href="https://www.perplexity.ai/page"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
            >
              Create Perplexity Page <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>Note:</strong> Perplexity doesn't have a public API for direct content submission. 
          These steps help optimize your content for Perplexity's crawlers and increase the likelihood 
          of being cited in AI-generated answers.
        </p>
      </div>
    </div>
  );
};

// --- Competitor Intel Component ---
const CompetitorIntelCard: React.FC<{ 
  intel: CompetitorIntel; 
  onRefine: (oldName: string, name: string, url: string) => Promise<void>; 
}> = ({ intel, onRefine }) => {
  const [url, setUrl] = useState(intel.url || '');
  const [name, setName] = useState(intel.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (val: string) => {
    if (!val) return true;
    const pattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return pattern.test(val);
  };

  const handleRefine = async () => {
    if (!url) return;
    if (!validateUrl(url)) {
      setError("Please enter a valid URL (e.g. example.com)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onRefine(intel.name, name, url);
    } catch (err: any) {
      setError(err.message || "Failed to fetch competitor intel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col hover:border-indigo-200 transition-all group relative overflow-hidden ${loading ? 'opacity-70' : 'opacity-100'}`}>
      {loading && (
        <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden z-20">
          <div className="h-full bg-indigo-600 animate-[loading-bar_1.5s_infinite_linear]" style={{ width: '30%' }}></div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex-shrink-0">
          <Target className="w-7 h-7" />
        </div>
        <div className="overflow-hidden flex-grow">
          {isEditingName ? (
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xl font-extrabold text-gray-900 border-b-2 border-indigo-200 outline-none focus:border-indigo-600 transition bg-transparent"
              autoFocus
            />
          ) : (
            <h3 className="text-xl font-extrabold text-gray-900 truncate" title={name}>{name}</h3>
          )}
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Competitor Profile</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Refine Identity & Sources</label>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <LinkIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${error ? 'text-rose-400' : 'text-gray-400'}`} />
              <input 
                type="text" 
                placeholder="Target website URL (e.g. comp.com)"
                value={url}
                onChange={(e) => {setUrl(e.target.value); if(error) setError(null);}}
                disabled={loading}
                className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border outline-none transition disabled:bg-gray-50 ${error ? 'border-rose-300 ring-2 ring-rose-50' : 'border-gray-100 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500'}`}
              />
            </div>
            
            <button 
              onClick={() => setIsEditingName(!isEditingName)}
              className={`p-2 rounded-xl transition flex items-center justify-center ${isEditingName ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {isEditingName ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            </button>

            <button 
              onClick={handleRefine}
              disabled={!url || loading}
              className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition flex items-center gap-2 font-bold text-[10px]"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Update
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-semibold mt-0.5">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 flex-grow">
        <div>
          <div className="flex items-center gap-2 mb-2 text-gray-900 font-bold text-sm">
            <BarChart className="w-4 h-4 text-gray-400" />
            Market Summary
          </div>
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{intel.market_summary}</p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2 text-gray-900 font-bold text-sm">
            <Award className="w-4 h-4 text-gray-400" />
            Perceived Strengths
          </div>
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{intel.perceived_strength}</p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Grounding Sources</h4>
        <div className="space-y-2">
          {intel.source_urls.map((source, sIdx) => (
            <a key={sIdx} href={source.uri} target="_blank" rel="noreferrer" className="flex items-center justify-between text-xs text-indigo-600 hover:underline group/link">
              <span className="truncate max-w-[180px] font-medium">{source.title}</span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100" />
            </a>
          ))}
          {intel.source_urls.length === 0 && <span className="text-xs text-gray-300 italic">No direct sources.</span>}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }`}} />
    </div>
  );
};

const ResultsView: React.FC<{ 
  report: AEOReport; 
  onReset: () => void;
  onUpdateIntel: (oldName: string, newIntel: CompetitorIntel) => void;
}> = ({ report, onReset, onUpdateIntel }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'playbook' | 'visibility' | 'actions' | 'competitors'>('playbook');
  
  // Action Engine state
  const [actionPlans, setActionPlans] = useState<Map<string, ActionPlan>>(new Map());
  const [generatingPlanFor, setGeneratingPlanFor] = useState<string | null>(null);
  const [llmTxt, setLlmTxt] = useState<BrandLlmTxt | null>(null);
  const [generatingLlmTxt, setGeneratingLlmTxt] = useState(false);

  const handleRefineIntel = async (oldName: string, name: string, url: string) => {
    const refined = await getCompetitorMarketIntel(name, url);
    onUpdateIntel(oldName, refined);
  };

  // Generate action plan for a specific query result
  const handleGenerateActionPlan = async (result: QueryResult) => {
    setGeneratingPlanFor(result.id);
    try {
      const plan = await generateActionPlan(report.brand_name, report.brand_url || '', result);
      setActionPlans(prev => new Map(prev).set(result.id, plan));
    } catch (err) {
      console.error('Failed to generate action plan:', err);
    } finally {
      setGeneratingPlanFor(null);
    }
  };

  // Generate llm.txt for the brand
  const handleGenerateLlmTxt = async () => {
    setGeneratingLlmTxt(true);
    try {
      const queries = report.results.map(r => r.query_text);
      const generated = await generateLlmTxt(
        report.brand_name,
        report.brand_url || '',
        report.industry || 'General',
        queries
      );
      setLlmTxt(generated);
    } catch (err) {
      console.error('Failed to generate llm.txt:', err);
    } finally {
      setGeneratingLlmTxt(false);
    }
  };

  // Get results with action plans attached
  const resultsWithActions: QueryResultWithAction[] = report.results.map(r => ({
    ...r,
    action_plan: actionPlans.get(r.id),
  }));

  // Count results needing fixes (not mentioned or poor position)
  const needsFixCount = report.results.filter(r => !r.mentioned || r.position === MentionPosition.Tertiary).length;

  const getScoreColor = (score: number) => {
    if (score >= 60) return 'text-emerald-600';
    if (score >= 30) return 'text-amber-500';
    return 'text-rose-600';
  };

  const getBadgeColor = (position: MentionPosition) => {
    switch (position) {
      case MentionPosition.Primary: return 'bg-emerald-100 text-emerald-700';
      case MentionPosition.Secondary: return 'bg-blue-100 text-blue-700';
      case MentionPosition.Tertiary: return 'bg-gray-100 text-gray-700';
      default: return 'bg-rose-100 text-rose-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 text-indigo-600 font-semibold mb-2">
            <CheckCircle2 className="w-5 h-5" />
            Playbook Generated
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900">
            AEO Vision: {report.brand_name}
          </h1>
          {report.brand_url && (
            <a href={report.brand_url.startsWith('http') ? report.brand_url : `https://${report.brand_url}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline mt-2 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
              <Globe className="w-4 h-4" />
              {report.brand_url}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => exportToCSV(report)}
            className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button 
            onClick={() => exportToPDF(report)}
            className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button onClick={onReset} className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold shadow-lg shadow-indigo-100 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Omni-Score</span>
          <div className={`text-7xl font-black ${getScoreColor(report.overall_score)}`}>{report.overall_score}%</div>
          <p className="text-gray-500 mt-4 text-sm px-4">Visibility weighted by position and sentiment.</p>
        </div>
        
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.entries(report.model_scores) as [string, number][]).map(([model, score]) => (
            <div key={model} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm group">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 block group-hover:text-indigo-600 transition-colors">{model}</span>
              <div className={`text-4xl font-bold mb-4 ${getScoreColor(score)}`}>{score}%</div>
              <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${score >= 60 ? 'bg-emerald-500' : score >= 30 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('playbook')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'playbook' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Lightbulb className="w-4 h-4" />
          AEO Playbook
        </button>
        <button 
          onClick={() => setActiveTab('actions')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'actions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Wrench className="w-4 h-4" />
          Action Engine
          {needsFixCount > 0 && (
            <span className="bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{needsFixCount}</span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('visibility')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'visibility' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Search className="w-4 h-4" />
          Query Logs
        </button>
        <button 
          onClick={() => setActiveTab('competitors')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'competitors' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users className="w-4 h-4" />
          Competitors
        </button>
      </div>

      {activeTab === 'playbook' ? (
        report.playbook ? <PlaybookView playbook={report.playbook} brandName={report.brand_name} /> : (
          <div className="py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
             <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
             <p className="text-gray-400">Playbook not generated for this report.</p>
          </div>
        )
      ) : activeTab === 'actions' ? (
        <div className="space-y-8">
          {/* Action Engine Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                  <Wrench className="w-7 h-7" />
                  Action Engine
                </h2>
                <p className="text-indigo-100 max-w-xl">
                  Transform visibility data into executable fixes. Get JSON-LD schemas, content recommendations, and llm.txt generation for each query.
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black">{needsFixCount}</div>
                <div className="text-indigo-200 text-sm">queries need fixes</div>
              </div>
            </div>
          </div>

          {/* llm.txt Section */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FileCode className="w-6 h-6 text-indigo-600" />
              llm.txt Generation
            </h3>
            <LlmTxtPanel
              llmTxt={llmTxt}
              brandName={report.brand_name}
              brandUrl={report.brand_url || ''}
              queries={report.results.map(r => r.query_text)}
              onGenerate={handleGenerateLlmTxt}
              isGenerating={generatingLlmTxt}
            />
          </div>

          {/* Search Engine Re-Crawl Section */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Rocket className="w-6 h-6 text-indigo-600" />
              Request Re-Crawl
            </h3>
            <CrawlSubmissionPanel
              brandName={report.brand_name}
              brandUrl={report.brand_url || ''}
              suggestedUrls={report.brand_url ? [report.brand_url] : []}
              onSubmissionComplete={(submission) => {
                console.log('Crawl submission complete:', submission);
              }}
            />
          </div>

          {/* Brand Facts Page Section */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Layers className="w-6 h-6 text-indigo-600" />
              Brand Facts Page
            </h3>
            <BrandProfilePanel
              brandName={report.brand_name}
              brandUrl={report.brand_url || ''}
              description={report.playbook?.executive_summary || `${report.brand_name} is a company focused on delivering value to its customers.`}
              queries={report.results.map(r => r.query_text)}
              onProfileCreated={(profile) => {
                console.log('Brand profile created:', profile);
              }}
            />
          </div>

          {/* Perplexity Optimization Guide */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <BrainCircuit className="w-6 h-6 text-indigo-600" />
              Perplexity Optimization
            </h3>
            <PerplexityGuidePanel
              brandName={report.brand_name}
              brandUrl={report.brand_url || ''}
              perplexityScore={report.model_scores['Perplexity']}
            />
          </div>

          {/* Platform Integrations */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Github className="w-6 h-6 text-gray-700" />
              Deploy to Platform
            </h3>
            <PlatformConnectionsPanel
              brandName={report.brand_name}
              schemaJson={actionPlans.size > 0 ? (Array.from(actionPlans.values())[0] as ActionPlan)?.schema_recommendation?.jsonld_snippet : undefined}
              llmTxtContent={llmTxt?.generated_content}
            />
          </div>

          {/* Query-specific Action Plans */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <Code className="w-6 h-6 text-indigo-600" />
                Query-Specific Fixes
              </h3>
              <p className="text-gray-500 text-sm mt-1">Click on a query to generate JSON-LD schema, content fixes, and gap analysis</p>
            </div>
            
            <div className="divide-y divide-gray-100">
              {resultsWithActions
                .sort((a, b) => {
                  // Sort by priority: not mentioned first, then by position
                  const scoreA = a.mentioned ? (a.position === MentionPosition.Primary ? 3 : a.position === MentionPosition.Secondary ? 2 : 1) : 0;
                  const scoreB = b.mentioned ? (b.position === MentionPosition.Primary ? 3 : b.position === MentionPosition.Secondary ? 2 : 1) : 0;
                  return scoreA - scoreB;
                })
                .map((res) => (
                  <div key={res.id} className="border-b border-gray-100 last:border-b-0">
                    <div 
                      className={`p-6 cursor-pointer hover:bg-gray-50 transition ${expandedId === res.id ? 'bg-indigo-50/30' : ''}`}
                      onClick={() => setExpandedId(expandedId === res.id ? null : res.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            !res.mentioned ? 'bg-rose-500' :
                            res.position === MentionPosition.Primary ? 'bg-emerald-500' :
                            res.position === MentionPosition.Secondary ? 'bg-blue-500' :
                            'bg-amber-500'
                          }`} />
                          <div>
                            <p className="font-semibold text-gray-900">{res.query_text}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{res.model}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${getBadgeColor(res.position)}`}>
                                {res.mentioned ? res.position : 'Not Mentioned'}
                              </span>
                              {res.action_plan && (
                                <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(res.action_plan.priority)}`}>
                                  {res.action_plan.priority} priority
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {!res.action_plan && !res.mentioned && (
                            <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded font-semibold">Needs Fix</span>
                          )}
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition ${expandedId === res.id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </div>
                    
                    {expandedId === res.id && (
                      <div className="px-6 pb-6">
                        <ActionPlanPanel
                          result={res}
                          brandName={report.brand_name}
                          brandUrl={report.brand_url || ''}
                          onGeneratePlan={() => handleGenerateActionPlan(res)}
                          isGenerating={generatingPlanFor === res.id}
                        />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Export Actions */}
          {actionPlans.size > 0 && (
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  const schemas = exportAllSchemas(Array.from(actionPlans.values()));
                  const blob = new Blob([schemas], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${report.brand_name.toLowerCase().replace(/\s+/g, '-')}-schemas.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition"
              >
                <Download className="w-4 h-4" />
                Export All Schemas (JSON)
              </button>
            </div>
          )}
        </div>
      ) : activeTab === 'visibility' ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-8 py-4">Query</th>
                  <th className="px-8 py-4">AI Engine</th>
                  <th className="px-8 py-4">Rank</th>
                  <th className="px-8 py-4">Sentiment</th>
                  <th className="px-8 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.results.map((res) => (
                  <React.Fragment key={res.id}>
                    <tr className={`hover:bg-gray-50 transition cursor-pointer ${expandedId === res.id ? 'bg-indigo-50/20' : ''}`} onClick={() => setExpandedId(expandedId === res.id ? null : res.id)}>
                      <td className="px-8 py-6 font-semibold text-gray-900 truncate max-w-xs">{res.query_text}</td>
                      <td className="px-8 py-6 text-sm text-gray-500">{res.model}</td>
                      <td className="px-8 py-6">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${getBadgeColor(res.position)}`}>
                          {res.mentioned ? res.position : 'None'}
                        </span>
                      </td>
                      <td className="px-8 py-6 capitalize text-sm">{res.mentioned ? res.sentiment : '-'}</td>
                      <td className="px-8 py-6 text-right"><ChevronRight className={`w-5 h-5 transition ${expandedId === res.id ? 'rotate-90 text-indigo-600' : 'text-gray-300'}`} /></td>
                    </tr>
                    {expandedId === res.id && (
                      <tr className="bg-gray-50/30">
                        <td colSpan={5} className="px-8 py-10 border-y border-indigo-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="col-span-2">
                              <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Raw Model Answer</h4>
                              <div className="bg-white p-6 rounded-2xl border border-indigo-100 text-sm leading-relaxed italic text-gray-700 shadow-sm">
                                "{res.raw_response}"
                              </div>
                            </div>
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Source Citations</h4>
                                {res.citation_url ? (
                                  <a href={res.citation_url} target="_blank" className="flex items-center gap-2 bg-white p-4 rounded-xl border border-indigo-100 text-indigo-600 font-bold text-xs hover:bg-indigo-50 transition shadow-sm">
                                    <Globe className="w-4 h-4" /> Grounding URL <ExternalLink className="w-3 h-3 ml-auto" />
                                  </a>
                                ) : <p className="text-gray-400 italic text-xs">No citations found in model turn.</p>}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Competitive Mentions</h4>
                                <div className="flex flex-wrap gap-2">
                                  {res.competitors_mentioned.map((c, i) => (
                                    <span key={i} className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-lg">{c}</span>
                                  ))}
                                  {res.competitors_mentioned.length === 0 && <span className="text-gray-300 text-xs">None</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {report.competitor_intel.map((comp, idx) => (
            <CompetitorIntelCard key={idx} intel={comp} onRefine={handleRefineIntel} />
          ))}
          {report.competitor_intel.length === 0 && (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
               <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
               <p className="text-gray-400">No competitors identified in analysis logs.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main App Controller ---

// Simple Trend Chart Component (SVG-based, no external deps)
const TrendChart: React.FC<{
  data: { date: number; score: number }[];
  height?: number;
}> = ({ data, height = 120 }) => {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-50 rounded-xl text-gray-400 text-sm">
        Need at least 2 data points to show trend
      </div>
    );
  }

  const width = 400;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const minScore = Math.min(...data.map(d => d.score));
  const maxScore = Math.max(...data.map(d => d.score));
  const scoreRange = maxScore - minScore || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((d.score - minScore) / scoreRange) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  const firstScore = data[0].score;
  const lastScore = data[data.length - 1].score;
  const change = lastScore - firstScore;
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LineChart className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-gray-900">Score Trend</span>
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold ${
          trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-gray-500'
        }`}>
          {trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
          {trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
          {trend === 'stable' && <Minus className="w-4 h-4" />}
          {change > 0 ? '+' : ''}{change}% overall
        </div>
      </div>
      
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(pct => {
          const y = padding + chartHeight - (pct / 100) * chartHeight;
          return (
            <g key={pct}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e7eb" strokeDasharray="4" />
              <text x={padding - 5} y={y + 4} fontSize="10" fill="#9ca3af" textAnchor="end">
                {Math.round(minScore + (pct / 100) * scoreRange)}
              </text>
            </g>
          );
        })}
        
        {/* Area fill */}
        <path d={areaD} fill="url(#areaGradient)" />
        
        {/* Line */}
        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#6366f1" />
            <circle cx={p.x} cy={p.y} r="6" fill="#6366f1" fillOpacity="0.2" />
          </g>
        ))}
      </svg>
      
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>{new Date(data[0].date).toLocaleDateString()}</span>
        <span>{new Date(data[data.length - 1].date).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

// History View Component with Trend Support
const HistoryView: React.FC<{
  onSelectReport: (report: AEOReport) => void;
  onBack: () => void;
}> = ({ onSelectReport, onBack }) => {
  const [reports, setReports] = useState<AEOReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'brands'>('brands');

  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await getReports();
        setReports(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  // Group reports by brand
  const brandGroups = useMemo(() => {
    const groups = new Map<string, AEOReport[]>();
    reports.forEach(r => {
      const existing = groups.get(r.brand_name) || [];
      existing.push(r);
      groups.set(r.brand_name, existing);
    });
    return Array.from(groups.entries()).map(([name, reports]) => ({
      name,
      reports: reports.sort((a, b) => b.created_at - a.created_at),
      latestScore: reports[0]?.overall_score || 0,
      reportCount: reports.length,
      trendData: reports
        .sort((a, b) => a.created_at - b.created_at)
        .map(r => ({ date: r.created_at, score: r.overall_score })),
    }));
  }, [reports]);

  const handleDelete = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this report?')) return;
    try {
      await deleteReport(reportId);
      setReports(reports.filter(r => r.id !== reportId));
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleSelect = async (reportId: string) => {
    try {
      const fullReport = await getReportById(reportId);
      if (fullReport) onSelectReport(fullReport);
    } catch (err: any) {
      alert('Failed to load report: ' + err.message);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 60) return 'text-emerald-600';
    if (score >= 30) return 'text-amber-500';
    return 'text-rose-600';
  };

  const getTrendIndicator = (data: { date: number; score: number }[]) => {
    if (data.length < 2) return null;
    const change = data[data.length - 1].score - data[0].score;
    if (change > 2) return { icon: ArrowUpRight, color: 'text-emerald-600', text: `+${change}%` };
    if (change < -2) return { icon: ArrowDownRight, color: 'text-rose-600', text: `${change}%` };
    return { icon: Minus, color: 'text-gray-400', text: 'Stable' };
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-4">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Home
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-2">Track brand visibility trends over time</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('brands')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${viewMode === 'brands' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
          >
            <PieChart className="w-4 h-4 inline mr-2" />
            By Brand
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${viewMode === 'all' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            All Reports
          </button>
        </div>
      </div>

      {!isSupabaseConfigured() && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800">Database Not Configured</h4>
              <p className="text-amber-700 text-sm mt-1">
                Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables to enable report persistence and historical tracking.
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <p className="text-gray-500">{error}</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <BarChart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">No saved reports yet</p>
          <button onClick={onBack} className="mt-4 text-indigo-600 font-semibold hover:underline">
            Run your first analysis
          </button>
        </div>
      ) : viewMode === 'brands' ? (
        /* Brand-grouped view with trends */
        <div className="space-y-6">
          {brandGroups.map(group => {
            const trend = getTrendIndicator(group.trendData);
            const TrendIcon = trend?.icon || Minus;
            
            return (
              <div key={group.name} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setSelectedBrand(selectedBrand === group.name ? null : group.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`text-4xl font-black ${getScoreColor(group.latestScore)}`}>
                        {group.latestScore}%
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{group.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{group.reportCount} report{group.reportCount !== 1 ? 's' : ''}</span>
                          {trend && (
                            <span className={`flex items-center gap-1 ${trend.color}`}>
                              <TrendIcon className="w-3 h-3" />
                              {trend.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition ${selectedBrand === group.name ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                
                {selectedBrand === group.name && (
                  <div className="border-t border-gray-100 p-6 bg-gray-50/50">
                    {group.trendData.length >= 2 && (
                      <div className="mb-6">
                        <TrendChart data={group.trendData} />
                      </div>
                    )}
                    
                    <h4 className="font-semibold text-gray-700 mb-3">Report History</h4>
                    <div className="space-y-2">
                      {group.reports.map(report => (
                        <div 
                          key={report.id}
                          onClick={() => handleSelect(report.id)}
                          className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 cursor-pointer transition group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`text-xl font-bold ${getScoreColor(report.overall_score)}`}>
                              {report.overall_score}%
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => handleDelete(report.id, e)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </button>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* All reports chronological view */
        <div className="space-y-4">
          {reports.map(report => (
            <div 
              key={report.id}
              onClick={() => handleSelect(report.id)}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`text-3xl font-black ${getScoreColor(report.overall_score)}`}>
                    {report.overall_score}%
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {report.brand_name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => handleDelete(report.id, e)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <AlertCircle className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'processing' | 'results' | 'history'>('landing');
  const [activeBrand, setActiveBrand] = useState('');
  const [activeBrandUrl, setActiveBrandUrl] = useState('');
  const [activeQueries, setActiveQueries] = useState<string[]>([]);
  const [activeCompetitors, setActiveCompetitors] = useState<string[]>([]);
  const [deepThinking, setDeepThinking] = useState(true);
  const [activeIndustry, setActiveIndustry] = useState<string>('');
  const [finalReport, setFinalReport] = useState<AEOReport | null>(null);

  const startAnalysis = (brand: string, url: string, queries: string[], competitors: string[], thinking: boolean, industry?: string) => {
    setActiveBrand(brand);
    setActiveBrandUrl(url);
    setActiveQueries(queries);
    setActiveCompetitors(competitors);
    setDeepThinking(thinking);
    setActiveIndustry(industry || '');
    setView('processing');
  };

  const handleReportComplete = async (report: AEOReport) => {
    setFinalReport(report);
    setView('results');
    
    // Auto-save to database if configured
    if (isSupabaseConfigured()) {
      try {
        await saveReport(report);
        console.log('Report saved to database');
      } catch (err) {
        console.error('Failed to save report:', err);
      }
    }
  };

  const updateIntel = (oldName: string, newIntel: CompetitorIntel) => {
    if (!finalReport) return;
    setFinalReport({
      ...finalReport,
      competitor_intel: finalReport.competitor_intel.map(ci => ci.name === oldName ? newIntel : ci)
    });
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar onHistoryClick={() => setView('history')} />
      <main className="flex-grow bg-gray-50/50">
        {view === 'landing' && <LandingView onStart={startAnalysis} />}
        {view === 'processing' && (
          <ProcessingView 
            brand={activeBrand} 
            brandUrl={activeBrandUrl}
            queries={activeQueries}
            trackedCompetitors={activeCompetitors}
            deepThinking={deepThinking}
            onComplete={handleReportComplete} 
          />
        )}
        {view === 'results' && finalReport && (
          <ResultsView 
            report={finalReport} 
            onReset={() => { setView('landing'); setFinalReport(null); }} 
            onUpdateIntel={updateIntel} 
          />
        )}
        {view === 'history' && (
          <HistoryView 
            onSelectReport={(report) => { setFinalReport(report); setView('results'); }}
            onBack={() => setView('landing')}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
