import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Tag, ChevronDown } from 'lucide-react';
import { Screen } from '../../types';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

const categories: Record<string, string[]> = {
    'Dance & Movement': ['Contemporary', 'Classical', 'Hip-Hop', 'Bollywood', 'Ballet'],
    'Music & Instruments': ['Keyboard', 'Guitar', 'Vocals', 'Drums', 'Violin'],
    'Academics & Tutoring': ['Science', 'Mathematics', 'English', 'Coding'],
    'Yoga & Wellness': ['Hatha', 'Vinyasa', 'Power Yoga', 'Meditation'],
    'Art & Craft': ['Painting', 'Sketching', 'Pottery', 'Origami'],
    'Sports & Fitness': ['Swimming', 'Cricket', 'Football', 'MMA'],
    'Coding & Robotics': ['Scratch', 'Python', 'Robotics', 'Web Dev'],
    'Martial Arts': ['Karate', 'Taekwondo', 'Judo', 'MMA'],
};

const formats = ['Physical', 'Online', 'Hybrid', 'Trial'];
const tagOptions = ['Beginner Friendly', 'Advanced', 'Certification', 'Weekend Only', 'Trial Available', 'Group Class', 'One-on-One'];

export const CreateListingIdentity: React.FC<Props> = ({ onNavigate }) => {
    const [cat, setCat] = useState('');
    const [sub, setSub] = useState('');
    const [format, setFormat] = useState('Physical');
    const [tags, setTags] = useState<string[]>([]);

    const toggleTag = (t: string) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

    return (
    <div className="min-h-screen bg-gray-50 pb-8">
        <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            <button onClick={() => onNavigate('SERVICE_LISTINGS')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
            <div className="text-center">
                <h1 className="font-black text-lg">New Listing</h1>
                <p className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">Stage 1 of 5 — Identity</p>
            </div>
            <div className="w-10" />
        </header>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-gray-100">
            <div className="h-full bg-tlb-yellow w-[20%] transition-all duration-500" />
        </div>

        <main className="p-6">
            <div className="tlb-content space-y-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black">Identity & Story</h2>
                    <p className="text-sm text-gray-400">Capture the "What" and "Why" of your class.</p>
                </div>

                {/* Service Title */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Service Title</label>
                    <input className="tlb-input w-full" placeholder="e.g. Advanced Robotics" />
                </div>

                {/* Master Description */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">The Master Description</label>
                    <textarea className="tlb-input w-full min-h-[160px] resize-y" placeholder="Describe your class — curriculum, what to bring, certifications... Creative freedom is yours!"></textarea>
                    <p className="text-xs text-gray-300 mt-1">One rich description replaces separate fields. Tell the full story.</p>
                </div>

                {/* Target Age Group */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Target Age Group</label>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <input className="tlb-input w-full" type="number" placeholder="Min (e.g. 8)" min={0} />
                        </div>
                        <span className="self-center text-gray-300 font-bold">to</span>
                        <div className="flex-1">
                            <input className="tlb-input w-full" type="number" placeholder="Max (e.g. 14)" min={0} />
                        </div>
                        <span className="self-center text-sm text-gray-400 font-bold">Years</span>
                    </div>
                </div>

                {/* Format */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Format</label>
                    <div className="flex flex-wrap gap-2">
                        {formats.map((f) => (
                            <button
                                key={f}
                                onClick={() => setFormat(f)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    format === f
                                        ? 'bg-tlb-yellow text-tlb-dark shadow-sm'
                                        : 'bg-white border border-gray-100 text-gray-500 hover:border-tlb-yellow/30'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Location (if physical/hybrid) */}
                {(format === 'Physical' || format === 'Hybrid') && (
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                            <MapPin size={12} className="inline mr-1" /> Class Location
                        </label>
                        <input className="tlb-input w-full" placeholder="Address of the venue (if different from profile)" />
                    </div>
                )}

                {/* Category & Sub-category */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
                        <select value={cat} onChange={(e) => { setCat(e.target.value); setSub(''); }} className="tlb-input w-full bg-white">
                            <option value="">Select...</option>
                            {Object.keys(categories).map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Sub-Category</label>
                        <select value={sub} onChange={(e) => setSub(e.target.value)} className="tlb-input w-full bg-white" disabled={!cat}>
                            <option value="">Select...</option>
                            {(categories[cat] || []).map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                        <Tag size={12} className="inline mr-1" /> Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {tagOptions.map((t) => (
                            <button
                                key={t}
                                onClick={() => toggleTag(t)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    tags.includes(t)
                                        ? 'bg-tlb-yellow text-tlb-dark'
                                        : 'bg-white border border-gray-200 text-gray-500 hover:border-tlb-yellow/30'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Next Button */}
                <button
                    onClick={() => onNavigate('CREATE_LISTING_BATCH')}
                    className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20 text-base gap-2"
                >
                    Next: Batch & Schedule <ArrowRight size={20} />
                </button>
            </div>
        </main>
    </div>
    );
};
