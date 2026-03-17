import React, { useState } from 'react';
import { ArrowLeft, Camera, Link2, Save, MapPin, Eye, Upload, Star, Play } from 'lucide-react';
import { Screen } from '../../types';

interface ProfileProps {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

export const BrandProfile: React.FC<ProfileProps> = ({ onNavigate, onOpenSidebar }) => {
    const [category, setCategory] = useState('Dance & Movement');

    const categories = ['Dance & Movement', 'Music & Instruments', 'Academics & Tutoring', 'Martial Arts', 'Yoga & Wellness', 'Art & Craft', 'Sports & Fitness', 'Coding & Robotics'];

    return (
    <div className="min-h-screen bg-[#FDFCF8] pb-8">
        <header className="bg-white p-4 sm:p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            <button onClick={() => onNavigate('HOME')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
            <h1 className="font-black text-lg">Brand Profile</h1>
            <button onClick={() => onNavigate('PREVIEW_PROFILE')} className="flex items-center gap-1.5 text-tlb-yellow font-black text-sm uppercase tracking-widest">
                <Eye size={16} /> Preview
            </button>
        </header>

        <main className="px-4 sm:px-6 py-6">
            <div className="space-y-8">
                {/* Visual Assets */}
                <section className="space-y-5">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🎨</span>
                        <h3 className="font-black text-xl">Visual Assets</h3>
                    </div>

                    {/* Cover Photo */}
                    <div className="relative rounded-2xl overflow-hidden h-48 bg-gray-100 border-2 border-dashed border-gray-200 group cursor-pointer">
                        <img loading="lazy" src="https://picsum.photos/seed/studio-cover/1200/400" alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white/90 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold">
                                <Upload size={16} /> Change Cover Photo
                            </div>
                        </div>
                    </div>

                    {/* Logo */}
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-tlb-yellow/30 bg-tlb-yellow/5 flex items-center justify-center relative group cursor-pointer">
                            <img loading="lazy" src="https://picsum.photos/seed/logo/100/100" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera size={20} className="text-white" />
                            </div>
                        </div>
                        <div>
                            <p className="font-bold text-sm">Studio Logo</p>
                            <p className="text-xs text-gray-400">Square image, min 200×200px</p>
                        </div>
                    </div>

                    {/* Portfolio Gallery */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Portfolio Gallery</label>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            <div className="w-28 h-28 shrink-0 bg-tlb-yellow/10 rounded-2xl border-2 border-dashed border-tlb-yellow/30 flex flex-col items-center justify-center text-tlb-yellow cursor-pointer hover:bg-tlb-yellow/20 transition-colors">
                                <Camera size={22} />
                                <span className="text-[10px] font-bold mt-1">Add Photo</span>
                            </div>
                            <div className="w-28 h-28 shrink-0 bg-tlb-yellow/10 rounded-2xl border-2 border-dashed border-tlb-yellow/30 flex flex-col items-center justify-center text-tlb-yellow cursor-pointer hover:bg-tlb-yellow/20 transition-colors">
                                <Play size={22} />
                                <span className="text-[10px] font-bold mt-1">Add Video</span>
                            </div>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden shadow-sm relative group">
                                    <img loading="lazy" src={`https://picsum.photos/seed/gallery${i}/200/200`} alt={`Gallery ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    {i === 1 && (
                                        <div className="absolute top-1.5 right-1.5 bg-tlb-yellow p-1 rounded-lg">
                                            <Star size={10} className="text-tlb-dark" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-300 mt-2">⭐ Star a photo to set it as the feature thumbnail</p>
                    </div>
                </section>

                {/* Business Info */}
                <section className="space-y-5">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📝</span>
                        <h3 className="font-black text-xl">Business Info</h3>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Studio / Brand Name</label>
                        <input className="tlb-input w-full" defaultValue="The Little Broadway" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">About Us</label>
                        <textarea className="tlb-input w-full min-h-[140px] resize-y" placeholder="Tell your story — what makes your studio special?"></textarea>
                        <p className="text-xs text-gray-300 mt-1">This will be visible on your public profile page.</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Main Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="tlb-input w-full bg-white"
                        >
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* Digital Reach */}
                <section className="space-y-5">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🔗</span>
                        <h3 className="font-black text-xl">Digital Reach</h3>
                    </div>
                    <div className="space-y-3">
                        {['Instagram URL', 'Facebook Page', 'Website'].map((placeholder) => (
                            <div key={placeholder} className="flex items-center gap-3 border border-gray-100 bg-white rounded-2xl px-4 py-3">
                                <Link2 size={18} className="text-gray-300" />
                                <input className="bg-transparent flex-1 text-sm outline-none" placeholder={placeholder} />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Location */}
                <section className="space-y-5">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📍</span>
                        <h3 className="font-black text-xl">Location</h3>
                    </div>
                    {/* Map placeholder */}
                    <div className="rounded-2xl overflow-hidden border border-gray-100 h-48 bg-gray-100 relative">
                        <img loading="lazy" src="https://picsum.photos/seed/map-studio/800/400" alt="Map" className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/90 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg cursor-pointer">
                                <MapPin size={16} className="text-tlb-yellow" /> Drop a Pin on Map
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Written Address</label>
                        <textarea className="tlb-input w-full min-h-[80px] resize-y" placeholder="Full address of your studio or teaching space..."></textarea>
                    </div>
                </section>

                {/* View Public Profile Button */}
                <button onClick={() => onNavigate('PREVIEW_PROFILE')} className="w-full py-4 border-2 border-tlb-yellow text-tlb-dark rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-tlb-yellow/10 transition-colors">
                    <Eye size={20} /> View Public Profile
                </button>

                {/* Save Profile Button */}
                <button onClick={() => onNavigate('HOME')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
                    <Save size={20} /> Save Profile
                </button>

                <p className="text-center text-gray-300 text-[10px] font-bold tracking-widest uppercase">
                    TLB Partner Portal V3.0
                </p>
            </div>
        </main>
    </div>
    );
};
