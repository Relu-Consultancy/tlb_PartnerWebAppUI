import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Mail, Smartphone, ShieldCheck } from 'lucide-react';
import { Screen } from '../../types';
import { requestOtp } from '../../api/auth';
import { OnboardingShell, PageHeader, ToastContainer, useToasts } from '../../components/ui';

interface AuthProps {
    onNavigate: (screen: Screen) => void;
    setAuthData?: (data: { value: string; type: 'email' | 'phone' }) => void;
}

const isLikelyEmail = (v: string) => v.includes('@');
const onlyDigits = (v: string) => v.replace(/\D/g, '');

export const PartnerAccess: React.FC<AuthProps> = ({ onNavigate, setAuthData }) => {
    const [contact, setContact] = useState('');
    const [loading, setLoading] = useState(false);
    const { toasts, showToast, dismissToast } = useToasts();

    const { type, identifier, valid } = useMemo(() => {
        if (isLikelyEmail(contact)) {
            const v = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
            return { type: 'email' as const, identifier: contact, valid: v };
        }
        const digits = onlyDigits(contact);
        const v = digits.length === 10;
        return { type: 'phone' as const, identifier: v ? `+91${digits}` : contact, valid: v };
    }, [contact]);

    const handleContinue = async () => {
        if (!valid || loading) return;
        setLoading(true);
        try {
            await requestOtp(identifier, type);
            setAuthData?.({ value: identifier, type });
            onNavigate('PARTNER_ACCESS_OTP');
        } catch (err) {
            console.error('Failed to request OTP', err);
            showToast(err instanceof Error ? err.message : 'Failed to send OTP. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingShell
            title="Partner Access"
            eyebrow="Step 1 of 4"
            onBack={() => onNavigate('LANDING')}
            progress={{ current: 1, total: 4 }}
        >
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            <PageHeader
                eyebrow="Get Started"
                title={
                    <>
                        Welcome to <span className="text-tlb-yellow">TLB.</span>
                    </>
                }
                subtitle="Enter your email or mobile number to begin. We'll send you a one-time code to verify it's really you."
            />

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm"
            >
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
                    Email or Mobile Number
                </label>
                <div className="relative">
                    <input
                        type="text"
                        autoFocus
                        placeholder="partner@example.com or 98765 43210"
                        className="tlb-input w-full pr-12 text-base py-3.5"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                    />
                    <div
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                            valid ? 'bg-emerald-50 text-emerald-500' : 'bg-tlb-yellow/10 text-tlb-yellow'
                        }`}
                    >
                        {type === 'email' ? <Mail size={16} /> : <Smartphone size={16} />}
                    </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-2 ml-1">
                    {type === 'email' ? "We'll send a 6-digit code to this email." : 'Indian mobile numbers, +91 prefix added automatically.'}
                </p>

                <motion.button
                    type="button"
                    onClick={handleContinue}
                    disabled={!valid || loading}
                    whileHover={valid && !loading ? { scale: 1.01 } : undefined}
                    whileTap={valid && !loading ? { scale: 0.99 } : undefined}
                    className={`mt-6 w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-base transition-all ${
                        valid && !loading
                            ? 'bg-tlb-yellow text-tlb-dark shadow-xl shadow-tlb-yellow/30'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Sending OTP…
                        </>
                    ) : (
                        <>
                            Send OTP <ArrowRight size={18} />
                        </>
                    )}
                </motion.button>

                <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-gray-400">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    Your details are encrypted in transit and at rest.
                </div>
            </motion.div>

            <div className="mt-10 text-center text-sm text-gray-500">
                Already a partner?{' '}
                <button
                    onClick={() => onNavigate('LOGIN')}
                    className="font-black text-tlb-dark hover:text-tlb-yellow transition-colors underline underline-offset-4 decoration-tlb-yellow/40"
                >
                    Sign in here
                </button>
            </div>
        </OnboardingShell>
    );
};
