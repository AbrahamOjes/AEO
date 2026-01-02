import React, { useState } from 'react';
import {
    Zap,
    Loader2,
    Check,
    Copy,
    FileText,
    CheckCircle2,
    Target
} from 'lucide-react';
import { QueryResultWithAction, ActionPlanWithAction } from '../../types'; // Note: Adjust types if needed
import { getPriorityColor, getSchemaTypeIcon } from '../../services/actionEngineService';

// Fix imports if types are slightly different in App.tsx vs types.ts
// Assuming QueryResultWithAction is exported from types.ts

interface ActionPlanPanelProps {
    result: QueryResultWithAction;
    brandName: string;
    brandUrl: string;
    onGeneratePlan: () => Promise<void>;
    isGenerating: boolean;
}

export const ActionPlanPanel: React.FC<ActionPlanPanelProps> = ({
    result,
    brandName,
    brandUrl,
    onGeneratePlan,
    isGenerating
}) => {
    const [activeTab, setActiveTab] = useState<'schema' | 'content' | 'gap'>('schema');
    const [copied, setCopied] = useState(false);
    const plan = result.action_plan;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!plan) {
        return (
            <div className="bg-gray-50/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="text-center">
                    <Zap className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">Generate an action plan to see specific fixes for this query</p>
                    <button
                        onClick={onGeneratePlan}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
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
            <div className="flex border-b border-gray-200 bg-gray-50/50">
                <button
                    onClick={() => setActiveTab('schema')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'schema' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    📋 Schema
                </button>
                <button
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'content' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    ✏️ Content Fixes
                </button>
                <button
                    onClick={() => setActiveTab('gap')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'gap' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
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
                                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied!' : 'Copy JSON-LD'}
                                    </button>
                                </div>
                                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono shadow-inner">
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
                                <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                    <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${fix.severity === 'critical' ? 'bg-rose-100 text-rose-700' :
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
