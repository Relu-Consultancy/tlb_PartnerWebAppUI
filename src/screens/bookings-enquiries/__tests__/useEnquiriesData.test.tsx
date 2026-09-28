import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { CLASS_DRAFT_ID, PROGRAM_DRAFT_ID } from '../../../test/msw/handlers';
import { invalidatePortalSummary } from '../../../api/portalSummary';
import { useEnquiriesData } from '../useEnquiriesData';

const BASE = 'https://tlb-api.reluconsultancy.in';

const noEnquiries = (path: string) => http.get(`${BASE}${path}`, () => HttpResponse.json({ success: true, data: [] }));

beforeEach(() => {
    // Listings are memoised app-wide — each case needs its own fetch.
    invalidatePortalSummary();
});

describe('useEnquiriesData — listing names', () => {
    it('names a program enquiry from the listing it was fetched for when the payload omits the title', async () => {
        // The real per-listing program endpoint doesn't repeat the program's name —
        // the caller already asked for it by id — which is what showed "Untitled listing".
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/enquiries/`, () =>
                HttpResponse.json({ success: true, data: [{ id: 1, parent_name: 'Ramesh Gupta', status: 'new' }] })
            )
        );

        const { result } = renderHook(() => useEnquiriesData(['Programs']));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.entries).toHaveLength(1);
        expect(result.current.entries[0].listingTitle).toBe('STEM Bootcamp');
    });

    it('names a class enquiry from the partner’s listings via its listing id', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/classes/enquiries/`, () =>
                HttpResponse.json({
                    success: true,
                    data: [{ id: 'enq-9', class_id: CLASS_DRAFT_ID, parent_name: 'Priya Sharma', status: 'new' }],
                })
            )
        );

        const { result } = renderHook(() => useEnquiriesData(['Classes']));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.entries[0].listingTitle).toBe('Test Class');
    });

    it('reads a title nested under an expanded listing object', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/classes/enquiries/`, () =>
                HttpResponse.json({
                    success: true,
                    data: [{ id: 'enq-9', class: { id: 'other', title: 'Pottery Basics' }, status: 'new' }],
                })
            )
        );

        const { result } = renderHook(() => useEnquiriesData(['Classes']));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.entries[0].listingTitle).toBe('Pottery Basics');
    });

    it('falls back to "Untitled listing" only when nothing names it', async () => {
        server.use(
            noEnquiries('/api/v1/partner/listings/venues/enquiries/'),
            http.get(`${BASE}/api/v1/partner/listings/classes/enquiries/`, () =>
                HttpResponse.json({ success: true, data: [{ id: 'enq-9', status: 'new' }] })
            )
        );

        const { result } = renderHook(() => useEnquiriesData(['Classes']));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.entries[0].listingTitle).toBe('Untitled listing');
    });
});
