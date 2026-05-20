import React, { useState, useEffect } from 'react';
import { ArrowRight, MapPin, Tag, Check, ChevronDown, Loader2, MessageCircle, CalendarCheck } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';
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
    const [area, setArea] = useState('');
    const [address, setAddress] = useState('');
    const [meetingLink, setMeetingLink] = useState('');

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
                setArea(d.area || '');
                setAddress(d.address || '');
                setMeetingLink(d.meeting_link || '');
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
                if (area.trim()) payload.area = area.trim();
                if (address.trim()) payload.address = address.trim();
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
        <WizardLayout
            title="New Program"
            stepText="Stage 1 of 5"
            subtitle="Identity"
            progressPercentage={20}
            themeColor="emerald"
            onBack={() => onNavigate('SERVICE_LISTINGS')}
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Identity & Story</h2>
                <p className="text-sm text-gray-400">Capture the "What" and "Why" of your program.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs font-bold text-red-600">
                    {error}
                </div>
            )}
            {metaError && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs font-bold text-amber-700">
                    {metaError}
                </div>
            )}

            {/* Title */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    Program Title <span className="text-red-400">*</span>
                </label>
                <input
                    className="tlb-input w-full"
                    placeholder="e.g. Advanced Robotics Program"
                    maxLength={200}
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
                    maxLength={500}
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                />
            </div>

            {/* Master Description */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">The Master Description</label>
                <textarea
                    className="tlb-input w-full min-h-[160px] resize-y"
                    placeholder="Describe your program — curriculum, outcomes, certifications..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-xs text-gray-300 mt-1">Tell the full story of your program.</p>
            </div>

            {/* Program Format (from API /metadata/formats/) */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Program Format</label>
                {metaLoading ? (
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold">
                        <Loader2 size={14} className="animate-spin" /> Loading formats…
                    </div>
                ) : (
                    <div className="relative group">
                        <select
                            value={programFormat}
                            onChange={(e) => setProgramFormat(e.target.value)}
                            className="tlb-input w-full bg-white appearance-none cursor-pointer pr-10"
                        >
                            <option value="">Select format...</option>
                            {formats.map((f) => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                            <ChevronDown size={18} />
                        </div>
                    </div>
                )}
            </div>

            {/* Delivery Mode (from API /metadata/formats/) */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Delivery Mode</label>
                {metaLoading ? (
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold">
                        <Loader2 size={14} className="animate-spin" /> Loading modes…
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-3">
                        {deliveryModes.map((m) => (
                            <button
                                key={m.value}
                                onClick={() => setDeliveryMode(m.value)}
                                className={`p-4 rounded-2xl border-2 text-center transition-all ${deliveryMode === m.value
                                    ? 'border-emerald-400 bg-emerald-50'
                                    : 'border-gray-100 bg-white hover:border-gray-200'
                                }`}
                            >
                                <span className="text-lg">{m.value === 'offline' ? '📍' : m.value === 'online' ? '💻' : '🔄'}</span>
                                <p className={`text-xs font-bold mt-1.5 ${deliveryMode === m.value ? 'text-emerald-600' : 'text-gray-500'}`}>{m.label}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Booking Type */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                    Listing Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {([
                        {
                            value: 'enquiry',
                            label: 'Enquiry',
                            icon: <MessageCircle size={22} />,
                            desc: 'Parents express interest and you follow up to confirm.',
                        },
                        {
                            value: 'direct_booking',
                            label: 'Direct Booking',
                            icon: <CalendarCheck size={22} />,
                            desc: 'Parents directly book and pay for a seat online.',
                        },
                    ] as const).map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setBookingType(opt.value)}
                            className={`relative flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all ${
                                bookingType === opt.value
                                    ? 'border-emerald-400 bg-emerald-50'
                                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                            }`}
                        >
                            {bookingType === opt.value && (
                                <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <Check size={11} className="text-white" />
                                </div>
                            )}
                            <span className={bookingType === opt.value ? 'text-emerald-600' : 'text-gray-400'}>
                                {opt.icon}
                            </span>
                            <span className="text-sm font-black text-gray-800 pr-6">{opt.label}</span>
                            <span className="text-[11px] text-gray-400 leading-snug">{opt.desc}</span>
                        </button>
                    ))}
                </div>
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

            {/* Capacity, Hours, Modules */}
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Max Capacity</label>
                    <input className="tlb-input w-full" type="number" placeholder="e.g. 30" min={1} value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Total Hours</label>
                    <input className="tlb-input w-full" type="number" placeholder="e.g. 40" min={1} value={totalHours} onChange={(e) => setTotalHours(e.target.value)} />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Modules</label>
                    <input className="tlb-input w-full" type="number" placeholder="e.g. 8" min={1} value={moduleCount} onChange={(e) => setModuleCount(e.target.value)} />
                </div>
            </div>

            {/* Location (offline / hybrid only) */}
            {needsAddress && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
                        <MapPin size={12} className="inline mr-1" /> Program Location
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <input className="tlb-input w-full" placeholder="City" maxLength={100} value={city} onChange={(e) => setCity(e.target.value)} />
                        <input className="tlb-input w-full" placeholder="Area / Neighborhood" maxLength={100} value={area} onChange={(e) => setArea(e.target.value)} />
                    </div>
                    <textarea className="tlb-input w-full min-h-[80px] resize-y" placeholder="Full address (street, building, pincode)" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
            )}

            {/* Meeting Link (online / hybrid only) */}
            {(deliveryMode === 'online' || deliveryMode === 'hybrid') && (
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Meeting Link</label>
                    <input className="tlb-input w-full" placeholder="https://meet.google.com/..." value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} />
                </div>
            )}

            {/* Category (from API /metadata/categories/) */}
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
                                        ? 'border-emerald-400 bg-emerald-50'
                                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                                    }`}
                                >
                                    {selectedCategoryId === c.id && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <Check size={12} className="text-white" />
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
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'bg-white border border-gray-200 text-gray-500 hover:border-emerald-300'
                                }`}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Tags (from API /metadata/tags/) */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    <Tag size={12} className="inline mr-1" /> Tags
                </label>
                {metaLoading ? (
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold">
                        <Loader2 size={14} className="animate-spin" /> Loading tags…
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {apiTags.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => toggleTag(t.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    selectedTagId === t.id
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-white border border-gray-200 text-gray-500 hover:border-emerald-300'
                                }`}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <WizardNavigation
                onNext={handleNext}
                nextText={saving ? 'Saving...' : 'Next: Batch & Schedule'}
                nextIcon={saving ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                themeColor="emerald"
            />
        </WizardLayout>
    );
};
