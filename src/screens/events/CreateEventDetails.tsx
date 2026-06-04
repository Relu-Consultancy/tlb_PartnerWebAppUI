import React, { useState, useEffect } from 'react';
import { ArrowRight, MapPin, Check, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, toast } from '../../components/ui';
import {
    getEventMetaCategories,
    getEventMetaFormats,
    getEventMetaAgeGroups,
    createEventDraft,
    updateListing,
    getListingDetail,
    getCurrentDraftId,
    setCurrentDraftId,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface ApiCategory { id: number; name: string; slug: string; subcategories: { id: number; name: string; slug: string }[] }
interface ApiFormat { value: string; label: string }
interface StaticRange { min_age: number; max_age: number }
interface AgeGroupsMeta {
    static_ranges: StaticRange[];
    custom_range: { enabled: boolean; min_allowed_age: number; max_allowed_age: number };
}

type Mode = 'online' | 'offline' | 'hybrid';

const MODE_META: { value: Mode; label: string; icon: string }[] = [
    { value: 'online', label: 'Online', icon: '💻' },
    { value: 'offline', label: 'Offline', icon: '📍' },
    { value: 'hybrid', label: 'Hybrid', icon: '🔄' },
];

export const CreateEventDetails: React.FC<Props> = ({ onNavigate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Metadata
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [formats, setFormats] = useState<ApiFormat[]>([]);
    const [ageMeta, setAgeMeta] = useState<AgeGroupsMeta | null>(null);
    const [metaLoading, setMetaLoading] = useState(true);
    const [metaError, setMetaError] = useState<string | null>(null);

    // Selections
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<string>('');
    const [ageGroupType, setAgeGroupType] = useState<'static' | 'custom'>('static');
    const [staticAgeKey, setStaticAgeKey] = useState<string>(''); // "min-max"
    const [customMin, setCustomMin] = useState<string>('');
    const [customMax, setCustomMax] = useState<string>('');
    const [mode, setMode] = useState<Mode>('offline');
    const [city, setCity] = useState('');
    const [area, setArea] = useState('');
    const [address, setAddress] = useState('');
    const [meetingLink, setMeetingLink] = useState('');

    const [saving, setSaving] = useState(false);
    const [draftLoading, setDraftLoading] = useState(false);

    // ─── Load metadata + existing draft (if any) ──────────────────────────
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setMetaLoading(true);
            try {
                const [catsRes, fmtsRes, agesRes] = await Promise.all([
                    getEventMetaCategories(),
                    getEventMetaFormats(),
                    getEventMetaAgeGroups(),
                ]);
                if (cancelled) return;
                setCategories(catsRes.data || catsRes || []);
                setFormats(fmtsRes.data || fmtsRes || []);
                setAgeMeta(agesRes.data || agesRes || null);
            } catch (err: any) {
                if (!cancelled) setMetaError(err?.message || 'Failed to load event metadata');
            } finally {
                if (!cancelled) setMetaLoading(false);
            }

            const draftId = getCurrentDraftId();
            if (draftId && !cancelled) {
                setDraftLoading(true);
                try {
                    const res = await getListingDetail(draftId);
                    const d = res.data || res;
                    if (cancelled) return;
                    setTitle(d.title || '');
                    setDescription(d.description || '');
                    setSelectedCategoryId(d.category?.id ?? null);
                    setSelectedSubcategoryId(d.subcategory?.id ?? null);
                    setSelectedFormat(d.format || '');
                    if (d.age_group) {
                        setAgeGroupType(d.age_group.type || 'static');
                        if (d.age_group.type === 'static') {
                            setStaticAgeKey(`${d.age_group.min_age}-${d.age_group.max_age}`);
                        } else {
                            setCustomMin(String(d.age_group.min_age ?? ''));
                            setCustomMax(String(d.age_group.max_age ?? ''));
                        }
                    }
                    if (d.mode) setMode(d.mode);
                    setCity(d.city || '');
                    setArea(d.area || '');
                    setAddress(d.address || '');
                    setMeetingLink(d.meeting_link || '');
                } catch (err) {
                    console.warn('Could not load existing draft', err);
                } finally {
                    if (!cancelled) setDraftLoading(false);
                }
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const subcategories = selectedCategory?.subcategories || [];

    const buildAgeGroup = () => {
        if (ageGroupType === 'static') {
            if (!staticAgeKey) return null;
            const [min, max] = staticAgeKey.split('-').map(Number);
            return { type: 'static', min_age: min, max_age: max };
        }
        const min = parseInt(customMin, 10);
        const max = parseInt(customMax, 10);
        if (isNaN(min) || isNaN(max)) return null;
        return { type: 'custom', min_age: min, max_age: max };
    };

    const handleNext = async () => {
        if (!title.trim()) {
            toast.warning('Please enter an event title.');
            return;
        }
        setSaving(true);
        try {
            // 1. Create draft if none exists yet
            let draftId = getCurrentDraftId();
            if (!draftId) {
                const createRes = await createEventDraft({
                    title: title.trim(),
                    description: description.trim() || undefined,
                });
                const data = createRes.data || createRes;
                draftId = data.id;
                if (!draftId) throw new Error('Server did not return a draft id.');
                setCurrentDraftId(draftId);
            }

            // 2. Build update payload from current selections
            const payload: Record<string, any> = {
                title: title.trim(),
                description: description.trim(),
                mode,
            };
            if (selectedCategoryId) payload.category_id = selectedCategoryId;
            if (selectedSubcategoryId) payload.subcategory_id = selectedSubcategoryId;
            if (selectedFormat) payload.format = selectedFormat;
            const ageGroup = buildAgeGroup();
            if (ageGroup) payload.age_group = ageGroup;
            if (mode === 'offline' || mode === 'hybrid') {
                if (city) payload.city = city;
                if (area) payload.area = area;
                if (address) payload.address = address;
            }
            if (mode === 'online' || mode === 'hybrid') {
                if (meetingLink) payload.meeting_link = meetingLink;
            }

            await updateListing(draftId, payload);
            onNavigate('CREATE_EVENT_SCHEDULE');
        } catch (err: any) {
            console.error('Failed to save draft', err);
            toast.error(err?.message || 'Failed to save event. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const overlayLoading = metaLoading || draftLoading;

    return (
        <WizardLayout
            title="New Event"
            stepText="Step 1 of 4"
            subtitle="Details"
            progressPercentage={25}
            themeColor="blue"
            onBack={() => onNavigate('SERVICE_LISTINGS')}
        >
            {overlayLoading && (
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold">
                    <Loader2 size={14} className="animate-spin" /> Loading…
                </div>
            )}
            {metaError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-600">
                    {metaError}
                </div>
            )}

            <div className="space-y-1">
                <h2 className="text-2xl font-black">Event Details</h2>
                <p className="text-sm text-gray-400">Define what your event is about.</p>
            </div>

            {/* Title */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Event Title</label>
                <input
                    className="tlb-input w-full"
                    placeholder="e.g. Summer Art Festival"
                    maxLength={200}
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

            {/* Category */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Category</label>
                {categories.length === 0 && !metaLoading ? (
                    <p className="text-xs text-gray-400">No categories available.</p>
                ) : (
                    <div className="max-h-[300px] overflow-y-auto rounded-2xl">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => { setSelectedCategoryId(cat.id); setSelectedSubcategoryId(null); }}
                                    className={`relative p-4 rounded-2xl border-2 text-center transition-all ${selectedCategoryId === cat.id
                                        ? 'border-blue-400 bg-blue-50'
                                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                                    }`}
                                >
                                    {selectedCategoryId === cat.id && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                            <Check size={12} className="text-white" />
                                        </div>
                                    )}
                                    <span className="text-xs font-bold text-gray-700 leading-tight">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Subcategory */}
            {selectedCategory && subcategories.length > 0 && (
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Sub-Category</label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {subcategories.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedSubcategoryId(selectedSubcategoryId === s.id ? null : s.id)}
                                className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                                    selectedSubcategoryId === s.id
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300'
                                }`}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Format (single-select) */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Event Format</label>
                <div className="flex flex-wrap gap-2">
                    {formats.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setSelectedFormat(selectedFormat === f.value ? '' : f.value)}
                            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${selectedFormat === f.value
                                ? 'bg-purple-500 text-white shadow-sm'
                                : 'bg-white border border-gray-200 text-gray-500 hover:border-purple-300'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Age Group */}
            {ageMeta && (
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Age Group</label>
                    {/* Type toggle */}
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => setAgeGroupType('static')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${ageGroupType === 'static'
                                ? 'bg-tlb-dark text-tlb-yellow'
                                : 'bg-white border border-gray-200 text-gray-500'
                            }`}
                        >
                            Preset
                        </button>
                        {ageMeta.custom_range.enabled && (
                            <button
                                onClick={() => setAgeGroupType('custom')}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${ageGroupType === 'custom'
                                    ? 'bg-tlb-dark text-tlb-yellow'
                                    : 'bg-white border border-gray-200 text-gray-500'
                                }`}
                            >
                                Custom
                            </button>
                        )}
                    </div>

                    {ageGroupType === 'static' ? (
                        <div className="flex flex-wrap gap-2">
                            {ageMeta.static_ranges.map((r) => {
                                const key = `${r.min_age}-${r.max_age}`;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setStaticAgeKey(staticAgeKey === key ? '' : key)}
                                        className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${staticAgeKey === key
                                            ? 'bg-blue-500 text-white shadow-sm'
                                            : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300'
                                        }`}
                                    >
                                        {r.min_age}–{r.max_age} yrs
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                placeholder="Min"
                                min={ageMeta.custom_range.min_allowed_age}
                                max={ageMeta.custom_range.max_allowed_age}
                                className="tlb-input w-24 text-center"
                                value={customMin}
                                onChange={(e) => setCustomMin(e.target.value)}
                            />
                            <span className="text-gray-400 font-bold text-sm">to</span>
                            <input
                                type="number"
                                placeholder="Max"
                                min={ageMeta.custom_range.min_allowed_age}
                                max={ageMeta.custom_range.max_allowed_age}
                                className="tlb-input w-24 text-center"
                                value={customMax}
                                onChange={(e) => setCustomMax(e.target.value)}
                            />
                            <span className="text-gray-400 font-bold text-sm">yrs</span>
                            <span className="text-[10px] text-gray-300 ml-2">
                                Allowed: {ageMeta.custom_range.min_allowed_age}–{ageMeta.custom_range.max_allowed_age}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Mode */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Mode</label>
                <div className="grid grid-cols-3 gap-3">
                    {MODE_META.map((m) => (
                        <button
                            key={m.value}
                            onClick={() => setMode(m.value)}
                            className={`p-4 rounded-2xl border-2 text-center transition-all ${mode === m.value
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-gray-100 bg-white hover:border-gray-200'
                            }`}
                        >
                            <span className="text-lg">{m.icon}</span>
                            <p className={`text-xs font-bold mt-1.5 ${mode === m.value ? 'text-blue-600' : 'text-gray-500'}`}>{m.label}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Location (offline / hybrid) */}
            {(mode === 'offline' || mode === 'hybrid') && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
                        <MapPin size={12} className="inline mr-1" /> Venue Location
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            className="tlb-input w-full"
                            placeholder="City"
                            maxLength={100}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                        <input
                            className="tlb-input w-full"
                            placeholder="Area / Neighborhood"
                            maxLength={100}
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                        />
                    </div>
                    <textarea
                        className="tlb-input w-full min-h-[80px] resize-y"
                        placeholder="Full address (street, building, pincode)"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </div>
            )}

            {/* Meeting link (online / hybrid) */}
            {(mode === 'online' || mode === 'hybrid') && (
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Meeting Link</label>
                    <input
                        className="tlb-input w-full"
                        placeholder="https://meet.google.com/..."
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                    />
                </div>
            )}

            <WizardNavigation
                onNext={saving ? () => {} : handleNext}
                nextText={saving ? 'Saving…' : 'Next: Schedule & Pricing'}
                nextIcon={saving ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                themeColor="blue"
            />
        </WizardLayout>
    );
};
