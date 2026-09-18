import React, { useState, useEffect } from 'react';
import { ArrowRight, MapPin, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { LocationPicker, LanguagePicker, validateLanguages } from '../../components/ui';
import { PickedLocation } from '../../components/ui/LocationPicker';
import { WizardShell, WizardNav, WizardField, OptionTileGrid, BookingTypeCards } from '../../components/portal/wizard';
import {
    getCurrentClassDraftId,
    setCurrentClassDraftId,
    createClassDraft,
    updateClassListing,
    getClassListingDetail,
    getClassMetaCategories,
    getClassMetaFormats,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface ApiCategory { id: number; name: string; slug?: string; subcategories: { id: number; name: string; slug?: string }[] }
interface ApiMode { value: string; label: string }

const tagOptions = ['Beginner Friendly', 'Advanced', 'Certification', 'Weekend Only', 'Trial Available', 'Group Class', 'One-on-One'];

export const CreateClassIdentity: React.FC<Props> = ({ onNavigate }) => {
    const [title, setTitle] = useState('');
    const [shortDesc, setShortDesc] = useState('');
    const [description, setDescription] = useState('');
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');
    const [mode, setMode] = useState('offline');
    const [bookingType, setBookingType] = useState<'enquiry' | 'direct_booking'>('enquiry');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [meetingLink, setMeetingLink] = useState('');

    // Languages this listing is conducted in — [] means "not specified yet".
    const [languages, setLanguages] = useState<string[]>([]);
    const [otherLanguage, setOtherLanguage] = useState('');
    const [langError, setLangError] = useState('');

    // Google Maps location picker — Classes' PATCH endpoint isn't confirmed to
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
    const [tag, setTag] = useState('');
    const [price, setPrice] = useState('');

    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [modes, setModes] = useState<ApiMode[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);

    const [metaLoading, setMetaLoading] = useState(true);
    const [metaError, setMetaError] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setMetaLoading(true);
            let catsData: ApiCategory[] = [];
            try {
                const [catsRes, fmtsRes] = await Promise.all([
                    getClassMetaCategories(),
                    getClassMetaFormats(),
                ]);
                if (!cancelled) {
                    catsData = catsRes.data || catsRes || [];
                    setCategories(catsData);
                    const fmtData = fmtsRes.data || fmtsRes;
                    // API returns { modes: [...] } — delivery modes, not formats
                    setModes(Array.isArray(fmtData.modes) ? fmtData.modes : []);
                }
            } catch (err: any) {
                if (!cancelled) setMetaError(err?.message || 'Failed to load metadata.');
            } finally {
                if (!cancelled) setMetaLoading(false);
            }

            const id = getCurrentClassDraftId();
            if (!id || cancelled) return;
            try {
                const res = await getClassListingDetail(id);
                const d = res.data || res;
                const srv = d.service || {};
                if (cancelled) return;
                // title/short_description/description are top-level
                setTitle(d.title || '');
                setShortDesc(d.short_description || '');
                setDescription(d.description || '');
                // service-specific fields live under .service
                const rawMinAge = srv.min_age ?? d.min_age;
                const rawMaxAge = srv.max_age ?? d.max_age;
                if (rawMinAge != null) setMinAge(String(rawMinAge));
                if (rawMaxAge != null) setMaxAge(String(rawMaxAge));
                setCity(srv.city || d.city || '');
                setAddress(srv.address || d.address || '');
                const rawLat = srv.latitude ?? d.latitude;
                const rawLng = srv.longitude ?? d.longitude;
                if (rawLat != null) setLatitude(Number(rawLat));
                if (rawLng != null) setLongitude(Number(rawLng));
                setMeetingLink(srv.meeting_link || d.meeting_link || '');
                setLanguages(Array.isArray(d.languages) ? d.languages : []);
                setOtherLanguage(d.other_language || '');
                const loadedPrice = srv.price ?? d.price;
                if (loadedPrice != null) setPrice(String(loadedPrice));
                const loadedMode = srv.mode || d.mode;
                if (loadedMode) setMode(loadedMode);
                const loadedBookingType = srv.booking_type || d.booking_type;
                if (loadedBookingType === 'enquiry' || loadedBookingType === 'direct_booking') setBookingType(loadedBookingType);
                const loadedTag = srv.tags?.[0] || d.tags?.[0];
                if (loadedTag) setTag(loadedTag);
                const catId = srv.category?.id ?? d.category?.id;
                const subId = srv.subcategory?.id ?? d.subcategory?.id;
                if (catId) setSelectedCategoryId(catId);
                if (subId) {
                    // Validate the stored subcategory still belongs to the stored category.
                    // A previous save bug could have left them mismatched — reset if so.
                    const cat = catsData.find(c => c.id === catId);
                    const isValid = cat?.subcategories.some(s => s.id === subId) ?? false;
                    setSelectedSubcategoryId(isValid ? subId : null);
                }
            } catch (e) {
                console.warn('Failed to load class draft', e);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const needsAddress = mode === 'offline' || mode === 'hybrid';

    const handleNext = async () => {
        if (!title.trim()) { setSaveError('Class title is required.'); return; }
        if (selectedCategoryId != null && selectedSubcategoryId == null) {
            setSaveError('Please select a subcategory for the chosen category.');
            return;
        }
        const langErr = validateLanguages(languages, otherLanguage);
        if (langErr) { setLangError(langErr); setSaveError(langErr); return; }
        setLangError('');
        if (saving) return;
        setSaveError('');
        setSaving(true);
        try {
            let draftId = getCurrentClassDraftId();
            if (!draftId) {
                const res = await createClassDraft({
                    title: title.trim(),
                    short_description: shortDesc.trim(),
                    description: description.trim(),
                    booking_type: bookingType,
                });
                const d = res.data || res;
                draftId = d.id;
                setCurrentClassDraftId(draftId!);
            }
            const payload: Record<string, any> = {
                title: title.trim(),
                short_description: shortDesc.trim(),
                description: description.trim(),
                mode,
                booking_type: bookingType,
            };

            if (minAge) payload.min_age = Number(minAge);
            if (maxAge) payload.max_age = Number(maxAge);
            if (needsAddress) {
                if (city.trim()) payload.city = city.trim();
                if (address.trim()) payload.address = address.trim();
                // Best-effort — not yet confirmed on the Classes endpoint, but
                // harmless to send (unrecognized fields are dropped, not rejected).
                if (latitude != null && longitude != null) {
                    payload.latitude = latitude.toFixed(6);
                    payload.longitude = longitude.toFixed(6);
                }
            }
            if ((mode === 'online' || mode === 'hybrid') && meetingLink.trim()) {
                payload.meeting_link = meetingLink.trim();
            }
            if (price.trim()) payload.price = price.trim();
            if (tag) payload.tags = [tag];
            if (selectedCategoryId != null) {
                payload.category_id = selectedCategoryId;
                payload.subcategory_id = selectedSubcategoryId; // always send alongside category to clear any stale subcategory on the backend
            } else if (selectedSubcategoryId != null) {
                payload.subcategory_id = selectedSubcategoryId;
            }

            if (languages.length) {
                payload.languages = languages;
                if (languages.includes('other')) payload.other_language = otherLanguage.trim();
            }

            await updateClassListing(draftId!, payload);
            onNavigate('CREATE_CLASS_BATCH');
        } catch (e: any) {
            setSaveError(e?.message || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <WizardShell title="New class" entityType="Classes" step={1} totalSteps={5} stepLabel="Identity" onBack={() => onNavigate('SERVICE_LISTINGS')}>
            <div className="pt-card p-5 sm:p-6 flex flex-col gap-5">
                <div>
                    <h2 className="pt-h-sec">Identity &amp; story</h2>
                    <p className="text-[13px] text-tlb-sub mt-0.5">Capture the "what" and "why" of your class.</p>
                </div>

                {saveError && <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{saveError}</div>}
                {metaError && <div className="pt-note bg-tlb-amber-soft text-tlb-gold">{metaError}</div>}

                <WizardField label="Service title" required>
                    <input
                        className="pt-input"
                        placeholder="e.g. Advanced Robotics Workshop"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </WizardField>

                <WizardField label="Short summary">
                    <input
                        className="pt-input"
                        placeholder="One-line description shown in search results"
                        value={shortDesc}
                        onChange={(e) => setShortDesc(e.target.value)}
                    />
                </WizardField>

                <WizardField label="Description">
                    <textarea
                        className="pt-input min-h-[160px]"
                        placeholder="Describe your class — curriculum, what to bring, certifications..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </WizardField>

                <WizardField label="Target age group">
                    <div className="flex items-center gap-3">
                        <input className="pt-input w-24 text-center" type="number" placeholder="Min" min={0} value={minAge} onChange={(e) => setMinAge(e.target.value)} />
                        <span className="text-tlb-muted font-bold text-sm">to</span>
                        <input className="pt-input w-24 text-center" type="number" placeholder="Max" min={0} value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
                        <span className="text-tlb-muted font-bold text-sm">yrs</span>
                    </div>
                </WizardField>

                <WizardField label="Mode">
                    {metaLoading ? (
                        <div className="flex items-center gap-2 text-tlb-muted text-xs font-bold">
                            <Loader2 size={14} className="animate-spin" /> Loading modes…
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {modes.map((m) => (
                                <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => setMode(m.value)}
                                    className={`pt-scope ${mode === m.value ? 'is-active' : ''}`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    )}
                </WizardField>

                <WizardField
                    label="Booking type"
                    required
                    hint="Enquiry classes collect leads you follow up on. Direct booking lets customers pay for a batch online."
                >
                    <BookingTypeCards
                        value={bookingType}
                        onChange={setBookingType}
                        enquiryDescription="Customers send an enquiry and you follow up to confirm."
                        directBookingDescription="Customers book and pay online."
                    />
                </WizardField>

                <WizardField label="Fees (₹)">
                    <input
                        type="number"
                        className="pt-input"
                        placeholder="e.g. 1500"
                        min={0}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </WizardField>

                {needsAddress && (
                    <WizardField label="Location" className="gap-3">
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
                            onChange={(e) => setAddress(e.target.value)}
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

                <WizardField label="Tag">
                    <div className="flex flex-wrap gap-2">
                        {tagOptions.map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTag(prev => prev === t ? '' : t)}
                                className={`pt-scope ${tag === t ? 'is-active' : ''}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
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
