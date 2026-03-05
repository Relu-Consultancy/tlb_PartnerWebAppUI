import React, { useState, useMemo } from 'react';
import {
    Menu, Search, Download, FileText, FileSpreadsheet, ClipboardCheck,
    CheckCircle2, XCircle, Gift, ChevronDown, Clock, Users, CalendarDays,
    Radio, Filter, UserCircle
} from 'lucide-react';
import { Screen } from '../../types';

interface AttendeesProps {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

type Tab = 'live' | 'upcoming' | 'past';
type TicketStatus = 'paid' | 'comp' | 'cancelled';

interface Attendee {
    id: string;
    name: string;
    phone: string;
    email: string;
    ticketType: string;
    status: TicketStatus;
    checkedIn: boolean;
    checkInTime?: string;
    event: string;
    eventDate: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const LIVE_ATTENDEES: Attendee[] = [
    { id: '1', name: 'Aarav Mehta', phone: '+91 98765 43210', email: 'aarav@mail.com', ticketType: 'VIP', status: 'paid', checkedIn: true, checkInTime: '6:42 PM', event: 'Hamilton Live Workshop', eventDate: 'Today, 7:00 PM' },
    { id: '2', name: 'Priya Sharma', phone: '+91 87654 32109', email: 'priya@mail.com', ticketType: 'General', status: 'paid', checkedIn: true, checkInTime: '6:55 PM', event: 'Hamilton Live Workshop', eventDate: 'Today, 7:00 PM' },
    { id: '3', name: 'Rohan Das', phone: '+91 76543 21098', email: 'rohan@mail.com', ticketType: 'VIP', status: 'comp', checkedIn: false, event: 'Hamilton Live Workshop', eventDate: 'Today, 7:00 PM' },
    { id: '4', name: 'Sneha Iyer', phone: '+91 65432 10987', email: 'sneha@mail.com', ticketType: 'General', status: 'paid', checkedIn: false, event: 'Hamilton Live Workshop', eventDate: 'Today, 7:00 PM' },
    { id: '5', name: 'Kabir Nair', phone: '+91 54321 09876', email: 'kabir@mail.com', ticketType: 'Premium', status: 'cancelled', checkedIn: false, event: 'Hamilton Live Workshop', eventDate: 'Today, 7:00 PM' },
    { id: '6', name: 'Meera Joshi', phone: '+91 43210 98765', email: 'meera@mail.com', ticketType: 'General', status: 'paid', checkedIn: true, checkInTime: '6:58 PM', event: 'Hamilton Live Workshop', eventDate: 'Today, 7:00 PM' },
];

const UPCOMING_ATTENDEES: Attendee[] = [
    { id: '10', name: 'Arjun Reddy', phone: '+91 91234 56789', email: 'arjun@mail.com', ticketType: 'VIP', status: 'paid', checkedIn: false, event: 'Broadway Dance Masterclass', eventDate: 'Mar 8, 4:00 PM' },
    { id: '11', name: 'Diya Kapoor', phone: '+91 82345 67890', email: 'diya@mail.com', ticketType: 'General', status: 'paid', checkedIn: false, event: 'Broadway Dance Masterclass', eventDate: 'Mar 8, 4:00 PM' },
    { id: '12', name: 'Vikram Singh', phone: '+91 73456 78901', email: 'vikram@mail.com', ticketType: 'Premium', status: 'comp', checkedIn: false, event: 'Broadway Dance Masterclass', eventDate: 'Mar 8, 4:00 PM' },
    { id: '13', name: 'Ananya Patel', phone: '+91 64567 89012', email: 'ananya@mail.com', ticketType: 'General', status: 'paid', checkedIn: false, event: 'Les Misérables Singing Workshop', eventDate: 'Mar 12, 6:00 PM' },
    { id: '14', name: 'Karan Malhotra', phone: '+91 55678 90123', email: 'karan@mail.com', ticketType: 'VIP', status: 'paid', checkedIn: false, event: 'Les Misérables Singing Workshop', eventDate: 'Mar 12, 6:00 PM' },
];

const PAST_ATTENDEES: Attendee[] = [
    { id: '20', name: 'Riya Gupta', phone: '+91 98765 11111', email: 'riya@mail.com', ticketType: 'VIP', status: 'paid', checkedIn: true, checkInTime: '5:30 PM', event: 'Phantom of the Opera Night', eventDate: 'Feb 25, 6:00 PM' },
    { id: '21', name: 'Aditya Verma', phone: '+91 98765 22222', email: 'aditya@mail.com', ticketType: 'General', status: 'paid', checkedIn: true, checkInTime: '5:45 PM', event: 'Phantom of the Opera Night', eventDate: 'Feb 25, 6:00 PM' },
    { id: '22', name: 'Neha Bose', phone: '+91 98765 33333', email: 'neha@mail.com', ticketType: 'General', status: 'paid', checkedIn: false, event: 'Phantom of the Opera Night', eventDate: 'Feb 25, 6:00 PM' },
    { id: '23', name: 'Siddharth Rao', phone: '+91 98765 44444', email: 'sid@mail.com', ticketType: 'Premium', status: 'comp', checkedIn: true, checkInTime: '5:50 PM', event: 'Chicago Musical Showcase', eventDate: 'Feb 18, 7:30 PM' },
    { id: '24', name: 'Pooja Nambiar', phone: '+91 98765 55555', email: 'pooja@mail.com', ticketType: 'General', status: 'cancelled', checkedIn: false, event: 'Chicago Musical Showcase', eventDate: 'Feb 18, 7:30 PM' },
];

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    paid: { label: 'Paid', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 size={10} /> },
    comp: { label: 'Comp', color: 'text-blue-600', bg: 'bg-blue-50', icon: <Gift size={10} /> },
    cancelled: { label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-50', icon: <XCircle size={10} /> },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
    const cfg = STATUS_CONFIG[status];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.color} ${cfg.bg}`}>
            {cfg.icon} {cfg.label}
        </span>
    );
};

const CheckInToggle: React.FC<{ checked: boolean; disabled?: boolean; onToggle: () => void }> = ({ checked, disabled, onToggle }) => (
    <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            } ${checked ? 'bg-tlb-yellow' : 'bg-gray-200'}`}
    >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'
            }`} />
    </button>
);

const DownloadBar: React.FC<{ tab: Tab }> = ({ tab }) => {
    const [open, setOpen] = useState(false);

    const options = tab === 'live' ? [
        { icon: <FileText size={14} />, label: 'Download PDF', sub: 'Attendee list' },
        { icon: <FileSpreadsheet size={14} />, label: 'Export to Excel', sub: 'Full spreadsheet' },
        { icon: <ClipboardCheck size={14} />, label: 'Check-in Report', sub: 'Entry times & status' },
    ] : tab === 'upcoming' ? [
        { icon: <FileText size={14} />, label: 'Download PDF', sub: 'Ticket holders list' },
        { icon: <FileSpreadsheet size={14} />, label: 'Export to Excel', sub: 'Full spreadsheet' },
    ] : [
        { icon: <FileText size={14} />, label: 'Export CSV', sub: 'Historical records' },
        { icon: <ClipboardCheck size={14} />, label: 'Check-in Report', sub: 'Attendance log' },
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 bg-tlb-dark text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors"
            >
                <Download size={14} /> Export <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                        {options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => setOpen(false)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                            >
                                <div className="text-tlb-yellow">{opt.icon}</div>
                                <div className="text-left">
                                    <p className="text-xs font-bold text-tlb-dark">{opt.label}</p>
                                    <p className="text-[10px] text-gray-400">{opt.sub}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Attendee Table
// ---------------------------------------------------------------------------
const AttendeeTable: React.FC<{
    attendees: Attendee[];
    showCheckIn: boolean;
    onToggleCheckIn?: (id: string) => void;
}> = ({ attendees, showCheckIn, onToggleCheckIn }) => (
    <div className="space-y-3">
        {attendees.map((a) => (
            <div
                key={a.id}
                className={`tlb-card p-4 flex items-center gap-3 transition-colors ${a.status === 'cancelled' ? 'opacity-60' : ''
                    }`}
            >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-black ${a.checkedIn ? 'bg-tlb-yellow/10 text-tlb-yellow' : 'bg-gray-100 text-gray-400'
                    }`}>
                    {a.name.split(' ').map(n => n[0]).join('')}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm truncate">{a.name}</h4>
                        <StatusBadge status={a.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[11px] text-gray-400 font-medium">{a.phone}</span>
                        <span className="text-[10px] text-gray-300">|</span>
                        <span className="text-[11px] text-gray-400 font-medium">{a.ticketType}</span>
                    </div>
                    {a.checkedIn && a.checkInTime && (
                        <p className="text-[10px] text-tlb-yellow font-bold mt-1 flex items-center gap-1">
                            <Clock size={10} /> Checked in at {a.checkInTime}
                        </p>
                    )}
                </div>

                {/* Check-in toggle */}
                {showCheckIn && (
                    <div className="shrink-0 flex flex-col items-center gap-1">
                        <CheckInToggle
                            checked={a.checkedIn}
                            disabled={a.status === 'cancelled'}
                            onToggle={() => onToggleCheckIn?.(a.id)}
                        />
                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                            {a.checkedIn ? 'In' : 'Check'}
                        </span>
                    </div>
                )}
            </div>
        ))}

        {attendees.length === 0 && (
            <div className="text-center py-12">
                <UserCircle size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm font-bold text-gray-400">No attendees found</p>
                <p className="text-xs text-gray-300 mt-1">Try adjusting your search or filters</p>
            </div>
        )}
    </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export const Attendees: React.FC<AttendeesProps> = ({ onOpenSidebar }) => {
    const [activeTab, setActiveTab] = useState<Tab>('live');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [dateFilter, setDateFilter] = useState('');

    const [liveData, setLiveData] = useState<Attendee[]>(LIVE_ATTENDEES);
    const [upcomingData] = useState<Attendee[]>(UPCOMING_ATTENDEES);
    const [pastData] = useState<Attendee[]>(PAST_ATTENDEES);

    const sourceData = activeTab === 'live' ? liveData : activeTab === 'upcoming' ? upcomingData : pastData;

    const filtered = useMemo(() => {
        let result = sourceData;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(a =>
                a.name.toLowerCase().includes(q) ||
                a.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
                a.email.toLowerCase().includes(q)
            );
        }
        if (statusFilter !== 'all') {
            result = result.filter(a => a.status === statusFilter);
        }
        if (dateFilter && activeTab === 'past') {
            result = result.filter(a => a.eventDate.toLowerCase().includes(dateFilter.toLowerCase()));
        }
        return result;
    }, [sourceData, search, statusFilter, dateFilter, activeTab]);

    const handleToggleCheckIn = (id: string) => {
        setLiveData(prev => prev.map(a =>
            a.id === id && a.status !== 'cancelled'
                ? { ...a, checkedIn: !a.checkedIn, checkInTime: !a.checkedIn ? new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : undefined }
                : a
        ));
    };

    const stats = {
        total: sourceData.length,
        checkedIn: sourceData.filter(a => a.checkedIn).length,
        paid: sourceData.filter(a => a.status === 'paid').length,
        comp: sourceData.filter(a => a.status === 'comp').length,
        cancelled: sourceData.filter(a => a.status === 'cancelled').length,
    };

    const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
        { id: 'live', label: 'Live', icon: <Radio size={14} />, count: liveData.length },
        { id: 'upcoming', label: 'Upcoming', icon: <CalendarDays size={14} />, count: upcomingData.length },
        { id: 'past', label: 'Past', icon: <Clock size={14} />, count: pastData.length },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                <button onClick={onOpenSidebar} className="p-2 -ml-2"><Menu size={24} /></button>
                <h1 className="font-black text-lg">Attendees</h1>
                <DownloadBar tab={activeTab} />
            </header>

            <main className="p-6">
                <div className="tlb-content space-y-6">

                    {/* Tabs */}
                    <div className="flex bg-gray-100 rounded-xl p-1 text-xs font-bold">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSearch(''); setStatusFilter('all'); setDateFilter(''); }}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all ${activeTab === tab.id ? 'bg-white shadow-sm text-tlb-dark' : 'text-gray-400'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.id ? 'bg-tlb-yellow/10 text-tlb-yellow' : 'bg-gray-200/60 text-gray-400'
                                    }`}>{tab.count}</span>
                            </button>
                        ))}
                    </div>

                    {/* Event context for live tab */}
                    {activeTab === 'live' && (
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-tlb-dark to-gray-900 p-5 text-white">
                            <div className="absolute -right-8 -top-8 w-28 h-28 bg-tlb-yellow/10 rounded-full blur-2xl" />
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="bg-red-500/20 p-2.5 rounded-xl">
                                    <Radio size={20} className="text-red-400 animate-pulse" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-0.5">Live Now</p>
                                    <h3 className="font-black text-base">Hamilton Live Workshop</h3>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Today, 7:00 PM  •  The Little Broadway Stage</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats strip */}
                    <div className="grid grid-cols-4 gap-3">
                        <div className="tlb-card p-3 text-center">
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Total</p>
                            <p className="text-xl font-black">{stats.total}</p>
                        </div>
                        {activeTab === 'live' ? (
                            <div className="tlb-card p-3 text-center">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Checked In</p>
                                <p className="text-xl font-black text-tlb-yellow">{stats.checkedIn}</p>
                            </div>
                        ) : (
                            <div className="tlb-card p-3 text-center">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Paid</p>
                                <p className="text-xl font-black text-emerald-500">{stats.paid}</p>
                            </div>
                        )}
                        <div className="tlb-card p-3 text-center">
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Comp</p>
                            <p className="text-xl font-black text-blue-500">{stats.comp}</p>
                        </div>
                        <div className="tlb-card p-3 text-center">
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Cancelled</p>
                            <p className="text-xl font-black text-red-500">{stats.cancelled}</p>
                        </div>
                    </div>

                    {/* Search + Filter */}
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input
                                type="text"
                                placeholder="Search by name, phone, or email…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="tlb-input w-full pl-10 pr-4 py-3 text-sm"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className={`p-3 rounded-xl border transition-colors ${showFilterPanel || statusFilter !== 'all' ? 'bg-tlb-yellow/10 border-tlb-yellow text-tlb-yellow' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                                }`}
                        >
                            <Filter size={18} />
                        </button>
                    </div>

                    {/* Filter panel */}
                    {showFilterPanel && (
                        <div className="tlb-card p-4 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filter by Status</p>
                            <div className="flex flex-wrap gap-2">
                                {(['all', 'paid', 'comp', 'cancelled'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${statusFilter === s
                                            ? 'bg-tlb-yellow text-tlb-dark'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                    >
                                        {s === 'all' ? 'All Statuses' : STATUS_CONFIG[s].label}
                                    </button>
                                ))}
                            </div>
                            {activeTab === 'past' && (
                                <>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 pt-2">Filter by Date</p>
                                    <input
                                        type="text"
                                        placeholder="e.g. Feb 25 or Feb 18"
                                        value={dateFilter}
                                        onChange={e => setDateFilter(e.target.value)}
                                        className="tlb-input w-full px-4 py-2.5 text-sm"
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {/* Results count */}
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-400">
                            <Users size={12} className="inline mr-1" />
                            {filtered.length} attendee{filtered.length !== 1 ? 's' : ''}
                            {search && <span className="text-gray-300"> matching "{search}"</span>}
                        </p>
                        {activeTab === 'live' && (
                            <p className="text-[10px] font-black uppercase tracking-widest text-tlb-yellow">
                                {stats.checkedIn}/{stats.total} checked in
                            </p>
                        )}
                    </div>

                    {/* Attendee list */}
                    <AttendeeTable
                        attendees={filtered}
                        showCheckIn={activeTab === 'live'}
                        onToggleCheckIn={handleToggleCheckIn}
                    />
                </div>
            </main>
        </div>
    );
};
