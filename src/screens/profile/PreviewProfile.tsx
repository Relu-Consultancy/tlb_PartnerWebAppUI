import React, { useState } from 'react';
import { ArrowLeft, MapPin, Mail, UserPlus, CheckCircle2, Star, Play, ExternalLink, Phone, Instagram, Globe, ChevronRight } from 'lucide-react';
import { Screen } from '../../types';

interface ProfileProps {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

type Tab = 'about' | 'services' | 'gallery';

const mockServices = [
    { id: '1', title: 'Hatha Yoga', category: 'Yoga & Wellness', batches: ['Mon/Wed/Fri 7 AM', 'Tue/Thu 6 PM'], status: 'Live' as const, ageRange: 'Adults' },
    { id: '2', title: 'Kids Contemporary Dance', category: 'Dance & Movement', batches: ['Sat 10 AM', 'Sat 2 PM'], status: 'Live' as const, ageRange: '5–12 Years' },
    { id: '3', title: 'Keyboard Basics', category: 'Music & Instruments', batches: ['Sun 11 AM'], status: 'Paused' as const, ageRange: '6–15 Years' },
];

export const PreviewProfile: React.FC<ProfileProps> = ({ onNavigate, onOpenSidebar }) => {
    const [activeTab, setActiveTab] = useState<Tab>('about');

    const tabs: { id: Tab; label: string }[] = [
        { id: 'about', label: 'About' },
        { id: 'services', label: 'Services' },
        { id: 'gallery', label: 'Gallery' },
    ];

    return (
    <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white p-4 sm:p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            <button onClick={() => onNavigate('BRAND_PROFILE')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
            <h1 className="font-black text-lg">Public Profile Preview</h1>
            <div className="w-10" />
        </header>

        <main className="px-4 sm:px-6 py-6">
            <div className="tlb-content space-y-6">
                {/* Banner notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center text-xs font-bold text-amber-700">
                    👁️ This is how your profile appears to the public
                </div>

                {/* Cover + Profile */}
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="h-40 sm:h-52 relative">
                        <img loading="lazy" src="https://picsum.photos/seed/studio-cover/1200/400" alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                    <div className="px-6 pb-6 relative">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-xl -mt-10 relative z-10 bg-white">
                            <img loading="lazy" src="https://picsum.photos/seed/logo/100/100" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="mt-3 flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-black">The Little Broadway</h2>
                                    <CheckCircle2 size={18} className="text-tlb-yellow fill-tlb-yellow" />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Dance & Movement • Mumbai, India</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button className="bg-gray-100 text-gray-400 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-not-allowed opacity-60">
                                <Mail size={16} /> Enquire Now
                            </button>
                            <button className="bg-gray-50 px-3 py-2.5 rounded-xl text-gray-300 cursor-not-allowed opacity-60">
                                <Phone size={16} />
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-300 mt-2 italic">* Enquiry buttons are disabled in preview mode</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-white rounded-2xl p-1.5 border border-gray-100">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                activeTab === tab.id
                                    ? 'bg-tlb-yellow text-tlb-dark shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'about' && (
                    <div className="space-y-6">
                        {/* Bio */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100">
                            <h3 className="font-bold text-base mb-3">About Us</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                The Little Broadway is a premier performing arts academy with over 10 years of experience delivering high-quality dance, music, and movement workshops for all ages. Our mission is to inspire creativity and self-expression through the joy of performing arts.
                            </p>
                        </div>

                        {/* Social Links */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100">
                            <h3 className="font-bold text-base mb-3">Connect With Us</h3>
                            <div className="flex gap-3">
                                {[
                                    { icon: Instagram, label: 'Instagram', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
                                    { icon: Globe, label: 'Website', color: 'bg-blue-500' },
                                ].map((s) => (
                                    <div key={s.label} className={`${s.color} text-white p-3 rounded-xl cursor-pointer hover:opacity-80 transition-opacity`}>
                                        <s.icon size={20} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Map */}
                        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                            <div className="h-48 relative">
                                <img loading="lazy" src="https://picsum.photos/seed/map-studio/800/400" alt="Map" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <div className="w-10 h-10 bg-tlb-yellow rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                        <MapPin size={20} className="text-tlb-dark" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-4">
                                <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <MapPin size={14} className="text-tlb-yellow" /> Bandra West, Mumbai 400050
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'services' && (
                    <div className="space-y-4">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                            {mockServices.filter(s => s.status === 'Live').length} Active Classes
                        </p>
                        {mockServices.filter(s => s.status === 'Live').map((service) => (
                            <div key={service.id} className="bg-white rounded-2xl p-5 border border-gray-100">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-bold text-base">{service.title}</h4>
                                        <p className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest mt-1">{service.category}</p>
                                    </div>
                                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">Live</span>
                                </div>
                                <div className="mt-3 space-y-1.5">
                                    {service.batches.map((batch, i) => (
                                        <p key={i} className="text-xs text-gray-500 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-tlb-yellow" /> {batch}
                                        </p>
                                    ))}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2">Ages: {service.ageRange}</p>
                            </div>
                        ))}

                        {/* Note about paused */}
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                            <p className="text-xs text-gray-400 italic">
                                Paused classes ({mockServices.filter(s => s.status === 'Paused').length}) are hidden from this public view.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'gallery' && (
                    <div className="space-y-4">
                        {/* Photo grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-sm relative group">
                                    <img loading="lazy" src={`https://picsum.photos/seed/gallery${i}/400/400`} alt={`Gallery ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                                    {i === 1 && (
                                        <div className="absolute top-2 right-2 bg-tlb-yellow p-1.5 rounded-lg shadow">
                                            <Star size={12} className="text-tlb-dark" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Video placeholder */}
                        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                            <div className="h-48 relative">
                                <img loading="lazy" src="https://picsum.photos/seed/studio-video/800/400" alt="Video thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                                        <Play size={28} className="text-tlb-dark ml-1" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-4">
                                <p className="text-sm font-bold">Studio Tour — The Little Broadway ✨</p>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">YouTube • 2:45</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    </div>
    );
};
