import React from 'react';
import { ArrowLeft, Edit3, Rocket, Clock, Users, MapPin, Star, CalendarDays, Tag, DollarSign } from 'lucide-react';
import { Screen } from '../../types';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

export const CreateEventPreview: React.FC<Props> = ({ onNavigate }) => (
    <div className="min-h-screen bg-gray-50 pb-8">
        <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            <button onClick={() => onNavigate('CREATE_EVENT_MEDIA')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
            <div className="text-center">
                <h1 className="font-black text-lg">New Event</h1>
                <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Step 4 of 4 — Preview & Publish</p>
            </div>
            <div className="w-10" />
        </header>

        <div className="w-full h-1.5 bg-gray-100">
            <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 w-full transition-all duration-500" />
        </div>

        <main className="p-6">
            <div className="tlb-content space-y-6">
                <div className="text-center space-y-1">
                    <h2 className="text-2xl font-black">Preview Your Event</h2>
                    <p className="text-sm text-gray-400">This is how attendees will see your event. Review everything before publishing.</p>
                </div>

                {/* Event Preview Card */}
                <div className="bg-white rounded-3xl border-2 border-gray-200 overflow-hidden shadow-xl max-w-md mx-auto">
                    {/* Cover Image */}
                    <div className="h-52 relative">
                        <img loading="lazy" src="https://picsum.photos/seed/event-cover/800/450" alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute top-3 left-3 bg-purple-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                            <CalendarDays size={10} /> Event
                        </div>
                        <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                            Live
                        </div>
                        <button onClick={() => onNavigate('CREATE_EVENT_MEDIA')} className="absolute bottom-3 right-3 bg-white/90 p-2 rounded-xl shadow text-gray-600 hover:bg-white transition-colors">
                            <Edit3 size={14} />
                        </button>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* Title */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-black">Summer Art Festival</h3>
                                <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mt-0.5">Arts & Crafts › Painting</p>
                            </div>
                            <button onClick={() => onNavigate('CREATE_EVENT_DETAILS')} className="text-gray-400 hover:text-purple-500 p-1">
                                <Edit3 size={14} />
                            </button>
                        </div>

                        {/* Format Tags */}
                        <div className="flex flex-wrap gap-1.5">
                            {['Workshop', 'Camp'].map((tag) => (
                                <span key={tag} className="bg-purple-50 text-purple-600 text-[10px] font-bold px-2.5 py-1 rounded-full">{tag}</span>
                            ))}
                        </div>

                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                                <Users size={12} /> Ages 6–12
                            </div>
                            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                                <MapPin size={12} /> Offline
                            </div>
                            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                                <CalendarDays size={12} /> Jun 15–20
                            </div>
                        </div>

                        {/* Description */}
                        <div className="relative">
                            <p className="text-sm text-gray-600 leading-relaxed">
                                A week-long immersive art experience for young creators! Learn painting, pottery, and mixed-media art from expert instructors. All materials provided. Showcase your work at the closing ceremony!
                            </p>
                            <button onClick={() => onNavigate('CREATE_EVENT_DETAILS')} className="absolute -top-1 -right-1 text-gray-400 hover:text-purple-500 p-1">
                                <Edit3 size={12} />
                            </button>
                        </div>

                        {/* Schedule */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Schedule</p>
                                <button onClick={() => onNavigate('CREATE_EVENT_SCHEDULE')} className="text-gray-400 hover:text-purple-500 p-1">
                                    <Edit3 size={12} />
                                </button>
                            </div>
                            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-100 p-1.5 rounded-lg text-purple-500"><Clock size={14} /></div>
                                    <div>
                                        <p className="text-sm font-bold">Mon – Sat</p>
                                        <p className="text-[11px] text-gray-400">10:00 AM – 1:00 PM</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-500">12 spots left</span>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="space-y-2">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Tickets</p>
                            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-amber-100 p-1.5 rounded-lg text-amber-500"><Tag size={14} /></div>
                                    <div>
                                        <p className="text-sm font-bold">General Admission</p>
                                        <p className="text-[11px] text-gray-400">50 available</p>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-purple-600">₹999</span>
                            </div>
                            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-100 p-1.5 rounded-lg text-purple-500"><Star size={14} /></div>
                                    <div>
                                        <p className="text-sm font-bold">VIP Pass</p>
                                        <p className="text-[11px] text-gray-400">10 available</p>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-purple-600">₹1,999</span>
                            </div>
                        </div>

                        {/* Organizer */}
                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                            <img loading="lazy" src="https://picsum.photos/seed/partner/100/100" alt="Organizer" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                            <div>
                                <p className="text-sm font-bold">TLB Partner</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Organizer</p>
                            </div>
                        </div>

                        {/* Register Button (disabled in preview) */}
                        <button className="w-full py-3 bg-gray-100 text-gray-400 rounded-2xl font-bold text-sm cursor-not-allowed">
                            🎟️ Register Now (disabled in preview)
                        </button>
                    </div>
                </div>

                {/* Edit shortcuts */}
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
                    <p className="text-xs font-bold text-purple-700">✎ Tap any <Edit3 size={10} className="inline" /> icon above to jump back and edit that section</p>
                </div>

                {/* Publish Button */}
                <button
                    onClick={() => onNavigate('SERVICE_LISTINGS')}
                    className="tlb-button w-full py-5 shadow-lg shadow-purple-200 text-lg gap-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
                >
                    <Rocket size={22} /> Publish Event
                </button>
            </div>
        </main>
    </div>
);
