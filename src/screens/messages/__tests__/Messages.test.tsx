import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import Messages from '../Messages';

const BASE = 'https://tlb-api.reluconsultancy.in';
const LIST = `${BASE}/api/v1/notifications/in-app/`;
const COUNT = `${BASE}/api/v1/notifications/in-app/unread-count/`;

describe('Messages — unread badge matches what can be opened', () => {
    it('shows no "new" badge when the count says 1 but there is no unread message (QA)', async () => {
        server.use(
            http.get(COUNT, () => HttpResponse.json({ success: true, data: { count: 1 } })),
            http.get(LIST, ({ request }) => {
                const unread = new URL(request.url).searchParams.get('unread');
                const results = unread
                    ? []
                    : [
                          {
                              id: '1',
                              notification_type: 'broadcast',
                              title: 'Welcome',
                              body: '',
                              is_read: true,
                              created_at: '2026-10-01T10:00:00Z',
                          },
                      ];
                return HttpResponse.json({ success: true, data: { count: results.length, next: null, results } });
            })
        );
        render(<Messages onNavigate={vi.fn()} onOpenSidebar={vi.fn()} />);

        await waitFor(() => expect(screen.getByText('Welcome')).toBeInTheDocument());
        await new Promise((r) => setTimeout(r, 100));
        expect(screen.queryByText(/1 new/)).not.toBeInTheDocument();
    });

    it('the Unread tab never lists a read message, even if the API ignores the filter', async () => {
        server.use(
            http.get(COUNT, () => HttpResponse.json({ success: true, data: { count: 1 } })),
            http.get(LIST, () =>
                HttpResponse.json({
                    success: true,
                    data: {
                        count: 2,
                        next: null,
                        results: [
                            {
                                id: '1',
                                notification_type: 'broadcast',
                                title: 'Already seen',
                                body: '',
                                is_read: true,
                                created_at: '2026-10-01T10:00:00Z',
                            },
                            {
                                id: '2',
                                notification_type: 'broadcast',
                                title: 'Fresh news',
                                body: '',
                                is_read: false,
                                created_at: '2026-10-01T11:00:00Z',
                            },
                        ],
                    },
                })
            )
        );
        render(<Messages onNavigate={vi.fn()} onOpenSidebar={vi.fn()} />);
        await waitFor(() => expect(screen.getByText('Already seen')).toBeInTheDocument());

        await userEvent.click(screen.getByRole('button', { name: /^Unread/ }));

        await waitFor(() => expect(screen.queryByText('Already seen')).not.toBeInTheDocument());
        expect(screen.getByText('Fresh news')).toBeInTheDocument();
    });
});
