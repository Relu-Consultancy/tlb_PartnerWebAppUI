import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Tag, ChevronDown } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

const categories: Record<string, string[]> = {
    'Future Tech & AI': ['AI Basics', 'Machine Learning', 'Robotics', 'Coding', 'Cybersecurity'],
    'Design & Innovation': ['UI/UX Design', 'Product Design', 'Graphic Design', 'Creative Thinking'],
    'Leadership & Entrepreneurship': ['Business Strategy', 'Management', 'Financial Literacy', 'Startup Basics'],
    'Media & Content Creation': ['Video Editing', 'Podcasting', 'Social Media Marketing', 'Photography'],
    'Stage Arts & Performance': ['Theatre / Acting', 'Dance', 'Vocal Performance', 'Instrument Learning'],
    'Active Sports & Training': ['Athletics', 'Martial Arts', 'Fitness Bootcamp', 'Yoga'],
    'Academics & Competitive Prep': ['Olympiads', 'Board Exams', 'Entrance Prep', 'School Subjects'],
    'Analytical Thinking': ['Vedic Maths', 'Chess', 'Problem Solving', 'Abacus'],
    'Language & Communication': ['Spoken English', 'Creative Writing', 'Foreign Languages', 'Public Speaking'],
    'Culinary & Hospitality': ['Cooking', 'Baking', 'Food Styling', 'Etiquette'],
    'Grooming & Personality Development': ['Personal Branding', 'Confidence Building', 'Emotional Intelligence'],
};

const formats = ['Physical', 'Online', 'Hybrid', 'Trial'];
const tagOptions = ['Beginner Friendly', 'Advanced', 'Certification', 'Weekend Only', 'Trial Available', 'Group Class', 'One-on-One'];

export const CreateProgramIdentity: React.FC<Props> = ({ onNavigate }) => {
    const [cat, setCat] = useState('');
    const [sub, setSub] = useState('');
    const [format, setFormat] = useState('Physical');
    const [tags, setTags] = useState<string[]>([]);

    const toggleTag = (t: string) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

    return (
        <WizardLayout
            title="New Listing"
            stepText="Stage 1 of 5"
            subtitle="Identity"
            progressPercentage={20}
            themeColor="emerald"
            onBack={() => onNavigate('SERVICE_LISTINGS')}
        >
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
                        <textarea className="tlb-input w-full min-h-[160px] resize-y" placeholder="Describe your class Ã¢â‚¬â€ curriculum, what to bring, certifications... Creative freedom is yours!"></textarea>
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
                        <div className="relative group">
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value)}
                                className="tlb-input w-full bg-white appearance-none cursor-pointer pr-10"
                            >
                                {formats.map((f) => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-tlb-yellow transition-colors">
                                <ChevronDown size={18} />
                            </div>
                        </div>
                        <div className="mt-2 flex gap-4">
                            {formats.map((f) => (
                                <div key={f} className={`flex items-center gap-1.5 transition-opacity ${format === f ? 'opacity-100' : 'opacity-20'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${f === 'Physical' ? 'bg-blue-500' : f === 'Online' ? 'bg-emerald-500' : f === 'Hybrid' ? 'bg-purple-500' : 'bg-amber-500'}`} />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{f}</span>
                                </div>
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
                            <div className="relative group">
                                <select value={cat} onChange={(e) => { setCat(e.target.value); setSub(''); }} className="tlb-input w-full bg-white appearance-none pr-10">
                                    <option value="">Select...</option>
                                    {Object.keys(categories).map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-tlb-yellow transition-colors">
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Sub-Category</label>
                            <div className="relative group">
                                <select value={sub} onChange={(e) => setSub(e.target.value)} className="tlb-input w-full bg-white appearance-none pr-10" disabled={!cat}>
                                    <option value="">Select...</option>
                                    {(categories[cat] || []).map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300 group-focus-within:text-tlb-yellow transition-colors">
                                    <ChevronDown size={18} />
                                </div>
                            </div>
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
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${tags.includes(t)
                                            ? 'bg-tlb-yellow text-tlb-dark'
                                            : 'bg-white border border-gray-200 text-gray-500 hover:border-tlb-yellow/30'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

            <WizardNavigation 
                onNext={() => onNavigate('CREATE_PROGRAM_BATCH')}
                nextText="Next: Batch & Schedule"
                nextIcon={<ArrowRight size={20} />}
                themeColor="emerald"
            />
        </WizardLayout>
    );
};
