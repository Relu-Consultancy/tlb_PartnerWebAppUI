import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Reviews — ratings/reviews customers leave on the partner's listings.
// Primary: GET /api/v1/partner/reviews/ (all reviews across listings).
// Per-listing: GET /api/v1/partner/listings/{id}/reviews/
// ---------------------------------------------------------------------------

export interface PartnerReview {
    id: string;
    listing_id: string;
    listing_title: string;
    listing_type: string;
    rating: number;
    comment: string;
    reviewer_name: string;
    created_at: string;
}

const unwrap = (json: any) => json?.data ?? json;
const asArray = <T>(data: any): T[] => (Array.isArray(data) ? data : (data?.results ?? []));

const normalizeReview = (r: any): PartnerReview => ({
    id: String(r?.id ?? ''),
    listing_id: String(r?.listing_id ?? r?.listing?.id ?? r?.listing ?? ''),
    listing_title: r?.listing_title ?? r?.listing?.title ?? r?.listing_name ?? '',
    listing_type: (r?.listing_type ?? r?.listing?.listing_type ?? r?.booking_type ?? '').toString(),
    rating: Number(r?.rating ?? r?.stars ?? r?.score ?? 0) || 0,
    comment: r?.comment ?? r?.review ?? r?.review_text ?? r?.text ?? r?.body ?? r?.message ?? '',
    reviewer_name: r?.reviewer_name ?? r?.customer_name ?? r?.user_name ?? r?.author ?? r?.name ?? 'Anonymous',
    created_at: r?.created_at ?? r?.created ?? r?.updated_at ?? '',
});

const ensureOk = async (res: Response, fallback: string) => {
    if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || err?.detail || `${fallback} (HTTP ${res.status})`);
    }
};

/** All reviews across the partner's listings (paginated — every page fetched). */
export const getPartnerReviews = async (): Promise<PartnerReview[]> => {
    const all: any[] = [];
    let page = 1;
    for (let guard = 0; guard < 40; guard++) {
        const res = await apiClient(`/api/v1/partner/reviews/?page=${page}`);
        await ensureOk(res, 'Failed to load reviews');
        const json = await res.json();
        const data = unwrap(json);
        all.push(...asArray<any>(data));
        const next = json?.next ?? data?.next;
        if (!next) break;
        page++;
    }
    return all.map(normalizeReview);
};

/** Reviews for a single listing. Returns [] on 404 (no reviews endpoint / none yet). */
export const getListingReviews = async (listingId: string): Promise<PartnerReview[]> => {
    const res = await apiClient(`/api/v1/partner/listings/${listingId}/reviews/`);
    if (res.status === 404) return [];
    await ensureOk(res, 'Failed to load reviews');
    return asArray<any>(unwrap(await res.json())).map(normalizeReview);
};
