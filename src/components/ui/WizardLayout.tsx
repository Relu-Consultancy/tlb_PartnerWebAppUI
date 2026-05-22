import React from 'react';
import { ArrowLeft } from 'lucide-react';

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

export const WizardLayout: React.FC<WizardLayoutProps> = ({
    title,
    subtitle,
    stepText,
    progressPercentage,
    themeColor,
    onBack,
    children,
}) => {
    // Dynamic color mappings based on theme
    const themeStyles = {
        purple: {
            text: 'text-purple-500',
            bg: 'bg-purple-500',
            gradient: 'bg-gradient-to-r from-purple-400 to-purple-600',
        },
        blue: {
            text: 'text-blue-500',
            bg: 'bg-blue-500',
            gradient: 'bg-gradient-to-r from-blue-400 to-blue-600',
        },
        yellow: {
            text: 'text-tlb-yellow',
            bg: 'bg-tlb-yellow',
            gradient: 'bg-tlb-yellow', // Yellow doesn't typically need a gradient in TLB design
        },
        emerald: {
            text: 'text-emerald-500',
            bg: 'bg-emerald-500',
            gradient: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
        },
        amber: {
            text: 'text-amber-500',
            bg: 'bg-amber-500',
            gradient: 'bg-gradient-to-r from-amber-400 to-amber-600',
        },
    };

    const styles = themeStyles[themeColor] || themeStyles.yellow;

    return (
        <div className="min-h-screen bg-gray-50 pb-8">
            {/* Header */}
            <header className="bg-white p-4 sm:p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div className="text-center">
                    <h1 className="font-black text-lg">{title}</h1>
                    {stepText && (
                        <p className={`text-[10px] font-bold ${styles.text} uppercase tracking-widest mt-0.5`}>
                            {stepText} {subtitle ? `— ${subtitle}` : ''}
                        </p>
                    )}
                </div>
                {/* Placeholder to balance the flex layout */}
                <div className="w-10" />
            </header>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-gray-100">
                <div 
                    className={`h-full ${styles.gradient} transition-all duration-500 rounded-r-full`} 
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            {/* Main Content */}
            <main className="p-4 sm:p-6">
                <div className="tlb-content space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
};
