import { apiClient } from './client';

export const getPartnerCategories = async () => {
    const response = await apiClient('/api/v1/partners/categories/');
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to load categories');
    }
    return response.json();
};

export const getPartnerMedia = async () => {
    const response = await apiClient('/api/v1/partners/media/');
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
    
    const response = await apiClient('/api/v1/partners/media/', {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to upload media');
    }
    return response.json();
};

export const deletePartnerMedia = async (media_id: number) => {
    const response = await apiClient(`/api/v1/partners/media/${media_id}/`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to delete media');
    }
    return response.json();
};

export const getBusinessProfile = async () => {
    const response = await apiClient('/api/v1/partners/profile/');
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to load profile');
    }
    return response.json();
};

export const updateBusinessProfile = async (data: any) => {
    const response = await apiClient('/api/v1/partners/profile/', {
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
    const response = await apiClient('/api/v1/partners/select-categories/', {
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
    const response = await apiClient('/api/v1/partners/dashboard/');
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to load dashboard');
    }
    return response.json();
};

export const getCurrentPartner = async () => {
    const response = await apiClient('/api/v1/partners/me/');
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to load partner profile');
    }
    return response.json();
};

export const getExtendedProfile = async () => {
    const response = await apiClient('/api/v1/partners/extended-profile/');
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to load extended profile');
    }
    return response.json();
};

export const updateExtendedProfile = async (formData: FormData) => {
    const response = await apiClient('/api/v1/partners/extended-profile/', {
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
    const response = await apiClient('/api/v1/partners/activate/', {
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
    const response = await apiClient('/api/v1/partners/verification/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to submit verification');
    }
    return response.json();
};
