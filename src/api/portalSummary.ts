import { EntityType } from '../types';
import { getCurrentPartner } from './onboarding';
import {
    getEventListings, getClassListings, getProgramListings, getVenueListings,
    getClassEnquiries, getVenueEnquiries, getProgramEnquiries,
} from './listings';
import { getCoupons } from './coupons';

// ---------------------------------------------------------------------------
// Portal summary — the partner-wide reads that the shell (sidebar badges, top
// bar identity) and the Dashboard both need. Requests are memoised for a short
// window so views mounting together share one round-trip instead of firing
// duplicate calls. Call `invalidatePortalSummary()` after writes / on logout.
// ---------------------------------------------------------------------------

const DEFAULT_MAX_AGE_MS = 60_000;

interface CacheEntry { at: number; promise: Promise<unknown> }
const cache = new Map<string, CacheEntry>();

const memo = <T>(key: string, load: () => Promise<T>, maxAgeMs = DEFAULT_MAX_AGE_MS): Promise<T> => {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < maxAgeMs) return hit.promise as Promise<T>;
    const promise = load();
    cache.set(key, { at: Date.now(), promise });
    // Never memoise a failure — the next caller retries.
    promise.catch(() => { if (cache.get(key)?.promise === promise) cache.delete(key); });
    return promise;
};

/** Drops memoised reads — all of them, or those whose key starts with `prefix`. */
export const invalidatePortalSummary = (prefix?: string): void => {
    if (!prefix) { cache.clear(); return; }
    for (const key of [...cache.keys()]) if (key.startsWith(prefix)) cache.delete(key);
};

/** Fired after the partner's profile changes so the shell can refresh identity. */
export const PARTNER_UPDATED_EVENT = 'tlb:partner-updated';
export const notifyPartnerUpdated = (): void => {
    invalidatePortalSummary('partner');
    window.dispatchEvent(new Event(PARTNER_UPDATED_EVENT));
};

const unwrap = (json: any) => json?.data ?? json;
const asList = (json: any): any[] => {
    const data = unwrap(json);
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.results) ? data.results : [];
};

const ALL_ENTITIES: EntityType[] = ['Events', 'Classes', 'Programs', 'Venues'];
// No selected categories yet (fresh session) → fall back to every type, as before.
const scopeOf = (entities: EntityType[]): EntityType[] =>
    entities.length ? ALL_ENTITIES.filter(e => entities.includes(e)) : ALL_ENTITIES;

// ── Partner ─────────────────────────────────────────────────────────────────

export const loadCurrentPartner = (maxAgeMs?: number): Promise<any> =>
    memo('partner', async () => unwrap(await getCurrentPartner()), maxAgeMs);

// ── Listings ────────────────────────────────────────────────────────────────

export type ListingState = 'live' | 'paused' | 'pending' | 'draft' | 'rejected' | 'archived';

export interface PartnerListing {
    id: string;
    title: string;
    entityType: EntityType;
    state: ListingState;
    coverUrl: string | null;
    /** First session / event start, when the listing type has one. */
    startsAt: string | null;
    reviewedAt: string | null;
    /** Admin's approval / rejection note (field name isn't formally typed yet). */
    reviewMessage: string;
}

export type ListingCounts = Record<ListingState, number> & { total: number };

/** Buckets listings by state — optionally for a single service type. */
export const countListings = (listings: PartnerListing[], entity?: EntityType): ListingCounts =>
    listings.reduce<ListingCounts>((counts, listing) => {
        if (entity && listing.entityType !== entity) return counts;
        counts.total += 1;
        counts[listing.state] += 1;
        return counts;
    }, { total: 0, live: 0, paused: 0, pending: 0, draft: 0, rejected: 0, archived: 0 });

export const reviewMessageOf = (it: any): string =>
    it?.review_message || it?.review_note || it?.review_comment || it?.admin_message ||
    it?.admin_note || it?.admin_remarks || it?.rejection_reason || it?.status_reason ||
    it?.status_message || it?.moderation_note || it?.moderation_reason ||
    it?.remarks || it?.feedback || '';

export const listingStateOf = (it: any, type: EntityType): ListingState => {
    const status = it?.status || 'draft';
    if (status === 'published') {
        // Classes carry an admin-editable `is_live` alongside `is_paused`, so both
        // must agree there; other types derive live-ness from `is_paused`.
        const isLive = type === 'Classes'
            ? it?.is_live !== false && it?.is_paused !== true
            : (it?.is_paused != null ? !it.is_paused : it?.is_live !== false);
        return isLive ? 'live' : 'paused';
    }
    if (status === 'pending' || status === 'rejected' || status === 'archived') return status;
    return 'draft';
};

const normalizeListing = (it: any, type: EntityType): PartnerListing => ({
    id: String(it?.id ?? ''),
    title: it?.title || 'Untitled',
    entityType: type,
    state: listingStateOf(it, type),
    coverUrl: it?.cover_url || it?.cover || null,
    startsAt: it?.start_datetime || it?.start_date || it?.starts_at || it?.event_date || it?.next_occurrence || null,
    reviewedAt: it?.reviewed_at || it?.approved_at || it?.rejected_at || it?.status_changed_at || it?.updated_at || it?.updated || null,
    reviewMessage: reviewMessageOf(it),
});

const LISTING_LOADERS: Record<EntityType, () => Promise<any>> = {
    Events: () => getEventListings(),
    Classes: () => getClassListings(),
    Programs: () => getProgramListings(),
    Venues: () => getVenueListings(),
};

export const loadPartnerListings = (entities: EntityType[], maxAgeMs?: number): Promise<PartnerListing[]> => {
    const scope = scopeOf(entities);
    return memo(`listings:${scope.join(',')}`, async () => {
        const results = await Promise.allSettled(scope.map(type => LISTING_LOADERS[type]()));
        return results.flatMap((r, i) =>
            r.status === 'fulfilled' ? asList(r.value).map(it => normalizeListing(it, scope[i])) : []);
    }, maxAgeMs);
};

// ── Enquiries ───────────────────────────────────────────────────────────────

export interface PartnerEnquiry {
    id: string;
    entityType: EntityType;
    status: string;
    createdAt: string | null;
}

/** An enquiry the partner hasn't acted on yet. */
export const isUnanswered = (enquiry: PartnerEnquiry): boolean => enquiry.status === 'new';

export const loadPartnerEnquiries = (entities: EntityType[], maxAgeMs?: number): Promise<PartnerEnquiry[]> => {
    // Program enquiries are only exposed per listing, so the partner-wide
    // rollup covers the two flat CRM endpoints (Classes, Venues) plus a bounded
    // fan-out over Program listings — Programs has no flat enquiries endpoint.
    const scope = scopeOf(entities).filter(e => e === 'Classes' || e === 'Venues' || e === 'Programs');
    return memo(`enquiries:${scope.join(',')}`, async () => {
        const jobs: Promise<PartnerEnquiry[]>[] = [];
        const normalize = (entityType: EntityType) => (it: any): PartnerEnquiry => ({
            id: String(it?.id ?? ''),
            entityType,
            status: String(it?.status || 'new').toLowerCase(),
            createdAt: it?.created_at || it?.created || it?.date_time || null,
        });
        if (scope.includes('Classes')) {
            jobs.push(getClassEnquiries().then(res => asList(res).map(normalize('Classes'))).catch(() => []));
        }
        if (scope.includes('Venues')) {
            jobs.push(getVenueEnquiries().then(res => asList(res).map(normalize('Venues'))).catch(() => []));
        }
        if (scope.includes('Programs')) {
            const programJobs = loadPartnerListings(['Programs'], maxAgeMs).then(listings =>
                Promise.all(listings.map(l =>
                    getProgramEnquiries(l.id).then(res => asList(res).map(normalize('Programs'))).catch(() => []))));
            jobs.push(programJobs.then(lists => lists.flat()).catch(() => []));
        }
        const results = await Promise.all(jobs);
        return results.flat();
    }, maxAgeMs);
};

// ── Coupons ─────────────────────────────────────────────────────────────────

export const loadCouponCount = (maxAgeMs?: number): Promise<number> =>
    memo('coupons', async () => (await getCoupons()).length, maxAgeMs);
