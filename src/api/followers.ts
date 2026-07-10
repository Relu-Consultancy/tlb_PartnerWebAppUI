import { apiClient } from './client';

export interface FollowerListItem {
  user_id: string;
  full_name: string;
  city: string | null;
  gender: string | null;
  followed_at: string;
}

export interface FollowerListResponse {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: FollowerListItem[];
}

export interface FollowerDetail {
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  gender: string | null;
  age: number | null;
  followed_at: string;
  engagement: {
    bookings_with_you: number;
    last_booking_at: string | null;
  };
}

export interface FollowerListParams {
  search?: string;
  city?: string;
  gender?: string;
  ordering?: 'newest' | 'oldest' | 'name';
  page?: number;
  page_size?: number;
}

export const getFollowers = async (params: FollowerListParams = {}): Promise<FollowerListResponse> => {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.city) query.set('city', params.city);
  if (params.gender) query.set('gender', params.gender);
  if (params.ordering) query.set('ordering', params.ordering);
  if (params.page) query.set('page', String(params.page));
  if (params.page_size) query.set('page_size', String(params.page_size));

  const qs = query.toString();
  const response = await apiClient(`/api/v1/partner/followers/${qs ? `?${qs}` : ''}`);
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error?.message || 'Failed to load followers');
  }
  const res = await response.json();
  return res.data || res;
};

export const getFollowerDetail = async (followerId: string): Promise<FollowerDetail> => {
  const response = await apiClient(`/api/v1/partner/followers/${followerId}/`);
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error?.message || 'Failed to load follower details');
  }
  const res = await response.json();
  return res.data || res;
};
