import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
    fmtCurrency, fmtCompact, CountUp,
    InteractiveAreaChart, InteractiveBarChart, AnimatedDonut, FunnelBars,
    AreaPoint,
} from '../StatCharts';

describe('StatCharts — fmtCurrency', () => {
    it('formats crores, lakhs, thousands, and units', () => {
        expect(fmtCurrency(10000000)).toBe('₹1.0Cr');
        expect(fmtCurrency(200000)).toBe('₹2.0L');
        expect(fmtCurrency(1500)).toBe('₹1.5K');
        expect(fmtCurrency(500)).toBe('₹500');
    });

    it('rounds before formatting', () => {
        expect(fmtCurrency(999)).toBe('₹999');
        expect(fmtCurrency(0)).toBe('₹0');
    });
});

describe('StatCharts — fmtCompact', () => {
    it('formats millions, thousands, and units', () => {
        expect(fmtCompact(1000000)).toBe('1.0M');
        expect(fmtCompact(1500)).toBe('1.5K');
        expect(fmtCompact(250)).toBe('250');
        expect(fmtCompact(0)).toBe('0');
    });
});

describe('StatCharts — CountUp', () => {
    it('eventually renders the formatted final value', async () => {
        render(<CountUp value={1240} format={fmtCompact} />);
        await waitFor(() => expect(screen.getByText('1.2K')).toBeInTheDocument(), { timeout: 2500 });
    });

    it('appends a suffix when provided', async () => {
        render(<CountUp value={42} suffix="%" />);
        await waitFor(() => expect(screen.getByText('42%')).toBeInTheDocument(), { timeout: 2500 });
    });
});

describe('StatCharts — InteractiveAreaChart', () => {
    const points: AreaPoint[] = [
        { label: 'Dec', value: 30 },
        { label: 'Jan', value: 45 },
        { label: 'Feb', value: 60 },
    ];

    it('renders an SVG polyline with enough data', () => {
        const { container } = render(<InteractiveAreaChart points={points} color="#000" id="t1" />);
        expect(container.querySelector('svg')).toBeInTheDocument();
        expect(container.querySelector('polyline')).toBeInTheDocument();
    });

    it('shows a placeholder when fewer than 2 points', () => {
        render(<InteractiveAreaChart points={[{ label: 'Dec', value: 1 }]} color="#000" id="t2" />);
        expect(screen.getByText(/not enough data/i)).toBeInTheDocument();
    });

    it('renders x-axis labels', () => {
        render(<InteractiveAreaChart points={points} color="#000" id="t3" />);
        expect(screen.getByText('Dec')).toBeInTheDocument();
        expect(screen.getByText('Feb')).toBeInTheDocument();
    });
});

describe('StatCharts — InteractiveBarChart', () => {
    it('renders one label per bar', () => {
        const points = [
            { label: 'Mon', value: 5 },
            { label: 'Tue', value: 8 },
            { label: 'Wed', value: 3 },
        ];
        render(<InteractiveBarChart points={points} color="#000" />);
        expect(screen.getByText('Mon')).toBeInTheDocument();
        expect(screen.getByText('Tue')).toBeInTheDocument();
        expect(screen.getByText('Wed')).toBeInTheDocument();
    });
});

describe('StatCharts — AnimatedDonut', () => {
    it('renders the center label and sub-label', () => {
        render(
            <AnimatedDonut
                segments={[
                    { value: 67, color: '#10B981', label: 'Occupied' },
                    { value: 33, color: '#eee', label: 'Available' },
                ]}
                centerLabel="67%"
                centerSub="Occupied"
            />
        );
        expect(screen.getByText('67%')).toBeInTheDocument();
        expect(screen.getByText('Occupied')).toBeInTheDocument();
    });
});

describe('StatCharts — FunnelBars', () => {
    it('renders each stage with its label and value', () => {
        render(
            <FunnelBars
                stages={[
                    { label: 'New Leads', value: 100, color: '#3B82F6' },
                    { label: 'Contacted', value: 60, color: '#FACC15' },
                    { label: 'Converted', value: 25, color: '#10B981' },
                ]}
            />
        );
        expect(screen.getByText('New Leads')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Converted')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('shows the drop-off percentage between stages', () => {
        render(
            <FunnelBars
                stages={[
                    { label: 'New Leads', value: 100, color: '#3B82F6' },
                    { label: 'Contacted', value: 60, color: '#FACC15' },
                ]}
            />
        );
        // 60 / 100 = 60%
        expect(screen.getByText('60%')).toBeInTheDocument();
    });
});
