import React from 'react';
import { motion } from 'motion/react';
import {
    ArrowRight,
    BarChart3,
    CheckCircle2,
    ChevronRight,
    PlusCircle,
    Sparkles,
    UserCircle,
} from 'lucide-react';
import { Screen } from '../../types';
import { OnboardingShell, PageHeader } from '../../components/ui';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

const NEXT_STEPS: {
    icon: any;
    title: string;
    desc: string;
    screen: Screen;
    accent: string;
}[] = [
    {
        icon: PlusCircle,
        title: 'Create Your First Listing',
        desc: 'Add a class, event, program, or venue to your storefront.',
        screen: 'CREATE_CLASS_IDENTITY',
        accent: 'bg-blue-50 text-blue-600',
    },
    {
        icon: UserCircle,
        title: 'Complete Your Profile',
        desc: 'Add photos, bio, and social links to look your best.',
        screen: 'BRAND_PROFILE',
        accent: 'bg-purple-50 text-purple-600',
    },
    {
        icon: BarChart3,
        title: 'Explore Your Dashboard',
        desc: 'Track performance, bookings, and earnings in real time.',
        screen: 'HOME',
        accent: 'bg-emerald-50 text-emerald-600',
    },
];

export const OnboardingComplete: React.FC<OnboardingProps> = ({ onNavigate }) => (
    <OnboardingShell
        title="Onboarding Complete"
        eyebrow="You're all set"
        onBack={() => onNavigate('BANK_SETUP')}
        rightSlot={
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
                <CheckCircle2 size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
            </div>
        }
    >
        <PageHeader
            eyebrow="Welcome aboard"
            title={
                <>
                    Welcome to the <span className="text-tlb-yellow">spotlight.</span>
                </>
            }
            subtitle="Your profile is live and ready to reach your audience. Here's what we'd recommend next."
        />

        {/* Hero celebration */}
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative bg-tlb-dark text-white rounded-3xl p-8 sm:p-10 overflow-hidden mb-8 text-center"
        >
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-tlb-yellow/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-16 w-80 h-80 bg-tlb-yellow/15 rounded-full blur-3xl" />
            <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />

            <div className="relative">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.7, delay: 0.2, type: 'spring', stiffness: 120 }}
                    className="inline-flex w-24 h-24 rounded-full bg-tlb-yellow text-tlb-dark items-center justify-center mb-6 shadow-2xl shadow-tlb-yellow/40"
                >
                    <CheckCircle2 size={44} strokeWidth={2.5} />
                </motion.div>

                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/15 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                    <Sparkles size={12} className="text-tlb-yellow" /> Verified Partner
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-3">You're officially in.</h2>
                <p className="text-gray-400 max-w-sm mx-auto text-sm leading-relaxed">
                    Your journey with The Little Broadway begins now. Let's get your first listing live.
                </p>
            </div>
        </motion.div>

        {/* Next steps */}
        <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Next Steps</h3>
            <div className="space-y-3">
                {NEXT_STEPS.map((item, i) => (
                    <motion.button
                        key={item.title}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.15 + i * 0.08 }}
                        whileHover={{ y: -2 }}
                        onClick={() => onNavigate(item.screen)}
                        className="w-full bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4 text-left hover:border-tlb-yellow/60 hover:shadow-xl hover:shadow-tlb-yellow/10 transition-all group"
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.accent}`}>
                            <item.icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-black text-sm sm:text-base">{item.title}</h4>
                            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                        <ChevronRight
                            size={18}
                            className="text-gray-300 group-hover:text-tlb-yellow group-hover:translate-x-0.5 transition-all shrink-0"
                        />
                    </motion.button>
                ))}
            </div>
        </div>

        <motion.button
            type="button"
            onClick={() => onNavigate('HOME')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="mt-8 w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-base bg-tlb-yellow text-tlb-dark shadow-xl shadow-tlb-yellow/30"
        >
            Go to My Dashboard <ArrowRight size={18} />
        </motion.button>
    </OnboardingShell>
);
