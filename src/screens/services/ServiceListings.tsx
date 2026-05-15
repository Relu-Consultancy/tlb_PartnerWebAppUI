import React, { useState, useEffect } from 'react';
import { Menu, Plus, Search, Filter, Users, Edit3, CalendarDays, BarChart3, MapPin, Layers, Loader2, Clock, X, Check, SlidersHorizontal } from 'lucide-react';
import { Screen, EntityType } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { EntityPickerSheet } from '../../components/EntityPickerSheet';
import { getEventListings, getVenueListings, getClassListings, getProgramListings, setCurrentDraftId, clearCurrentDraftId, setCurrentVenueDraftId, clearCurrentVenueDraftId, setCurrentClassDraftId, clearCurrentClassDraftId, setCurrentProgramDraftId, clearCurrentProgramDraftId } from '../../api/listings';

interface Props {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

type ListingStatus = 'draft' | 'pending' | 'published' | 'rejected';

interface Listing {
    id: string;
    title: string;
    category: string;
    entityType: EntityType;
    listingType: string; // raw API listing_type ("event", "class", etc.)
    status: ListingStatus;
    coverUrl?: string;
    startDateTime?: string;
}

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
};

const listingTypeToEntity = (lt: string): EntityType => {
    switch ((lt || '').toLowerCase()) {
        case 'event': return 'Events';
        case 'class': return 'Classes';
        case 'program': return 'Programs';
        case 'venue': return 'Venues';
        default: return 'Events';
    }
};

const fmtStart = (iso?: string) => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
};

type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a';

export const ServiceListings: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const { allowedEntities } = usePartner();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<EntityType | 'All'>('All');
    const [showEntityPicker, setShowEntityPicker] = useState(false);

    // Filter state
    const [showFilter, setShowFilter] = useState(false);
    const [filterStatuses, setFilterStatuses] = useState<ListingStatus[]>([]);
    const [filterTypes, setFilterTypes] = useState<EntityType[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    // Temp state (inside dialog before Apply)
    const [tmpStatuses, setTmpStatuses] = useState<ListingStatus[]>([]);
    const [tmpTypes, setTmpTypes] = useState<EntityType[]>([]);
    const [tmpSort, setTmpSort] = useState<SortOption>('newest');

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
                <Loader2 size={28} className="text-tlb-yellow animate-spin" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading listings…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                <button onClick={onOpenSidebar} className="p-2 -ml-2"><Menu size={24} /></button>
                <h1 className="font-black text-lg">My Listings</h1>
                <button onClick={handleAddListing} className="bg-tlb-yellow text-tlb-dark p-2.5 rounded-xl shadow-sm hover:brightness-105 active:scale-95 transition-all">
                    <Plus size={20} />
                </button>
            </header>

            <main className="p-6">
                <div className="tlb-content space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs font-bold text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Search */}
                    <div className="flex gap-3">
                        <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                            <Search size={18} className="text-gray-400" />
                            <input
                                className="bg-transparent flex-1 text-sm outline-none"
                                placeholder="Search listings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={openFilter}
                            className={`relative bg-white border p-3 rounded-2xl shadow-sm transition-colors ${activeFilterCount > 0 ? 'border-tlb-yellow text-tlb-dark' : 'border-gray-100 text-gray-400 hover:border-tlb-yellow/30'}`}
                        >
                            <Filter size={18} />
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-tlb-yellow rounded-full text-[9px] font-black text-tlb-dark flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                        {tabs.map((tab) => {
                            const count = tabCounts[tab] ?? 0;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab
                                        ? 'bg-tlb-dark text-tlb-yellow shadow-md'
                                        : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-200'
                                    }`}
                                >
                                    {tab === 'All' ? <Layers size={14} /> : React.createElement(entityBadgeConfig[tab].icon, { size: 14 })}
                                    {tab}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-tlb-yellow/20 text-tlb-yellow' : 'bg-gray-100 text-gray-400'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Stats */}
                    {listings.length > 0 && (
                        <div className="flex gap-3">
                            <div className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 text-center">
                                <p className="text-2xl font-black text-emerald-500">{filtered.filter(s => s.status === 'published').length}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Live</p>
                            </div>
                            <div className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 text-center">
                                <p className="text-2xl font-black text-amber-500">{filtered.filter(s => s.status === 'pending').length}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">In Review</p>
                            </div>
                            <div className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 text-center">
                                <p className="text-2xl font-black text-gray-500">{filtered.filter(s => s.status === 'draft').length}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Drafts</p>
                            </div>
                        </div>
                    )}

                    {/* Cards */}
                    {filtered.length > 0 ? (
                        <div className="space-y-4">
                            {filtered.map((listing) => {
                                const badge = entityBadgeConfig[listing.entityType];
                                const BadgeIcon = badge.icon;
                                const sb = statusBadge[listing.status];
                                return (
                                    <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                        {listing.coverUrl && (
                                            <div className="w-full h-32 bg-gray-100 overflow-hidden">
                                                <img src={listing.coverUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.bg} ${badge.color}`}>
                                                            <BadgeIcon size={10} /> {listing.entityType}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-lg truncate">{listing.title}</h3>
                                                    {listing.category && (
                                                        <p className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest mt-0.5">{listing.category}</p>
                                                    )}
                                                    {listing.startDateTime && (
                                                        <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                                                            <Clock size={10} /> {fmtStart(listing.startDateTime)}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`shrink-0 mt-0.5 px-3 py-1.5 rounded-xl text-[11px] font-black border ${sb.bg} ${sb.color} ${
                                                    listing.status === 'published' ? 'border-emerald-200' :
                                                    listing.status === 'pending'   ? 'border-amber-200' :
                                                    listing.status === 'rejected'  ? 'border-red-200' :
                                                    'border-gray-200'
                                                }`}>
                                                    {sb.label}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 px-5 py-3 flex justify-end">
                                            <button
                                                onClick={() => handleEdit(listing)}
                                                disabled={listing.status === 'published'}
                                                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${
                                                    listing.status === 'published'
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : 'text-tlb-yellow hover:underline'
                                                }`}
                                            >
                                                <Edit3 size={14} />
                                                {listing.status === 'published' ? 'Locked' : 'Edit Listing'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Layers size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-xl font-black text-gray-400 mb-2">No listings yet</h3>
                            <p className="text-sm text-gray-300 mb-6 max-w-xs mx-auto">
                                {activeTab === 'All'
                                    ? 'Create your first listing to start attracting customers.'
                                    : `You don't have any ${activeTab.toLowerCase()} yet.`}
                            </p>
                            <button onClick={handleAddListing} className="tlb-button px-8 py-3 shadow-lg shadow-tlb-yellow/20 gap-2">
                                <Plus size={18} /> Create Listing
                            </button>
                        </div>
                    )}

                    {filtered.length > 0 && (
                        <button
                            onClick={handleAddListing}
                            className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20 text-base gap-2"
                        >
                            <Plus size={20} /> Add New Listing
                        </button>
                    )}
                </div>
            </main>

            <EntityPickerSheet
                isOpen={showEntityPicker}
                onClose={() => setShowEntityPicker(false)}
                allowedEntities={allowedEntities}
                onNavigate={onNavigate}
            />

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
                                                <span className={`w-2 h-2 rounded-full ${key === 'published' ? 'bg-emerald-500' : key === 'pending' ? 'bg-amber-500' : key === 'draft' ? 'bg-gray-400' : 'bg-red-500'}`} />
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
