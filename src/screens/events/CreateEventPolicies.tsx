import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, FaqTermsEditor, FaqApi } from '../../components/ui';
import {
    getCurrentDraftId,
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

            {draftId ? (
                <FaqTermsEditor listingId={draftId} faqApi={eventFaqApi} accent="blue" />
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm font-bold text-amber-700">
                    Please complete the earlier steps first so we can save your FAQs and terms.
                </div>
            )}

            <WizardNavigation
                onNext={() => onNavigate('CREATE_EVENT_PREVIEW')}
                nextText="Next: Review"
                nextIcon={<ArrowRight size={20} />}
                themeColor="blue"
            />
        </WizardLayout>
    );
};

export default CreateEventPolicies;
