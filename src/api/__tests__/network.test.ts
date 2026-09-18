import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { startConversation, sendConversationMessage, NetworkApiError } from '../network';

const BASE = 'https://tlb-api.reluconsultancy.in';

describe('network API — BLOCKED is now bidirectional and also enforced on send', () => {
    it('startConversation surfaces a NetworkApiError with code BLOCKED on 403', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/network/conversations/`, () =>
            HttpResponse.json({ success: false, error: { code: 'BLOCKED', message: 'You cannot message this partner.' } }, { status: 403 })));
        await expect(startConversation('p1')).rejects.toMatchObject({
            status: 403, code: 'BLOCKED', message: 'You cannot message this partner.',
        });
        await expect(startConversation('p1')).rejects.toBeInstanceOf(NetworkApiError);
    });

    it('sendConversationMessage now also surfaces the same BLOCKED shape (previously unrestricted on an existing thread)', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/network/conversations/c1/messages/`, () =>
            HttpResponse.json({ success: false, error: { code: 'BLOCKED', message: 'You cannot message this partner.' } }, { status: 403 })));
        await expect(sendConversationMessage('c1', 'hi')).rejects.toMatchObject({
            status: 403, code: 'BLOCKED',
        });
    });

    it('a non-BLOCKED failure carries no code, so callers can tell the two apart', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/network/conversations/c1/messages/`, () =>
            HttpResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })));
        await expect(sendConversationMessage('c1', 'hi')).rejects.toMatchObject({ status: 500, code: undefined });
    });
});
