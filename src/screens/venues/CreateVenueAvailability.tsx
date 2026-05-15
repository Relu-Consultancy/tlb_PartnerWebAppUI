import React, { useState, useEffect } from 'react';
import { ArrowRight, Calendar as CalendarIcon, Clock, Plus, Trash2, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';
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
        if (!newDate || !newStart || !newEnd) { alert('Please fill in date, start time, and end time.'); return; }
        if (newEnd <= newStart) { alert('End time must be after start time.'); return; }
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
            alert(err?.message || 'Failed to add slot.');
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
            alert(err?.message || 'Failed to delete slot.');
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <WizardLayout title="Availability" stepText="Step 3 of 5" subtitle="Schedule" progressPercentage={60} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_OCCASIONS')}>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading availability…
                </div>
            </WizardLayout>
        );
    }

    if (loadError) {
        return (
            <WizardLayout title="Availability" stepText="Step 3 of 5" subtitle="Schedule" progressPercentage={60} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_OCCASIONS')}>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-600">{loadError}</div>
            </WizardLayout>
        );
    }

    return (
        <WizardLayout title="Availability" stepText="Step 3 of 5" subtitle="Schedule" progressPercentage={60} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_OCCASIONS')}>
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Schedule & Availability</h2>
                <p className="text-sm text-gray-400">Add time slots when your venue can be booked.</p>
            </div>

            {/* Slots List */}
            {slots.length > 0 && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CalendarIcon size={14} /> Available Slots ({slots.length})
                    </label>
                    {slots.map(slot => (
                        <div key={slot.id} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-50 p-2 rounded-xl text-amber-500 shrink-0">
                                    <CalendarIcon size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{fmtSlotDate(slot.date)}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                        <Clock size={10} /> {slot.start_time} – {slot.end_time}
                                        {slot.note && <span className="ml-1 text-gray-300">· {slot.note}</span>}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(slot.id)}
                                disabled={deleting === slot.id}
                                className="text-gray-300 hover:text-red-500 p-2 disabled:opacity-50 transition-colors"
                                aria-label="Delete slot"
                            >
                                {deleting === slot.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {slots.length === 0 && !showForm && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-8 text-center">
                    <CalendarIcon size={32} className="text-amber-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-amber-700">No slots yet</p>
                    <p className="text-xs text-amber-500 mt-1">Add available time slots for customers to book.</p>
                </div>
            )}

            {/* Add Slot Form */}
            {showForm ? (
                <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 space-y-4">
                    <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                        <Plus size={16} className="text-amber-500" /> Add Availability Slot
                    </h3>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Date</label>
                        <input type="date" className="tlb-input w-full" value={newDate} onChange={e => setNewDate(e.target.value)} />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Start Time</label>
                            <input type="time" className="tlb-input w-full" value={newStart} onChange={e => setNewStart(e.target.value)} />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">End Time</label>
                            <input type="time" className="tlb-input w-full" value={newEnd} onChange={e => setNewEnd(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Note (optional)</label>
                        <input className="tlb-input w-full" placeholder="e.g. Weekend special" value={newNote} onChange={e => setNewNote(e.target.value)} />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => { setShowForm(false); setNewDate(''); setNewStart(''); setNewEnd(''); setNewNote(''); }} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50">
                            Cancel
                        </button>
                        <button onClick={handleAdd} disabled={adding} className="flex-1 py-3 rounded-2xl bg-amber-400 text-sm font-bold text-amber-900 hover:brightness-95 disabled:opacity-50 flex items-center justify-center gap-2">
                            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            {adding ? 'Adding…' : 'Add Slot'}
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                >
                    <Plus size={18} /> Add Availability Slot
                </button>
            )}

            <WizardNavigation
                onBack={() => onNavigate('CREATE_VENUE_OCCASIONS')}
                onNext={() => {
                    if (slots.length === 0) { alert('Add at least one availability slot before continuing.'); return; }
                    onNavigate('CREATE_VENUE_PACKAGES');
                }}
                nextText="Next: Packages & Pricing"
                nextIcon={<ArrowRight size={20} />}
                themeColor="amber"
            />
        </WizardLayout>
    );
};
