import React, { useState, useEffect } from 'react';
import { Rocket, Clock, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, AppListingPreview } from '../../components/ui';
import type { AppListingPreviewModel, PreviewFact } from '../../components/ui';
import {
    getVenueListingDetail,
    submitVenueListing,
    getCurrentVenueDraftId,
    clearCurrentVenueDraftId,
    ApiError,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar?: () => void; }

interface MediaItem { id: number; media_type: string; url: string }
interface AvailabilitySlot { id: number; date: string; start_time: string; end_time: string; note?: string }
interface VenuePackage { id: number; name: string; price: string | number; description?: string; duration_minutes?: number; max_guests?: number }
interface OccasionItem { id: number; name: string; slug: string }

interface VenueDetail {
    id: string;
    title: string;
    description?: string;
    status: string;
    category?: { id: number; name: string; slug: string };
    subcategory?: { id: number; name: string; slug: string };
    location_type?: string;
    city?: string;
    area?: string;
    address?: string;
    min_age?: number;
    max_age?: number;
    min_capacity?: number;
    max_capacity?: number;
    occasions?: OccasionItem[];
    media?: MediaItem[];
    availability?: AvailabilitySlot[];
    packages?: VenuePackage[];
    discovery?: { outing_types: string[]; activity_types: string[]; format_types: string[] };
    required_attendee_fields?: string[];
}

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
                            {message || 'Your partner profile is currently under review. You can save drafts, but cannot submit venues until the review is complete.'}
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
                // Venue detail includes media, availability, packages, discovery, occasions inline
                const res = await getVenueListingDetail(id);
                setVenue(res.data || res);
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
    const packages = venue?.packages || [];
    const slots = venue?.availability || [];

    // Readiness check — mirrors backend submit requirements
    const missing: string[] = [];
    if (venue) {
        if (!venue.title?.trim()) missing.push('Title');
        if (!venue.description?.trim()) missing.push('Description');
        if (!venue.category) missing.push('Category');
        if (!venue.subcategory) missing.push('Subcategory');
        if (!venue.city) missing.push('City');
        if (!venue.address) missing.push('Address');
        if (!cover) missing.push('Cover image');
        if (slots.length === 0) missing.push('At least one availability slot');
        if (packages.length === 0) missing.push('At least one package');
    }
    const canSubmit = !!venue && missing.length === 0 && venue.status === 'draft';

    const minPkg = packages.length ? Math.min(...packages.map(p => Number(p.price) || 0)) : undefined;
    const firstSlot = slots[0];
    const previewModel: AppListingPreviewModel | null = venue ? {
        typeLabel: 'Venue',
        title: venue.title || '',
        coverUrl: cover ? resolveUrl(cover.url) : undefined,
        gallery: gallery.map(g => resolveUrl(g.url)),
        tags: [venue.category?.name, venue.subcategory?.name].filter(Boolean) as string[],
        locationLine: [venue.area, venue.city].filter(Boolean).join(', ') || venue.address || undefined,
        address: venue.address || [venue.area, venue.city].filter(Boolean).join(', ') || undefined,
        dateLine: firstSlot ? `${fmtSlotDate(firstSlot.date)} · ${firstSlot.start_time}–${firstSlot.end_time}` : undefined,
        description: venue.description || '',
        aboutTitle: 'About Venue',
        facts: [
            (venue.min_capacity != null || venue.max_capacity != null) ? {
                icon: 'capacity', label: 'Capacity',
                value: venue.min_capacity != null && venue.max_capacity != null
                    ? `${venue.min_capacity}–${venue.max_capacity} guests`
                    : venue.max_capacity != null ? `Up to ${venue.max_capacity} guests` : `${venue.min_capacity}+ guests`,
            } : null,
            (venue.min_age != null || venue.max_age != null) ? {
                icon: 'age', label: 'Age Group', value: `${venue.min_age ?? 0}–${venue.max_age ?? '∞'} yrs`,
            } : null,
            venue.occasions && venue.occasions.length ? {
                icon: 'occasion', label: 'Best for', value: venue.occasions.slice(0, 3).map(o => o.name).join(', '),
            } : null,
            slots.length ? { icon: 'schedule', label: 'Availability', value: `${slots.length} slot${slots.length > 1 ? 's' : ''}` } : null,
        ].filter(Boolean) as PreviewFact[],
        priceLabel: minPkg != null ? `₹${minPkg.toLocaleString()}` : '—',
        ctaLabel: 'Enquire Now',
    } : null;

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
            <WizardLayout title="Review Listing" stepText="Step 6 of 6" subtitle="Preview & Publish" progressPercentage={100} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_POLICIES')}>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading preview…
                </div>
            </WizardLayout>
        );
    }

    if (loadError || !venue) {
        return (
            <WizardLayout title="Review Listing" stepText="Step 6 of 6" subtitle="Preview & Publish" progressPercentage={100} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_POLICIES')}>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-600">
                    {loadError || 'Could not load venue.'}
                </div>
            </WizardLayout>
        );
    }

    return (
        <WizardLayout title="Review Listing" stepText="Step 6 of 6" subtitle="Preview & Publish" progressPercentage={100} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_POLICIES')}>
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-black">Preview Your Venue</h2>
                <p className="text-sm text-gray-400">Review everything before submitting.</p>
            </div>

            {previewModel && <AppListingPreview model={previewModel} listingId={draftId || undefined} />}

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
                onBack={() => onNavigate('CREATE_VENUE_POLICIES')}
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
