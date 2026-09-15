import { describe, it, expect } from 'vitest';
import { ACCOUNT_REGEX, IFSC_REGEX, verticalAmounts } from '../model';

describe('verticalAmounts', () => {
    it('labels known types and sorts by amount desc', () => {
        const rows = verticalAmounts([
            { type: 'class', amount: '10000', count: 5 },
            { type: 'event', amount: '62400', count: 20 },
        ]);
        expect(rows).toEqual([
            { label: 'Events', amount: 62400 },
            { label: 'Classes', amount: 10000 },
        ]);
    });

    it('capitalizes an unrecognized type', () => {
        expect(verticalAmounts([{ type: 'bundle', amount: '100', count: 1 }])[0].label).toBe('Bundle');
    });
});

describe('ACCOUNT_REGEX / IFSC_REGEX', () => {
    it('accepts a valid 9-18 digit account number', () => {
        expect(ACCOUNT_REGEX.test('123456789')).toBe(true);
        expect(ACCOUNT_REGEX.test('12345678')).toBe(false);
        expect(ACCOUNT_REGEX.test('1234567890123456789')).toBe(false);
    });

    it('accepts a valid IFSC code shape', () => {
        expect(IFSC_REGEX.test('HDFC0001234')).toBe(true);
        expect(IFSC_REGEX.test('HDFC1001234')).toBe(false);
        expect(IFSC_REGEX.test('hdfc0001234')).toBe(false);
    });
});
