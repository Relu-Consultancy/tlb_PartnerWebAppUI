import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { autocompleteLocation, getPlaceDetails, reverseGeocodeLocation, LocationApiError } from '../location';

const BASE = 'https://tlb-api.reluconsultancy.in';

describe('location API — new rate limit (30/min per partner)', () => {
    it('autocompleteLocation throws a friendly LocationApiError on 429', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/location/autocomplete/`, () =>
            HttpResponse.json({ error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }, { status: 429 })));
        await expect(autocompleteLocation('koramangala')).rejects.toMatchObject({
            status: 429,
            message: expect.stringMatching(/slow down/i),
        });
        await expect(autocompleteLocation('koramangala')).rejects.toBeInstanceOf(LocationApiError);
    });

    it('getPlaceDetails throws the same friendly message on 429', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/location/place-details/`, () =>
            HttpResponse.json({}, { status: 429 })));
        await expect(getPlaceDetails('place-1')).rejects.toMatchObject({ status: 429 });
    });

    it('reverseGeocodeLocation throws the same friendly message on 429', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/location/reverse-geocode/`, () =>
            HttpResponse.json({}, { status: 429 })));
        await expect(reverseGeocodeLocation(12.9, 77.6)).rejects.toMatchObject({ status: 429 });
    });

    it('surfaces the real backend message for a non-rate-limit error', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/location/autocomplete/`, () =>
            HttpResponse.json({ error: { message: 'Query too short' } }, { status: 400 })));
        await expect(autocompleteLocation('ab')).rejects.toMatchObject({ status: 400, message: 'Query too short' });
    });
});
