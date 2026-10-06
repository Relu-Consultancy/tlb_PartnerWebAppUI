import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ListingsTable } from '../components/ListingsTable';
import { ListingRow } from '../types';

const row = (overrides: Partial<ListingRow> = {}): ListingRow =>
    ({
        id: 'l1',
        title: 'Hip-hop Choreography for Teens',
        entityType: 'Classes',
        code: 'LST-103118',
        state: 'pending',
        coverUrl: null,
        createdAt: null,
        reviewMessage: null,
        startsAt: null,
        enriched: true,
        model: 'enquiry',
        priceLabel: 'Rs 499',
        capacityLabel: '—',
        location: '—',
        category: '',
        description: '',
        galleryUrls: [],
        isRefundable: false,
        ...overrides,
    }) as ListingRow;

const props = {
    rows: [row(), row({ id: 'l2', title: 'Yoga Basics', code: 'LST-103119', state: 'live', isRefundable: true })],
    demandOf: () => ({ label: '0 enquiries' }) as any,
    now: new Date(2026, 9, 6),
    onOpen: vi.fn(),
    onEdit: vi.fn(),
    onTogglePause: vi.fn(),
    onToggleArchive: vi.fn(),
};

const phone = (matches: boolean) => {
    window.matchMedia = vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }) as unknown as MediaQueryList);
};

afterEach(() => {
    delete (window as any).matchMedia;
});

describe('My listings on a phone (QA: titles vanished, the table only scrolled sideways)', () => {
    it('shows each listing as a card with its full title, code, service and actions', () => {
        phone(true);
        render(<ListingsTable {...props} />);
        const cards = screen.getByLabelText('Listings');
        expect(within(cards).getByText('Hip-hop Choreography for Teens')).toBeInTheDocument();
        expect(within(cards).getByText('LST-103118')).toBeInTheDocument();
        expect(within(cards).getAllByText('Class')).toHaveLength(2);
        expect(within(cards).getByText('Non-refundable')).toBeInTheDocument();
        expect(within(cards).getByRole('button', { name: 'Archive' })).toBeInTheDocument();
        expect(document.querySelector('[class*="min-w-[820px]"]')).toBeNull();
    });
});

describe('My listings table (QA: titles shrank to one letter on a laptop)', () => {
    it('gives the title column a 180px minimum, with the code under the title', () => {
        phone(false);
        render(<ListingsTable {...props} />);
        expect(screen.queryByLabelText('Listings')).not.toBeInTheDocument();
        const table = document.querySelector('[class*="min-w-[820px]"]') as HTMLElement;
        expect(table.className).toContain('minmax(180px,1fr)');
        // No separate Code / Model columns any more — they sit under title and service.
        expect(screen.queryByText('Code')).not.toBeInTheDocument();
        const title = screen.getByText('Hip-hop Choreography for Teens');
        expect(title.parentElement).toHaveTextContent('LST-103118');
        expect(title.className).toContain('line-clamp-2');
    });
});
