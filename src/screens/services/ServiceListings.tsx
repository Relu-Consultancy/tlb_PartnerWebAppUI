import React, { useState } from 'react';
import { Menu, Plus, Search, Filter, Clock, Users, ToggleLeft, ToggleRight, Edit3 } from 'lucide-react';
import { Screen } from '../../types';

interface Props {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

const mockServices = [
    {
        id: '1', title: 'Hatha Yoga', category: 'Yoga & Wellness', status: 'Live' as const,
        batches: [
            { name: 'Morning Batch', days: 'Mon, Wed, Fri', time: '7:00–8:00 AM', capacity: 15, enrolled: 12 },
            { name: 'Evening Batch', days: 'Tue, Thu', time: '6:00–7:00 PM', capacity: 20, enrolled: 8 },
        ]
    },
    {
        id: '2', title: 'Kids Contemporary Dance', category: 'Dance & Movement', status: 'Live' as const,
        batches: [
            { name: 'Weekend Morning', days: 'Sat', time: '10:00–11:30 AM', capacity: 25, enrolled: 22 },
            { name: 'Weekend Afternoon', days: 'Sat', time: '2:00–3:30 PM', capacity: 25, enrolled: 15 },
        ]
    },
    {
        id: '3', title: 'Keyboard Basics', category: 'Music & Instruments', status: 'Paused' as const,
        batches: [
            { name: 'Sunday Batch', days: 'Sun', time: '11:00 AM–12:00 PM', capacity: 10, enrolled: 0 },
        ]
    },
];

export const ServiceListings: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const [services, setServices] = useState(mockServices);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleStatus = (id: string) => {
        setServices(prev => prev.map(s =>
            s.id === id ? { ...s, status: s.status === 'Live' ? 'Paused' as const : 'Live' as const } : s
        ));
    };

    const filtered = services.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
    <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            <button onClick={onOpenSidebar} className="p-2 -ml-2"><Menu size={24} /></button>
            <h1 className="font-black text-lg">My Services</h1>
            <button onClick={() => onNavigate('CREATE_LISTING_IDENTITY')} className="bg-tlb-yellow text-tlb-dark p-2 rounded-xl">
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
                            placeholder="Search classes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="bg-white border border-gray-100 p-3 rounded-2xl text-gray-400 shadow-sm">
                        <Filter size={18} />
                    </button>
                </div>

                {/* Stats bar */}
                <div className="flex gap-3">
                    <div className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 text-center">
                        <p className="text-2xl font-black text-emerald-500">{services.filter(s => s.status === 'Live').length}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Live</p>
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 text-center">
                        <p className="text-2xl font-black text-amber-500">{services.filter(s => s.status === 'Paused').length}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Paused</p>
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 text-center">
                        <p className="text-2xl font-black">{services.reduce((a, s) => a + s.batches.length, 0)}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Batches</p>
                    </div>
                </div>

                {/* Service Cards */}
                <div className="space-y-4">
                    {filtered.map((service) => (
                        <div key={service.id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${service.status === 'Paused' ? 'border-gray-200 opacity-75' : 'border-gray-100'}`}>
                            {/* Service Header */}
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg">{service.title}</h3>
                                        <p className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest mt-0.5">{service.category}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleStatus(service.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                                service.status === 'Live'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : 'bg-gray-100 text-gray-400'
                                            }`}
                                        >
                                            {service.status === 'Live' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                            {service.status}
                                        </button>
                                    </div>
                                </div>

                                {/* Batch List */}
                                <div className="mt-4 space-y-2">
                                    {service.batches.map((batch, i) => (
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
                                <button className="flex items-center gap-1.5 text-xs font-bold text-tlb-yellow uppercase tracking-widest hover:underline">
                                    <Edit3 size={14} /> Edit Class
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add New Class CTA */}
                <button
                    onClick={() => onNavigate('CREATE_LISTING_IDENTITY')}
                    className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20 text-base gap-2"
                >
                    <Plus size={20} /> Add New Class
                </button>
            </div>
        </main>
    </div>
    );
};
