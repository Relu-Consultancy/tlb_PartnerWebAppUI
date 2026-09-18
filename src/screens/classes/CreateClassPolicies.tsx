import React, { useState, useEffect } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { SkeletonList, FaqTermsEditor, FaqApi, RefundPolicyToggle } from '../../components/ui';
import { WizardShell, WizardNav, WizardField } from '../../components/portal/wizard';
import {
    getCurrentClassDraftId,
    getClassListingDetail,
    updateClassListing,
    getClassFaqs,
    createClassFaq,
    updateClassFaq,
    deleteClassFaq,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

const classFaqApi: FaqApi = {
    list: getClassFaqs,
    create: createClassFaq,
    update: updateClassFaq,
    remove: deleteClassFaq,
};

export const CreateClassPolicies: React.FC<Props> = ({ onNavigate }) => {
    const draftId = getCurrentClassDraftId();
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
                const res = await getClassListingDetail(draftId);
                const d = res.data || res;
                const srv = d.service || {};
                // service-specific fields live under .service per API 10.3
                setCancelPolicy(srv.cancellation_policy || d.cancellation_policy || '');
                setRefundPolicy(srv.refund_policy || d.refund_policy || '');
                setIsRefundable((srv.is_refundable ?? d.is_refundable) !== false);
            } catch (e) {
                console.error('Failed to load class policies', e);
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleNext = async () => {
        if (saving) return;
        if (!draftId) { onNavigate('CREATE_CLASS_PREVIEW'); return; }
        setSaving(true);
        setError('');
        try {
            await updateClassListing(draftId, {
                ...(cancelPolicy.trim() ? { cancellation_policy: cancelPolicy.trim() } : {}),
                ...(refundPolicy.trim() ? { refund_policy: refundPolicy.trim() } : {}),
                is_refundable: isRefundable,
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
            <WizardShell title="New class" entityType="Classes" step={4} totalSteps={5} stepLabel="FAQs & terms" onBack={() => onNavigate('CREATE_CLASS_MEDIA')}>
                <div className="pt-card p-5 sm:p-6 flex flex-col gap-5">
                    <SkeletonList rows={3} className="py-2" />
                </div>
            </WizardShell>
        );
    }

    return (
        <WizardShell title="New class" entityType="Classes" step={4} totalSteps={5} stepLabel="FAQs & terms" onBack={() => onNavigate('CREATE_CLASS_MEDIA')}>
            <div className="pt-card p-5 sm:p-6 flex flex-col gap-6">
                <div>
                    <h2 className="pt-h-sec">Entry path &amp; policies</h2>
                    <p className="text-[13px] text-tlb-sub mt-0.5">Lower the barrier to entry and set clear rules for parents.</p>
                </div>

                {error && <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{error}</div>}

                <RefundPolicyToggle value={isRefundable} onChange={setIsRefundable} />

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
                        placeholder="e.g. No refunds after the first class. Prorated refunds available for medical reasons..."
                        value={refundPolicy}
                        onChange={(e) => setRefundPolicy(e.target.value)}
                    />
                </WizardField>

                {draftId ? (
                    <FaqTermsEditor listingId={draftId} faqApi={classFaqApi} faqDocumentsEntity="classes" />
                ) : (
                    <div className="pt-note bg-tlb-amber-soft text-tlb-gold">
                        Please complete the earlier steps first so we can save your FAQs and terms.
                    </div>
                )}

                <WizardNav
                    onBack={() => onNavigate('CREATE_CLASS_MEDIA')}
                    onNext={handleNext}
                    nextText={saving ? 'Saving…' : 'Preview & finish'}
                    nextIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} strokeWidth={2.75} />}
                />
            </div>
        </WizardShell>
    );
};
