import { apiClient, clearTokens } from './client';

// request-otp and verify-otp can both now return 429 RATE_LIMIT_EXCEEDED under
// high-volume traffic (no contract change otherwise) — surface a friendly,
// distinguishable error instead of a generic "failed" message so screens can
// treat a rate limit differently from an actual invalid/expired OTP.
export class AuthApiError extends Error {
    status: number;
    code?: string;
    constructor(message: string, status: number, code?: string) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

const RATE_LIMIT_MESSAGE = 'Too many attempts. Please wait a moment and try again.';

/**
 * The backend's request-otp only accepts `identifier_type: "email"` today — a
 * phone request comes back as a raw serializer dump ("phone" is not a valid
 * choice). Flip this once SMS OTP ships; the screens follow it.
 */
export const PHONE_OTP_AVAILABLE = false;
export const PHONE_OTP_UNAVAILABLE_MESSAGE = 'Mobile OTP isn’t available yet. Please use your email address to get your code.';

const parseAuthError = async (response: Response, fallback: string): Promise<AuthApiError> => {
    if (response.status === 429) return new AuthApiError(RATE_LIMIT_MESSAGE, 429, 'RATE_LIMIT_EXCEEDED');
    const err = await response.json().catch(() => null);
    let message: string = typeof err?.error === 'string' ? err.error : err?.error?.message || err?.message || fallback;
    // A stringified DRF ValidationError ("{'identifier': [ErrorDetail(string=…") is
    // not something a partner should ever read.
    if (/ErrorDetail\(/.test(message)) {
        message = /"?phone"? is not a valid choice/i.test(message)
            ? PHONE_OTP_UNAVAILABLE_MESSAGE
            : (message.match(/string=['"]([^'"]+)['"]/)?.[1] ?? fallback);
    }
    return new AuthApiError(message, response.status, typeof err?.error === 'object' ? err?.error?.code : undefined);
};

export const requestOtp = async (identifier: string, identifier_type: string) => {
    if (identifier_type === 'phone' && !PHONE_OTP_AVAILABLE) {
        // Don't send a request the backend is certain to reject.
        throw new AuthApiError(PHONE_OTP_UNAVAILABLE_MESSAGE, 400, 'PHONE_OTP_UNAVAILABLE');
    }
    const response = await apiClient('/api/v1/auth/request-otp/', {
        method: 'POST',
        body: JSON.stringify({ identifier, identifier_type }),
    });
    if (!response.ok) {
        throw await parseAuthError(response, 'Failed to request OTP');
    }
    return response.json();
};

export const verifyOtp = async (identifier: string, otp: string, role: string = 'partner') => {
    const response = await apiClient('/api/v1/auth/verify-otp/', {
        method: 'POST',
        body: JSON.stringify({ identifier, otp, role }),
    });
    if (!response.ok) {
        throw await parseAuthError(response, 'Failed to verify OTP');
    }
    return response.json();
};

export const getCurrentUser = async () => {
    const response = await apiClient('/api/v1/auth/me/', {
        method: 'GET',
    });
    if (!response.ok) {
        throw new Error('Failed to get user profile');
    }
    return response.json();
};

export const logout = async (refresh_token: string) => {
    try {
        await apiClient('/api/v1/auth/logout/', {
            method: 'POST',
            body: JSON.stringify({ refresh_token }),
        });
    } finally {
        clearTokens();
    }
};
