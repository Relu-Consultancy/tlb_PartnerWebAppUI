import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, Clock, Users } from 'lucide-react';
import { Screen } from '../../types';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface Batch {
    id: number;
    name: string;
    days: string[];
    startTime: string;
    endTime: string;
    capacity: string;
}

const dayLabels = ['M', 'T', 'W', 'Th', 'F', 'S', 'Su'];

export const CreateListingBatch: React.FC<Props> = ({ onNavigate }) => {
    const [batches, setBatches] = useState<Batch[]>([
        { id: 1, name: 'Morning Batch', days: ['M', 'W', 'F'], startTime: '07:00', endTime: '08:00', capacity: '15' }
    ]);

    const addBatch = () => {
        setBatches(prev => [...prev, {
            id: Date.now(), name: '', days: [], startTime: '', endTime: '', capacity: ''
        }]);
    };

    const removeBatch = (id: number) => {
        if (batches.length > 1) setBatches(prev => prev.filter(b => b.id !== id));
    };

    const updateBatch = (id: number, field: keyof Batch, value: any) => {
        setBatches(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const toggleDay = (batchId: number, day: string) => {
        setBatches(prev => prev.map(b =>
            b.id === batchId
                ? { ...b, days: b.days.includes(day) ? b.days.filter(d => d !== day) : [...b.days, day] }
                : b
        ));
    };

    return (
    <div className="min-h-screen bg-gray-50 pb-8">
        <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            <button onClick={() => onNavigate('CREATE_LISTING_IDENTITY')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
            <div className="text-center">
                <h1 className="font-black text-lg">New Listing</h1>
                <p className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">Stage 2 of 5 — Batch & Schedule</p>
            </div>
            <div className="w-10" />
        </header>

        <div className="w-full h-1.5 bg-gray-100">
            <div className="h-full bg-tlb-yellow w-[40%] transition-all duration-500" />
        </div>

        <main className="p-6">
            <div className="tlb-content space-y-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black">Batch & Schedule</h2>
                    <p className="text-sm text-gray-400">Define when your class runs. Add as many batches as needed.</p>
                </div>

                {/* Batch Cards */}
                {batches.map((batch, idx) => (
                    <div key={batch.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-tlb-yellow uppercase tracking-widest">Batch {idx + 1}</p>
                            {batches.length > 1 && (
                                <button onClick={() => removeBatch(batch.id)} className="text-red-400 hover:text-red-600 p-1">
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
                                onChange={(e) => updateBatch(batch.id, 'name', e.target.value)}
                            />
                        </div>

                        {/* Day Selection */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Days</label>
                            <div className="flex gap-2">
                                {dayLabels.map((day) => (
                                    <button
                                        key={day}
                                        onClick={() => toggleDay(batch.id, day)}
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
                                    onChange={(e) => updateBatch(batch.id, 'startTime', e.target.value)}
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
                                    onChange={(e) => updateBatch(batch.id, 'endTime', e.target.value)}
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
                                value={batch.capacity}
                                onChange={(e) => updateBatch(batch.id, 'capacity', e.target.value)}
                            />
                        </div>
                    </div>
                ))}

                {/* Add Batch */}
                <button
                    onClick={addBatch}
                    className="w-full py-3 border-2 border-dashed border-tlb-yellow/30 rounded-2xl text-sm font-bold text-tlb-yellow flex items-center justify-center gap-2 hover:bg-tlb-yellow/5 transition-colors"
                >
                    <Plus size={18} /> Add New Batch
                </button>

                {/* Navigation */}
                <div className="flex gap-3">
                    <button onClick={() => onNavigate('CREATE_LISTING_IDENTITY')} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-500 text-sm">
                        ← Back
                    </button>
                    <button onClick={() => onNavigate('CREATE_LISTING_MEDIA')} className="flex-1 tlb-button py-4 gap-2">
                        Next: Media <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </main>
    </div>
    );
};
