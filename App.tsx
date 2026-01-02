
import React, { useState, useCallback, useMemo } from 'react';
import { 
  BarChart, 
  Search, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  ChevronRight, 
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
  Github
} from 'lucide-react';
import { AIModel, AEOReport, QueryResult, MentionPosition, Sentiment, CompetitorIntel, AEOPlaybook } from './types';
import { fetchAIResponse, analyzeResponse, getCompetitorMarketIntel, generateOptimizationPlaybook } from './services/geminiService';
import { POSITION_POINTS, SENTIMENT_MODIFIER, MAX_POINTS_PER_CHECK } from './constants';

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

const Navbar = () => (
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
  onStart: (brand: string, url: string, queries: string[], deepThinking: boolean) => void 
}> = ({ onStart }) => {
  const [brand, setBrand] = useState('');
  const [url, setUrl] = useState('');
  const [queriesStr, setQueriesStr] = useState('');
  const [deepThinking, setDeepThinking] = useState(true);

  const handleRun = async () => {
    if (!brand || !queriesStr) return;
    
    // Pro features require API key selection
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
      // Proceed immediately as per race condition guidelines
    }

    const queries = queriesStr.split('\n').filter(q => q.trim().length > 0).slice(0, 10);
    onStart(brand, url, queries, deepThinking);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Answer Economy</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Diagnostic checks aren't enough. AEO Vision tracks your brand across LLMs and provides 
          an AI-powered playbook to boost your visibility.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Search className="w-64 h-64 text-indigo-600" />
        </div>
        
        <div className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Name</label>
              <input 
                type="text" 
                placeholder="e.g. Acme SaaS"
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
                  placeholder="e.g. acme.io"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition text-lg"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Target Questions (One per line, max 10)</label>
            <textarea 
              rows={5}
              placeholder="What is the best CRM for remote teams?&#10;Which cloud hosting is most secure?&#10;How does Acme SaaS compare to competitors?"
              value={queriesStr}
              onChange={(e) => setQueriesStr(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition text-lg"
            />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-2.5 rounded-xl">
                <BrainCircuit className="text-white w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-indigo-900 text-sm">Deep Thinking Mode</h4>
                <p className="text-indigo-600 text-xs">Uses Gemini 3 Pro with max reasoning budget (32k tokens).</p>
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

          <button 
            onClick={handleRun}
            disabled={!brand || !queriesStr}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-5 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3 text-xl"
          >
            <Zap className="w-6 h-6" />
            {deepThinking ? 'Run Advanced Analysis' : 'Run Basic Check'}
          </button>
          
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            <Key className="w-3 h-3" />
            Requires Paid API Key for Deep Thinking
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
  deepThinking: boolean;
  onComplete: (report: AEOReport) => void;
}> = ({ brand, brandUrl, queries, deepThinking, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing agents...');

  const totalSteps = (queries.length * 3) + 3; // AI models + Intel + Playbook

  React.useEffect(() => {
    const runAnalysis = async () => {
      const results: QueryResult[] = [];
      const models = [AIModel.ChatGPT, AIModel.Perplexity, AIModel.Gemini];
      let completed = 0;
      const competitorSet = new Set<string>();

      // Step 1: AI Responses
      for (const query of queries) {
        for (const model of models) {
          setStatus(`${deepThinking ? 'Deep' : 'Analyzing'} ${model} answer for "${query.length > 30 ? query.substring(0, 30) + '...' : query}"`);
          
          try {
            const raw = await fetchAIResponse(model, query, deepThinking);
            const analysis = await analyzeResponse(brand, raw);
            
            results.push({
              id: Math.random().toString(36).substr(2, 9),
              query_text: query,
              model,
              ...analysis
            });

            analysis.competitors_mentioned.forEach(c => competitorSet.add(c));
          } catch (err: any) {
            console.error(err);
            // Re-prompt for key if entity not found (usually means key issue)
            if (err.message?.includes("Requested entity was not found")) {
              await window.aistudio.openSelectKey();
            }
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
      const topCompetitors = Array.from(competitorSet).slice(0, 3);
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
const PlaybookView: React.FC<{ playbook: AEOPlaybook }> = ({ playbook }) => {
  return (
    <div className="space-y-10">
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
            Recommended Actions
          </h3>
          {playbook.actions.map((action, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{action.title}</h4>
                <div className="flex gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${action.impact === 'High' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {action.impact} Impact
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-gray-50 text-gray-500">
                    {action.effort} Effort
                  </span>
                </div>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{action.description}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900 px-2 flex items-center gap-2">
            <AlertCircle className="text-rose-500 w-5 h-5" />
            Detected Knowledge Gaps
          </h3>
          <div className="bg-rose-50/50 rounded-3xl p-8 border border-rose-100 h-full">
            <p className="text-rose-800 text-sm font-medium mb-6">
              AI models identified these gaps or outdated facts during current analysis. Addressing these in your technical docs and PR will improve AEO performance.
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
  const [activeTab, setActiveTab] = useState<'playbook' | 'visibility' | 'competitors'>('playbook');

  const handleRefineIntel = async (oldName: string, name: string, url: string) => {
    const refined = await getCompetitorMarketIntel(name, url);
    onUpdateIntel(oldName, refined);
  };

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
          <button className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium">
            <Download className="w-4 h-4" />
            Full CSV
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
          {Object.entries(report.model_scores).map(([model, score]) => (
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
      <div className="flex gap-4 mb-8 bg-gray-100 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('playbook')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'playbook' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Lightbulb className="w-4 h-4" />
          AEO Playbook
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
        report.playbook ? <PlaybookView playbook={report.playbook} /> : (
          <div className="py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
             <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
             <p className="text-gray-400">Playbook not generated for this report.</p>
          </div>
        )
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

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'processing' | 'results'>('landing');
  const [activeBrand, setActiveBrand] = useState('');
  const [activeBrandUrl, setActiveBrandUrl] = useState('');
  const [activeQueries, setActiveQueries] = useState<string[]>([]);
  const [deepThinking, setDeepThinking] = useState(true);
  const [finalReport, setFinalReport] = useState<AEOReport | null>(null);

  const startAnalysis = (brand: string, url: string, queries: string[], thinking: boolean) => {
    setActiveBrand(brand);
    setActiveBrandUrl(url);
    setActiveQueries(queries);
    setDeepThinking(thinking);
    setView('processing');
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
      <Navbar />
      <main className="flex-grow bg-gray-50/50">
        {view === 'landing' && <LandingView onStart={startAnalysis} />}
        {view === 'processing' && (
          <ProcessingView 
            brand={activeBrand} 
            brandUrl={activeBrandUrl}
            queries={activeQueries} 
            deepThinking={deepThinking}
            onComplete={(report) => { setFinalReport(report); setView('results'); }} 
          />
        )}
        {view === 'results' && finalReport && (
          <ResultsView 
            report={finalReport} 
            onReset={() => { setView('landing'); setFinalReport(null); }} 
            onUpdateIntel={updateIntel} 
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
