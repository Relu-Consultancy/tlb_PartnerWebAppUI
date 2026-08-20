import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Filter, Users, Edit3, CalendarDays, BarChart3, MapPin, Layers, Clock, X, Check, SlidersHorizontal, Play, Pause, Archive, ArchiveRestore, Ticket, Tag, LayoutGrid, Grid3X3, List, LayoutList, Sparkles, CircleDot, FileEdit, MessageSquare, ArrowRight, ChevronRight, XCircle } from 'lucide-react';
import { SkeletonListings, toast, Select, SelectOption } from '../../components/ui';
import { Screen, EntityType } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { EntityPickerSheet } from '../../components/EntityPickerSheet';
import { Pagination } from '../../components/ui';
import { getEventListings, getVenueListings, getClassListings, getProgramListings, setCurrentDraftId, clearCurrentDraftId, setCurrentVenueDraftId, clearCurrentVenueDraftId, setCurrentClassDraftId, clearCurrentClassDraftId, setCurrentProgramDraftId, clearCurrentProgramDraftId, pauseListing, resumeListing, archiveListing, unarchiveListing, updateListing, updateVenueListing, updateClassListing, updateProgramListing } from '../../api/listings';
import { getCoupons, CouponListItem } from '../../api/coupons';

interface Props {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

type ListingStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'archived';

interface ListingCoupon {
    code: string;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    max_discount?: number | null;
    expires_at?: string | null;
}

interface Listing {
    id: string;
    title: string;
    category: string;
    entityType: EntityType;
    listingType: string; // raw API listing_type ("event", "class", etc.)
    status: ListingStatus;
    coverUrl?: string;
    startDateTime?: string;
    createdAt?: string;
    isLive?: boolean;
    coupon?: ListingCoupon | null;
}

// A listing's display date — its scheduled/happening date, else when it was created.
const listingDate = (l: { startDateTime?: string; createdAt?: string }) => l.startDateTime || l.createdAt;

// Normalize a timestamp to a YYYY-MM-DD key for date-range comparisons.
const dateKey = (iso?: string): string => {
    if (!iso) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0, 10);
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

const fmtDate = (iso?: string): string => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
};

const couponDiscountLabel = (c: { discount_type: string; discount_value: number }) =>
    c.discount_type === 'percent' ? `${c.discount_value}% off` : `₹${c.discount_value} off`;

const updateFnByEntity = (entityType: EntityType) =>
    entityType === 'Events' ? updateListing
        : entityType === 'Venues' ? updateVenueListing
            : entityType === 'Classes' ? updateClassListing
                : updateProgramListing;

const entityBadgeConfig: Record<EntityType, { color: string; bg: string; icon: any }> = {
    Events: { color: 'text-purple-600', bg: 'bg-purple-50', icon: CalendarDays },
    Classes: { color: 'text-blue-600', bg: 'bg-blue-50', icon: BarChart3 },
    Programs: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Users },
    Venues: { color: 'text-amber-600', bg: 'bg-amber-50', icon: MapPin },
};

const statusBadge: Record<ListingStatus, { label: string; bg: string; color: string }> = {
    draft:     { label: 'Draft',     bg: 'bg-gray-100',    color: 'text-gray-500' },
    pending:   { label: 'In Review', bg: 'bg-amber-50',    color: 'text-amber-600' },
    published: { label: 'Live',      bg: 'bg-emerald-50',  color: 'text-emerald-600' },
    rejected:  { label: 'Rejected',  bg: 'bg-red-50',      color: 'text-red-500' },
    archived:  { label: 'Archived',  bg: 'bg-gray-200',    color: 'text-gray-600' },
};


// Navigation card surfacing a related management screen (Bookings / Enquiries)
// from within the Listings hub.
const QuickAccessCard: React.FC<{
    title: string; subtitle: string; icon: React.ElementType; hex: string; onClick: () => void;
}> = ({ title, subtitle, icon: Icon, hex, onClick }) => (
    <motion.button
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-left hover:shadow-md transition-shadow"
    >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105" style={{ backgroundColor: `${hex}14`, color: hex }}>
            <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-gray-900">{title}</p>
            <p className="text-[11px] text-gray-400 font-medium truncate">{subtitle}</p>
        </div>
        <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all shrink-0" />
    </motion.button>
);

type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a';
type ViewMode = 'comfortable' | 'compact' | 'list';

export const ServiceListings: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const { allowedEntities } = usePartner();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<EntityType | 'All'>('All');
    const [showEntityPicker, setShowEntityPicker] = useState(false);
    const [viewMode, setViewModeState] = useState<ViewMode>(() => {
        try { return (localStorage.getItem('listings_density') as ViewMode) || 'list'; } catch { return 'list'; }
    });
    const setViewMode = (v: ViewMode) => {
        setViewModeState(v);
        try { localStorage.setItem('listings_density', v); } catch { /* ignore */ }
    };

    // Filter state
    const [showFilter, setShowFilter] = useState(false);
    const [filterStatuses, setFilterStatuses] = useState<ListingStatus[]>([]);
    const [filterTypes, setFilterTypes] = useState<EntityType[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    // Temp state (inside dialog before Apply)
    const [tmpStatuses, setTmpStatuses] = useState<ListingStatus[]>([]);
    const [tmpTypes, setTmpTypes] = useState<EntityType[]>([]);
    const [tmpSort, setTmpSort] = useState<SortOption>('newest');
    const [tmpDateFrom, setTmpDateFrom] = useState('');
    const [tmpDateTo, setTmpDateTo] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeTab, filterStatuses, filterTypes, filterDateFrom, filterDateTo, sortBy, itemsPerPage]);

    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Coupon attach/remove
    const [couponList, setCouponList] = useState<CouponListItem[]>([]);
    const [couponModalListing, setCouponModalListing] = useState<Listing | null>(null);
    const [selectedCouponCode, setSelectedCouponCode] = useState('');
    const [savingCoupon, setSavingCoupon] = useState(false);

    useEffect(() => {
        getCoupons({ is_active: true }).then(setCouponList).catch(() => setCouponList([]));
    }, []);

    const couponOptions: SelectOption[] = [
        { value: '', label: 'No coupon' },
        ...couponList.map(c => ({ value: c.code, label: `${c.code} · ${couponDiscountLabel(c)}` })),
    ];

    const openCouponModal = (listing: Listing) => {
        setSelectedCouponCode(listing.coupon?.code || '');
        setCouponModalListing(listing);
    };

    const saveCoupon = async () => {
        if (!couponModalListing) return;
        setSavingCoupon(true);
        try {
            const code = selectedCouponCode || null;
            const res = await updateFnByEntity(couponModalListing.entityType)(couponModalListing.id, { coupon_code: code });
            const updated = res?.data || res;
            const picked = couponList.find(c => c.code === code);
            const newCoupon: ListingCoupon | null = updated?.coupon
                ?? (code && picked ? { code: picked.code, discount_type: picked.discount_type, discount_value: picked.discount_value, expires_at: picked.expires_at } : null);
            setListings(prev => prev.map(l => l.id === couponModalListing.id ? { ...l, coupon: newCoupon } : l));
            toast.success(code ? 'Coupon attached to listing.' : 'Coupon removed.');
            setCouponModalListing(null);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to update coupon');
        } finally {
            setSavingCoupon(false);
        }
    };

    const openFilter = () => {
        setTmpStatuses([...filterStatuses]);
        setTmpTypes([...filterTypes]);
        setTmpSort(sortBy);
        setTmpDateFrom(filterDateFrom);
        setTmpDateTo(filterDateTo);
        setShowFilter(true);
    };

    const applyFilter = () => {
        setFilterStatuses(tmpStatuses);
        setFilterTypes(tmpTypes);
        setSortBy(tmpSort);
        setFilterDateFrom(tmpDateFrom);
        setFilterDateTo(tmpDateTo);
        setShowFilter(false);
    };

    const resetFilter = () => {
        setTmpStatuses([]);
        setTmpTypes([]);
        setTmpSort('newest');
        setTmpDateFrom('');
        setTmpDateTo('');
    };

    const toggleTmpStatus = (s: ListingStatus) =>
        setTmpStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

    const toggleTmpType = (t: EntityType) =>
        setTmpTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

    const activeFilterCount = filterStatuses.length + filterTypes.length + (sortBy !== 'newest' ? 1 : 0) + (filterDateFrom || filterDateTo ? 1 : 0);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                type Tagged = { item: any; entityType: EntityType };
                const fetches: Promise<Tagged[]>[] = [];
                if (allowedEntities.includes('Events')) {
                    fetches.push(getEventListings().then(res => {
                        const data = res.data || res;
                        return Array.isArray(data) ? data.map(item => ({ item, entityType: 'Events' as EntityType })) : [];
                    }));
                }
                if (allowedEntities.includes('Venues')) {
                    fetches.push(getVenueListings().then(res => {
                        const data = res.data || res;
                        return Array.isArray(data) ? data.map(item => ({ item, entityType: 'Venues' as EntityType })) : [];
                    }));
                }
                if (allowedEntities.includes('Classes')) {
                    fetches.push(getClassListings().then(res => {
                        const data = res.data || res;
                        return Array.isArray(data) ? data.map(item => ({ item, entityType: 'Classes' as EntityType })) : [];
                    }));
                }
                if (allowedEntities.includes('Programs')) {
                    fetches.push(getProgramListings().then(res => {
                        const data = res.data || res;
                        return Array.isArray(data) ? data.map(item => ({ item, entityType: 'Programs' as EntityType })) : [];
                    }));
                }
                const results = await Promise.allSettled(fetches);
                const combined: Tagged[] = [];
                let firstError: string | null = null;
                results.forEach(r => {
                    if (r.status === 'fulfilled') {
                        combined.push(...r.value);
                    } else if (!firstError) {
                        firstError = (r.reason as any)?.message || 'Failed to load listings.';
                    }
                });
                if (combined.length === 0 && firstError) {
                    setError(firstError);
                    setListings([]);
                } else {
                    const normalized: Listing[] = combined.map(({ item, entityType }) => ({
                        id: String(item.id || ''),
                        title: item.title || 'Untitled',
                        category: item.category?.name || item.subcategory?.name || '',
                        entityType,
                        listingType: item.listing_type || '',
                        status: (item.status as ListingStatus) || 'draft',
                        coverUrl: item.cover_url || item.cover,
                        startDateTime: item.start_datetime || item.start_date || item.next_session_at
                            || item.next_batch_start || item.next_occurrence || item.starts_at || item.event_date || undefined,
                        createdAt: item.created_at || item.created || undefined,
                        // Pause/Live state comes from `is_paused` (the flag the
                        // pause/resume endpoints actually toggle). `is_live` is a
                        // separate, unmaintained field and must NOT be used here —
                        // reading it made resumed listings snap back to "Paused"
                        // on refetch. Fall back to legacy is_live only if is_paused
                        // is absent for some entity type.
                        isLive: item.is_paused != null ? !item.is_paused : (item.is_live !== false),
                        coupon: item.coupon || null,
                    }));
                    setListings(normalized);
                }
            } catch (err: any) {
                console.error('Failed to load listings', err);
                setError(err?.message || 'Failed to load listings.');
                setListings([]);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, []);

    const handleAddListing = () => {
        // Starting fresh — clear any leftover draft ids
        clearCurrentDraftId();
        clearCurrentVenueDraftId();
        clearCurrentClassDraftId();
        clearCurrentProgramDraftId();
        if (allowedEntities.length === 1) {
            const entity = allowedEntities[0];
            if (entity === 'Events') onNavigate('CREATE_EVENT_DETAILS');
            else if (entity === 'Venues') onNavigate('CREATE_VENUE_DETAILS');
            else if (entity === 'Programs') onNavigate('CREATE_PROGRAM_IDENTITY');
            else onNavigate('CREATE_CLASS_IDENTITY');
        } else if (allowedEntities.length > 1) {
            setShowEntityPicker(true);
        } else {
            onNavigate('CREATE_CLASS_IDENTITY');
        }
    };

    const handleEdit = (listing: Listing) => {
        if (listing.entityType === 'Events') {
            setCurrentDraftId(listing.id);
            onNavigate('CREATE_EVENT_DETAILS');
        } else if (listing.entityType === 'Venues') {
            setCurrentVenueDraftId(listing.id);
            onNavigate('CREATE_VENUE_DETAILS');
        } else if (listing.entityType === 'Classes') {
            setCurrentClassDraftId(listing.id);
            onNavigate('CREATE_CLASS_IDENTITY');
        } else if (listing.entityType === 'Programs') {
            setCurrentProgramDraftId(listing.id);
            onNavigate('CREATE_PROGRAM_IDENTITY');
        } else {
            onNavigate('CREATE_CLASS_IDENTITY');
        }
    };

    // The backend exposes only the generic, entity-agnostic action routes
    // (/api/v1/partner/listings/{id}/pause|resume|archive|unarchive/). The old
    // entity-specific routes (/classes/.../live/, /programs/.../archive/) 404, so
    // all entity types use the generic endpoints here.
    const handleTogglePause = async (listing: Listing) => {
        try {
            const isPaused = listing.isLive === false;
            if (isPaused) await resumeListing(listing.id);
            else await pauseListing(listing.id);
            setListings(prev => prev.map(l => l.id === listing.id ? { ...l, isLive: isPaused } : l));
        } catch (err: any) {
            toast.error(err.message || 'Failed to update listing status');
        }
    };

    const handleToggleArchive = async (listing: Listing) => {
        try {
            if (listing.status === 'archived') {
                await unarchiveListing(listing.id);
                setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: 'draft' } : l));
            } else {
                await archiveListing(listing.id);
                setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: 'archived' } : l));
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to update archive status');
        }
    };

    const filtered = listings
        .filter(s => activeTab === 'All' || s.entityType === activeTab)
        .filter(s => {
            const q = searchQuery.trim().toLowerCase();
            if (!q) return true;
            return s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
        })
        .filter(s => filterStatuses.length === 0 || filterStatuses.includes(s.status))
        .filter(s => filterTypes.length === 0 || filterTypes.includes(s.entityType))
        .filter(s => {
            if (!filterDateFrom && !filterDateTo) return true;
            const k = dateKey(listingDate(s));
            if (!k) return false;
            if (filterDateFrom && k < filterDateFrom) return false;
            if (filterDateTo && k > filterDateTo) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'a-z') return a.title.localeCompare(b.title);
            if (sortBy === 'z-a') return b.title.localeCompare(a.title);
            // Compare as real timestamps, not raw strings — falling back to a
            // listing's UUID `id` when it has no date (e.g. an unscheduled
            // Draft) mixed UUID and ISO-date string comparisons together and
            // produced an essentially random order.
            const aTime = new Date(listingDate(a) || 0).getTime();
            const bTime = new Date(listingDate(b) || 0).getTime();
            return sortBy === 'oldest' ? aTime - bTime : bTime - aTime; // newest
        });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedListings = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const tabCounts = {
        All: listings.length,
        ...Object.fromEntries(
            (['Events', 'Classes', 'Programs', 'Venues'] as EntityType[]).map(e => [e, listings.filter(l => l.entityType === e).length])
        ),
    };

    const tabs: (EntityType | 'All')[] = ['All', ...allowedEntities];

    // Single hub for post-listing operations. Inside, each listing opens its
    // bookings + attendee check-in (booking listings) or enquiries + attendees
    // (enquiry listings) — see the Bookings & Enquiries screen.
    const quickAccess: { title: string; subtitle: string; icon: React.ElementType; hex: string; nav: Screen }[] = [
        { title: 'Bookings & Enquiries', subtitle: 'Track bookings, leads & attendance per listing', icon: MessageSquare, hex: '#3B82F6', nav: 'BOOKINGS' },
        { title: 'Coupons', subtitle: 'Create & manage discount coupons', icon: Tag, hex: '#8B5CF6', nav: 'ALL_COUPONS' },
    ];

    // Interactive status quick-filters (drive filterStatuses)
    const statusCounts = {
        published: listings.filter(l => l.status === 'published').length,
        pending: listings.filter(l => l.status === 'pending').length,
        draft: listings.filter(l => l.status === 'draft').length,
        archived: listings.filter(l => l.status === 'archived').length,
        rejected: listings.filter(l => l.status === 'rejected').length,
    };
    const STAT_CHIPS: { key: ListingStatus | 'all'; label: string; count: number; icon: any; fg: string; bg: string }[] = [
        { key: 'all', label: 'All Listings', count: listings.length, icon: LayoutList, fg: '#CA8A04', bg: '#FEFCE8' },
        { key: 'published', label: 'Live', count: statusCounts.published, icon: Sparkles, fg: '#059669', bg: '#ECFDF5' },
        { key: 'pending', label: 'In Review', count: statusCounts.pending, icon: CircleDot, fg: '#D97706', bg: '#FFFBEB' },
        { key: 'rejected', label: 'Rejected', count: statusCounts.rejected, icon: XCircle, fg: '#DC2626', bg: '#FEF2F2' },
        { key: 'draft', label: 'Drafts', count: statusCounts.draft, icon: FileEdit, fg: '#4B5563', bg: '#F3F4F6' },
        { key: 'archived', label: 'Archived', count: statusCounts.archived, icon: Archive, fg: '#6B7280', bg: '#F3F4F6' },
    ];
    // Most recently created listing that's live and open for bookings (published, not paused).
    const latestActiveListing: Listing | null = listings
        .filter((l: Listing) => l.status === 'published' && l.isLive !== false)
        .sort((a: Listing, b: Listing) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0] || null;

    const HISTORY_LIMIT = 2;
    // Everything else, newest first — the "history" trailing behind the single highlighted listing above.
    const olderListings: Listing[] = listings
        .filter((l: Listing) => !latestActiveListing || l.id !== latestActiveListing.id)
        .sort((a: Listing, b: Listing) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const olderListingsShown = olderListings.slice(0, HISTORY_LIMIT);

    const toggleStatusFilter = (s: ListingStatus | 'all') => {
        if (s === 'all') { setFilterStatuses([]); return; }
        setFilterStatuses(prev => prev.length === 1 && prev[0] === s ? [] : [s]);
    };

    if (loading) {
        return <SkeletonListings />;
    }

    const statusDot = (listing: Listing) => {
        if (listing.status === 'published') return listing.isLive === false ? 'bg-amber-400' : 'bg-emerald-400';
        if (listing.status === 'pending') return 'bg-amber-400';
        if (listing.status === 'rejected') return 'bg-red-400';
        if (listing.status === 'archived') return 'bg-gray-400';
        return 'bg-gray-300';
    };

    const statusLabel = (listing: Listing) => {
        if (listing.status === 'published') return listing.isLive === false ? 'Paused' : 'Live';
        return statusBadge[listing.status].label;
    };

    const gridClass = viewMode === 'compact'
        ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3'
        : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4';

    const renderListingCard = (listing: Listing, compact: boolean, index: number) => {
        const badge = entityBadgeConfig[listing.entityType];
        const BadgeIcon = badge.icon;
        const editable = listing.status !== 'published' && listing.status !== 'archived';
        return (
            <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.3) }}
                whileHover={{ y: -5 }}
                className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-[box-shadow,border-color] duration-300 flex flex-col"
            >
                {/* Cover banner */}
                <div className={`relative ${compact ? 'h-20' : 'h-28'} overflow-hidden`}>
                    {listing.coverUrl ? (
                        <img src={listing.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center ${badge.bg}`}>
                            <BadgeIcon size={compact ? 22 : 28} className={`${badge.color} opacity-60`} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                    <span className={`absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md ${badge.bg} ${badge.color} shadow-sm`}>
                        <BadgeIcon size={9} /> {listing.entityType}
                    </span>
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-bold text-gray-700 bg-white/90 backdrop-blur px-2 py-0.5 rounded-md shadow-sm">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot(listing)} ${listing.status === 'published' && listing.isLive !== false ? 'animate-pulse' : ''}`} />
                        {statusLabel(listing)}
                    </span>
                </div>

                {/* Body */}
                <div className={`flex-1 flex flex-col ${compact ? 'p-3' : 'p-4'}`}>
                    <p className="font-bold text-sm text-gray-900 truncate">{listing.title}</p>
                    {!compact && (
                        <p className="font-mono text-[10px] text-gray-400 truncate mt-0.5" title={listing.id}>ID: {listing.id}</p>
                    )}
                    {!compact && listing.category && (
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">{listing.category}</p>
                    )}
                    {listingDate(listing) && (
                        <p className="text-[11px] text-gray-400 font-medium mt-1 flex items-center gap-1">
                            <Clock size={10} className="text-gray-300" /> {fmtDate(listingDate(listing))}
                        </p>
                    )}
                    {listing.coupon && (
                        <span className="inline-flex w-max items-center gap-1 mt-2 px-2 py-0.5 rounded-md bg-tlb-yellow/15 text-tlb-dark text-[10px] font-black">
                            <Tag size={9} /> {listing.coupon.code} · {couponDiscountLabel(listing.coupon)}
                        </span>
                    )}
                    <div className="flex items-center justify-end gap-1 mt-auto pt-3 border-t border-gray-50 group-hover:border-gray-100 transition-colors">
                        {listing.status === 'published' && (
                            <button onClick={() => handleTogglePause(listing)}
                                className={`p-2 rounded-lg transition-colors ${listing.isLive !== false ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                title={listing.isLive !== false ? 'Pause' : 'Resume'}>
                                {listing.isLive !== false ? <Pause size={15} /> : <Play size={15} />}
                            </button>
                        )}
                        {(listing.status === 'published' || listing.status === 'archived') && (
                            <button onClick={() => handleToggleArchive(listing)}
                                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                title={listing.status === 'archived' ? 'Unarchive' : 'Archive'}>
                                {listing.status === 'archived' ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                            </button>
                        )}
                        <button onClick={() => openCouponModal(listing)}
                            className={`p-2 rounded-lg transition-colors ${listing.coupon ? 'text-tlb-dark bg-tlb-yellow/20 hover:bg-tlb-yellow/30' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                            title={listing.coupon ? 'Change coupon' : 'Attach coupon'}>
                            <Ticket size={15} />
                        </button>
                        <button onClick={() => handleEdit(listing)} disabled={!editable}
                            className={`p-2 rounded-lg transition-colors ${editable ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-300 cursor-not-allowed'}`}
                            title={editable ? 'Edit' : 'Locked'}>
                            <Edit3 size={15} />
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white px-6 md:px-8 py-5 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">Listings</h1>
                        <p className="text-xs font-medium text-gray-400 mt-0.5 hidden sm:block">Manage all your services</p>
                    </div>
                </div>
                <button onClick={handleAddListing} className="bg-tlb-yellow text-tlb-dark px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:brightness-105 active:scale-95 transition-all">
                    <Plus size={16} /> <span className="hidden sm:inline">Add Listing</span>
                </button>
            </header>

            <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs font-bold text-red-600">{error}</div>
                )}

                {/* Interactive status stat-chips (quick filters) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {STAT_CHIPS.map((chip, i) => {
                        const active = chip.key === 'all'
                            ? filterStatuses.length === 0
                            : filterStatuses.length === 1 && filterStatuses[0] === chip.key;
                        return (
                            <motion.button
                                key={chip.key}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.2) }}
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => toggleStatusFilter(chip.key)}
                                className={`text-left rounded-2xl p-4 border bg-white transition-all ${active ? 'border-tlb-yellow ring-2 ring-tlb-yellow/30 shadow-md' : 'border-gray-100 shadow-sm hover:shadow-md'}`}
                            >
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5" style={{ background: chip.bg, color: chip.fg }}>
                                    <chip.icon size={16} />
                                </div>
                                <p className="text-2xl font-black leading-none text-gray-900">{chip.count}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{chip.label}</p>
                            </motion.button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                {/* Latest Active Listing — the most recently created listing that's live and taking bookings */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={16} className="text-emerald-500" />
                        <h2 className="text-sm font-black text-gray-900">Latest Active Listing</h2>
                    </div>
                    {latestActiveListing ? (() => {
                        const badge = entityBadgeConfig[latestActiveListing.entityType];
                        const BadgeIcon = badge.icon;
                        return (
                            <button
                                onClick={() => setSearchQuery(latestActiveListing.title)}
                                className="group w-full flex items-center gap-4 text-left"
                            >
                                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative">
                                    {latestActiveListing.coverUrl ? (
                                        <img src={latestActiveListing.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center ${badge.bg}`}>
                                            <BadgeIcon size={22} className={`${badge.color} opacity-70`} />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md ${badge.bg} ${badge.color}`}>
                                            {latestActiveListing.entityType}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live · Accepting bookings
                                        </span>
                                    </div>
                                    <p className="font-bold text-sm text-gray-900 truncate">{latestActiveListing.title}</p>
                                    {listingDate(latestActiveListing) && (
                                        <p className="text-[11px] text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                                            <Clock size={10} className="text-gray-300" /> {fmtDate(listingDate(latestActiveListing))}
                                        </p>
                                    )}
                                </div>
                                <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </button>
                        );
                    })() : (
                        <div className="flex items-center gap-3 text-gray-400">
                            <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                <Sparkles size={18} className="text-gray-300" />
                            </div>
                            <p className="text-sm font-bold">No active listing</p>
                        </div>
                    )}
                </div>

                {/* History — everything older than the highlighted listing above */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={16} className="text-gray-400" />
                        <h2 className="text-sm font-black text-gray-900">History</h2>
                    </div>
                    {olderListingsShown.length > 0 ? (
                        <div className="space-y-2">
                            {olderListingsShown.map(listing => {
                                const badge = entityBadgeConfig[listing.entityType];
                                const BadgeIcon = badge.icon;
                                return (
                                    <button
                                        key={listing.id}
                                        onClick={() => setSearchQuery(listing.title)}
                                        className="group w-full flex items-center gap-3 text-left p-1.5 -m-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                                            {listing.coverUrl ? (
                                                <img src={listing.coverUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center ${badge.bg}`}>
                                                    <BadgeIcon size={15} className={`${badge.color} opacity-70`} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-900 truncate">{listing.title}</p>
                                            <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                                                {listing.entityType} · {statusBadge[listing.status].label}
                                                {listingDate(listing) && <> · {fmtDate(listingDate(listing))}</>}
                                            </p>
                                        </div>
                                        <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
                                    </button>
                                );
                            })}
                            {olderListings.length > HISTORY_LIMIT && (
                                <button
                                    onClick={() => setShowHistoryModal(true)}
                                    className="w-full text-xs font-bold text-blue-500 hover:text-blue-600 text-center pt-2"
                                >
                                    +{olderListings.length - HISTORY_LIMIT} more
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-gray-400">
                            <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                <Clock size={18} className="text-gray-300" />
                            </div>
                            <p className="text-sm font-bold">No older listings yet</p>
                        </div>
                    )}
                </div>
                </div>

                {/* Action Required: Review & Rejected Listings */}
                {(statusCounts.pending > 0 || statusCounts.rejected > 0) && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <CircleDot size={18} className="text-amber-500" />
                            <h2 className="text-sm font-black text-gray-900">Attention Required</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {listings.filter(l => l.status === 'pending' || l.status === 'rejected').map(listing => (
                                <div key={`attention-${listing.id}`} className={`flex items-start gap-3 p-4 rounded-xl border ${listing.status === 'rejected' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className={`inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${listing.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {listing.status === 'rejected' ? 'Rejected' : 'In Review'}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 truncate">{listing.entityType}</span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 truncate" title={listing.title}>{listing.title}</p>
                                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                                            {listing.status === 'rejected'
                                                ? 'This listing was rejected by the admin team. Please review and edit the details before re-submitting.'
                                                : 'This listing is currently under review by our team. You will be notified once it is approved and goes live.'}
                                        </p>
                                        <div className="mt-3 flex justify-end">
                                            <button onClick={() => handleEdit(listing)} className={`text-xs font-bold transition-colors ${listing.status === 'rejected' ? 'text-red-600 hover:text-red-700' : 'text-amber-600 hover:text-amber-700'}`}>
                                                View / Edit Details <ArrowRight size={12} className="inline ml-1 -mt-0.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick access — related management surfaces (Bookings / Enquiries) */}
                <div className={`grid gap-3 ${quickAccess.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
                    {quickAccess.map(q => (
                        <QuickAccessCard
                            key={q.title}
                            title={q.title}
                            subtitle={q.subtitle}
                            icon={q.icon}
                            hex={q.hex}
                            onClick={() => onNavigate(q.nav)}
                        />
                    ))}
                </div>

                {/* Search + Filter + Tabs row */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 flex gap-3">
                        <div className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
                            <Search size={16} className="text-gray-400" />
                            <input
                                className="bg-transparent flex-1 text-sm outline-none placeholder:text-gray-400"
                                placeholder="Search listings by name or ID…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                            )}
                        </div>
                        <button
                            onClick={openFilter}
                            className={`relative bg-white border px-3 rounded-xl transition-colors ${activeFilterCount > 0 ? 'border-tlb-yellow text-tlb-dark' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                        >
                            <Filter size={16} />
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-tlb-yellow rounded-full text-[9px] font-black text-tlb-dark flex items-center justify-center">{activeFilterCount}</span>
                            )}
                        </button>
                        {/* Density / view control */}
                        <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 shrink-0">
                            {([
                                { v: 'comfortable' as const, icon: LayoutGrid, label: 'Comfortable' },
                                { v: 'compact' as const, icon: Grid3X3, label: 'Compact' },
                                { v: 'list' as const, icon: List, label: 'List' },
                            ]).map(({ v, icon: Icon, label }) => (
                                <button
                                    key={v}
                                    onClick={() => setViewMode(v)}
                                    title={label}
                                    aria-label={label}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === v ? 'bg-tlb-dark text-white' : 'text-gray-400 hover:text-gray-700'}`}
                                >
                                    <Icon size={16} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map((tab) => {
                            const count = tabCounts[tab] ?? 0;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab
                                        ? 'bg-tlb-yellow text-tlb-dark'
                                        : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                                >
                                    {tab}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === tab ? 'bg-black/10' : 'bg-gray-100'}`}>{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Table / Cards */}
                {filtered.length > 0 ? (
                    <>
                    {viewMode !== 'list' ? (
                    <div key={`${activeTab}-${viewMode}-${filterStatuses.join()}`} data-testid="listings-directory" className={gridClass}>
                        {paginatedListings.map((listing, i) => renderListingCard(listing, viewMode === 'compact', i))}
                    </div>
                    ) : (
                    <div data-testid="listings-directory" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-100">
                                        {['Listing', 'Type', 'Category', 'Date', 'Status', 'Actions'].map(h => (
                                            <th key={h} className={`px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap ${h === 'Actions' ? 'text-right' : ''}`}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginatedListings.map((listing, i) => {
                                        const badge = entityBadgeConfig[listing.entityType];
                                        const BadgeIcon = badge.icon;
                                        const editable = listing.status !== 'published' && listing.status !== 'archived';
                                        return (
                                            <motion.tr
                                                key={listing.id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.18, delay: Math.min(i * 0.015, 0.25) }}
                                                className="hover:bg-tlb-yellow/[0.04] transition-colors group"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {listing.coverUrl ? (
                                                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                                                                <img src={listing.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                                                <BadgeIcon size={18} className="text-gray-300" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm text-gray-900 truncate max-w-[260px]">{listing.title}</p>
                                                            <p className="font-mono text-[10px] text-gray-400 truncate max-w-[260px]" title={listing.id}>ID: {listing.id}</p>
                                                            {listing.coupon && (
                                                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-tlb-yellow/15 text-tlb-dark text-[10px] font-black">
                                                                    <Tag size={9} /> {listing.coupon.code} · {couponDiscountLabel(listing.coupon)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black ${badge.bg} ${badge.color}`}>
                                                        <BadgeIcon size={10} /> {listing.entityType}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-xs font-medium text-gray-500">{listing.category || '-'}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 whitespace-nowrap">
                                                        <Clock size={11} className="text-gray-300" /> {fmtDate(listingDate(listing))}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                                        <span className={`w-2 h-2 rounded-full ${statusDot(listing)}`} />
                                                        {statusLabel(listing)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {listing.status === 'published' && (
                                                            <button
                                                                onClick={() => handleTogglePause(listing)}
                                                                className={`p-2 rounded-lg transition-colors ${listing.isLive !== false ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                                title={listing.isLive !== false ? 'Pause' : 'Resume'}
                                                            >
                                                                {listing.isLive !== false ? <Pause size={15} /> : <Play size={15} />}
                                                            </button>
                                                        )}
                                                        {(listing.status === 'published' || listing.status === 'archived') && (
                                                            <button
                                                                onClick={() => handleToggleArchive(listing)}
                                                                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                                                title={listing.status === 'archived' ? 'Unarchive' : 'Archive'}
                                                            >
                                                                {listing.status === 'archived' ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => openCouponModal(listing)}
                                                            className={`p-2 rounded-lg transition-colors ${listing.coupon ? 'text-tlb-dark bg-tlb-yellow/20 hover:bg-tlb-yellow/30' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                                                            title={listing.coupon ? 'Change coupon' : 'Attach coupon'}
                                                        >
                                                            <Ticket size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(listing)}
                                                            disabled={!editable}
                                                            className={`p-2 rounded-lg transition-colors ${editable ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-300 cursor-not-allowed'}`}
                                                            title={editable ? 'Edit' : 'Locked'}
                                                        >
                                                            <Edit3 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-gray-50">
                            {paginatedListings.map((listing) => {
                                const badge = entityBadgeConfig[listing.entityType];
                                const BadgeIcon = badge.icon;
                                const editable = listing.status !== 'published' && listing.status !== 'archived';
                                return (
                                    <div key={listing.id} className="p-4 space-y-3">
                                        <div className="flex items-start gap-3">
                                            {listing.coverUrl ? (
                                                <img src={listing.coverUrl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                                            ) : (
                                                <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                                    <BadgeIcon size={20} className="text-gray-300" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${badge.bg} ${badge.color}`}>
                                                        {listing.entityType}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 ml-auto">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot(listing)}`} />
                                                        {statusLabel(listing)}
                                                    </span>
                                                </div>
                                                <p className="font-bold text-sm text-gray-900 truncate">{listing.title}</p>
                                                <p className="font-mono text-[10px] text-gray-400 truncate mt-0.5" title={listing.id}>ID: {listing.id}</p>
                                                {listing.category && (
                                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{listing.category}</p>
                                                )}
                                                {listingDate(listing) && (
                                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                                                        <Clock size={9} className="text-gray-300" /> {fmtDate(listingDate(listing))}
                                                    </p>
                                                )}
                                                {listing.coupon && (
                                                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-tlb-yellow/15 text-tlb-dark text-[10px] font-black">
                                                        <Tag size={9} /> {listing.coupon.code} · {couponDiscountLabel(listing.coupon)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-1 pt-1">
                                            <button onClick={() => openCouponModal(listing)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${listing.coupon ? 'text-tlb-dark bg-tlb-yellow/20' : 'text-gray-500 bg-gray-50'}`}>
                                                Coupon
                                            </button>
                                            {listing.status === 'published' && (
                                                <button onClick={() => handleTogglePause(listing)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${listing.isLive !== false ? 'text-amber-500 bg-amber-50' : 'text-emerald-500 bg-emerald-50'}`}>
                                                    {listing.isLive !== false ? 'Pause' : 'Resume'}
                                                </button>
                                            )}
                                            {(listing.status === 'published' || listing.status === 'archived') && (
                                                <button onClick={() => handleToggleArchive(listing)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 bg-gray-50">
                                                    {listing.status === 'archived' ? 'Unarchive' : 'Archive'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEdit(listing)}
                                                disabled={!editable}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${editable ? 'text-blue-600 bg-blue-50' : 'text-gray-300 bg-gray-50 cursor-not-allowed'}`}
                                            >
                                                {editable ? 'Edit' : 'Locked'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    )}

                    {/* Pagination UI */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filtered.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                    </>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-20 px-6">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <Layers size={28} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black text-gray-400 mb-1">No listings yet</h3>
                        <p className="text-sm text-gray-300 mb-6 max-w-xs mx-auto">
                            {activeTab === 'All'
                                ? 'Create your first listing to start attracting customers.'
                                : `You don't have any ${activeTab.toLowerCase()} yet.`}
                        </p>
                        <button onClick={handleAddListing} className="tlb-button px-6 py-3 gap-2">
                            <Plus size={16} /> Create Listing
                        </button>
                    </div>
                )}
            </main>

            <EntityPickerSheet
                isOpen={showEntityPicker}
                onClose={() => setShowEntityPicker(false)}
                allowedEntities={allowedEntities}
                onNavigate={onNavigate}
            />

            {/* History — full list popup */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowHistoryModal(false)}>
                    <div className="bg-white w-full max-w-lg rounded-3xl p-6 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                    <Clock size={18} className="text-gray-500" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-black text-lg leading-tight">History</h2>
                                    <p className="text-xs text-gray-400 font-medium">{olderListings.length} older listing{olderListings.length === 1 ? '' : 's'}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-1.5 overflow-y-auto -mx-2 px-2">
                            {olderListings.map(listing => {
                                const badge = entityBadgeConfig[listing.entityType];
                                const BadgeIcon = badge.icon;
                                return (
                                    <button
                                        key={listing.id}
                                        onClick={() => { setSearchQuery(listing.title); setShowHistoryModal(false); }}
                                        className="group w-full flex items-center gap-3 text-left p-2 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                                            {listing.coverUrl ? (
                                                <img src={listing.coverUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center ${badge.bg}`}>
                                                    <BadgeIcon size={15} className={`${badge.color} opacity-70`} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-900 truncate">{listing.title}</p>
                                            <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                                                {listing.entityType} · {statusBadge[listing.status].label}
                                                {listingDate(listing) && <> · {fmtDate(listingDate(listing))}</>}
                                            </p>
                                        </div>
                                        <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Coupon attach/remove modal */}
            {couponModalListing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => !savingCoupon && setCouponModalListing(null)}>
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-tlb-yellow/15 flex items-center justify-center shrink-0">
                                    <Ticket size={18} className="text-tlb-dark" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-black text-lg leading-tight">Listing Coupon</h2>
                                    <p className="text-xs text-gray-400 font-medium truncate">{couponModalListing.title}</p>
                                </div>
                            </div>
                            <button onClick={() => setCouponModalListing(null)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Attach a coupon</label>
                            {couponList.length > 0 ? (
                                <Select
                                    value={selectedCouponCode}
                                    onChange={setSelectedCouponCode}
                                    options={couponOptions}
                                    placeholder="Select a coupon"
                                    ariaLabel="Listing coupon"
                                />
                            ) : (
                                <div className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                                    You have no active coupons.{' '}
                                    <button onClick={() => onNavigate('CREATE_COUPON')} className="font-bold text-tlb-dark underline">Create one</button>.
                                </div>
                            )}
                            <p className="text-[11px] text-gray-400 mt-1.5">Customers see a discount badge on this listing. Pick “No coupon” to remove.</p>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={() => setCouponModalListing(null)}
                                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveCoupon}
                                disabled={savingCoupon || selectedCouponCode === (couponModalListing.coupon?.code || '')}
                                className="tlb-button flex-1 py-3 disabled:opacity-50"
                            >
                                {savingCoupon
                                    ? <><span className="w-4 h-4 border-2 border-tlb-dark/30 border-t-tlb-dark rounded-full animate-spin" /> Saving…</>
                                    : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Bottom Sheet */}
            {showFilter && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowFilter(false)}>
                    <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 space-y-6" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal size={18} className="text-tlb-dark" />
                                <h2 className="font-black text-lg">Filter Listings</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={resetFilter} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">Reset</button>
                                <button onClick={() => setShowFilter(false)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Status</p>
                            <div className="grid grid-cols-2 gap-2">
                                {(Object.entries(statusBadge) as [ListingStatus, typeof statusBadge[ListingStatus]][]).map(([key, s]) => {
                                    const active = tmpStatuses.includes(key);
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => toggleTmpStatus(key)}
                                            className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${active ? 'border-tlb-yellow bg-tlb-yellow/10 text-tlb-dark' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${key === 'published' ? 'bg-emerald-500' : key === 'pending' ? 'bg-amber-500' : key === 'draft' ? 'bg-gray-400' : key === 'archived' ? 'bg-gray-500' : 'bg-red-500'}`} />
                                                {s.label}
                                            </div>
                                            {active && <Check size={14} className="text-tlb-dark" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Type */}
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Listing Type</p>
                            <div className="grid grid-cols-2 gap-2">
                                {(Object.entries(entityBadgeConfig) as [EntityType, typeof entityBadgeConfig[EntityType]][])
                                    .filter(([type]) => allowedEntities.includes(type))
                                    .map(([type, cfg]) => {
                                        const active = tmpTypes.includes(type);
                                        const Icon = cfg.icon;
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => toggleTmpType(type)}
                                                className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${active ? 'border-tlb-yellow bg-tlb-yellow/10 text-tlb-dark' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
                                            >
                                                <div className={`flex items-center gap-2 ${active ? 'text-tlb-dark' : cfg.color}`}>
                                                    <Icon size={15} />
                                                    {type}
                                                </div>
                                                {active && <Check size={14} className="text-tlb-dark" />}
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Date range */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date Range</p>
                                {(tmpDateFrom || tmpDateTo) && (
                                    <button onClick={() => { setTmpDateFrom(''); setTmpDateTo(''); }} className="text-[10px] font-black text-gray-400 hover:text-red-500 transition-colors">Clear</button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 mb-1 block">From</label>
                                    <input
                                        type="date"
                                        value={tmpDateFrom}
                                        max={tmpDateTo || undefined}
                                        onChange={e => setTmpDateFrom(e.target.value)}
                                        className="w-full bg-white border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 focus:border-tlb-yellow outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 mb-1 block">To</label>
                                    <input
                                        type="date"
                                        value={tmpDateTo}
                                        min={tmpDateFrom || undefined}
                                        onChange={e => setTmpDateTo(e.target.value)}
                                        className="w-full bg-white border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 focus:border-tlb-yellow outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sort */}
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Sort By</p>
                            <div className="grid grid-cols-2 gap-2">
                                {([
                                    { value: 'newest', label: 'Newest First' },
                                    { value: 'oldest', label: 'Oldest First' },
                                    { value: 'a-z',    label: 'A → Z' },
                                    { value: 'z-a',    label: 'Z → A' },
                                ] as { value: SortOption; label: string }[]).map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setTmpSort(opt.value)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${tmpSort === opt.value ? 'border-tlb-yellow bg-tlb-yellow/10 text-tlb-dark' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
                                    >
                                        {opt.label}
                                        {tmpSort === opt.value && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Apply */}
                        <button onClick={applyFilter} className="tlb-button w-full py-4 gap-2 shadow-lg shadow-tlb-yellow/20">
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
