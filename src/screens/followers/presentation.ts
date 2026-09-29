import { FollowerOrdering, GenderFilter } from './types';

// ---------------------------------------------------------------------------
// Label vocabulary for the Followers screen — every option here maps to a real
// query the API accepts (`gender`, `ordering`), nothing decorative.
// ---------------------------------------------------------------------------

export const GENDER_LABEL: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
    prefer_not_to_say: 'Prefer not to say',
};

export const GENDER_OPTIONS: { value: GenderFilter; label: string }[] = [
    { value: '', label: 'All genders' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const ORDERING_OPTIONS: { value: FollowerOrdering; label: string }[] = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'name', label: 'Name A–Z' },
];

export const genderLabel = (gender: string | null): string | null => (gender ? GENDER_LABEL[gender] || gender : null);
