import React, { useEffect, useState } from 'react';
import { EntityType, Screen } from '../../types';
import { ListingState } from '../../api/portalSummary';
import { getStatsRevenue } from '../../api/stats';
import { setCurrentDraftId, clearCurrentDraftId, setCurrentVenueDraftId, clearCurrentVenueDraftId, setCurrentClassDraftId, clearCurrentClassDraftId, setCurrentProgramDraftId, clearCurrentProgramDraftId } from '../../api/listings';
import { usePartner } from '../../context/PartnerContext';
import { getDateRangeOption } from '../../constants/dateRange';
import { EntityPickerSheet, createListingScreen } from '../../components/EntityPickerSheet';
import { requestProfileSection } from '../../constants/profileSections';
import { ListingStatusFilter, SearchField, SegBar } from '../../components/portal';
import { Skeleton } from '../../components/ui';
import { formatCount } from '../../utils/format';
import { useEnquiriesData } from '../bookings-enquiries/useEnquiriesData';
import { useBookingsData } from '../bookings-enquiries/useBookingsData';
import { useListingsData } from './useListingsData';
import { demandOf, filterListings, listingStateCounts } from './model';
import { ListingRow } from './types';
import { SCOPE_HINT, SERVICE_LABEL } from './presentation';
import { PendingBanner } from './components/PendingBanner';
import { StatsStrip } from './components/StatsStrip';
import { ListingsTable } from './components/ListingsTable';
import { ListingDetailModal } from './components/ListingDetailModal';

interface Props {
    onNavigate: (screen: Screen) => void;
}

const EDIT_SCREEN: Record<EntityType, Screen> = {
    Events: 'CREATE_EVENT_DETAILS',
    Venues: 'CREATE_VENUE_DETAILS',
    Classes: 'CREATE_CLASS_IDENTITY',
    Programs: 'CREATE_PROGRAM_IDENTITY',
};

const setDraftId: Record<EntityType, (id: string) => void> = {
    Events: setCurrentDraftId,
    Venues: setCurrentVenueDraftId,
    Classes: setCurrentClassDraftId,
    Programs: setCurrentProgramDraftId,
};

const clearAllDraftIds = () => {
    clearCurrentDraftId(); clearCurrentVenueDraftId(); clearCurrentClassDraftId(); clearCurrentProgramDraftId();
};

const SkeletonBody: React.FC = () => (
    <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4" aria-busy="true" aria-label="Loading listings">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 rounded-[14px]" />
        <Skeleton className="h-72 rounded-[14px]" />
    </div>
);

export const ServiceListings: React.FC<Props> = ({ onNavigate }) => {
    const { allowedEntities, dateRange } = usePartner();
    const [scope, setScope] = useState<EntityType | 'all'>('all');
    const [status, setStatus] = useState<ListingState | 'any'>('any');
    const [search, setSearch] = useState('');
    const [selectedRow, setSelectedRow] = useState<ListingRow | null>(null);
    const [showEntityPicker, setShowEntityPicker] = useState(false);
    const [settled, setSettled] = useState<number | null>(null);
    const now = new Date();

    const listings = useListingsData(allowedEntities);
    const enquiries = useEnquiriesData(allowedEntities);
    const bookings = useBookingsData(allowedEntities);

    useEffect(() => {
        let cancelled = false;
        getStatsRevenue(dateRange).then(r => { if (!cancelled) setSettled(Number(r.net_earnings) || 0); }).catch(() => { if (!cancelled) setSettled(null); });
        return () => { cancelled = true; };
    }, [dateRange]);

    if (listings.loading) return <SkeletonBody />;

    if (listings.error) {
        return (
            <div className="px-4 sm:px-[26px] pt-5 pb-9">
                <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{listings.error}</div>
            </div>
        );
    }

    const counts = listingStateCounts(listings.rows);
    const filtered = filterListings(listings.rows, { scope, status, search });
    const computeDemand = (row: ListingRow) => demandOf(row, enquiries.entries, bookings.entries, dateRange, now);

    const handleAddListing = () => {
        clearAllDraftIds();
        if (allowedEntities.length === 1) onNavigate(createListingScreen(allowedEntities[0]));
        else if (allowedEntities.length > 1) setShowEntityPicker(true);
        else { requestProfileSection('services'); onNavigate('BRAND_PROFILE'); }
    };

    const handleEdit = (row: ListingRow) => {
        setDraftId[row.entityType](row.id);
        onNavigate(EDIT_SCREEN[row.entityType]);
        setSelectedRow(null);
    };

    const scopeOptions = [
        { key: 'all' as const, label: 'All listings', count: counts.total },
        ...allowedEntities.map(e => ({ key: e, label: SERVICE_LABEL[e] + 's', count: listings.rows.filter(r => r.entityType === e).length })),
    ];

    const statusCountOf = (s: ListingState | 'any') => {
        const scoped = scope === 'all' ? listings.rows : listings.rows.filter(r => r.entityType === scope);
        return s === 'any' ? scoped.length : scoped.filter(r => r.state === s).length;
    };

    return (
        <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <nav aria-label="Breadcrumb" className="text-xs text-tlb-muted mb-[5px]">
                        <button type="button" onClick={() => onNavigate('HOME')} className="text-tlb-link hover:text-tlb-gold transition-colors">Dashboard</button>
                        {' · '}My listings
                    </nav>
                    <h1 className="pt-h1 text-[24px]">My listings</h1>
                </div>
                <button type="button" onClick={handleAddListing} className="pt-btn pt-btn-d">+ New listing</button>
            </div>

            <PendingBanner rows={listings.rows} onViewPending={() => setStatus('pending')} />

            <StatsStrip counts={counts} settled={settled} settledLabel={`earned ${getDateRangeOption(dateRange).phrase}`} />

            <SegBar options={scopeOptions} value={scope} onChange={setScope} />

            <div className="pt-note">{scope === 'all' ? 'Events sell tickets · Classes and Programs take enquiries · Venues can do either.' : SCOPE_HINT[scope]}</div>

            <div className="flex items-center gap-2.5 flex-wrap">
                <ListingStatusFilter value={status} onChange={setStatus} countOf={statusCountOf} />
                <SearchField value={search} onChange={setSearch} placeholder="Search listings" />
                <div className="flex-1" />
                <span className="text-xs text-tlb-muted">Showing {formatCount(filtered.length)} of {formatCount(counts.total)} listings</span>
            </div>

            {filtered.length > 0 ? (
                <ListingsTable
                    rows={filtered}
                    demandOf={computeDemand}
                    now={now}
                    onOpen={setSelectedRow}
                    onEdit={handleEdit}
                    onTogglePause={listings.togglePause}
                    onToggleArchive={listings.toggleArchive}
                />
            ) : (
                <div className="pt-card flex flex-col items-center justify-center text-center py-16 px-6">
                    <p className="text-sm font-bold text-tlb-sub">No listings match these filters</p>
                </div>
            )}

            <div className="flex items-center justify-between px-1">
                <span className="text-xs text-tlb-muted">Showing {formatCount(filtered.length)} of {formatCount(counts.total)} listings</span>
                <button type="button" onClick={() => onNavigate('ANALYTICS')} className="pt-link">Compare performance →</button>
            </div>

            <ListingDetailModal
                row={selectedRow ? listings.rows.find(r => r.id === selectedRow.id) ?? selectedRow : null}
                enquiries={enquiries.entries}
                bookings={bookings.entries}
                demand={selectedRow ? computeDemand(selectedRow) : null}
                onClose={() => setSelectedRow(null)}
                onNavigate={onNavigate}
                onEdit={handleEdit}
                onTogglePause={listings.togglePause}
                onToggleArchive={listings.toggleArchive}
            />

            <EntityPickerSheet
                isOpen={showEntityPicker}
                onClose={() => setShowEntityPicker(false)}
                allowedEntities={allowedEntities}
                onNavigate={onNavigate}
            />
        </div>
    );
};
