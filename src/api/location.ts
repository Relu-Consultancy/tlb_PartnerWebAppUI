import { apiClient } from './client';

export interface LocationSuggestion {
    place_id: string;
    description: string;
}

export interface ResolvedLocation {
    address: string;
    city: string;
    area: string;
    latitude: number;
    longitude: number;
}

const handleError = async (response: Response, fallback: string): Promise<never> => {
    const err = await response.json().catch(() => null);
    const msg: string = err?.error?.message || err?.message || fallback;
    throw new Error(msg);
};

/** GET /partner/location/autocomplete/ — search-as-you-type address suggestions. */
export const autocompleteLocation = async (query: string, sessionToken?: string): Promise<LocationSuggestion[]> => {
    const params = new URLSearchParams({ q: query });
    if (sessionToken) params.set('session_token', sessionToken);
    const response = await apiClient(`/api/v1/partner/location/autocomplete/?${params.toString()}`);
    if (!response.ok) await handleError(response, 'Failed to search locations');
    const res = await response.json();
    return (res.data ?? res ?? []) as LocationSuggestion[];
};

/** GET /partner/location/place-details/ — resolve a picked autocomplete suggestion. */
export const getPlaceDetails = async (placeId: string, sessionToken?: string): Promise<ResolvedLocation> => {
    const params = new URLSearchParams({ place_id: placeId });
    if (sessionToken) params.set('session_token', sessionToken);
    const response = await apiClient(`/api/v1/partner/location/place-details/?${params.toString()}`);
    if (!response.ok) await handleError(response, 'Failed to resolve location');
    const res = await response.json();
    return (res.data ?? res) as ResolvedLocation;
};

/** GET /partner/location/reverse-geocode/ — resolve a dropped/dragged map pin. */
export const reverseGeocodeLocation = async (lat: number, lng: number): Promise<ResolvedLocation> => {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    const response = await apiClient(`/api/v1/partner/location/reverse-geocode/?${params.toString()}`);
    if (!response.ok) await handleError(response, 'Failed to resolve address for this point');
    const res = await response.json();
    return (res.data ?? res) as ResolvedLocation;
};
