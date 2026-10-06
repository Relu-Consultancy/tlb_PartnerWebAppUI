import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { getUnreadCount, listNotifications } from '../notifications';

const BASE = 'https://tlb-api.reluconsultancy.in';
const LIST = `${BASE}/api/v1/notifications/in-app/`;
const COUNT = `${BASE}/api/v1/notifications/in-app/unread-count/`;

const item = (id: string, is_read: boolean) => ({
    id,
    notification_type: 'broadcast',
    title: `T${id}`,
    body: '',
    is_read,
    created_at: '2026-10-01T10:00:00Z',
});

describe('listNotifications', () => {
    it('reads a flat list ({data: [...], next}) as well as a paginated one', async () => {
        server.use(http.get(LIST, () => HttpResponse.json({ success: true, data: [item('1', false)], count: 1, next: null })));
        const page = await listNotifications();
        expect(page.results.map((n) => n.id)).toEqual(['1']);
        expect(page.count).toBe(1);
    });

    it('treats an item with a read timestamp as read', async () => {
        server.use(
            http.get(LIST, () =>
                HttpResponse.json({
                    success: true,
                    data: { count: 1, next: null, results: [{ id: 7, title: 'x', read_at: '2026-10-01T10:00:00Z' }] },
                })
            )
        );
        const [n] = (await listNotifications()).results;
        expect(n.id).toBe('7');
        expect(n.is_read).toBe(true);
    });
});

describe('getUnreadCount', () => {
    it('never reports unread messages the partner cannot see (QA: "1 new" over an empty Unread tab)', async () => {
        server.use(
            http.get(COUNT, () => HttpResponse.json({ success: true, data: { count: 1 } })),
            http.get(LIST, () => HttpResponse.json({ success: true, data: { count: 0, next: null, results: [] } }))
        );
        expect(await getUnreadCount()).toBe(0);
    });

    it('counts only unread items even if the list ignores the unread filter', async () => {
        server.use(
            http.get(COUNT, () => HttpResponse.json({ success: true, data: { count: 3 } })),
            http.get(LIST, () =>
                HttpResponse.json({
                    success: true,
                    data: { count: 3, next: null, results: [item('1', false), item('2', true), item('3', true)] },
                })
            )
        );
        expect(await getUnreadCount()).toBe(1);
    });

    it('trusts the server count when there is more than a page of unread items', async () => {
        server.use(
            http.get(COUNT, () => HttpResponse.json({ success: true, data: { count: 120 } })),
            http.get(LIST, () =>
                HttpResponse.json({ success: true, data: { count: 120, next: `${LIST}?page=2`, results: [item('1', false)] } })
            )
        );
        expect(await getUnreadCount()).toBe(120);
    });

    it('falls back to the server count when the list cannot be read', async () => {
        server.use(
            http.get(COUNT, () => HttpResponse.json({ success: true, data: { count: 2 } })),
            http.get(LIST, () => HttpResponse.json({ error: { message: 'boom' } }, { status: 500 }))
        );
        expect(await getUnreadCount()).toBe(2);
    });

    it('skips the check entirely at zero', async () => {
        let listed = false;
        server.use(
            http.get(COUNT, () => HttpResponse.json({ success: true, data: { count: 0 } })),
            http.get(LIST, () => {
                listed = true;
                return HttpResponse.json({ success: true, data: { results: [] } });
            })
        );
        expect(await getUnreadCount()).toBe(0);
        expect(listed).toBe(false);
    });
});
