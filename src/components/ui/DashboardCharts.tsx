import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const MONTH_LABELS_6 = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
export const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const AreaSparkline: React.FC<{ data: number[]; color: string; id: string }> = ({ data, color, id }) => {
    if (data.length < 2) return null;
    const h = 44, w = 100;
    const max = Math.max(...data); const min = Math.min(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 8) - 4;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const line = pts.join(' ');
    const area = `0,${h} ${line} ${w},${h}`;
    return (
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
            <defs>
                <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={area} fill={`url(#sp-${id})`} />
            <polyline points={line} fill="none" stroke={color} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" />
            {(() => {
                const last = pts[pts.length - 1].split(',').map(Number);
                return <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />;
            })()}
        </svg>
    );
};

export const TrendAreaChart: React.FC<{
    data: number[]; labels: string[]; color: string; id: string;
}> = ({ data, labels, color, id }) => {
    if (data.length < 2) return null;
    const h = 80, w = 400;
    const max = Math.max(...data, 1); const min = 0;
    const range = max - min;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 8) - 4;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const line = pts.join(' ');
    const area = `0,${h} ${line} ${w},${h}`;
    const step = Math.ceil(labels.length / 5);
    const shown = labels.map((l, i) => ({ l, i, show: i % step === 0 || i === labels.length - 1 })).filter(x => x.show);
    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: 80 }}>
                <defs>
                    <linearGradient id={`ta-${id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon points={area} fill={`url(#ta-${id})`} />
                <polyline points={line} fill="none" stroke={color} strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
                {(() => {
                    const last = pts[pts.length - 1].split(',').map(Number);
                    return <circle cx={last[0]} cy={last[1]} r="3.5" fill="white" stroke={color} strokeWidth="2" />;
                })()}
            </svg>
            <div className="flex justify-between mt-1.5 px-0.5">
                {shown.map(({ l, i }) => (
                    <span key={i} className="text-[9px] text-gray-400 font-bold">{l}</span>
                ))}
            </div>
        </div>
    );
};

export const WeeklyBarChart: React.FC<{
    data: number[]; labels: string[]; color: string; highlightLast?: boolean;
}> = ({ data, labels, color, highlightLast = true }) => {
    const max = Math.max(...data, 1);
    const total = data.reduce((a, b) => a + b, 0);
    return (
        <div>
            <div className="flex items-end gap-1.5 h-20">
                {data.map((v, i) => {
                    const isLast = highlightLast && i === data.length - 1;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                            {v > 0 ? (
                                <div
                                    className="w-full rounded-t-lg transition-all duration-500"
                                    style={{
                                        height: `${Math.max((v / max) * 64, 4)}px`,
                                        backgroundColor: color,
                                        opacity: isLast ? 1 : 0.45 + (i / data.length) * 0.45,
                                    }}
                                />
                            ) : (
                                <div className="w-full rounded-t-lg" style={{ height: 4, backgroundColor: '#F3F4F6' }} />
                            )}
                            <span className={`text-[9px] font-bold ${isLast ? 'text-gray-700' : 'text-gray-400'}`}>{labels[i]}</span>
                        </div>
                    );
                })}
            </div>
            {total === 0 && (
                <p className="text-center text-[10px] font-bold text-gray-300 mt-3 uppercase tracking-widest">No activity yet this week</p>
            )}
        </div>
    );
};

export const DonutChart: React.FC<{
    segments: { value: number; color: string; label: string }[];
    centerLabel?: string;
    centerSub?: string;
}> = ({ segments, centerLabel, centerSub }) => {
    const total = segments.reduce((a, b) => a + b.value, 0) || 1;
    const r = 35, cx = 50, cy = 50, circ = 2 * Math.PI * r;
    let acc = 0;
    const arcs = segments.map(seg => {
        const dash = (seg.value / total) * circ;
        const arc = { ...seg, dash, acc };
        acc += dash;
        return arc;
    });
    const hasData = segments.some(s => s.value > 0);
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth="12" />
            {hasData ? arcs.map((arc, i) => (
                <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                    stroke={arc.color} strokeWidth="12"
                    strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
                    strokeDashoffset={circ / 4 - arc.acc}
                    transform="rotate(-90 50 50)"
                    strokeLinecap="butt"
                />
            )) : (
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth="12" strokeDasharray="4 3" />
            )}
            {centerLabel && (
                <text x="50" y="47" textAnchor="middle" fill="#111827" fontSize="13" fontWeight="900">{centerLabel}</text>
            )}
            {centerSub && (
                <text x="50" y="58" textAnchor="middle" fill="#9CA3AF" fontSize="6.5" fontWeight="700">{centerSub}</text>
            )}
        </svg>
    );
};

export const fmtCurrency = (v: number) =>
    v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`;

export const trendPct = (arr: number[]) => {
    if (arr.length < 2) return 0;
    const prev = arr[arr.length - 2]; const curr = arr[arr.length - 1];
    return prev ? Math.round(((curr - prev) / prev) * 100) : 0;
};

export const TrendBadge: React.FC<{ pct: number }> = ({ pct }) => {
    if (pct === 0) return <span className="text-[9px] font-bold text-gray-300">—</span>;
    const up = pct > 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-[9px] font-black ${up ? 'text-emerald-500' : 'text-red-400'}`}>
            {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {Math.abs(pct)}%
        </span>
    );
};
