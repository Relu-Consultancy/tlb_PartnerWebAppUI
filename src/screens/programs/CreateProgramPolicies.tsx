import React, { useState, useEffect } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { FaqTermsEditor, FaqApi, RefundPolicyToggle } from '../../components/ui';
import { WizardShell, WizardNav, WizardField } from '../../components/portal/wizard';
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
            <WizardShell title="New program" entityType="Programs" step={4} totalSteps={5} stepLabel="Policies & FAQs" onBack={() => onNavigate('CREATE_PROGRAM_MEDIA')}>
                <div className="pt-card p-5 sm:p-6 flex items-center justify-center gap-2 text-tlb-muted text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                </div>
            </WizardShell>
        );
    }

    return (
        <WizardShell title="New program" entityType="Programs" step={4} totalSteps={5} stepLabel="Policies & FAQs" onBack={() => onNavigate('CREATE_PROGRAM_MEDIA')}>
            <div className="pt-card p-5 sm:p-6 flex flex-col gap-6">
                <div>
                    <h2 className="pt-h-sec">Policies &amp; FAQs</h2>
                    <p className="text-[13px] text-tlb-sub mt-0.5">Set clear expectations and answer common questions.</p>
                </div>

                {error && <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{error}</div>}

                <RefundPolicyToggle value={isRefundable} onChange={setIsRefundable} />

                <div className="flex flex-col gap-4">
                    <WizardField label="Cancellation policy">
                        <textarea
                            className="pt-input min-h-[100px]"
                            placeholder="e.g. Cancellations must be made 24 hours in advance for a full refund..."
                            value={cancelPolicy}
                            onChange={(e) => setCancelPolicy(e.target.value)}
                        />
                    </WizardField>
                    <WizardField label="Refund policy">
                        <textarea
                            className="pt-input min-h-[100px]"
                            placeholder="e.g. No refunds after the first session. Prorated refunds available for medical reasons..."
                            value={refundPolicy}
                            onChange={(e) => setRefundPolicy(e.target.value)}
                        />
                    </WizardField>
                </div>

                {draftId ? (
                    <FaqTermsEditor listingId={draftId} faqApi={programFaqApi} faqDocumentsEntity="programs" />
                ) : (
                    <div className="pt-note bg-tlb-amber-soft text-tlb-gold">
                        Please complete the earlier steps first so we can save your FAQs and terms.
                    </div>
                )}

                <WizardNav
                    onNext={handleNext}
                    nextText={saving ? 'Saving…' : 'Preview & finish'}
                    nextIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} strokeWidth={2.75} />}
                />
            </div>
        </WizardShell>
    );
};

export default CreateProgramPolicies;
