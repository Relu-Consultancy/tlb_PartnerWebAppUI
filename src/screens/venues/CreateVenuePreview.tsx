import React from 'react';
import { Edit3, Rocket, MapPin, Users, Clock, Star } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar?: () => void; }

export const CreateVenuePreview: React.FC<Props> = ({ onNavigate }) => (
    <WizardLayout
        title="Review Listing"
        stepText="Step 5 of 5"
        subtitle="Preview & Publish"
        progressPercentage={100}
        themeColor="amber"
        onBack={() => onNavigate('CREATE_VENUE_PACKAGES')}
    >
        <div className="text-center space-y-1">
            <h2 className="text-2xl font-black">Preview Your Venue</h2>
            <p className="text-sm text-gray-400">This is how customers will see your listing. Review everything before publishing.</p>
        </div>

        {/* Mobile Mockup Frame */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 overflow-hidden shadow-xl max-w-md mx-auto">
            {/* Cover Image */}
            <div className="h-52 relative">
                <img loading="lazy" src="https://picsum.photos/seed/venue-preview/800/500" alt="Venue Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Preview
                </div>
                <button onClick={() => onNavigate('CREATE_VENUE_DETAILS')} className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow text-gray-600 hover:bg-white transition-colors">
                    <Edit3 size={14} />
                </button>
            </div>

            <div className="p-5 space-y-5">
                {/* Title & Location */}
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-black text-gray-900">Royal Kids Party Hall</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1 font-medium">
                            <MapPin size={14} className="text-amber-500" /> Powai, Mumbai
                        </p>
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">Party Hall › Birthday Venue</p>
                    </div>
                    <button onClick={() => onNavigate('CREATE_VENUE_DETAILS')} className="text-gray-400 hover:text-amber-500 p-1">
                        <Edit3 size={14} />
                    </button>
                </div>

                {/* Occasions Tags */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                        {['Birthday', 'Playdate', 'Celebration'].map((tag) => (
                            <span key={tag} className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full">🎉 {tag}</span>
                        ))}
                    </div>
                    <button onClick={() => onNavigate('CREATE_VENUE_OCCASIONS')} className="text-gray-400 hover:text-amber-500 p-1 shrink-0">
                        <Edit3 size={12} />
                    </button>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-amber-50 px-4 py-3 rounded-xl flex items-center gap-2.5">
                        <Users size={16} className="text-amber-500" />
                        <div>
                            <p className="text-[10px] font-bold text-amber-900/50 uppercase tracking-widest">Capacity</p>
                            <p className="text-sm font-black text-amber-900">10 – 50 Guests</p>
                        </div>
                    </div>
                    <div className="bg-blue-50 px-4 py-3 rounded-xl flex items-center gap-2.5">
                        <Clock size={16} className="text-blue-500" />
                        <div>
                            <p className="text-[10px] font-bold text-blue-900/50 uppercase tracking-widest">Slots</p>
                            <p className="text-sm font-black text-blue-900">3 Available</p>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="relative">
                    <p className="text-sm text-gray-600 leading-relaxed">
                        A beautiful, fully air-conditioned party hall with colorful décor, a dedicated kids' play zone, sound system, and ample parking. Perfect for birthdays, playdates, and small celebrations.
                    </p>
                    <button onClick={() => onNavigate('CREATE_VENUE_DETAILS')} className="absolute -top-1 -right-1 text-gray-400 hover:text-amber-500 p-1">
                        <Edit3 size={12} />
                    </button>
                </div>

                {/* Availability */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Availability</p>
                        <button onClick={() => onNavigate('CREATE_VENUE_AVAILABILITY')} className="text-gray-400 hover:text-amber-500 p-1">
                            <Edit3 size={12} />
                        </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {[
                            { day: 'Mon', date: '21', month: 'Feb' },
                            { day: 'Wed', date: '23', month: 'Feb' },
                            { day: 'Thu', date: '24', month: 'Feb' },
                            { day: 'Sat', date: '26', month: 'Feb' },
                        ].map((d, i) => (
                            <div key={i} className="shrink-0 w-14 py-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
                                <p className="text-[9px] font-bold text-amber-500 uppercase">{d.day}</p>
                                <p className="text-lg font-black text-amber-900 leading-none">{d.date}</p>
                                <p className="text-[9px] font-bold text-amber-500 uppercase">{d.month}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        {['Morning', 'Afternoon', 'Evening'].map((slot) => (
                            <span key={slot} className="bg-gray-50 text-gray-500 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                <Clock size={10} /> {slot}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Packages */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Packages</p>
                        <button onClick={() => onNavigate('CREATE_VENUE_PACKAGES')} className="text-gray-400 hover:text-amber-500 p-1">
                            <Edit3 size={12} />
                        </button>
                    </div>
                    {[
                        { name: 'Basic Party', price: '₹15,000', desc: 'Venue access, standard decoration, basic sound system.' },
                        { name: 'Standard (Special Treat)', price: '₹20,000', desc: 'Basic + theme decoration, host, and return gifts.' },
                    ].map((pkg, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600">
                                    <Star size={14} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{pkg.name}</p>
                                    <p className="text-[11px] text-gray-400 line-clamp-1">{pkg.desc}</p>
                                </div>
                            </div>
                            <span className="font-black text-amber-600 text-sm whitespace-nowrap">{pkg.price}</span>
                        </div>
                    ))}
                </div>

                {/* Photo Strip */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-20 h-20 shrink-0 rounded-xl overflow-hidden">
                            <img loading="lazy" src={`https://picsum.photos/seed/venue${i}/200/200`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                    ))}
                </div>

                {/* Enquire button (disabled preview) */}
                <button className="w-full py-3 bg-gray-100 text-gray-400 rounded-2xl font-bold text-sm cursor-not-allowed">
                    📩 Enquire Now (disabled in preview)
                </button>
            </div>
        </div>

        {/* Edit shortcuts hint */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-amber-700">✎ Tap any <Edit3 size={10} className="inline" /> icon above to jump back and edit that section</p>
        </div>

        <WizardNavigation 
            onNext={() => onNavigate('SERVICE_LISTINGS')}
            nextText="Publish Venue"
            nextIcon={<Rocket size={22} />}
            themeColor="amber"
        />
        <p className="text-center text-xs text-gray-400 font-medium">
            Your venue will be reviewed and published instantly.
        </p>
    </WizardLayout>
);
