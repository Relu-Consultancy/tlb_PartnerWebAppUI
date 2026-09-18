import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Partner verticals — self-service add/remove of a partner's service
// categories post-onboarding.
// Base: /api/v1/partner/verticals/
// Requires a fully approved partner (status = approved); mid-onboarding
// partners get 403 here and still use onboarding's select-categories/ flow.
//
// One category per call — never a batch replace like select-categories/.
// POST is idempotent (adding an existing category is a no-op, still 200).
// DELETE 400s with CATEGORY_HAS_ACTIVE_LISTINGS if the vertical still has any
// non-archived (draft/pending/published) listing.
// ---------------------------------------------------------------------------

/** The known listing-backed verticals, plus "Shop" — a real category this API
 * accepts that has no listing-creation flow anywhere in this portal yet. */
export type VerticalCategory = 'Events' | 'Venues' | 'Programs' | 'Classes' | 'Shop';

export interface PartnerVertical {
    id: number;
    name: string;
}

export class VerticalApiError extends Error {
    code?: string;
    status: number;
    constructor(message: string, status: number, code?: string) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

const parseError = async (response: Response, fallback: string): Promise<VerticalApiError> => {
    const err = await response.json().catch(() => null);
    return new VerticalApiError(err?.error?.message || err?.message || fallback, response.status, err?.error?.code);
};

const unwrap = (json: any) => json?.data ?? json;

/** GET /partner/verticals/ — the partner's current category list. */
export const getPartnerVerticals = async (): Promise<PartnerVertical[]> => {
    const res = await apiClient('/api/v1/partner/verticals/');
    if (!res.ok) throw await parseError(res, 'Failed to load verticals');
    const data = unwrap(await res.json());
    return Array.isArray(data) ? data : (data?.results ?? []);
};

/** POST /partner/verticals/ — add one category. Idempotent; takes effect immediately. */
export const addPartnerVertical = async (category: VerticalCategory | string): Promise<PartnerVertical> => {
    const res = await apiClient('/api/v1/partner/verticals/', {
        method: 'POST',
        body: JSON.stringify({ category }),
    });
    if (!res.ok) throw await parseError(res, 'Failed to add vertical');
    return unwrap(await res.json());
};

/** DELETE /partner/verticals/ — remove one category. Throws VerticalApiError with
 * code CATEGORY_HAS_ACTIVE_LISTINGS (and a human-readable count in the message)
 * when the partner still has non-archived listings in that vertical. */
export const removePartnerVertical = async (category: VerticalCategory | string): Promise<void> => {
    const res = await apiClient('/api/v1/partner/verticals/', {
        method: 'DELETE',
        body: JSON.stringify({ category }),
    });
    if (!res.ok) throw await parseError(res, 'Failed to remove vertical');
};
