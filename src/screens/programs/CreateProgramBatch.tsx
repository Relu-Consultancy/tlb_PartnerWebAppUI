import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Plus, Trash2, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { toast } from '../../components/ui';
import { WizardShell, WizardNav, WizardField } from '../../components/portal/wizard';
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
        <WizardShell title="New program" entityType="Programs" step={2} totalSteps={5} stepLabel="Batches" onBack={() => onNavigate('CREATE_PROGRAM_IDENTITY')}>
            <div className="pt-card p-5 sm:p-6 flex flex-col gap-5">
                <div>
                    <h2 className="pt-h-sec">Batch &amp; schedule</h2>
                    <p className="text-[13px] text-tlb-sub mt-0.5">Define when your program runs. Add as many batches as needed.</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-2 text-tlb-muted text-xs font-bold py-12">
                        <Loader2 size={16} className="animate-spin" /> Loading batches…
                    </div>
                ) : (
                    <>
                        {batches.map((batch, idx) => (
                            <div key={batch.key} className="pt-card p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <p className="pt-eyebrow">Batch {idx + 1}</p>
                                    {batches.length > 1 && (
                                        <button type="button" onClick={() => removeBatch(batch.key)} className="text-tlb-red hover:text-tlb-red-deep p-1" aria-label="Remove batch">
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </div>

                                <WizardField label="Batch name">
                                    <input
                                        className="pt-input"
                                        placeholder="e.g. Morning Batch"
                                        maxLength={150}
                                        value={batch.name}
                                        onChange={(e) => update(batch.key, { name: e.target.value })}
                                    />
                                </WizardField>

                                <div className="grid grid-cols-2 gap-3">
                                    <WizardField label="Start date" required>
                                        <input
                                            type="date"
                                            className="pt-input"
                                            value={batch.startDate}
                                            onChange={(e) => update(batch.key, { startDate: e.target.value })}
                                        />
                                    </WizardField>
                                    <WizardField label="End date" required>
                                        <input
                                            type="date"
                                            className="pt-input"
                                            value={batch.endDate}
                                            min={batch.startDate}
                                            onChange={(e) => update(batch.key, { endDate: e.target.value })}
                                        />
                                    </WizardField>
                                </div>

                                <WizardField label="Days">
                                    <div className="flex flex-wrap gap-2">
                                        {DAY_OPTIONS.map((day) => (
                                            <button
                                                key={day.value}
                                                type="button"
                                                onClick={() => toggleDay(batch.key, day.value)}
                                                className={`pt-scope ${batch.daysOfWeek.includes(day.value) ? 'is-active' : ''}`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </WizardField>

                                <div className="grid grid-cols-2 gap-3">
                                    <WizardField label="Start time" required>
                                        <input
                                            type="time"
                                            className="pt-input"
                                            value={batch.startTime}
                                            onChange={(e) => update(batch.key, { startTime: e.target.value })}
                                        />
                                    </WizardField>
                                    <WizardField label="End time" required>
                                        <input
                                            type="time"
                                            className="pt-input"
                                            value={batch.endTime}
                                            onChange={(e) => update(batch.key, { endTime: e.target.value })}
                                        />
                                    </WizardField>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <WizardField label="Fee (₹)" required>
                                        <input
                                            type="number"
                                            className="pt-input"
                                            placeholder="e.g. 2500"
                                            min={0}
                                            step="0.01"
                                            value={batch.fee}
                                            onChange={(e) => update(batch.key, { fee: e.target.value })}
                                        />
                                    </WizardField>
                                    <WizardField label="Total seats" required>
                                        <input
                                            type="number"
                                            className="pt-input"
                                            placeholder="e.g. 30"
                                            min={1}
                                            value={batch.totalSeats}
                                            onChange={(e) => update(batch.key, { totalSeats: e.target.value })}
                                        />
                                    </WizardField>
                                </div>
                            </div>
                        ))}

                        <button type="button" onClick={() => setBatches(prev => [...prev, blankBatch()])} className="pt-btn pt-btn-o w-full justify-center border-dashed">
                            <Plus size={14} strokeWidth={2.75} /> Add new batch
                        </button>
                    </>
                )}

                <WizardNav
                    onBack={() => onNavigate('CREATE_PROGRAM_IDENTITY')}
                    onNext={saving ? () => {} : handleNext}
                    nextText={saving ? 'Saving…' : 'Next: Media'}
                    nextIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} strokeWidth={2.75} />}
                />
            </div>
        </WizardShell>
    );
};
