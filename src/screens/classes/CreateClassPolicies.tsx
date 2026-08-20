import React, { useState, useEffect } from 'react';
import { Eye, FileText, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, SkeletonList, FaqTermsEditor, FaqApi, RefundPolicyToggle } from '../../components/ui';
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
            <WizardLayout
                title="New Listing"
                stepText="Stage 4 of 5"
                subtitle="Entry Path & Policies"
                progressPercentage={80}
                themeColor="yellow"
                onBack={() => onNavigate('CREATE_CLASS_MEDIA')}
            >
                <SkeletonList rows={3} className="py-2" />
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

            <RefundPolicyToggle value={isRefundable} onChange={setIsRefundable} accent="yellow" />

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

            {draftId ? (
                <FaqTermsEditor listingId={draftId} faqApi={classFaqApi} accent="amber" faqDocumentsEntity="classes" />
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm font-bold text-amber-700">
                    Please complete the earlier steps first so we can save your FAQs and terms.
                </div>
            )}

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
