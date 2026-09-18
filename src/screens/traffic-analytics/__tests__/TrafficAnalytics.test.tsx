import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { TrafficAnalytics } from '../TrafficAnalytics';

const BASE = 'https://tlb-api.reluconsultancy.in';
const mockNavigate = vi.fn();

const renderScreen = () => render(<TrafficAnalytics onNavigate={mockNavigate} />);

beforeEach(() => { mockNavigate.mockClear(); });

describe('TrafficAnalytics', () => {
    it('shows the real headline totals and source breakdown', async () => {
        renderScreen();
        await waitFor(() => expect(screen.getByText('340')).toBeInTheDocument());
        expect(screen.getByText('210')).toBeInTheDocument();
        expect(screen.getByText('28')).toBeInTheDocument();
        expect(screen.getByText('Instagram')).toBeInTheDocument();
        expect(screen.getByText('Organic / direct')).toBeInTheDocument();
    });

    it('shows the by-day detail table by default', async () => {
        renderScreen();
        await waitFor(() => expect(screen.getByText('Detailed metrics')).toBeInTheDocument());
        expect(await screen.findByText('Showing 3 of 3 days')).toBeInTheDocument();
    });

    it('switches to the by-listing detail table', async () => {
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Detailed metrics'));
        await user.click(screen.getByRole('tab', { name: 'By listing' }));
        expect(await screen.findByText('Beginners Pottery')).toBeInTheDocument();
        expect(screen.getByText('Studio Rental — Hourly')).toBeInTheDocument();
    });

    it('shows an error banner when the traffic summary fails to load', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/stats/traffic/`, () => HttpResponse.json({}, { status: 500 })));
        renderScreen();
        await waitFor(() => expect(screen.getByText(/failed to load traffic stats/i)).toBeInTheDocument());
    });

    it('requires both custom dates before loading a custom range', async () => {
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Detailed metrics'));
        await user.click(screen.getByRole('button', { name: /traffic period/i }));
        await user.click(screen.getByRole('option', { name: 'Custom range' }));
        expect(screen.getByText(/pick both a start and end date/i)).toBeInTheDocument();
    });
});
