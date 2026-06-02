import { apiClient } from './client';

export const getPartnerCategories = async () => {
    const response = await apiClient('/api/v1/partner/categories/');
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to load categories');
    }
    return response.json();
};

export const getPartnerMedia = async () => {
    const response = await apiClient('/api/v1/partner/media/');
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to load media');
    }
    return response.json();
};

export const uploadPartnerMedia = async (file: File, media_type: 'image' | 'video') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', media_type);
    
    const response = await apiClient('/api/v1/partner/media/', {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        const serverMsg = err?.error?.message || err?.message;
        // 413 / non-JSON bodies (e.g. HTML 500) leave serverMsg undefined — surface
        // the HTTP status instead of an opaque "unknown error".
        const statusHint = response.status === 413
            ? 'File is too large for the server (max 5MB for images).'
            : `Upload failed (HTTP ${response.status}). Please check the file and try again.`;
        throw new Error(serverMsg || statusHint);
    }
    return response.json();
};

export const deletePartnerMedia = async (media_id: number) => {
    const response = await apiClient(`/api/v1/partner/media/${media_id}/`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to delete media');
    }
    return response.json();
};

export const getBusinessProfile = async () => {
    const response = await apiClient('/api/v1/partner/profile/');
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to load profile');
    }
    return response.json();
};

export const updateBusinessProfile = async (data: any) => {
    const response = await apiClient('/api/v1/partner/profile/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        // Sometimes validation errors come as an object, stringify if needed
        let msg = errorData?.error?.message || errorData?.message;
        if (!msg && errorData) msg = JSON.stringify(errorData);
        throw new Error(msg || 'Failed to update profile');
    }
    return response.json();
};

export const selectCategories = async (categories: string[]) => {
    const response = await apiClient('/api/v1/partner/select-categories/', {
        method: 'POST',
        body: JSON.stringify({ categories }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to update categories');
    }
    return response.json();
};

export const getPartnerDashboard = async () => {
    const response = await apiClient('/api/v1/partner/dashboard/');
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to load dashboard');
    }
    return response.json();
};

export const getCurrentPartner = async () => {
    const response = await apiClient('/api/v1/partner/me/');
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to load partner profile');
    }
    return response.json();
};

export const getExtendedProfile = async () => {
    const response = await apiClient('/api/v1/partner/extended-profile/');
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to load extended profile');
    }
    return response.json();
};

export const updateExtendedProfile = async (formData: FormData) => {
    const response = await apiClient('/api/v1/partner/extended-profile/', {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to update extended profile');
    }
    return response.json();
};

export const activatePartner = async () => {
    const response = await apiClient('/api/v1/partner/activate/', {
        method: 'POST',
        body: JSON.stringify({ is_active: true }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to activate partner');
    }
    return response.json();
};

export const submitVerification = async (data: any) => {
    const response = await apiClient('/api/v1/partner/verification/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to submit verification');
    }
    return response.json();
};

export const getPartnerFollowerCount = async (partnerId: string) => {
    const response = await apiClient(`/api/v1/partner/${partnerId}/followers/count/`);
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to load follower count');
    }
    return response.json();
};
