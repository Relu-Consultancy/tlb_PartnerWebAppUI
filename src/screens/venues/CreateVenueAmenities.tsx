import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Loader2, Plus, X, Check, Wifi, Car, Utensils, Monitor, TreePine, ShieldCheck, Accessibility, Sofa } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, toast } from '../../components/ui';
import {
    getCurrentVenueDraftId,
    getAmenityCatalog,
    getVenueAmenities,
    updateVenueAmenities,
    AmenityGroup,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar?: () => void; }

const CUSTOM_MAX = 15;
const CUSTOM_CHAR_MAX = 100;

const GROUP_ICONS: Record<string, React.ElementType> = {
    basics: Wifi,
    accessibility: Accessibility,
    parking: Car,
    food: Utensils,
    av: Monitor,
    comfort: Sofa,
    outdoor: TreePine,
    safety: ShieldCheck,
};

export const CreateVenueAmenities: React.FC<Props> = ({ onNavigate }) => {
    const [draftId, setDraftId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [catalog, setCatalog] = useState<AmenityGroup[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [customAmenities, setCustomAmenities] = useState<string[]>([]);
    const [customInput, setCustomInput] = useState('');

    useEffect(() => {
        const id = getCurrentVenueDraftId();
        if (!id) {
            setLoadError('No active draft. Start from "Venue Details".');
            setLoading(false);
            return;
        }
        setDraftId(id);
        (async () => {
            try {
                const [catalogData, venueData] = await Promise.all([
                    getAmenityCatalog(),
                    getVenueAmenities(id).catch(() => ({ amenities: [], custom_amenities: [] })),
                ]);
                setCatalog(Array.isArray(catalogData) ? catalogData : []);
                setSelectedIds(new Set((venueData.amenities || []).map(a => a.id)));
                setCustomAmenities(venueData.custom_amenities || []);
            } catch (err: any) {
                setLoadError(err?.message || 'Failed to load amenities.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toggleAmenity = useCallback((id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const addCustom = useCallback(() => {
        const val = customInput.trim();
        if (!val) return;
        if (val.length > CUSTOM_CHAR_MAX) {
            toast.warning(`Custom amenity must be under ${CUSTOM_CHAR_MAX} characters.`);
            return;
        }
        if (customAmenities.length >= CUSTOM_MAX) {
            toast.warning(`Maximum ${CUSTOM_MAX} custom amenities allowed.`);
            return;
        }
        if (customAmenities.some(c => c.toLowerCase() === val.toLowerCase())) {
            toast.warning('This custom amenity already exists.');
            return;
        }
        setCustomAmenities(prev => [...prev, val]);
        setCustomInput('');
    }, [customInput, customAmenities]);

    const removeCustom = useCallback((index: number) => {
        setCustomAmenities(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleNext = async () => {
        if (!draftId) return;
        setSaving(true);
        try {
            await updateVenueAmenities(draftId, Array.from(selectedIds), customAmenities);
            onNavigate('CREATE_VENUE_POLICIES');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to save amenities.');
        } finally {
            setSaving(false);
        }
    };

    if (loading || loadError) {
        return (
            <WizardLayout
                title="New Venue Listing"
                stepText="Step 5 of 7"
                subtitle="Amenities"
                progressPercentage={71}
                themeColor="amber"
                onBack={() => onNavigate('CREATE_VENUE_PACKAGES')}
            >
                {loading
                    ? <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold py-12">
                          <Loader2 size={16} className="animate-spin" /> Loading amenities…
                      </div>
                    : <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-600">
                          {loadError}
                      </div>
                }
            </WizardLayout>
        );
    }

    const totalSelected = selectedIds.size + customAmenities.length;

    return (
        <WizardLayout
            title="New Venue Listing"
            stepText="Step 5 of 7"
            subtitle="Amenities"
            progressPercentage={71}
            themeColor="amber"
            onBack={() => onNavigate('CREATE_VENUE_PACKAGES')}
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Amenities & Facilities</h2>
                <p className="text-sm text-gray-400">Select what your venue offers. Customers filter venues by these.</p>
            </div>

            {totalSelected > 0 && (
                <div className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5">
                    {totalSelected} amenit{totalSelected === 1 ? 'y' : 'ies'} selected
                </div>
            )}

            {/* Catalog groups */}
            {catalog.map((group, gi) => {
                const GroupIcon = GROUP_ICONS[group.group] || Wifi;
                return (
                    <motion.div
                        key={group.group}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: gi * 0.04 }}
                    >
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                <GroupIcon size={15} />
                            </div>
                            <h3 className="text-sm font-black text-gray-900">{group.label}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {group.amenities.map(amenity => {
                                const active = selectedIds.has(amenity.id);
                                return (
                                    <button
                                        key={amenity.id}
                                        onClick={() => toggleAmenity(amenity.id)}
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                                            active
                                                ? 'border-amber-400 bg-amber-50 text-amber-800'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {active && <Check size={14} className="text-amber-600" />}
                                        {amenity.name}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                );
            })}

            {/* Custom amenities */}
            <div className="pt-2">
                <h3 className="text-sm font-black text-gray-900 mb-1">Custom Amenities</h3>
                <p className="text-xs text-gray-400 mb-3">
                    Add amenities not listed above ({customAmenities.length}/{CUSTOM_MAX})
                </p>

                {customAmenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {customAmenities.map((c, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold bg-amber-50 border-2 border-amber-400 text-amber-800"
                            >
                                {c}
                                <button
                                    onClick={() => removeCustom(i)}
                                    className="p-0.5 rounded-full hover:bg-amber-200 transition-colors"
                                    aria-label={`Remove ${c}`}
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {customAmenities.length < CUSTOM_MAX && (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={customInput}
                            onChange={e => setCustomInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
                            placeholder="e.g. Pet Friendly, Live DJ…"
                            maxLength={CUSTOM_CHAR_MAX}
                            className="tlb-input flex-1"
                        />
                        <button
                            onClick={addCustom}
                            disabled={!customInput.trim()}
                            className="px-4 py-2.5 rounded-xl bg-amber-100 text-amber-700 font-bold text-sm hover:bg-amber-200 transition-colors disabled:opacity-40 disabled:hover:bg-amber-100 flex items-center gap-1.5 shrink-0"
                        >
                            <Plus size={16} /> Add
                        </button>
                    </div>
                )}
            </div>

            <WizardNavigation
                onBack={() => onNavigate('CREATE_VENUE_PACKAGES')}
                onNext={handleNext}
                nextText={saving ? 'Saving…' : 'Next: FAQs & Terms'}
                nextIcon={saving ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                themeColor="amber"
            />
        </WizardLayout>
    );
};
