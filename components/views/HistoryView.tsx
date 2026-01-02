import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart,
    ChevronRight,
    PieChart,
    Calendar,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Loader2,
    ChevronDown
} from 'lucide-react';
import { AEOReport } from '../../types';
import { getReports, deleteReport, isSupabaseConfigured, getReportById } from '../../services/supabaseService';
import { TrendChart } from './TrendChart';

interface HistoryViewProps {
    onSelectReport: (report: AEOReport) => void;
    onBack: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectReport, onBack }) => {
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
