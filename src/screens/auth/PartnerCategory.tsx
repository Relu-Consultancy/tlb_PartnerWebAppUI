import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BarChart3, CalendarDays, CheckCircle2, MapPin, Users } from 'lucide-react';
import { Screen, EntityType } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { selectCategories } from '../../api/onboarding';
import { OnboardingShell, PageHeader, ToastContainer, useToasts } from '../../components/ui';
import { clearTokens } from '../../api/client';

interface AuthProps {
    onNavigate: (screen: Screen) => void;
}

const CATEGORIES: {
    name: EntityType;
    icon: any;
    desc: string;
    accent: string;
}[] = [
    {
        name: 'Events',
        icon: CalendarDays,
        desc: 'Workshops, shows & one-time experiences',
        accent: 'bg-blue-50 text-blue-600',
    },
    {
        name: 'Classes',
        icon: BarChart3,
        desc: 'Recurring lessons, batches & courses',
        accent: 'bg-purple-50 text-purple-600',
    },
    {
        name: 'Programs',
        icon: Users,
        desc: 'Long-term structured cohort programs',
        accent: 'bg-emerald-50 text-emerald-600',
    },
    {
        name: 'Venues',
        icon: MapPin,
        desc: 'List your performance or rehearsal space',
        accent: 'bg-amber-50 text-amber-600',
    },
];

export const PartnerCategory: React.FC<AuthProps> = ({ onNavigate }) => {
    const { allowedEntities, setAllowedEntities } = usePartner();
    const [selected, setSelected] = useState<EntityType[]>(allowedEntities.length > 0 ? allowedEntities : []);
    const [loading, setLoading] = useState(false);
    const { toasts, showToast, dismissToast } = useToasts();

    const toggle = (cat: EntityType) =>
        setSelected((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));

    const handleContinue = async () => {
        if (selected.length === 0 || loading) return;
        setLoading(true);
        try {
            await selectCategories(selected);
            setAllowedEntities(selected);
            onNavigate('REGISTRATION');
        } catch (err) {
            console.error('Failed to select categories', err);
            const message = err instanceof Error ? err.message : '';
            // INVALID_PARTNER_STATE → email is already a fully-onboarded partner.
            if (/not allowed in/i.test(message)) {
                clearTokens();
                sessionStorage.clear();
                showToast(
                    'This email is already registered as a partner. Redirecting you to login…',
                    'warning',
                );
                setTimeout(() => onNavigate('LOGIN'), 1800);
            } else {
                showToast(message || 'Failed to save categories. Please try again.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingShell
            title="Business Type"
            eyebrow="Step 3 of 4"
            onBack={() => onNavigate('PARTNER_ACCESS_OTP')}
            progress={{ current: 3, total: 4 }}
        >
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            <PageHeader
                eyebrow="What you offer"
                title={
                    <>
                        Pick the categories you <span className="text-tlb-yellow">offer.</span>
                    </>
                }
                subtitle="Select one or more. You can always change this later from your profile settings."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {CATEGORIES.map((cat, i) => {
                    const isSelected = selected.includes(cat.name);
                    return (
                        <motion.button
                            key={cat.name}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.05 + i * 0.05 }}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggle(cat.name)}
                            className={`group relative text-left p-5 sm:p-6 rounded-2xl border-2 transition-all ${
                                isSelected
                                    ? 'border-tlb-yellow bg-tlb-yellow/5 shadow-xl shadow-tlb-yellow/15'
                                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                            }`}
                        >
                            {/* Check badge */}
                            <div
                                className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                    isSelected ? 'bg-tlb-yellow text-tlb-dark scale-100' : 'bg-gray-100 text-gray-300 scale-90'
                                }`}
                            >
                                <CheckCircle2 size={14} />
                            </div>

                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${cat.accent}`}>
                                <cat.icon size={22} />
                            </div>
                            <div className="font-black text-base mb-1">{cat.name}</div>
                            <div className="text-xs text-gray-500 leading-relaxed pr-6">{cat.desc}</div>
                        </motion.button>
                    );
                })}
            </div>

            <div className="mt-6 text-center text-xs text-gray-400">
                {selected.length === 0
                    ? 'Select at least one category to continue'
                    : `${selected.length} selected — you can change this later`}
            </div>

            <motion.button
                type="button"
                onClick={handleContinue}
                disabled={selected.length === 0 || loading}
                whileHover={selected.length > 0 && !loading ? { scale: 1.01 } : undefined}
                whileTap={selected.length > 0 && !loading ? { scale: 0.99 } : undefined}
                className={`mt-6 w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-base transition-all ${
                    selected.length > 0 && !loading
                        ? 'bg-tlb-yellow text-tlb-dark shadow-xl shadow-tlb-yellow/30'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
                {loading ? (
                    <>
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Saving…
                    </>
                ) : (
                    <>
                        Continue to Registration <ArrowRight size={18} />
                    </>
                )}
            </motion.button>
        </OnboardingShell>
    );
};
