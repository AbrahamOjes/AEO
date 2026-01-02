import React, { useState, useEffect } from 'react';
import { Target, Zap, RefreshCw } from 'lucide-react';
import { SetupWizard, AnalysisProgress, DashboardOverview, ResultsTable, ActionPlanView } from '../../components/CompetitiveIntelligence';
import { BrandConfig, WinLossResult, CompetitiveReport, CompetitiveActionPlan, AIModelType as CompetitiveAIModel } from '../../types/competitive';
import { runCompetitiveAnalysis, saveAnalysis } from '../../services/competitiveAnalysisService';
import { fetchAIResponse } from '../../services/geminiService';
import { AIModel } from '../../types';

interface CompetitiveIntelViewProps {
    onBack: () => void;
    preFill?: { brandName: string; brandUrl: string; competitors: string[] } | null;
    onClearPreFill?: () => void;
    onRunQuickCheck?: (brandName: string, brandUrl: string, queries: string[]) => void;
}

export const CompetitiveIntelView: React.FC<CompetitiveIntelViewProps> = ({ onBack, preFill, onClearPreFill, onRunQuickCheck }) => {
    const [stage, setStage] = useState<'setup' | 'analyzing' | 'dashboard'>('setup');
    const [brandConfig, setBrandConfig] = useState<BrandConfig | null>(null);

    const [analysisProgress, setAnalysisProgress] = useState({
        stage: 'generating' as 'generating' | 'executing' | 'analyzing' | 'complete',
        currentQuery: 0,
        totalQueries: 0,
        currentModel: null as CompetitiveAIModel | null,
        message: ''
    });
    const [report, setReport] = useState<CompetitiveReport | null>(null);
    const [results, setResults] = useState<WinLossResult[]>([]);
    const [actionPlan, setActionPlan] = useState<CompetitiveActionPlan | null>(null);
    const [dashboardTab, setDashboardTab] = useState<'overview' | 'results' | 'actions'>('overview');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selectedQuery, setSelectedQuery] = useState<WinLossResult | null>(null);

    // Clear preFill when component unmounts
    useEffect(() => {
        return () => {
            if (onClearPreFill) onClearPreFill();
        };
    }, [onClearPreFill]);

    // AI query function using existing services
    const queryAI = async (model: CompetitiveAIModel, prompt: string): Promise<string> => {
        // Map to existing AIModel enum
        const modelMap: Record<CompetitiveAIModel, AIModel> = {
            'chatgpt': AIModel.ChatGPT,
            'perplexity': AIModel.Perplexity,
            'gemini': AIModel.Gemini
        };
        return await fetchAIResponse(modelMap[model], prompt, false);
    };

    // Parse with LLM function
    const parseWithLLM = async (prompt: string): Promise<string> => {
        return await fetchAIResponse(AIModel.Gemini, prompt, false);
    };

    const handleSetupComplete = async (config: BrandConfig) => {
        setBrandConfig(config);
        setStage('analyzing');

        try {
            const result = await runCompetitiveAnalysis(
                config,
                queryAI,
                parseWithLLM,
                {
                    maxQueriesPerCategory: 5, // Limit for demo
                    models: ['chatgpt', 'perplexity', 'gemini'],
                    onProgress: (progress) => {
                        setAnalysisProgress(progress);
                    }
                }
            );

            setReport(result.report);
            setResults(result.results);
            setActionPlan(result.actionPlan);

            // Save analysis
            saveAnalysis(config, result.report, result.results, result.actionPlan);

            setStage('dashboard');
        } catch (error) {
            console.error('Analysis failed:', error);
            setStage('setup');
        }
    };

    return (
        <div className="py-12 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={onBack}
                        className="text-sm text-gray-500 hover:text-indigo-600 mb-4 flex items-center gap-1"
                    >
                        ← Back to AEO Vision
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-2 rounded-xl">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Competitive AI Win/Loss Intelligence</h1>
                    </div>
                    <p className="text-gray-500">
                        Know which AI recommendation queries you're losing—and why competitors are winning
                    </p>
                </div>

                {/* Setup Stage */}
                {stage === 'setup' && (
                    <SetupWizard
                        onComplete={handleSetupComplete}
                        initialConfig={preFill ? {
                            brandName: preFill.brandName,
                            websiteUrl: preFill.brandUrl,
                            competitors: preFill.competitors.map((name, i) => ({
                                id: `comp_prefill_${i}`,
                                name,
                                websiteUrl: '',
                                isPrimary: true
                            }))
                        } : undefined}
                    />
                )}

                {/* Analyzing Stage */}
                {stage === 'analyzing' && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12">
                        <AnalysisProgress progress={analysisProgress} />
                    </div>
                )}

                {/* Dashboard Stage */}
                {stage === 'dashboard' && report && brandConfig && (
                    <div className="space-y-6">
                        {/* Dashboard Tabs */}
                        <div className="flex items-center gap-2 border-b border-gray-200">
                            <button
                                onClick={() => setDashboardTab('overview')}
                                className={`px-4 py-3 font-semibold text-sm border-b-2 transition ${dashboardTab === 'overview'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setDashboardTab('results')}
                                className={`px-4 py-3 font-semibold text-sm border-b-2 transition ${dashboardTab === 'results'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                All Results ({results.length})
                            </button>
                            <button
                                onClick={() => setDashboardTab('actions')}
                                className={`px-4 py-3 font-semibold text-sm border-b-2 transition ${dashboardTab === 'actions'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Action Plan
                            </button>
                            <div className="flex-1" />
                            {onRunQuickCheck && brandConfig && (
                                <button
                                    onClick={() => {
                                        // Extract top lost queries for quick check
                                        const lostQueries = results
                                            .filter(r => r.overallResult === 'loss')
                                            .slice(0, 5)
                                            .map(r => r.query.text);
                                        onRunQuickCheck(brandConfig.brandName, brandConfig.websiteUrl, lostQueries);
                                    }}
                                    className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg font-semibold flex items-center gap-1 mr-2"
                                >
                                    <Zap className="w-4 h-4" />
                                    Quick Check Lost Queries
                                </button>
                            )}
                            <button
                                onClick={() => setStage('setup')}
                                className="px-4 py-2 text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                            >
                                <RefreshCw className="w-4 h-4" />
                                New Analysis
                            </button>
                        </div>

                        {/* Tab Content */}
                        {dashboardTab === 'overview' && (
                            <DashboardOverview
                                report={report}
                                brandName={brandConfig.brandName}
                                onViewResults={() => setDashboardTab('results')}
                                onViewGaps={() => setDashboardTab('actions')}
                                onViewActions={() => setDashboardTab('actions')}
                            />
                        )}

                        {dashboardTab === 'results' && (
                            <ResultsTable
                                results={results}
                                brandName={brandConfig.brandName}
                                onSelectQuery={setSelectedQuery}
                            />
                        )}

                        {dashboardTab === 'actions' && actionPlan && (
                            <ActionPlanView
                                actionPlan={actionPlan}
                                brandName={brandConfig.brandName}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
