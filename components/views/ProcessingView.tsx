import React, { useState, useEffect } from 'react';
import { Loader2, BrainCircuit, Cpu } from 'lucide-react';
import { AIModel, AEOReport, QueryResult, MentionPosition, Sentiment, CompetitorIntel, AEOPlaybook } from '../../types';
import { MAX_POINTS_PER_CHECK, POSITION_POINTS, SENTIMENT_MODIFIER } from '../../constants';
import { fetchAIResponse, analyzeResponse, getCompetitorMarketIntel, generateOptimizationPlaybook } from '../../services/geminiService';

interface ProcessingViewProps {
    brand: string;
    brandUrl: string;
    queries: string[];
    trackedCompetitors: string[];
    deepThinking: boolean;
    onComplete: (report: AEOReport) => void;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({
    brand,
    brandUrl,
    queries,
    trackedCompetitors,
    deepThinking,
    onComplete
}) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Initializing agents...');

    const totalSteps = (queries.length * 3) + 3; // AI models + Intel + Playbook

    useEffect(() => {
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
                <div className={`w-32 h-32 border-4 rounded-full flex items-center justify-center transition-colors duration-1000 bg-white shadow-xl ${deepThinking ? 'border-indigo-600 shadow-[0_0_40px_rgba(79,70,229,0.3)]' : 'border-indigo-100'}`}>
                    <Loader2 className={`w-12 h-12 text-indigo-600 animate-spin`} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {deepThinking ? <Cpu className="w-8 h-8 text-indigo-600" /> : <BrainCircuit className="w-6 h-6 text-indigo-200" />}
                </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                {deepThinking ? 'Advanced Reasoning Active' : 'Building Optimization Playbook'}
            </h2>
            <p className="text-gray-600 mb-8 h-6 italic text-lg animate-pulse">"{status}"</p>

            <div className="w-full bg-gray-100 rounded-full h-4 mb-4 overflow-hidden dark:bg-gray-200">
                <div
                    className="bg-gradient-to-r from-indigo-500 to-violet-500 h-4 rounded-full transition-all duration-500 ease-out"
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
