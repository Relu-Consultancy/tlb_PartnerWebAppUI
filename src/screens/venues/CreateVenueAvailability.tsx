import React, { useState, useEffect } from 'react';
import { ArrowRight, Calendar as CalendarIcon, Clock, Plus, Trash2, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { toast } from '../../components/ui';
import { WizardShell, WizardNav, WizardField } from '../../components/portal/wizard';
import {
    getVenueAvailability,
    createVenueAvailabilitySlot,
    deleteVenueAvailabilitySlot,
    getCurrentVenueDraftId,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar?: () => void; }

interface AvailabilitySlot { id: number; date: string; start_time: string; end_time: string; note?: string }

const fmtSlotDate = (iso: string) => {
    if (!iso) return '';
    try {
        return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return iso; }
};

export const CreateVenueAvailability: React.FC<Props> = ({ onNavigate }) => {
    const [draftId, setDraftId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [deleting, setDeleting] = useState<number | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newStart, setNewStart] = useState('');
    const [newEnd, setNewEnd] = useState('');
    const [newNote, setNewNote] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        const id = getCurrentVenueDraftId();
        if (!id) { setLoadError('No active draft. Start from "Venue Details".'); setLoading(false); return; }
        setDraftId(id);

        const load = async () => {
            try {
                const res = await getVenueAvailability(id);
                setSlots(res.data || res || []);
            } catch (err: any) {
                setLoadError(err?.message || 'Failed to load availability.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleAdd = async () => {
        if (!draftId) return;
        if (!newDate || !newStart || !newEnd) { toast.warning('Please fill in date, start time, and end time.'); return; }
        if (newEnd <= newStart) { toast.warning('End time must be after start time.'); return; }
        setAdding(true);
        try {
            const res = await createVenueAvailabilitySlot(draftId, {
                date: newDate,
                start_time: newStart,
                end_time: newEnd,
                ...(newNote.trim() && { note: newNote.trim() }),
            });
            setSlots(prev => [...prev, res.data || res]);
            setNewDate(''); setNewStart(''); setNewEnd(''); setNewNote('');
            setShowForm(false);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to add slot.');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (slotId: number) => {
        if (!draftId) return;
        setDeleting(slotId);
        try {
            await deleteVenueAvailabilitySlot(draftId, slotId);
            setSlots(prev => prev.filter(s => s.id !== slotId));
        } catch (err: any) {
            toast.error(err?.message || 'Failed to delete slot.');
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <WizardShell title="New venue" entityType="Venues" step={3} totalSteps={7} stepLabel="Availability" onBack={() => onNavigate('CREATE_VENUE_OCCASIONS')}>
                <div className="pt-card p-5 sm:p-6 flex items-center justify-center gap-2 text-tlb-muted text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading availability…
                </div>
            </WizardShell>
        );
    }

    if (loadError) {
        return (
            <WizardShell title="New venue" entityType="Venues" step={3} totalSteps={7} stepLabel="Availability" onBack={() => onNavigate('CREATE_VENUE_OCCASIONS')}>
                <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{loadError}</div>
            </WizardShell>
        );
    }

    return (
        <WizardShell title="New venue" entityType="Venues" step={3} totalSteps={7} stepLabel="Availability" onBack={() => onNavigate('CREATE_VENUE_OCCASIONS')}>
            <div className="pt-card p-5 sm:p-6 flex flex-col gap-5">
                <div>
                    <h2 className="pt-h-sec">Schedule &amp; availability</h2>
                    <p className="text-[13px] text-tlb-sub mt-0.5">Add time slots when your venue can be booked.</p>
                </div>

                {slots.length > 0 && (
                    <WizardField label={`Available slots (${slots.length})`}>
                        <div className="flex flex-col gap-3">
                            {slots.map(slot => (
                                <div key={slot.id} className="pt-card px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="pt-tile-md bg-tlb-amber-soft text-tlb-gold shrink-0">
                                            <CalendarIcon size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-tlb-ink">{fmtSlotDate(slot.date)}</p>
                                            <p className="text-xs text-tlb-muted flex items-center gap-1 mt-0.5">
                                                <Clock size={10} /> {slot.start_time} – {slot.end_time}
                                                {slot.note && <span className="ml-1 text-tlb-faint">· {slot.note}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(slot.id)}
                                        disabled={deleting === slot.id}
                                        className="text-tlb-faint hover:text-tlb-red-deep p-2 disabled:opacity-50 transition-colors"
                                        aria-label="Delete slot"
                                    >
                                        {deleting === slot.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </WizardField>
                )}

                {slots.length === 0 && !showForm && (
                    <div className="pt-note bg-tlb-amber-soft text-tlb-gold flex-col items-center text-center gap-2 py-8">
                        <CalendarIcon size={32} />
                        <p className="text-sm font-bold">No slots yet</p>
                        <p className="text-xs">Add available time slots for customers to book.</p>
                    </div>
                )}

                {showForm ? (
                    <div className="pt-card p-5 flex flex-col gap-4">
                        <h3 className="pt-h-sec flex items-center gap-2">
                            <Plus size={16} className="text-tlb-gold" /> Add availability slot
                        </h3>
                        <WizardField label="Date">
                            <input type="date" className="pt-input" value={newDate} onChange={e => setNewDate(e.target.value)} />
                        </WizardField>
                        <div className="grid grid-cols-2 gap-3">
                            <WizardField label="Start time">
                                <input type="time" className="pt-input" value={newStart} onChange={e => setNewStart(e.target.value)} />
                            </WizardField>
                            <WizardField label="End time">
                                <input type="time" className="pt-input" value={newEnd} onChange={e => setNewEnd(e.target.value)} />
                            </WizardField>
                        </div>
                        <WizardField label="Note (optional)">
                            <input className="pt-input" placeholder="e.g. Weekend special" value={newNote} onChange={e => setNewNote(e.target.value)} />
                        </WizardField>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setNewDate(''); setNewStart(''); setNewEnd(''); setNewNote(''); }}
                                className="pt-btn pt-btn-o flex-1 justify-center"
                            >
                                Cancel
                            </button>
                            <button type="button" onClick={handleAdd} disabled={adding} className="pt-btn pt-btn-y flex-1 justify-center">
                                {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                {adding ? 'Adding…' : 'Add slot'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button type="button" onClick={() => setShowForm(true)} className="pt-btn pt-btn-o w-full justify-center border-dashed py-3.5">
                        <Plus size={18} /> Add availability slot
                    </button>
                )}

                <WizardNav
                    onBack={() => onNavigate('CREATE_VENUE_OCCASIONS')}
                    onNext={() => {
                        if (slots.length === 0) { toast.warning('Add at least one availability slot before continuing.'); return; }
                        onNavigate('CREATE_VENUE_PACKAGES');
                    }}
                    nextText="Next: Packages & pricing"
                    nextIcon={<ArrowRight size={14} strokeWidth={2.75} />}
                />
            </div>
        </WizardShell>
    );
};
