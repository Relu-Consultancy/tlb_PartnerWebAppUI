import React from 'react';
import { ThemeColor } from './WizardLayout';

interface WizardNavigationProps {
    onBack?: () => void;
    onNext: () => void;
    nextText?: string;
    backText?: string;
    nextIcon?: React.ReactNode;
    themeColor: ThemeColor;
}

export const WizardNavigation: React.FC<WizardNavigationProps> = ({
    onBack,
    onNext,
    nextText = 'Next',
    backText = '← Back',
    nextIcon,
    themeColor,
}) => {
    // Dynamic color mappings based on theme
    const themeStyles = {
        purple: {
            button: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700',
            shadow: 'shadow-purple-200',
        },
        blue: {
            button: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700',
            shadow: 'shadow-blue-200',
        },
        yellow: {
            button: 'bg-tlb-yellow text-tlb-dark hover:brightness-95',
            shadow: 'shadow-tlb-yellow/20',
        },
        emerald: {
            button: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700',
            shadow: 'shadow-emerald-200',
        },
        amber: {
            button: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700',
            shadow: 'shadow-amber-200',
        },
    };

    const styles = themeStyles[themeColor] || themeStyles.yellow;

    return (
        <div className="flex gap-3 pt-2">
            {onBack && (
                <button 
                    onClick={onBack} 
                    className="flex-1 py-3 sm:py-4 border border-gray-200 rounded-2xl font-bold text-gray-500 text-sm hover:bg-gray-50 transition-colors"
                >
                    {backText}
                </button>
            )}
            <button
                onClick={onNext}
                className={`${onBack ? 'flex-1' : 'w-full'} tlb-button py-3 sm:py-4 gap-2 text-sm sm:text-base shadow-lg transition-all ${styles.button} ${styles.shadow}`}
            >
                {nextText} {nextIcon}
            </button>
        </div>
    );
};
