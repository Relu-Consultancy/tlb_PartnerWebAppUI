import { useCallback, useEffect, useState } from 'react';
import { EntityType } from '../../types';
import { ListingState, listingStateOf, reviewMessageOf } from '../../api/portalSummary';
import {
    getEventListings, getVenueListings, getClassListings, getProgramListings,
    getListingDetail, getVenueListingDetail, getClassListingDetail, getProgramListingDetail,
    pauseListing, resumeListing, archiveListing, unarchiveListing, setClassListingLive,
} from '../../api/listings';
import { toast } from '../../components/ui';
import { enrichFromDetail, modelOf, synthListingCode } from './model';
import { ListingRow } from './types';

// ---------------------------------------------------------------------------
// Loads every listing across the partner's allowed service types, then
// enriches each row with its per-listing detail (price, capacity, location,
// booking model, next slot) — a bounded fan-out, one call per listing, since
// none of these fields are on the flat list endpoints. Rows render as soon as
// the flat lists resolve; enrichment fills in a moment later.
// ---------------------------------------------------------------------------

const LIST_LOADERS: Record<EntityType, () => Promise<any>> = {
    Events: () => getEventListings(),
    Classes: () => getClassListings(),
    Programs: () => getProgramListings(),
    Venues: () => getVenueListings(),
};

const DETAIL_LOADERS: Record<EntityType, (id: string) => Promise<any>> = {
    Events: getListingDetail,
    Classes: getClassListingDetail,
    Programs: getProgramListingDetail,
    Venues: getVenueListingDetail,
};

const unwrap = (json: any) => json?.data ?? json;
const asList = (json: any): any[] => {
    const data = unwrap(json);
    return Array.isArray(data) ? data : (data?.results ?? []);
};

interface State {
    loading: boolean;
    rows: ListingRow[];
    error: string | null;
}

export const useListingsData = (allowedEntities: EntityType[]) => {
    const [state, setState] = useState<State>({ loading: true, rows: [], error: null });
    const scopeKey = allowedEntities.join(',');

    const load = useCallback(async () => {
        setState({ loading: true, rows: [], error: null });
        const now = new Date();
        try {
            const results = await Promise.allSettled(allowedEntities.map(type => LIST_LOADERS[type]()));
            const rawRows: { item: any; entityType: EntityType }[] = [];
            let firstError: string | null = null;
            results.forEach((r, i) => {
                if (r.status === 'fulfilled') asList(r.value).forEach(item => rawRows.push({ item, entityType: allowedEntities[i] }));
                else {
                    console.error(`Listings load failed for ${allowedEntities[i]}`, r.reason);
                    firstError = firstError || (r.reason as any)?.message || 'Failed to load listings.';
                }
            });

            if (rawRows.length === 0 && firstError) {
                setState({ loading: false, rows: [], error: firstError });
                return;
            }

            const baseRows: ListingRow[] = rawRows.map(({ item, entityType }) => ({
                id: String(item?.id ?? ''),
                title: item?.title || 'Untitled',
                entityType,
                code: synthListingCode(String(item?.id ?? '')),
                state: listingStateOf(item, entityType),
                coverUrl: item?.cover_url || item?.cover || null,
                createdAt: item?.created_at || item?.created || null,
                reviewMessage: reviewMessageOf(item),
                startsAt: item?.start_datetime || item?.start_date || item?.starts_at || item?.event_date || item?.next_occurrence || null,
                enriched: false,
                model: entityType === 'Events' ? 'ticketed' : 'enquiry',
                priceLabel: '—',
                capacityLabel: '—',
                location: '—',
                category: item?.category?.name || item?.subcategory?.name || '',
                description: '',
                galleryUrls: [],
            }));

            setState({ loading: false, rows: baseRows, error: null });

            const detailResults = await Promise.allSettled(baseRows.map(row => DETAIL_LOADERS[row.entityType](row.id)));
            setState(s => ({
                ...s,
                rows: s.rows.map((row, i) => {
                    const res = detailResults[i];
                    if (res.status !== 'fulfilled') return { ...row, enriched: true };
                    const raw = unwrap(res.value);
                    return {
                        ...row,
                        enriched: true,
                        model: modelOf(row.entityType, raw),
                        ...enrichFromDetail(row.entityType, raw, row.startsAt, now),
                    };
                }),
            }));
        } catch (err: any) {
            console.error('Listings load failed', err);
            setState({ loading: false, rows: [], error: err?.message || 'Failed to load listings.' });
        }
    }, [scopeKey]);

    useEffect(() => { load(); }, [load]);

    const patch = (id: string, changes: Partial<ListingRow>) =>
        setState(s => ({ ...s, rows: s.rows.map(r => r.id === id ? { ...r, ...changes } : r) }));

    // Pause/resume goes through the generic, entity-agnostic action routes.
    // Classes are the exception: their status is read from `is_live`, a field
    // the generic route doesn't touch, so they also flip it directly — see the
    // identical note in the (now-retired) legacy ServiceListings screen.
    const togglePause = async (row: ListingRow) => {
        const wasPaused = row.state === 'paused';
        const prevState = row.state;
        patch(row.id, { state: wasPaused ? 'live' : 'paused' });
        try {
            if (wasPaused) await resumeListing(row.id); else await pauseListing(row.id);
            if (row.entityType === 'Classes') await setClassListingLive(row.id, wasPaused);
        } catch (err: any) {
            patch(row.id, { state: prevState });
            toast.error(err?.message || 'Couldn’t update the listing status. Please try again.');
        }
    };

    const toggleArchive = async (row: ListingRow) => {
        const wasArchived = row.state === 'archived';
        const prevState = row.state;
        const nextState: ListingState = wasArchived ? 'draft' : 'archived';
        patch(row.id, { state: nextState });
        try {
            if (wasArchived) await unarchiveListing(row.id); else await archiveListing(row.id);
        } catch (err: any) {
            patch(row.id, { state: prevState });
            toast.error(err?.message || 'Couldn’t update the listing. Please try again.');
        }
    };

    return { loading: state.loading, rows: state.rows, error: state.error, reload: load, togglePause, toggleArchive };
};
