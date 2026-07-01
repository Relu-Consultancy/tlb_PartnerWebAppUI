import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Plus, Trash2, Clock, Users, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, SkeletonList } from '../../components/ui';
import {
    getCurrentClassDraftId,
    getClassBatches,
    createClassBatch,
    updateClassBatch,
    deleteClassBatch,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

// UI labels ↔ API 3-letter abbreviations (aligned by index)
const DAY_LABELS = ['M', 'T', 'W', 'Th', 'F', 'S', 'Su'];
const DAY_API    = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const toApiDay = (label: string) => DAY_API[DAY_LABELS.indexOf(label)] ?? label;
const toUiDay  = (api: string)   => DAY_LABELS[DAY_API.indexOf(api)]   ?? api;

const toApiTime = (t: string) => t.length === 5 ? `${t}:00` : t;
const toUiTime  = (t: string) => (t || '').slice(0, 5);

interface LocalBatch {
    apiId?: number;
    key: number;
    name: string;
    days: string[];      // UI labels
    startTime: string;
    endTime: string;
    capacity: string;
    isDirty: boolean;
}

let nextKey = 1;
const blankBatch = (): LocalBatch => ({
    key: nextKey++,
    name: '',
    days: [],
    startTime: '',
    endTime: '',
    capacity: '',
    isDirty: true,
});

export const CreateClassBatch: React.FC<Props> = ({ onNavigate }) => {
    const [batches, setBatches] = useState<LocalBatch[]>([blankBatch()]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const deletedIds = useRef<number[]>([]);

    useEffect(() => {
        const draftId = getCurrentClassDraftId();
        if (!draftId) return;
        (async () => {
            try {
                setLoading(true);
                const res = await getClassBatches(draftId);
                const data: any[] = res.data || res || [];
                if (Array.isArray(data) && data.length > 0) {
                    setBatches(data.map((b: any) => ({
                        apiId: b.id,
                        key: nextKey++,
                        name: b.name || '',
                        days: (b.days || []).map(toUiDay),
                        startTime: toUiTime(b.start_time),
                        endTime: toUiTime(b.end_time),
                        capacity: b.capacity != null ? String(b.capacity) : '',
                        isDirty: false,
                    })));
                }
            } catch (e) {
                console.error('Failed to load batches', e);
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
        const days = batch.days.includes(day)
            ? batch.days.filter(d => d !== day)
            : [...batch.days, day];
        update(key, { days });
    };

    const removeBatch = (key: number) => {
        const batch = batches.find(b => b.key === key);
        if (batch?.apiId) deletedIds.current.push(batch.apiId);
        setBatches(prev => prev.filter(b => b.key !== key));
    };

    const handleNext = async () => {
        if (saving) return;
        const draftId = getCurrentClassDraftId();
        if (!draftId) { onNavigate('CREATE_CLASS_MEDIA'); return; }
        try {
            setSaving(true);
            for (const id of deletedIds.current) {
                await deleteClassBatch(draftId, id);
            }
            deletedIds.current = [];
            for (const b of batches) {
                if (!b.isDirty) continue;
                const payload = {
                    name: b.name,
                    days: b.days.map(toApiDay),
                    start_time: toApiTime(b.startTime),
                    end_time: toApiTime(b.endTime),
                    capacity: Number(b.capacity) || 1,
                    is_active: true,
                };
                if (b.apiId) {
                    await updateClassBatch(draftId, b.apiId, payload);
                } else {
                    await createClassBatch(draftId, payload);
                }
            }
            onNavigate('CREATE_CLASS_MEDIA');
        } catch (e) {
            console.error('Failed to save batches', e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <WizardLayout
            title="New Listing"
            stepText="Stage 2 of 5"
            subtitle="Batch & Schedule"
            progressPercentage={40}
            themeColor="yellow"
            onBack={() => onNavigate('CREATE_CLASS_IDENTITY')}
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Batch & Schedule</h2>
                <p className="text-sm text-gray-400">Set up timings for your classes.</p>
            </div>

            {loading ? (
                <SkeletonList rows={3} className="py-2" />
            ) : (
                <>
                    {batches.map((batch, idx) => (
                        <div key={batch.key} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-tlb-yellow uppercase tracking-widest">Batch {idx + 1}</p>
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
                                    value={batch.name}
                                    onChange={(e) => update(batch.key, { name: e.target.value })}
                                />
                            </div>

                            {/* Days */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Days</label>
                                <div className="flex gap-2">
                                    {DAY_LABELS.map((day) => (
                                        <button
                                            key={day}
                                            onClick={() => toggleDay(batch.key, day)}
                                            className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                                                batch.days.includes(day)
                                                    ? 'bg-tlb-yellow text-tlb-dark shadow-sm'
                                                    : 'bg-gray-50 border border-gray-200 text-gray-400 hover:border-tlb-yellow/30'
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Pickers */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                                        <Clock size={10} className="inline mr-1" /> Start Time
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
                                        <Clock size={10} className="inline mr-1" /> End Time
                                    </label>
                                    <input
                                        type="time"
                                        className="tlb-input w-full"
                                        value={batch.endTime}
                                        onChange={(e) => update(batch.key, { endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Capacity */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                                    <Users size={10} className="inline mr-1" /> Max Students
                                </label>
                                <input
                                    type="number"
                                    className="tlb-input w-full"
                                    placeholder="e.g. 20"
                                    min={1}
                                    value={batch.capacity}
                                    onChange={(e) => update(batch.key, { capacity: e.target.value })}
                                />
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => setBatches(prev => [...prev, blankBatch()])}
                        className="w-full py-3 border-2 border-dashed border-tlb-yellow/30 rounded-2xl text-sm font-bold text-tlb-yellow flex items-center justify-center gap-2 hover:bg-tlb-yellow/5 transition-colors"
                    >
                        <Plus size={18} /> Add New Batch
                    </button>
                </>
            )}

            <WizardNavigation
                onBack={() => onNavigate('CREATE_CLASS_IDENTITY')}
                onNext={handleNext}
                nextText={saving ? 'Saving...' : 'Next: Media'}
                nextIcon={saving ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                themeColor="yellow"
            />
        </WizardLayout>
    );
};
