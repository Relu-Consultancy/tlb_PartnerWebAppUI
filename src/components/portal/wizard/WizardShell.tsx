import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { EntityType } from '../../../types';
import { SERVICE_TONE, SERVICE_LABEL } from '../../../constants/entityMeta';
import { Pill } from '../primitives';

interface WizardShellProps {
    title: string;
    entityType: EntityType;
    step: number;
    totalSteps: number;
    stepLabel?: string;
    onBack: () => void;
    children: React.ReactNode;
}

/**
 * Shared chrome for every listing-creation wizard (Events/Classes/Programs/Venues) —
 * replaces the old per-entity-tinted WizardLayout. Follows the same single-amber-accent
 * convention as every other redesigned portal screen (pt-btn-y, pt-seg.is-active, etc.);
 * the entity is identified by a Pill (SERVICE_TONE) rather than a bespoke theme color,
 * since no other part of the redesigned portal recolors buttons/progress per entity.
 */
export const WizardShell: React.FC<WizardShellProps> = ({
    title, entityType, step, totalSteps, stepLabel, onBack, children,
}) => (
    <div className="min-h-screen bg-tlb-canvas pb-10">
        <header className="bg-white px-4 sm:px-6 py-4 flex items-center gap-3 sticky top-0 z-30 border-b border-tlb-line">
            <button type="button" onClick={onBack} aria-label="Back" className="pt-btn pt-btn-o !px-2.5 flex-none">
                <ArrowLeft size={16} strokeWidth={2.75} />
            </button>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="pt-h-sec truncate">{title}</h1>
                    <Pill tone={SERVICE_TONE[entityType]}>{SERVICE_LABEL[entityType]}</Pill>
                </div>
                <p className="pt-eyebrow mt-0.5">Step {step} of {totalSteps}{stepLabel ? ` · ${stepLabel}` : ''}</p>
            </div>
        </header>

        <div className="bg-white px-4 sm:px-6 pb-3.5 border-b border-tlb-line">
            <div className="max-w-3xl mx-auto pt-wiz-track">
                {Array.from({ length: totalSteps }).map((_, i) => {
                    const idx = i + 1;
                    const done = idx < step;
                    const active = idx === step;
                    return (
                        <div key={idx} className="flex-1 flex items-center gap-1.5">
                            <div className="pt-wiz-seg">
                                <motion.span
                                    initial={{ width: 0 }}
                                    animate={{ width: done ? '100%' : active ? '55%' : '0%' }}
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                />
                            </div>
                            <span className={`pt-wiz-dot ${done ? 'is-done' : active ? 'is-active' : ''}`} />
                        </div>
                    );
                })}
            </div>
        </div>

        <main className="px-4 sm:px-6 py-5">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="max-w-3xl mx-auto flex flex-col gap-5"
            >
                {children}
            </motion.div>
        </main>
    </div>
);
