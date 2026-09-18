import { ListingState } from '../../api/portalSummary';
import { Tone } from './primitives';

// ---------------------------------------------------------------------------
// Shared listing-status vocabulary — the six real listing states this app
// tracks (`ListingState`), mapped onto the mock's colour palette. Used by any
// screen that lists or filters a partner's listings (Bookings/Enquiries,
// My Listings).
// ---------------------------------------------------------------------------

export const LISTING_STATUS_ORDER: ListingState[] = ['live', 'pending', 'paused', 'draft', 'rejected', 'archived'];

export const LISTING_STATUS_META: Record<ListingState, { label: string; tone: Tone; dot: string }> = {
    live: { label: 'Live', tone: 'green', dot: '#2E9E5B' },
    pending: { label: 'Pending', tone: 'blue', dot: '#3A63C9' },
    paused: { label: 'Paused', tone: 'amber', dot: '#C2410C' },
    draft: { label: 'Draft', tone: 'neutral', dot: '#8A8880' },
    rejected: { label: 'Rejected', tone: 'red', dot: '#B22222' },
    archived: { label: 'Archived', tone: 'neutral', dot: '#8A8880' },
};
