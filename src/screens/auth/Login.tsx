import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    motion,
    AnimatePresence,
    useMotionTemplate,
    useMotionValue,
} from 'motion/react';
import {
    ArrowLeft,
    ArrowRight,
    BarChart3,
    Building2,
    CalendarDays,
    GraduationCap,
    Mail,
    Smartphone,
    Sparkles,
    Star,
} from 'lucide-react';
import { Screen } from '../../types';
import { requestOtp } from '../../api/auth';
import { ToastContainer, useToasts } from '../../components/ui';

interface AuthProps {
    onNavigate: (screen: Screen) => void;
    setAuthData?: (data: { value: string; type: 'email' | 'phone' }) => void;
}

type Mode = 'phone' | 'email';

export const Login: React.FC<AuthProps> = ({ onNavigate, setAuthData }) => {
    const [mode, setMode] = useState<Mode>('phone');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const { toasts, showToast, dismissToast } = useToasts();

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPhoneValid = phone.length === 10;
    const isValid = mode === 'email' ? isEmailValid : isPhoneValid;

    const submit = async () => {
        if (!isValid || loading) return;
        const value = mode === 'email' ? email : `+91${phone}`;
        setLoading(true);
        try {
            await requestOtp(value, mode);
            setAuthData?.({ value, type: mode });
            onNavigate('OTP_VERIFY');
        } catch (err) {
            console.error('Failed to request OTP', err);
            showToast(err instanceof Error ? err.message : 'Failed to send OTP. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Mouse-following spotlight on the dark brand panel (desktop only) ──
    const brandRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(-9999);
    const mouseY = useMotionValue(-9999);
    const [brandSize, setBrandSize] = useState({ w: 1, h: 1 });

    useLayoutEffect(() => {
        const update = () => {
            if (brandRef.current) {
                const r = brandRef.current.getBoundingClientRect();
                setBrandSize({ w: r.width || 1, h: r.height || 1 });
            }
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);
    // brandSize is used for completeness; spotlight only needs mouseX/Y
    void brandSize;

    const handleBrandMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const r = brandRef.current?.getBoundingClientRect();
        if (!r) return;
        mouseX.set(e.clientX - r.left);
        mouseY.set(e.clientY - r.top);
    };
    const handleBrandLeave = () => {
        mouseX.set(-9999);
        mouseY.set(-9999);
    };

    const spotlight = useMotionTemplate`radial-gradient(420px circle at ${mouseX}px ${mouseY}px, rgba(250, 204, 21, 0.15), transparent 70%)`;

    // Submit on Enter
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter') submit();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, email, phone, loading, isValid]);

    return (
        <div className="min-h-screen bg-[#FDFCF8] text-tlb-dark flex flex-col lg:flex-row">
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            {/* ───────────── LEFT — Brand panel (desktop) / compact header (mobile) ───────────── */}
            <motion.aside
                ref={brandRef}
                onMouseMove={handleBrandMove}
                onMouseLeave={handleBrandLeave}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative bg-tlb-dark text-white overflow-hidden lg:w-1/2 lg:min-h-screen px-6 sm:px-10 py-8 lg:p-14 flex flex-col"
            >
                {/* Spotlight */}
                <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 hidden sm:block"
                    style={{ background: spotlight }}
                />
                {/* Decorative blobs */}
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-tlb-yellow/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-tlb-yellow/10 rounded-full blur-3xl pointer-events-none" />
                {/* Subtle texture */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />

                <div className="relative flex items-center justify-between">
                    <button
                        onClick={() => onNavigate('LANDING')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold"
                    >
                        <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to home</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-tlb-yellow rounded-xl flex items-center justify-center text-tlb-dark font-black text-xs">
                            TLB
                        </div>
                        <span className="font-black tracking-tight hidden sm:inline">The Little Broadway</span>
                    </div>
                </div>

                {/* Hide marketing content on mobile to keep form above the fold */}
                <div className="relative mt-10 lg:mt-auto lg:mb-auto hidden lg:flex flex-col">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase mb-6 self-start">
                        <Sparkles size={12} className="text-tlb-yellow" /> Partner Portal
                    </div>
                    <h1 className="text-4xl xl:text-5xl font-black leading-[1.05] tracking-tight">
                        Welcome
                        <br />
                        <span className="text-tlb-yellow">back.</span>
                    </h1>
                    <p className="text-gray-400 mt-5 text-base leading-relaxed max-w-md">
                        Pick up where you left off. Manage listings, bookings, and payouts from a single, beautifully designed
                        dashboard.
                    </p>

                    {/* Floating entity badges */}
                    <div className="mt-10 flex flex-wrap gap-3">
                        {[
                            { icon: CalendarDays, label: 'Events', tint: 'bg-blue-500/15 text-blue-300' },
                            { icon: GraduationCap, label: 'Classes', tint: 'bg-purple-500/15 text-purple-300' },
                            { icon: Building2, label: 'Venues', tint: 'bg-amber-500/15 text-amber-300' },
                            { icon: BarChart3, label: 'Analytics', tint: 'bg-emerald-500/15 text-emerald-300' },
                        ].map((b, i) => (
                            <motion.div
                                key={b.label}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: [0, -4, 0] }}
                                transition={{
                                    opacity: { duration: 0.4, delay: 0.3 + i * 0.08 },
                                    y: { duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' },
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 backdrop-blur ${b.tint}`}
                            >
                                <b.icon size={14} />
                                <span className="text-xs font-bold">{b.label}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
                        {[
                            { value: '500+', label: 'Partners' },
                            { value: '12K+', label: 'Events' },
                            { value: '50+', label: 'Cities' },
                        ].map((s) => (
                            <div key={s.label}>
                                <div className="text-2xl xl:text-3xl font-black text-tlb-yellow tracking-tight">{s.value}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative mt-auto hidden lg:flex items-center gap-2 text-xs text-gray-500">
                    <Star size={12} className="text-tlb-yellow" />
                    Trusted by Broadway's finest partners since 2024
                </div>
            </motion.aside>

            {/* ───────────── RIGHT — Login form ───────────── */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 lg:py-14">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-full max-w-md"
                >
                    {/* Heading */}
                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 bg-tlb-yellow/15 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-4">
                            <Smartphone size={11} /> Sign In
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black leading-tight">Welcome back, partner.</h2>
                        <p className="text-gray-500 mt-2 text-sm">
                            Choose how you'd like to receive your secure one-time code.
                        </p>
                    </div>

                    {/* Mode tabs */}
                    <div className="relative bg-gray-100 rounded-2xl p-1.5 flex gap-1 mb-6">
                        {(['phone', 'email'] as Mode[]).map((m) => {
                            const active = mode === m;
                            const Icon = m === 'phone' ? Smartphone : Mail;
                            return (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                                        active ? 'text-tlb-dark' : 'text-gray-500 hover:text-tlb-dark'
                                    }`}
                                >
                                    {active && (
                                        <motion.div
                                            layoutId="login-mode-pill"
                                            className="absolute inset-0 bg-white rounded-xl shadow-sm"
                                            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                        />
                                    )}
                                    <span className="relative flex items-center gap-2">
                                        <Icon size={15} />
                                        {m === 'phone' ? 'Mobile' : 'Email'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Form (animated swap between modes) */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, x: mode === 'phone' ? -12 : 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: mode === 'phone' ? 12 : -12 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                        >
                            {mode === 'phone' ? (
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                                        Mobile Number
                                    </label>
                                    <div className="flex gap-3">
                                        <div className="w-24 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3.5 flex items-center justify-center text-sm font-bold">
                                            +91
                                        </div>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            placeholder="98765 43210"
                                            className="tlb-input flex-1 text-base"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-2 ml-1">10-digit Indian mobile number</p>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            placeholder="you@company.com"
                                            className="tlb-input w-full pr-11 text-base"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoFocus
                                        />
                                        <Mail
                                            size={16}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300"
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-2 ml-1">We'll send a 6-digit code to this email.</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Send OTP */}
                    <motion.button
                        type="button"
                        onClick={submit}
                        disabled={!isValid || loading}
                        whileHover={isValid && !loading ? { scale: 1.01 } : undefined}
                        whileTap={isValid && !loading ? { scale: 0.99 } : undefined}
                        className={`mt-6 w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all text-base ${
                            isValid && !loading
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

                    {/* Footer link → onboarding (per Login/Onboarding separation) */}
                    <div className="mt-10 text-center">
                        <p className="text-sm text-gray-500">
                            New to TLB?{' '}
                            <button
                                onClick={() => onNavigate('PARTNER_ACCESS')}
                                className="font-black text-tlb-dark hover:text-tlb-yellow transition-colors underline underline-offset-4 decoration-tlb-yellow/40"
                            >
                                Become a Partner
                            </button>
                        </p>
                    </div>

                    {/* Trust + legal */}
                    <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                        <span>© 2026 The Little Broadway</span>
                        <span className="flex items-center gap-1">
                            <Sparkles size={11} className="text-tlb-yellow" /> Secure OTP login
                        </span>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};
