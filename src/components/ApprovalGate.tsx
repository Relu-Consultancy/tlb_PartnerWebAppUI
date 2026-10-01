import React, { useEffect, useState } from 'react';
import { ArrowRight, Clock, FileText, Landmark, ShieldCheck, UploadCloud } from 'lucide-react';
import { Screen } from '../types';
import { loadCurrentPartner, PARTNER_UPDATED_EVENT } from '../api/portalSummary';
// Re-exported so screens can keep importing the notice and its trigger together.
export { isApprovalError } from '../api/client';
import { isApprovedPartner } from './portal';
import { Skeleton } from './ui';

// ---------------------------------------------------------------------------
// Approval gate — some endpoints (coupons, stats) are restricted to partners
// TLB has approved, so those screens would otherwise mount, fire calls that
// 403, and leave the partner staring at a raw error. The gate resolves the
// partner's verification state first and, until they're approved, renders a
// notice telling them exactly what to submit instead of the screen itself.
// ---------------------------------------------------------------------------

/**
 * Approval state for gating, read straight off the partner's status — the same
 * field the backend gates on. `approved: null` means "unknown": the read failed
 * even after a retry, so we fail open rather than lock an approved partner out
 * over a transient error. `inReview` only picks the notice's wording, and is
 * deliberately not `verificationOf`, which counts the separate is_verified flag
 * as verified and would otherwise mislabel a partner mid-review.
 */
const RETRY_DELAY_MS = 800;

const usePartnerApproval = (): { loading: boolean; approved: boolean | null; inReview: boolean } => {
    const [loading, setLoading] = useState(true);
    const [approved, setApproved] = useState<boolean | null>(null);
    const [inReview, setInReview] = useState(false);

    useEffect(() => {
        let cancelled = false;
        // One retry: /partner/me/ can 429 or land mid token-refresh on a cold
        // load, and failing open there is what made the notice intermittent.
        const load = (attempt = 0) => {
            loadCurrentPartner()
                .then((partner) => {
                    if (!cancelled) {
                        // Approval is the backend's rule (status === 'approved'),
                        // not the separate is_verified flag.
                        setApproved(isApprovedPartner(partner));
                        setInReview(String(partner?.status ?? '') === 'under_review');
                        setLoading(false);
                    }
                })
                .catch((err) => {
                    if (cancelled) return;
                    if (attempt === 0) {
                        setTimeout(() => {
                            if (!cancelled) load(1);
                        }, RETRY_DELAY_MS);
                        return;
                    }
                    console.error('Approval gate: partner status load failed', err);
                    setApproved(null);
                    setInReview(false);
                    setLoading(false);
                });
        };
        load();
        // Submitting documents flips the status — re-read so the gate lifts itself.
        const reload = () => load();
        window.addEventListener(PARTNER_UPDATED_EVENT, reload);
        return () => {
            cancelled = true;
            window.removeEventListener(PARTNER_UPDATED_EVENT, reload);
        };
    }, []);

    return { loading, approved, inReview };
};

const REQUIREMENTS: { icon: React.ElementType; label: string; detail: string }[] = [
    { icon: FileText, label: 'Identity & tax', detail: 'PAN (GST optional)' },
    { icon: Landmark, label: 'Bank account', detail: 'Where your payouts settle' },
    { icon: UploadCloud, label: 'Business documents', detail: 'Certificates, licences or brochures' },
];

/** Matches the gated screens' own loading body, so nothing shifts once status resolves. */
const GateSkeleton: React.FC = () => (
    <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4" aria-busy="true" aria-label="Checking your account status">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 rounded-[14px]" />
        <Skeleton className="h-72 rounded-[14px]" />
    </div>
);

interface NoticeProps {
    feature: string;
    /** Documents already submitted — nothing for the partner to re-upload. */
    inReview?: boolean;
    onNavigate: (screen: Screen) => void;
}

export const ApprovalRequiredNotice: React.FC<NoticeProps> = ({ feature, inReview, onNavigate }) => (
    <div className="px-4 sm:px-[26px] pt-5 pb-9">
        <section
            role="alert"
            aria-live="polite"
            className="pt-card max-w-[620px] mx-auto px-6 sm:px-9 py-9 flex flex-col items-center text-center"
        >
            <span
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    inReview ? 'bg-tlb-blue-soft text-tlb-blue' : 'bg-tlb-amber-soft text-tlb-gold'
                }`}
                aria-hidden="true"
            >
                {inReview ? <Clock size={26} strokeWidth={2.25} /> : <ShieldCheck size={26} strokeWidth={2.25} />}
            </span>

            <h1 className="pt-h1 text-[22px] mt-5">{feature} unlock once TLB approves your profile</h1>
            <p className="text-[13.5px] text-tlb-sub mt-2.5 max-w-[46ch]">
                {inReview
                    ? `Your documents are with the TLB team. ${feature} open up the moment your profile is approved — usually within 24 hours. You can review or update what you submitted in the meantime.`
                    : `Upload your remaining verification documents and submit them for review. Once the TLB team approves your profile — usually within 24 hours — ${feature.toLowerCase()} unlock automatically.`}
            </p>

            {!inReview && (
                <ul className="w-full mt-6 flex flex-col gap-2 text-left">
                    {REQUIREMENTS.map(({ icon: Icon, label, detail }) => (
                        <li key={label} className="pt-note">
                            <Icon size={16} strokeWidth={2.25} className="text-tlb-gold flex-none" aria-hidden="true" />
                            <span>
                                <span className="font-bold text-tlb-ink">{label}</span>
                                {' · '}
                                {detail}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-7">
                <button type="button" onClick={() => onNavigate('DOCUMENTS')} className="pt-btn pt-btn-y">
                    {inReview ? 'Review documents' : 'Upload documents'}
                    <ArrowRight size={15} strokeWidth={2.5} />
                </button>
                <button type="button" onClick={() => onNavigate('HOME')} className="pt-btn pt-btn-o">
                    Back to dashboard
                </button>
            </div>
        </section>
    </div>
);

interface ApprovalGateProps {
    /** Plural feature name used in the notice, e.g. "Coupons" / "Analytics". */
    feature: string;
    onNavigate: (screen: Screen) => void;
    children: React.ReactNode;
}

export const ApprovalGate: React.FC<ApprovalGateProps> = ({ feature, onNavigate, children }) => {
    const { loading, approved, inReview } = usePartnerApproval();

    if (loading) return <GateSkeleton />;
    // Unknown status → fail open; the screen surfaces its own error if the API refuses.
    if (approved !== false) return <>{children}</>;

    return <ApprovalRequiredNotice feature={feature} inReview={inReview} onNavigate={onNavigate} />;
};
