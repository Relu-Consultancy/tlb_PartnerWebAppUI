import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

// ───────────────────────────────────────────────────────────────────────────
// Statistics-only chart toolkit — interactive (hover tooltips), animated.
// Kept separate from the shared DashboardCharts so the Dashboard stays untouched.
// ───────────────────────────────────────────────────────────────────────────

// ── Formatters ──
export const fmtCurrency = (v: number): string => {
    const n = Math.round(v);
    return n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr`
        : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
        : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K`
        : `₹${n}`;
};

export const fmtCompact = (v: number): string => {
    const n = Math.round(v);
    return n >= 1000000 ? `${(n / 1000000).toFixed(1)}M`
        : n >= 1000 ? `${(n / 1000).toFixed(1)}K`
        : `${n}`;
};

// ── Count-up hook — animates from the previous value to the new one ──
export const useCountUp = (end: number, duration = 1100): number => {
    const [val, setVal] = useState(0);
    const fromRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const from = fromRef.current;
        const delta = end - from;
        if (delta === 0) { setVal(end); return; }
        let startTime: number | null = null;
        const tick = (now: number) => {
            if (startTime === null) startTime = now;
            const p = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
            setVal(from + delta * eased);
            if (p < 1) rafRef.current = requestAnimationFrame(tick);
            else fromRef.current = end;
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [end, duration]);

    return val;
};

export const CountUp: React.FC<{
    value: number;
    format?: (n: number) => string;
    decimals?: number;
    suffix?: string;
}> = ({ value, format, decimals = 0, suffix = '' }) => {
    const v = useCountUp(value);
    const text = format ? format(v) : v.toFixed(decimals);
    return <>{text}{suffix}</>;
};

// ── Interactive area / line chart with hover tooltip + crosshair ──
export interface AreaPoint { label: string; value: number; note?: string }

export const InteractiveAreaChart: React.FC<{
    points: AreaPoint[];
    color: string;
    id: string;
    formatValue?: (n: number) => string;
    height?: number;
}> = ({ points, color, id, formatValue = (n) => `${Math.round(n)}`, height = 180 }) => {
    const [hover, setHover] = useState<number | null>(null);

    if (points.length < 2) {
        return (
            <div className="flex items-center justify-center text-[11px] font-bold text-gray-300 uppercase tracking-widest" style={{ height }}>
                Not enough data yet
            </div>
        );
    }

    const values = points.map(p => p.value);
    const max = Math.max(...values, 1);
    const n = points.length;

    // viewBox is 0..100 in both axes; preserveAspectRatio="none" stretches to fill.
    const padTop = 10, padBottom = 90; // usable vertical band inside the 0..100 box
    const xAt = (i: number) => (i / (n - 1)) * 100;
    const yAt = (v: number) => padBottom - (v / max) * (padBottom - padTop);

    const linePts = points.map((p, i) => `${xAt(i).toFixed(2)},${yAt(p.value).toFixed(2)}`).join(' ');
    const areaPts = `0,100 ${linePts} 100,100`;

    const active = hover ?? n - 1;
    const activeX = xAt(active);
    const activeY = yAt(points[active].value);
    const tooltipLeft = Math.min(Math.max(activeX, 14), 86);

    const step = Math.ceil(n / 6);

    return (
        <div className="w-full">
            <div className="relative w-full" style={{ height }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id={`iac-${id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {/* faint horizontal gridlines */}
                    {[25, 50, 75].map(g => (
                        <line key={g} x1="0" y1={g} x2="100" y2={g} stroke="#F1F1F4" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                    ))}
                    <motion.polygon
                        points={areaPts}
                        fill={`url(#iac-${id})`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    />
                    <motion.polyline
                        points={linePts}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                    {/* crosshair */}
                    {hover !== null && (
                        <line x1={activeX} y1="0" x2={activeX} y2="100" stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" vectorEffect="non-scaling-stroke" />
                    )}
                </svg>

                {/* marker dot (HTML so it stays perfectly round) */}
                <div
                    className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md pointer-events-none transition-all duration-150"
                    style={{
                        left: `${activeX}%`,
                        top: `${activeY}%`,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: color,
                    }}
                />

                {/* tooltip */}
                {hover !== null && (
                    <div
                        className="absolute z-10 pointer-events-none -translate-x-1/2 -translate-y-full"
                        style={{ left: `${tooltipLeft}%`, top: `${activeY}%`, marginTop: -10 }}
                    >
                        <div className="bg-gray-900 text-white rounded-xl px-3 py-2 shadow-xl whitespace-nowrap">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{points[active].label}</p>
                            <p className="text-sm font-black leading-tight">{formatValue(points[active].value)}</p>
                            {points[active].note && <p className="text-[10px] text-gray-300 font-semibold">{points[active].note}</p>}
                        </div>
                    </div>
                )}

                {/* hover zones */}
                <div className="absolute inset-0 flex" onMouseLeave={() => setHover(null)}>
                    {points.map((_, i) => (
                        <div key={i} className="flex-1 h-full cursor-pointer" onMouseEnter={() => setHover(i)} />
                    ))}
                </div>
            </div>

            {/* x-axis labels */}
            <div className="flex mt-2">
                {points.map((p, i) => (
                    <div key={i} className="flex-1 text-center">
                        {(i % step === 0 || i === n - 1) && (
                            <span className={`text-[9px] font-bold ${i === active ? 'text-gray-700' : 'text-gray-400'}`}>{p.label}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Interactive bar chart with hover tooltip ──
export interface BarPoint { label: string; value: number; note?: string }

export const InteractiveBarChart: React.FC<{
    points: BarPoint[];
    color: string;
    formatValue?: (n: number) => string;
    height?: number;
}> = ({ points, color, formatValue = (n) => `${Math.round(n)}`, height = 150 }) => {
    const [hover, setHover] = useState<number | null>(null);
    const max = Math.max(...points.map(p => p.value), 1);

    return (
        <div className="w-full">
            <div className="flex items-end gap-2" style={{ height }} onMouseLeave={() => setHover(null)}>
                {points.map((p, i) => {
                    const pct = (p.value / max) * 100;
                    const isActive = hover === i;
                    return (
                        <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-2 relative" onMouseEnter={() => setHover(i)}>
                            {isActive && (
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none">
                                    <div className="bg-gray-900 text-white rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{p.label}</p>
                                        <p className="text-xs font-black leading-tight">{formatValue(p.value)}</p>
                                    </div>
                                </div>
                            )}
                            <div className="w-full flex-1 flex items-end">
                                <motion.div
                                    className="w-full rounded-t-lg cursor-pointer"
                                    style={{ backgroundColor: color, opacity: isActive ? 1 : 0.4 + (i / points.length) * 0.5 }}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(pct, 2)}%` }}
                                    transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
                                />
                            </div>
                            <span className={`text-[9px] font-bold ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>{p.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── Animated donut — draws each segment on mount, hover highlights ──
export interface DonutSegment { value: number; color: string; label: string }

export const AnimatedDonut: React.FC<{
    segments: DonutSegment[];
    centerLabel?: string;
    centerSub?: string;
    size?: number;
}> = ({ segments, centerLabel, centerSub, size = 130 }) => {
    const total = segments.reduce((a, b) => a + b.value, 0) || 1;
    const r = 38, cx = 50, cy = 50, circ = 2 * Math.PI * r;
    const hasData = segments.some(s => s.value > 0);

    let acc = 0;
    const arcs = segments.map(seg => {
        const dash = (seg.value / total) * circ;
        const arc = { ...seg, dash, offset: circ / 4 - acc };
        acc += dash;
        return arc;
    });

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth="11" />
                {hasData && arcs.map((arc, i) => (
                    <motion.circle
                        key={i}
                        cx={cx} cy={cy} r={r}
                        fill="none"
                        stroke={arc.color}
                        strokeWidth="11"
                        strokeLinecap="round"
                        strokeDashoffset={arc.offset}
                        initial={{ strokeDasharray: `0 ${circ}` }}
                        animate={{ strokeDasharray: `${arc.dash} ${circ - arc.dash}` }}
                        transition={{ duration: 0.9, delay: i * 0.12, ease: 'easeOut' }}
                    />
                ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {centerLabel && <span className="text-xl font-black text-gray-900 leading-none">{centerLabel}</span>}
                {centerSub && <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">{centerSub}</span>}
            </div>
        </div>
    );
};

// ── Funnel — animated horizontal stages ──
export const FunnelBars: React.FC<{
    stages: { label: string; value: number; color: string }[];
}> = ({ stages }) => {
    const max = Math.max(...stages.map(s => s.value), 1);
    return (
        <div className="space-y-3">
            {stages.map((s, i) => {
                const pct = (s.value / max) * 100;
                const dropPct = i > 0 && stages[i - 1].value > 0
                    ? Math.round((s.value / stages[i - 1].value) * 100)
                    : null;
                return (
                    <div key={s.label}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-gray-600">{s.label}</span>
                            <div className="flex items-center gap-2">
                                {dropPct !== null && (
                                    <span className="text-[9px] font-black text-gray-400">{dropPct}%</span>
                                )}
                                <span className="text-sm font-black text-gray-900">{s.value}</span>
                            </div>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: s.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(pct, 3)}%` }}
                                transition={{ duration: 0.8, delay: i * 0.12, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
