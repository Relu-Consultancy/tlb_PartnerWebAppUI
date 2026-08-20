import React, { useState, useEffect } from 'react';
import { Eye, FileText, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, FaqTermsEditor, FaqApi, RefundPolicyToggle } from '../../components/ui';
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

const programFaqApi: FaqApi = {
    list: getProgramFaqs,
    create: createProgramFaq,
    update: updateProgramFaq,
    remove: deleteProgramFaq,
};

export const CreateProgramPolicies: React.FC<Props> = ({ onNavigate }) => {
    const draftId = getCurrentProgramDraftId();
    const [cancelPolicy, setCancelPolicy] = useState('');
    const [refundPolicy, setRefundPolicy] = useState('');
    // Backend treats an unset value as refundable.
    const [isRefundable, setIsRefundable] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!draftId) { setLoading(false); return; }
        (async () => {
            try {
                const res = await getProgramListingDetail(draftId);
                const d = res.data || res;
                // Per API 11.3, these may or may not exist at top level
                setCancelPolicy(d.cancellation_policy || '');
                setRefundPolicy(d.refund_policy || '');
                setIsRefundable(d.is_refundable !== false);
            } catch (e) {
                console.error('Failed to load program policies', e);
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleNext = async () => {
        if (saving) return;
        if (!draftId) { onNavigate('CREATE_PROGRAM_PREVIEW'); return; }
        setSaving(true);
        setError('');
        try {
            await updateProgramListing(draftId, {
                ...(cancelPolicy.trim() ? { cancellation_policy: cancelPolicy.trim() } : {}),
                ...(refundPolicy.trim() ? { refund_policy: refundPolicy.trim() } : {}),
                is_refundable: isRefundable,
            });
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

            <RefundPolicyToggle value={isRefundable} onChange={setIsRefundable} accent="emerald" />

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

            {draftId ? (
                <FaqTermsEditor listingId={draftId} faqApi={programFaqApi} accent="emerald" faqDocumentsEntity="programs" />
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm font-bold text-amber-700">
                    Please complete the earlier steps first so we can save your FAQs and terms.
                </div>
            )}

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
