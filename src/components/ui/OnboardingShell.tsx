import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface ProgressDotsProps {
    current: number;
    total: number;
}

/**
 * Compact step indicator for onboarding flows.
 * Renders `total` dots; dots ≤ current are yellow (filled), the active dot is
 * elongated (pill shape) for stronger visual anchor.
 */
export const ProgressDots: React.FC<ProgressDotsProps> = ({ current, total }) => (
    <div className="flex items-center gap-1.5" aria-label={`Step ${current} of ${total}`}>
        {Array.from({ length: total }).map((_, i) => {
            const idx = i + 1;
            const active = idx === current;
            const done = idx < current;
            return (
                <motion.span
                    key={i}
                    initial={false}
                    animate={{
                        width: active ? 22 : 6,
                        backgroundColor: done || active ? '#FACC15' : '#E5E7EB',
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="h-1.5 rounded-full"
                />
            );
        })}
    </div>
);

interface OnboardingShellProps {
    children: React.ReactNode;
    /** Page title shown on the right of the back button in the sticky header. */
    title: string;
    /** Optional short eyebrow shown above the page title (e.g. "Step 2 of 4"). */
    eyebrow?: string;
    /** Where the back button navigates to. */
    onBack?: () => void;
    /** Optional progress dots in the header (current / total). */
    progress?: { current: number; total: number };
    /** Right slot in the header (e.g. small icon badge). */
    rightSlot?: React.ReactNode;
    /** Max width of the content area. Default `max-w-xl`. */
    maxWidth?: string;
    /** If true, render the soft yellow decorative blob behind content. Default `true`. */
    showAmbience?: boolean;
}

/**
 * Shared layout for every onboarding screen.
 * Sticky white header with logo + back + title + (optional) progress + (optional) right slot.
 * Cream background, centered content column, motion fade-in on mount.
 * Decorative blurred yellow blob softens the empty space behind the content.
 */
export const OnboardingShell: React.FC<OnboardingShellProps> = ({
    children,
    title,
    eyebrow,
    onBack,
    progress,
    rightSlot,
    maxWidth = 'max-w-xl',
    showAmbience = true,
}) => (
    <div className="min-h-screen bg-[#FDFCF8] text-tlb-dark flex flex-col">
        {/* ── Sticky header ── */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 -ml-2 text-gray-500 hover:text-tlb-dark transition-colors"
                            aria-label="Back"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-tlb-dark rounded-lg flex items-center justify-center text-tlb-yellow font-black text-[10px] shrink-0">
                            TLB
                        </div>
                        <div className="min-w-0">
                            {eyebrow && (
                                <div className="text-[9px] font-black text-tlb-yellow uppercase tracking-widest leading-none">
                                    {eyebrow}
                                </div>
                            )}
                            <div className="font-black text-sm sm:text-base truncate">{title}</div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {progress && <ProgressDots current={progress.current} total={progress.total} />}
                    {rightSlot}
                </div>
            </div>
        </header>

        {/* ── Content area with decorative ambience ── */}
        <main className="relative flex-1 px-4 sm:px-6 py-8 sm:py-12 overflow-hidden">
            {showAmbience && (
                <>
                    <div className="pointer-events-none absolute -top-20 -right-32 w-96 h-96 bg-tlb-yellow/15 rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute top-1/3 -left-32 w-80 h-80 bg-tlb-yellow/10 rounded-full blur-3xl" />
                </>
            )}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`relative ${maxWidth} mx-auto`}
            >
                {children}
            </motion.div>
        </main>
    </div>
);

interface PageHeaderProps {
    /** Eyebrow tag above the title, with a sparkle icon. */
    eyebrow: string;
    /** Main title — pass JSX so callers can highlight specific words in tlb-yellow. */
    title: React.ReactNode;
    /** Subtitle below the title. */
    subtitle?: React.ReactNode;
}

/**
 * Standard hero header used inside an OnboardingShell page.
 * Bold black title with optional yellow accent words (via JSX), eyebrow pill above.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, subtitle }) => (
    <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-tlb-yellow/15 text-amber-700 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase mb-4">
            <Sparkles size={11} /> {eyebrow}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black leading-[1.1] tracking-tight">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-3 text-sm sm:text-base leading-relaxed">{subtitle}</p>}
    </div>
);
