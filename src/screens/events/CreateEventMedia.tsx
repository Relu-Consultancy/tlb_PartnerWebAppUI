import React from 'react';
import { ArrowLeft, ArrowRight, Camera, Play, Star, Link2 } from 'lucide-react';
import { Screen } from '../../types';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

export const CreateEventMedia: React.FC<Props> = ({ onNavigate }) => (
    <div className="min-h-screen bg-gray-50 pb-8">
        <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            <button onClick={() => onNavigate('CREATE_EVENT_SCHEDULE')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
            <div className="text-center">
                <h1 className="font-black text-lg">New Event</h1>
                <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Step 3 of 4 — Media</p>
            </div>
            <div className="w-10" />
        </header>

        <div className="w-full h-1.5 bg-gray-100">
            <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 w-[75%] transition-all duration-500 rounded-r-full" />
        </div>

        <main className="p-6">
            <div className="tlb-content space-y-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black">Event Visuals</h2>
                    <p className="text-sm text-gray-400">High-quality images drive more registrations. Make it count.</p>
                </div>

                {/* Cover Image */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Cover Image</label>
                    <div className="relative aspect-[16/9] bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-100 transition-colors overflow-hidden">
                        <img loading="lazy" src="https://picsum.photos/seed/event-cover/800/450" alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                        <div className="relative z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm">
                            <Camera size={20} className="text-purple-500 mx-auto mb-1" />
                            <span className="text-xs font-bold text-purple-600">Change Cover</span>
                        </div>
                    </div>
                </div>

                {/* Gallery Upload */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Gallery Photos</label>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="aspect-square bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200 flex flex-col items-center justify-center text-purple-400 cursor-pointer hover:bg-purple-100 transition-colors">
                            <Camera size={24} />
                            <span className="text-[10px] font-bold mt-1">Add Photo</span>
                        </div>
                        <div className="aspect-square bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-blue-400 cursor-pointer hover:bg-blue-100 transition-colors">
                            <Play size={24} />
                            <span className="text-[10px] font-bold mt-1">Add Teaser</span>
                        </div>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-sm relative group cursor-pointer">
                                <img loading="lazy" src={`https://picsum.photos/seed/event${i}/400/400`} alt={`Photo ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                {i === 1 && (
                                    <div className="absolute top-2 right-2 bg-purple-500 p-1.5 rounded-lg shadow">
                                        <Star size={10} className="text-white" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <Star size={16} className="text-white" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-300 mt-2">⭐ Tap a photo to set it as the <strong>Cover Image</strong></p>
                </div>

                {/* Video Link */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Video Link</label>
                    <div className="flex items-center gap-3 border border-gray-100 bg-white rounded-2xl px-4 py-3">
                        <Link2 size={18} className="text-gray-300" />
                        <input className="bg-transparent flex-1 text-sm outline-none" placeholder="YouTube or Instagram Reels URL" />
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                    <button onClick={() => onNavigate('CREATE_EVENT_SCHEDULE')} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-500 text-sm">
                        ← Back
                    </button>
                    <button
                        onClick={() => onNavigate('CREATE_EVENT_PREVIEW')}
                        className="flex-1 tlb-button py-4 gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-200"
                    >
                        Preview & Publish <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </main>
    </div>
);
