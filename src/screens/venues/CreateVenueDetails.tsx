import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, MapPin, Camera, Play, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { toast, Select, LocationPicker, LanguagePicker, validateLanguages } from '../../components/ui';
import { PickedLocation } from '../../components/ui/LocationPicker';
import { WizardShell, WizardNav, WizardField, OptionTileGrid, BookingTypeCards } from '../../components/portal/wizard';
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
const COVER_IMG_MAX = 5 * 1024 * 1024;
const COVER_VID_MAX = 15 * 1024 * 1024;
const GALLERY_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 100 * 1024 * 1024;
const GALLERY_LIMIT = 10;

const resolveUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getUrl = (item: MediaItem) => resolveUrl(item.url || item.file_url || '');
const isVideoFile = (name: string) => /\.(mp4|mov)$/i.test(name);
const isVideoUrl = (url: string) => /\.(mp4|mov)$/i.test(url);

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
    const [address, setAddress] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    // Languages this listing is conducted in — [] means "not specified yet".
    const [languages, setLanguages] = useState<string[]>([]);
    const [otherLanguage, setOtherLanguage] = useState('');
    const [langError, setLangError] = useState('');

    // Google Maps location picker — venues save plain city/address/lat/lng
    // (already-working fields above); no place_id shortcut for this entity yet.
    const handleLocationPicked = (loc: PickedLocation) => {
        setAddress(loc.address);
        setCity(loc.city);
        // Backend rejects more than 6 decimal places; Google's resolved
        // coordinates can come back with more than that.
        setLatitude(loc.latitude.toFixed(6));
        setLongitude(loc.longitude.toFixed(6));
    };

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
                    setAddress(d.address || '');
                    setLanguages(Array.isArray(d.languages) ? d.languages : []);
                    setOtherLanguage(d.other_language || '');
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
        const isVid = isVideoFile(file.name);
        const maxSize = isVid ? COVER_VID_MAX : COVER_IMG_MAX;
        if (file.size > maxSize) { toast.warning(isVid ? 'Banner video must be under 15 MB.' : 'Cover image must be under 5 MB.'); e.target.value = ''; return; }
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
        const langErr = validateLanguages(languages, otherLanguage);
        if (langErr) { setLangError(langErr); toast.warning(langErr); return; }
        setLangError('');
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
            if (address.trim()) payload.address = address.trim();
            // Clamp to 6 decimal places — the backend rejects anything more
            // precise, which a hand-typed or pasted coordinate can exceed.
            if (latitude.trim()) {
                const n = Number(latitude.trim());
                payload.latitude = Number.isFinite(n) ? n.toFixed(6) : latitude.trim();
            }
            if (longitude.trim()) {
                const n = Number(longitude.trim());
                payload.longitude = Number.isFinite(n) ? n.toFixed(6) : longitude.trim();
            }
            if (minAge !== '') payload.min_age = parseInt(minAge, 10);
            if (maxAge !== '') payload.max_age = parseInt(maxAge, 10);
            if (minCapacity !== '') payload.min_capacity = parseInt(minCapacity, 10);
            if (maxCapacity !== '') payload.max_capacity = parseInt(maxCapacity, 10);

            if (languages.length) {
                payload.languages = languages;
                if (languages.includes('other')) payload.other_language = otherLanguage.trim();
            }

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
            <WizardShell title="New venue" entityType="Venues" step={1} totalSteps={7} stepLabel="Details" onBack={() => onNavigate('SERVICE_LISTINGS')}>
                <div className="pt-card p-5 sm:p-6 flex items-center justify-center gap-2 text-tlb-muted text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                </div>
            </WizardShell>
        );
    }

    if (metaError) {
        return (
            <WizardShell title="New venue" entityType="Venues" step={1} totalSteps={7} stepLabel="Details" onBack={() => onNavigate('SERVICE_LISTINGS')}>
                <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{metaError}</div>
            </WizardShell>
        );
    }

    return (
        <WizardShell title="New venue" entityType="Venues" step={1} totalSteps={7} stepLabel="Details" onBack={() => onNavigate('SERVICE_LISTINGS')}>
            <div className="pt-card p-5 sm:p-6 flex flex-col gap-5">
                <div>
                    <h2 className="pt-h-sec">Venue details</h2>
                    <p className="text-[13px] text-tlb-sub mt-0.5">Tell us about your space.</p>
                </div>

                <WizardField label="Venue name">
                    <input className="pt-input" placeholder="e.g. The Wonder Zone" maxLength={200} value={title} onChange={e => setTitle(e.target.value)} />
                </WizardField>

                <WizardField label="Description">
                    <textarea
                        className="pt-input min-h-[120px]"
                        placeholder="Describe the ambiance, facilities, and what makes it special..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </WizardField>

                <WizardField label="Booking type" required hint="Direct-booking venues require at least one package before submission.">
                    <BookingTypeCards
                        value={bookingType}
                        onChange={setBookingType}
                        enquiryDescription="Customers send an enquiry and you follow up to confirm."
                        directBookingDescription="Customers book and pay for a package online."
                    />
                </WizardField>

                {categories.length > 0 && (
                    <WizardField label="Category">
                        <OptionTileGrid
                            options={visibleCategories.map(c => ({ id: String(c.id), label: c.name }))}
                            isSelected={(id) => selectedCategoryId === Number(id)}
                            onToggle={(id) => { setSelectedCategoryId(Number(id)); setSelectedSubcategoryId(null); }}
                        />
                        {!showAllCategories && categories.length > 6 && (
                            <button type="button" onClick={() => setShowAllCategories(true)} className="pt-link mt-1">
                                Show all {categories.length} categories ↓
                            </button>
                        )}
                    </WizardField>
                )}

                {selectedCategory && selectedCategory.subcategories.length > 0 && (
                    <WizardField label="Sub-category">
                        <Select
                            value={selectedSubcategoryId != null ? String(selectedSubcategoryId) : ''}
                            onChange={(v) => setSelectedSubcategoryId(v ? Number(v) : null)}
                            options={selectedCategory.subcategories.map(s => ({ value: String(s.id), label: s.name }))}
                            placeholder="Select sub-category..."
                            ariaLabel="Sub-category"
                            buttonClassName="pt-input w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                        />
                    </WizardField>
                )}

                <LanguagePicker
                    languages={languages}
                    otherLanguage={otherLanguage}
                    onChange={(l, o) => { setLanguages(l); setOtherLanguage(o); setLangError(''); }}
                    error={langError}
                />

                <WizardField label="Location type">
                    <div className="flex flex-wrap gap-2">
                        {LOCATION_TYPES.map(lt => (
                            <button
                                key={lt.value}
                                type="button"
                                onClick={() => setLocationType(locationType === lt.value ? '' : lt.value)}
                                className={`pt-scope ${locationType === lt.value ? 'is-active' : ''}`}
                            >
                                {lt.label}
                            </button>
                        ))}
                    </div>
                </WizardField>

                <WizardField label="Venue location" className="gap-3">
                    <span className="sr-only"><MapPin size={12} /></span>
                    <LocationPicker
                        initialLatitude={latitude ? Number(latitude) : null}
                        initialLongitude={longitude ? Number(longitude) : null}
                        initialAddress={address}
                        onSelect={handleLocationPicked}
                    />
                    <textarea
                        className="pt-input min-h-[70px]"
                        placeholder="Street, building, landmark *"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                    />
                </WizardField>

                <WizardField label="Age range">
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min={0}
                            placeholder="Min age"
                            className="pt-input w-full"
                            value={minAge}
                            onChange={e => setMinAge(e.target.value)}
                        />
                        <span className="text-tlb-muted font-bold text-sm shrink-0">to</span>
                        <input
                            type="number"
                            min={0}
                            placeholder="Max age"
                            className="pt-input w-full"
                            value={maxAge}
                            onChange={e => setMaxAge(e.target.value)}
                        />
                        <span className="text-tlb-muted font-bold text-sm shrink-0">yrs</span>
                    </div>
                </WizardField>

                <WizardField label="Guest capacity">
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min={1}
                            placeholder="Min guests"
                            className="pt-input w-full"
                            value={minCapacity}
                            onChange={e => setMinCapacity(e.target.value)}
                        />
                        <span className="text-tlb-muted font-bold text-sm shrink-0">–</span>
                        <input
                            type="number"
                            min={1}
                            placeholder="Max guests"
                            className="pt-input w-full"
                            value={maxCapacity}
                            onChange={e => setMaxCapacity(e.target.value)}
                        />
                    </div>
                </WizardField>

                <WizardField label="Cover banner" required>
                    <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,video/mp4,video/quicktime" className="hidden" onChange={handleCoverPick} />
                    {cover ? (
                        <div className="relative w-full sm:w-80 aspect-[16/9] rounded-2xl overflow-hidden border border-tlb-line">
                            {isVideoUrl(getUrl(cover)) ? (
                                <video src={getUrl(cover)} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                            ) : (
                                <img src={getUrl(cover)} alt="Cover" className="w-full h-full object-cover" />
                            )}
                            <button onClick={handleDeleteCover} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-lg shadow text-tlb-red hover:bg-white" aria-label="Remove cover">
                                <Trash2 size={14} />
                            </button>
                            <button
                                onClick={() => coverInputRef.current?.click()}
                                disabled={busyKind === 'cover'}
                                className="absolute bottom-2 right-2 bg-white/90 px-3 py-1.5 rounded-lg shadow text-xs font-bold text-tlb-link hover:bg-white disabled:opacity-50"
                            >
                                {busyKind === 'cover' ? 'Uploading…' : 'Change'}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => coverInputRef.current?.click()}
                            disabled={busyKind === 'cover'}
                            className="w-full sm:w-80 aspect-[16/9] bg-tlb-amber-soft rounded-2xl border-2 border-dashed border-tlb-amber-line flex flex-col items-center justify-center text-tlb-gold hover:bg-tlb-cream transition-colors disabled:opacity-60"
                        >
                            {busyKind === 'cover' ? <Loader2 size={28} className="animate-spin" /> : <Camera size={28} />}
                            <span className="text-xs font-bold mt-2">{busyKind === 'cover' ? 'Uploading…' : 'Upload cover'}</span>
                            <span className="text-[10px] mt-1 opacity-80">JPG/PNG or MP4/MOV · Image 5MB / Video 15MB</span>
                        </button>
                    )}
                </WizardField>

                <WizardField label={`Gallery photos (${gallery.length}/${GALLERY_LIMIT})`} hint={`JPG/PNG · Max 5MB each · Up to ${GALLERY_LIMIT}`}>
                    <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={handleGalleryPick} />
                    <div className="flex flex-wrap gap-3">
                        {gallery.map(g => (
                            <div key={g.id} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-tlb-line group">
                                <img src={getUrl(g)} alt="Gallery" className="w-full h-full object-cover" />
                                <button onClick={() => handleDeleteGallery(g.id)} className="absolute top-1 right-1 bg-white/90 p-1 rounded-md text-tlb-red opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove image">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                        {gallery.length < GALLERY_LIMIT && (
                            <button onClick={() => galleryInputRef.current?.click()} disabled={busyKind === 'gallery'} className="w-24 h-24 bg-tlb-amber-soft rounded-2xl border-2 border-dashed border-tlb-amber-line flex flex-col items-center justify-center text-tlb-gold hover:bg-tlb-cream disabled:opacity-60">
                                {busyKind === 'gallery' ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                                <span className="text-[10px] font-bold mt-1">{busyKind === 'gallery' ? 'Uploading…' : 'Add'}</span>
                            </button>
                        )}
                    </div>
                </WizardField>

                <WizardField label="Promo video (optional)">
                    <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={handleVideoPick} />
                    {video ? (
                        <div className="pt-card p-4 flex items-center gap-3">
                            <div className="pt-tile-md bg-tlb-amber-soft text-tlb-gold"><Play size={18} /></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">Video uploaded</p>
                                <a href={getUrl(video)} target="_blank" rel="noreferrer" className="pt-link truncate block">{video.url || video.file_url}</a>
                            </div>
                            <button onClick={handleDeleteVideo} className="text-tlb-red p-2"><Trash2 size={16} /></button>
                        </div>
                    ) : (
                        <button onClick={() => videoInputRef.current?.click()} disabled={busyKind === 'video'} className="w-full bg-tlb-wash rounded-2xl border-2 border-dashed border-tlb-edge p-4 flex items-center gap-4 hover:bg-tlb-hover disabled:opacity-60">
                            <div className="pt-tile-md bg-white text-tlb-muted">
                                {busyKind === 'video' ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-bold text-tlb-ink">{busyKind === 'video' ? 'Uploading…' : 'Upload video'}</p>
                                <p className="text-[10px] text-tlb-muted">MP4 / MOV · Max 100MB</p>
                            </div>
                        </button>
                    )}
                </WizardField>

                <WizardNav
                    onNext={saving ? () => {} : handleNext}
                    nextText={saving ? 'Saving…' : 'Next: Occasions & discovery'}
                    nextIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} strokeWidth={2.75} />}
                />
            </div>
        </WizardShell>
    );
};
