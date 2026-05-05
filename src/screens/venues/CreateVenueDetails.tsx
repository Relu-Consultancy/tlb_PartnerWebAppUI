import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Upload, Check, ChevronDown } from 'lucide-react';
import { Screen } from '../../types';
import { VENUE_CATEGORIES, getVenueSubcategories } from '../../data/venueCategories';
import { WizardLayout, WizardNavigation } from '../../components/ui';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

export const CreateVenueDetails: React.FC<Props> = ({ onNavigate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [showAllCategories, setShowAllCategories] = useState(false);

    const visibleCategories = showAllCategories ? VENUE_CATEGORIES : VENUE_CATEGORIES.slice(0, 6);

    return (
        <WizardLayout
            title="New Venue Listing"
            stepText="Step 1 of 5"
            subtitle="Details"
            progressPercentage={20}
            themeColor="amber"
            onBack={() => onNavigate('SERVICE_LISTINGS')}
        >
            {/* Section Header */}
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Venue Details</h2>
                <p className="text-sm text-gray-400">Tell us about your performance or event space.</p>
            </div>

            {/* Venue Name */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Venue Name</label>
                <input
                    className="tlb-input w-full"
                    placeholder="e.g. Royal Kids Party Hall"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            {/* Location */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    <MapPin size={12} className="inline mr-1" /> Location
                </label>
                <input
                    className="tlb-input w-full"
                    placeholder="e.g. Powai, Mumbai"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
            </div>

            {/* Category Selection */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {visibleCategories.map((cat) => (
                        <button
                            key={cat.name}
                            onClick={() => { setSelectedCategory(cat.name); setSelectedSubCategory(''); }}
                            className={`relative p-4 rounded-2xl border-2 flex flex-col items-center text-center gap-2 transition-all ${selectedCategory === cat.name
                                ? 'border-amber-400 bg-amber-50'
                                : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                            }`}
                        >
                            {selectedCategory === cat.name && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                                    <Check size={12} className="text-white" />
                                </div>
                            )}
                            <span className="text-2xl">{cat.icon}</span>
                            <span className="text-xs font-bold text-gray-700 leading-tight">{cat.name}</span>
                        </button>
                    ))}
                </div>
                {!showAllCategories && VENUE_CATEGORIES.length > 6 && (
                    <button
                        onClick={() => setShowAllCategories(true)}
                        className="w-full mt-3 text-xs font-bold text-amber-500 hover:text-amber-700 transition-colors"
                    >
                        Show all {VENUE_CATEGORIES.length} categories ↓
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
                            {getVenueSubcategories(selectedCategory).map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-amber-500 transition-colors">
                            <ChevronDown size={18} />
                        </div>
                    </div>
                </div>
            )}

            {/* Description */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Description</label>
                <textarea
                    className="tlb-input w-full min-h-[140px] resize-y"
                    placeholder="Describe the ambiance, facilities, and why it's perfect for events..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            {/* Image Upload Mock */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Cover Image & Gallery</label>
                <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center bg-white hover:bg-gray-50 transition-colors cursor-pointer flex flex-col items-center">
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-3">
                        <Upload size={20} />
                    </div>
                    <p className="font-bold text-gray-700">Tap to upload photos</p>
                    <p className="text-xs text-gray-400 mt-1">High-quality images of the hall, dining area, etc.</p>
                </div>
            </div>

            <WizardNavigation 
                onNext={() => onNavigate('CREATE_VENUE_OCCASIONS')}
                nextText="Next: Occasions & Capacity"
                nextIcon={<ArrowRight size={20} />}
                themeColor="amber"
            />
        </WizardLayout>
    );
};
