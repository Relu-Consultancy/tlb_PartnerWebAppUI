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
    reviewer_name: r?.reviewer_name ?? r?.customer_name ?? r?.user_name ?? r?.author ?? r?.name 
        ?? r?.user?.name ?? (r?.user?.first_name ? `${r.user.first_name} ${r.user.last_name || ''}`.trim() : null)
        ?? r?.customer?.name ?? (r?.customer?.first_name ? `${r.customer.first_name} ${r.customer.last_name || ''}`.trim() : null)
        ?? r?.reviewer?.name ?? (r?.reviewer?.first_name ? `${r.reviewer.first_name} ${r.reviewer.last_name || ''}`.trim() : null)
        ?? 'Anonymous',
    created_at: r?.created_at ?? r?.created ?? r?.updated_at ?? '',
});

const ensureOk = async (res: Response, fallback: string) => {
    if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || err?.detail || `${fallback} (HTTP ${res.status})`);
    }
};

export interface GetReviewsParams {
    rating?: number | '';
    listing_type?: string;
    listing_id?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
}

export interface PaginatedReviews {
    count: number;
    next: string | null;
    previous: string | null;
    results: PartnerReview[];
}

/** Paginated reviews across the partner's listings. */
export const getPartnerReviews = async (params: GetReviewsParams = {}): Promise<PaginatedReviews> => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.page_size) query.set('page_size', String(params.page_size));
    if (params.rating) query.set('rating', String(params.rating));
    if (params.listing_type && params.listing_type !== 'all') query.set('listing_type', params.listing_type);
    if (params.listing_id && params.listing_id !== 'all') query.set('listing_id', params.listing_id);
    if (params.ordering) query.set('ordering', params.ordering);

    const qs = query.toString();
    const url = `/api/v1/partner/reviews/${qs ? `?${qs}` : ''}`;
    
    const res = await apiClient(url);
    await ensureOk(res, 'Failed to load reviews');
    const json = await res.json();
    const data = unwrap(json);
    
    return {
        count: json?.count ?? data?.count ?? asArray<any>(data).length,
        next: json?.next ?? data?.next ?? null,
        previous: json?.previous ?? data?.previous ?? null,
        results: asArray<any>(data).map(normalizeReview),
    };
};

/** Reviews for a single listing. Returns [] on 404 (no reviews endpoint / none yet). */
export const getListingReviews = async (listingId: string): Promise<PartnerReview[]> => {
    const res = await apiClient(`/api/v1/partner/listings/${listingId}/reviews/`);
    if (res.status === 404) return [];
    await ensureOk(res, 'Failed to load reviews');
    return asArray<any>(unwrap(await res.json())).map(normalizeReview);
};
