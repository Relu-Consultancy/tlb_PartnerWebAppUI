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
    /** Persists whatever's filled in so far and exits to My Listings, without requiring the step to be complete. Omit to hide the affordance. */
    onSaveDraft?: () => void;
    savingDraft?: boolean;
}

/** Shared bottom action row for every wizard step — replaces the old per-entity WizardNavigation. */
export const WizardNav: React.FC<WizardNavProps> = ({
    onBack, onNext, nextText = 'Continue', backText = 'Back', nextIcon, nextDisabled = false, loading = false,
    onSaveDraft, savingDraft = false,
}) => (
    <div className="mt-1 pt-4 border-t border-tlb-divider flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
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
        {onSaveDraft && (
            <button
                type="button"
                onClick={onSaveDraft}
                disabled={savingDraft || loading}
                className="pt-link text-center text-xs font-bold disabled:opacity-50"
            >
                {savingDraft ? 'Saving draft…' : 'Save as draft & exit'}
            </button>
        )}
    </div>
);
