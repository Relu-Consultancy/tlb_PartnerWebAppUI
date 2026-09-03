import React, { useState, useEffect } from 'react';
import { ArrowRight, MapPin, Tag, Check, Loader2, MessageCircle, CalendarCheck } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, LocationPicker, LanguagePicker, validateLanguages } from '../../components/ui';
import { PickedLocation } from '../../components/ui/LocationPicker';
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
        <WizardLayout
            title="New Listing"
            stepText="Stage 1 of 5"
            subtitle="Identity"
            progressPercentage={20}
            themeColor="yellow"
            onBack={() => onNavigate('SERVICE_LISTINGS')}
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Identity & Story</h2>
                <p className="text-sm text-gray-400">Capture the "What" and "Why" of your class.</p>
            </div>

            {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs font-bold text-red-600">
                    {saveError}
                </div>
            )}
            {metaError && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs font-bold text-amber-700">
                    {metaError}
                </div>
            )}

            {/* Service Title */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Service Title <span className="text-red-400">*</span></label>
                <input
                    className="tlb-input w-full"
                    placeholder="e.g. Advanced Robotics Workshop"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            {/* Short Description */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Short Summary</label>
                <input
                    className="tlb-input w-full"
                    placeholder="One-line description shown in search results"
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                />
            </div>

            {/* Master Description */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Description</label>
                <textarea
                    className="tlb-input w-full min-h-[160px] resize-y"
                    placeholder="Describe your class — curriculum, what to bring, certifications..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            {/* Target Age Group */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Target Age Group</label>
                <div className="flex gap-3">
                    <div className="flex-1">
                        <input className="tlb-input w-full" type="number" placeholder="Min (e.g. 8)" min={0} value={minAge} onChange={(e) => setMinAge(e.target.value)} />
                    </div>
                    <span className="self-center text-gray-300 font-bold">to</span>
                    <div className="flex-1">
                        <input className="tlb-input w-full" type="number" placeholder="Max (e.g. 14)" min={0} value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
                    </div>
                    <span className="self-center text-sm text-gray-400 font-bold">Years</span>
                </div>
            </div>

            {/* Mode (from API /metadata/formats/) */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Mode</label>
                {metaLoading ? (
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold">
                        <Loader2 size={14} className="animate-spin" /> Loading modes…
                    </div>
                ) : (
                    <div className="flex gap-2">
                        {modes.map((m) => (
                            <button
                                key={m.value}
                                onClick={() => setMode(m.value)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${mode === m.value
                                    ? 'bg-tlb-yellow text-tlb-dark shadow-sm'
                                    : 'bg-white border border-gray-200 text-gray-500 hover:border-tlb-yellow/50'
                                }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Booking Type */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                    Booking Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {([
                        {
                            value: 'enquiry',
                            label: 'Enquiry',
                            icon: <MessageCircle size={22} />,
                            desc: 'Customers send an enquiry and you follow up to confirm.',
                        },
                        {
                            value: 'direct_booking',
                            label: 'Direct Booking',
                            icon: <CalendarCheck size={22} />,
                            desc: 'Customers book and pay online.',
                        },
                    ] as const).map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setBookingType(opt.value)}
                            className={`relative flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all ${
                                bookingType === opt.value
                                    ? 'border-tlb-yellow bg-tlb-yellow/10'
                                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                            }`}
                        >
                            {bookingType === opt.value && (
                                <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-tlb-yellow rounded-full flex items-center justify-center">
                                    <Check size={11} className="text-white" />
                                </div>
                            )}
                            <span className={bookingType === opt.value ? 'text-amber-600' : 'text-gray-400'}>
                                {opt.icon}
                            </span>
                            <span className="text-sm font-black text-gray-800 pr-6">{opt.label}</span>
                            <span className="text-[11px] text-gray-400 leading-snug">{opt.desc}</span>
                        </button>
                    ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-2">Enquiry classes collect leads you follow up on. Direct booking lets customers pay for a batch online.</p>
            </div>

            {/* Fees */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Fees (₹)</label>
                <input
                    type="number"
                    className="tlb-input w-full"
                    placeholder="e.g. 1500"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                />
            </div>

            {/* Location (offline / hybrid only) */}
            {needsAddress && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
                        <MapPin size={12} className="inline mr-1" /> Location
                    </label>

                    <LocationPicker
                        initialLatitude={latitude}
                        initialLongitude={longitude}
                        initialAddress={address}
                        onSelect={handleLocationPicked}
                    />

                    <textarea
                        className="tlb-input w-full min-h-[70px] resize-y"
                        placeholder="Street, building, landmark"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </div>
            )}

            <LanguagePicker
                languages={languages}
                otherLanguage={otherLanguage}
                onChange={(l, o) => { setLanguages(l); setOtherLanguage(o); setLangError(''); }}
                accent="yellow"
                error={langError}
            />

            {/* Meeting Link (online / hybrid only) */}
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

            {/* Category */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Category</label>
                {metaLoading ? (
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold">
                        <Loader2 size={14} className="animate-spin" /> Loading categories…
                    </div>
                ) : categories.length === 0 ? (
                    <p className="text-xs text-gray-400">No categories available.</p>
                ) : (
                    <div className="max-h-[280px] overflow-y-auto rounded-2xl">
                        <div className="grid grid-cols-2 gap-2 pr-1">
                            {categories.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => { setSelectedCategoryId(c.id); setSelectedSubcategoryId(null); }}
                                    className={`relative p-3.5 rounded-2xl border-2 text-left transition-all ${selectedCategoryId === c.id
                                        ? 'border-tlb-yellow bg-tlb-yellow/10'
                                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                                    }`}
                                >
                                    {selectedCategoryId === c.id && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-tlb-yellow rounded-full flex items-center justify-center">
                                            <Check size={12} className="text-tlb-dark" />
                                        </div>
                                    )}
                                    <span className="text-xs font-bold text-gray-700 leading-tight pr-6">{c.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sub-Category */}
            {selectedCategory && selectedCategory.subcategories.length > 0 && (
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Sub-Category</label>
                    <div className="flex flex-wrap gap-2">
                        {selectedCategory.subcategories.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedSubcategoryId(selectedSubcategoryId === s.id ? null : s.id)}
                                className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${selectedSubcategoryId === s.id
                                    ? 'bg-tlb-yellow text-tlb-dark shadow-sm'
                                    : 'bg-white border border-gray-200 text-gray-500 hover:border-tlb-yellow/50'
                                }`}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Tags */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    <Tag size={12} className="inline mr-1" /> Tag
                </label>
                <div className="flex flex-wrap gap-2">
                    {tagOptions.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTag(prev => prev === t ? '' : t)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${tag === t
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
                onNext={handleNext}
                nextText={saving ? 'Saving...' : 'Next: Batch & Schedule'}
                nextIcon={saving ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                themeColor="yellow"
            />
        </WizardLayout>
    );
};
