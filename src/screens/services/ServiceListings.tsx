import React, { useState, useEffect } from 'react';
import { Menu, Plus, Search, Filter, Users, Edit3, CalendarDays, BarChart3, MapPin, Layers, Clock, X, Check, SlidersHorizontal, Play, Pause, Archive, ArchiveRestore, Ticket, Tag, LayoutGrid, Grid3X3, List } from 'lucide-react';
import { Loader, toast, Select, SelectOption } from '../../components/ui';
import { Screen, EntityType } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { EntityPickerSheet } from '../../components/EntityPickerSheet';
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
    isLive?: boolean;
    coupon?: ListingCoupon | null;
}

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


const fmtStart = (iso?: string) => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
};

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

    // Temp state (inside dialog before Apply)
    const [tmpStatuses, setTmpStatuses] = useState<ListingStatus[]>([]);
    const [tmpTypes, setTmpTypes] = useState<EntityType[]>([]);
    const [tmpSort, setTmpSort] = useState<SortOption>('newest');

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
        setShowFilter(true);
    };

    const applyFilter = () => {
        setFilterStatuses(tmpStatuses);
        setFilterTypes(tmpTypes);
        setSortBy(tmpSort);
        setShowFilter(false);
    };

    const resetFilter = () => {
        setTmpStatuses([]);
        setTmpTypes([]);
        setTmpSort('newest');
    };

    const toggleTmpStatus = (s: ListingStatus) =>
        setTmpStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

    const toggleTmpType = (t: EntityType) =>
        setTmpTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

    const activeFilterCount = filterStatuses.length + filterTypes.length + (sortBy !== 'newest' ? 1 : 0);

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
                        startDateTime: item.start_datetime,
                        isLive: item.is_live,
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
        .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(s => filterStatuses.length === 0 || filterStatuses.includes(s.status))
        .filter(s => filterTypes.length === 0 || filterTypes.includes(s.entityType))
        .sort((a, b) => {
            if (sortBy === 'a-z') return a.title.localeCompare(b.title);
            if (sortBy === 'z-a') return b.title.localeCompare(a.title);
            if (sortBy === 'oldest') return (a.startDateTime || a.id) < (b.startDateTime || b.id) ? -1 : 1;
            return (a.startDateTime || a.id) > (b.startDateTime || b.id) ? -1 : 1; // newest
        });

    const tabCounts = {
        All: listings.length,
        ...Object.fromEntries(
            (['Events', 'Classes', 'Programs', 'Venues'] as EntityType[]).map(e => [e, listings.filter(l => l.entityType === e).length])
        ),
    };

    const tabs: (EntityType | 'All')[] = ['All', ...allowedEntities];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
                <Loader />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading listings…</p>
            </div>
        );
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

    const renderListingCard = (listing: Listing, compact: boolean) => {
        const badge = entityBadgeConfig[listing.entityType];
        const BadgeIcon = badge.icon;
        const editable = listing.status !== 'published' && listing.status !== 'archived';
        const thumb = compact ? 'w-10 h-10' : 'w-12 h-12';
        return (
            <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all p-4 flex flex-col">
                <div className="flex items-start gap-3">
                    {listing.coverUrl ? (
                        <img src={listing.coverUrl} alt="" className={`${thumb} rounded-xl object-cover shrink-0 bg-gray-100`} />
                    ) : (
                        <div className={`${thumb} rounded-xl bg-gray-100 flex items-center justify-center shrink-0`}>
                            <BadgeIcon size={compact ? 16 : 18} className="text-gray-300" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${badge.bg} ${badge.color}`}>{listing.entityType}</span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 ml-auto">
                                <span className={`w-1.5 h-1.5 rounded-full ${statusDot(listing)}`} />
                                {statusLabel(listing)}
                            </span>
                        </div>
                        <p className="font-bold text-sm text-gray-900 truncate">{listing.title}</p>
                        {!compact && listing.category && (
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5 truncate">{listing.category}</p>
                        )}
                        {listing.coupon && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-tlb-yellow/15 text-tlb-dark text-[10px] font-black">
                                <Tag size={9} /> {listing.coupon.code} · {couponDiscountLabel(listing.coupon)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-50">
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
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white px-6 md:px-8 py-5 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors"><Menu size={22} /></button>
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

                {/* Search + Filter + Tabs row */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 flex gap-3">
                        <div className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
                            <Search size={16} className="text-gray-400" />
                            <input
                                className="bg-transparent flex-1 text-sm outline-none placeholder:text-gray-400"
                                placeholder="Search listings..."
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
                    viewMode !== 'list' ? (
                    <div className={gridClass}>
                        {filtered.map((listing) => renderListingCard(listing, viewMode === 'compact'))}
                    </div>
                    ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-100">
                                        {['Listing', 'Type', 'Category', 'Status', 'Actions'].map(h => (
                                            <th key={h} className={`px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap ${h === 'Actions' ? 'text-right' : ''}`}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((listing) => {
                                        const badge = entityBadgeConfig[listing.entityType];
                                        const BadgeIcon = badge.icon;
                                        const editable = listing.status !== 'published' && listing.status !== 'archived';
                                        return (
                                            <tr key={listing.id} className="hover:bg-gray-50/40 transition-colors group">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {listing.coverUrl ? (
                                                            <img src={listing.coverUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 bg-gray-100" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                                                <BadgeIcon size={18} className="text-gray-300" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm text-gray-900 truncate max-w-[260px]">{listing.title}</p>
                                                            {listing.startDateTime && (
                                                                <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                                                                    <Clock size={10} /> {fmtStart(listing.startDateTime)}
                                                                </p>
                                                            )}
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
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-gray-50">
                            {filtered.map((listing) => {
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
                                                {listing.category && (
                                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{listing.category}</p>
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
                    )
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
