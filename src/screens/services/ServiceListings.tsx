import React, { useState, useEffect } from 'react';
import { Menu, Plus, Search, Filter, Users, Edit3, CalendarDays, BarChart3, MapPin, Layers, Loader2, Clock } from 'lucide-react';
import { Screen, EntityType } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { EntityPickerSheet } from '../../components/EntityPickerSheet';
import { getListings, setCurrentDraftId, clearCurrentDraftId } from '../../api/listings';

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

export const ServiceListings: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const { allowedEntities } = usePartner();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<EntityType | 'All'>('All');
    const [showEntityPicker, setShowEntityPicker] = useState(false);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const res = await getListings();
                const data = res.data || res;
                const normalized: Listing[] = (Array.isArray(data) ? data : []).map((item: any) => ({
                    id: String(item.id || ''),
                    title: item.title || 'Untitled',
                    category: item.category?.name || item.subcategory?.name || '',
                    entityType: listingTypeToEntity(item.listing_type),
                    listingType: item.listing_type || '',
                    status: (item.status as ListingStatus) || 'draft',
                    coverUrl: item.cover_url,
                    startDateTime: item.start_datetime,
                }));
                setListings(normalized);
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
        // Starting fresh — clear any leftover draft id
        clearCurrentDraftId();
        if (allowedEntities.length === 1) {
            const entity = allowedEntities[0];
            if (entity === 'Events') onNavigate('CREATE_EVENT_DETAILS');
            else if (entity === 'Venues') onNavigate('CREATE_VENUE_DETAILS');
            else if (entity === 'Programs') onNavigate('CREATE_PROGRAM_IDENTITY');
            else onNavigate('CREATE_LISTING_IDENTITY');
        } else if (allowedEntities.length > 1) {
            setShowEntityPicker(true);
        } else {
            onNavigate('CREATE_LISTING_IDENTITY');
        }
    };

    const handleEdit = (listing: Listing) => {
        if (listing.entityType === 'Events') {
            setCurrentDraftId(listing.id);
            onNavigate('CREATE_EVENT_DETAILS');
            return;
        }
        // Other entity wizards aren't API-integrated yet — just navigate
        if (listing.entityType === 'Venues') onNavigate('CREATE_VENUE_DETAILS');
        else if (listing.entityType === 'Programs') onNavigate('CREATE_PROGRAM_IDENTITY');
        else onNavigate('CREATE_LISTING_IDENTITY');
    };

    const filtered = listings
        .filter(s => activeTab === 'All' || s.entityType === activeTab)
        .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

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
                        <button className="bg-white border border-gray-100 p-3 rounded-2xl text-gray-400 shadow-sm hover:border-tlb-yellow/30 transition-colors">
                            <Filter size={18} />
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
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.bg} ${badge.color}`}>
                                                            <BadgeIcon size={10} /> {listing.entityType}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${sb.bg} ${sb.color}`}>
                                                            {sb.label}
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
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 px-5 py-3 flex justify-end">
                                            <button
                                                onClick={() => handleEdit(listing)}
                                                disabled={listing.status === 'pending' || listing.status === 'published'}
                                                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${
                                                    listing.status === 'pending' || listing.status === 'published'
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : 'text-tlb-yellow hover:underline'
                                                }`}
                                            >
                                                <Edit3 size={14} />
                                                {listing.status === 'pending' || listing.status === 'published' ? 'Locked' : 'Edit Listing'}
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
        </div>
    );
};
