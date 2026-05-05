import React, { useState } from 'react';
import { Menu, Plus, Search, Filter, Clock, Users, ToggleLeft, ToggleRight, Edit3, CalendarDays, BarChart3, MapPin, Layers } from 'lucide-react';
import { Screen, EntityType } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { EntityPickerSheet } from '../../components/EntityPickerSheet';

interface Props {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

import { mockListings, ListingMock } from '../../data/mockData';

const entityBadgeConfig: Record<EntityType, { color: string; bg: string; icon: any }> = {
    Events: { color: 'text-purple-600', bg: 'bg-purple-50', icon: CalendarDays },
    Classes: { color: 'text-blue-600', bg: 'bg-blue-50', icon: BarChart3 },
    Programs: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Users },
    Venues: { color: 'text-amber-600', bg: 'bg-amber-50', icon: MapPin },
};

export const ServiceListings: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const { allowedEntities } = usePartner();
    const [listings, setListings] = useState(mockListings);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<EntityType | 'All'>('All');
    const [showEntityPicker, setShowEntityPicker] = useState(false);

    const toggleStatus = (id: string) => {
        setListings(prev => prev.map(s =>
            s.id === id ? { ...s, status: s.status === 'Live' ? 'Paused' as const : 'Live' as const } : s
        ));
    };

    const handleAddListing = () => {
        if (allowedEntities.length === 1) {
            // Single entity — skip picker, go directly
            const entity = allowedEntities[0];
            if (entity === 'Events') onNavigate('CREATE_EVENT_DETAILS');
            else if (entity === 'Venues') onNavigate('CREATE_VENUE_DETAILS');
            else if (entity === 'Programs') onNavigate('CREATE_PROGRAM_IDENTITY');
            else onNavigate('CREATE_LISTING_IDENTITY');
        } else if (allowedEntities.length > 1) {
            setShowEntityPicker(true);
        } else {
            // Fallback if nothing set
            onNavigate('CREATE_LISTING_IDENTITY');
        }
    };

    const getEditScreen = (entityType: EntityType): Screen => {
        if (entityType === 'Events') return 'CREATE_EVENT_DETAILS';
        if (entityType === 'Venues') return 'CREATE_VENUE_DETAILS';
        if (entityType === 'Programs') return 'CREATE_PROGRAM_IDENTITY';
        return 'CREATE_LISTING_IDENTITY';
    };

    // Filter by tab + search
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

                    {/* Entity Type Tabs */}
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

                    {/* Stats bar */}
                    <div className="flex gap-3">
                        <div className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 text-center">
                            <p className="text-2xl font-black text-emerald-500">{filtered.filter(s => s.status === 'Live').length}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Live</p>
                        </div>
                        <div className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 text-center">
                            <p className="text-2xl font-black text-amber-500">{filtered.filter(s => s.status === 'Paused').length}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Paused</p>
                        </div>
                        <div className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 text-center">
                            <p className="text-2xl font-black">{filtered.reduce((a, s) => a + s.batches.length, 0)}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Batches</p>
                        </div>
                    </div>

                    {/* Listing Cards */}
                    {filtered.length > 0 ? (
                        <div className="space-y-4">
                            {filtered.map((listing) => {
                                const badge = entityBadgeConfig[listing.entityType];
                                const BadgeIcon = badge.icon;
                                return (
                                    <div key={listing.id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${listing.status === 'Paused' ? 'border-gray-200 opacity-75' : 'border-gray-100'}`}>
                                        <div className="p-5">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.bg} ${badge.color}`}>
                                                            <BadgeIcon size={10} /> {listing.entityType}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-lg">{listing.title}</h3>
                                                    <p className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest mt-0.5">{listing.category}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => toggleStatus(listing.id)}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${listing.status === 'Live'
                                                            ? 'bg-emerald-50 text-emerald-600'
                                                            : 'bg-gray-100 text-gray-400'
                                                        }`}
                                                    >
                                                        {listing.status === 'Live' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                        {listing.status}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Batch List */}
                                            <div className="mt-4 space-y-2">
                                                {listing.batches.map((batch, i) => (
                                                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-tlb-yellow/10 p-1.5 rounded-lg text-tlb-yellow">
                                                                <Clock size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold">{batch.name}</p>
                                                                <p className="text-[11px] text-gray-400">{batch.days} • {batch.time}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                                            <Users size={12} /> {batch.enrolled}/{batch.capacity}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="border-t border-gray-100 px-5 py-3 flex justify-end">
                                            <button onClick={() => onNavigate(getEditScreen(listing.entityType))} className="flex items-center gap-1.5 text-xs font-bold text-tlb-yellow uppercase tracking-widest hover:underline">
                                                <Edit3 size={14} /> Edit Listing
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Empty State */
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

                    {/* Add New Listing CTA */}
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

            {/* Entity Picker Bottom Sheet */}
            <EntityPickerSheet
                isOpen={showEntityPicker}
                onClose={() => setShowEntityPicker(false)}
                allowedEntities={allowedEntities}
                onNavigate={onNavigate}
            />
        </div>
    );
};
