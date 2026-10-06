import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockStatsTraffic } from '../../../../test/msw/handlers';
import { TrafficSourcesCard } from '../TrafficSourcesCard';

// The card is hidden on the Analytics screen until the traffic API is live
// (see Analytics.tsx). These keep it working for when it comes back.
describe('TrafficSourcesCard', () => {
    it('shows real traffic-source shares and links to the full traffic report', async () => {
        const onViewDetail = vi.fn();
        render(<TrafficSourcesCard traffic={mockStatsTraffic as any} topCity={null} onViewDetail={onViewDetail} />);
        expect(screen.getByText('Instagram')).toBeInTheDocument();
        expect(screen.getByText('Organic / direct')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /full report/i }));
        expect(onViewDetail).toHaveBeenCalled();
    });

    it('shows the real Top city tile with the known-location caveat, not an all-bookings percentage', () => {
        render(
            <TrafficSourcesCard traffic={mockStatsTraffic as any} topCity={{ city: 'Bengaluru', pct: 86 } as any} onViewDetail={vi.fn()} />
        );
        expect(screen.getByText('Top city')).toBeInTheDocument();
        expect(screen.getByText('Bengaluru')).toBeInTheDocument();
        expect(screen.getByText(/86% of bookings with known location/i)).toBeInTheDocument();
    });

    it('hides the Top city tile entirely when no booking has a resolved city yet', () => {
        render(<TrafficSourcesCard traffic={mockStatsTraffic as any} topCity={null} onViewDetail={vi.fn()} />);
        expect(screen.getByText('Peak day')).toBeInTheDocument();
        expect(screen.queryByText('Top city')).not.toBeInTheDocument();
    });
});
