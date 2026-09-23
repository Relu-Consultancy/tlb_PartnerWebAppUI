import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { deletePartnerMedia } from '../onboarding';

const BASE = 'https://tlb-api.reluconsultancy.in';

describe('deletePartnerMedia', () => {
    it('resolves without throwing when the backend returns 204 No Content', async () => {
        server.use(http.delete(`${BASE}/api/v1/partner/media/1/`, () =>
            new HttpResponse(null, { status: 204 })));
        await expect(deletePartnerMedia(1)).resolves.toEqual({});
    });

    it('resolves when the backend returns a 200 with a JSON body', async () => {
        server.use(http.delete(`${BASE}/api/v1/partner/media/2/`, () =>
            HttpResponse.json({ success: true })));
        await expect(deletePartnerMedia(2)).resolves.toEqual({ success: true });
    });

    it('throws with the backend message on failure', async () => {
        server.use(http.delete(`${BASE}/api/v1/partner/media/3/`, () =>
            HttpResponse.json({ error: { message: 'Media not found' } }, { status: 404 })));
        await expect(deletePartnerMedia(3)).rejects.toThrow('Media not found');
    });
});
