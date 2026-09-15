// ---------------------------------------------------------------------------
// Deep links into the My Profile screen's sections. Navigation carries no
// params, so a request is parked in sessionStorage for the screen to consume
// on mount, and also broadcast for a profile screen that's already open.
// ---------------------------------------------------------------------------

export const PROFILE_SECTIONS = ['business', 'media', 'services', 'documents', 'bank', 'notifications'] as const;
export type ProfileSectionId = typeof PROFILE_SECTIONS[number];

export const PROFILE_SECTION_EVENT = 'tlb:profile-section';
const STORAGE_KEY = 'tlb:profileSection';

const isProfileSection = (value: unknown): value is ProfileSectionId =>
    (PROFILE_SECTIONS as readonly string[]).includes(String(value));

export const requestProfileSection = (id: ProfileSectionId): void => {
    try { sessionStorage.setItem(STORAGE_KEY, id); } catch { /* storage unavailable — event still fires */ }
    window.dispatchEvent(new Event(PROFILE_SECTION_EVENT));
};

/** Returns the pending section (once) and clears it. */
export const consumeProfileSection = (): ProfileSectionId | null => {
    try {
        const value = sessionStorage.getItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        return isProfileSection(value) ? value : null;
    } catch {
        return null;
    }
};
