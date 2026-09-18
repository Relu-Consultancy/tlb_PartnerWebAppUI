import React, { useState, useEffect } from 'react';
import { Rocket, Clock, Loader2, AlertCircle, CheckCircle2, ShieldCheck, BookOpen } from 'lucide-react';
import { Screen } from '../../types';
import { AppListingPreview, formatLanguages } from '../../components/ui';
import type { AppListingPreviewModel, PreviewFact } from '../../components/ui';
import { WizardShell, WizardNav } from '../../components/portal/wizard';
import {
    getProgramListingDetail,
    submitProgramListing,
    getCurrentProgramDraftId,
    clearCurrentProgramDraftId,
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
                <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border-2 border-emerald-400">
                    <div className="bg-emerald-50 px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-emerald-300/40 animate-ping" />
                            <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-emerald-400 shadow-lg">
                                <BookOpen size={36} className="text-emerald-500" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-tlb-dark">Program Under Review</h2>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Pending Admin Approval</p>
                        </div>
                    </div>
                    <div className="px-6 pt-5 pb-4">
                        <p className="text-sm text-gray-500 leading-relaxed text-center">
                            Your program has been submitted and is being reviewed by the TLB team.
                        </p>
                    </div>
                    <div className="px-6 pb-4">
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
                            {[
                                { done: true,  label: 'Draft created & saved' },
                                { done: true,  label: 'Submitted for admin review' },
                                { done: false, label: 'Admin approves → program goes live' },
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-emerald-500' : 'bg-emerald-100 border-2 border-emerald-300'}`}>
                                        {step.done
                                            ? <CheckCircle2 size={12} className="text-white" />
                                            : <Clock size={9} className="text-emerald-500" />}
                                    </div>
                                    <span className={step.done ? 'text-gray-700 font-semibold' : 'text-emerald-600 font-semibold'}>{step.label}</span>
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
                            {message || 'Your partner profile is currently under review. You can save drafts but cannot submit programs until the review is complete.'}
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
                        {message || 'Something went wrong while submitting your program. Please try again.'}
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
    const map: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
    return (days || []).map(d => map[d] || d).join(', ');
};

export const CreateProgramPreview: React.FC<Props> = ({ onNavigate }) => {
    const [draftId, setDraftId] = useState<string | null>(null);
    const [program, setProgram] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [modal, setModal] = useState<{ variant: ModalVariant; message?: string } | null>(null);

    useEffect(() => {
        const id = getCurrentProgramDraftId();
        if (!id) {
            setLoadError('No active draft. Start from "Identity & story".');
            setLoading(false);
            return;
        }
        setDraftId(id);
        (async () => {
            try {
                const res = await getProgramListingDetail(id);
                setProgram(res.data || res);
            } catch (err: any) {
                setLoadError(err?.message || 'Failed to load program.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Per API 11.3, program detail returns fields at top level — no service nesting
    const media: any[] = program?.media || [];
    const batches: any[] = program?.batches || [];
    const cover = media.find(m => m.media_type === 'cover');
    const gallery = media.filter(m => m.media_type === 'gallery');
    const category = program?.category;
    const subcategory = program?.subcategory;
    const deliveryMode = program?.delivery_mode;
    const programFormat = program?.program_format;
    const minAge = program?.min_age;
    const maxAge = program?.max_age;
    const rawTags: any[] = program?.tags || [];
    const tags: string[] = rawTags.map((t: any) => typeof t === 'object' ? t.name : t);

    const missing: string[] = [];
    if (program) {
        if (!program.title?.trim()) missing.push('Title');
        if (!(program.description || program.short_description)?.trim()) missing.push('Description');
        if (!cover) missing.push('Cover image');
    }
    // API 11.5: submit allowed for draft or rejected
    const canSubmit = !!program && missing.length === 0 && (program.status === 'draft' || program.status === 'rejected');

    const pgCity = program?.city;
    const pgArea = program?.area;
    const pgLoc = program?.location;
    const firstPgBatch = batches[0];
    const pgPrice = program?.price ?? program?.fee;
    const langLine = program ? formatLanguages(program.languages, program.other_language) : '';
    const previewModel: AppListingPreviewModel | null = program ? {
        typeLabel: 'Program',
        title: program.title || '',
        coverUrl: cover ? resolveUrl(cover.url || cover.file_url) : undefined,
        gallery: gallery.map((g: any) => resolveUrl(g.url || g.file_url)),
        tags: [category?.name, subcategory?.name, ...tags].filter(Boolean) as string[],
        locationLine: deliveryMode === 'online' ? 'Online program' : ([pgArea, pgCity].filter(Boolean).join(', ') || pgLoc || undefined),
        address: deliveryMode === 'online' ? undefined : (pgLoc || [pgArea, pgCity].filter(Boolean).join(', ') || undefined),
        dateLine: firstPgBatch ? `${fmtDays(firstPgBatch.days || [])} · ${(firstPgBatch.start_time || '').slice(0, 5)}–${(firstPgBatch.end_time || '').slice(0, 5)}` : undefined,
        description: program.description || program.short_description || '',
        aboutTitle: 'About Program',
        facts: [
            langLine ? { icon: 'language', label: 'Language', value: langLine } : null,
            (minAge != null || maxAge != null) ? { icon: 'age', label: 'Age Group', value: `${minAge ?? '?'}–${maxAge ?? '?'} yrs` } : null,
            programFormat ? { icon: 'format', label: 'Format', value: titleCase(programFormat) } : null,
            deliveryMode ? { icon: 'mode', label: 'Mode', value: titleCase(deliveryMode) } : null,
            batches.length ? { icon: 'schedule', label: 'Batches', value: `${batches.length} batch${batches.length > 1 ? 'es' : ''}` } : null,
        ].filter(Boolean) as PreviewFact[],
        priceLabel: pgPrice != null ? (Number(pgPrice) > 0 ? `₹${Number(pgPrice).toLocaleString()}` : 'Free') : '—',
        ctaLabel: 'Enquire Now',
    } : null;

    const handleSubmit = async () => {
        if (!draftId || !canSubmit) return;
        setSubmitting(true);
        try {
            await submitProgramListing(draftId);
            clearCurrentProgramDraftId();
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
        clearCurrentProgramDraftId();
        onNavigate('SERVICE_LISTINGS');
    };

    if (loading) {
        return (
            <WizardShell title="New program" entityType="Programs" step={5} totalSteps={5} stepLabel="Preview & publish" onBack={() => onNavigate('CREATE_PROGRAM_POLICIES')}>
                <div className="pt-card p-5 sm:p-6 flex items-center justify-center gap-2 text-tlb-muted text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading preview…
                </div>
            </WizardShell>
        );
    }

    if (loadError || !program) {
        return (
            <WizardShell title="New program" entityType="Programs" step={5} totalSteps={5} stepLabel="Preview & publish" onBack={() => onNavigate('CREATE_PROGRAM_POLICIES')}>
                <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{loadError || 'Could not load program.'}</div>
            </WizardShell>
        );
    }

    return (
        <WizardShell title="New program" entityType="Programs" step={5} totalSteps={5} stepLabel="Preview & publish" onBack={() => onNavigate('CREATE_PROGRAM_POLICIES')}>
            <div className="pt-card p-5 sm:p-6 flex flex-col gap-5">
                <div className="text-center">
                    <h2 className="pt-h-sec">Preview your program</h2>
                    <p className="text-[13px] text-tlb-sub mt-0.5">Review everything before submitting for approval.</p>
                </div>

                {previewModel && <AppListingPreview model={previewModel} listingId={draftId || undefined} />}

                {/* Submission readiness */}
                {missing.length > 0 ? (
                    <div className="pt-note bg-tlb-amber-soft text-tlb-gold flex-col items-start gap-2">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={15} strokeWidth={2.75} />
                            <p className="pt-eyebrow !text-tlb-gold">Missing for submission</p>
                        </div>
                        <ul className="text-xs list-disc pl-5 space-y-0.5">
                            {missing.map(m => <li key={m}>{m}</li>)}
                        </ul>
                    </div>
                ) : (program.status === 'draft' || program.status === 'rejected') ? (
                    <div className="pt-note bg-tlb-green-soft text-tlb-green">
                        <CheckCircle2 size={15} strokeWidth={2.75} />
                        <p className="pt-eyebrow !text-tlb-green">Ready to submit for review</p>
                    </div>
                ) : (
                    <div className="pt-note bg-tlb-blue-soft text-tlb-blue">
                        <CheckCircle2 size={15} strokeWidth={2.75} />
                        <p className="pt-eyebrow !text-tlb-blue">Program is {program.status} — already submitted.</p>
                    </div>
                )}

                <WizardNav
                    onBack={() => onNavigate('CREATE_PROGRAM_POLICIES')}
                    onNext={canSubmit && !submitting ? handleSubmit : () => {
                        // If already submitted, navigate back to listings
                        clearCurrentProgramDraftId();
                        onNavigate('SERVICE_LISTINGS');
                    }}
                    nextText={submitting ? 'Submitting…' : canSubmit ? 'Submit for review' : 'Back to listings'}
                    nextIcon={submitting ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} strokeWidth={2.75} />}
                />
            </div>

            {modal && <ResultModal variant={modal.variant} message={modal.message} onClose={handleModalClose} />}
        </WizardShell>
    );
};
