import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Plus, Trash2, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { SkeletonList } from '../../components/ui';
import { WizardShell, WizardNav, WizardField } from '../../components/portal/wizard';
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
        <WizardShell title="New class" entityType="Classes" step={2} totalSteps={5} stepLabel="Batches" onBack={() => onNavigate('CREATE_CLASS_IDENTITY')}>
            <div className="pt-card p-5 sm:p-6 flex flex-col gap-5">
                <div>
                    <h2 className="pt-h-sec">Batch &amp; schedule</h2>
                    <p className="text-[13px] text-tlb-sub mt-0.5">Set up timings for your classes.</p>
                </div>

                <WizardField label="Batches">
                    <div className="flex flex-col gap-3">
                        {loading ? (
                            <SkeletonList rows={3} className="py-2" />
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
                                                value={batch.name}
                                                onChange={(e) => update(batch.key, { name: e.target.value })}
                                            />
                                        </WizardField>

                                        <WizardField label="Days">
                                            <div className="flex gap-2">
                                                {DAY_LABELS.map((day) => (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => toggleDay(batch.key, day)}
                                                        className={`pt-tile !p-0 w-10 h-10 ${batch.days.includes(day) ? 'is-on' : ''}`}
                                                    >
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                        </WizardField>

                                        <div className="grid grid-cols-2 gap-3">
                                            <WizardField label="Start time">
                                                <input
                                                    type="time"
                                                    className="pt-input"
                                                    value={batch.startTime}
                                                    onChange={(e) => update(batch.key, { startTime: e.target.value })}
                                                />
                                            </WizardField>
                                            <WizardField label="End time">
                                                <input
                                                    type="time"
                                                    className="pt-input"
                                                    value={batch.endTime}
                                                    onChange={(e) => update(batch.key, { endTime: e.target.value })}
                                                />
                                            </WizardField>
                                        </div>

                                        <WizardField label="Max students">
                                            <input
                                                type="number"
                                                className="pt-input"
                                                placeholder="e.g. 20"
                                                min={1}
                                                value={batch.capacity}
                                                onChange={(e) => update(batch.key, { capacity: e.target.value })}
                                            />
                                        </WizardField>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => setBatches(prev => [...prev, blankBatch()])}
                                    className="pt-btn pt-btn-o w-full justify-center border-dashed"
                                >
                                    <Plus size={14} strokeWidth={2.75} /> Add batch
                                </button>
                            </>
                        )}
                    </div>
                </WizardField>

                <WizardNav
                    onBack={() => onNavigate('CREATE_CLASS_IDENTITY')}
                    onNext={handleNext}
                    nextText={saving ? 'Saving…' : 'Next: Media'}
                    nextIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} strokeWidth={2.75} />}
                />
            </div>
        </WizardShell>
    );
};
