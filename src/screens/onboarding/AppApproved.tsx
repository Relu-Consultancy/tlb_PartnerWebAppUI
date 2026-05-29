import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, HelpCircle, LayoutGrid, Sparkles } from 'lucide-react';
import { Screen } from '../../types';
import { OnboardingShell, PageHeader } from '../../components/ui';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

export const AppApproved: React.FC<OnboardingProps> = ({ onNavigate }) => {
    const steps = [
        { label: 'Application Submitted', time: 'Oct 24, 10:24 AM' },
        { label: 'Review Completed', time: 'Oct 25, 02:15 PM' },
        { label: 'Approved', time: 'Just now' },
    ];

    return (
        <OnboardingShell
            title="Application Status"
            eyebrow="Approved"
            onBack={() => onNavigate('APP_SUBMITTED')}
            rightSlot={
                <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Approved</span>
                </div>
            }
        >
            <PageHeader
                eyebrow="Congratulations"
                title={
                    <>
                        You're <span className="text-tlb-yellow">approved.</span>
                    </>
                }
                subtitle="Your expertise and brand align perfectly with our vision for The Little Broadway. Welcome aboard."
            />

            {/* Celebration hero */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="relative bg-tlb-dark text-white rounded-3xl p-8 sm:p-10 overflow-hidden mb-8"
            >
                <div className="absolute -top-16 -right-16 w-72 h-72 bg-tlb-yellow/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-tlb-yellow/15 rounded-full blur-3xl" />

                <div className="relative flex flex-col items-center text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: [0, -8, 8, 0] }}
                        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                        className="w-20 h-20 rounded-full bg-tlb-yellow text-tlb-dark flex items-center justify-center mb-6 shadow-2xl shadow-tlb-yellow/40"
                    >
                        <CheckCircle2 size={36} strokeWidth={3} />
                    </motion.div>
                    <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                        <Sparkles size={12} /> Verified Partner
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black mb-2">Welcome to the spotlight</h2>
                    <p className="text-gray-400 max-w-sm text-sm">
                        Sign the partner agreement to finish activating your account and start publishing listings.
                    </p>
                </div>
            </motion.div>

            {/* Timeline — all done */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5">Timeline</h3>
                <div className="relative space-y-1">
                    <div className="absolute left-5 top-5 bottom-5 w-px bg-tlb-yellow" />
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.label}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
                            className="relative flex gap-4 items-start py-3"
                        >
                            <div className="relative z-10 w-10 h-10 rounded-full bg-tlb-yellow text-tlb-dark flex items-center justify-center shrink-0">
                                <CheckCircle2 size={18} />
                            </div>
                            <div className="flex-1 pt-1">
                                <h4 className="font-black text-tlb-dark">{step.label}</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-0.5 text-tlb-yellow">
                                    {step.time}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <motion.button
                type="button"
                onClick={() => onNavigate('AGREEMENT_SUBMIT')}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="mt-6 w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-base bg-tlb-yellow text-tlb-dark shadow-xl shadow-tlb-yellow/30"
            >
                Sign Partner Agreement <ArrowRight size={18} />
            </motion.button>

            <button
                onClick={() => onNavigate('HOME')}
                className="mt-4 w-full flex items-center justify-center gap-2 text-gray-500 font-bold text-sm hover:text-tlb-dark transition-colors"
            >
                <LayoutGrid size={16} /> Back to Dashboard
            </button>

            <button className="mt-3 w-full flex items-center justify-center gap-2 text-tlb-dark font-bold text-sm hover:text-tlb-yellow transition-colors">
                <HelpCircle size={16} /> Contact Support
            </button>
        </OnboardingShell>
    );
};
