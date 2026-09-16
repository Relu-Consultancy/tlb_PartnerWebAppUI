import React, { useState, useEffect, useCallback } from 'react';
import {
    ArrowRight, Loader2, Plus, X, Check,
    Wifi, Car, Utensils, Monitor, TreePine, ShieldCheck, Accessibility, Sofa,
    Gamepad2, Baby, Briefcase, LayoutGrid,
    Lock, ParkingMeter, ParkingSquare, Bike, Coffee, Music, PenTool, Video,
    Cigarette, HandHeart, Armchair, Flame, DoorOpen, AlarmSmoke, MoveVertical,
    Volleyball, Dumbbell, Waves, Blocks, Printer, Presentation, Laptop,
    Toilet, FireExtinguisher, Camera, Cross, Snowflake, Zap, Volume2, Projector, Mic,
    UtensilsCrossed,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../../types';
import { toast } from '../../components/ui';
import { WizardShell, WizardNav, WizardField, OptionTileGrid } from '../../components/portal/wizard';
import {
    getCurrentVenueDraftId,
    getAmenityCatalog,
    getVenueAmenities,
    updateVenueAmenities,
    AmenityGroup,
    AmenityItem,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar?: () => void; }

const CUSTOM_MAX = 15;
const CUSTOM_CHAR_MAX = 100;

// Generic fallback used whenever the API returns a group/icon key we don't recognize yet —
// the catalog is server-driven and can grow without a frontend release.
const GENERIC_GROUP_ICON = LayoutGrid;
const GENERIC_AMENITY_ICON = Check;

const GROUP_ICONS: Record<string, React.ElementType> = {
    basics: Wifi,
    accessibility: Accessibility,
    parking: Car,
    food: Utensils,
    av: Monitor,
    comfort: Sofa,
    outdoor: TreePine,
    safety: ShieldCheck,
    recreation: Gamepad2,
    childcare: Baby,
    business: Briefcase,
};

// Keyed by the amenity's `icon` slug (see GET /listings/venues/metadata/amenities/).
// Never match on `name`/`id` — only `slug`/`icon` are stable across catalog edits.
const AMENITY_ICONS: Record<string, React.ElementType> = {
    wifi: Wifi,
    parking: Car,
    'paid-parking': ParkingMeter,
    'street-parking': ParkingSquare,
    'two-wheeler-parking': Bike,
    'accessible-parking': Accessibility,
    locker: Lock,
    cafe: Coffee,
    dj: Music,
    whiteboard: PenTool,
    'video-conferencing': Video,
    'smoking-zone': Cigarette,
    'prayer-room': HandHeart,
    'outdoor-seating': Armchair,
    bbq: Flame,
    'emergency-exit': DoorOpen,
    'smoke-detector': AlarmSmoke,
    'fire-extinguisher': FireExtinguisher,
    'accessible-restroom': Toilet,
    restrooms: Toilet,
    'braille-elevator': MoveVertical,
    elevator: MoveVertical,
    'indoor-games': Blocks,
    'sports-court': Volleyball,
    gym: Dumbbell,
    spa: Waves,
    'kids-play-area': Blocks,
    creche: Baby,
    'baby-changing': Baby,
    printing: Printer,
    'meeting-room': Presentation,
    'coworking-desk': Laptop,
    cctv: Camera,
    'first-aid': Cross,
    ac: Snowflake,
    'power-backup': Zap,
    'sound-system': Volume2,
    projector: Projector,
    mic: Mic,
    catering: UtensilsCrossed,
    seating: Armchair,
};

const groupIcon = (key: string): React.ElementType => GROUP_ICONS[key] || GENERIC_GROUP_ICON;
const amenityIcon = (key?: string): React.ElementType => (key && AMENITY_ICONS[key]) || GENERIC_AMENITY_ICON;

export const CreateVenueAmenities: React.FC<Props> = ({ onNavigate }) => {
    const [draftId, setDraftId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [catalog, setCatalog] = useState<AmenityGroup[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    // Amenities the venue already has that no longer exist in the current catalog
    // (retired/renamed server-side — see `getAmenityCatalog` docs). Kept so the
    // partner can still see + remove them even though they can't be re-picked.
    const [retiredAmenities, setRetiredAmenities] = useState<AmenityItem[]>([]);
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
                const safeCatalog = Array.isArray(catalogData) ? catalogData : [];
                setCatalog(safeCatalog);
                const catalogIds = new Set(safeCatalog.flatMap(g => g.amenities.map(a => a.id)));
                const venueAmenities = venueData.amenities || [];
                setSelectedIds(new Set(venueAmenities.map(a => a.id)));
                setRetiredAmenities(venueAmenities.filter(a => !catalogIds.has(a.id)));
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

    if (loading) {
        return (
            <WizardShell title="New venue" entityType="Venues" step={5} totalSteps={7} stepLabel="Amenities" onBack={() => onNavigate('CREATE_VENUE_PACKAGES')}>
                <div className="pt-card p-5 sm:p-6 flex items-center justify-center gap-2 text-tlb-muted text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading amenities…
                </div>
            </WizardShell>
        );
    }

    if (loadError) {
        return (
            <WizardShell title="New venue" entityType="Venues" step={5} totalSteps={7} stepLabel="Amenities" onBack={() => onNavigate('CREATE_VENUE_PACKAGES')}>
                <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{loadError}</div>
            </WizardShell>
        );
    }

    const totalSelected = selectedIds.size + customAmenities.length;

    return (
        <WizardShell title="New venue" entityType="Venues" step={5} totalSteps={7} stepLabel="Amenities" onBack={() => onNavigate('CREATE_VENUE_PACKAGES')}>
            <div className="pt-card p-5 sm:p-6 flex flex-col gap-5">
                <div>
                    <h2 className="pt-h-sec">Amenities &amp; facilities</h2>
                    <p className="text-[13px] text-tlb-sub mt-0.5">Select what your venue offers. Customers filter venues by these.</p>
                </div>

                {totalSelected > 0 && (
                    <div className="pt-note bg-tlb-amber-soft text-tlb-gold">
                        {totalSelected} amenit{totalSelected === 1 ? 'y' : 'ies'} selected
                    </div>
                )}

                {/* Catalog groups — only groups with ≥1 active amenity are returned by the API,
                    so this renders whatever comes back rather than assuming a fixed set. */}
                {catalog.map((group, gi) => {
                    const GroupIcon = groupIcon(group.group);
                    return (
                        <motion.div
                            key={group.group}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: gi * 0.04 }}
                            className="flex flex-col gap-3"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="pt-tile-md bg-tlb-amber-soft text-tlb-gold"><GroupIcon size={15} /></div>
                                <h3 className="text-sm font-bold text-tlb-ink">{group.label}</h3>
                            </div>
                            <OptionTileGrid
                                options={group.amenities.map(a => ({ id: String(a.id), label: a.name, icon: amenityIcon(a.icon) }))}
                                isSelected={(id) => selectedIds.has(Number(id))}
                                onToggle={(id) => toggleAmenity(Number(id))}
                            />
                        </motion.div>
                    );
                })}

                {/* Retired amenities — this venue already had them before they were superseded in
                    the catalog. They won't appear above, but stay applied until removed here. */}
                {retiredAmenities.filter(a => selectedIds.has(a.id)).length > 0 && (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="pt-tile-md bg-tlb-wash text-tlb-muted"><GENERIC_GROUP_ICON size={15} /></div>
                            <div>
                                <h3 className="text-sm font-bold text-tlb-ink">Previously added</h3>
                                <p className="text-[11px] text-tlb-muted">No longer offered in the picker, but still applied to your venue</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {retiredAmenities.filter(a => selectedIds.has(a.id)).map(amenity => (
                                <span
                                    key={amenity.id}
                                    className="pt-pill bg-tlb-wash text-tlb-sub border border-tlb-line gap-1.5 !text-xs !font-bold py-1.5 px-3"
                                >
                                    {amenity.name}
                                    <button
                                        type="button"
                                        onClick={() => toggleAmenity(amenity.id)}
                                        className="p-0.5 rounded-full hover:bg-tlb-hover transition-colors"
                                        aria-label={`Remove ${amenity.name}`}
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Custom amenities */}
                <WizardField label="Custom amenities" hint={`Add amenities not listed above (${customAmenities.length}/${CUSTOM_MAX})`}>
                    {customAmenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-1">
                            {customAmenities.map((c, i) => (
                                <span
                                    key={i}
                                    className="pt-pill bg-tlb-amber-soft text-tlb-gold border border-tlb-amber-line gap-1.5 !text-xs !font-bold py-1.5 px-3"
                                >
                                    {c}
                                    <button
                                        type="button"
                                        onClick={() => removeCustom(i)}
                                        className="p-0.5 rounded-full hover:bg-tlb-cream transition-colors"
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
                                className="pt-input flex-1"
                            />
                            <button
                                type="button"
                                onClick={addCustom}
                                disabled={!customInput.trim()}
                                className="pt-btn bg-tlb-amber-soft text-tlb-gold hover:bg-tlb-cream disabled:opacity-40 shrink-0"
                            >
                                <Plus size={16} /> Add
                            </button>
                        </div>
                    )}
                </WizardField>

                <WizardNav
                    onBack={() => onNavigate('CREATE_VENUE_PACKAGES')}
                    onNext={saving ? () => {} : handleNext}
                    nextText={saving ? 'Saving…' : 'Next: FAQs & terms'}
                    nextIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} strokeWidth={2.75} />}
                />
            </div>
        </WizardShell>
    );
};
