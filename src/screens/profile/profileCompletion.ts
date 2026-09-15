// Profile completeness — the ten things that make a partner's public page
// feel finished. Kept pure so the Profile screen and tests share one rule.

export interface CompletionInput {
    hasCover: boolean;
    hasLogo: boolean;
    hasGallery: boolean;
    businessName: string;
    bio: string;
    contactNumber: string;
    address: string;
    websiteUrl: string;
    instagramUrl: string;
    facebookUrl: string;
}

export const computeProfileCompletion = (input: CompletionInput): number => {
    const checks = [
        input.hasCover,
        input.hasLogo,
        input.hasGallery,
        ...[
            input.businessName, input.bio, input.contactNumber, input.address,
            input.websiteUrl, input.instagramUrl, input.facebookUrl,
        ].map(value => value.trim().length > 0),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};
