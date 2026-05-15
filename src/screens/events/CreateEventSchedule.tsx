import React, { useState, useEffect } from 'react';
import { ArrowRight, Calendar, Clock, DollarSign, Users, Plus, Trash2, Tag, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';
import {
    getListingDetail,
    updateListing,
    createTicket,
    updateTicket,
    deleteTicket,
    getCurrentDraftId,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface TicketDraft {
    id: number | null; // null = new (not yet created on server)
    name: string;
    price: string;
    quantity: string;
    description: string;
    dirty: boolean; // true if changed since load
}

type PriceType = 'free' | 'paid';

// Convert local "YYYY-MM-DD" + "HH:MM" → ISO 8601 UTC string
const toIso = (date: string, time: string): string | null => {
    if (!date) return null;
    const t = time || '00:00';
    const d = new Date(`${date}T${t}:00`);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
};

// Convert ISO string back into separate date + time (local)
const fromIso = (iso: string | null | undefined): { date: string; time: string } => {
    if (!iso) return { date: '', time: '' };
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { date: '', time: '' };
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
        date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
};

export const CreateEventSchedule: React.FC<Props> = ({ onNavigate }) => {
    const [draftId, setDraftId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [deadlineDate, setDeadlineDate] = useState('');
    const [deadlineTime, setDeadlineTime] = useState('');
    const [priceType, setPriceType] = useState<PriceType>('free');
    const [originalPriceType, setOriginalPriceType] = useState<PriceType>('free');
    const [capacity, setCapacity] = useState('');
    const [tickets, setTickets] = useState<TicketDraft[]>([]);
    const [originalTicketIds, setOriginalTicketIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        const id = getCurrentDraftId();
        if (!id) {
            setLoadError('No active draft. Start from "Event Details".');
            setLoading(false);
            return;
        }
        setDraftId(id);

        const load = async () => {
            try {
                const res = await getListingDetail(id);
                const d = res.data || res;
                const start = fromIso(d.start_datetime);
                const end = fromIso(d.end_datetime);
                const deadline = fromIso(d.registration_deadline);
                setStartDate(start.date); setStartTime(start.time);
                setEndDate(end.date); setEndTime(end.time);
                setDeadlineDate(deadline.date); setDeadlineTime(deadline.time);
                const pt: PriceType = d.price_type === 'paid' ? 'paid' : 'free';
                setPriceType(pt);
                setOriginalPriceType(pt);
                setCapacity(d.capacity != null ? String(d.capacity) : '');
                const apiTickets = d.tickets || [];
                const ticketDrafts: TicketDraft[] = apiTickets.map((t: any) => ({
                    id: t.id,
                    name: t.name || '',
                    price: String(t.price ?? ''),
                    quantity: String(t.total_quantity ?? ''),
                    description: t.description || '',
                    dirty: false,
                }));
                setTickets(ticketDrafts);
                setOriginalTicketIds(new Set(ticketDrafts.map(t => t.id!).filter(Boolean)));
            } catch (err: any) {
                setLoadError(err?.message || 'Failed to load draft.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const addTicket = () => setTickets(prev => [...prev, {
        id: null, name: '', price: '', quantity: '', description: '', dirty: true,
    }]);
    const removeTicket = (idx: number) => setTickets(prev => prev.filter((_, i) => i !== idx));
    const updateTicketField = (idx: number, field: keyof TicketDraft, value: string) => {
        setTickets(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value, dirty: true } : t));
    };

    const handleNext = async () => {
        if (!draftId) return;

        // Build payload
        const startIso = toIso(startDate, startTime);
        const endIso = toIso(endDate, endTime);
        const deadlineIso = toIso(deadlineDate, deadlineTime);

        if (startIso && endIso && new Date(endIso) <= new Date(startIso)) {
            alert('End date/time must be after start date/time.');
            return;
        }
        if (priceType === 'free' && capacity && parseInt(capacity, 10) < 1) {
            alert('Capacity must be at least 1.');
            return;
        }

        setSaving(true);
        try {
            const payload: Record<string, any> = { price_type: priceType };
            if (startIso) payload.start_datetime = startIso;
            if (endIso) payload.end_datetime = endIso;
            if (deadlineIso) payload.registration_deadline = deadlineIso;
            if (priceType === 'free' && capacity) payload.capacity = parseInt(capacity, 10);

            await updateListing(draftId, payload);

            // Sync tickets (only relevant for paid events)
            if (priceType === 'paid') {
                // Determine which originals were removed
                const currentIds = new Set(tickets.map(t => t.id).filter((x): x is number => x !== null));
                const toDelete: number[] = [];
                originalTicketIds.forEach((id) => { if (!currentIds.has(id)) toDelete.push(id); });

                for (const id of toDelete) {
                    await deleteTicket(draftId, id);
                }

                for (const t of tickets) {
                    const priceNum = parseFloat(t.price);
                    const qtyNum = parseInt(t.quantity, 10);
                    if (!t.name.trim() || isNaN(priceNum) || isNaN(qtyNum)) {
                        // Skip incomplete ticket rows
                        continue;
                    }
                    if (t.id === null) {
                        await createTicket(draftId, {
                            name: t.name.trim(),
                            price: priceNum,
                            total_quantity: qtyNum,
                            description: t.description || undefined,
                        });
                    } else if (t.dirty) {
                        await updateTicket(draftId, t.id, {
                            name: t.name.trim(),
                            price: priceNum,
                            total_quantity: qtyNum,
                            description: t.description || '',
                        });
                    }
                }
            }
            // If user switched from paid → free, backend auto-clears tickets.
            // If switched free → paid with no tickets, that's fine — they can add later.
            setOriginalPriceType(priceType);

            onNavigate('CREATE_EVENT_MEDIA');
        } catch (err: any) {
            console.error('Failed to save schedule', err);
            alert(err?.message || 'Failed to save schedule. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <WizardLayout
                title="New Event"
                stepText="Step 2 of 4"
                subtitle="Schedule & Pricing"
                progressPercentage={50}
                themeColor="blue"
                onBack={() => onNavigate('CREATE_EVENT_DETAILS')}
            >
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading draft…
                </div>
            </WizardLayout>
        );
    }

    if (loadError) {
        return (
            <WizardLayout
                title="New Event"
                stepText="Step 2 of 4"
                subtitle="Schedule & Pricing"
                progressPercentage={50}
                themeColor="blue"
                onBack={() => onNavigate('CREATE_EVENT_DETAILS')}
            >
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-600">
                    {loadError}
                </div>
            </WizardLayout>
        );
    }

    return (
        <WizardLayout
            title="New Event"
            stepText="Step 2 of 4"
            subtitle="Schedule & Pricing"
            progressPercentage={50}
            themeColor="blue"
            onBack={() => onNavigate('CREATE_EVENT_DETAILS')}
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Schedule & Pricing</h2>
                <p className="text-sm text-gray-400">When does your event happen and how much does it cost?</p>
            </div>

            {/* Start */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Calendar size={12} /> Event Start
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <input type="date" className="tlb-input w-full" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <input type="time" className="tlb-input w-full" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
            </div>

            {/* End */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Clock size={12} /> Event End
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <input type="date" className="tlb-input w-full" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    <input type="time" className="tlb-input w-full" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
            </div>

            {/* Pricing Toggle */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <DollarSign size={12} /> Pricing
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                        onClick={() => setPriceType('free')}
                        className={`p-4 rounded-2xl border-2 text-center transition-all ${priceType === 'free'
                            ? 'border-emerald-400 bg-emerald-50'
                            : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                    >
                        <span className="text-lg">🎉</span>
                        <p className={`text-sm font-bold mt-1 ${priceType === 'free' ? 'text-emerald-600' : 'text-gray-500'}`}>Free Event</p>
                    </button>
                    <button
                        onClick={() => setPriceType('paid')}
                        className={`p-4 rounded-2xl border-2 text-center transition-all ${priceType === 'paid'
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                    >
                        <span className="text-lg">🎟️</span>
                        <p className={`text-sm font-bold mt-1 ${priceType === 'paid' ? 'text-blue-600' : 'text-gray-500'}`}>Paid Event</p>
                    </button>
                </div>
                {priceType !== originalPriceType && (
                    <p className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                        ⚠️ Switching pricing type will clear all existing tickets when saved.
                    </p>
                )}
            </div>

            {/* Free → capacity */}
            {priceType === 'free' && (
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Users size={12} /> Capacity
                    </label>
                    <input
                        type="number"
                        min={1}
                        className="tlb-input w-full"
                        placeholder="e.g. 100"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Backend auto-creates a "Free Entry" ticket on submit.</p>
                </div>
            )}

            {/* Paid → tickets */}
            {priceType === 'paid' && (
                <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Tag size={12} /> Ticket Tiers
                    </label>
                    {tickets.length === 0 && (
                        <p className="text-xs text-gray-400">No tickets yet. Add at least one before submitting.</p>
                    )}
                    {tickets.map((ticket, idx) => (
                        <div key={ticket.id ?? `new-${idx}`} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                    Tier {idx + 1} {ticket.id === null && '(new)'}
                                </p>
                                <button
                                    onClick={() => removeTicket(idx)}
                                    className="text-red-400 hover:text-red-600 p-1"
                                    aria-label="Remove ticket"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <input
                                className="tlb-input w-full"
                                placeholder="e.g. General Admission, VIP Pass"
                                maxLength={100}
                                value={ticket.name}
                                onChange={(e) => updateTicketField(idx, 'name', e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1 block">Price (₹)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        className="tlb-input w-full"
                                        placeholder="499"
                                        value={ticket.price}
                                        onChange={(e) => updateTicketField(idx, 'price', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1 block">Quantity</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className="tlb-input w-full"
                                        placeholder="50"
                                        value={ticket.quantity}
                                        onChange={(e) => updateTicketField(idx, 'quantity', e.target.value)}
                                    />
                                </div>
                            </div>
                            <input
                                className="tlb-input w-full"
                                placeholder="Short description (optional)"
                                value={ticket.description}
                                onChange={(e) => updateTicketField(idx, 'description', e.target.value)}
                            />
                        </div>
                    ))}
                    <button
                        onClick={addTicket}
                        className="w-full py-3 border-2 border-dashed border-blue-200 rounded-2xl text-sm font-bold text-purple-400 flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                    >
                        <Plus size={18} /> Add Ticket Tier
                    </button>
                </div>
            )}

            {/* Registration Deadline */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Registration Deadline</label>
                <div className="grid grid-cols-2 gap-3">
                    <input type="date" className="tlb-input w-full" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
                    <input type="time" className="tlb-input w-full" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Must be on or before the event start.</p>
            </div>

            <WizardNavigation
                onBack={() => onNavigate('CREATE_EVENT_DETAILS')}
                onNext={saving ? () => {} : handleNext}
                nextText={saving ? 'Saving…' : 'Next: Media'}
                nextIcon={saving ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                themeColor="blue"
            />
        </WizardLayout>
    );
};
