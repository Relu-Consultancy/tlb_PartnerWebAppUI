import { describe, it, expect } from 'vitest';
import { tabToQuery } from '../model';

describe('tabToQuery', () => {
    it('returns null for tabs with no real backing data', () => {
        expect(tabToQuery('business', 'all')).toBeNull();
        expect(tabToQuery('unanswered', 'all')).toBeNull();
    });

    it('returns an empty filter for "all" listings', () => {
        expect(tabToQuery('all', 'all')).toEqual({});
        expect(tabToQuery('listing', 'all')).toEqual({});
    });

    it('filters to a specific listing when one is chosen', () => {
        expect(tabToQuery('all', 'l1')).toEqual({ listing_id: 'l1' });
        expect(tabToQuery('listing', 'l1')).toEqual({ listing_id: 'l1' });
    });
});
