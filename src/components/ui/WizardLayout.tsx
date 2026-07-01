import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check } from 'lucide-react';

export type ThemeColor = 'purple' | 'blue' | 'yellow' | 'emerald' | 'amber';

interface WizardLayoutProps {
    title: string;
    subtitle?: string;
    stepText?: string;
    progressPercentage: number;
    themeColor: ThemeColor;
    onBack: () => void;
    children: React.ReactNode;
}

const themeStyles: Record<ThemeColor, { text: string; gradient: string; solid: string; soft: string }> = {
    purple: { text: 'text-purple-500', gradient: 'bg-gradient-to-r from-purple-400 to-purple-600', solid: 'bg-purple-500', soft: 'bg-purple-100' },
    blue: { text: 'text-blue-500', gradient: 'bg-gradient-to-r from-blue-400 to-blue-600', solid: 'bg-blue-500', soft: 'bg-blue-100' },
    yellow: { text: 'text-tlb-yellow', gradient: 'bg-tlb-yellow', solid: 'bg-tlb-yellow', soft: 'bg-tlb-yellow/20' },
    emerald: { text: 'text-emerald-500', gradient: 'bg-gradient-to-r from-emerald-400 to-emerald-600', solid: 'bg-emerald-500', soft: 'bg-emerald-100' },
    amber: { text: 'text-amber-500', gradient: 'bg-gradient-to-r from-amber-400 to-amber-600', solid: 'bg-amber-500', soft: 'bg-amber-100' },
};

// Parse "Step 2 of 5" / "Stage 5 of 5" → { current, total }
const parseSteps = (stepText?: string): { current: number; total: number } | null => {
    if (!stepText) return null;
    const m = stepText.match(/(\d+)\s*of\s*(\d+)/i);
    if (!m) return null;
    const current = Number(m[1]);
    const total = Number(m[2]);
    return total > 0 && total <= 12 ? { current, total } : null;
};

export const WizardLayout: React.FC<WizardLayoutProps> = ({
    title,
    subtitle,
    stepText,
    progressPercentage,
    themeColor,
    onBack,
    children,
}) => {
    const styles = themeStyles[themeColor] || themeStyles.yellow;
    const steps = parseSteps(stepText);

    return (
        <div className="min-h-screen bg-gray-50 pb-8">
            {/* Header */}
            <header className="bg-white p-4 sm:p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                <motion.button
                    onClick={onBack}
                    whileHover={{ x: -2 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </motion.button>
                <div className="text-center">
                    <h1 className="font-black text-lg">{title}</h1>
                    {stepText && (
                        <p className={`text-[10px] font-bold ${styles.text} uppercase tracking-widest mt-0.5`}>
                            {stepText} {subtitle ? `— ${subtitle}` : ''}
                        </p>
                    )}
                </div>
                <div className="w-10" />
            </header>

            {/* Progress — segmented step pills, or a single bar as fallback */}
            {steps ? (
                <div className="bg-white px-4 sm:px-6 pb-3 border-b border-gray-100">
                    <div className="tlb-content flex items-center gap-1.5">
                        {Array.from({ length: steps.total }).map((_, i) => {
                            const idx = i + 1;
                            const done = idx < steps.current;
                            const active = idx === steps.current;
                            return (
                                <div key={idx} className="flex-1 flex items-center gap-1.5">
                                    <div className="relative flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                        <motion.div
                                            className={`h-full rounded-full ${done || active ? styles.gradient : ''}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: done ? '100%' : active ? '55%' : '0%' }}
                                            transition={{ duration: 0.5, ease: 'easeOut' }}
                                        />
                                    </div>
                                    {done && (
                                        <span className={`w-3.5 h-3.5 rounded-full ${styles.solid} flex items-center justify-center shrink-0`}>
                                            <Check size={9} className="text-white" strokeWidth={3.5} />
                                        </span>
                                    )}
                                    {active && (
                                        <span className={`w-3.5 h-3.5 rounded-full ${styles.solid} shrink-0 ring-2 ring-offset-1 ring-current ${styles.text} animate-pulse`} />
                                    )}
                                    {!done && !active && <span className="w-3.5 h-3.5 rounded-full bg-gray-200 shrink-0" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="w-full h-1.5 bg-gray-100">
                    <motion.div
                        className={`h-full ${styles.gradient} rounded-r-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
            )}

            {/* Main Content — fades/slides in per step */}
            <main className="p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="tlb-content space-y-8"
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
};
