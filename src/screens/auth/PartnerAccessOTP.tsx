import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Mail, Smartphone } from 'lucide-react';
import { Screen } from '../../types';
import { verifyOtp, requestOtp } from '../../api/auth';
import { setAuthToken, setRefreshToken } from '../../api/client';
import { OnboardingShell, PageHeader, ToastContainer, useToasts } from '../../components/ui';

interface AuthProps {
    onNavigate: (screen: Screen) => void;
    authData: { value: string; type: 'email' | 'phone' } | null;
}

export const PartnerAccessOTP: React.FC<AuthProps> = ({ onNavigate, authData }) => {
    const isEmail = authData?.type === 'email';
    const contactValue = authData?.value || 'your device';

    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(30);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const { toasts, showToast, dismissToast } = useToasts();

    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const next = [...otp];
        next[index] = value.slice(-1);
        setOtp(next);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
        if (e.key === 'Enter') handleVerify();
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const next = [...otp];
        pasted.split('').forEach((c, i) => { next[i] = c; });
        setOtp(next);
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const handleResend = async () => {
        if (!authData) return;
        setResending(true);
        try {
            await requestOtp(authData.value, authData.type);
            setOtp(['', '', '', '', '', '']);
            setCountdown(30);
            inputRefs.current[0]?.focus();
            showToast('A new OTP has been sent.', 'success', 3000);
        } catch {
            showToast('Failed to resend OTP. Please try again.', 'error');
        } finally {
            setResending(false);
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length !== 6 || !authData || loading) return;
        setLoading(true);
        try {
            const res = await verifyOtp(authData.value, code, 'partner');
            const data = res.data || res;
            const access = data.access_token || data.access;
            const refresh = data.refresh_token || data.refresh;
            if (!access) throw new Error('No access token received');
            setAuthToken(access);
            if (refresh) setRefreshToken(refresh);
            onNavigate('PARTNER_CATEGORY');
        } catch (err) {
            console.error('Failed to verify OTP', err);
            showToast('Invalid OTP. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const codeFilled = otp.every((d) => d !== '');

    return (
        <OnboardingShell
            title="Verify Account"
            eyebrow="Step 2 of 4"
            onBack={() => onNavigate('PARTNER_ACCESS')}
            progress={{ current: 2, total: 4 }}
        >
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            <PageHeader
                eyebrow="Authentication"
                title={
                    <>
                        Verify it's <span className="text-tlb-yellow">really you.</span>
                    </>
                }
                subtitle={
                    <>
                        We've sent a 6-digit code to{' '}
                        <span className="font-bold text-tlb-dark">{contactValue}</span>. Enter it below to continue.
                    </>
                }
            />

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-tlb-yellow/15 text-tlb-yellow flex items-center justify-center">
                        {isEmail ? <Mail size={18} /> : <Smartphone size={18} />}
                    </div>
                    <div>
                        <h3 className="font-black text-sm">{isEmail ? 'Email Verification' : 'Mobile Verification'}</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                            Enter 6-digit code
                        </p>
                    </div>
                </div>

                <div className="flex justify-between gap-1.5 sm:gap-2.5">
                    {otp.map((digit, i) => (
                        <input
                            key={i}
                            ref={(el) => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            onPaste={i === 0 ? handlePaste : undefined}
                            className={`flex-1 aspect-[4/5] max-w-[3.25rem] bg-gray-50 border-2 rounded-2xl text-center text-2xl font-black focus:outline-none transition-all ${
                                digit
                                    ? 'border-tlb-yellow bg-tlb-yellow/5 text-tlb-dark'
                                    : 'border-gray-200 focus:border-tlb-yellow focus:ring-2 focus:ring-tlb-yellow/20'
                            }`}
                        />
                    ))}
                </div>

                <div className="mt-6 text-center text-sm">
                    <span className="text-gray-400">Didn't receive the code? </span>
                    {countdown > 0 ? (
                        <span className="text-gray-400 font-bold">Resend in 0:{String(countdown).padStart(2, '0')}</span>
                    ) : (
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="text-tlb-yellow font-black underline underline-offset-4 disabled:opacity-50"
                        >
                            {resending ? 'Sending…' : 'Resend OTP'}
                        </button>
                    )}
                </div>

                <motion.button
                    type="button"
                    onClick={handleVerify}
                    disabled={!codeFilled || loading}
                    whileHover={codeFilled && !loading ? { scale: 1.01 } : undefined}
                    whileTap={codeFilled && !loading ? { scale: 0.99 } : undefined}
                    className={`mt-8 w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-base transition-all ${
                        codeFilled && !loading
                            ? 'bg-tlb-yellow text-tlb-dark shadow-xl shadow-tlb-yellow/30'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Verifying…
                        </>
                    ) : (
                        <>
                            Verify &amp; Continue <ArrowRight size={18} />
                        </>
                    )}
                </motion.button>

                <button
                    onClick={() => onNavigate('PARTNER_ACCESS')}
                    className="mt-3 w-full py-2 text-xs text-gray-400 hover:text-tlb-dark underline underline-offset-4 transition-colors"
                >
                    Change {isEmail ? 'email' : 'mobile number'}
                </button>
            </motion.div>
        </OnboardingShell>
    );
};
