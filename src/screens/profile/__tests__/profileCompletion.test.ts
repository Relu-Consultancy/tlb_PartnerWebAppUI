import { describe, it, expect } from 'vitest';
import { computeProfileCompletion, CompletionInput } from '../profileCompletion';

const empty: CompletionInput = {
    hasCover: false, hasLogo: false, hasGallery: false,
    businessName: '', bio: '', contactNumber: '', address: '',
    websiteUrl: '', instagramUrl: '', facebookUrl: '',
};

describe('computeProfileCompletion', () => {
    it('is 0 for an empty profile and 100 when every item is filled', () => {
        expect(computeProfileCompletion(empty)).toBe(0);
        expect(computeProfileCompletion({
            hasCover: true, hasLogo: true, hasGallery: true,
            businessName: 'Aviraj Studio', bio: 'Art studio', contactNumber: '+91 98450 22119',
            address: 'Indiranagar', websiteUrl: 'https://a.in', instagramUrl: 'https://ig', facebookUrl: 'https://fb',
        })).toBe(100);
    });

    it('ignores whitespace-only text', () => {
        expect(computeProfileCompletion({ ...empty, businessName: 'Aviraj Studio', bio: '   ', hasLogo: true })).toBe(20);
    });
});
