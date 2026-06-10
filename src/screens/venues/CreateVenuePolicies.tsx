import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, FaqTermsEditor, FaqApi } from '../../components/ui';
import {
    getCurrentVenueDraftId,
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

    return (
        <WizardLayout
            title="New Venue Listing"
            stepText="Step 5 of 6"
            subtitle="FAQs & Terms"
            progressPercentage={83}
            themeColor="amber"
            onBack={() => onNavigate('CREATE_VENUE_PACKAGES')}
        >
            <div className="space-y-1 mb-6">
                <h2 className="text-2xl font-black">FAQs &amp; Terms</h2>
                <p className="text-sm text-gray-400">Help customers with answers and your booking policies. Both are optional.</p>
            </div>

            {draftId ? (
                <FaqTermsEditor listingId={draftId} faqApi={venueFaqApi} accent="amber" />
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm font-bold text-amber-700">
                    Please complete the earlier steps first so we can save your FAQs and terms.
                </div>
            )}

            <WizardNavigation
                onNext={() => onNavigate('CREATE_VENUE_PREVIEW')}
                nextText="Next: Review"
                nextIcon={<ArrowRight size={20} />}
                themeColor="amber"
            />
        </WizardLayout>
    );
};

export default CreateVenuePolicies;
