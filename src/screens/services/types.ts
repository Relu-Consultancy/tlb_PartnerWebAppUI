import { EntityType } from '../../types';
import { ListingState } from '../../api/portalSummary';

// ---------------------------------------------------------------------------
// My Listings — a single flat table across every service type a partner
// offers, per the client mock. `ListingRow` is the fast, flat-list shape
// available immediately; `detail` fills in once the per-listing enrichment
// fetch (price, capacity, location) resolves.
// ---------------------------------------------------------------------------

export type BookingModel = 'ticketed' | 'enquiry';

export interface ListingRow {
    id: string;
    title: string;
    entityType: EntityType;
    code: string;
    state: ListingState;
    coverUrl: string | null;
    createdAt: string | null;
    reviewMessage: string;
    /** Best-known start date — the flat list's own field until enrichment can improve it. */
    startsAt: string | null;
    /** True once the per-listing enrichment fetch has resolved (success or failure). */
    enriched: boolean;
    model: BookingModel;
    priceLabel: string;
    capacityLabel: string;
    location: string;
    category: string;
    description: string;
    /** Gallery image URLs from the listing's detail payload (cover excluded), for the detail modal. */
    galleryUrls: string[];
    /** Partner-set, informational only — defaults true until enrichment resolves the real value. */
    isRefundable: boolean;
}

export interface ListingDemand {
    count: number;
    label: string;
}
