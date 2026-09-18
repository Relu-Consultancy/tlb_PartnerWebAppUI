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

const parseAuthError = async (response: Response, fallback: string): Promise<AuthApiError> => {
    if (response.status === 429) return new AuthApiError(RATE_LIMIT_MESSAGE, 429, 'RATE_LIMIT_EXCEEDED');
    const err = await response.json().catch(() => null);
    const message = typeof err?.error === 'string' ? err.error : (err?.error?.message || err?.message || fallback);
    return new AuthApiError(message, response.status, typeof err?.error === 'object' ? err?.error?.code : undefined);
};

export const requestOtp = async (identifier: string, identifier_type: string) => {
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
