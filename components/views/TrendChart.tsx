import React from 'react';
import { LineChart, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface TrendChartProps {
    data: { date: number; score: number }[];
    height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, height = 120 }) => {
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
                <div className={`flex items-center gap-1 text-sm font-semibold ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-gray-500'
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
