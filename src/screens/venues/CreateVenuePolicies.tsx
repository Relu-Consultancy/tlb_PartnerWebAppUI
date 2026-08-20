import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, FaqTermsEditor, FaqApi, RefundPolicyToggle } from '../../components/ui';
import {
    getCurrentVenueDraftId, getVenueListingDetail, updateVenueListing,
    getVenueFaqs, createVenueFaq, updateVenueFaq, deleteVenueFaq,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar?: () => void; }

const venueFaqApi: FaqApi = {
    list: getVenueFaqs,
    create: createVenueFaq,
    update: updateVenueFaq,
    remove: deleteVenueFaq,
};

export const CreateVenuePolicies: React.FC<Props> = ({ onNavigate }) => {
    const draftId = getCurrentVenueDraftId();
    // Backend treats an unset value as refundable.
    const [isRefundable, setIsRefundable] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!draftId) return;
        (async () => {
            try {
                const res = await getVenueListingDetail(draftId);
                const d = res.data || res;
                setIsRefundable(d.is_refundable !== false);
            } catch (e) {
                console.warn('Could not load venue refund setting', e);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleNext = async () => {
        if (saving) return;
        if (!draftId) { onNavigate('CREATE_VENUE_PREVIEW'); return; }
        setSaving(true);
        setError('');
        try {
            await updateVenueListing(draftId, { is_refundable: isRefundable });
            onNavigate('CREATE_VENUE_PREVIEW');
        } catch (e: any) {
            setError(e?.message || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <WizardLayout
            title="New Venue Listing"
            stepText="Step 6 of 7"
            subtitle="FAQs & Terms"
            progressPercentage={86}
            themeColor="amber"
            onBack={() => onNavigate('CREATE_VENUE_AMENITIES')}
        >
            <div className="space-y-1 mb-6">
                <h2 className="text-2xl font-black">FAQs &amp; Terms</h2>
                <p className="text-sm text-gray-400">Help customers with answers and your booking policies. Both are optional.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs font-bold text-red-600 mb-4">
                    {error}
                </div>
            )}

            <div className="mb-8">
                <RefundPolicyToggle value={isRefundable} onChange={setIsRefundable} accent="amber" />
            </div>

            {draftId ? (
                <FaqTermsEditor listingId={draftId} faqApi={venueFaqApi} accent="amber" faqDocumentsEntity="venues" />
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm font-bold text-amber-700">
                    Please complete the earlier steps first so we can save your FAQs and terms.
                </div>
            )}

            <WizardNavigation
                onNext={handleNext}
                nextText={saving ? 'Saving…' : 'Next: Review'}
                nextIcon={saving ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                themeColor="amber"
            />
        </WizardLayout>
    );
};

export default CreateVenuePolicies;
