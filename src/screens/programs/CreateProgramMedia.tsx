import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Camera, Play, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, toast } from '../../components/ui';
import {
    getCurrentProgramDraftId,
    getProgramListingDetail,
    uploadProgramMedia,
    deleteProgramMedia,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface MediaItem {
    id: number;
    media_type: 'cover' | 'gallery' | 'video';
    url?: string;
    file_url?: string;
}

const API_BASE = 'https://tlb-api.reluconsultancy.in';
const COVER_IMG_MAX = 5  * 1024 * 1024;
const COVER_VID_MAX = 15 * 1024 * 1024;
const GALLERY_MAX   = 5  * 1024 * 1024;
const VIDEO_MAX     = 100 * 1024 * 1024;
const GALLERY_LIMIT = 10;

const resolveUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getUrl = (item: MediaItem) => resolveUrl(item.url || item.file_url || '');
const isVideoFile = (name: string) => /\.(mp4|mov)$/i.test(name);
const isVideoUrl = (url: string) => /\.(mp4|mov)$/i.test(url);

export const CreateProgramMedia: React.FC<Props> = ({ onNavigate }) => {
    const [draftId, setDraftId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [busyKind, setBusyKind] = useState<'cover' | 'gallery' | 'video' | null>(null);

    const [cover, setCover] = useState<MediaItem | null>(null);
    const [gallery, setGallery] = useState<MediaItem[]>([]);
    const [video, setVideo] = useState<MediaItem | null>(null);

    const coverInputRef   = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef   = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const id = getCurrentProgramDraftId();
        if (!id) {
            setLoadError('No active draft. Start from "Identity & Story".');
            setLoading(false);
            return;
        }
        setDraftId(id);
        (async () => {
            try {
                const res = await getProgramListingDetail(id);
                const d = res.data || res;
                // Per API 11.3, media is at top level
                const raw: MediaItem[] = Array.isArray(d.media) ? d.media : [];
                setCover(raw.find(m => m.media_type === 'cover') || null);
                setGallery(raw.filter(m => m.media_type === 'gallery'));
                setVideo(raw.find(m => m.media_type === 'video') || null);
            } catch (err: any) {
                setLoadError(err?.message || 'Failed to load media.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleCoverPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!draftId || !e.target.files?.[0]) return;
        const file = e.target.files[0];
        const isVid = isVideoFile(file.name);
        const maxSize = isVid ? COVER_VID_MAX : COVER_IMG_MAX;
        if (file.size > maxSize) { toast.warning(isVid ? 'Banner video must be under 15 MB.' : 'Cover image must be under 5 MB.'); e.target.value = ''; return; }
        setBusyKind('cover');
        try {
            if (cover) await deleteProgramMedia(draftId, cover.id);
            const res = await uploadProgramMedia(draftId, file, 'cover');
            setCover(res.data || res);
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
                if (gallery.length >= GALLERY_LIMIT) { toast.warning(`Gallery limit (${GALLERY_LIMIT}) reached.`); break; }
                if (file.size > GALLERY_MAX) { toast.warning(`${file.name} is over 5 MB — skipped.`); continue; }
                const res = await uploadProgramMedia(draftId, file, 'gallery');
                setGallery(prev => [...prev, res.data || res]);
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
            if (video) await deleteProgramMedia(draftId, video.id);
            const res = await uploadProgramMedia(draftId, file, 'video');
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
        try {
            await deleteProgramMedia(draftId, cover.id);
            setCover(null);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to delete cover.');
        }
    };

    const handleDeleteGallery = async (mediaId: number) => {
        if (!draftId) return;
        try {
            await deleteProgramMedia(draftId, mediaId);
            setGallery(prev => prev.filter(m => m.id !== mediaId));
        } catch (err: any) {
            toast.error(err?.message || 'Failed to delete image.');
        }
    };

    const handleDeleteVideo = async () => {
        if (!draftId || !video) return;
        try {
            await deleteProgramMedia(draftId, video.id);
            setVideo(null);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to delete video.');
        }
    };

    if (loading || loadError) {
        return (
            <WizardLayout
                title="New Program"
                stepText="Stage 3 of 5"
                subtitle="Visual Storefront"
                progressPercentage={60}
                themeColor="emerald"
                onBack={() => onNavigate('CREATE_PROGRAM_BATCH')}
            >
                {loading
                    ? <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold py-12">
                          <Loader2 size={16} className="animate-spin" /> Loading media…
                      </div>
                    : <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-600">
                          {loadError}
                      </div>
                }
            </WizardLayout>
        );
    }

    return (
        <WizardLayout
            title="New Program"
            stepText="Stage 3 of 5"
            subtitle="Visual Storefront"
            progressPercentage={60}
            themeColor="emerald"
            onBack={() => onNavigate('CREATE_PROGRAM_BATCH')}
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Visual Storefront</h2>
                <p className="text-sm text-gray-400">High-quality media that makes your program stand out.</p>
            </div>

            {/* Cover Image */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                    Cover Banner <span className="text-red-400">*</span>
                </label>
                <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,video/mp4,video/quicktime" className="hidden" onChange={handleCoverPick} />
                {cover ? (
                    <div className="relative w-full sm:w-80 aspect-[16/9] rounded-2xl overflow-hidden border border-gray-200">
                        {isVideoUrl(getUrl(cover)) ? (
                            <video src={getUrl(cover)} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                        ) : (
                            <img src={getUrl(cover)} alt="Cover" className="w-full h-full object-cover" />
                        )}
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
                            className="absolute bottom-2 right-2 bg-white/90 px-3 py-1.5 rounded-lg shadow text-xs font-bold text-emerald-600 hover:bg-white disabled:opacity-50"
                        >
                            {busyKind === 'cover' ? 'Uploading…' : 'Change'}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => coverInputRef.current?.click()}
                        disabled={busyKind === 'cover'}
                        className="w-full sm:w-80 aspect-[16/9] bg-emerald-50 rounded-2xl border-2 border-dashed border-emerald-300/50 flex flex-col items-center justify-center text-emerald-500 hover:bg-emerald-100/50 transition-colors disabled:opacity-60"
                    >
                        {busyKind === 'cover' ? <Loader2 size={28} className="animate-spin" /> : <Camera size={28} />}
                        <span className="text-xs font-bold mt-2">{busyKind === 'cover' ? 'Uploading…' : 'Upload Cover'}</span>
                        <span className="text-[10px] text-emerald-400/80 mt-1">JPG/PNG or MP4/MOV · Image 5MB / Video 15MB</span>
                    </button>
                )}
            </div>

            {/* Gallery */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                    Gallery Photos
                    <span className="text-gray-300 font-normal normal-case ml-1">({gallery.length}/{GALLERY_LIMIT})</span>
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
                            <img src={getUrl(g)} alt="Gallery" className="w-full h-full object-cover" />
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
                            className="w-24 h-24 bg-emerald-50 rounded-2xl border-2 border-dashed border-emerald-300/50 flex flex-col items-center justify-center text-emerald-500 hover:bg-emerald-100/50 transition-colors disabled:opacity-60"
                        >
                            {busyKind === 'gallery'
                                ? <Loader2 size={20} className="animate-spin" />
                                : <ImageIcon size={20} />}
                            <span className="text-[10px] font-bold mt-1">{busyKind === 'gallery' ? 'Uploading…' : 'Add Photo'}</span>
                        </button>
                    )}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">JPG/PNG · Max 5 MB each · Up to {GALLERY_LIMIT}</p>
            </div>

            {/* Video */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                    Promo Video <span className="text-gray-300 font-normal normal-case ml-1">(optional)</span>
                </label>
                <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={handleVideoPick} />
                {video ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
                        <div className="bg-emerald-50 p-3 rounded-xl text-emerald-500"><Play size={20} /></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">Video uploaded</p>
                            <a
                                href={getUrl(video)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-emerald-600 truncate block hover:underline"
                            >
                                {video.url || video.file_url}
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
                            <p className="text-sm font-bold">{busyKind === 'video' ? 'Uploading…' : 'Upload Promo Video'}</p>
                            <p className="text-[10px] text-gray-400">MP4 / MOV · Max 100 MB</p>
                        </div>
                    </button>
                )}
            </div>

            {!cover && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] font-bold text-amber-700">
                    Cover banner is required to submit this listing.
                </div>
            )}

            <WizardNavigation
                onBack={() => onNavigate('CREATE_PROGRAM_BATCH')}
                onNext={() => onNavigate('CREATE_PROGRAM_POLICIES')}
                nextText="Next: Policies"
                nextIcon={<ArrowRight size={18} />}
                themeColor="emerald"
            />
        </WizardLayout>
    );
};
