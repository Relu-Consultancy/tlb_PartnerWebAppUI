import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, MapPin, Check, ChevronDown, Camera, Play, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';
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

interface VenueCategory { id: number; name: string; slug: string; icon?: string; subcategories: { id: number; name: string; slug: string }[] }
interface MediaItem { id: number; media_type: 'cover' | 'gallery' | 'video'; file_url: string }

const API_BASE = 'https://tlb-api.reluconsultancy.in';
const COVER_MAX = 5 * 1024 * 1024;
const GALLERY_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 100 * 1024 * 1024;
const GALLERY_LIMIT = 10;

// Resolve relative media URLs returned by the API
const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const CreateVenueDetails: React.FC<Props> = ({ onNavigate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
    const [showAllCategories, setShowAllCategories] = useState(false);

    const [categories, setCategories] = useState<VenueCategory[]>([]);
    const [metaLoading, setMetaLoading] = useState(true);
    const [metaError, setMetaError] = useState<string | null>(null);

    const [draftId, setDraftId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

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
                    setLocation(d.location || '');
                    if (d.category?.id) setSelectedCategoryId(d.category.id);
                    if (d.subcategory?.id) setSelectedSubcategoryId(d.subcategory.id);
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

    // Creates a draft if one doesn't exist yet, returns the id or null on failure
    const ensureDraft = async (): Promise<string | null> => {
        if (draftId) return draftId;
        if (!title.trim()) { alert('Please enter a venue name before uploading media.'); return null; }
        try {
            const res = await createVenueDraft({ title: title.trim() });
            const id: string = (res.data || res).id;
            setCurrentVenueDraftId(id);
            setDraftId(id);
            return id;
        } catch (err: any) {
            alert(err?.message || 'Failed to create draft.');
            return null;
        }
    };

    const handleCoverPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        if (file.size > COVER_MAX) { alert('Cover must be under 5 MB.'); e.target.value = ''; return; }
        const id = await ensureDraft();
        if (!id) { e.target.value = ''; return; }
        setBusyKind('cover');
        try {
            if (cover) await deleteVenueListingMedia(id, cover.id);
            const res = await uploadVenueListingMedia(id, file, 'cover');
            setCover(res.data || res);
        } catch (err: any) {
            alert(err?.message || 'Failed to upload cover.');
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
                if (gallery.length >= GALLERY_LIMIT) { alert(`Gallery limit (${GALLERY_LIMIT}) reached.`); break; }
                if (file.size > GALLERY_MAX) { alert(`${file.name} is over 5 MB — skipped.`); continue; }
                const res = await uploadVenueListingMedia(id, file, 'gallery');
                setGallery(prev => [...prev, res.data || res]);
            }
        } catch (err: any) {
            alert(err?.message || 'Failed to upload image.');
        } finally {
            setBusyKind(null);
            e.target.value = '';
        }
    };

    const handleVideoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        if (file.size > VIDEO_MAX) { alert('Video must be under 100 MB.'); e.target.value = ''; return; }
        const id = await ensureDraft();
        if (!id) { e.target.value = ''; return; }
        setBusyKind('video');
        try {
            if (video) await deleteVenueListingMedia(id, video.id);
            const res = await uploadVenueListingMedia(id, file, 'video');
            setVideo(res.data || res);
        } catch (err: any) {
            alert(err?.message || 'Failed to upload video.');
        } finally {
            setBusyKind(null);
            e.target.value = '';
        }
    };

    const handleDeleteCover = async () => {
        if (!draftId || !cover) return;
        try { await deleteVenueListingMedia(draftId, cover.id); setCover(null); }
        catch (err: any) { alert(err?.message || 'Failed to delete cover.'); }
    };

    const handleDeleteGallery = async (id: number) => {
        if (!draftId) return;
        try { await deleteVenueListingMedia(draftId, id); setGallery(prev => prev.filter(m => m.id !== id)); }
        catch (err: any) { alert(err?.message || 'Failed to delete image.'); }
    };

    const handleDeleteVideo = async () => {
        if (!draftId || !video) return;
        try { await deleteVenueListingMedia(draftId, video.id); setVideo(null); }
        catch (err: any) { alert(err?.message || 'Failed to delete video.'); }
    };

    const handleNext = async () => {
        if (!title.trim()) { alert('Please enter a venue name.'); return; }
        setSaving(true);
        try {
            let id = draftId;
            if (!id) {
                const res = await createVenueDraft({ title: title.trim() });
                id = (res.data || res).id;
                setCurrentVenueDraftId(id!);
                setDraftId(id);
            }
            await updateVenueListing(id!, {
                title: title.trim(),
                description: description.trim(),
                location: location.trim(),
                ...(selectedCategoryId != null && { category_id: selectedCategoryId }),
                ...(selectedSubcategoryId != null && { subcategory_id: selectedSubcategoryId }),
            });
            onNavigate('CREATE_VENUE_OCCASIONS');
        } catch (err: any) {
            alert(err?.message || 'Failed to save venue details.');
        } finally {
            setSaving(false);
        }
    };

    if (metaLoading) {
        return (
            <WizardLayout title="New Venue Listing" stepText="Step 1 of 5" subtitle="Details" progressPercentage={20} themeColor="amber" onBack={() => onNavigate('SERVICE_LISTINGS')}>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                </div>
            </WizardLayout>
        );
    }

    if (metaError) {
        return (
            <WizardLayout title="New Venue Listing" stepText="Step 1 of 5" subtitle="Details" progressPercentage={20} themeColor="amber" onBack={() => onNavigate('SERVICE_LISTINGS')}>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-600">{metaError}</div>
            </WizardLayout>
        );
    }

    return (
        <WizardLayout title="New Venue Listing" stepText="Step 1 of 5" subtitle="Details" progressPercentage={20} themeColor="amber" onBack={() => onNavigate('SERVICE_LISTINGS')}>
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Venue Details</h2>
                <p className="text-sm text-gray-400">Tell us about your performance or event space.</p>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Venue Name</label>
                <input className="tlb-input w-full" placeholder="e.g. Royal Kids Party Hall" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    <MapPin size={12} className="inline mr-1" /> Location
                </label>
                <input className="tlb-input w-full" placeholder="e.g. Powai, Mumbai" value={location} onChange={e => setLocation(e.target.value)} />
            </div>

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
                                {cat.icon && <span className="text-2xl">{cat.icon}</span>}
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

            {selectedCategory && selectedCategory.subcategories.length > 0 && (
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Sub-Category</label>
                    <div className="relative group">
                        <select
                            value={selectedSubcategoryId ?? ''}
                            onChange={e => setSelectedSubcategoryId(e.target.value ? Number(e.target.value) : null)}
                            className="tlb-input w-full bg-white appearance-none cursor-pointer pr-10"
                        >
                            <option value="">Select sub-category...</option>
                            {selectedCategory.subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronDown size={18} />
                        </div>
                    </div>
                </div>
            )}

            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Description</label>
                <textarea
                    className="tlb-input w-full min-h-[140px] resize-y"
                    placeholder="Describe the ambiance, facilities, and why it's perfect for events..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
            </div>

            {/* Cover Image — always visible, auto-creates draft on first upload */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                    Cover Image <span className="text-red-400">*</span>
                </label>
                <input ref={coverInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleCoverPick} />
                {cover ? (
                    <div className="relative w-full sm:w-80 aspect-[16/9] rounded-2xl overflow-hidden border border-gray-200">
                        <img src={resolveUrl(cover.file_url)} alt="Cover" className="w-full h-full object-cover" />
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
                            <img src={resolveUrl(g.file_url)} alt="Gallery" className="w-full h-full object-cover" />
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
                            <a href={resolveUrl(video.file_url)} target="_blank" rel="noreferrer" className="text-[10px] text-amber-500 truncate block hover:underline">{video.file_url}</a>
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
                nextText={saving ? 'Saving…' : 'Next: Occasions & Capacity'}
                nextIcon={saving ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                themeColor="amber"
            />
        </WizardLayout>
    );
};
