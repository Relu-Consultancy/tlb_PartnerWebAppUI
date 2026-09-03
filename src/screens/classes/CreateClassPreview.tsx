import React, { useState, useEffect } from 'react';
import { Rocket, Clock, Loader2, AlertCircle, CheckCircle2, ShieldCheck, GraduationCap } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, AppListingPreview, formatLanguages } from '../../components/ui';
import type { AppListingPreviewModel, PreviewFact } from '../../components/ui';
import {
    getClassListingDetail,
    submitClassListing,
    getCurrentClassDraftId,
    clearCurrentClassDraftId,
    ApiError,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

type ModalVariant = 'success' | 'under_review' | 'error';

interface ResultModalProps { variant: ModalVariant; message?: string; onClose: () => void; }

const ResultModal: React.FC<ResultModalProps> = ({ variant, message, onClose }) => {
    if (variant === 'success') {
        return (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
                style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border-2 border-tlb-yellow">
                    <div className="bg-tlb-yellow/10 px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-tlb-yellow/40 animate-ping" />
                            <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-tlb-yellow shadow-lg">
                                <GraduationCap size={36} className="text-tlb-yellow" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-tlb-dark">Class Under Review</h2>
                            <p className="text-[10px] font-black text-tlb-yellow uppercase tracking-widest mt-1">Pending Admin Approval</p>
                        </div>
                    </div>
                    <div className="px-6 pt-5 pb-4">
                        <p className="text-sm text-gray-500 leading-relaxed text-center">
                            Your class has been submitted and is being reviewed by the TLB team.
                        </p>
                    </div>
                    <div className="px-6 pb-4">
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
                            {[
                                { done: true,  label: 'Draft created & saved' },
                                { done: true,  label: 'Submitted for admin review' },
                                { done: false, label: 'Admin approves → class goes live' },
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-tlb-yellow' : 'bg-tlb-yellow/20 border-2 border-tlb-yellow'}`}>
                                        {step.done
                                            ? <CheckCircle2 size={12} className="text-tlb-dark" />
                                            : <Clock size={9} className="text-tlb-yellow" />}
                                    </div>
                                    <span className={step.done ? 'text-gray-700 font-semibold' : 'text-tlb-yellow font-semibold'}>{step.label}</span>
                                </div>
                            ))}
                        </div>
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
                    <div className="bg-blue-50 px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-purple-400 shadow-lg">
                            <ShieldCheck size={36} className="text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-tlb-dark">Profile Under Review</h2>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Draft Saved</p>
                        </div>
                    </div>
                    <div className="px-6 py-5">
                        <p className="text-sm text-gray-500 leading-relaxed text-center">
                            {message || 'Your partner profile is currently under review. You can save drafts but cannot submit listings until the review is complete.'}
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
                        {message || 'Something went wrong while submitting your class. Please try again.'}
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
const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const titleCase = (s?: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

const fmtDays = (days: string[]) => {
    const map: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
    return (days || []).map(d => map[d] || d).join(', ');
};

export const CreateClassPreview: React.FC<Props> = ({ onNavigate }) => {
    const [draftId, setDraftId] = useState<string | null>(null);
    const [listing, setListing] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [modal, setModal] = useState<{ variant: ModalVariant; message?: string } | null>(null);

    useEffect(() => {
        const id = getCurrentClassDraftId();
        if (!id) {
            setLoadError('No active draft. Start from "Identity & Story".');
            setLoading(false);
            return;
        }
        setDraftId(id);
        (async () => {
            try {
                const res = await getClassListingDetail(id);
                setListing(res.data || res);
            } catch (err: any) {
                setLoadError(err?.message || 'Failed to load class.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const srv = listing?.service || {};
    const media: any[] = srv.media || listing?.media || [];
    const batches: any[] = srv.batches || listing?.batches || [];
    const cover = media.find(m => m.media_type === 'cover');
    const gallery = media.filter(m => m.media_type === 'gallery');
    const category = srv.category || listing?.category;
    const subcategory = srv.subcategory || listing?.subcategory;
    const mode = srv.mode || listing?.mode;

    const minAge = srv.min_age ?? listing?.min_age;
    const maxAge = srv.max_age ?? listing?.max_age;
    const tags: string[] = srv.tags || listing?.tags || [];

    const missing: string[] = [];
    if (listing) {
        if (!listing.title?.trim()) missing.push('Title');
        if (!(listing.description || listing.short_description)?.trim()) missing.push('Description');

        if (!cover) missing.push('Cover image');
        if (batches.length === 0) missing.push('At least one batch/schedule');
    }
    const canSubmit = !!listing && missing.length === 0 && listing.status === 'draft';

    const clsCity = srv.city || listing?.city;
    const clsArea = srv.area || listing?.area;
    const clsLoc = srv.location || listing?.location;
    const firstBatch = batches[0];
    const clsPrice = listing?.price ?? srv.price ?? listing?.fee ?? srv.fee;
    const langLine = listing ? formatLanguages((listing.languages ? listing : srv).languages, (listing.languages ? listing : srv).other_language) : '';
    const previewModel: AppListingPreviewModel | null = listing ? {
        typeLabel: 'Class',
        title: listing.title || '',
        coverUrl: cover ? resolveUrl(cover.url || cover.file_url) : undefined,
        gallery: gallery.map((g: any) => resolveUrl(g.url || g.file_url)),
        tags: [category?.name, subcategory?.name, ...tags].filter(Boolean) as string[],
        locationLine: mode === 'online' ? 'Online class' : ([clsArea, clsCity].filter(Boolean).join(', ') || clsLoc || undefined),
        address: mode === 'online' ? undefined : (clsLoc || [clsArea, clsCity].filter(Boolean).join(', ') || undefined),
        dateLine: firstBatch ? `${fmtDays(firstBatch.days || [])} · ${(firstBatch.start_time || '').slice(0, 5)}–${(firstBatch.end_time || '').slice(0, 5)}` : undefined,
        description: listing.description || listing.short_description || '',
        aboutTitle: 'About Class',
        facts: [
            langLine ? { icon: 'language', label: 'Language', value: langLine } : null,
            (minAge != null || maxAge != null) ? { icon: 'age', label: 'Age Group', value: `${minAge ?? '?'}–${maxAge ?? '?'} yrs` } : null,
            mode ? { icon: 'mode', label: 'Mode', value: titleCase(mode) } : null,
            batches.length ? { icon: 'schedule', label: 'Batches', value: `${batches.length} batch${batches.length > 1 ? 'es' : ''}` } : null,
        ].filter(Boolean) as PreviewFact[],
        priceLabel: clsPrice != null ? (Number(clsPrice) > 0 ? `₹${Number(clsPrice).toLocaleString()}` : 'Free') : '—',
        ctaLabel: 'Enquire Now',
    } : null;

    const handleSubmit = async () => {
        if (!draftId || !canSubmit) return;
        setSubmitting(true);
        try {
            await submitClassListing(draftId);
            clearCurrentClassDraftId();
            setModal({ variant: 'success' });
        } catch (err: any) {
            const code: string = err instanceof ApiError ? err.code : '';
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
        clearCurrentClassDraftId();
        onNavigate('SERVICE_LISTINGS');
    };

    if (loading) {
        return (
            <WizardLayout title="New Listing" stepText="Stage 5 of 5" subtitle="Preview & Publish" progressPercentage={100} themeColor="yellow" onBack={() => onNavigate('CREATE_CLASS_POLICIES')}>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading preview…
                </div>
            </WizardLayout>
        );
    }

    if (loadError || !listing) {
        return (
            <WizardLayout title="New Listing" stepText="Stage 5 of 5" subtitle="Preview & Publish" progressPercentage={100} themeColor="yellow" onBack={() => onNavigate('CREATE_CLASS_POLICIES')}>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-600">
                    {loadError || 'Could not load class.'}
                </div>
            </WizardLayout>
        );
    }

    return (
        <WizardLayout
            title="New Listing"
            stepText="Stage 5 of 5"
            subtitle="Preview & Publish"
            progressPercentage={100}
            themeColor="yellow"
            onBack={() => onNavigate('CREATE_CLASS_POLICIES')}
        >
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-black">Preview Your Listing</h2>
                <p className="text-sm text-gray-400">This is how parents will see your class. Review everything before publishing.</p>
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
            ) : listing.status === 'draft' ? (
                <div className="bg-tlb-yellow/10 border border-tlb-yellow/30 rounded-2xl p-4 flex items-center gap-2 text-tlb-yellow">
                    <CheckCircle2 size={16} />
                    <p className="text-xs font-black uppercase tracking-widest">Ready to submit for review</p>
                </div>
            ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-2 text-blue-700">
                    <CheckCircle2 size={16} />
                    <p className="text-xs font-black uppercase tracking-widest">
                        Class is {listing.status} — already submitted.
                    </p>
                </div>
            )}

            <WizardNavigation
                onBack={() => onNavigate('CREATE_CLASS_POLICIES')}
                onNext={canSubmit && !submitting ? handleSubmit : () => {
                    clearCurrentClassDraftId();
                    onNavigate('SERVICE_LISTINGS');
                }}
                nextText={submitting ? 'Submitting…' : canSubmit ? 'Submit for Review' : 'Back to Listings'}
                nextIcon={submitting ? <Loader2 size={20} className="animate-spin" /> : <Rocket size={20} />}
                themeColor="yellow"
            />

            {modal && <ResultModal variant={modal.variant} message={modal.message} onClose={handleModalClose} />}
        </WizardLayout>
    );
};
