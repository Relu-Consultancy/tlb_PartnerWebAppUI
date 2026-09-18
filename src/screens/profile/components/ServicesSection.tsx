import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, Info, Loader2, X } from 'lucide-react';
import { EntityType } from '../../../types';
import { PartnerVertical, VerticalCategory } from '../../../api/verticals';
import { countListings, PartnerListing } from '../../../api/portalSummary';
import { isTicketed, Pill } from '../../../components/portal';
import { useDismiss } from '../../../hooks/useDismiss';
import { SectionCard } from './fields';

const ALL_CATEGORIES: VerticalCategory[] = ['Events', 'Venues', 'Programs', 'Classes', 'Shop'];
const ORDER: Record<string, number> = { Events: 0, Venues: 1, Programs: 2, Classes: 3, Shop: 4 };

const isKnownEntity = (name: string): name is EntityType =>
    name === 'Events' || name === 'Classes' || name === 'Programs' || name === 'Venues';

interface AddVerticalMenuProps {
    addable: string[];
    busy: string | null;
    onAdd: (category: string) => void;
}

const AddVerticalMenu: React.FC<AddVerticalMenuProps> = ({ addable, busy, onAdd }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    useDismiss(rootRef, open, () => setOpen(false));

    if (addable.length === 0) {
        return <span className="text-[12.5px] text-tlb-muted whitespace-nowrap">All service types added</span>;
    }

    return (
        <div ref={rootRef} className="relative flex-none">
            <button type="button" onClick={() => setOpen(o => !o)} className="pt-btn pt-btn-y whitespace-nowrap">
                + Add service type <ChevronDown size={13} strokeWidth={3} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        role="menu"
                        className="pt-popover absolute right-0 top-11 z-30 w-[200px] p-[7px]"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                    >
                        {addable.map(category => (
                            <button
                                key={category}
                                type="button"
                                role="menuitem"
                                disabled={!!busy}
                                className="pt-opt w-full"
                                onClick={() => { onAdd(category); setOpen(false); }}
                            >
                                {busy === category ? <Loader2 size={13} className="animate-spin mr-2" /> : null}
                                {category}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

interface VerticalCardProps {
    vertical: PartnerVertical;
    listings: PartnerListing[];
    busy: string | null;
    onViewListings: () => void;
    onCreateListing: (entity: EntityType) => void;
    onRemove: (category: string) => void;
}

const VerticalCard: React.FC<VerticalCardProps> = ({ vertical, listings, busy, onViewListings, onCreateListing, onRemove }) => {
    const [confirming, setConfirming] = useState(false);
    const known = isKnownEntity(vertical.name);
    const counts = known ? countListings(listings, vertical.name) : null;
    const removing = busy === vertical.name;

    return (
        <div className="rounded-xl border border-tlb-line px-4 py-3.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-tlb-ink">{vertical.name}</span>
                {known ? (
                    <Pill tone={isTicketed(vertical.name) ? 'amber' : 'neutral'} className="text-[11px] py-[3px]">
                        {isTicketed(vertical.name) ? 'Ticketed' : 'Enquiry'}
                    </Pill>
                ) : (
                    <Pill tone="purple" className="text-[11px] py-[3px]">No listing flow yet</Pill>
                )}
                <Pill tone="green" className="ml-auto text-[11px] py-[3px]">Active</Pill>
            </div>
            <p className="text-xs text-tlb-sub mt-2 leading-relaxed">
                {counts
                    ? (counts.total > 0
                        ? `${counts.live} live · ${counts.pending} pending · ${counts.total} listing${counts.total === 1 ? '' : 's'} in total`
                        : 'No listings yet')
                    : "Coming soon in this portal — TLB has your Shop category on file, but listing creation for it isn't built here yet."}
            </p>
            <div className="flex flex-wrap items-center gap-[7px] mt-[11px]">
                {known && (
                    <>
                        <button type="button" className="pt-btn pt-btn-o pt-btn-sm" onClick={onViewListings}>View listings</button>
                        <button type="button" className="pt-btn pt-btn-o pt-btn-sm" onClick={() => onCreateListing(vertical.name as EntityType)}>Create listing</button>
                    </>
                )}
                <div className="flex-1" />
                {confirming ? (
                    <>
                        <span className="text-[11.5px] text-tlb-muted">Remove {vertical.name}?</span>
                        <button type="button" disabled={removing} className="pt-btn pt-btn-o pt-btn-sm text-tlb-red-deep" onClick={() => { onRemove(vertical.name); setConfirming(false); }}>
                            {removing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Confirm
                        </button>
                        <button type="button" className="pt-btn pt-btn-o pt-btn-sm" onClick={() => setConfirming(false)}><X size={12} /></button>
                    </>
                ) : (
                    <button type="button" className="pt-btn pt-btn-o pt-btn-sm" onClick={() => setConfirming(true)}>Remove</button>
                )}
            </div>
        </div>
    );
};

interface ServicesSectionProps {
    listings: PartnerListing[];
    verticals: PartnerVertical[];
    verticalsLoading: boolean;
    verticalsAvailable: boolean;
    busyCategory: string | null;
    onViewListings: () => void;
    onCreateListing: (entity: EntityType) => void;
    onAddVertical: (category: string) => void;
    onRemoveVertical: (category: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
    listings, verticals, verticalsLoading, verticalsAvailable, busyCategory,
    onViewListings, onCreateListing, onAddVertical, onRemoveVertical,
}) => {
    const sorted = [...verticals].sort((a, b) => (ORDER[a.name] ?? 99) - (ORDER[b.name] ?? 99));
    const addable = ALL_CATEGORIES.filter(c => !verticals.some(v => v.name === c));

    if (!verticalsAvailable) {
        return (
            <SectionCard title="Services & categories" subtitle="The service types you offer on TLB">
                <p className="pt-note">Managing service types yourself unlocks once your account is fully approved — for now, reach out to TLB support to change what you offer.</p>
            </SectionCard>
        );
    }

    return (
        <SectionCard
            title="Services & categories"
            subtitle="The service types you offer on TLB — add or remove one any time"
            action={verticalsLoading ? undefined : <AddVerticalMenu addable={addable} busy={busyCategory} onAdd={onAddVertical} />}
        >
            {verticalsLoading ? (
                <p className="pt-note">Loading your service types…</p>
            ) : sorted.length === 0 ? (
                <p className="pt-note">No service types yet — add one to start creating listings.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sorted.map(vertical => (
                        <VerticalCard
                            key={vertical.id}
                            vertical={vertical}
                            listings={listings}
                            busy={busyCategory}
                            onViewListings={onViewListings}
                            onCreateListing={onCreateListing}
                            onRemove={onRemoveVertical}
                        />
                    ))}
                </div>
            )}
            <div className="pt-note mt-3.5">
                <Info size={16} strokeWidth={2.75} className="text-tlb-gold flex-none" aria-hidden="true" />
                Adding a service type takes effect immediately — you can create listings for it right away. Removing one needs every listing in that category archived or deleted first.
            </div>
        </SectionCard>
    );
};
