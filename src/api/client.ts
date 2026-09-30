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
export const refreshAccessToken = async (): Promise<string | null> => {
    const refresh_token = getRefreshToken();
    if (!refresh_token) {
        clearTokens();
        return null;
    }
    try {
        const refreshResponse = await fetch(`${BASE_URL}/api/v1/auth/refresh-token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token }),
        });
        if (!refreshResponse.ok) {
            // A 429 here is a transient rate limit, not an invalid/expired refresh
            // token — keep the session tokens intact so the caller can retry shortly
            // instead of the user being logged out mid-burst.
            if (refreshResponse.status !== 429) clearTokens();
            return null;
        }
        const res = await refreshResponse.json();
        const payload = res.data || res;
        const access = payload.access_token || payload.access;
        if (!access) {
            clearTokens();
            return null;
        }
        setAuthToken(access);
        return access;
    } catch {
        clearTokens();
        return null;
    }
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
