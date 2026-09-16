import React from 'react';
import { ArrowRight } from 'lucide-react';

interface WizardNavProps {
    onBack?: () => void;
    onNext: () => void;
    nextText?: string;
    backText?: string;
    nextIcon?: React.ReactNode;
    nextDisabled?: boolean;
    loading?: boolean;
}

/** Shared bottom action row for every wizard step — replaces the old per-entity WizardNavigation. */
export const WizardNav: React.FC<WizardNavProps> = ({
    onBack, onNext, nextText = 'Continue', backText = 'Back', nextIcon, nextDisabled = false, loading = false,
}) => (
    <div className="flex items-center gap-2.5 mt-1 pt-4 border-t border-tlb-divider">
        {onBack && (
            <button type="button" onClick={onBack} className="pt-btn pt-btn-o flex-1 sm:flex-none">
                {backText}
            </button>
        )}
        <button type="button" onClick={onNext} disabled={nextDisabled || loading} className={`pt-btn pt-btn-y ${onBack ? 'flex-1' : 'w-full'}`}>
            {loading ? 'Please wait…' : nextText}
            {!loading && (nextIcon !== undefined ? nextIcon : <ArrowRight size={14} strokeWidth={2.75} />)}
        </button>
    </div>
);
