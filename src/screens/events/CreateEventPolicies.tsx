import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, FaqTermsEditor, FaqApi, RefundPolicyToggle } from '../../components/ui';
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
        <WizardLayout
            title="New Event Listing"
            stepText="Step 4 of 5"
            subtitle="FAQs & Terms"
            progressPercentage={80}
            themeColor="blue"
            onBack={() => onNavigate('CREATE_EVENT_MEDIA')}
        >
            <div className="space-y-1 mb-6">
                <h2 className="text-2xl font-black">FAQs &amp; Terms</h2>
                <p className="text-sm text-gray-400">Help customers with answers and your policies. Both are optional.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs font-bold text-red-600 mb-4">
                    {error}
                </div>
            )}

            <div className="mb-8">
                <RefundPolicyToggle value={isRefundable} onChange={setIsRefundable} accent="blue" />
            </div>

            {draftId ? (
                <FaqTermsEditor listingId={draftId} faqApi={eventFaqApi} accent="blue" faqDocumentsEntity="events" />
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm font-bold text-amber-700">
                    Please complete the earlier steps first so we can save your FAQs and terms.
                </div>
            )}

            <WizardNavigation
                onNext={handleNext}
                nextText={saving ? 'Saving…' : 'Next: Review'}
                nextIcon={saving ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                themeColor="blue"
            />
        </WizardLayout>
    );
};

export default CreateEventPolicies;
