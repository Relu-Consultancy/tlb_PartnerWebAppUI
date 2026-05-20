import React, { useState, useEffect } from 'react';
import { Eye, Plus, Trash2, HelpCircle, FileText, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, Loader } from '../../components/ui';
import {
    getCurrentClassDraftId,
    getClassListingDetail,
    updateClassListing,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface LocalFaq { key: number; question: string; answer: string; }

let nextKey = 1;
const blankFaq = (): LocalFaq => ({ key: nextKey++, question: '', answer: '' });

export const CreateClassPolicies: React.FC<Props> = ({ onNavigate }) => {
    const [cancelPolicy, setCancelPolicy] = useState('');
    const [refundPolicy, setRefundPolicy] = useState('');
    const [faqs, setFaqs] = useState<LocalFaq[]>([blankFaq()]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const id = getCurrentClassDraftId();
        if (!id) { setLoading(false); return; }
        (async () => {
            try {
                const res = await getClassListingDetail(id);
                const d = res.data || res;
                const srv = d.service || {};
                // service-specific fields live under .service per API 10.3
                setCancelPolicy(srv.cancellation_policy || d.cancellation_policy || '');
                setRefundPolicy(srv.refund_policy || d.refund_policy || '');
                const existing: { question: string; answer: string }[] = srv.faqs || d.faqs || [];
                if (existing.length > 0) {
                    setFaqs(existing.map(f => ({ key: nextKey++, question: f.question, answer: f.answer })));
                }
            } catch (e) {
                console.error('Failed to load class policies', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const updateFaq = (key: number, field: 'question' | 'answer', value: string) =>
        setFaqs(prev => prev.map(f => f.key === key ? { ...f, [field]: value } : f));

    const removeFaq = (key: number) => {
        if (faqs.length > 1) setFaqs(prev => prev.filter(f => f.key !== key));
    };

    const handleNext = async () => {
        if (saving) return;
        const draftId = getCurrentClassDraftId();
        if (!draftId) { onNavigate('CREATE_CLASS_PREVIEW'); return; }
        setSaving(true);
        setError('');
        try {
            const validFaqs = faqs
                .filter(f => f.question.trim())
                .map(f => ({ question: f.question.trim(), answer: f.answer.trim() }));

            await updateClassListing(draftId, {
                ...(cancelPolicy.trim() ? { cancellation_policy: cancelPolicy.trim() } : {}),
                ...(refundPolicy.trim() ? { refund_policy: refundPolicy.trim() } : {}),
                faqs: validFaqs,
            });
            onNavigate('CREATE_CLASS_PREVIEW');
        } catch (e: any) {
            setError(e?.message || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <WizardLayout
                title="New Listing"
                stepText="Stage 4 of 5"
                subtitle="Entry Path & Policies"
                progressPercentage={80}
                themeColor="yellow"
                onBack={() => onNavigate('CREATE_CLASS_MEDIA')}
            >
                <div className="flex justify-center py-12">
                    <Loader />
                </div>
            </WizardLayout>
        );
    }

    return (
        <WizardLayout
            title="New Listing"
            stepText="Stage 4 of 5"
            subtitle="Entry Path & Policies"
            progressPercentage={80}
            themeColor="yellow"
            onBack={() => onNavigate('CREATE_CLASS_MEDIA')}
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Entry Path & Policies</h2>
                <p className="text-sm text-gray-400">Lower the barrier to entry and set clear rules for parents.</p>
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
                        placeholder="e.g. No refunds after the first class. Prorated refunds available for medical reasons..."
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
                                <p className="text-[10px] font-black text-tlb-yellow uppercase tracking-widest">FAQ {idx + 1}</p>
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
                                onChange={(e) => updateFaq(faq.key, 'question', e.target.value)}
                            />
                            <textarea
                                className="tlb-input w-full min-h-[60px] resize-y"
                                placeholder="Answer"
                                value={faq.answer}
                                onChange={(e) => updateFaq(faq.key, 'answer', e.target.value)}
                            />
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => setFaqs(prev => [...prev, blankFaq()])}
                    className="w-full mt-3 py-2.5 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold text-gray-400 flex items-center justify-center gap-2 hover:border-tlb-yellow/30 hover:text-tlb-yellow transition-colors"
                >
                    <Plus size={16} /> Add Question
                </button>
            </div>

            <WizardNavigation
                onBack={() => onNavigate('CREATE_CLASS_MEDIA')}
                onNext={handleNext}
                nextText={saving ? 'Saving...' : 'Preview & Finish'}
                nextIcon={saving ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
                themeColor="yellow"
            />
        </WizardLayout>
    );
};
