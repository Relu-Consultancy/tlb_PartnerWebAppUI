import React, { useState, useEffect } from 'react';
import { Edit3, Rocket, Clock, Users, MapPin, Loader2, AlertCircle, CheckCircle2, ShieldCheck, BookOpen } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';
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
            setLoadError('No active draft. Start from "Identity & Story".');
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
            <WizardLayout title="New Program" stepText="Stage 5 of 5" subtitle="Preview & Publish" progressPercentage={100} themeColor="emerald" onBack={() => onNavigate('CREATE_PROGRAM_POLICIES')}>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading preview…
                </div>
            </WizardLayout>
        );
    }

    if (loadError || !program) {
        return (
            <WizardLayout title="New Program" stepText="Stage 5 of 5" subtitle="Preview & Publish" progressPercentage={100} themeColor="emerald" onBack={() => onNavigate('CREATE_PROGRAM_POLICIES')}>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-600">
                    {loadError || 'Could not load program.'}
                </div>
            </WizardLayout>
        );
    }

    return (
        <WizardLayout
            title="New Program"
            stepText="Stage 5 of 5"
            subtitle="Preview & Publish"
            progressPercentage={100}
            themeColor="emerald"
            onBack={() => onNavigate('CREATE_PROGRAM_POLICIES')}
        >
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-black">Preview Your Program</h2>
                <p className="text-sm text-gray-400">Review everything before submitting for approval.</p>
            </div>

            {/* Program Card */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 overflow-hidden shadow-xl max-w-md mx-auto">
                {/* Cover */}
                <div className="h-52 relative bg-gray-100">
                    {cover ? (
                        <img
                            src={resolveUrl(cover.url || cover.file_url)}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                            <BookOpen size={32} />
                            <span className="text-xs font-bold mt-2">No cover image</span>
                        </div>
                    )}
                    <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                        <BookOpen size={10} /> Program
                    </div>
                    <div className={`absolute top-3 right-3 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                        program.status === 'draft' ? 'bg-gray-500' :
                        program.status === 'under_review' ? 'bg-amber-500' :
                        program.status === 'published' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}>
                        {program.status}
                    </div>
                    <button
                        onClick={() => onNavigate('CREATE_PROGRAM_MEDIA')}
                        className="absolute bottom-3 right-3 bg-white/90 p-2 rounded-xl shadow text-gray-600 hover:bg-white"
                        aria-label="Edit media"
                    >
                        <Edit3 size={14} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Title & Category */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-xl font-black">{program.title || 'Untitled Program'}</h3>
                            {(category || subcategory) && (
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">
                                    {category?.name || ''}{subcategory ? ` › ${subcategory.name}` : ''}
                                </p>
                            )}
                        </div>
                        <button onClick={() => onNavigate('CREATE_PROGRAM_IDENTITY')} className="text-gray-400 hover:text-emerald-500 p-1">
                            <Edit3 size={14} />
                        </button>
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {tags.map((t: string) => (
                                <span key={t} className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full">{t}</span>
                            ))}
                        </div>
                    )}

                    {/* Age & Mode */}
                    <div className="flex flex-wrap gap-3">
                        {(minAge != null || maxAge != null) && (
                            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                                <Users size={12} />
                                Ages {minAge != null ? minAge : '?'}–{maxAge != null ? maxAge : '?'}
                            </div>
                        )}
                        {deliveryMode && (
                            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                                <MapPin size={12} /> {titleCase(deliveryMode)}
                            </div>
                        )}
                        {programFormat && (
                            <div className="flex items-center gap-1.5 bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                                {titleCase(programFormat)}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {(program.description || program.short_description) && (
                        <div className="relative">
                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
                                {program.description || program.short_description}
                            </p>
                            <button onClick={() => onNavigate('CREATE_PROGRAM_IDENTITY')} className="absolute -top-1 -right-1 text-gray-400 hover:text-emerald-500 p-1">
                                <Edit3 size={12} />
                            </button>
                        </div>
                    )}

                    {/* Batches */}
                    {batches.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Schedule</p>
                                <button onClick={() => onNavigate('CREATE_PROGRAM_BATCH')} className="text-gray-400 hover:text-emerald-500 p-1">
                                    <Edit3 size={12} />
                                </button>
                            </div>
                            {batches.map((b: any) => (
                                <div key={b.id} className="bg-gray-50 rounded-xl px-4 py-3 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-500"><Clock size={14} /></div>
                                            <div>
                                                <p className="text-sm font-bold">{b.name || 'Unnamed Batch'}</p>
                                                <p className="text-[11px] text-gray-400">
                                                    {fmtDays(b.days_of_week || [])} · {(b.start_time || '').slice(0, 5)}–{(b.end_time || '').slice(0, 5)}
                                                </p>
                                            </div>
                                        </div>
                                        {b.total_seats != null && (
                                            <span className="text-[10px] font-bold text-emerald-500">{b.total_seats} seats</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] text-gray-400 pl-9">
                                        {b.start_date && <span>{b.start_date} → {b.end_date}</span>}
                                        {b.fee != null && <span className="font-bold text-gray-600">₹{b.fee}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Gallery */}
                    {gallery.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Gallery</p>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {gallery.map((g: any) => (
                                    <img
                                        key={g.id}
                                        src={resolveUrl(g.url || g.file_url)}
                                        alt=""
                                        className="w-20 h-20 rounded-xl object-cover shrink-0"
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
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
            ) : (program.status === 'draft' || program.status === 'rejected') ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 size={16} />
                    <p className="text-xs font-black uppercase tracking-widest">Ready to submit for review</p>
                </div>
            ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-2 text-blue-700">
                    <CheckCircle2 size={16} />
                    <p className="text-xs font-black uppercase tracking-widest">
                        Program is {program.status} — already submitted.
                    </p>
                </div>
            )}

            <WizardNavigation
                onBack={() => onNavigate('CREATE_PROGRAM_POLICIES')}
                onNext={canSubmit && !submitting ? handleSubmit : () => {
                    // If already submitted, navigate back to listings
                    clearCurrentProgramDraftId();
                    onNavigate('SERVICE_LISTINGS');
                }}
                nextText={submitting ? 'Submitting…' : canSubmit ? 'Submit for Review' : 'Back to Listings'}
                nextIcon={submitting ? <Loader2 size={20} className="animate-spin" /> : <Rocket size={20} />}
                themeColor="emerald"
            />

            {modal && <ResultModal variant={modal.variant} message={modal.message} onClose={handleModalClose} />}
        </WizardLayout>
    );
};
