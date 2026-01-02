import React, { useState } from 'react';
import {
    CheckCircle2,
    Globe,
    ExternalLink,
    Target,
    Download,
    FileText,
    RefreshCw,
    Lightbulb,
    Wrench,
    Search,
    Users,
    FileCode,
    Rocket,
    Layers,
    BrainCircuit,
    Github,
    Code,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { AEOReport, QueryResult, MentionPosition, CompetitorIntel, QueryResultWithAction, ActionPlan, BrandLlmTxt } from '../../types';
import { exportToCSV, exportToPDF } from '../../services/exportService';
import { generateActionPlan, generateLlmTxt, exportAllSchemas, getPriorityColor } from '../../services/actionEngineService';
import { getCompetitorMarketIntel } from '../../services/geminiService';

// Components
import { PlaybookView } from './PlaybookView';
import { ActionPlanPanel } from './ActionPlanPanel';
import { LlmTxtPanel } from './LlmTxtPanel';
import { CrawlSubmissionPanel } from './CrawlSubmissionPanel';
import { BrandProfilePanel } from './BrandProfilePanel';
import { PerplexityGuidePanel } from './PerplexityGuidePanel';
import { PlatformConnectionsPanel } from './PlatformConnectionsPanel';
import { CompetitorIntelCard } from './CompetitorIntelCard';

interface ResultsViewProps {
    report: AEOReport;
    onReset: () => void;
    onUpdateIntel: (oldName: string, newIntel: CompetitorIntel) => void;
    onRunCompetitive?: (brandName: string, brandUrl: string, competitors: string[]) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ report, onReset, onUpdateIntel, onRunCompetitive }) => {
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-in-up">
                <div>
                    <div className="flex items-center gap-3 text-indigo-600 font-semibold mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Playbook Generated
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900">
                        AEO Vision: {report.brand_name}
                    </h1>
                    {report.brand_url && (
                        <a href={report.brand_url.startsWith('http') ? report.brand_url : `https://${report.brand_url}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline mt-2 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition hover:bg-indigo-100">
                            <Globe className="w-4 h-4" />
                            {report.brand_url}
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                </div>
                <div className="flex gap-4">
                    {onRunCompetitive && (
                        <button
                            onClick={() => onRunCompetitive(
                                report.brand_name,
                                report.brand_url || '',
                                report.competitor_intel?.map(c => c.name) || []
                            )}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 transition font-bold shadow-lg shadow-indigo-100 transform hover:-translate-y-0.5"
                        >
                            <Target className="w-4 h-4" />
                            Win/Loss Analysis
                        </button>
                    )}
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
                    <button onClick={onReset} className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 transform hover:-translate-y-0.5">
                        <RefreshCw className="w-4 h-4" />
                        Reset
                    </button>
                </div>
            </div>

            {/* Scoreboard */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12 animate-fade-in delay-100">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center transition hover:shadow-md">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Omni-Score</span>
                    <div className={`text-7xl font-black ${getScoreColor(report.overall_score)}`}>{report.overall_score}%</div>
                    <p className="text-gray-500 mt-4 text-sm px-4">Visibility weighted by position and sentiment.</p>
                </div>

                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(Object.entries(report.model_scores) as [string, number][]).map(([model, score]) => (
                        <div key={model} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm group transition hover:shadow-md">
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
                report.playbook ? <div className="animate-fade-in"><PlaybookView playbook={report.playbook} brandName={report.brand_name} /></div> : (
                    <div className="py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400">Playbook not generated for this report.</p>
                    </div>
                )
            ) : activeTab === 'actions' ? (
                <div className="space-y-8 animate-fade-in">
                    {/* Action Engine Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 text-white relative overflow-hidden">
                        <div className="relative z-10 flex items-start justify-between">
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
                        {/* Abstract visual element */}
                        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
                            <Wrench className="w-40 h-40" />
                        </div>
                    </div>

                    {/* llm.txt Section */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 transition hover:shadow-md">
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
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 transition hover:shadow-md">
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
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 transition hover:shadow-md">
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
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 transition hover:shadow-md">
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
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 transition hover:shadow-md">
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
                                                    <div className={`w-3 h-3 rounded-full ${!res.mentioned ? 'bg-rose-500' :
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
                                            <div className="px-6 pb-6 animate-fade-in">
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
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
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
                                            <tr className="bg-gray-50/30 animate-fade-in">
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
                                                                    <a href={res.citation_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white p-4 rounded-xl border border-indigo-100 text-indigo-600 font-bold text-xs hover:bg-indigo-50 transition shadow-sm">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
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
