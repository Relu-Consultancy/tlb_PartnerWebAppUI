import { apiClient, clearTokens } from './client';

export const requestOtp = async (identifier: string, identifier_type: string) => {
    const response = await apiClient('/api/v1/auth/request-otp/', {
        method: 'POST',
        body: JSON.stringify({ identifier, identifier_type }),
    });
    if (!response.ok) {
        throw new Error('Failed to request OTP');
    }
    return response.json();
};

export const verifyOtp = async (identifier: string, otp: string, role: string = 'partner') => {
    const response = await apiClient('/api/v1/auth/verify-otp/', {
        method: 'POST',
        body: JSON.stringify({ identifier, otp, role }),
    });
    if (!response.ok) {
        throw new Error('Failed to verify OTP');
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
