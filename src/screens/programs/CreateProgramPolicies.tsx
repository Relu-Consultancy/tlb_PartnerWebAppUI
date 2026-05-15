import React, { useState, useEffect, useRef } from 'react';
import { Eye, Plus, Trash2, HelpCircle, FileText, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';
import {
    getCurrentProgramDraftId,
    getProgramListingDetail,
    updateProgramListing,
    getProgramFaqs,
    createProgramFaq,
    updateProgramFaq,
    deleteProgramFaq,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface LocalFaq {
    apiId?: number;
    key: number;
    question: string;
    answer: string;
    isDirty: boolean;
}

let nextKey = 1;
const blankFaq = (): LocalFaq => ({ key: nextKey++, question: '', answer: '', isDirty: true });

export const CreateProgramPolicies: React.FC<Props> = ({ onNavigate }) => {
    const [cancelPolicy, setCancelPolicy] = useState('');
    const [refundPolicy, setRefundPolicy] = useState('');
    const [faqs, setFaqs] = useState<LocalFaq[]>([blankFaq()]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const deletedFaqIds = useRef<number[]>([]);

    useEffect(() => {
        const id = getCurrentProgramDraftId();
        if (!id) { setLoading(false); return; }
        (async () => {
            try {
                const [detailRes, faqsRes] = await Promise.allSettled([
                    getProgramListingDetail(id),
                    getProgramFaqs(id),
                ]);
                if (detailRes.status === 'fulfilled') {
                    const d = detailRes.value.data || detailRes.value;
                    // Per API 11.3, these may or may not exist at top level
                    setCancelPolicy(d.cancellation_policy || '');
                    setRefundPolicy(d.refund_policy || '');
                }
                if (faqsRes.status === 'fulfilled') {
                    const raw = faqsRes.value.data || faqsRes.value;
                    const list: any[] = Array.isArray(raw) ? raw : [];
                    if (list.length > 0) {
                        setFaqs(list.map((f: any) => ({
                            apiId: f.id,
                            key: nextKey++,
                            question: f.question || '',
                            answer: f.answer || '',
                            isDirty: false,
                        })));
                    }
                }
            } catch (e) {
                console.error('Failed to load program policies', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const updateFaq = (key: number, patch: Partial<LocalFaq>) =>
        setFaqs(prev => prev.map(f => f.key === key ? { ...f, ...patch, isDirty: true } : f));

    const removeFaq = (key: number) => {
        const faq = faqs.find(f => f.key === key);
        if (faq?.apiId) deletedFaqIds.current.push(faq.apiId);
        setFaqs(prev => prev.filter(f => f.key !== key));
    };

    const handleNext = async () => {
        if (saving) return;
        const draftId = getCurrentProgramDraftId();
        if (!draftId) { onNavigate('CREATE_PROGRAM_PREVIEW'); return; }
        setSaving(true);
        setError('');
        try {
            await updateProgramListing(draftId, {
                ...(cancelPolicy.trim() ? { cancellation_policy: cancelPolicy.trim() } : {}),
                ...(refundPolicy.trim() ? { refund_policy: refundPolicy.trim() } : {}),
            });
            for (const id of deletedFaqIds.current) {
                await deleteProgramFaq(draftId, id);
            }
            deletedFaqIds.current = [];
            for (const faq of faqs) {
                if (!faq.isDirty || !faq.question.trim()) continue;
                if (faq.apiId) {
                    await updateProgramFaq(draftId, faq.apiId, {
                        question: faq.question.trim(),
                        answer: faq.answer.trim(),
                    });
                } else {
                    await createProgramFaq(draftId, {
                        question: faq.question.trim(),
                        answer: faq.answer.trim(),
                    });
                }
            }
            onNavigate('CREATE_PROGRAM_PREVIEW');
        } catch (e: any) {
            setError(e?.message || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <WizardLayout
                title="New Program"
                stepText="Stage 4 of 5"
                subtitle="Policies & FAQs"
                progressPercentage={80}
                themeColor="emerald"
                onBack={() => onNavigate('CREATE_PROGRAM_MEDIA')}
            >
                <div className="flex justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-emerald-500" />
                </div>
            </WizardLayout>
        );
    }

    return (
        <WizardLayout
            title="New Program"
            stepText="Stage 4 of 5"
            subtitle="Policies & FAQs"
            progressPercentage={80}
            themeColor="emerald"
            onBack={() => onNavigate('CREATE_PROGRAM_MEDIA')}
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Policies & FAQs</h2>
                <p className="text-sm text-gray-400">Set clear expectations and answer common questions.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs font-bold text-red-600">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <FileText size={12} /> Cancellation Policy
                    </label>
                    <textarea
                        className="tlb-input w-full min-h-[100px] resize-y"
                        placeholder="e.g. Cancellations must be made 24 hours in advance for a full refund..."
                        value={cancelPolicy}
                        onChange={(e) => setCancelPolicy(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <FileText size={12} /> Refund Policy
                    </label>
                    <textarea
                        className="tlb-input w-full min-h-[100px] resize-y"
                        placeholder="e.g. No refunds after the first session. Prorated refunds available for medical reasons..."
                        value={refundPolicy}
                        onChange={(e) => setRefundPolicy(e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <HelpCircle size={12} /> Frequently Asked Questions
                </label>
                <div className="space-y-3">
                    {faqs.map((faq, idx) => (
                        <div key={faq.key} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">FAQ {idx + 1}</p>
                                {faqs.length > 1 && (
                                    <button onClick={() => removeFaq(faq.key)} className="text-red-400 hover:text-red-600 p-1">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <input
                                className="tlb-input w-full"
                                placeholder="Question"
                                value={faq.question}
                                onChange={(e) => updateFaq(faq.key, { question: e.target.value })}
                            />
                            <textarea
                                className="tlb-input w-full min-h-[60px] resize-y"
                                placeholder="Answer"
                                value={faq.answer}
                                onChange={(e) => updateFaq(faq.key, { answer: e.target.value })}
                            />
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => setFaqs(prev => [...prev, blankFaq()])}
                    className="w-full mt-3 py-2.5 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold text-gray-400 flex items-center justify-center gap-2 hover:border-emerald-300 hover:text-emerald-500 transition-colors"
                >
                    <Plus size={16} /> Add Question
                </button>
            </div>

            <WizardNavigation
                onBack={() => onNavigate('CREATE_PROGRAM_MEDIA')}
                onNext={handleNext}
                nextText={saving ? 'Saving...' : 'Preview & Finish'}
                nextIcon={saving ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
                themeColor="emerald"
            />
        </WizardLayout>
    );
};
