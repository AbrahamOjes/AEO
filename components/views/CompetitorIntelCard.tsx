import React, { useState } from 'react';
import {
    Target,
    Link as LinkIcon,
    Check,
    Edit2,
    RefreshCw,
    AlertCircle,
    BarChart,
    Award,
    ExternalLink
} from 'lucide-react';
import { CompetitorIntel } from '../../types';

interface CompetitorIntelCardProps {
    intel: CompetitorIntel;
    onRefine: (oldName: string, name: string, url: string) => Promise<void>;
}

export const CompetitorIntelCard: React.FC<CompetitorIntelCardProps> = ({ intel, onRefine }) => {
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
        <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col hover:border-indigo-200 transition-all group relative overflow-hidden ${loading ? 'opacity-70' : 'opacity-100'} hover:shadow-md`}>
            {loading && (
                <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden z-20">
                    <div className="h-full bg-indigo-600 animate-[loading-bar_1.5s_infinite_linear]" style={{ width: '30%' }}></div>
                </div>
            )}

            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex-shrink-0 shadow-sm">
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
                                onChange={(e) => { setUrl(e.target.value); if (error) setError(null); }}
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
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </a>
                    ))}
                    {intel.source_urls.length === 0 && <span className="text-xs text-gray-300 italic">No direct sources.</span>}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `@keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }` }} />
        </div>
    );
};
