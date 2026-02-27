import React from 'react';
import { ArrowLeft, Camera, Link2, Save, MessageSquare } from 'lucide-react';
import { Screen } from '../../types';

interface ProfileProps {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

export const EditProfile: React.FC<ProfileProps> = ({ onNavigate, onOpenSidebar }) => (
    <div className="min-h-screen bg-[#FDFCF8] pb-8">
        <header className="bg-white p-4 sm:p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            <button onClick={() => onNavigate('DASHBOARD')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
            <h1 className="font-black text-lg">Edit Profile</h1>
            <button className="text-tlb-yellow font-black text-sm uppercase tracking-widest">Save</button>
        </header>

        <main className="px-4 sm:px-6 py-6">
            <div className="max-w-lg mx-auto space-y-8">
                {/* Profile Completion */}
                <section className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-sm">Profile Completion</h3>
                        <span className="text-sm font-black text-tlb-yellow">60%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-tlb-yellow rounded-full w-[60%]"></div>
                    </div>
                    <p className="text-xs text-gray-400">Almost there! Complete your brand identity to go live.</p>
                </section>

                {/* Brand Identity */}
                <section className="space-y-5">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🏷️</span>
                        <h3 className="font-black text-xl">Brand Identity</h3>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-500 mb-2 block">Brand Name</label>
                        <input className="tlb-input w-full" defaultValue="The Little Broadway" />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-500 mb-2 block">About the Partner</label>
                        <textarea className="tlb-input w-full min-h-[120px] resize-y" placeholder="Describe your theatre background and vision..."></textarea>
                        <p className="text-xs text-gray-300 mt-1">Tell your story. This will be visible on your public partner page.</p>
                    </div>
                </section>

                {/* Media Gallery */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🖼️</span>
                        <h3 className="font-black text-xl">Media Gallery</h3>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        <div className="w-24 h-24 shrink-0 bg-tlb-yellow/10 rounded-2xl border-2 border-dashed border-tlb-yellow/30 flex items-center justify-center text-tlb-yellow">
                            <Camera size={24} />
                        </div>
                        <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden shadow-sm">
                            <img src="https://picsum.photos/seed/gallery1/200/200" alt="Gallery" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden shadow-sm">
                            <img src="https://picsum.photos/seed/gallery2/200/200" alt="Gallery" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                    </div>
                </section>

                {/* Social Media */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🔗</span>
                        <h3 className="font-black text-xl">Social Media</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 border border-gray-100 bg-white rounded-2xl px-4 py-3">
                            <Link2 size={18} className="text-gray-300" />
                            <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Instagram URL" />
                        </div>
                        <div className="flex items-center gap-3 border border-gray-100 bg-white rounded-2xl px-4 py-3">
                            <Link2 size={18} className="text-gray-300" />
                            <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Facebook Page" />
                        </div>
                    </div>
                </section>

                {/* Live Preview */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">👁️</span>
                        <h3 className="font-black text-xl">Live Preview</h3>
                    </div>
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                        <div className="h-32 relative">
                            <img src="https://picsum.photos/seed/curtain/800/300" alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="px-5 pb-5 -mt-6 relative z-10">
                            <div className="w-14 h-14 bg-tlb-yellow rounded-xl flex items-center justify-center text-tlb-dark font-black text-lg border-2 border-white shadow-md mb-2">LB</div>
                            <h4 className="font-black text-base">The Little Broadway</h4>
                            <p className="text-xs text-gray-400">Theatre Partner • New York, NY</p>
                            <div className="flex gap-2 mt-3">
                                <button className="bg-tlb-yellow text-tlb-dark font-bold text-xs px-5 py-2 rounded-full">Follow</button>
                                <button className="bg-gray-100 p-2 rounded-full text-gray-400"><MessageSquare size={14} /></button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Save Profile Button */}
                <button onClick={() => onNavigate('DASHBOARD')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
                    <Save size={20} /> Save Profile
                </button>
                <p className="text-center text-gray-300 text-[10px] font-bold tracking-widest uppercase">
                    TLB Partner Dashboard V2.0
                </p>
            </div>
        </main>
    </div>
);
