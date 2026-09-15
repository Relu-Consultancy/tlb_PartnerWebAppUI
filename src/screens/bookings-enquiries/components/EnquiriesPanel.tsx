import React, { useMemo, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { EntityType } from '../../../types';
import { ListingState, PartnerListing } from '../../../api/portalSummary';
import { IconTile, ListingStatusFilter, LoadMoreRow, Pill, ScopePills, SearchField, SegBar } from '../../../components/portal';
import { timeAgo } from '../../../utils/format';
import { EnquiryEntity, EnquiryEntry } from '../types';
import { enquiryStats, filterEnquiries, groupByListing } from '../model';
import { avatarColorOf, ENQUIRY_ENTITY_LABEL, ENQUIRY_ENTITY_TONE, ENQUIRY_STATUS_META } from '../presentation';
import { GroupedList } from './GroupedList';

const PAGE_SIZE = 20;
const SERVICE_LABEL: Record<EnquiryEntity, string> = { Classes: 'Classes', Programs: 'Programs', Venues: 'Venues' };

const CONTEXT_NOTE: Record<'all' | EnquiryEntity, string> = {
    all: 'Classes and Programs always take enquiries. Venues are hybrid — some listings sell slots as bookings, others generate enquiries. Events sell tickets, so they sit under Bookings.',
    Classes: 'Classes — enquiry only. Nothing is charged until you confirm the place and send a payment link.',
    Programs: 'Programs — enquiry only. Nothing is charged until you confirm enrolment.',
    Venues: 'Venues run a hybrid model — custom, multi-day and large hires arrive here as enquiries; hourly and day slots are paid upfront and sit under Bookings.',
};

interface EnquiriesPanelProps {
    entries: EnquiryEntry[];
    listingsById: Map<string, PartnerListing>;
    availableEntities: EntityType[];
    onOpen: (entry: EnquiryEntry) => void;
}

export const EnquiriesPanel: React.FC<EnquiriesPanelProps> = ({ entries, listingsById, availableEntities, onOpen }) => {
    const [stage, setStage] = useState<'new' | 'responded'>('new');
    const [scope, setScope] = useState<EnquiryEntity | 'all'>('all');
    const [listingStatus, setListingStatus] = useState<ListingState | 'any'>('any');
    const [search, setSearch] = useState('');
    const [expandedListingId, setExpandedListingId] = useState<string | null>(null);
    const [visible, setVisible] = useState(PAGE_SIZE);

    const scopeOptions = (['Classes', 'Programs', 'Venues'] as EnquiryEntity[]).filter(e => availableEntities.includes(e));
    const stats = useMemo(() => enquiryStats(entries), [entries]);

    const staged = useMemo(
        () => filterEnquiries(entries, { stage, scope, search: '' }),
        [entries, stage, scope],
    );
    const listingFiltered = useMemo(
        () => listingStatus === 'any' ? staged : staged.filter(e => (listingsById.get(e.listingId)?.state ?? 'draft') === listingStatus),
        [staged, listingStatus, listingsById],
    );
    const filtered = useMemo(
        () => filterEnquiries(listingFiltered, { stage, scope, search }),
        [listingFiltered, stage, scope, search],
    );
    const sorted = useMemo(
        () => [...filtered].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
        [filtered],
    );
    const visibleRows = sorted.slice(0, visible);
    const groups = useMemo(() => groupByListing(visibleRows), [visibleRows]);

    const listingStatusCounts = (state: ListingState | 'any') =>
        state === 'any' ? staged.length : staged.filter(e => (listingsById.get(e.listingId)?.state ?? 'draft') === state).length;

    const resetPaging = () => setVisible(PAGE_SIZE);

    return (
        <div className="flex flex-col gap-4">
            <SegBar
                options={[
                    { key: 'all' as const, label: 'All enquiries', count: stats.total },
                    ...scopeOptions.map(e => ({ key: e, label: SERVICE_LABEL[e], count: stats.byEntity[e] })),
                ]}
                value={scope}
                onChange={v => { setScope(v); resetPaging(); }}
            />

            <div className="pt-note">
                <CircleAlert size={14} strokeWidth={2.75} className="text-tlb-link flex-none" aria-hidden="true" />
                {CONTEXT_NOTE[scope]}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="pt-eyebrow mr-0.5">Stage</span>
                <ScopePills
                    options={[
                        { key: 'new' as const, label: 'To respond', count: stats.toRespond },
                        { key: 'responded' as const, label: 'Responded' },
                    ]}
                    value={stage}
                    onChange={v => { setStage(v); resetPaging(); }}
                />
                <div className="w-px h-[22px] bg-tlb-line mx-1" aria-hidden="true" />
                <ListingStatusFilter value={listingStatus} onChange={v => { setListingStatus(v); resetPaging(); }} countOf={listingStatusCounts} />
                <div className="flex-1" />
                <SearchField value={search} onChange={v => { setSearch(v); resetPaging(); }} placeholder="Search name, listing or phone" />
            </div>

            <div className="pt-card overflow-x-auto">
                <div className="flex items-center justify-between min-w-[640px] px-[17px] py-3 border-b border-tlb-line bg-tlb-chrome">
                    <span className="pt-h-sec text-sm">{stage === 'new' ? 'Enquiries to respond' : 'Responded — awaiting the customer'}</span>
                    <span className="text-[11.5px] font-semibold text-tlb-muted">{filtered.length} {filtered.length === 1 ? 'enquiry' : 'enquiries'}</span>
                </div>

                {groups.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-14 text-center">
                        <IconTile tone="neutral" icon={CircleAlert} size="md" />
                        <p className="text-sm font-bold text-tlb-ink">No enquiries here</p>
                        <p className="text-xs text-tlb-muted max-w-[260px]">
                            {search || listingStatus !== 'any' ? 'Try a different search or listing filter.' : 'Nothing in this stage right now.'}
                        </p>
                    </div>
                ) : (
                    <GroupedList<EnquiryEntry>
                        groups={groups}
                        expandedId={expandedListingId}
                        onToggle={id => setExpandedListingId(cur => cur === id ? null : id)}
                        entityLabel={e => ENQUIRY_ENTITY_LABEL[e as EnquiryEntity]}
                        entityTone={e => ENQUIRY_ENTITY_TONE[e as EnquiryEntity]}
                        countLabel={n => `${n} ${n === 1 ? 'enquiry' : 'enquiries'}`}
                        minWidth={640}
                        renderRow={row => (
                            <button
                                key={row.id}
                                type="button"
                                onClick={() => onOpen(row)}
                                className="w-full flex items-center gap-3.5 px-[17px] py-[13px] border-b border-tlb-divider hover:bg-tlb-highlight transition-colors text-left"
                            >
                                <span
                                    className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white text-[11.5px] font-extrabold flex-none"
                                    style={{ background: avatarColorOf(row.name) }}
                                >
                                    {row.name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'}
                                </span>
                                <span className="w-[190px] flex-none min-w-0">
                                    <span className="block text-[13.5px] font-bold text-tlb-ink truncate">{row.name}</span>
                                    <span className="pt-code mt-[3px] inline-flex">ENQ-{row.id}</span>
                                </span>
                                <span className="flex-1 min-w-0 text-xs text-tlb-muted truncate">{timeAgo(row.createdAt)}</span>
                                <span className="flex-none flex items-center gap-2">
                                    <Pill tone={ENQUIRY_STATUS_META[row.status].tone}>{ENQUIRY_STATUS_META[row.status].label}</Pill>
                                    <span className="pt-btn pt-btn-o pt-btn-sm pointer-events-none">Open</span>
                                </span>
                            </button>
                        )}
                    />
                )}

                <LoadMoreRow shown={Math.min(visible, filtered.length)} total={filtered.length} noun="enquiries" onLoadMore={() => setVisible(v => v + PAGE_SIZE)} />
            </div>
        </div>
    );
};
