import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Plus, Trash2, Clock, Users, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, toast } from '../../components/ui';
import {
    getCurrentProgramDraftId,
    getProgramBatches,
    createProgramBatch,
    updateProgramBatch,
    deleteProgramBatch,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

// API expects full lowercase day names (11.10)
const DAY_OPTIONS: { label: string; value: string }[] = [
    { label: 'Mon', value: 'monday' },
    { label: 'Tue', value: 'tuesday' },
    { label: 'Wed', value: 'wednesday' },
    { label: 'Thu', value: 'thursday' },
    { label: 'Fri', value: 'friday' },
    { label: 'Sat', value: 'saturday' },
    { label: 'Sun', value: 'sunday' },
];

// Time helpers: API expects HH:MM:SS, UI uses HH:MM
const toApiTime = (t: string) => t.length === 5 ? `${t}:00` : t;
const toUiTime  = (t: string) => (t || '').slice(0, 5);

interface LocalBatch {
    apiId?: number;
    key: number;
    name: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    fee: string;
    totalSeats: string;
    daysOfWeek: string[];
    isActive: boolean;
    isDirty: boolean;
}

let nextKey = 1;
const blankBatch = (): LocalBatch => ({
    key: nextKey++,
    name: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    fee: '',
    totalSeats: '',
    daysOfWeek: [],
    isActive: true,
    isDirty: true,
});

export const CreateProgramBatch: React.FC<Props> = ({ onNavigate }) => {
    const [batches, setBatches] = useState<LocalBatch[]>([blankBatch()]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const deletedIds = useRef<number[]>([]);

    useEffect(() => {
        const draftId = getCurrentProgramDraftId();
        if (!draftId) return;
        (async () => {
            try {
                setLoading(true);
                const res = await getProgramBatches(draftId);
                const data: any[] = Array.isArray(res) ? res : (res.data || res || []);
                if (Array.isArray(data) && data.length > 0) {
                    setBatches(data.map((b: any) => ({
                        apiId: b.id,
                        key: nextKey++,
                        name: b.name || '',
                        startDate: b.start_date || '',
                        endDate: b.end_date || '',
                        startTime: toUiTime(b.start_time),
                        endTime: toUiTime(b.end_time),
                        fee: b.fee != null ? String(b.fee) : '',
                        totalSeats: b.total_seats != null ? String(b.total_seats) : '',
                        daysOfWeek: Array.isArray(b.days_of_week) ? b.days_of_week : [],
                        isActive: b.is_active !== false,
                        isDirty: false,
                    })));
                }
            } catch (e) {
                console.error('Failed to load program batches', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const update = (key: number, patch: Partial<LocalBatch>) =>
        setBatches(prev => prev.map(b => b.key === key ? { ...b, ...patch, isDirty: true } : b));

    const toggleDay = (key: number, day: string) => {
        const batch = batches.find(b => b.key === key);
        if (!batch) return;
        const days = batch.daysOfWeek.includes(day)
            ? batch.daysOfWeek.filter(d => d !== day)
            : [...batch.daysOfWeek, day];
        update(key, { daysOfWeek: days });
    };

    const removeBatch = (key: number) => {
        const batch = batches.find(b => b.key === key);
        if (batch?.apiId) deletedIds.current.push(batch.apiId);
        setBatches(prev => prev.filter(b => b.key !== key));
    };

    const handleNext = async () => {
        if (saving) return;
        const draftId = getCurrentProgramDraftId();
        if (!draftId) { onNavigate('CREATE_PROGRAM_MEDIA'); return; }
        try {
            setSaving(true);
            // Delete removed batches
            for (const id of deletedIds.current) {
                await deleteProgramBatch(draftId, id);
            }
            deletedIds.current = [];
            // Create or update dirty batches
            for (const b of batches) {
                if (!b.isDirty) continue;
                // Validate required fields per API 11.10
                if (!b.startDate || !b.endDate || !b.startTime || !b.endTime || !b.fee || !b.totalSeats) {
                    toast.warning(`Batch "${b.name || 'Unnamed'}" is missing required fields (dates, times, fee, seats).`);
                    setSaving(false);
                    return;
                }
                const payload: Record<string, any> = {
                    name: b.name || undefined,
                    start_date: b.startDate,
                    end_date: b.endDate,
                    start_time: toApiTime(b.startTime),
                    end_time: toApiTime(b.endTime),
                    fee: b.fee,
                    total_seats: Number(b.totalSeats) || 1,
                    is_active: b.isActive,
                };
                if (b.daysOfWeek.length > 0) {
                    payload.days_of_week = b.daysOfWeek;
                }
                if (b.apiId) {
                    await updateProgramBatch(draftId, b.apiId, payload);
                } else {
                    await createProgramBatch(draftId, payload);
                }
            }
            onNavigate('CREATE_PROGRAM_MEDIA');
        } catch (e: any) {
            console.error('Failed to save program batches', e);
            toast.error(e?.message || 'Failed to save batches. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <WizardLayout
            title="New Program"
            stepText="Stage 2 of 5"
            subtitle="Batch & Schedule"
            progressPercentage={40}
            themeColor="emerald"
            onBack={() => onNavigate('CREATE_PROGRAM_IDENTITY')}
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Batch & Schedule</h2>
                <p className="text-sm text-gray-400">Define when your program runs. Add as many batches as needed.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 size={28} className="animate-spin text-emerald-500" />
                </div>
            ) : (
                <>
                    {batches.map((batch, idx) => (
                        <div key={batch.key} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Batch {idx + 1}</p>
                                {batches.length > 1 && (
                                    <button onClick={() => removeBatch(batch.key)} className="text-red-400 hover:text-red-600 p-1">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Batch Name */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Batch Name</label>
                                <input
                                    className="tlb-input w-full"
                                    placeholder="e.g. Morning Batch"
                                    maxLength={150}
                                    value={batch.name}
                                    onChange={(e) => update(batch.key, { name: e.target.value })}
                                />
                            </div>

                            {/* Start Date / End Date */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                                        <Calendar size={10} className="inline mr-1" /> Start Date <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="tlb-input w-full"
                                        value={batch.startDate}
                                        onChange={(e) => update(batch.key, { startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                                        <Calendar size={10} className="inline mr-1" /> End Date <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="tlb-input w-full"
                                        value={batch.endDate}
                                        min={batch.startDate}
                                        onChange={(e) => update(batch.key, { endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Days of Week */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Days</label>
                                <div className="flex gap-2">
                                    {DAY_OPTIONS.map((day) => (
                                        <button
                                            key={day.value}
                                            onClick={() => toggleDay(batch.key, day.value)}
                                            className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                                                batch.daysOfWeek.includes(day.value)
                                                    ? 'bg-emerald-500 text-white shadow-sm'
                                                    : 'bg-gray-50 border border-gray-200 text-gray-400 hover:border-emerald-300'
                                            }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Start Time / End Time */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                                        <Clock size={10} className="inline mr-1" /> Start Time <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        className="tlb-input w-full"
                                        value={batch.startTime}
                                        onChange={(e) => update(batch.key, { startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                                        <Clock size={10} className="inline mr-1" /> End Time <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        className="tlb-input w-full"
                                        value={batch.endTime}
                                        onChange={(e) => update(batch.key, { endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Fee + Total Seats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                                        <DollarSign size={10} className="inline mr-1" /> Fee (₹) <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="tlb-input w-full"
                                        placeholder="e.g. 2500"
                                        min={0}
                                        step="0.01"
                                        value={batch.fee}
                                        onChange={(e) => update(batch.key, { fee: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                                        <Users size={10} className="inline mr-1" /> Total Seats <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="tlb-input w-full"
                                        placeholder="e.g. 30"
                                        min={1}
                                        value={batch.totalSeats}
                                        onChange={(e) => update(batch.key, { totalSeats: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => setBatches(prev => [...prev, blankBatch()])}
                        className="w-full py-3 border-2 border-dashed border-emerald-300/40 rounded-2xl text-sm font-bold text-emerald-500 flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
                    >
                        <Plus size={18} /> Add New Batch
                    </button>
                </>
            )}

            <WizardNavigation
                onBack={() => onNavigate('CREATE_PROGRAM_IDENTITY')}
                onNext={handleNext}
                nextText={saving ? 'Saving...' : 'Next: Media'}
                nextIcon={saving ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                themeColor="emerald"
            />
        </WizardLayout>
    );
};
