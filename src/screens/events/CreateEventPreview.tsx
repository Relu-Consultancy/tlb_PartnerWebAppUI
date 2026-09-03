import React, { useState, useEffect } from 'react';
import { Rocket, Clock, Loader2, AlertCircle, CheckCircle2, ShieldCheck, LockKeyhole } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, AppListingPreview, formatLanguages } from '../../components/ui';
import type { AppListingPreviewModel, PreviewFact } from '../../components/ui';
import {
    getListingDetail,
    submitListing,
    getCurrentDraftId,
    clearCurrentDraftId,
    ApiError,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface EventDetail {
    id: string;
    title: string;
    description: string;
    status: string;
    category?: { id: number; name: string };
    subcategory?: { id: number; name: string };
    format?: string;
    age_group?: { type: string; min_age: number; max_age: number };
    registration_deadline?: string;
    start_datetime?: string;
    end_datetime?: string;
    mode?: string;
    city?: string;
    area?: string;
    address?: string;
    meeting_link?: string;
    price_type?: string;
    capacity?: number;
    available_seats?: number;
    tickets?: { id: number; name: string; price: number; total_quantity: number; available_quantity: number; description?: string; is_default?: boolean }[];
    media?: { id: number; media_type: string; file_url: string }[];
}

// ─── Result Modal ─────────────────────────────────────────────────────────────

type ModalVariant = 'success' | 'under_review' | 'error';

interface ResultModalProps {
    variant: ModalVariant;
    message?: string;
    onClose: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ variant, message, onClose }) => {
    // ── success: partner isVerified=true, event submitted → under admin review ──
    if (variant === 'success') {
        return (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
                style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border-2 border-amber-400">
                    {/* Amber header band */}
                    <div className="bg-amber-50 px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4">
                        {/* Pulsing icon ring */}
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-amber-300/40 animate-ping" />
                            <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-amber-400 shadow-lg">
                                <Clock size={36} className="text-amber-500" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-tlb-dark">Event Under Review</h2>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">
                                Pending Admin Approval
                            </p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 pt-5 pb-4">
                        <p className="text-sm text-gray-500 leading-relaxed text-center">
                            Your event has been submitted and is currently being reviewed by the TLB team.
                        </p>
                    </div>

                    {/* Warning notice */}
                    <div className="px-6 pb-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                            <LockKeyhole size={16} className="text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                You won't be able to create new events until this one is published.
                            </p>
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="px-6 pb-4">
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
                            {[
                                { done: true,  label: 'Draft created & saved' },
                                { done: true,  label: 'Submitted for admin review' },
                                { done: false, label: 'Admin approves → event goes live' },
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-emerald-500' : 'bg-amber-100 border-2 border-amber-300'}`}>
                                        {step.done
                                            ? <CheckCircle2 size={12} className="text-white" />
                                            : <Clock size={9} className="text-amber-500" />}
                                    </div>
                                    <span className={step.done ? 'text-gray-700 font-semibold' : 'text-amber-600 font-semibold'}>{step.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="px-6 pb-6">
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl font-black text-sm text-tlb-dark bg-tlb-yellow shadow-lg shadow-tlb-yellow/30 hover:brightness-95 active:scale-95 transition-all"
                        >
                            Okay, Go to My Listings
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── under_review: partner isVerified=false, profile under review → can't submit ──
    if (variant === 'under_review') {
        return (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
                style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border-2 border-purple-400">
                    <div className="bg-blue-50 px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-purple-400 shadow-lg">
                            <ShieldCheck size={36} className="text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-tlb-dark">Profile Under Review</h2>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">
                                Draft Saved
                            </p>
                        </div>
                    </div>
                    <div className="px-6 py-5">
                        <p className="text-sm text-gray-500 leading-relaxed text-center">
                            {message || 'Your partner profile is currently under review. You can prepare and save drafts, but cannot submit events until the review is complete.'}
                        </p>
                    </div>
                    <div className="px-6 pb-6">
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl font-black text-sm text-tlb-dark bg-tlb-yellow shadow-lg shadow-tlb-yellow/30 hover:brightness-95 active:scale-95 transition-all"
                        >
                            Back to Listings
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── error: generic submit failure ──
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
                        {message || 'Something went wrong while submitting your event. Please try again.'}
                    </p>
                </div>
                <div className="px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl font-black text-sm text-tlb-dark bg-tlb-yellow shadow-lg shadow-tlb-yellow/30 hover:brightness-95 active:scale-95 transition-all"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = 'https://tlb-api.reluconsultancy.in';
const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const titleCase = (s?: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

// "Saturday, 21 Mar · 3:00 PM – 6:00 PM"
const fmtRange = (s?: string, e?: string): string | undefined => {
    if (!s) return undefined;
    const sd = new Date(s);
    if (Number.isNaN(sd.getTime())) return undefined;
    const datePart = sd.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
    const t1 = sd.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    let out = `${datePart} · ${t1}`;
    if (e) {
        const ed = new Date(e);
        if (!Number.isNaN(ed.getTime())) out += ` – ${ed.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
    }
    return out;
};

export const CreateEventPreview: React.FC<Props> = ({ onNavigate }) => {
    const [draftId, setDraftId] = useState<string | null>(null);
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [modal, setModal] = useState<{ variant: ModalVariant; message?: string } | null>(null);

    const loadDraft = async (id: string) => {
        setLoading(true);
        try {
            const res = await getListingDetail(id);
            setEvent(res.data || res);
            setLoadError(null);
        } catch (err: any) {
            setLoadError(err?.message || 'Failed to load event.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const id = getCurrentDraftId();
        if (!id) {
            setLoadError('No active draft. Start from "Event Details".');
            setLoading(false);
            return;
        }
        setDraftId(id);
        loadDraft(id);
    }, []);

    const cover = event?.media?.find(m => m.media_type === 'cover');
    const gallery = event?.media?.filter(m => m.media_type === 'gallery') || [];

    // Submission readiness check (mirrors backend requirements)
    const missing: string[] = [];
    if (event) {
        if (!event.title?.trim()) missing.push('Title');
        if (!event.description?.trim()) missing.push('Description');
        if (!event.category) missing.push('Category');
        if (!event.subcategory) missing.push('Subcategory');
        if (!event.format) missing.push('Format');
        if (!event.age_group) missing.push('Age group');
        if (!event.start_datetime) missing.push('Start date/time');
        if (!event.end_datetime) missing.push('End date/time');
        if (!event.mode) missing.push('Mode');
        if ((event.mode === 'offline' || event.mode === 'hybrid') && (!event.city || !event.address)) missing.push('City + Address');
        if ((event.mode === 'online' || event.mode === 'hybrid') && !event.meeting_link) missing.push('Meeting link');
        if (!event.price_type) missing.push('Price type');
        if (event.price_type === 'free' && !event.capacity) missing.push('Capacity');
        if (event.price_type === 'paid' && (!event.tickets || event.tickets.length === 0)) missing.push('At least 1 ticket');
        if (!cover) missing.push('Cover image');
    }
    const canSubmit = !!event && missing.length === 0 && event.status === 'draft';

    const isOnline = event?.mode === 'online';
    const minTicket = event?.tickets && event.tickets.length
        ? Math.min(...event.tickets.map(t => Number(t.price) || 0)) : undefined;
    const langLine = event ? formatLanguages(event.languages, event.other_language) : '';
    const previewModel: AppListingPreviewModel | null = event ? {
        typeLabel: 'Event',
        title: event.title || '',
        coverUrl: cover ? resolveUrl(cover.file_url) : undefined,
        gallery: gallery.map(g => resolveUrl(g.file_url)),
        tags: [event.category?.name, event.subcategory?.name, event.format ? titleCase(event.format) : undefined].filter(Boolean) as string[],
        locationLine: isOnline ? 'Online event' : ([event.area, event.city].filter(Boolean).join(', ') || event.address || undefined),
        address: isOnline ? undefined : (event.address || [event.area, event.city].filter(Boolean).join(', ') || undefined),
        dateLine: fmtRange(event.start_datetime, event.end_datetime),
        description: event.description || '',
        aboutTitle: 'About Event',
        facts: [
            langLine ? { icon: 'language', label: 'Language', value: langLine } : null,
            event.age_group ? { icon: 'age', label: 'Age Group', value: `${event.age_group.min_age}–${event.age_group.max_age} yrs` } : null,
            event.format ? { icon: 'format', label: 'Format', value: titleCase(event.format) } : null,
            event.mode ? { icon: 'mode', label: 'Mode', value: titleCase(event.mode) } : null,
            event.available_seats != null
                ? { icon: 'spots', label: 'Spots available', value: String(event.available_seats) }
                : event.capacity != null ? { icon: 'spots', label: 'Capacity', value: String(event.capacity) } : null,
        ].filter(Boolean) as PreviewFact[],
        priceLabel: event.price_type === 'free' ? 'Free' : (minTicket != null ? (minTicket > 0 ? `₹${minTicket}` : 'Free') : '—'),
        ctaLabel: 'Book Now',
    } : null;

    const handleSubmit = async () => {
        if (!draftId || !canSubmit) return;
        setSubmitting(true);
        try {
            await submitListing(draftId);
            clearCurrentDraftId();
            setModal({ variant: 'success' });
        } catch (err: any) {
            console.error('Submit failed', err);
            const code: string = err instanceof ApiError ? err.code : '';
            const msg: string = err?.message || '';
            setModal({
                variant: code === 'PARTNER_UNDER_REVIEW' ? 'under_review' : 'error',
                message: code === 'PARTNER_UNDER_REVIEW' ? undefined : (msg || undefined),
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleModalClose = () => {
        setModal(null);
        clearCurrentDraftId();
        onNavigate('SERVICE_LISTINGS');
    };

    if (loading) {
        return (
            <WizardLayout
                title="New Event"
                stepText="Step 5 of 5"
                subtitle="Preview & Publish"
                progressPercentage={100}
                themeColor="blue"
                onBack={() => onNavigate('CREATE_EVENT_POLICIES')}
            >
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading preview…
                </div>
            </WizardLayout>
        );
    }

    if (loadError || !event) {
        return (
            <WizardLayout
                title="New Event"
                stepText="Step 5 of 5"
                subtitle="Preview & Publish"
                progressPercentage={100}
                themeColor="blue"
                onBack={() => onNavigate('CREATE_EVENT_POLICIES')}
            >
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-600">
                    {loadError || 'Could not load event.'}
                </div>
            </WizardLayout>
        );
    }

    return (
        <WizardLayout
            title="New Event"
            stepText="Step 5 of 5"
            subtitle="Preview & Publish"
            progressPercentage={100}
            themeColor="blue"
            onBack={() => onNavigate('CREATE_EVENT_MEDIA')}
        >
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-black">Preview Your Event</h2>
                <p className="text-sm text-gray-400">This is how attendees will see your event.</p>
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
            ) : event.status === 'draft' ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 size={16} />
                    <p className="text-xs font-black uppercase tracking-widest">Ready to submit for review</p>
                </div>
            ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-2 text-blue-700">
                    <CheckCircle2 size={16} />
                    <p className="text-xs font-black uppercase tracking-widest">
                        Event is {event.status} — already submitted.
                    </p>
                </div>
            )}

            <WizardNavigation
                onBack={() => onNavigate('CREATE_EVENT_POLICIES')}
                onNext={canSubmit && !submitting ? handleSubmit : () => {}}
                nextText={submitting ? 'Submitting…' : event.status === 'draft' ? 'Submit for Review' : 'Done'}
                nextIcon={submitting ? <Loader2 size={20} className="animate-spin" /> : <Rocket size={20} />}
                themeColor="blue"
            />

            {modal && (
                <ResultModal
                    variant={modal.variant}
                    message={modal.message}
                    onClose={handleModalClose}
                />
            )}
        </WizardLayout>
    );
};
