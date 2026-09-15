import { useCallback, useEffect, useState } from 'react';
import { EntityType, EnquiryStatus } from '../../types';
import { loadPartnerListings, PartnerListing } from '../../api/portalSummary';
import {
    getClassEnquiries, getVenueEnquiries, getProgramEnquiries,
    updateClassEnquiry, updateVenueEnquiry, updateProgramEnquiry,
    unlockClassEnquiry, unlockVenueEnquiry,
} from '../../api/listings';
import { toast } from '../../components/ui';
import { EnquiryEntity, EnquiryEntry } from './types';

// ---------------------------------------------------------------------------
// Loads and mutates enquiries across Classes, Programs and Venues. Programs
// has no flat endpoint, so it fans out per Program listing (bounded by the
// partner's own listing count — same pattern as `portalSummary`).
// ---------------------------------------------------------------------------

const unwrapList = (res: any): any[] => {
    const data = res?.data ?? res;
    return Array.isArray(data) ? data : (data?.results ?? []);
};

const pick = (...values: unknown[]): string => {
    const found = values.find(v => v !== undefined && v !== null && String(v).trim() !== '');
    return found === undefined ? '' : String(found);
};

const TITLE_KEYS: Record<EnquiryEntity, string[]> = {
    Classes: ['class_title'],
    Programs: ['program_title'],
    Venues: ['venue_title', 'listing_title'],
};
const LISTING_ID_KEYS: Record<EnquiryEntity, string[]> = {
    Classes: ['class_id', 'class'],
    Programs: [],
    Venues: ['venue_id', 'venue', 'listing_id'],
};

const normalize = (entity: EnquiryEntity, raw: any, listingId?: string): EnquiryEntry => ({
    id: String(raw?.id ?? ''),
    entity,
    listingId: listingId ?? pick(...LISTING_ID_KEYS[entity].map(k => raw?.[k])),
    listingTitle: pick(...TITLE_KEYS[entity].map(k => raw?.[k])) || 'Untitled listing',
    name: pick(raw?.attendee_name, raw?.student_name, raw?.parent_name, raw?.contact_name, raw?.customer_name, raw?.name) || 'Unknown',
    detail: pick(raw?.batch_name, raw?.student_age != null ? `Age ${raw.student_age}` : '', raw?.occasion),
    contact: entity === 'Programs'
        ? pick(raw?.contact_number, raw?.mobile) || 'Hidden'
        : (raw?.is_contact_unlocked ? pick(raw?.mobile, raw?.contact_number) || 'Hidden' : 'Hidden'),
    isUnlocked: entity === 'Programs' ? true : !!raw?.is_contact_unlocked,
    status: (pick(raw?.status) || 'new') as EnquiryStatus,
    message: pick(raw?.message),
    notes: pick(raw?.internal_notes, raw?.partner_note),
    createdAt: pick(raw?.created_at) || null,
});

interface State {
    loading: boolean;
    entries: EnquiryEntry[];
    listingsById: Map<string, PartnerListing>;
}

export const useEnquiriesData = (allowedEntities: EntityType[]) => {
    const [state, setState] = useState<State>({ loading: true, entries: [], listingsById: new Map() });
    const scope: EnquiryEntity[] = (['Classes', 'Programs', 'Venues'] as EnquiryEntity[])
        .filter(e => allowedEntities.length === 0 || allowedEntities.includes(e));
    const scopeKey = scope.join(',');

    const load = useCallback(async () => {
        setState(s => ({ ...s, loading: true }));
        const programListings = scope.includes('Programs') ? loadPartnerListings(['Programs']) : Promise.resolve([]);
        const jobs: Promise<EnquiryEntry[]>[] = [];
        if (scope.includes('Classes')) {
            jobs.push(getClassEnquiries().then(res => unwrapList(res).map(r => normalize('Classes', r))).catch(() => []));
        }
        if (scope.includes('Venues')) {
            jobs.push(getVenueEnquiries().then(res => unwrapList(res).map(r => normalize('Venues', r))).catch(() => []));
        }
        if (scope.includes('Programs')) {
            jobs.push(
                programListings.then(listings =>
                    Promise.all(listings.map(l =>
                        getProgramEnquiries(l.id).then(res => unwrapList(res).map(r => normalize('Programs', r, l.id))).catch(() => [])))
                ).then(lists => lists.flat()).catch(() => []),
            );
        }
        const [results, allListings] = await Promise.all([
            Promise.all(jobs),
            loadPartnerListings(scope as EntityType[]),
        ]);
        setState({ loading: false, entries: results.flat(), listingsById: new Map(allListings.map(l => [l.id, l])) });
    }, [scopeKey]);

    useEffect(() => { load(); }, [load]);

    const patch = (id: string, entity: EnquiryEntity, changes: Partial<EnquiryEntry>) =>
        setState(s => ({ ...s, entries: s.entries.map(e => (e.id === id && e.entity === entity) ? { ...e, ...changes } : e) }));

    const updateStatus = async (entry: EnquiryEntry, status: EnquiryStatus) => {
        const prev = entry.status;
        patch(entry.id, entry.entity, { status });
        try {
            if (entry.entity === 'Classes') await updateClassEnquiry(entry.id, { status });
            else if (entry.entity === 'Venues') await updateVenueEnquiry(entry.id, { status });
            else await updateProgramEnquiry(entry.listingId, Number(entry.id), { status });
        } catch (err: any) {
            patch(entry.id, entry.entity, { status: prev });
            toast.error(err?.message || 'Couldn’t update the enquiry status. Please try again.');
        }
    };

    const updateNotes = async (entry: EnquiryEntry, notes: string) => {
        const prev = entry.notes;
        patch(entry.id, entry.entity, { notes });
        try {
            if (entry.entity === 'Classes') await updateClassEnquiry(entry.id, { internal_notes: notes });
            else if (entry.entity === 'Venues') await updateVenueEnquiry(entry.id, { internal_notes: notes });
            else await updateProgramEnquiry(entry.listingId, Number(entry.id), { partner_note: notes });
        } catch (err: any) {
            patch(entry.id, entry.entity, { notes: prev });
            toast.error(err?.message || 'Couldn’t save your note. Please try again.');
        }
    };

    const unlock = async (entry: EnquiryEntry) => {
        try {
            const res = entry.entity === 'Classes' ? await unlockClassEnquiry(entry.id) : await unlockVenueEnquiry(entry.id);
            const data = res?.data ?? res;
            patch(entry.id, entry.entity, { isUnlocked: !!data?.is_contact_unlocked, contact: pick(data?.mobile, data?.contact_number) || 'Hidden' });
        } catch (err: any) {
            toast.error(err?.message || 'Couldn’t unlock the contact. Please try again.');
        }
    };

    return { loading: state.loading, entries: state.entries, listingsById: state.listingsById, reload: load, updateStatus, updateNotes, unlock };
};
