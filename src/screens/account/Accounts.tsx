import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Menu, UserCircle, FileText, ArrowRight, ShieldCheck, Eye } from 'lucide-react';
import { Screen } from '../../types';
import { getCurrentPartner } from '../../api/onboarding';

interface Props {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

// Accounts hub — a single home for the partner's identity & compliance surfaces
// (Brand Profile + Documents), reached from the top of the sidebar.
export const Accounts: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const [partner, setPartner] = useState<any>(null);

    useEffect(() => {
        getCurrentPartner().then(r => setPartner(r?.data || r)).catch(() => { /* best-effort */ });
    }, []);

    const businessName = partner?.business_name || partner?.business_profile?.business_name || 'Your Business';
    const contact = partner?.email || partner?.phone || '';
    const status = partner?.status || '';
    const isVerified = partner?.is_verified === true || status === 'approved';
    const underReview = status === 'under_review';

    const cards: { title: string; desc: string; icon: React.ElementType; hex: string; nav: Screen }[] = [
        { title: 'Brand Profile', desc: 'Your public identity — logo, cover, bio, social links & gallery', icon: UserCircle, hex: '#F59E0B', nav: 'BRAND_PROFILE' },
        { title: 'Documents', desc: 'KYC, bank details & verification documents', icon: FileText, hex: '#3B82F6', nav: 'DOCUMENTS' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white px-6 md:px-8 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
                <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors"><Menu size={22} /></button>
                <div>
                    <h1 className="tlb-page-title">Accounts</h1>
                    <p className="tlb-page-sub hidden sm:block">Manage your brand identity &amp; verification</p>
                </div>
            </header>

            <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
                {/* Account summary */}
                <motion.section {...fadeUp} transition={{ duration: 0.3 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-tlb-dark via-gray-900 to-black p-6 text-white">
                    <div className="absolute -right-10 -top-10 w-44 h-44 bg-tlb-yellow/10 rounded-full blur-3xl" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 ring-2 ring-white/15 flex items-center justify-center overflow-hidden shrink-0">
                            {partner?.logo ? <img src={partner.logo} alt="" className="w-full h-full object-cover" /> : <UserCircle size={28} />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-lg font-black truncate">{businessName}</p>
                            {contact && <p className="text-[13px] text-gray-400 truncate mt-0.5">{contact}</p>}
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                            isVerified ? 'bg-emerald-500/20 text-emerald-300' :
                            underReview ? 'bg-blue-500/20 text-blue-300' :
                            'bg-amber-500/20 text-amber-300'
                        }`}>
                            <ShieldCheck size={13} /> {isVerified ? 'Verified' : underReview ? 'In Review' : 'Unverified'}
                        </span>
                    </div>
                </motion.section>

                {/* Section cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {cards.map((c, i) => (
                        <motion.button
                            key={c.title}
                            {...fadeUp}
                            transition={{ duration: 0.3, delay: 0.05 + i * 0.05 }}
                            whileHover={{ y: -4 }}
                            onClick={() => onNavigate(c.nav)}
                            className="group text-left bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105" style={{ backgroundColor: `${c.hex}14`, color: c.hex }}>
                                    <c.icon size={24} />
                                </div>
                                <ArrowRight size={18} className="text-gray-300 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <p className="text-base font-black text-gray-900">{c.title}</p>
                            <p className="text-[13px] text-gray-400 font-medium mt-1 leading-relaxed">{c.desc}</p>
                        </motion.button>
                    ))}
                </div>

                {/* Preview public profile */}
                <button onClick={() => onNavigate('PREVIEW_PROFILE')} className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-white transition-colors">
                    <Eye size={15} /> Preview public profile
                </button>
            </main>
        </div>
    );
};
