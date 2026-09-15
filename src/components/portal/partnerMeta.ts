import { EntityType } from '../../types';
import { parseDate } from '../../utils/format';
import type { Tone } from './primitives';

// ---------------------------------------------------------------------------
// Partner identity + service-type metadata shared by the shell and screens.
// ---------------------------------------------------------------------------

export type VerificationState = 'verified' | 'in_review' | 'pending';

export interface PartnerIdentity {
    name: string;
    email: string;
    phone: string;
    /** Public partner code (e.g. TLB-10428) when the backend provides one. */
    code: string | null;
    verification: VerificationState;
    verificationLabel: string;
    /** "Mar 2025" */
    memberSince: string | null;
    city: string | null;
}

const VERIFICATION_LABEL: Record<VerificationState, string> = {
    verified: 'Verified',
    in_review: 'In review',
    pending: 'Verification pending',
};

export const VERIFICATION_TONE: Record<VerificationState, Tone> = {
    verified: 'green',
    in_review: 'blue',
    pending: 'amber',
};

export const verificationOf = (partner: any): VerificationState => {
    const status = partner?.status || '';
    if (partner?.is_verified === true || status === 'approved') return 'verified';
    if (status === 'under_review') return 'in_review';
    return 'pending';
};

export const describePartner = (partner: any): PartnerIdentity => {
    const verification = verificationOf(partner);
    const joined = parseDate(partner?.created_at ?? partner?.date_joined ?? partner?.joined_at);
    return {
        name: partner?.business_name || partner?.business_profile?.business_name || 'Your business',
        email: partner?.email || '',
        phone: partner?.phone || partner?.phone_number || '',
        code: partner?.partner_code || partner?.tlb_id || partner?.code || null,
        verification,
        verificationLabel: VERIFICATION_LABEL[verification],
        memberSince: joined ? joined.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : null,
        city: partner?.base_city || partner?.business_profile?.base_city || partner?.city || null,
    };
};

/** Display order for service types (matches the mocks). */
export const ENTITY_ORDER: EntityType[] = ['Events', 'Venues', 'Classes', 'Programs'];

export const ENTITY_TONE: Record<EntityType, Tone> = {
    Events: 'amber',
    Classes: 'blue',
    Programs: 'purple',
    Venues: 'green',
};

/** Services customers book and pay for on TLB; the others are enquiry-led. */
export const isTicketed = (entity: EntityType): boolean => entity === 'Events' || entity === 'Venues';

export const orderEntities = (entities: EntityType[]): EntityType[] =>
    ENTITY_ORDER.filter(e => entities.includes(e));

export const serviceMixLabel = (entities: EntityType[]): string | null =>
    entities.length > 1 ? 'Multi-service' : entities[0] ?? null;
