import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Camera, Play, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, toast } from '../../components/ui';
import {
    getListingMedia,
    uploadListingMedia,
    deleteListingMedia,
    getCurrentDraftId,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface MediaItem {
    id: number;
    media_type: 'cover' | 'gallery' | 'video';
    file_url: string;
    created_at?: string;
}

const API_BASE = 'https://tlb-api.reluconsultancy.in';
const COVER_MAX = 5 * 1024 * 1024;
const GALLERY_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 100 * 1024 * 1024;
const GALLERY_LIMIT = 10;

const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const CreateEventMedia: React.FC<Props> = ({ onNavigate }) => {
    const [draftId, setDraftId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [busyKind, setBusyKind] = useState<'cover' | 'gallery' | 'video' | null>(null);

    const [cover, setCover] = useState<MediaItem | null>(null);
    const [gallery, setGallery] = useState<MediaItem[]>([]);
    const [video, setVideo] = useState<MediaItem | null>(null);

    const coverInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const id = getCurrentDraftId();
        if (!id) {
            setLoadError('No active draft. Start from "Event Details".');
            setLoading(false);
            return;
        }
        setDraftId(id);

        const load = async () => {
            try {
                const res = await getListingMedia(id);
                const items: MediaItem[] = res.data || res || [];
                setCover(items.find(m => m.media_type === 'cover') || null);
                setGallery(items.filter(m => m.media_type === 'gallery'));
                setVideo(items.find(m => m.media_type === 'video') || null);
            } catch (err: any) {
                setLoadError(err?.message || 'Failed to load media.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleCoverPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!draftId || !e.target.files?.[0]) return;
        const file = e.target.files[0];
        if (file.size > COVER_MAX) { toast.warning('Cover must be under 5 MB.'); e.target.value = ''; return; }
        setBusyKind('cover');
        try {
            // If a cover already exists, delete it first (only 1 allowed)
            if (cover) await deleteListingMedia(draftId, cover.id);
            const res = await uploadListingMedia(draftId, file, 'cover');
            const data = res.data || res;
            setCover(data);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to upload cover.');
        } finally {
            setBusyKind(null);
            e.target.value = '';
        }
    };

    const handleGalleryPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!draftId || !e.target.files?.length) return;
        const files: File[] = Array.from(e.target.files);
        setBusyKind('gallery');
        try {
            for (const file of files) {
                if (gallery.length >= GALLERY_LIMIT) {
                    toast.warning(`Gallery limit (${GALLERY_LIMIT}) reached.`);
                    break;
                }
                if (file.size > GALLERY_MAX) {
                    toast.warning(`${file.name} is over 5 MB — skipped.`);
                    continue;
                }
                const res = await uploadListingMedia(draftId, file, 'gallery');
                const data = res.data || res;
                setGallery(prev => [...prev, data]);
            }
        } catch (err: any) {
            toast.error(err?.message || 'Failed to upload gallery image.');
        } finally {
            setBusyKind(null);
            e.target.value = '';
        }
    };

    const handleVideoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!draftId || !e.target.files?.[0]) return;
        const file = e.target.files[0];
        if (file.size > VIDEO_MAX) { toast.warning('Video must be under 100 MB.'); e.target.value = ''; return; }
        setBusyKind('video');
        try {
            if (video) await deleteListingMedia(draftId, video.id);
            const res = await uploadListingMedia(draftId, file, 'video');
            const data = res.data || res;
            setVideo(data);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to upload video.');
        } finally {
            setBusyKind(null);
            e.target.value = '';
        }
    };

    const handleDeleteGallery = async (mediaId: number) => {
        if (!draftId) return;
        try {
            await deleteListingMedia(draftId, mediaId);
            setGallery(prev => prev.filter(m => m.id !== mediaId));
        } catch (err: any) {
            toast.error(err?.message || 'Failed to delete image.');
        }
    };

    const handleDeleteCover = async () => {
        if (!draftId || !cover) return;
        try {
            await deleteListingMedia(draftId, cover.id);
            setCover(null);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to delete cover.');
        }
    };

    const handleDeleteVideo = async () => {
        if (!draftId || !video) return;
        try {
            await deleteListingMedia(draftId, video.id);
            setVideo(null);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to delete video.');
        }
    };

    if (loading) {
        return (
            <WizardLayout
                title="New Event"
                stepText="Step 3 of 4"
                subtitle="Media"
                progressPercentage={75}
                themeColor="blue"
                onBack={() => onNavigate('CREATE_EVENT_SCHEDULE')}
            >
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading media…
                </div>
            </WizardLayout>
        );
    }

    if (loadError) {
        return (
            <WizardLayout
                title="New Event"
                stepText="Step 3 of 4"
                subtitle="Media"
                progressPercentage={75}
                themeColor="blue"
                onBack={() => onNavigate('CREATE_EVENT_SCHEDULE')}
            >
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-600">
                    {loadError}
                </div>
            </WizardLayout>
        );
    }

    return (
        <WizardLayout
            title="New Event"
            stepText="Step 3 of 4"
            subtitle="Media"
            progressPercentage={75}
            themeColor="blue"
            onBack={() => onNavigate('CREATE_EVENT_SCHEDULE')}
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Event Visuals</h2>
                <p className="text-sm text-gray-400">High-quality images drive more registrations. Cover image required.</p>
            </div>

            {/* Cover */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                    Cover Image <span className="text-red-400">*</span>
                </label>
                <input ref={coverInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleCoverPick} />
                {cover ? (
                    <div className="relative w-full sm:w-80 aspect-[16/9] rounded-2xl overflow-hidden border border-gray-200">
                        <img src={resolveUrl(cover.file_url)} alt="Cover" className="w-full h-full object-cover" />
                        <button
                            onClick={handleDeleteCover}
                            className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-lg shadow text-red-500 hover:bg-white"
                            aria-label="Remove cover"
                        >
                            <Trash2 size={14} />
                        </button>
                        <button
                            onClick={() => coverInputRef.current?.click()}
                            disabled={busyKind === 'cover'}
                            className="absolute bottom-2 right-2 bg-white/90 px-3 py-1.5 rounded-lg shadow text-xs font-bold text-blue-600 hover:bg-white disabled:opacity-50"
                        >
                            {busyKind === 'cover' ? 'Uploading…' : 'Change'}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => coverInputRef.current?.click()}
                        disabled={busyKind === 'cover'}
                        className="w-full sm:w-80 aspect-[16/9] bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-blue-500 hover:bg-blue-100 transition-colors disabled:opacity-60"
                    >
                        {busyKind === 'cover' ? <Loader2 size={28} className="animate-spin" /> : <Camera size={28} />}
                        <span className="text-xs font-bold mt-2">{busyKind === 'cover' ? 'Uploading…' : 'Upload Cover'}</span>
                        <span className="text-[10px] text-blue-400 mt-1">JPG/PNG · Max 5MB</span>
                    </button>
                )}
            </div>

            {/* Gallery */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                    Gallery Photos <span className="text-gray-300 font-normal normal-case ml-1">({gallery.length}/{GALLERY_LIMIT})</span>
                </label>
                <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    multiple
                    className="hidden"
                    onChange={handleGalleryPick}
                />
                <div className="flex flex-wrap gap-3">
                    {gallery.map((g) => (
                        <div key={g.id} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 group">
                            <img src={resolveUrl(g.file_url)} alt="Gallery" className="w-full h-full object-cover" />
                            <button
                                onClick={() => handleDeleteGallery(g.id)}
                                className="absolute top-1 right-1 bg-white/90 p-1 rounded-md text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove image"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    {gallery.length < GALLERY_LIMIT && (
                        <button
                            onClick={() => galleryInputRef.current?.click()}
                            disabled={busyKind === 'gallery'}
                            className="w-24 h-24 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-blue-500 hover:bg-blue-100 disabled:opacity-60"
                        >
                            {busyKind === 'gallery'
                                ? <Loader2 size={20} className="animate-spin" />
                                : <ImageIcon size={20} />}
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
                        <div className="bg-purple-100 p-3 rounded-xl text-blue-500"><Play size={20} /></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">Video uploaded</p>
                            <a href={resolveUrl(video.file_url)} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 truncate block hover:underline">
                                {video.file_url}
                            </a>
                        </div>
                        <button onClick={handleDeleteVideo} className="text-red-500 p-2"><Trash2 size={16} /></button>
                    </div>
                ) : (
                    <button
                        onClick={() => videoInputRef.current?.click()}
                        disabled={busyKind === 'video'}
                        className="w-full bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-4 flex items-center gap-4 hover:bg-gray-100 disabled:opacity-60"
                    >
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

            {!cover && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] font-bold text-amber-700">
                    Cover image is required to submit this event.
                </div>
            )}

            <WizardNavigation
                onBack={() => onNavigate('CREATE_EVENT_SCHEDULE')}
                onNext={() => onNavigate('CREATE_EVENT_PREVIEW')}
                nextText="Preview & Publish"
                nextIcon={<ArrowRight size={18} />}
                themeColor="blue"
            />
        </WizardLayout>
    );
};
