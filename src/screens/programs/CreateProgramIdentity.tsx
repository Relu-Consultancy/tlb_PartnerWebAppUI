import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { Select, LocationPicker, LanguagePicker, validateLanguages } from '../../components/ui';
import { PickedLocation } from '../../components/ui/LocationPicker';
import { WizardShell, WizardNav, WizardField, OptionTileGrid, BookingTypeCards } from '../../components/portal/wizard';
import {
    getCurrentProgramDraftId,
    setCurrentProgramDraftId,
    createProgramDraft,
    updateProgramListing,
    getProgramListingDetail,
    getProgramMetaCategories,
    getProgramMetaFormats,
    getProgramMetaTags,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface ApiCategory { id: number; name: string; slug?: string; subcategories: { id: number; name: string; slug?: string }[] }
interface ApiOption { value: string; label: string }
interface ApiTag { id: number; name: string; slug?: string }

export const CreateProgramIdentity: React.FC<Props> = ({ onNavigate }) => {
    const [title, setTitle] = useState('');
    const [shortDesc, setShortDesc] = useState('');
    const [description, setDescription] = useState('');
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');
    const [maxCapacity, setMaxCapacity] = useState('');
    const [totalHours, setTotalHours] = useState('');
    const [moduleCount, setModuleCount] = useState('');
    const [bookingType, setBookingType] = useState<'enquiry' | 'direct_booking'>('enquiry');
    const [programFormat, setProgramFormat] = useState('');
    const [deliveryMode, setDeliveryMode] = useState('offline');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [meetingLink, setMeetingLink] = useState('');

    // Languages this listing is conducted in — [] means "not specified yet".
    const [languages, setLanguages] = useState<string[]>([]);
    const [otherLanguage, setOtherLanguage] = useState('');
    const [langError, setLangError] = useState('');

    // Google Maps location picker — Programs' PATCH endpoint isn't confirmed to
    // accept latitude/longitude yet, so these ride along best-effort; city and
    // address (already-supported fields) always update regardless.
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const handleLocationPicked = (loc: PickedLocation) => {
        setAddress(loc.address);
        setCity(loc.city);
        setLatitude(loc.latitude);
        setLongitude(loc.longitude);
    };

    // API-driven metadata
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [formats, setFormats] = useState<ApiOption[]>([]);
    const [deliveryModes, setDeliveryModes] = useState<ApiOption[]>([]);
    const [apiTags, setApiTags] = useState<ApiTag[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
    const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

    const [metaLoading, setMetaLoading] = useState(true);
    const [metaError, setMetaError] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setMetaLoading(true);
            let catsData: ApiCategory[] = [];
            try {
                const [catsRes, fmtsRes, tagsRes] = await Promise.all([
                    getProgramMetaCategories(),
                    getProgramMetaFormats(),
                    getProgramMetaTags(),
                ]);
                if (!cancelled) {
                    // Categories: response.data is array
                    catsData = catsRes.data || catsRes || [];
                    setCategories(catsData);
                    // Formats: response.data has { formats: [...], delivery_modes: [...] }
                    const fmtData = fmtsRes.data || fmtsRes;
                    setFormats(Array.isArray(fmtData.formats) ? fmtData.formats : []);
                    setDeliveryModes(Array.isArray(fmtData.delivery_modes) ? fmtData.delivery_modes : []);
                    // Tags: response.data is array of { id, name, slug }
                    setApiTags(tagsRes.data || tagsRes || []);
                }
            } catch (err: any) {
                if (!cancelled) setMetaError(err?.message || 'Failed to load metadata.');
            } finally {
                if (!cancelled) setMetaLoading(false);
            }

            // Load existing draft if resuming
            const id = getCurrentProgramDraftId();
            if (!id || cancelled) return;
            try {
                const res = await getProgramListingDetail(id);
                const d = res.data || res;
                if (cancelled) return;
                setTitle(d.title || '');
                setShortDesc(d.short_description || '');
                setDescription(d.description || '');
                if (d.min_age != null) setMinAge(String(d.min_age));
                if (d.max_age != null) setMaxAge(String(d.max_age));
                if (d.max_capacity != null) setMaxCapacity(String(d.max_capacity));
                if (d.total_hours != null) setTotalHours(String(d.total_hours));
                if (d.module_count != null) setModuleCount(String(d.module_count));
                if (d.program_format) setProgramFormat(d.program_format);
                if (d.delivery_mode) setDeliveryMode(d.delivery_mode);
                const loadedBookingType = d.booking_type;
                if (loadedBookingType === 'enquiry' || loadedBookingType === 'direct_booking') setBookingType(loadedBookingType);
                setCity(d.city || '');
                setAddress(d.address || '');
                if (d.latitude != null) setLatitude(Number(d.latitude));
                if (d.longitude != null) setLongitude(Number(d.longitude));
                setMeetingLink(d.meeting_link || '');
                setLanguages(Array.isArray(d.languages) ? d.languages : []);
                setOtherLanguage(d.other_language || '');
                // Category & subcategory come as objects { id, name }
                const catId = d.category?.id;
                const subId = d.subcategory?.id;
                if (catId) setSelectedCategoryId(catId);
                if (subId) {
                    // Validate the stored subcategory still belongs to the stored category.
                    // A previous save bug could have left them mismatched — reset if so.
                    const cat = catsData.find(c => c.id === catId);
                    const isValid = cat?.subcategories.some(s => s.id === subId) ?? false;
                    setSelectedSubcategoryId(isValid ? subId : null);
                }
                const loadedTags = d.tags || [];
                if (loadedTags.length > 0) {
                    const firstTag = loadedTags[0];
                    setSelectedTagId(typeof firstTag === 'object' ? firstTag.id : firstTag);
                }
            } catch (e) {
                console.error('Failed to load program detail', e);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const needsAddress = deliveryMode === 'offline' || deliveryMode === 'hybrid';

    const handleNext = async () => {
        if (!title.trim()) { setError('Program title is required.'); return; }
        if (selectedCategoryId != null && selectedSubcategoryId == null) {
            setError('Please select a subcategory for the chosen category.');
            return;
        }
        const langErr = validateLanguages(languages, otherLanguage);
        if (langErr) { setLangError(langErr); setError(langErr); return; }
        setLangError('');
        if (saving) return;
        setError('');
        setSaving(true);
        try {
            let draftId = getCurrentProgramDraftId();
            if (!draftId) {
                const res = await createProgramDraft({
                    title: title.trim(),
                    short_description: shortDesc.trim() || undefined,
                    description: description.trim() || undefined,
                    booking_type: bookingType,
                });
                const d = res.data || res;
                draftId = d.id;
                setCurrentProgramDraftId(draftId!);
            }

            // Build PATCH payload per API 11.4
            const payload: Record<string, any> = {
                title: title.trim(),
                short_description: shortDesc.trim(),
                description: description.trim(),
                delivery_mode: deliveryMode,
                booking_type: bookingType,
            };
            if (programFormat) payload.program_format = programFormat;
            if (minAge) payload.min_age = Number(minAge);
            if (maxAge) payload.max_age = Number(maxAge);
            if (maxCapacity) payload.max_capacity = Number(maxCapacity);
            if (totalHours) payload.total_hours = Number(totalHours);
            if (moduleCount) payload.module_count = Number(moduleCount);
            if (needsAddress) {
                if (city.trim()) payload.city = city.trim();
                if (address.trim()) payload.address = address.trim();
                // Best-effort — not yet confirmed on the Programs endpoint, but
                // harmless to send (unrecognized fields are dropped, not rejected).
                if (latitude != null && longitude != null) {
                    payload.latitude = latitude.toFixed(6);
                    payload.longitude = longitude.toFixed(6);
                }
            }
            if ((deliveryMode === 'online' || deliveryMode === 'hybrid') && meetingLink.trim()) {
                payload.meeting_link = meetingLink.trim();
            }
            // Send IDs, not strings
            if (selectedCategoryId != null) {
                payload.category_id = selectedCategoryId;
                payload.subcategory_id = selectedSubcategoryId; // always send alongside category to clear any stale subcategory on the backend
            } else if (selectedSubcategoryId != null) {
                payload.subcategory_id = selectedSubcategoryId;
            }
            if (selectedTagId != null) payload.tag_ids = [selectedTagId];

            if (languages.length) {
                payload.languages = languages;
                if (languages.includes('other')) payload.other_language = otherLanguage.trim();
            }

            await updateProgramListing(draftId!, payload);
            onNavigate('CREATE_PROGRAM_BATCH');
        } catch (e: any) {
            setError(e?.message || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const toggleTag = (id: number) => {
        setSelectedTagId(prev => prev === id ? null : id);
    };

    return (
        <WizardShell title="New program" entityType="Programs" step={1} totalSteps={5} stepLabel="Identity" onBack={() => onNavigate('SERVICE_LISTINGS')}>
            <div className="pt-card p-5 sm:p-6 flex flex-col gap-5">
                <div>
                    <h2 className="pt-h-sec">Identity &amp; story</h2>
                    <p className="text-[13px] text-tlb-sub mt-0.5">Capture the "what" and "why" of your program.</p>
                </div>

                {error && <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{error}</div>}
                {metaError && <div className="pt-note bg-tlb-amber-soft text-tlb-gold">{metaError}</div>}

                <WizardField label="Program title" required>
                    <input
                        className="pt-input"
                        placeholder="e.g. Advanced Robotics Program"
                        maxLength={200}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </WizardField>

                <WizardField label="Short summary">
                    <input
                        className="pt-input"
                        placeholder="One-line description shown in search results"
                        maxLength={500}
                        value={shortDesc}
                        onChange={(e) => setShortDesc(e.target.value)}
                    />
                </WizardField>

                <WizardField label="The master description" hint="Tell the full story of your program.">
                    <textarea
                        className="pt-input min-h-[160px]"
                        placeholder="Describe your program — curriculum, outcomes, certifications..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </WizardField>

                <WizardField label="Program format">
                    {metaLoading ? (
                        <div className="flex items-center gap-2 text-tlb-muted text-xs font-bold">
                            <Loader2 size={14} className="animate-spin" /> Loading formats…
                        </div>
                    ) : (
                        <Select
                            value={programFormat}
                            onChange={(v) => setProgramFormat(v)}
                            options={formats.map((f) => ({ value: f.value, label: f.label }))}
                            placeholder="Select format..."
                            ariaLabel="Program format"
                            buttonClassName="pt-input w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                        />
                    )}
                </WizardField>

                <WizardField label="Delivery mode">
                    {metaLoading ? (
                        <div className="flex items-center gap-2 text-tlb-muted text-xs font-bold">
                            <Loader2 size={14} className="animate-spin" /> Loading modes…
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {deliveryModes.map((m) => (
                                <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => setDeliveryMode(m.value)}
                                    className={`pt-tile ${deliveryMode === m.value ? 'is-on' : ''}`}
                                >
                                    <span className="text-lg">{m.value === 'offline' ? '📍' : m.value === 'online' ? '💻' : '🔄'}</span>
                                    <span>{m.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </WizardField>

                <WizardField label="Target age group">
                    <div className="flex items-center gap-3">
                        <input className="pt-input" type="number" placeholder="Min (e.g. 8)" min={0} value={minAge} onChange={(e) => setMinAge(e.target.value)} />
                        <span className="text-tlb-muted font-bold text-sm">to</span>
                        <input className="pt-input" type="number" placeholder="Max (e.g. 14)" min={0} value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
                        <span className="text-tlb-muted font-bold text-sm">yrs</span>
                    </div>
                </WizardField>

                <WizardField
                    label="Booking type"
                    required
                    hint="Enquiry programs collect leads you follow up on. Direct booking lets customers pay for a batch online."
                >
                    <BookingTypeCards
                        value={bookingType}
                        onChange={setBookingType}
                        enquiryDescription="Customers send an enquiry and you follow up to confirm."
                        directBookingDescription="Customers book and pay online."
                    />
                </WizardField>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <WizardField label="Max capacity">
                        <input className="pt-input" type="number" placeholder="e.g. 30" min={1} value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} />
                    </WizardField>
                    <WizardField label="Total hours">
                        <input className="pt-input" type="number" placeholder="e.g. 40" min={1} value={totalHours} onChange={(e) => setTotalHours(e.target.value)} />
                    </WizardField>
                    <WizardField label="Modules">
                        <input className="pt-input" type="number" placeholder="e.g. 8" min={1} value={moduleCount} onChange={(e) => setModuleCount(e.target.value)} />
                    </WizardField>
                </div>

                {needsAddress && (
                    <WizardField label="Program location" className="gap-3">
                        <LocationPicker
                            initialLatitude={latitude}
                            initialLongitude={longitude}
                            initialAddress={address}
                            onSelect={handleLocationPicked}
                        />
                        <textarea className="pt-input min-h-[70px]" placeholder="Street, building, landmark" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </WizardField>
                )}

                <LanguagePicker
                    languages={languages}
                    otherLanguage={otherLanguage}
                    onChange={(l, o) => { setLanguages(l); setOtherLanguage(o); setLangError(''); }}
                    error={langError}
                />

                {(deliveryMode === 'online' || deliveryMode === 'hybrid') && (
                    <WizardField label="Meeting link">
                        <input className="pt-input" placeholder="https://meet.google.com/..." value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} />
                    </WizardField>
                )}

                <WizardField label="Category">
                    {metaLoading ? (
                        <div className="flex items-center gap-2 text-tlb-muted text-xs font-bold">
                            <Loader2 size={14} className="animate-spin" /> Loading categories…
                        </div>
                    ) : categories.length === 0 ? (
                        <p className="text-xs text-tlb-muted">No categories available.</p>
                    ) : (
                        <div className="max-h-[280px] overflow-y-auto">
                            <OptionTileGrid
                                options={categories.map(c => ({ id: String(c.id), label: c.name }))}
                                isSelected={(id) => selectedCategoryId === Number(id)}
                                onToggle={(id) => { setSelectedCategoryId(Number(id)); setSelectedSubcategoryId(null); }}
                            />
                        </div>
                    )}
                </WizardField>

                {selectedCategory && selectedCategory.subcategories.length > 0 && (
                    <WizardField label="Sub-category">
                        <div className="flex flex-wrap gap-2">
                            {selectedCategory.subcategories.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setSelectedSubcategoryId(selectedSubcategoryId === s.id ? null : s.id)}
                                    className={`pt-scope ${selectedSubcategoryId === s.id ? 'is-active' : ''}`}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </WizardField>
                )}

                <WizardField label="Tags">
                    {metaLoading ? (
                        <div className="flex items-center gap-2 text-tlb-muted text-xs font-bold">
                            <Loader2 size={14} className="animate-spin" /> Loading tags…
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {apiTags.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => toggleTag(t.id)}
                                    className={`pt-scope ${selectedTagId === t.id ? 'is-active' : ''}`}
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    )}
                </WizardField>

                <WizardNav
                    onNext={saving ? () => {} : handleNext}
                    nextText={saving ? 'Saving…' : 'Next: Batch & schedule'}
                    nextIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} strokeWidth={2.75} />}
                />
            </div>
        </WizardShell>
    );
};
