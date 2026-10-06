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

/**
 * The backend's own gate for coupons and stats/* is `status === 'approved'`
 * (IsApprovedPartner). `is_verified` is a separate admin flag that is routinely
 * ticked on partners still sitting at `activated_limited`, so it must never
 * stand in for approval — `verificationOf` below keeps treating it as a
 * display signal, but access decisions use this.
 */
export const isApprovedPartner = (partner: any): boolean => String(partner?.status ?? '') === 'approved';

export const verificationOf = (partner: any): VerificationState => {
    const status = String(partner?.status ?? '');
    // Status is the authority. `is_verified` is only consulted when a payload
    // omits status entirely, because admins tick it on partners still sitting
    // at `activated_limited` — reading it first made the portal claim "Verified
    // Partner" on accounts TLB hadn't approved.
    if (!status) return partner?.is_verified === true ? 'verified' : 'pending';
    if (status === 'approved') return 'verified';
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

const ENTITY_BY_KEY: Record<string, EntityType> = {
    event: 'Events',
    events: 'Events',
    class: 'Classes',
    classes: 'Classes',
    program: 'Programs',
    programs: 'Programs',
    venue: 'Venues',
    venues: 'Venues',
};

/**
 * The service types a partner offers, from `partner.categories`. Names are
 * matched case- and plural-insensitively and anything unrecognised is dropped:
 * a raw name that isn't exactly an EntityType silently fails every route
 * guard and hides the service from the sidebar.
 */
export const entitiesFromPartner = (partner: any): EntityType[] => {
    const raw: unknown[] = Array.isArray(partner?.categories) ? partner.categories : [];
    const found = raw.map((c: any) => toEntityType(c?.name ?? c)).filter((e): e is EntityType => !!e);
    return ENTITY_ORDER.filter((e) => found.includes(e));
};

/** "events", "Event", " Venues " → the EntityType it names; anything else → null. */
export const toEntityType = (name: unknown): EntityType | null =>
    ENTITY_BY_KEY[
        String(name ?? '')
            .trim()
            .toLowerCase()
    ] ?? null;

/**
 * Only real service types, each once. Every screen looks loaders up by these
 * (`LIST_LOADERS[type]()`), so one stray value — a raw backend name like
 * "events" — crashed My listings with "Ze[n] is not a function".
 */
export const sanitizeEntities = (list: unknown): EntityType[] => {
    if (!Array.isArray(list)) return [];
    const out: EntityType[] = [];
    for (const item of list) {
        const e = toEntityType(item);
        if (e && !out.includes(e)) out.push(e);
    }
    return out;
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

export const orderEntities = (entities: EntityType[]): EntityType[] => ENTITY_ORDER.filter((e) => entities.includes(e));

export const serviceMixLabel = (entities: EntityType[]): string | null => (entities.length > 1 ? 'Multi-service' : (entities[0] ?? null));
