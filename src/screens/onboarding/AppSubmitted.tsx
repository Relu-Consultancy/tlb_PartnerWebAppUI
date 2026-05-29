import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Clock, HelpCircle, Hourglass } from 'lucide-react';
import { Screen } from '../../types';
import { OnboardingShell, PageHeader } from '../../components/ui';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

type StepStatus = 'done' | 'current' | 'pending';

export const AppSubmitted: React.FC<OnboardingProps> = ({ onNavigate }) => {
    const steps: { label: string; time: string; status: StepStatus }[] = [
        { label: 'Application Submitted', time: 'Today, 10:24 AM', status: 'done' },
        { label: 'Review in Progress', time: 'Started immediately', status: 'current' },
        { label: 'Final Decision', time: 'Estimated 24–48 hrs', status: 'pending' },
    ];

    return (
        <OnboardingShell
            title="Application Status"
            eyebrow="Under Review"
            onBack={() => onNavigate('REGISTRATION')}
            rightSlot={
                <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg">
                    <Hourglass size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
                </div>
            }
        >
            <PageHeader
                eyebrow="Application Status"
                title={
                    <>
                        Your application is <span className="text-tlb-yellow">under review.</span>
                    </>
                }
                subtitle="Our team is reviewing your credentials. You'll hear from us within 24–48 hours via email."
            />

            {/* Status hero */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="relative bg-tlb-dark text-white rounded-3xl p-8 sm:p-10 overflow-hidden mb-8"
            >
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-tlb-yellow/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-tlb-yellow/10 rounded-full blur-3xl" />

                <div className="relative flex flex-col items-center text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                        className="w-20 h-20 rounded-full border-4 border-tlb-yellow/30 border-t-tlb-yellow mb-6"
                    />
                    <div className="inline-flex items-center gap-2 bg-tlb-yellow text-tlb-dark px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                        <Clock size={12} /> Under Review
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black mb-2">We're checking everything</h2>
                    <p className="text-gray-400 max-w-sm text-sm">
                        Most applications are approved within 24 hours. We'll email you the moment a decision is made.
                    </p>
                </div>
            </motion.div>

            {/* Timeline */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5">Timeline</h3>
                <div className="relative space-y-1">
                    {/* Vertical connector */}
                    <div className="absolute left-5 top-5 bottom-5 w-px bg-gray-100" />
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.label}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
                            className="relative flex gap-4 items-start py-3"
                        >
                            <div
                                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                    step.status === 'done'
                                        ? 'bg-tlb-yellow text-tlb-dark'
                                        : step.status === 'current'
                                        ? 'bg-white border-2 border-tlb-yellow text-tlb-yellow'
                                        : 'bg-white border-2 border-gray-100 text-gray-300'
                                }`}
                            >
                                {step.status === 'current' && (
                                    <span className="absolute inset-0 rounded-full border-2 border-tlb-yellow animate-ping opacity-40" />
                                )}
                                {step.status === 'done' ? (
                                    <CheckCircle2 size={18} />
                                ) : step.status === 'current' ? (
                                    <Clock size={18} />
                                ) : (
                                    <CheckCircle2 size={18} />
                                )}
                            </div>
                            <div className="flex-1 pt-1">
                                <h4
                                    className={`font-black ${
                                        step.status === 'pending' ? 'text-gray-300' : 'text-tlb-dark'
                                    }`}
                                >
                                    {step.label}
                                </h4>
                                <p
                                    className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${
                                        step.status === 'current' ? 'text-tlb-yellow' : 'text-gray-400'
                                    }`}
                                >
                                    {step.time}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <motion.button
                type="button"
                onClick={() => onNavigate('HOME')}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="mt-6 w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-base bg-tlb-yellow text-tlb-dark shadow-xl shadow-tlb-yellow/30"
            >
                Go to Dashboard <ArrowRight size={18} />
            </motion.button>

            <button className="mt-4 w-full flex items-center justify-center gap-2 text-tlb-dark font-bold text-sm hover:text-tlb-yellow transition-colors">
                <HelpCircle size={16} /> Contact Support
            </button>
        </OnboardingShell>
    );
};
