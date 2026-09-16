import React, { useState, useEffect } from 'react';
import { ArrowRight, MapPin, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { toast, LocationPicker, LanguagePicker, validateLanguages } from '../../components/ui';
import { PickedLocation } from '../../components/ui/LocationPicker';
import { WizardShell, WizardNav, WizardField, OptionTileGrid } from '../../components/portal/wizard';
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
    const [address, setAddress] = useState('');
    const [meetingLink, setMeetingLink] = useState('');

    // Languages this listing is conducted in — [] means "not specified yet".
    const [languages, setLanguages] = useState<string[]>([]);
    const [otherLanguage, setOtherLanguage] = useState('');
    const [langError, setLangError] = useState('');

    // Google Maps location picker — area/coordinates/place_id aren't shown as
    // separate inputs; they ride along with the address/city fields above.
    const [area, setArea] = useState('');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [placeId, setPlaceId] = useState<string | undefined>(undefined);

    const handleLocationPicked = (loc: PickedLocation) => {
        setAddress(loc.address);
        setCity(loc.city);
        setArea(loc.area);
        setLatitude(loc.latitude);
        setLongitude(loc.longitude);
        setPlaceId(loc.place_id);
    };

    // A manual edit after a pick invalidates the place_id (and the map's
    // resolved area) — fall back to sending the raw lat/lng + address instead.
    const editAddressManually = (v: string) => { setAddress(v); setPlaceId(undefined); setArea(''); };

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
                    setAddress(d.address || '');
                    setArea(d.area || '');
                    setLatitude(d.latitude != null ? Number(d.latitude) : null);
                    setLongitude(d.longitude != null ? Number(d.longitude) : null);
                    setMeetingLink(d.meeting_link || '');
                    setLanguages(Array.isArray(d.languages) ? d.languages : []);
                    setOtherLanguage(d.other_language || '');
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
        const langErr = validateLanguages(languages, otherLanguage);
        if (langErr) { setLangError(langErr); toast.warning(langErr); return; }
        setLangError('');
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
                // Google Maps location — prefer the place_id (server re-resolves
                // it); otherwise fall back to the raw picked/typed coordinates.
                // latitude/longitude must always be sent together.
                if (placeId) {
                    payload.place_id = placeId;
                } else {
                    if (city) payload.city = city;
                    if (address) payload.address = address;
                    if (area) payload.area = area;
                    if (latitude != null && longitude != null) {
                        // Backend rejects more than 6 decimal places; Google's
                        // resolved coordinates can come back with more than that.
                        payload.latitude = latitude.toFixed(6);
                        payload.longitude = longitude.toFixed(6);
                    }
                }
            }
            if (mode === 'online' || mode === 'hybrid') {
                if (meetingLink) payload.meeting_link = meetingLink;
            }

            if (languages.length) {
                payload.languages = languages;
                if (languages.includes('other')) payload.other_language = otherLanguage.trim();
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
        <WizardShell title="New event" entityType="Events" step={1} totalSteps={5} stepLabel="Details" onBack={() => onNavigate('SERVICE_LISTINGS')}>
            <div className="pt-card p-5 sm:p-6 flex flex-col gap-5">
                {overlayLoading && (
                    <div className="flex items-center justify-center gap-2 text-tlb-muted text-xs font-bold">
                        <Loader2 size={14} className="animate-spin" /> Loading…
                    </div>
                )}
                {metaError && <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{metaError}</div>}

                <div>
                    <h2 className="pt-h-sec">Event details</h2>
                    <p className="text-[13px] text-tlb-sub mt-0.5">Define what your event is about.</p>
                </div>

                <WizardField label="Event title">
                    <input
                        className="pt-input"
                        placeholder="e.g. Summer Art Festival"
                        maxLength={200}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </WizardField>

                <WizardField label="Description">
                    <textarea
                        className="pt-input min-h-[140px]"
                        placeholder="Tell parents & attendees what this event is about, what to expect, what to bring..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </WizardField>

                <WizardField label="Category">
                    {categories.length === 0 && !metaLoading ? (
                        <p className="text-xs text-tlb-muted">No categories available.</p>
                    ) : (
                        <div className="max-h-[300px] overflow-y-auto">
                            <OptionTileGrid
                                options={categories.map(c => ({ id: String(c.id), label: c.name }))}
                                isSelected={(id) => selectedCategoryId === Number(id)}
                                onToggle={(id) => { setSelectedCategoryId(Number(id)); setSelectedSubcategoryId(null); }}
                            />
                        </div>
                    )}
                </WizardField>

                {selectedCategory && subcategories.length > 0 && (
                    <WizardField label="Sub-category">
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {subcategories.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setSelectedSubcategoryId(selectedSubcategoryId === s.id ? null : s.id)}
                                    className={`pt-scope shrink-0 ${selectedSubcategoryId === s.id ? 'is-active' : ''}`}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </WizardField>
                )}

                <WizardField label="Event format">
                    <div className="flex flex-wrap gap-2">
                        {formats.map((f) => (
                            <button
                                key={f.value}
                                type="button"
                                onClick={() => setSelectedFormat(selectedFormat === f.value ? '' : f.value)}
                                className={`pt-scope ${selectedFormat === f.value ? 'is-active' : ''}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </WizardField>

                {ageMeta && (
                    <WizardField label="Age group">
                        <div className="flex gap-2 mb-1">
                            <button type="button" onClick={() => setAgeGroupType('static')} className={`pt-scope ${ageGroupType === 'static' ? 'is-active' : ''}`}>
                                Preset
                            </button>
                            {ageMeta.custom_range.enabled && (
                                <button type="button" onClick={() => setAgeGroupType('custom')} className={`pt-scope ${ageGroupType === 'custom' ? 'is-active' : ''}`}>
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
                                            type="button"
                                            onClick={() => setStaticAgeKey(staticAgeKey === key ? '' : key)}
                                            className={`pt-scope ${staticAgeKey === key ? 'is-active' : ''}`}
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
                                    className="pt-input w-24 text-center"
                                    value={customMin}
                                    onChange={(e) => setCustomMin(e.target.value)}
                                />
                                <span className="text-tlb-muted font-bold text-sm">to</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    min={ageMeta.custom_range.min_allowed_age}
                                    max={ageMeta.custom_range.max_allowed_age}
                                    className="pt-input w-24 text-center"
                                    value={customMax}
                                    onChange={(e) => setCustomMax(e.target.value)}
                                />
                                <span className="text-tlb-muted font-bold text-sm">yrs</span>
                                <span className="text-[10px] text-tlb-faint ml-2">
                                    Allowed: {ageMeta.custom_range.min_allowed_age}–{ageMeta.custom_range.max_allowed_age}
                                </span>
                            </div>
                        )}
                    </WizardField>
                )}

                <WizardField label="Mode">
                    <div className="grid grid-cols-3 gap-3">
                        {MODE_META.map((m) => (
                            <button
                                key={m.value}
                                type="button"
                                onClick={() => setMode(m.value)}
                                className={`pt-tile ${mode === m.value ? 'is-on' : ''}`}
                            >
                                <span className="text-lg">{m.icon}</span>
                                <span>{m.label}</span>
                            </button>
                        ))}
                    </div>
                </WizardField>

                {(mode === 'offline' || mode === 'hybrid') && (
                    <WizardField label="Venue location" className="gap-3">
                        <span className="sr-only"><MapPin size={12} /></span>
                        <LocationPicker
                            initialLatitude={latitude}
                            initialLongitude={longitude}
                            initialAddress={address}
                            onSelect={handleLocationPicked}
                        />
                        <textarea
                            className="pt-input min-h-[70px]"
                            placeholder="Street, building, landmark"
                            value={address}
                            onChange={(e) => editAddressManually(e.target.value)}
                        />
                    </WizardField>
                )}

                <LanguagePicker
                    languages={languages}
                    otherLanguage={otherLanguage}
                    onChange={(l, o) => { setLanguages(l); setOtherLanguage(o); setLangError(''); }}
                    error={langError}
                />

                {(mode === 'online' || mode === 'hybrid') && (
                    <WizardField label="Meeting link">
                        <input
                            className="pt-input"
                            placeholder="https://meet.google.com/..."
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                        />
                    </WizardField>
                )}

                <WizardNav
                    onNext={saving ? () => {} : handleNext}
                    nextText={saving ? 'Saving…' : 'Next: Schedule & pricing'}
                    nextIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} strokeWidth={2.75} />}
                />
            </div>
        </WizardShell>
    );
};
