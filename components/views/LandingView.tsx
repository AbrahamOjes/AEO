import React, { useState, useMemo } from 'react';
import {
    Search,
    Globe,
    Loader2,
    BrainCircuit,
    CheckCircle2,
    Layers,
    ChevronDown,
    Users,
    ToggleRight,
    ToggleLeft,
    Zap,
    Cpu
} from 'lucide-react';
import { Industry, QueryTemplate, INDUSTRIES, getTemplatesByIndustry, generateCustomQueries } from '../../data/queryTemplates';
import { analyzeBrandAndGenerateQueries, BrandAnalysis } from '../../services/openrouterService';

interface LandingViewProps {
    onStart: (brand: string, url: string, queries: string[], competitors: string[], deepThinking: boolean, industry?: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onStart }) => {
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
            <div className="text-center mb-16 animate-fade-in-up">
                <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight drop-shadow-sm">
                    Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Answer Economy</span>
                </h1>
                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Track your brand visibility across AI assistants with industry-specific templates,
                    historical trends, and actionable optimization playbooks.
                </p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 overflow-hidden relative transition-all duration-300 hover:shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
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
                                    className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition text-lg bg-gray-50/50 focus:bg-white"
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
                                        className="w-full pl-12 pr-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition text-lg bg-gray-50/50 focus:bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Smart Analyze Button */}
                        <button
                            onClick={handleSmartAnalyze}
                            disabled={!brand.trim() || isAnalyzingBrand}
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
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
                            <div className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 rounded-xl p-4 animate-fade-in">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <div className="font-semibold text-emerald-800 mb-1">
                                            {brandAnalysis.category} • {brandAnalysis.industry}
                                        </div>
                                        <p className="text-emerald-700 text-sm">{brandDescription}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full border border-emerald-200">
                                                {brandAnalysis.queries.length} queries generated
                                            </span>
                                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full border border-emerald-200">
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
                                <span className="text-xs bg-white text-gray-500 px-2 py-1 rounded-full font-semibold border border-gray-100 shadow-sm">Optional</span>
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
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-20 max-h-64 overflow-y-auto">
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
                                            className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 transition font-semibold text-sm shadow-md"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedTemplate && (
                            <div className="flex items-center gap-2 text-sm text-indigo-600 animate-fade-in">
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
                            className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition font-mono text-sm bg-gray-50/50 focus:bg-white resize-y"
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
                                className="w-full pl-12 pr-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition text-lg bg-gray-50/50 focus:bg-white"
                            />
                        </div>
                    </div>

                    {/* Deep Thinking Toggle */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md">
                                <BrainCircuit className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-indigo-900 text-sm">Deep Thinking Mode</h4>
                                <p className="text-indigo-600 text-xs">Enhanced analysis with advanced reasoning for better insights.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setDeepThinking(!deepThinking)}
                            className="transition-all hover:scale-110 active:scale-95"
                        >
                            {deepThinking ? (
                                <ToggleRight className="w-12 h-12 text-indigo-600 drop-shadow-sm" />
                            ) : (
                                <ToggleLeft className="w-12 h-12 text-gray-300" />
                            )}
                        </button>
                    </div>

                    {/* Run Button */}
                    <button
                        onClick={handleRun}
                        disabled={!brand || queryCount === 0 || queryCount > 20}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-5 rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all flex items-center justify-center gap-3 text-xl transform hover:-translate-y-1 active:translate-y-0"
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
