import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    motion,
    useInView,
    useMotionTemplate,
    useMotionValue,
    useScroll,
    useSpring,
    useTransform,
    MotionValue,
} from 'motion/react';
import {
    ArrowRight,
    BarChart3,
    Building2,
    CalendarDays,
    CheckCircle2,
    GraduationCap,
    Headphones,
    MapPin,
    PenLine,
    Shield,
    Sparkles,
    Star,
} from 'lucide-react';
import { Screen } from '../../types';

interface AuthProps {
    onNavigate: (screen: Screen) => void;
}

// ── Count-up hook: animates 0 → value when the element scrolls into view ──
function useCountUp(target: number, durationMs = 1400) {
    const ref = useRef<HTMLSpanElement | null>(null);
    const inView = useInView(ref, { once: true, amount: 0.5 });
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (!inView) return;
        const startTs = performance.now();
        let frame = 0;
        const tick = (now: number) => {
            const t = Math.min(1, (now - startTs) / durationMs);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(Math.round(target * eased));
            if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [inView, target, durationMs]);

    return { ref, value };
}

const Counter: React.FC<{ to: number; suffix?: string; className?: string }> = ({ to, suffix, className }) => {
    const { ref, value } = useCountUp(to);
    return (
        <span ref={ref} className={className}>
            {value.toLocaleString()}
            {suffix}
        </span>
    );
};

// ── Reusable scroll-into-view wrapper ──
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
    children,
    delay = 0,
    className,
}) => (
    <motion.div
        className={className}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
        {children}
    </motion.div>
);

// ── Floating entity cards in the hero (right column on desktop) ──
// Accepts tilt motion values from parent so the whole group reacts to cursor position.
const HeroCards: React.FC<{ rotateX?: MotionValue<number>; rotateY?: MotionValue<number> }> = ({
    rotateX,
    rotateY,
}) => {
    const cards = [
        { icon: CalendarDays, title: 'Events', meta: '127 active', tint: 'bg-blue-50 text-blue-600', delay: 0 },
        { icon: PenLine, title: 'Classes', meta: '54 batches', tint: 'bg-purple-50 text-purple-600', delay: 0.6 },
        { icon: Building2, title: 'Venues', meta: '12 spaces', tint: 'bg-amber-50 text-amber-600', delay: 1.2 },
        { icon: GraduationCap, title: 'Programs', meta: '8 cohorts', tint: 'bg-emerald-50 text-emerald-600', delay: 1.8 },
    ];
    return (
        <motion.div
            className="relative w-full h-[420px] sm:h-[460px] overflow-hidden"
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
        >
            {/* Backdrop gradient blob — deeper gold wash */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-72 h-72 bg-yellow-500/45 rounded-full blur-3xl" />
            </div>

            {cards.map((card, i) => {
                const positions = [
                    'top-4 left-2 sm:left-6',
                    'top-24 right-2 sm:right-4',
                    'bottom-28 left-6 sm:left-10',
                    'bottom-4 right-4 sm:right-12',
                ];
                return (
                    <motion.div
                        key={card.title}
                        className={`absolute ${positions[i]} w-52 bg-white rounded-2xl shadow-xl border border-gray-100 p-4`}
                        initial={{ opacity: 0, y: 24, rotate: i % 2 === 0 ? -3 : 3 }}
                        animate={{
                            opacity: 1,
                            y: [0, -8, 0],
                            rotate: i % 2 === 0 ? -3 : 3,
                        }}
                        transition={{
                            opacity: { duration: 0.6, delay: card.delay * 0.2 },
                            y: { duration: 4, repeat: Infinity, delay: card.delay, ease: 'easeInOut' },
                            rotate: { duration: 0.6, delay: card.delay * 0.2 },
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.tint}`}>
                                <card.icon size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-sm">{card.title}</div>
                                <div className="text-[11px] text-gray-400 font-medium">{card.meta}</div>
                            </div>
                            <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <div className="mt-3 flex gap-1">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-tlb-yellow"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${60 + i * 10}%` }}
                                    transition={{ duration: 1.2, delay: 0.4 + i * 0.15 }}
                                />
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
};

// ── Feature card with hover lift ──
const FeatureCard: React.FC<{
    icon: any;
    title: string;
    desc: string;
    accent: string;
}> = ({ icon: Icon, title, desc, accent }) => (
    <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:border-tlb-yellow/60 hover:shadow-xl hover:shadow-tlb-yellow/10 transition-all"
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${accent}`}>
            <Icon size={22} />
        </div>
        <h3 className="font-bold text-base mb-1.5">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight size={16} className="text-tlb-yellow" />
        </div>
    </motion.div>
);

export const Landing: React.FC<AuthProps> = ({ onNavigate }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // ── Scroll progress bar (thin yellow line at the very top, fills as you scroll) ──
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

    // ── Mouse tracking inside the hero (drives the spotlight + the 3D tilt of HeroCards) ──
    const heroRef = useRef<HTMLDivElement>(null);
    const [heroSize, setHeroSize] = useState({ w: 1, h: 1 });
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    // Initialise spotlight off-screen so it doesn't flash at top-left before first move.
    useEffect(() => {
        mouseX.set(-9999);
        mouseY.set(-9999);
    }, [mouseX, mouseY]);

    useLayoutEffect(() => {
        const update = () => {
            if (heroRef.current) {
                const r = heroRef.current.getBoundingClientRect();
                setHeroSize({ w: r.width || 1, h: r.height || 1 });
            }
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = heroRef.current?.getBoundingClientRect();
        if (!rect) return;
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    };

    const handleHeroMouseLeave = () => {
        mouseX.set(-9999);
        mouseY.set(-9999);
    };

    // Smoothed mouse-driven rotations for the HeroCards group (subtle — max ±8°).
    const rawRotateX = useTransform(mouseY, [0, heroSize.h], [8, -8]);
    const rawRotateY = useTransform(mouseX, [0, heroSize.w], [-8, 8]);
    const rotateX = useSpring(rawRotateX, { stiffness: 80, damping: 18 });
    const rotateY = useSpring(rawRotateY, { stiffness: 80, damping: 18 });

    // Window-level cursor tracking so the spotlight spans the WHOLE viewport
    // (not just the hero rectangle). Uses viewport (client) coordinates, paired
    // with a position:fixed overlay below. The hero-relative mouseX/mouseY above
    // still drive the 3D card tilt.
    const winX = useMotionValue(-9999);
    const winY = useMotionValue(-9999);
    useEffect(() => {
        const onMove = (e: MouseEvent) => { winX.set(e.clientX); winY.set(e.clientY); };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, [winX, winY]);

    // CSS gradient that follows the cursor across the whole screen — motion
    // template so it updates without re-render.
    const spotlight = useMotionTemplate`radial-gradient(450px circle at ${winX}px ${winY}px, rgba(234, 179, 8, 0.24), transparent 70%)`;

    const features = [
        {
            icon: CheckCircle2,
            title: 'Partner Verification',
            desc: 'Earn the elite badge that builds instant trust with the Broadway community.',
            accent: 'bg-tlb-yellow/15 text-amber-600',
        },
        {
            icon: CalendarDays,
            title: 'Event Management',
            desc: 'Publish, schedule, and track ticketed events with built-in booking flows.',
            accent: 'bg-blue-50 text-blue-600',
        },
        {
            icon: Building2,
            title: 'Venue Booking',
            desc: 'List premium performance spaces with availability calendars and packages.',
            accent: 'bg-amber-50 text-amber-600',
        },
        {
            icon: BarChart3,
            title: 'Advanced Analytics',
            desc: 'Real-time dashboards for attendance, revenue, and engagement metrics.',
            accent: 'bg-emerald-50 text-emerald-600',
        },
        {
            icon: Shield,
            title: 'Secure Payments',
            desc: 'End-to-end encrypted payouts straight to your verified bank account.',
            accent: 'bg-purple-50 text-purple-600',
        },
        {
            icon: Headphones,
            title: 'Priority Support',
            desc: '24/7 white-glove assistance dedicated to our partner network.',
            accent: 'bg-rose-50 text-rose-600',
        },
    ];

    const steps = [
        {
            number: '01',
            title: 'Apply',
            desc: 'Sign up with your email or phone, pick the categories you offer, and tell us about your business.',
            icon: Sparkles,
        },
        {
            number: '02',
            title: 'Verify',
            desc: 'Submit your PAN, bank details, and partnership agreement. Our team reviews within 24–48 hours.',
            icon: Shield,
        },
        {
            number: '03',
            title: 'Go Live',
            desc: 'Publish listings, accept bookings, and run your Broadway business from a single dashboard.',
            icon: Star,
        },
    ];

    return (
        <div className="min-h-screen bg-[#FDFCF8] text-tlb-dark">
            {/* ── Full-screen cursor spotlight (behind all content) ── */}
            <motion.div
                aria-hidden
                className="pointer-events-none fixed inset-0 -z-10 hidden sm:block"
                style={{ background: spotlight }}
            />

            {/* ── Scroll progress bar (thin yellow line, very top) ── */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-[3px] bg-tlb-yellow origin-left z-[60]"
                style={{ scaleX }}
            />

            {/* ── Sticky Header ── */}
            <header
                className={`sticky top-0 z-50 transition-all ${
                    scrolled ? 'bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm' : 'bg-transparent'
                }`}
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-tlb-dark rounded-xl flex items-center justify-center text-tlb-yellow font-black text-xs shadow-sm">
                            TLB
                        </div>
                        <span className="font-black text-lg tracking-tight">The Little Broadway</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => onNavigate('LOGIN')}
                            className="hidden sm:block font-bold text-gray-600 hover:text-tlb-dark transition-colors text-sm px-3 py-2"
                        >
                            Sign In
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onNavigate('PARTNER_ACCESS')}
                            className="bg-tlb-yellow text-tlb-dark font-bold px-4 sm:px-5 py-2.5 rounded-xl text-sm flex items-center gap-1.5 shadow-md shadow-tlb-yellow/30"
                        >
                            Get Started <ArrowRight size={14} />
                        </motion.button>
                    </div>
                </div>
            </header>

            {/* ── Hero ── */}
            <section
                ref={heroRef}
                onMouseMove={handleHeroMouseMove}
                onMouseLeave={handleHeroMouseLeave}
                className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 sm:pb-24"
            >
                <div className="relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
                    {/* Left: copy */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 bg-tlb-yellow/15 text-amber-700 px-3 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase mb-5"
                        >
                            <Sparkles size={12} /> Partner Network
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight"
                        >
                            Your Stage
                            <br />
                            <span className="text-tlb-yellow">Awaits.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-gray-500 mt-5 text-base sm:text-lg leading-relaxed max-w-xl"
                        >
                            The ultimate partner portal for Broadway events, classes, programs, and venues. Manage listings,
                            bookings, and payouts from one beautifully designed dashboard.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="mt-8"
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onNavigate('PARTNER_ACCESS')}
                                className="bg-tlb-yellow text-tlb-dark font-bold py-4 px-7 rounded-xl inline-flex items-center justify-center gap-2 shadow-lg shadow-tlb-yellow/30 text-base"
                            >
                                Become a Partner <ArrowRight size={18} />
                            </motion.button>
                            <p className="mt-4 text-sm text-gray-500">
                                Already a partner?{' '}
                                <button
                                    onClick={() => onNavigate('LOGIN')}
                                    className="font-bold text-tlb-dark hover:text-tlb-yellow transition-colors underline underline-offset-4 decoration-tlb-yellow/40"
                                >
                                    Sign in here
                                </button>
                            </p>
                        </motion.div>

                        {/* Inline trust strip */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="mt-10 flex items-center gap-6 text-xs text-gray-400 font-medium"
                        >
                            <div className="flex -space-x-2">
                                {['bg-blue-400', 'bg-purple-400', 'bg-amber-400', 'bg-emerald-400'].map((c, i) => (
                                    <div
                                        key={i}
                                        className={`w-7 h-7 rounded-full border-2 border-white ${c} flex items-center justify-center text-white text-[10px] font-bold`}
                                    >
                                        {['A', 'M', 'R', 'S'][i]}
                                    </div>
                                ))}
                            </div>
                            <span>
                                Trusted by <strong className="text-tlb-dark">500+</strong> Broadway partners
                            </span>
                        </motion.div>
                    </div>

                    {/* Right: animated cards (with cursor-driven 3D tilt on desktop) */}
                    <div className="hidden lg:block">
                        <HeroCards rotateX={rotateX} rotateY={rotateY} />
                    </div>

                    {/* Mobile: simpler illustration (no tilt — no cursor) */}
                    <div className="lg:hidden">
                        <div className="relative h-72">
                            <HeroCards />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats Strip ── */}
            <section className="relative py-12 sm:py-14 bg-tlb-dark text-white overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
                    {[
                        { value: 500, suffix: '+', label: 'Active Partners' },
                        { value: 12000, suffix: '+', label: 'Events Hosted' },
                        { value: 50, suffix: '+', label: 'Cities Covered' },
                        { value: 99, suffix: '%', label: 'Satisfaction' },
                    ].map((stat, i) => (
                        <Reveal key={stat.label} delay={i * 0.08}>
                            <div>
                                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-tlb-yellow tracking-tight">
                                    <Counter to={stat.value} suffix={stat.suffix} />
                                </div>
                                <div className="text-[11px] sm:text-xs text-gray-400 uppercase tracking-widest font-bold mt-2">
                                    {stat.label}
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ── Features Grid ── */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
                <Reveal>
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="text-[11px] font-black text-tlb-yellow tracking-widest uppercase">Everything you need</span>
                        <h2 className="text-3xl sm:text-4xl font-black mt-3 leading-tight">
                            One platform. Every tool. <span className="text-tlb-yellow">Zero hassle.</span>
                        </h2>
                        <p className="text-gray-500 mt-3 leading-relaxed">
                            From the first listing to your hundredth booking, TLB gives you a single, polished workspace built around
                            the way Broadway partners actually work.
                        </p>
                    </div>
                </Reveal>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((f, i) => (
                        <Reveal key={f.title} delay={(i % 3) * 0.08}>
                            <FeatureCard {...f} />
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ── How it Works ── */}
            <section className="bg-gradient-to-b from-white to-[#FDFCF8] py-16 sm:py-24">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <Reveal>
                        <div className="text-center max-w-2xl mx-auto mb-14">
                            <span className="text-[11px] font-black text-tlb-yellow tracking-widest uppercase">How it works</span>
                            <h2 className="text-3xl sm:text-4xl font-black mt-3 leading-tight">
                                From application to spotlight, <span className="text-tlb-yellow">in three steps.</span>
                            </h2>
                        </div>
                    </Reveal>

                    <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
                        {/* Connector line on desktop */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-tlb-yellow/40 to-transparent" />

                        {steps.map((step, i) => (
                            <Reveal key={step.number} delay={i * 0.1}>
                                <div className="relative bg-white border border-gray-100 rounded-2xl p-6 sm:p-7 hover:shadow-xl hover:shadow-tlb-yellow/10 hover:border-tlb-yellow/40 transition-all">
                                    <div className="relative flex items-center gap-4 mb-4">
                                        <div className="w-14 h-14 rounded-2xl bg-tlb-yellow text-tlb-dark flex items-center justify-center shadow-md shadow-tlb-yellow/30">
                                            <step.icon size={22} />
                                        </div>
                                        <div className="text-5xl font-black text-gray-100 leading-none">{step.number}</div>
                                    </div>
                                    <h3 className="font-black text-lg mb-2">{step.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Final CTA ── */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
                <Reveal>
                    <div className="relative bg-tlb-dark text-white rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-14 overflow-hidden">
                        {/* decorative blobs */}
                        <div className="absolute -top-16 -right-16 w-64 h-64 bg-tlb-yellow/20 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-tlb-yellow/10 rounded-full blur-3xl" />

                        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase mb-4">
                                    <Star size={12} className="text-tlb-yellow" /> Now Onboarding
                                </div>
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
                                    Ready for the <span className="text-tlb-yellow">spotlight?</span>
                                </h2>
                                <p className="text-gray-400 mt-4 text-base max-w-xl leading-relaxed">
                                    Join the network powering the next generation of Broadway excellence. Setup takes minutes — your
                                    first listing can go live the same day.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full lg:w-auto">
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => onNavigate('PARTNER_ACCESS')}
                                    className="bg-tlb-yellow text-tlb-dark font-bold py-4 px-7 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-tlb-yellow/30"
                                >
                                    Apply Now <ArrowRight size={18} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => onNavigate('LOGIN')}
                                    className="bg-white/10 text-white font-bold py-4 px-7 rounded-xl flex items-center justify-center gap-2 border border-white/15 hover:bg-white/15 transition-colors"
                                >
                                    Sign In
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* ── Footer ── */}
            <footer>
                <img src="/tlbAppIcon.png" alt="The Little Broadway" className="block mx-auto w-24 h-24" />
                <div className="bg-tlb-dark px-6 sm:px-10 py-10">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
                            <div>
                                <h4 className="text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-3">Platform</h4>
                                <ul className="space-y-2 text-gray-400 text-sm">
                                    <li className="hover:text-white transition-colors cursor-pointer">Events</li>
                                    <li className="hover:text-white transition-colors cursor-pointer">Classes</li>
                                    <li className="hover:text-white transition-colors cursor-pointer">Programs</li>
                                    <li className="hover:text-white transition-colors cursor-pointer">Venues</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-3">Partner</h4>
                                <ul className="space-y-2 text-gray-400 text-sm">
                                    <li className="hover:text-white transition-colors cursor-pointer">
                                        <button onClick={() => onNavigate('PARTNER_ACCESS')}>Become a Partner</button>
                                    </li>
                                    <li className="hover:text-white transition-colors cursor-pointer">
                                        <button onClick={() => onNavigate('LOGIN')}>Sign In</button>
                                    </li>
                                    <li className="hover:text-white transition-colors cursor-pointer">Help Center</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-3">Company</h4>
                                <ul className="space-y-2 text-gray-400 text-sm">
                                    <li className="hover:text-white transition-colors cursor-pointer">About</li>
                                    <li className="hover:text-white transition-colors cursor-pointer">Careers</li>
                                    <li className="hover:text-white transition-colors cursor-pointer">Contact</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-3">Legal</h4>
                                <ul className="space-y-2 text-gray-400 text-sm">
                                    <li className="hover:text-white transition-colors cursor-pointer">Privacy</li>
                                    <li className="hover:text-white transition-colors cursor-pointer">Terms</li>
                                    <li className="hover:text-white transition-colors cursor-pointer">Compliance</li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                            <p className="text-gray-500 text-[11px]">© 2026 The Little Broadway. All rights reserved.</p>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                <MapPin size={12} /> Operating across 50+ Indian cities
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
