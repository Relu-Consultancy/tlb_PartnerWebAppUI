import React from 'react';
import { ArrowLeft, Edit3, Rocket, Clock, Users, MapPin, Star } from 'lucide-react';
import { Screen } from '../../types';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

export const CreateProgramPreview: React.FC<Props> = ({ onNavigate }) => (
    <div className="min-h-screen bg-gray-50 pb-8">
        <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            <button onClick={() => onNavigate('CREATE_PROGRAM_POLICIES')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
            <div className="text-center">
                <h1 className="font-black text-lg">New Listing</h1>
                <p className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">Stage 5 of 5 â€” Preview & Publish</p>
            </div>
            <div className="w-10" />
        </header>

        <div className="w-full h-1.5 bg-gray-100">
            <div className="h-full bg-tlb-yellow w-full transition-all duration-500" />
        </div>

        <main className="p-6">
            <div className="tlb-content space-y-6">
                <div className="text-center space-y-1">
                    <h2 className="text-2xl font-black">Preview Your Listing</h2>
                    <p className="text-sm text-gray-400">This is how parents will see your class. Review everything before publishing.</p>
                </div>

                {/* Mobile Mockup Frame */}
                <div className="bg-white rounded-3xl border-2 border-gray-200 overflow-hidden shadow-xl max-w-md mx-auto">
                    {/* Feature Image */}
                    <div className="h-48 relative">
                        <img loading="lazy" src="https://picsum.photos/seed/class1/800/400" alt="Feature" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">Live</div>
                        {/* Edit button overlay */}
                        <button onClick={() => onNavigate('CREATE_PROGRAM_MEDIA')} className="absolute bottom-3 right-3 bg-white/90 p-2 rounded-xl shadow text-gray-600 hover:bg-white transition-colors">
                            <Edit3 size={14} />
                        </button>
                    </div>

                    {/* Title & Category */}
                    <div className="p-5 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-black">Advanced Robotics</h3>
                                <p className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest mt-0.5">Coding & Robotics â€º Robotics</p>
                            </div>
                            <button onClick={() => onNavigate('CREATE_PROGRAM_IDENTITY')} className="text-gray-400 hover:text-tlb-yellow p-1">
                                <Edit3 size={14} />
                            </button>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                            {['Beginner Friendly', 'Certification', 'Trial Available'].map((tag) => (
                                <span key={tag} className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2.5 py-1 rounded-full">{tag}</span>
                            ))}
                        </div>

                        {/* Age Group & Format */}
                        <div className="flex gap-3">
                            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                                <Users size={12} /> Ages 8â€“14
                            </div>
                            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                                <MapPin size={12} /> Physical
                            </div>
                        </div>

                        {/* Description */}
                        <div className="relative">
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Learn robotics from scratch! Build your own bots, program Arduino microcontrollers, and compete in challenges. Perfect for young tech enthusiasts who love building things with their hands.
                            </p>
                            <button onClick={() => onNavigate('CREATE_PROGRAM_IDENTITY')} className="absolute -top-1 -right-1 text-gray-400 hover:text-tlb-yellow p-1">
                                <Edit3 size={12} />
                            </button>
                        </div>

                        {/* Batches */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Schedule</p>
                                <button onClick={() => onNavigate('CREATE_PROGRAM_BATCH')} className="text-gray-400 hover:text-tlb-yellow p-1">
                                    <Edit3 size={12} />
                                </button>
                            </div>
                            {[
                                { name: 'Morning Batch', days: 'Mon, Wed, Fri', time: '10:00â€“11:30 AM', spots: '5 spots left' },
                                { name: 'Weekend Batch', days: 'Sat', time: '2:00â€“3:30 PM', spots: '12 spots left' },
                            ].map((batch, i) => (
                                <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-tlb-yellow/10 p-1.5 rounded-lg text-tlb-yellow"><Clock size={14} /></div>
                                        <div>
                                            <p className="text-sm font-bold">{batch.name}</p>
                                            <p className="text-[11px] text-gray-400">{batch.days} â€¢ {batch.time}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-500">{batch.spots}</span>
                                </div>
                            ))}
                        </div>

                        {/* Photo strip */}
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-20 h-20 shrink-0 rounded-xl overflow-hidden">
                                    <img loading="lazy" src={`https://picsum.photos/seed/class${i}/200/200`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                            ))}
                        </div>

                        {/* Enquire button (disabled preview) */}
                        <button className="w-full py-3 bg-gray-100 text-gray-400 rounded-2xl font-bold text-sm cursor-not-allowed">
                            ðŸ“© Enquire Now (disabled in preview)
                        </button>
                    </div>
                </div>

                {/* Edit shortcuts */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                    <p className="text-xs font-bold text-amber-700">âœŽ Tap any <Edit3 size={10} className="inline" /> icon above to jump back and edit that section</p>
                </div>

                {/* Publish Button */}
                <button
                    onClick={() => onNavigate('SERVICE_LISTINGS')}
                    className="tlb-button w-full py-5 shadow-lg shadow-tlb-yellow/20 text-lg gap-3"
                >
                    <Rocket size={22} /> Publish Listing
                </button>
            </div>
        </main>
    </div>
);
