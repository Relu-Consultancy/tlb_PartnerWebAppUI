import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, MapPin, Check, Camera, Play, Image as ImageIcon, Trash2, Loader2, MessageCircle, CalendarCheck } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, toast, Select } from '../../components/ui';
import {
    getVenueMetaCategories,
    getVenueListingDetail,
    createVenueDraft,
    updateVenueListing,
    uploadVenueListingMedia,
    deleteVenueListingMedia,
    getCurrentVenueDraftId,
    setCurrentVenueDraftId,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar?: () => void; }

interface VenueCategory { id: number; name: string; slug: string; subcategories: { id: number; name: string; slug: string }[] }
interface MediaItem { id: number; media_type: 'cover' | 'gallery' | 'video'; url?: string; file_url?: string }

const LOCATION_TYPES = [
    { value: 'indoor',     label: 'Indoor' },
    { value: 'outdoor',    label: 'Outdoor' },
    { value: 'mall',       label: 'Mall' },
    { value: 'standalone', label: 'Standalone' },
    { value: 'mixed',      label: 'Mixed (Indoor + Outdoor)' },
    { value: 'resort',     label: 'Resort / Hotel' },
] as const;

const API_BASE = 'https://tlb-api.reluconsultancy.in';
const COVER_MAX = 5 * 1024 * 1024;
const GALLERY_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 100 * 1024 * 1024;
const GALLERY_LIMIT = 10;

const resolveUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getUrl = (item: MediaItem) => resolveUrl(item.url || item.file_url || '');

export const CreateVenueDetails: React.FC<Props> = ({ onNavigate }) => {
    // Core info
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [bookingType, setBookingType] = useState<'enquiry' | 'direct_booking'>('enquiry');

    // Location
    const [locationType, setLocationType] = useState('');
    const [city, setCity] = useState('');
    const [area, setArea] = useState('');
    const [address, setAddress] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    // Age & capacity
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');
    const [minCapacity, setMinCapacity] = useState('');
    const [maxCapacity, setMaxCapacity] = useState('');

    // Metadata
    const [categories, setCategories] = useState<VenueCategory[]>([]);
    const [metaLoading, setMetaLoading] = useState(true);
    const [metaError, setMetaError] = useState<string | null>(null);

    // Draft
    const [draftId, setDraftId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Media
    const [busyKind, setBusyKind] = useState<'cover' | 'gallery' | 'video' | null>(null);
    const [cover, setCover] = useState<MediaItem | null>(null);
    const [gallery, setGallery] = useState<MediaItem[]>([]);
    const [video, setVideo] = useState<MediaItem | null>(null);

    const coverInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadMeta = async () => {
            try {
                const catRes = await getVenueMetaCategories();
                setCategories(catRes.data || catRes || []);
            } catch (err: any) {
                setMetaError(err?.message || 'Failed to load categories');
            } finally {
                setMetaLoading(false);
            }
        };
        loadMeta();

        const existingId = getCurrentVenueDraftId();
        if (existingId) {
            setDraftId(existingId);
            const prefill = async () => {
                try {
                    const res = await getVenueListingDetail(existingId);
                    const d = res.data || res;
                    setTitle(d.title || '');
                    setDescription(d.description || '');
                    if (d.category?.id) setSelectedCategoryId(d.category.id);
                    if (d.subcategory?.id) setSelectedSubcategoryId(d.subcategory.id);
                    if (d.booking_type === 'enquiry' || d.booking_type === 'direct_booking') setBookingType(d.booking_type);
                    setLocationType(d.location_type || '');
                    setCity(d.city || '');
                    setArea(d.area || '');
                    setAddress(d.address || '');
                    setLatitude(d.latitude != null ? String(d.latitude) : '');
                    setLongitude(d.longitude != null ? String(d.longitude) : '');
                    setMinAge(d.min_age != null ? String(d.min_age) : '');
                    setMaxAge(d.max_age != null ? String(d.max_age) : '');
                    setMinCapacity(d.min_capacity != null ? String(d.min_capacity) : '');
                    setMaxCapacity(d.max_capacity != null ? String(d.max_capacity) : '');
                    const media: MediaItem[] = d.media || [];
                    setCover(media.find(m => m.media_type === 'cover') || null);
                    setGallery(media.filter(m => m.media_type === 'gallery'));
                    setVideo(media.find(m => m.media_type === 'video') || null);
                } catch { /* silently ignore prefill errors */ }
            };
            prefill();
        }
    }, []);

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const visibleCategories = showAllCategories ? categories : categories.slice(0, 6);

    const ensureDraft = async (): Promise<string | null> => {
        if (draftId) return draftId;
        if (!title.trim()) { toast.warning('Please enter a venue name before uploading media.'); return null; }
        try {
            const res = await createVenueDraft({ title: title.trim() });
            const id: string = (res.data || res).id;
            setCurrentVenueDraftId(id);
            setDraftId(id);
            return id;
        } catch (err: any) {
            toast.error(err?.message || 'Failed to create draft.');
            return null;
        }
    };

    const handleCoverPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        if (file.size > COVER_MAX) { toast.warning('Cover must be under 5 MB.'); e.target.value = ''; return; }
        const id = await ensureDraft();
        if (!id) { e.target.value = ''; return; }
        setBusyKind('cover');
        try {
            if (cover) await deleteVenueListingMedia(id, cover.id);
            const res = await uploadVenueListingMedia(id, file, 'cover');
            setCover(res.data || res);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to upload cover.');
        } finally {
            setBusyKind(null);
            e.target.value = '';
        }
    };

    const handleGalleryPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const id = await ensureDraft();
        if (!id) { e.target.value = ''; return; }
        setBusyKind('gallery');
        try {
            for (const file of Array.from(e.target.files) as File[]) {
                if (gallery.length >= GALLERY_LIMIT) { toast.warning(`Gallery limit (${GALLERY_LIMIT}) reached.`); break; }
                if (file.size > GALLERY_MAX) { toast.warning(`${file.name} is over 5 MB — skipped.`); continue; }
                const res = await uploadVenueListingMedia(id, file, 'gallery');
                setGallery(prev => [...prev, res.data || res]);
            }
        } catch (err: any) {
            toast.error(err?.message || 'Failed to upload image.');
        } finally {
            setBusyKind(null);
            e.target.value = '';
        }
    };

    const handleVideoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        if (file.size > VIDEO_MAX) { toast.warning('Video must be under 100 MB.'); e.target.value = ''; return; }
        const id = await ensureDraft();
        if (!id) { e.target.value = ''; return; }
        setBusyKind('video');
        try {
            if (video) await deleteVenueListingMedia(id, video.id);
            const res = await uploadVenueListingMedia(id, file, 'video');
            setVideo(res.data || res);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to upload video.');
        } finally {
            setBusyKind(null);
            e.target.value = '';
        }
    };

    const handleDeleteCover = async () => {
        if (!draftId || !cover) return;
        try { await deleteVenueListingMedia(draftId, cover.id); setCover(null); }
        catch (err: any) { toast.error(err?.message || 'Failed to delete cover.'); }
    };

    const handleDeleteGallery = async (id: number) => {
        if (!draftId) return;
        try { await deleteVenueListingMedia(draftId, id); setGallery(prev => prev.filter(m => m.id !== id)); }
        catch (err: any) { toast.error(err?.message || 'Failed to delete image.'); }
    };

    const handleDeleteVideo = async () => {
        if (!draftId || !video) return;
        try { await deleteVenueListingMedia(draftId, video.id); setVideo(null); }
        catch (err: any) { toast.error(err?.message || 'Failed to delete video.'); }
    };

    const handleNext = async () => {
        if (!title.trim()) { toast.warning('Please enter a venue name.'); return; }
        setSaving(true);
        try {
            let id = draftId;
            if (!id) {
                const res = await createVenueDraft({ title: title.trim() });
                id = (res.data || res).id;
                setCurrentVenueDraftId(id!);
                setDraftId(id);
            }

            const payload: Record<string, any> = {
                title: title.trim(),
                description: description.trim(),
                booking_type: bookingType,
            };
            if (selectedCategoryId != null) payload.category_id = selectedCategoryId;
            if (selectedSubcategoryId != null) payload.subcategory_id = selectedSubcategoryId;
            if (locationType) payload.location_type = locationType;
            if (city.trim()) payload.city = city.trim();
            if (area.trim()) payload.area = area.trim();
            if (address.trim()) payload.address = address.trim();
            if (latitude.trim()) payload.latitude = latitude.trim();
            if (longitude.trim()) payload.longitude = longitude.trim();
            if (minAge !== '') payload.min_age = parseInt(minAge, 10);
            if (maxAge !== '') payload.max_age = parseInt(maxAge, 10);
            if (minCapacity !== '') payload.min_capacity = parseInt(minCapacity, 10);
            if (maxCapacity !== '') payload.max_capacity = parseInt(maxCapacity, 10);

            await updateVenueListing(id!, payload);
            onNavigate('CREATE_VENUE_OCCASIONS');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to save venue details.');
        } finally {
            setSaving(false);
        }
    };

    if (metaLoading) {
        return (
            <WizardLayout title="New Venue Listing" stepText="Step 1 of 6" subtitle="Details" progressPercentage={17} themeColor="amber" onBack={() => onNavigate('SERVICE_LISTINGS')}>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                </div>
            </WizardLayout>
        );
    }

    if (metaError) {
        return (
            <WizardLayout title="New Venue Listing" stepText="Step 1 of 6" subtitle="Details" progressPercentage={17} themeColor="amber" onBack={() => onNavigate('SERVICE_LISTINGS')}>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-600">{metaError}</div>
            </WizardLayout>
        );
    }

    return (
        <WizardLayout title="New Venue Listing" stepText="Step 1 of 6" subtitle="Details" progressPercentage={17} themeColor="amber" onBack={() => onNavigate('SERVICE_LISTINGS')}>
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Venue Details</h2>
                <p className="text-sm text-gray-400">Tell us about your space.</p>
            </div>

            {/* Title */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Venue Name</label>
                <input className="tlb-input w-full" placeholder="e.g. The Wonder Zone" maxLength={200} value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            {/* Description */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Description</label>
                <textarea
                    className="tlb-input w-full min-h-[120px] resize-y"
                    placeholder="Describe the ambiance, facilities, and what makes it special..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
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
                            desc: 'Customers book and pay for a package online.',
                        },
                    ] as const).map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setBookingType(opt.value)}
                            className={`relative flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all ${
                                bookingType === opt.value
                                    ? 'border-amber-400 bg-amber-50'
                                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                            }`}
                        >
                            {bookingType === opt.value && (
                                <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
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
                <p className="text-[11px] text-gray-400 mt-2">
                    Direct-booking venues require at least one package before submission.
                </p>
            </div>

            {/* Category */}
            {categories.length > 0 && (
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Category</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {visibleCategories.map(cat => (
                            <button key={cat.id} onClick={() => { setSelectedCategoryId(cat.id); setSelectedSubcategoryId(null); }}
                                className={`relative p-4 rounded-2xl border-2 flex flex-col items-center text-center gap-2 transition-all ${
                                    selectedCategoryId === cat.id
                                        ? 'border-amber-400 bg-amber-50'
                                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                                }`}>
                                {selectedCategoryId === cat.id && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                                        <Check size={12} className="text-white" />
                                    </div>
                                )}
                                <span className="text-xs font-bold text-gray-700 leading-tight">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                    {!showAllCategories && categories.length > 6 && (
                        <button onClick={() => setShowAllCategories(true)} className="w-full mt-3 text-xs font-bold text-amber-500 hover:text-amber-700">
                            Show all {categories.length} categories ↓
                        </button>
                    )}
                </div>
            )}

            {/* Subcategory */}
            {selectedCategory && selectedCategory.subcategories.length > 0 && (
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Sub-Category</label>
                    <Select
                        value={selectedSubcategoryId != null ? String(selectedSubcategoryId) : ''}
                        onChange={(v) => setSelectedSubcategoryId(v ? Number(v) : null)}
                        options={selectedCategory.subcategories.map(s => ({ value: String(s.id), label: s.name }))}
                        placeholder="Select sub-category..."
                        ariaLabel="Sub-category"
                    />
                </div>
            )}

            {/* Location Type */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Location Type <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                <div className="flex flex-wrap gap-2">
                    {LOCATION_TYPES.map(lt => (
                        <button
                            key={lt.value}
                            onClick={() => setLocationType(locationType === lt.value ? '' : lt.value)}
                            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${locationType === lt.value
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-white border border-gray-200 text-gray-500 hover:border-amber-300'
                            }`}
                        >
                            {lt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Location Fields */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin size={12} /> Location
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <input
                            className="tlb-input w-full"
                            placeholder="City *"
                            maxLength={100}
                            value={city}
                            onChange={e => setCity(e.target.value)}
                        />
                    </div>
                    <div>
                        <input
                            className="tlb-input w-full"
                            placeholder="Area / Neighbourhood"
                            maxLength={100}
                            value={area}
                            onChange={e => setArea(e.target.value)}
                        />
                    </div>
                </div>
                <textarea
                    className="tlb-input w-full min-h-[80px] resize-y"
                    placeholder="Full address (street, building, pincode) *"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                    <input
                        className="tlb-input w-full"
                        placeholder="Latitude (optional)"
                        value={latitude}
                        onChange={e => setLatitude(e.target.value)}
                    />
                    <input
                        className="tlb-input w-full"
                        placeholder="Longitude (optional)"
                        value={longitude}
                        onChange={e => setLongitude(e.target.value)}
                    />
                </div>
                <p className="text-[10px] text-gray-400">Coordinates enable geo-distance search for customers.</p>
            </div>

            {/* Age Range */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Age Range <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min={0}
                        placeholder="Min age"
                        className="tlb-input w-full"
                        value={minAge}
                        onChange={e => setMinAge(e.target.value)}
                    />
                    <span className="text-gray-400 font-bold text-sm shrink-0">to</span>
                    <input
                        type="number"
                        min={0}
                        placeholder="Max age"
                        className="tlb-input w-full"
                        value={maxAge}
                        onChange={e => setMaxAge(e.target.value)}
                    />
                    <span className="text-gray-400 font-bold text-sm shrink-0">yrs</span>
                </div>
            </div>

            {/* Capacity */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Guest Capacity <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min={1}
                        placeholder="Min guests"
                        className="tlb-input w-full"
                        value={minCapacity}
                        onChange={e => setMinCapacity(e.target.value)}
                    />
                    <span className="text-gray-400 font-bold text-sm shrink-0">–</span>
                    <input
                        type="number"
                        min={1}
                        placeholder="Max guests"
                        className="tlb-input w-full"
                        value={maxCapacity}
                        onChange={e => setMaxCapacity(e.target.value)}
                    />
                </div>
            </div>

            {/* Cover Image */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                    Cover Image <span className="text-red-400">*</span>
                </label>
                <input ref={coverInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleCoverPick} />
                {cover ? (
                    <div className="relative w-full sm:w-80 aspect-[16/9] rounded-2xl overflow-hidden border border-gray-200">
                        <img src={getUrl(cover)} alt="Cover" className="w-full h-full object-cover" />
                        <button onClick={handleDeleteCover} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-lg shadow text-red-500 hover:bg-white" aria-label="Remove cover">
                            <Trash2 size={14} />
                        </button>
                        <button onClick={() => coverInputRef.current?.click()} disabled={busyKind === 'cover'} className="absolute bottom-2 right-2 bg-white/90 px-3 py-1.5 rounded-lg shadow text-xs font-bold text-amber-600 hover:bg-white disabled:opacity-50">
                            {busyKind === 'cover' ? 'Uploading…' : 'Change'}
                        </button>
                    </div>
                ) : (
                    <button onClick={() => coverInputRef.current?.click()} disabled={busyKind === 'cover'} className="w-full sm:w-80 aspect-[16/9] bg-amber-50 rounded-2xl border-2 border-dashed border-amber-200 flex flex-col items-center justify-center text-amber-500 hover:bg-amber-100 transition-colors disabled:opacity-60">
                        {busyKind === 'cover' ? <Loader2 size={28} className="animate-spin" /> : <Camera size={28} />}
                        <span className="text-xs font-bold mt-2">{busyKind === 'cover' ? 'Uploading…' : 'Upload Cover'}</span>
                        <span className="text-[10px] text-amber-400 mt-1">JPG/PNG · Max 5MB</span>
                    </button>
                )}
            </div>

            {/* Gallery */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                    Gallery Photos <span className="text-gray-300 font-normal normal-case ml-1">({gallery.length}/{GALLERY_LIMIT})</span>
                </label>
                <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={handleGalleryPick} />
                <div className="flex flex-wrap gap-3">
                    {gallery.map(g => (
                        <div key={g.id} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 group">
                            <img src={getUrl(g)} alt="Gallery" className="w-full h-full object-cover" />
                            <button onClick={() => handleDeleteGallery(g.id)} className="absolute top-1 right-1 bg-white/90 p-1 rounded-md text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove image">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    {gallery.length < GALLERY_LIMIT && (
                        <button onClick={() => galleryInputRef.current?.click()} disabled={busyKind === 'gallery'} className="w-24 h-24 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-200 flex flex-col items-center justify-center text-amber-500 hover:bg-amber-100 disabled:opacity-60">
                            {busyKind === 'gallery' ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                            <span className="text-[10px] font-bold mt-1">{busyKind === 'gallery' ? 'Uploading…' : 'Add'}</span>
                        </button>
                    )}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">JPG/PNG · Max 5MB each · Up to {GALLERY_LIMIT}</p>
            </div>

            {/* Video */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                    Promo Video <span className="text-gray-300 font-normal normal-case ml-1">(optional)</span>
                </label>
                <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={handleVideoPick} />
                {video ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
                        <div className="bg-amber-100 p-3 rounded-xl text-amber-500"><Play size={20} /></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">Video uploaded</p>
                            <a href={getUrl(video)} target="_blank" rel="noreferrer" className="text-[10px] text-amber-500 truncate block hover:underline">{video.url || video.file_url}</a>
                        </div>
                        <button onClick={handleDeleteVideo} className="text-red-500 p-2"><Trash2 size={16} /></button>
                    </div>
                ) : (
                    <button onClick={() => videoInputRef.current?.click()} disabled={busyKind === 'video'} className="w-full bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-4 flex items-center gap-4 hover:bg-gray-100 disabled:opacity-60">
                        <div className="bg-gray-200 p-3 rounded-xl text-gray-500">
                            {busyKind === 'video' ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-bold">{busyKind === 'video' ? 'Uploading…' : 'Upload Video'}</p>
                            <p className="text-[10px] text-gray-400">MP4 / MOV · Max 100MB</p>
                        </div>
                    </button>
                )}
            </div>

            <WizardNavigation
                onNext={handleNext}
                nextText={saving ? 'Saving…' : 'Next: Occasions & Discovery'}
                nextIcon={saving ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                themeColor="amber"
            />
        </WizardLayout>
    );
};
