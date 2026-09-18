import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { toast } from '../../components/ui';
import { WizardShell, WizardNav, WizardField } from '../../components/portal/wizard';
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
            toast.warning('End date/time must be after start date/time.');
            return;
        }
        if (priceType === 'free' && capacity && parseInt(capacity, 10) < 1) {
            toast.warning('Capacity must be at least 1.');
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
            toast.error(err?.message || 'Failed to save schedule. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <WizardShell title="New event" entityType="Events" step={2} totalSteps={5} stepLabel="Schedule & pricing" onBack={() => onNavigate('CREATE_EVENT_DETAILS')}>
                <div className="pt-card p-5 sm:p-6 flex items-center justify-center gap-2 text-tlb-muted text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading draft…
                </div>
            </WizardShell>
        );
    }

    if (loadError) {
        return (
            <WizardShell title="New event" entityType="Events" step={2} totalSteps={5} stepLabel="Schedule & pricing" onBack={() => onNavigate('CREATE_EVENT_DETAILS')}>
                <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{loadError}</div>
            </WizardShell>
        );
    }

    return (
        <WizardShell title="New event" entityType="Events" step={2} totalSteps={5} stepLabel="Schedule & pricing" onBack={() => onNavigate('CREATE_EVENT_DETAILS')}>
            <div className="pt-card p-5 sm:p-6 flex flex-col gap-5">
                <div>
                    <h2 className="pt-h-sec">Schedule &amp; pricing</h2>
                    <p className="text-[13px] text-tlb-sub mt-0.5">When does your event happen and how much does it cost?</p>
                </div>

                <WizardField label="Event start">
                    <div className="grid grid-cols-2 gap-3">
                        <input type="date" className="pt-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        <input type="time" className="pt-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </div>
                </WizardField>

                <WizardField label="Event end">
                    <div className="grid grid-cols-2 gap-3">
                        <input type="date" className="pt-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        <input type="time" className="pt-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </div>
                </WizardField>

                <WizardField label="Pricing">
                    <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => setPriceType('free')} className={`pt-tile ${priceType === 'free' ? 'is-on' : ''}`}>
                            <span className="text-lg">🎉</span>
                            <span>Free event</span>
                        </button>
                        <button type="button" onClick={() => setPriceType('paid')} className={`pt-tile ${priceType === 'paid' ? 'is-on' : ''}`}>
                            <span className="text-lg">🎟️</span>
                            <span>Paid event</span>
                        </button>
                    </div>
                    {priceType !== originalPriceType && (
                        <p className="pt-note bg-tlb-amber-soft text-tlb-gold mt-1">Switching pricing type will clear all existing tickets when saved.</p>
                    )}
                </WizardField>

                {priceType === 'free' && (
                    <WizardField label="Capacity" hint='Backend auto-creates a "Free Entry" ticket on submit.'>
                        <input
                            type="number"
                            min={1}
                            className="pt-input"
                            placeholder="e.g. 100"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                        />
                    </WizardField>
                )}

                {priceType === 'paid' && (
                    <WizardField label="Ticket tiers">
                        <div className="flex flex-col gap-3">
                            {tickets.length === 0 && (
                                <p className="text-xs text-tlb-muted">No tickets yet. Add at least one before submitting.</p>
                            )}
                            {tickets.map((ticket, idx) => (
                                <div key={ticket.id ?? `new-${idx}`} className="pt-card p-4 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <p className="pt-eyebrow">Tier {idx + 1} {ticket.id === null && '(new)'}</p>
                                        <button type="button" onClick={() => removeTicket(idx)} className="text-tlb-red hover:text-tlb-red-deep p-1" aria-label="Remove ticket">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                    <input
                                        className="pt-input"
                                        placeholder="e.g. General Admission, VIP Pass"
                                        maxLength={100}
                                        value={ticket.name}
                                        onChange={(e) => updateTicketField(idx, 'name', e.target.value)}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <WizardField label="Price (₹)">
                                            <input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                className="pt-input"
                                                placeholder="499"
                                                value={ticket.price}
                                                onChange={(e) => updateTicketField(idx, 'price', e.target.value)}
                                            />
                                        </WizardField>
                                        <WizardField label="Quantity">
                                            <input
                                                type="number"
                                                min={1}
                                                className="pt-input"
                                                placeholder="50"
                                                value={ticket.quantity}
                                                onChange={(e) => updateTicketField(idx, 'quantity', e.target.value)}
                                            />
                                        </WizardField>
                                    </div>
                                    <input
                                        className="pt-input"
                                        placeholder="Short description (optional)"
                                        value={ticket.description}
                                        onChange={(e) => updateTicketField(idx, 'description', e.target.value)}
                                    />
                                </div>
                            ))}
                            <button type="button" onClick={addTicket} className="pt-btn pt-btn-o w-full justify-center border-dashed">
                                <Plus size={14} strokeWidth={2.75} /> Add ticket tier
                            </button>
                        </div>
                    </WizardField>
                )}

                <WizardField label="Registration deadline" hint="Must be on or before the event start.">
                    <div className="grid grid-cols-2 gap-3">
                        <input type="date" className="pt-input" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
                        <input type="time" className="pt-input" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} />
                    </div>
                </WizardField>

                <WizardNav
                    onBack={() => onNavigate('CREATE_EVENT_DETAILS')}
                    onNext={saving ? () => {} : handleNext}
                    nextText={saving ? 'Saving…' : 'Next: Media'}
                    nextIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} strokeWidth={2.75} />}
                />
            </div>
        </WizardShell>
    );
};
