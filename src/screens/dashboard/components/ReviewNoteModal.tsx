import React from 'react';
import { PartnerListing } from '../../../api/portalSummary';
import { PortalModal } from '../../../components/portal';
import { timeAgo } from '../../../utils/format';

interface ReviewNoteModalProps {
    listing: PartnerListing | null;
    onClose: () => void;
    onOpenListings: () => void;
}

/** Shows the TLB reviewer's note for a rejected listing. */
export const ReviewNoteModal: React.FC<ReviewNoteModalProps> = ({ listing, onClose, onOpenListings }) => {
    const reviewed = listing?.reviewedAt ? ` · ${timeAgo(listing.reviewedAt)}` : '';
    return (
        <PortalModal
            open={!!listing}
            onClose={onClose}
            title={listing?.title ?? ''}
            subtitle={listing ? `${listing.entityType} · Rejected by TLB${reviewed}` : undefined}
            widthClass="max-w-[440px]"
        >
            <p className="pt-eyebrow mb-2">Reviewer’s note</p>
            <p className="rounded-xl bg-tlb-wash px-4 py-3 text-[13px] leading-relaxed text-tlb-body whitespace-pre-wrap">
                {listing?.reviewMessage || 'The reviewer didn’t leave a note.'}
            </p>
            <div className="flex justify-end mt-4">
                <button type="button" onClick={onOpenListings} className="pt-btn pt-btn-d">Open in My listings</button>
            </div>
        </PortalModal>
    );
};
