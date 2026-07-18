import React, { useEffect, useState } from 'react';
import {
    ArrowLeft, Heart, Share2, Star, MapPin, CalendarDays, ChevronRight,
    Navigation as NavIcon, UserCircle, Clock, Users, Ticket, Languages,
    PartyPopper, Layers, FileText, Image as ImageIcon,
} from 'lucide-react';
import { getCurrentPartner, getExtendedProfile } from '../../api/onboarding';
import { getListingTerms } from '../../api/listings';

// ---------------------------------------------------------------------------
// AppListingPreview — renders a listing exactly as it appears in the TLB user
// app (mobile detail page), shown at the end of every creation wizard.
// Each wizard normalizes its entity into the shared model below.
// ---------------------------------------------------------------------------

export type PreviewFactIcon =
    | 'age' | 'language' | 'spots' | 'capacity' | 'duration' | 'mode' | 'occasion' | 'format' | 'schedule';

export interface PreviewFact {
    icon: PreviewFactIcon;
    label: string;
    value: string;
}

export interface AppListingPreviewModel {
    typeLabel: string;          // 'Event' | 'Venue' | 'Class' | 'Program'
    title: string;
    coverUrl?: string;
    gallery?: string[];
    tags?: string[];            // pills under title
    locationLine?: string;      // "Embassy Int. Riding School, North Bangalore"
    address?: string;           // used for the Get Direction map link
    dateLine?: string;          // "Saturday, 21 Mar · 3:00 PM – 6:00 PM"
    description?: string;
    aboutTitle?: string;        // "About Event"
    facts?: PreviewFact[];      // Things to Know
    priceLabel?: string;        // bottom bar, e.g. "₹350"
    ctaLabel?: string;          // bottom bar button, e.g. "Book Now"
}

interface Props {
    model: AppListingPreviewModel;
    /** When given, the Terms & Conditions section loads from the listing's terms endpoint. */
    listingId?: string;
}

const FACT_ICON: Record<PreviewFactIcon, React.ComponentType<{ size?: number; className?: string }>> = {
    age: Users, language: Languages, spots: Ticket, capacity: Users,
    duration: Clock, mode: MapPin, occasion: PartyPopper, format: Layers, schedule: CalendarDays,
};

export const AppListingPreview: React.FC<Props> = ({ model, listingId }) => {
    const [expanded, setExpanded] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [terms, setTerms] = useState('');
    const [org, setOrg] = useState<{ name: string; logo?: string }>({ name: 'Your Business' });

    useEffect(() => {
        Promise.allSettled([getCurrentPartner(), getExtendedProfile()]).then(([p, e]) => {
            const pd: any = p.status === 'fulfilled' ? (p.value?.data || p.value) : {};
            const ed: any = e.status === 'fulfilled' ? (e.value?.data || e.value) : {};
            setOrg({
                name: pd?.business_name || ed?.business_name || 'Your Business',
                logo: ed?.logo || pd?.logo || undefined,
            });
        });
    }, []);

    useEffect(() => {
        if (!listingId) return;
        getListingTerms(listingId)
            .then((t: any) => {
                if (!t) return;
                const text = typeof t === 'string' ? t : (t.content || t.text || t.terms || '');
                if (text) setTerms(text);
            })
            .catch(() => {});
    }, [listingId]);

    const gallery = (model.gallery || []).filter(Boolean);
    const tags = (model.tags || []).filter(Boolean);
    const facts = (model.facts || []).filter(f => f.value);
    const mapsHref = model.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(model.address)}`
        : undefined;
    const showLearnMore = (model.description || '').length > 140;

    return (
        <div className="mx-auto w-full max-w-[390px]">
            <div className="relative rounded-[2.5rem] border-[10px] border-gray-900 bg-gray-50 shadow-2xl flex flex-col h-[640px] overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-gray-900 rounded-b-2xl z-30" />

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Hero */}
                    <div className="relative">
                        {model.coverUrl ? (
                            <img src={model.coverUrl} alt="Cover" className="w-full h-60 object-cover rounded-b-[2rem]" />
                        ) : (
                            <div className="w-full h-60 bg-gray-200 rounded-b-[2rem] flex flex-col items-center justify-center text-gray-400">
                                <ImageIcon size={28} />
                                <span className="text-xs font-bold mt-1">No cover image</span>
                            </div>
                        )}
                        <button type="button" className="absolute top-7 left-4 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700">
                            <ArrowLeft size={18} />
                        </button>
                        <div className="absolute top-7 right-4 flex gap-2">
                            <span className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700"><Heart size={16} /></span>
                            <span className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700"><Share2 size={16} /></span>
                        </div>
                    </div>

                    {/* Title block */}
                    <div className="px-4 pt-4 space-y-3">
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {tags.map(t => (
                                    <span key={t} className="bg-tlb-yellow text-tlb-dark text-xs font-bold px-3 py-1 rounded-lg">{t}</span>
                                ))}
                            </div>
                        )}
                        <h1 className="text-xl font-black text-gray-900 leading-snug">{model.title || `Untitled ${model.typeLabel}`}</h1>
                        <div className="flex items-center gap-1">
                            {[0, 1, 2, 3, 4].map(i => <Star key={i} size={15} className="text-gray-300" fill="currentColor" />)}
                            <span className="text-xs text-gray-400 font-medium ml-1.5">No reviews yet</span>
                        </div>
                        {model.locationLine && (
                            <div className="flex items-start gap-2.5 pt-3 border-t border-gray-100">
                                <MapPin size={17} className="text-gray-400 mt-0.5 shrink-0" />
                                <p className="text-sm text-gray-700 font-medium">{model.locationLine}</p>
                            </div>
                        )}
                        {model.dateLine && (
                            <div className="flex items-start gap-2.5 pt-3 border-t border-gray-100">
                                <CalendarDays size={17} className="text-gray-400 mt-0.5 shrink-0" />
                                <p className="text-sm text-gray-700 font-medium">{model.dateLine}</p>
                            </div>
                        )}
                    </div>

                    {/* About */}
                    {model.description && (
                        <div className="px-4 pt-4">
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                <h2 className="font-black text-gray-900 mb-1.5">{model.aboutTitle || `About ${model.typeLabel}`}</h2>
                                <p className={`text-sm text-gray-500 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>{model.description}</p>
                                {showLearnMore && (
                                    <button type="button" onClick={() => setExpanded(!expanded)} className="text-sm font-bold text-blue-500 mt-1">
                                        {expanded ? 'Show Less' : 'Learn More'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Things to Know */}
                    {facts.length > 0 && (
                        <div className="px-4 pt-5">
                            <h2 className="font-black text-gray-900 mb-1">Things to Know</h2>
                            <div>
                                {facts.map((f, i) => {
                                    const Icon = FACT_ICON[f.icon];
                                    return (
                                        <div key={`${f.label}-${i}`} className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                                            <Icon size={18} className="text-gray-400 shrink-0" />
                                            <p className="text-sm text-gray-700">
                                                <span className="text-gray-400">{f.label}: </span>
                                                <span className="font-semibold">{f.value}</span>
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Gallery */}
                    {gallery.length > 0 && (
                        <div className="px-4 pt-5">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="font-black text-gray-900">Gallery</h2>
                                <span className="text-sm font-bold text-blue-500 flex items-center gap-0.5">See All <ChevronRight size={14} /></span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {gallery.map((g, i) => (
                                    <img key={i} src={g} alt="" className="w-32 h-32 rounded-2xl object-cover shrink-0" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Location map */}
                    {(model.locationLine || model.address) && (
                        <div className="px-4 pt-5">
                            <h2 className="font-black text-gray-900 mb-2">Location</h2>
                            <div
                                className="rounded-2xl overflow-hidden relative h-36 flex items-end p-3"
                                style={{
                                    backgroundColor: '#e5e7eb',
                                    backgroundImage:
                                        'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
                                    backgroundSize: '22px 22px',
                                }}
                            >
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-3">
                                    <MapPin size={30} className="text-red-500 drop-shadow" fill="currentColor" />
                                </div>
                                <div className="relative z-10">
                                    {model.locationLine && <p className="text-xs font-bold text-gray-800 bg-white/70 rounded px-1.5 py-0.5 inline-block">{model.locationLine}</p>}
                                    {mapsHref && (
                                        <a href={mapsHref} target="_blank" rel="noreferrer" className="mt-2 flex w-max items-center gap-1.5 bg-tlb-yellow text-tlb-dark text-xs font-bold px-3 py-1.5 rounded-lg shadow">
                                            <NavIcon size={13} /> Get Direction
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Organized by */}
                    <div className="px-4 pt-5">
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-gray-400 shrink-0">
                                {org.logo ? <img src={org.logo} alt="" className="w-full h-full object-cover" /> : <UserCircle size={28} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-tlb-yellow uppercase tracking-widest">Organized By</p>
                                <p className="font-black text-gray-900 truncate">{org.name}</p>
                            </div>
                            <span className="border border-gray-300 text-gray-700 text-xs font-bold px-4 py-1.5 rounded-full">Follow</span>
                        </div>
                    </div>

                    {/* Terms & Conditions */}
                    {terms && (
                        <div className="px-4 pt-3">
                            <button type="button" onClick={() => setShowTerms(!showTerms)} className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                                <FileText size={18} className="text-gray-500" />
                                <span className="flex-1 text-left font-bold text-gray-800 text-sm">Terms &amp; Conditions</span>
                                <ChevronRight size={18} className={`text-gray-400 transition-transform ${showTerms ? 'rotate-90' : ''}`} />
                            </button>
                            {showTerms && (
                                <div className="bg-white rounded-2xl mt-1 p-4 text-sm text-gray-500 leading-relaxed whitespace-pre-wrap shadow-sm border border-gray-100">
                                    {terms}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reviews (empty state) */}
                    <div className="px-4 pt-5 pb-6">
                        <h2 className="font-black text-gray-900 mb-2">Reviews</h2>
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
                            <p className="text-sm text-gray-400">No reviews yet</p>
                            <p className="text-xs text-gray-300 mt-0.5">Attendee reviews will appear here once you go live.</p>
                        </div>
                    </div>
                </div>

                {/* Sticky bottom bar */}
                <div className="border-t border-gray-100 bg-white px-4 py-3 flex items-center justify-between gap-3">
                    <div className="leading-none">
                        <p className="text-lg font-black text-gray-900">{model.priceLabel || '—'}</p>
                    </div>
                    <span className="flex-1 max-w-[200px] text-center bg-tlb-yellow text-tlb-dark font-black text-sm py-3.5 rounded-full">
                        {model.ctaLabel || 'Book Now'}
                    </span>
                </div>
            </div>
            <p className="text-center text-[11px] text-gray-400 mt-3">Preview · how your {model.typeLabel.toLowerCase()} appears in the TLB app</p>
        </div>
    );
};
