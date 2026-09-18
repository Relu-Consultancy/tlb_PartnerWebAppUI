import { describe, it, expect } from 'vitest';
import { formatRupees, formatRupeesCompact, initialsOf, joinWithAmpersand, timeAgo, toNumber } from '../format';

describe('format helpers', () => {
    it('parses API decimals defensively', () => {
        expect(toNumber('24500.00')).toBe(24500);
        expect(toNumber(null)).toBe(0);
        expect(toNumber('abc')).toBe(0);
    });

    it('formats rupees in the Indian grouping, compacting lakhs and crores', () => {
        expect(formatRupees(105910)).toBe('Rs 1,05,910');
        expect(formatRupeesCompact(62400)).toBe('Rs 62,400');
        expect(formatRupeesCompact(105000)).toBe('Rs 1.05L');
        expect(formatRupeesCompact(100000)).toBe('Rs 1L');
        expect(formatRupeesCompact(24_000_000)).toBe('Rs 2.4Cr');
    });

    it('describes elapsed time', () => {
        const now = new Date('2026-09-15T10:00:00Z');
        expect(timeAgo('2026-09-15T09:48:00Z', now)).toBe('12m ago');
        expect(timeAgo('2026-09-15T05:00:00Z', now)).toBe('5h ago');
        expect(timeAgo('not a date', now)).toBe('');
    });

    it('builds initials and readable lists', () => {
        expect(initialsOf('Aviraj Studio')).toBe('AS');
        expect(initialsOf('tlb')).toBe('TL');
        expect(joinWithAmpersand(['Events', 'Classes', 'Venues'])).toBe('Events, Classes & Venues');
        expect(joinWithAmpersand(['Events'])).toBe('Events');
    });
});
