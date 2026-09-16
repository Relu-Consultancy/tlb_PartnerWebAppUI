import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { FaqTermsEditor, FaqApi, RefundPolicyToggle } from '../../components/ui';
import { WizardShell, WizardNav } from '../../components/portal/wizard';
import {
    getCurrentDraftId, getListingDetail, updateListing,
    getEventFaqs, createEventFaq, updateEventFaq, deleteEventFaq,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar?: () => void; }

const eventFaqApi: FaqApi = {
    list: getEventFaqs,
    create: createEventFaq,
    update: updateEventFaq,
    remove: deleteEventFaq,
};

export const CreateEventPolicies: React.FC<Props> = ({ onNavigate }) => {
    const draftId = getCurrentDraftId();
    // Backend treats an unset value as refundable.
    const [isRefundable, setIsRefundable] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!draftId) return;
        (async () => {
            try {
                const res = await getListingDetail(draftId);
                const d = res.data || res;
                setIsRefundable(d.is_refundable !== false);
            } catch (e) {
                console.warn('Could not load event refund setting', e);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleNext = async () => {
        if (saving) return;
        if (!draftId) { onNavigate('CREATE_EVENT_PREVIEW'); return; }
        setSaving(true);
        setError('');
        try {
            await updateListing(draftId, { is_refundable: isRefundable });
            onNavigate('CREATE_EVENT_PREVIEW');
        } catch (e: any) {
            setError(e?.message || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <WizardShell title="New event" entityType="Events" step={4} totalSteps={5} stepLabel="FAQs & terms" onBack={() => onNavigate('CREATE_EVENT_MEDIA')}>
            <div className="pt-card p-5 sm:p-6 flex flex-col gap-6">
                <div>
                    <h2 className="pt-h-sec">FAQs &amp; terms</h2>
                    <p className="text-[13px] text-tlb-sub mt-0.5">Help customers with answers and your policies. Both are optional.</p>
                </div>

                {error && <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{error}</div>}

                <RefundPolicyToggle value={isRefundable} onChange={setIsRefundable} />

                {draftId ? (
                    <FaqTermsEditor listingId={draftId} faqApi={eventFaqApi} faqDocumentsEntity="events" />
                ) : (
                    <div className="pt-note bg-tlb-amber-soft text-tlb-gold">
                        Please complete the earlier steps first so we can save your FAQs and terms.
                    </div>
                )}

                <WizardNav
                    onNext={handleNext}
                    nextText={saving ? 'Saving…' : 'Next: Review'}
                    nextIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} strokeWidth={2.75} />}
                />
            </div>
        </WizardShell>
    );
};

export default CreateEventPolicies;
