const BASE_URL = 'https://tlb-api.reluconsultancy.in';

export const getAuthToken = () => localStorage.getItem('access_token');
export const setAuthToken = (token: string) => localStorage.setItem('access_token', token);
export const getRefreshToken = () => localStorage.getItem('refresh_token');
export const setRefreshToken = (token: string) => localStorage.setItem('refresh_token', token);
export const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

// Single source of truth for the refresh-token exchange — used by apiClient's own
// 401-retry below, and by App.tsx's session-restore-on-load effect. Never re-implement
// this fetch elsewhere; both callers must share this exact logic.
/** Fired once a refresh has definitively failed and the session is gone. */
export const SESSION_EXPIRED_EVENT = 'tlb:session-expired';

const endSession = () => {
    clearTokens();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};

// Screens fire many requests at once (the dashboard alone sends ~10); when the
// access token lapses they all 401 together. Without this, each one spent the
// same refresh token in parallel — with refresh-token rotation the first won
// and the rest failed, logging the partner out despite a successful refresh.
let refreshInFlight: Promise<string | null> | null = null;

const doRefresh = async (): Promise<string | null> => {
    const refresh_token = getRefreshToken();
    if (!refresh_token) {
        endSession();
        return null;
    }
    let refreshResponse: Response;
    try {
        refreshResponse = await fetch(`${BASE_URL}/api/v1/auth/refresh-token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token }),
        });
    } catch {
        // Network blip — the tokens may be perfectly valid. Keep them; the
        // caller just sees this request fail and the next one can try again.
        return null;
    }
    if (!refreshResponse.ok) {
        // A 429 here is a transient rate limit, not an invalid/expired refresh
        // token — keep the session tokens intact so the caller can retry shortly
        // instead of the user being logged out mid-burst.
        if (refreshResponse.status !== 429) endSession();
        return null;
    }
    const res = await refreshResponse.json().catch(() => null);
    const payload = res?.data || res || {};
    const access = payload.access_token || payload.access;
    if (!access) {
        endSession();
        return null;
    }
    setAuthToken(access);
    // Rotation: the server issues a fresh refresh token alongside the access
    // token. Dropping it left a dead token behind for the next expiry.
    const rotated = payload.refresh_token || payload.refresh;
    if (rotated) setRefreshToken(rotated);
    return access;
};

export const refreshAccessToken = (): Promise<string | null> => {
    if (!refreshInFlight) {
        refreshInFlight = doRefresh().finally(() => {
            refreshInFlight = null;
        });
    }
    return refreshInFlight;
};

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const headers: HeadersInit = {
        ...(options.headers || {}),
    };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401 && endpoint !== '/api/v1/auth/refresh-token/') {
        const access = await refreshAccessToken();
        if (access) {
            // Retry original request
            headers['Authorization'] = `Bearer ${access}`;
            response = await fetch(`${BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });
        }
    }

    return response;
};

// ---------------------------------------------------------------------------
// Approved-partner refusals
//
// Coupons and stats/* sit behind the backend's IsApprovedPartner permission.
// Callers throw plain Errors, so `status` is attached by `rejection()` below
// and read back here — prose matching alone missed DRF's default 403 wording
// and made the "finish your verification" notice appear only sometimes.
// ---------------------------------------------------------------------------

/** Error carrying the HTTP status that produced it. */
export interface HttpError extends Error {
    status?: number;
}

/** Builds the Error an API helper throws, tagged with the response status. */
export const rejection = (message: string, status?: number): HttpError => {
    const error = new Error(message) as HttpError;
    if (status != null) error.status = status;
    return error;
};

const APPROVAL_TEXT =
    /fully approved|not approved|approved partner|do not have permission|don’t have permission|PARTNER_NOT_APPROVED|IsApprovedPartner|HTTP 403/i;

/** True when a failure is the backend refusing an unapproved partner, not an outage. */
export const isApprovalError = (error: unknown): boolean => {
    if (!error) return false;
    if ((error as HttpError).status === 403) return true;
    const message = typeof error === 'string' ? error : (error as any)?.message;
    return !!message && APPROVAL_TEXT.test(String(message));
};
