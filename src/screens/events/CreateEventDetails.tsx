import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, MapPin, ChevronDown, Check } from 'lucide-react';
import { Screen, EventFormat, AgeGroup, EventMode } from '../../types';
import { EVENT_CATEGORIES, EVENT_FORMATS, AGE_GROUPS, EVENT_MODES, getSubcategories } from '../../data/eventCategories';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

export const CreateEventDetails: React.FC<Props> = ({ onNavigate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [selectedFormats, setSelectedFormats] = useState<EventFormat[]>([]);
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');
    const [isAllAges, setIsAllAges] = useState(false);
    const [mode, setMode] = useState<EventMode>('Offline');
    const [location, setLocation] = useState('');
    const [showAllCategories, setShowAllCategories] = useState(false);

    const toggleFormat = (f: EventFormat) => {
        setSelectedFormats(prev => prev.includes(f) ? [] : [f]);
    };

    const visibleCategories = showAllCategories ? EVENT_CATEGORIES : EVENT_CATEGORIES.slice(0, 6);

    return (
        <div className="min-h-screen bg-gray-50 pb-8">
            <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                <button onClick={() => onNavigate('SERVICE_LISTINGS')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
                <div className="text-center">
                    <h1 className="font-black text-lg">New Event</h1>
                    <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Step 1 of 4 — Details</p>
                </div>
                <div className="w-10" />
            </header>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-gray-100">
                <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 w-[25%] transition-all duration-500 rounded-r-full" />
            </div>

            <main className="p-6">
                <div className="tlb-content space-y-8">
                    {/* Section Header */}
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black">Event Details</h2>
                        <p className="text-sm text-gray-400">Define what your event is about.</p>
                    </div>

                    {/* Event Title */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Event Title</label>
                        <input
                            className="tlb-input w-full"
                            placeholder="e.g. Summer Art Festival"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Description</label>
                        <textarea
                            className="tlb-input w-full min-h-[140px] resize-y"
                            placeholder="Tell parents & attendees what this event is about, what to expect, what to bring..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Category Selection — Card Grid */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Category</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {visibleCategories.map((cat) => (
                                <button
                                    key={cat.name}
                                    onClick={() => { setSelectedCategory(cat.name); setSelectedSubCategory(''); }}
                                    className={`relative p-4 rounded-2xl border-2 flex flex-col items-center text-center gap-2 transition-all ${selectedCategory === cat.name
                                        ? 'border-purple-400 bg-purple-50'
                                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                                    }`}
                                >
                                    {selectedCategory === cat.name && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                            <Check size={12} className="text-white" />
                                        </div>
                                    )}
                                    <span className="text-2xl">{cat.icon}</span>
                                    <span className="text-xs font-bold text-gray-700 leading-tight">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                        {!showAllCategories && (
                            <button
                                onClick={() => setShowAllCategories(true)}
                                className="w-full mt-3 text-xs font-bold text-purple-500 hover:text-purple-700 transition-colors"
                            >
                                Show all {EVENT_CATEGORIES.length} categories ↓
                            </button>
                        )}
                    </div>

                    {/* Subcategory Dropdown */}
                    {selectedCategory && (
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Sub-Category</label>
                            <div className="relative group">
                                <select
                                    value={selectedSubCategory}
                                    onChange={(e) => setSelectedSubCategory(e.target.value)}
                                    className="tlb-input w-full bg-white appearance-none cursor-pointer pr-10"
                                >
                                    <option value="">Select sub-category...</option>
                                    {getSubcategories(selectedCategory).map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-purple-500 transition-colors">
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Format — Multi-select Chips */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Event Format</label>
                        <div className="flex flex-wrap gap-2">
                            {EVENT_FORMATS.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => toggleFormat(f)}
                                    className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${selectedFormats.includes(f)
                                        ? 'bg-purple-500 text-white shadow-sm'
                                        : 'bg-white border border-gray-200 text-gray-500 hover:border-purple-300'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Age Group — Input Fields & All Ages Checkbox */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Age Group</label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className={`flex items-center gap-3 transition-opacity ${isAllAges ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-purple-400 w-24">
                                    <input 
                                        type="number" 
                                        placeholder="Min"
                                        className="w-full p-3 outline-none text-sm font-bold text-gray-700 text-center" 
                                        value={minAge} 
                                        onChange={(e) => setMinAge(e.target.value)} 
                                        disabled={isAllAges}
                                    />
                                </div>
                                <span className="text-gray-400 font-bold text-sm">to</span>
                                <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-purple-400 w-24">
                                    <input 
                                        type="number" 
                                        placeholder="Max"
                                        className="w-full p-3 outline-none text-sm font-bold text-gray-700 text-center" 
                                        value={maxAge} 
                                        onChange={(e) => setMaxAge(e.target.value)} 
                                        disabled={isAllAges}
                                    />
                                </div>
                                <span className="text-gray-400 font-bold text-sm">yrs</span>
                            </div>
                            
                            <button
                                onClick={() => setIsAllAges(!isAllAges)}
                                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isAllAges
                                    ? 'bg-tlb-yellow text-tlb-dark shadow-sm'
                                    : 'bg-white border border-gray-200 text-gray-500 hover:border-tlb-yellow/50'
                                }`}
                            >
                                🌟 All Ages
                            </button>
                        </div>
                    </div>

                    {/* Mode — Radio Cards */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Mode</label>
                        <div className="grid grid-cols-3 gap-3">
                            {EVENT_MODES.map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className={`p-4 rounded-2xl border-2 text-center transition-all ${mode === m
                                        ? 'border-purple-400 bg-purple-50'
                                        : 'border-gray-100 bg-white hover:border-gray-200'
                                    }`}
                                >
                                    <span className="text-lg">{m === 'Online' ? '💻' : m === 'Offline' ? '📍' : '🔄'}</span>
                                    <p className={`text-xs font-bold mt-1.5 ${mode === m ? 'text-purple-600' : 'text-gray-500'}`}>{m}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location (conditional) */}
                    {(mode === 'Offline' || mode === 'Hybrid') && (
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                                <MapPin size={12} className="inline mr-1" /> Event Location
                            </label>
                            <input
                                className="tlb-input w-full"
                                placeholder="Venue address"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Next Button */}
                    <button
                        onClick={() => onNavigate('CREATE_EVENT_SCHEDULE')}
                        className="tlb-button w-full py-4 shadow-lg shadow-purple-200 text-base gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
                    >
                        Next: Schedule & Pricing <ArrowRight size={20} />
                    </button>
                </div>
            </main>
        </div>
    );
};
