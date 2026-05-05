import React from 'react';
import { ArrowLeft, ArrowRight, Camera, Play, Star, Upload, Link2 } from 'lucide-react';
import { Screen } from '../../types';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

export const CreateProgramMedia: React.FC<Props> = ({ onNavigate }) => (
    <div className="min-h-screen bg-gray-50 pb-8">
        <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            <button onClick={() => onNavigate('CREATE_PROGRAM_BATCH')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
            <div className="text-center">
                <h1 className="font-black text-lg">New Listing</h1>
                <p className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">Stage 3 of 5 â€” Visual Storefront</p>
            </div>
            <div className="w-10" />
        </header>

        <div className="w-full h-1.5 bg-gray-100">
            <div className="h-full bg-tlb-yellow w-[60%] transition-all duration-500" />
        </div>

        <main className="p-6">
            <div className="tlb-content space-y-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black">Visual Storefront</h2>
                    <p className="text-sm text-gray-400">High-conversion media assets that showcase your class.</p>
                </div>

                {/* Gallery Upload */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Gallery Photos / Short Teaser</label>
                    <div className="flex flex-wrap gap-3">
                        {/* Upload buttons */}
                        <div className="w-24 h-24 bg-tlb-yellow/10 rounded-2xl border-2 border-dashed border-tlb-yellow/30 flex flex-col items-center justify-center text-tlb-yellow cursor-pointer hover:bg-tlb-yellow/20 transition-colors">
                            <Camera size={24} />
                            <span className="text-[10px] font-bold mt-1">Add Photo</span>
                        </div>
                        <div className="w-24 h-24 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-blue-400 cursor-pointer hover:bg-blue-100 transition-colors">
                            <Play size={24} />
                            <span className="text-[10px] font-bold mt-1">Add Teaser</span>
                        </div>
                        {/* Mock uploaded photos */}
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-24 h-24 rounded-2xl overflow-hidden shadow-sm relative group cursor-pointer">
                                <img loading="lazy" src={`https://picsum.photos/seed/class${i}/400/400`} alt={`Photo ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                {i === 1 && (
                                    <div className="absolute top-2 right-2 bg-tlb-yellow p-1.5 rounded-lg shadow">
                                        <Star size={10} className="text-tlb-dark" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <Star size={16} className="text-white" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-300 mt-2">â­ Tap a photo to set it as the <strong>Feature Image</strong> (main thumbnail)</p>
                </div>

                {/* Video Link */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Video Link</label>
                    <div className="flex items-center gap-3 border border-gray-100 bg-white rounded-2xl px-4 py-3">
                        <Link2 size={18} className="text-gray-300" />
                        <input className="bg-transparent flex-1 text-sm outline-none" placeholder="YouTube or Instagram Reels URL" />
                    </div>
                    <p className="text-xs text-gray-300 mt-1">Paste a single video URL to embed on your listing page.</p>
                </div>

                {/* Feature Image note */}
                <div className="bg-tlb-yellow/5 border border-tlb-yellow/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                        <Star size={18} className="text-tlb-yellow shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold">Feature Image</p>
                            <p className="text-xs text-gray-500 mt-0.5">The starred photo will appear as the main thumbnail in search results and listings.</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                    <button onClick={() => onNavigate('CREATE_PROGRAM_BATCH')} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-500 text-sm">
                        â† Back
                    </button>
                    <button onClick={() => onNavigate('CREATE_PROGRAM_POLICIES')} className="flex-1 tlb-button py-4 gap-2">
                        Next: Policies <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </main>
    </div>
);
