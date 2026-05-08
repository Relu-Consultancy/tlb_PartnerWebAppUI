import React, { useState, useEffect } from 'react';
import { Edit3, Rocket, MapPin, Users, Clock, Star, Loader2, AlertCircle, CheckCircle2, ShieldCheck, CalendarDays } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';
import {
    getVenueListingDetail,
    getVenuePackages,
    getVenueAvailability,
    submitVenueListing,
    getCurrentVenueDraftId,
    clearCurrentVenueDraftId,
    ApiError,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar?: () => void; }

interface VenueDetail {
    id: string;
    title: string;
    description?: string;
    location?: string;
    status: string;
    category?: { id: number; name: string };
    subcategory?: { id: number; name: string };
    occasions?: string[];
    min_guests?: number;
    max_guests?: number;
    media?: { id: number; media_type: string; file_url: string }[];
}

interface VenuePackage { id: number; name: string; price: number; description?: string; duration_minutes?: number; max_guests?: number }
interface AvailabilitySlot { id: number; date: string; start_time: string; end_time: string; note?: string }

type ModalVariant = 'success' | 'under_review' | 'error';

interface ResultModalProps { variant: ModalVariant; message?: string; onClose: () => void }

const ResultModal: React.FC<ResultModalProps> = ({ variant, message, onClose }) => {
    if (variant === 'success') {
        return (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
                style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border-2 border-amber-400">
                    <div className="bg-amber-50 px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-amber-300/40 animate-ping" />
                            <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-amber-400 shadow-lg">
                                <Clock size={36} className="text-amber-500" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-tlb-dark">Venue Under Review</h2>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">Pending Admin Approval</p>
                        </div>
                    </div>
                    <div className="px-6 py-5">
                        <p className="text-sm text-gray-500 leading-relaxed text-center">
                            Your venue has been submitted and is currently being reviewed by the TLB team.
                        </p>
                    </div>
                    <div className="px-6 pb-6">
                        <button onClick={onClose} className="w-full py-4 rounded-2xl font-black text-sm text-tlb-dark bg-tlb-yellow shadow-lg shadow-tlb-yellow/30 hover:brightness-95 active:scale-95 transition-all">
                            Okay, Go to My Listings
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'under_review') {
        return (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
                style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border-2 border-purple-400">
                    <div className="bg-purple-50 px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-purple-400 shadow-lg">
                            <ShieldCheck size={36} className="text-purple-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-tlb-dark">Profile Under Review</h2>
                            <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mt-1">Draft Saved</p>
                        </div>
                    </div>
                    <div className="px-6 py-5">
                        <p className="text-sm text-gray-500 leading-relaxed text-center">
                            {message || 'Your partner profile is currently under review. You can prepare and save drafts, but cannot submit venues until the review is complete.'}
                        </p>
                    </div>
                    <div className="px-6 pb-6">
                        <button onClick={onClose} className="w-full py-4 rounded-2xl font-black text-sm text-tlb-dark bg-tlb-yellow shadow-lg shadow-tlb-yellow/30 hover:brightness-95 active:scale-95 transition-all">
                            Back to Listings
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
            style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border-2 border-red-400">
                <div className="bg-red-50 px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-red-400 shadow-lg">
                        <AlertCircle size={36} className="text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-tlb-dark">Submission Failed</h2>
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">Error</p>
                    </div>
                </div>
                <div className="px-6 py-5">
                    <p className="text-sm text-gray-500 leading-relaxed text-center">
                        {message || 'Something went wrong while submitting your venue. Please try again.'}
                    </p>
                </div>
                <div className="px-6 pb-6">
                    <button onClick={onClose} className="w-full py-4 rounded-2xl font-black text-sm text-tlb-dark bg-tlb-yellow shadow-lg shadow-tlb-yellow/30 hover:brightness-95 active:scale-95 transition-all">
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

const API_BASE = 'https://tlb-api.reluconsultancy.in';
const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const fmtSlotDate = (iso: string) => {
    try { return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }); }
    catch { return iso; }
};

export const CreateVenuePreview: React.FC<Props> = ({ onNavigate }) => {
    const [draftId, setDraftId] = useState<string | null>(null);
    const [venue, setVenue] = useState<VenueDetail | null>(null);
    const [packages, setPackages] = useState<VenuePackage[]>([]);
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [modal, setModal] = useState<{ variant: ModalVariant; message?: string } | null>(null);

    useEffect(() => {
        const id = getCurrentVenueDraftId();
        if (!id) { setLoadError('No active draft. Start from "Venue Details".'); setLoading(false); return; }
        setDraftId(id);

        const load = async () => {
            try {
                const [detailRes, pkgsRes, slotsRes] = await Promise.allSettled([
                    getVenueListingDetail(id),
                    getVenuePackages(id),
                    getVenueAvailability(id),
                ]);
                if (detailRes.status === 'fulfilled') {
                    setVenue(detailRes.value.data || detailRes.value);
                } else {
                    throw detailRes.reason;
                }
                if (pkgsRes.status === 'fulfilled') {
                    setPackages(pkgsRes.value.data || pkgsRes.value || []);
                }
                if (slotsRes.status === 'fulfilled') {
                    setSlots(slotsRes.value.data || slotsRes.value || []);
                }
            } catch (err: any) {
                setLoadError(err?.message || 'Failed to load venue.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const cover = venue?.media?.find(m => m.media_type === 'cover');
    const gallery = venue?.media?.filter(m => m.media_type === 'gallery') || [];

    const missing: string[] = [];
    if (venue) {
        if (!venue.title?.trim()) missing.push('Title');
        if (!venue.description?.trim()) missing.push('Description');
        if (!venue.location?.trim()) missing.push('Location');
        if (!venue.category) missing.push('Category');
        if (!cover) missing.push('Cover image');
        if (!venue.occasions || venue.occasions.length === 0) missing.push('At least one occasion');
        if (packages.length === 0) missing.push('At least one package');
        if (slots.length === 0) missing.push('At least one availability slot');
    }
    const canSubmit = !!venue && missing.length === 0 && venue.status === 'draft';

    const handleSubmit = async () => {
        if (!draftId || !canSubmit) return;
        setSubmitting(true);
        try {
            await submitVenueListing(draftId);
            clearCurrentVenueDraftId();
            setModal({ variant: 'success' });
        } catch (err: any) {
            const code = err instanceof ApiError ? err.code : '';
            setModal({
                variant: code === 'PARTNER_UNDER_REVIEW' ? 'under_review' : 'error',
                message: code === 'PARTNER_UNDER_REVIEW' ? undefined : (err?.message || undefined),
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleModalClose = () => {
        setModal(null);
        clearCurrentVenueDraftId();
        onNavigate('SERVICE_LISTINGS');
    };

    if (loading) {
        return (
            <WizardLayout title="Review Listing" stepText="Step 5 of 5" subtitle="Preview & Publish" progressPercentage={100} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_PACKAGES')}>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading preview…
                </div>
            </WizardLayout>
        );
    }

    if (loadError || !venue) {
        return (
            <WizardLayout title="Review Listing" stepText="Step 5 of 5" subtitle="Preview & Publish" progressPercentage={100} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_PACKAGES')}>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-600">
                    {loadError || 'Could not load venue.'}
                </div>
            </WizardLayout>
        );
    }

    return (
        <WizardLayout title="Review Listing" stepText="Step 5 of 5" subtitle="Preview & Publish" progressPercentage={100} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_PACKAGES')}>
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-black">Preview Your Venue</h2>
                <p className="text-sm text-gray-400">This is how customers will see your listing. Review everything before submitting.</p>
            </div>

            {/* Venue Card */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 overflow-hidden shadow-xl max-w-md mx-auto">
                {/* Cover */}
                <div className="h-52 relative bg-gray-100">
                    {cover ? (
                        <img src={resolveUrl(cover.file_url)} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                            <CalendarDays size={32} />
                            <span className="text-xs font-bold mt-2">No cover image</span>
                        </div>
                    )}
                    <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Venue
                    </div>
                    <div className={`absolute top-3 right-3 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                        venue.status === 'draft' ? 'bg-gray-500' :
                        venue.status === 'pending' ? 'bg-amber-500' :
                        venue.status === 'published' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}>
                        {venue.status}
                    </div>
                    <button onClick={() => onNavigate('CREATE_VENUE_DETAILS')} className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow text-gray-600 hover:bg-white transition-colors" aria-label="Edit details">
                        <Edit3 size={14} />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Title & Location */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">{venue.title || 'Untitled Venue'}</h3>
                            {venue.location && (
                                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1 font-medium">
                                    <MapPin size={14} className="text-amber-500" /> {venue.location}
                                </p>
                            )}
                            {venue.category && (
                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">
                                    {venue.category.name}{venue.subcategory && ` › ${venue.subcategory.name}`}
                                </p>
                            )}
                        </div>
                        <button onClick={() => onNavigate('CREATE_VENUE_DETAILS')} className="text-gray-400 hover:text-amber-500 p-1">
                            <Edit3 size={14} />
                        </button>
                    </div>

                    {/* Occasions */}
                    {venue.occasions && venue.occasions.length > 0 && (
                        <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1.5">
                                {venue.occasions.slice(0, 4).map(tag => (
                                    <span key={tag} className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full">🎉 {tag}</span>
                                ))}
                                {venue.occasions.length > 4 && (
                                    <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full">+{venue.occasions.length - 4} more</span>
                                )}
                            </div>
                            <button onClick={() => onNavigate('CREATE_VENUE_OCCASIONS')} className="text-gray-400 hover:text-amber-500 p-1 shrink-0">
                                <Edit3 size={12} />
                            </button>
                        </div>
                    )}

                    {/* Capacity & Slots stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-amber-50 px-4 py-3 rounded-xl flex items-center gap-2.5">
                            <Users size={16} className="text-amber-500" />
                            <div>
                                <p className="text-[10px] font-bold text-amber-900/50 uppercase tracking-widest">Capacity</p>
                                <p className="text-sm font-black text-amber-900">
                                    {venue.min_guests != null && venue.max_guests != null
                                        ? `${venue.min_guests} – ${venue.max_guests}`
                                        : venue.max_guests != null ? `Up to ${venue.max_guests}` : '—'} Guests
                                </p>
                            </div>
                        </div>
                        <div className="bg-blue-50 px-4 py-3 rounded-xl flex items-center gap-2.5">
                            <Clock size={16} className="text-blue-500" />
                            <div>
                                <p className="text-[10px] font-bold text-blue-900/50 uppercase tracking-widest">Slots</p>
                                <p className="text-sm font-black text-blue-900">{slots.length} Available</p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {venue.description && (
                        <div className="relative">
                            <p className="text-sm text-gray-600 leading-relaxed">{venue.description}</p>
                            <button onClick={() => onNavigate('CREATE_VENUE_DETAILS')} className="absolute -top-1 -right-1 text-gray-400 hover:text-amber-500 p-1">
                                <Edit3 size={12} />
                            </button>
                        </div>
                    )}

                    {/* Availability */}
                    {slots.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Availability</p>
                                <button onClick={() => onNavigate('CREATE_VENUE_AVAILABILITY')} className="text-gray-400 hover:text-amber-500 p-1">
                                    <Edit3 size={12} />
                                </button>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {slots.slice(0, 5).map(slot => (
                                    <div key={slot.id} className="shrink-0 text-center bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                        <p className="text-[9px] font-bold text-amber-500 uppercase">{fmtSlotDate(slot.date)}</p>
                                        <p className="text-[10px] font-bold text-amber-900 mt-0.5">{slot.start_time}–{slot.end_time}</p>
                                    </div>
                                ))}
                                {slots.length > 5 && (
                                    <div className="shrink-0 flex items-center px-3 text-[10px] font-bold text-gray-400">+{slots.length - 5} more</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Packages */}
                    {packages.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Packages</p>
                                <button onClick={() => onNavigate('CREATE_VENUE_PACKAGES')} className="text-gray-400 hover:text-amber-500 p-1">
                                    <Edit3 size={12} />
                                </button>
                            </div>
                            {packages.map(pkg => (
                                <div key={pkg.id} className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600"><Star size={14} /></div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{pkg.name}</p>
                                            {pkg.description && <p className="text-[11px] text-gray-400 line-clamp-1">{pkg.description}</p>}
                                        </div>
                                    </div>
                                    <span className="font-black text-amber-600 text-sm whitespace-nowrap">₹{pkg.price?.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Gallery strip */}
                    {gallery.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {gallery.map(g => (
                                <div key={g.id} className="w-20 h-20 shrink-0 rounded-xl overflow-hidden">
                                    <img src={resolveUrl(g.file_url)} alt="" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}

                    <button className="w-full py-3 bg-gray-100 text-gray-400 rounded-2xl font-bold text-sm cursor-not-allowed">
                        📩 Enquire Now (disabled in preview)
                    </button>
                </div>
            </div>

            {/* Edit shortcuts hint */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-xs font-bold text-amber-700">✎ Tap any <Edit3 size={10} className="inline" /> icon above to jump back and edit that section</p>
            </div>

            {/* Submission readiness */}
            {missing.length > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-700">
                        <AlertCircle size={16} />
                        <p className="text-xs font-black uppercase tracking-widest">Missing for submission</p>
                    </div>
                    <ul className="text-xs text-amber-700 list-disc pl-5 space-y-0.5">
                        {missing.map(m => <li key={m}>{m}</li>)}
                    </ul>
                </div>
            ) : venue.status === 'draft' ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 size={16} />
                    <p className="text-xs font-black uppercase tracking-widest">Ready to submit for review</p>
                </div>
            ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-2 text-blue-700">
                    <CheckCircle2 size={16} />
                    <p className="text-xs font-black uppercase tracking-widest">Venue is {venue.status} — already submitted.</p>
                </div>
            )}

            <WizardNavigation
                onBack={() => onNavigate('CREATE_VENUE_PACKAGES')}
                onNext={canSubmit && !submitting ? handleSubmit : () => {}}
                nextText={submitting ? 'Submitting…' : venue.status === 'draft' ? 'Submit for Review' : 'Done'}
                nextIcon={submitting ? <Loader2 size={20} className="animate-spin" /> : <Rocket size={20} />}
                themeColor="amber"
            />

            {modal && (
                <ResultModal variant={modal.variant} message={modal.message} onClose={handleModalClose} />
            )}
        </WizardLayout>
    );
};
