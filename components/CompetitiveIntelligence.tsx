/**
 * Competitive AI Win/Loss Intelligence UI Components
 */

import React, { useState, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Trophy,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Play,
  Download,
  Copy,
  Check,
  X,
  ExternalLink,
  Loader2,
  BarChart3,
  FileText,
  Code,
  Zap,
  Users,
  Globe,
  Building2,
  Search,
  Filter,
  ArrowRight,
  Sparkles
} from 'lucide-react';

import {
  BrandConfig,
  Competitor,
  GeneratedQuery,
  QueryCategory,
  WinLossResult,
  WinLossOutcome,
  CompetitiveReport,
  QueryGap,
  CompetitiveActionPlan,
  Fix,
  AIModelType,
  CompetitorTeardown,
  ModelResult
} from '../types/competitive';

import { generateQueries, getQuerySummary } from '../services/competitiveQueryService';
import { getResultEmoji, getPositionDisplay } from '../services/winLossAnalysisService';

// ============================================
// Setup Wizard Component
// ============================================

interface SetupWizardProps {
  onComplete: (config: BrandConfig) => void;
  initialConfig?: Partial<BrandConfig>;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, initialConfig }) => {
  const [step, setStep] = useState<'brand' | 'competitors' | 'review'>('brand');
  
  // Brand info
  const [brandName, setBrandName] = useState(initialConfig?.brandName || '');
  const [websiteUrl, setWebsiteUrl] = useState(initialConfig?.websiteUrl || '');
  const [category, setCategory] = useState(initialConfig?.category || '');
  const [subcategories, setSubcategories] = useState<string[]>(initialConfig?.subcategories || []);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [targetCustomer, setTargetCustomer] = useState(initialConfig?.targetCustomer || '');
  const [primaryUseCase, setPrimaryUseCase] = useState(initialConfig?.primaryUseCase || '');
  const [geography, setGeography] = useState<string[]>(initialConfig?.geography || []);
  const [newGeography, setNewGeography] = useState('');
  
  // Competitors
  const [competitors, setCompetitors] = useState<Competitor[]>(initialConfig?.competitors || []);
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [newCompetitorUrl, setNewCompetitorUrl] = useState('');
  const [newCompetitorIsPrimary, setNewCompetitorIsPrimary] = useState(true);

  const addSubcategory = () => {
    if (newSubcategory.trim() && !subcategories.includes(newSubcategory.trim())) {
      setSubcategories([...subcategories, newSubcategory.trim()]);
      setNewSubcategory('');
    }
  };

  const addGeography = () => {
    if (newGeography.trim() && !geography.includes(newGeography.trim())) {
      setGeography([...geography, newGeography.trim()]);
      setNewGeography('');
    }
  };

  const addCompetitor = () => {
    if (newCompetitorName.trim()) {
      const competitor: Competitor = {
        id: `comp_${Date.now()}`,
        name: newCompetitorName.trim(),
        websiteUrl: newCompetitorUrl.trim() || `https://${newCompetitorName.toLowerCase().replace(/\s+/g, '')}.com`,
        isPrimary: newCompetitorIsPrimary
      };
      setCompetitors([...competitors, competitor]);
      setNewCompetitorName('');
      setNewCompetitorUrl('');
      setNewCompetitorIsPrimary(true);
    }
  };

  const removeCompetitor = (id: string) => {
    setCompetitors(competitors.filter(c => c.id !== id));
  };

  const handleComplete = () => {
    const config: BrandConfig = {
      id: `brand_${Date.now()}`,
      brandName,
      websiteUrl: websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`,
      category,
      subcategories,
      targetCustomer,
      primaryUseCase,
      geography,
      competitors,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onComplete(config);
  };

  const canProceedFromBrand = brandName.trim() && category.trim();
  const canProceedFromCompetitors = competitors.length > 0;

  // Preview queries
  const previewConfig: BrandConfig = {
    id: 'preview',
    brandName: brandName || 'YourBrand',
    websiteUrl: websiteUrl || 'https://example.com',
    category: category || 'product',
    subcategories,
    targetCustomer,
    primaryUseCase,
    geography,
    competitors,
    createdAt: '',
    updatedAt: ''
  };
  const previewQueries = generateQueries(previewConfig);
  const querySummary = getQuerySummary(previewQueries);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {['brand', 'competitors', 'review'].map((s, i) => (
          <React.Fragment key={s}>
            <div 
              className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                step === s 
                  ? 'bg-indigo-600 text-white' 
                  : i < ['brand', 'competitors', 'review'].indexOf(step)
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i < ['brand', 'competitors', 'review'].indexOf(step) ? <Check className="w-5 h-5" /> : i + 1}
            </div>
            {i < 2 && (
              <div className={`w-20 h-1 mx-2 ${
                i < ['brand', 'competitors', 'review'].indexOf(step) ? 'bg-emerald-500' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Brand Info */}
      {step === 'brand' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your brand</h2>
          <p className="text-gray-500 mb-6">We'll use this to generate competitive queries</p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Brand Name *</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., Autospend"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Website</label>
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://autospend.co"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category (what do you sell?) *</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Stablecoin wallet"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Also known as... (alternative terms)</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {subcategories.map((sub, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-1">
                    {sub}
                    <button onClick={() => setSubcategories(subcategories.filter((_, idx) => idx !== i))} className="hover:text-indigo-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubcategory}
                  onChange={(e) => setNewSubcategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSubcategory()}
                  placeholder="e.g., payment app"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={addSubcategory} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Target Customer</label>
              <input
                type="text"
                value={targetCustomer}
                onChange={(e) => setTargetCustomer(e.target.value)}
                placeholder="e.g., Freelancers in emerging markets"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Primary Use Case</label>
              <input
                type="text"
                value={primaryUseCase}
                onChange={(e) => setPrimaryUseCase(e.target.value)}
                placeholder="e.g., Receive and spend USD payments internationally"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Geographic Focus</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {geography.map((geo, i) => (
                  <span key={i} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm flex items-center gap-1">
                    {geo}
                    <button onClick={() => setGeography(geography.filter((_, idx) => idx !== i))} className="hover:text-emerald-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGeography}
                  onChange={(e) => setNewGeography(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addGeography()}
                  placeholder="e.g., Nigeria"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={addGeography} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setStep('competitors')}
              disabled={!canProceedFromBrand}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition flex items-center gap-2"
            >
              Next: Competitors <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Competitors */}
      {step === 'competitors' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Who are you competing against?</h2>
          <p className="text-gray-500 mb-6">We'll track how you compare in AI recommendations</p>

          {/* Existing Competitors */}
          {competitors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Competitors</h3>
              <div className="space-y-2">
                {competitors.map((comp) => (
                  <div key={comp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${comp.isPrimary ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      <div>
                        <span className="font-semibold text-gray-900">{comp.name}</span>
                        <span className="text-gray-400 text-sm ml-2">{comp.websiteUrl}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${comp.isPrimary ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {comp.isPrimary ? 'Primary' : 'Secondary'}
                      </span>
                    </div>
                    <button onClick={() => removeCompetitor(comp.id)} className="text-gray-400 hover:text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Competitor Form */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Competitor</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                value={newCompetitorName}
                onChange={(e) => setNewCompetitorName(e.target.value)}
                placeholder="Competitor name"
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={newCompetitorUrl}
                onChange={(e) => setNewCompetitorUrl(e.target.value)}
                placeholder="Website (optional)"
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={newCompetitorIsPrimary}
                  onChange={(e) => setNewCompetitorIsPrimary(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Primary competitor (direct alternative)
              </label>
              <button
                onClick={addCompetitor}
                disabled={!newCompetitorName.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold rounded-xl text-sm transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep('brand')}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
            >
              Back
            </button>
            <button
              onClick={() => setStep('review')}
              disabled={!canProceedFromCompetitors}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition flex items-center gap-2"
            >
              Review & Start <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to analyze</h2>
          <p className="text-gray-500 mb-6">Review your setup and start the competitive analysis</p>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Building2 className="w-4 h-4" />
                Brand
              </div>
              <div className="font-bold text-gray-900">{brandName}</div>
              <div className="text-sm text-gray-500">{category}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Users className="w-4 h-4" />
                Competitors
              </div>
              <div className="font-bold text-gray-900">{competitors.length}</div>
              <div className="text-sm text-gray-500">
                {competitors.filter(c => c.isPrimary).length} primary, {competitors.filter(c => !c.isPrimary).length} secondary
              </div>
            </div>
          </div>

          {/* Query Preview */}
          <div className="bg-indigo-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Queries to analyze: {previewQueries.length}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                <span className="text-indigo-700">Recommendation: {querySummary.recommendation}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-violet-500 rounded-full" />
                <span className="text-indigo-700">Comparison: {querySummary.comparison}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-indigo-700">Validation: {querySummary.validation}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-indigo-700">Feature: {querySummary.feature}</span>
              </div>
            </div>
          </div>

          {/* Sample Queries */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Sample queries we'll check:</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {previewQueries.slice(0, 8).map((q, i) => (
                <div key={i} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    q.category === QueryCategory.RECOMMENDATION ? 'bg-indigo-500' :
                    q.category === QueryCategory.COMPARISON ? 'bg-violet-500' :
                    q.category === QueryCategory.VALIDATION ? 'bg-emerald-500' :
                    'bg-amber-500'
                  }`} />
                  "{q.text}"
                </div>
              ))}
              {previewQueries.length > 8 && (
                <div className="text-sm text-gray-400">...and {previewQueries.length - 8} more</div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep('competitors')}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
            >
              Back
            </button>
            <button
              onClick={handleComplete}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center gap-2"
            >
              <Play className="w-5 h-5" /> Start Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// Analysis Progress Component
// ============================================

interface AnalysisProgressProps {
  progress: {
    stage: 'generating' | 'executing' | 'analyzing' | 'complete';
    currentQuery?: number;
    totalQueries?: number;
    currentModel?: AIModelType;
    message: string;
  };
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ progress }) => {
  const percentage = progress.totalQueries 
    ? Math.round((progress.currentQuery || 0) / progress.totalQueries * 100)
    : 0;

  return (
    <div className="max-w-xl mx-auto text-center">
      <div className="mb-8">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing AI Responses</h2>
        <p className="text-gray-500">{progress.message}</p>
      </div>

      {progress.stage === 'executing' && progress.totalQueries && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Query {progress.currentQuery} of {progress.totalQueries}</span>
            <span>{percentage}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          {progress.currentModel && (
            <p className="text-sm text-gray-400 mt-2">
              Currently querying: {progress.currentModel.toUpperCase()}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-center gap-4 text-sm">
        <div className={`flex items-center gap-1 ${progress.stage === 'generating' ? 'text-indigo-600' : 'text-gray-400'}`}>
          {progress.stage === 'generating' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Generate
        </div>
        <div className={`flex items-center gap-1 ${progress.stage === 'executing' ? 'text-indigo-600' : progress.stage === 'analyzing' || progress.stage === 'complete' ? 'text-gray-400' : 'text-gray-300'}`}>
          {progress.stage === 'executing' ? <Loader2 className="w-4 h-4 animate-spin" /> : progress.stage === 'analyzing' || progress.stage === 'complete' ? <Check className="w-4 h-4" /> : <span className="w-4 h-4" />}
          Execute
        </div>
        <div className={`flex items-center gap-1 ${progress.stage === 'analyzing' ? 'text-indigo-600' : progress.stage === 'complete' ? 'text-gray-400' : 'text-gray-300'}`}>
          {progress.stage === 'analyzing' ? <Loader2 className="w-4 h-4 animate-spin" /> : progress.stage === 'complete' ? <Check className="w-4 h-4" /> : <span className="w-4 h-4" />}
          Analyze
        </div>
      </div>
    </div>
  );
};

// ============================================
// Dashboard Overview Component
// ============================================

interface DashboardOverviewProps {
  report: CompetitiveReport;
  brandName: string;
  onViewResults: () => void;
  onViewGaps: () => void;
  onViewActions: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  report,
  brandName,
  onViewResults,
  onViewGaps,
  onViewActions
}) => {
  const topLosses = report.biggestLosses.slice(0, 3);
  const winRateChange = 0; // Would come from historical data

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="text-4xl font-bold text-gray-900 mb-1">{report.winRate}%</div>
          <div className="text-sm text-gray-500">Win Rate</div>
          {winRateChange !== 0 && (
            <div className={`flex items-center gap-1 text-sm mt-2 ${winRateChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {winRateChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(winRateChange)}% vs last check
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="text-4xl font-bold text-emerald-600 mb-1">{report.wins}</div>
          <div className="text-sm text-gray-500">Wins</div>
          <div className="text-sm text-gray-400 mt-2">of {report.totalQueries} queries</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="text-4xl font-bold text-rose-600 mb-1">{report.losses}</div>
          <div className="text-sm text-gray-500">Losses</div>
          <div className="text-sm text-gray-400 mt-2">to competitors</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="text-4xl font-bold text-amber-600 mb-1">{report.partial}</div>
          <div className="text-sm text-gray-500">Partial</div>
          <div className="text-sm text-gray-400 mt-2">mixed results</div>
        </div>
      </div>

      {/* Win Rate by Category */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Win Rate by Category</h3>
        <div className="space-y-3">
          {Object.entries(report.categoryBreakdown).map(([category, stats]: [string, { winRate: number; wins: number; total: number }]) => (
            <div key={category} className="flex items-center gap-4">
              <div className="w-32 text-sm text-gray-600 capitalize">{category}</div>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    stats.winRate >= 60 ? 'bg-emerald-500' :
                    stats.winRate >= 30 ? 'bg-amber-500' :
                    'bg-rose-500'
                  }`}
                  style={{ width: `${stats.winRate}%` }}
                />
              </div>
              <div className="w-20 text-sm text-gray-500 text-right">
                {stats.winRate}% ({stats.wins}/{stats.total})
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Win Rate vs Competitors */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Win Rate vs Competitors</h3>
        <div className="space-y-3">
          {Object.entries(report.competitorBreakdown)
            .sort((a, b) => (b[1] as { lossesAgainst: number }).lossesAgainst - (a[1] as { lossesAgainst: number }).lossesAgainst)
            .map(([competitor, stats]: [string, { winRate: number; winsAgainst: number; lossesAgainst: number }]) => (
            <div key={competitor} className="flex items-center gap-4">
              <div className="w-32 text-sm text-gray-600 truncate">{competitor}</div>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    stats.winRate >= 60 ? 'bg-emerald-500' :
                    stats.winRate >= 30 ? 'bg-amber-500' :
                    'bg-rose-500'
                  }`}
                  style={{ width: `${stats.winRate}%` }}
                />
              </div>
              <div className="w-24 text-sm text-gray-500 text-right">
                {stats.winRate}% ({stats.winsAgainst}/{stats.winsAgainst + stats.lossesAgainst})
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Biggest Losses */}
      {topLosses.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Biggest Losses (Fix These First)
            </h3>
            <button onClick={onViewGaps} className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {topLosses.map((result, i) => (
              <div key={i} className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">"{result.query.text}"</div>
                    <div className="text-sm text-rose-600 mt-1">
                      Lost to: {result.winningBrand} (wins in {Object.values(result.modelResults).filter(r => (r as ModelResult | undefined)?.winner === result.winningBrand).length}/3 models)
                    </div>
                  </div>
                  <button 
                    onClick={onViewActions}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    See Fix <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={onViewResults}
          className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-indigo-300 hover:bg-indigo-50 transition text-left"
        >
          <BarChart3 className="w-8 h-8 text-indigo-600 mb-3" />
          <div className="font-bold text-gray-900">View All Results</div>
          <div className="text-sm text-gray-500">See detailed query-by-query breakdown</div>
        </button>
        <button
          onClick={onViewGaps}
          className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-indigo-300 hover:bg-indigo-50 transition text-left"
        >
          <Target className="w-8 h-8 text-rose-600 mb-3" />
          <div className="font-bold text-gray-900">Query Gaps</div>
          <div className="text-sm text-gray-500">See why competitors are winning</div>
        </button>
        <button
          onClick={onViewActions}
          className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-indigo-300 hover:bg-indigo-50 transition text-left"
        >
          <Zap className="w-8 h-8 text-amber-600 mb-3" />
          <div className="font-bold text-gray-900">Action Plan</div>
          <div className="text-sm text-gray-500">Get prioritized fixes</div>
        </button>
      </div>
    </div>
  );
};

// ============================================
// Results Table Component
// ============================================

interface ResultsTableProps {
  results: WinLossResult[];
  brandName: string;
  onSelectQuery: (result: WinLossResult) => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results, brandName, onSelectQuery }) => {
  const [filterCategory, setFilterCategory] = useState<QueryCategory | 'all'>('all');
  const [filterResult, setFilterResult] = useState<WinLossOutcome | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResults = results.filter(r => {
    if (filterCategory !== 'all' && r.query.category !== filterCategory) return false;
    if (filterResult !== 'all' && r.overallResult !== filterResult) return false;
    if (searchTerm && !r.query.text.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as QueryCategory | 'all')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          >
            <option value="all">All Categories</option>
            <option value="recommendation">Recommendation</option>
            <option value="comparison">Comparison</option>
            <option value="validation">Validation</option>
            <option value="feature">Feature</option>
          </select>
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value as WinLossOutcome | 'all')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          >
            <option value="all">All Results</option>
            <option value="win">Wins</option>
            <option value="loss">Losses</option>
            <option value="partial">Partial</option>
          </select>
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queries..."
            className="w-full max-w-xs text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredResults.length} of {results.length} queries
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left">Query</th>
              <th className="px-4 py-3 text-center">ChatGPT</th>
              <th className="px-4 py-3 text-center">Perplexity</th>
              <th className="px-4 py-3 text-center">Gemini</th>
              <th className="px-4 py-3 text-center">Result</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredResults.map((result) => {
              const chatgpt = result.modelResults.chatgpt;
              const perplexity = result.modelResults.perplexity;
              const gemini = result.modelResults.gemini;

              return (
                <tr key={result.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onSelectQuery(result)}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 truncate max-w-md">{result.query.text}</div>
                    <div className="text-xs text-gray-400 capitalize">{result.query.category}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className={`text-sm font-medium ${chatgpt?.winner === brandName ? 'text-emerald-600' : chatgpt?.winner ? 'text-rose-600' : 'text-gray-400'}`}>
                      {chatgpt?.winner === brandName ? 'You!' : chatgpt?.winner || '—'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {chatgpt ? getPositionDisplay(chatgpt.userBrandPosition) : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className={`text-sm font-medium ${perplexity?.winner === brandName ? 'text-emerald-600' : perplexity?.winner ? 'text-rose-600' : 'text-gray-400'}`}>
                      {perplexity?.winner === brandName ? 'You!' : perplexity?.winner || '—'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {perplexity ? getPositionDisplay(perplexity.userBrandPosition) : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className={`text-sm font-medium ${gemini?.winner === brandName ? 'text-emerald-600' : gemini?.winner ? 'text-rose-600' : 'text-gray-400'}`}>
                      {gemini?.winner === brandName ? 'You!' : gemini?.winner || '—'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {gemini ? getPositionDisplay(gemini.userBrandPosition) : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      result.overallResult === 'win' ? 'bg-emerald-100 text-emerald-700' :
                      result.overallResult === 'loss' ? 'bg-rose-100 text-rose-700' :
                      result.overallResult === 'partial' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {getResultEmoji(result.overallResult)} {result.overallResult}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// Action Plan View Component
// ============================================

interface ActionPlanViewProps {
  actionPlan: CompetitiveActionPlan;
  brandName: string;
}

export const ActionPlanView: React.FC<ActionPlanViewProps> = ({ actionPlan, brandName }) => {
  const [expandedFix, setExpandedFix] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderFix = (fix: Fix, priority: string) => {
    const isExpanded = expandedFix === fix.id;

    return (
      <div key={fix.id} className="border border-gray-200 rounded-xl overflow-hidden">
        <div 
          className="p-4 cursor-pointer hover:bg-gray-50 transition"
          onClick={() => setExpandedFix(isExpanded ? null : fix.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 rounded border-gray-300" onClick={(e) => e.stopPropagation()} />
              <div>
                <div className="font-semibold text-gray-900">{fix.title}</div>
                <div className="text-sm text-gray-500 mt-1">{fix.description}</div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className={`px-2 py-0.5 rounded-full ${
                    fix.effort === 'low' ? 'bg-emerald-100 text-emerald-700' :
                    fix.effort === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {fix.estimatedHours}h
                  </span>
                  <span>Affects {fix.queriesAffected.length} queries</span>
                  <span>+{fix.potentialWins} potential wins</span>
                </div>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
            <div className="pt-4">
              <h4 className="font-semibold text-gray-700 mb-2">Steps:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                {fix.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>

              {fix.generatedAsset && fix.assetType === 'schema' && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Generated Schema:</h4>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-60">
                      {JSON.stringify((fix.generatedAsset as any).jsonLd, null, 2)}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify((fix.generatedAsset as any).jsonLd, null, 2), fix.id)}
                      className="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs flex items-center gap-1"
                    >
                      {copiedId === fix.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedId === fix.id ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {fix.generatedAsset && fix.assetType === 'llmtxt' && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Generated llm.txt:</h4>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-60">
                      {fix.generatedAsset as string}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(fix.generatedAsset as string, fix.id)}
                      className="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs flex items-center gap-1"
                    >
                      {copiedId === fix.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedId === fix.id ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Action Plan for {brandName}</h2>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <div className="text-3xl font-bold">{actionPlan.totalFixes}</div>
            <div className="text-indigo-200">Total Fixes</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{actionPlan.estimatedImpact.match(/\d+/)?.[0] || '?'}%</div>
            <div className="text-indigo-200">Potential Impact</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{actionPlan.estimatedEffort.match(/\d+/)?.[0] || '?'}h</div>
            <div className="text-indigo-200">Estimated Effort</div>
          </div>
        </div>
      </div>

      {/* Quick Wins */}
      {actionPlan.quickWins.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Quick Wins (High Impact, Low Effort)
          </h3>
          <div className="space-y-3">
            {actionPlan.quickWins.map(fix => renderFix(fix, 'quick'))}
          </div>
        </div>
      )}

      {/* Critical Fixes */}
      {actionPlan.criticalFixes.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            Critical (Do This Week)
          </h3>
          <div className="space-y-3">
            {actionPlan.criticalFixes.map(fix => renderFix(fix, 'critical'))}
          </div>
        </div>
      )}

      {/* High Priority */}
      {actionPlan.highPriorityFixes.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-500" />
            High Priority (Do This Month)
          </h3>
          <div className="space-y-3">
            {actionPlan.highPriorityFixes.map(fix => renderFix(fix, 'high'))}
          </div>
        </div>
      )}

      {/* Medium Priority */}
      {actionPlan.mediumPriorityFixes.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Medium Priority
          </h3>
          <div className="space-y-3">
            {actionPlan.mediumPriorityFixes.map(fix => renderFix(fix, 'medium'))}
          </div>
        </div>
      )}

      {/* Export */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(actionPlan.generatedAssets, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${brandName.toLowerCase()}-assets.json`;
            a.click();
          }}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download All Assets
        </button>
      </div>
    </div>
  );
};

export default {
  SetupWizard,
  AnalysisProgress,
  DashboardOverview,
  ResultsTable,
  ActionPlanView
};
