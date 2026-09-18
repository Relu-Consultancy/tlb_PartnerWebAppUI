import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Camera, Play, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Screen } from '../../types';
import { toast } from '../../components/ui';
import { WizardShell, WizardNav, WizardField } from '../../components/portal/wizard';
import {
    getCurrentClassDraftId,
    getClassListingDetail,
    uploadClassMedia,
    deleteClassMedia,
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

export const CreateClassMedia: React.FC<Props> = ({ onNavigate }) => {
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
        const id = getCurrentClassDraftId();
        if (!id) {
            setLoadError('No active draft. Start from "Identity & Story".');
            setLoading(false);
            return;
        }
        setDraftId(id);
        (async () => {
            try {
                const res = await getClassListingDetail(id);
                const d = res.data || res;
                const srv = d.service || {};
                const raw = Array.isArray(srv.media) ? srv.media : (Array.isArray(d.media) ? d.media : []);
                const items: MediaItem[] = raw;
                setCover(items.find(m => m.media_type === 'cover') || null);
                setGallery(items.filter(m => m.media_type === 'gallery'));
                setVideo(items.find(m => m.media_type === 'video') || null);
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
            if (cover) await deleteClassMedia(draftId, cover.id);
            const res = await uploadClassMedia(draftId, file, 'cover');
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
                if (gallery.length >= GALLERY_LIMIT) {
                    toast.warning(`Gallery limit (${GALLERY_LIMIT}) reached.`);
                    break;
                }
                if (file.size > GALLERY_MAX) {
                    toast.warning(`${file.name} is over 5 MB — skipped.`);
                    continue;
                }
                const res = await uploadClassMedia(draftId, file, 'gallery');
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
            if (video) await deleteClassMedia(draftId, video.id);
            const res = await uploadClassMedia(draftId, file, 'video');
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
            await deleteClassMedia(draftId, cover.id);
            setCover(null);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to delete cover.');
        }
    };

    const handleDeleteGallery = async (mediaId: number) => {
        if (!draftId) return;
        try {
            await deleteClassMedia(draftId, mediaId);
            setGallery(prev => prev.filter(m => m.id !== mediaId));
        } catch (err: any) {
            toast.error(err?.message || 'Failed to delete image.');
        }
    };

    const handleDeleteVideo = async () => {
        if (!draftId || !video) return;
        try {
            await deleteClassMedia(draftId, video.id);
            setVideo(null);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to delete video.');
        }
    };

    if (loading) {
        return (
            <WizardShell title="New class" entityType="Classes" step={3} totalSteps={5} stepLabel="Media" onBack={() => onNavigate('CREATE_CLASS_BATCH')}>
                <div className="pt-card p-5 sm:p-6 flex items-center justify-center gap-2 text-tlb-muted text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading media…
                </div>
            </WizardShell>
        );
    }

    if (loadError) {
        return (
            <WizardShell title="New class" entityType="Classes" step={3} totalSteps={5} stepLabel="Media" onBack={() => onNavigate('CREATE_CLASS_BATCH')}>
                <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{loadError}</div>
            </WizardShell>
        );
    }

    return (
        <WizardShell title="New class" entityType="Classes" step={3} totalSteps={5} stepLabel="Media" onBack={() => onNavigate('CREATE_CLASS_BATCH')}>
            <div className="pt-card p-5 sm:p-6 flex flex-col gap-5">
                <div>
                    <h2 className="pt-h-sec">Visual storefront</h2>
                    <p className="text-[13px] text-tlb-sub mt-0.5">High-conversion media assets that showcase your class.</p>
                </div>

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
                        {gallery.map((g) => (
                            <div key={g.id} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-tlb-line group">
                                <img src={getUrl(g)} alt="Gallery" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => handleDeleteGallery(g.id)}
                                    className="absolute top-1 right-1 bg-white/90 p-1 rounded-md text-tlb-red opacity-0 group-hover:opacity-100 transition-opacity"
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
                                className="w-24 h-24 bg-tlb-amber-soft rounded-2xl border-2 border-dashed border-tlb-amber-line flex flex-col items-center justify-center text-tlb-gold hover:bg-tlb-cream disabled:opacity-60"
                            >
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
                                <a href={getUrl(video)} target="_blank" rel="noreferrer" className="pt-link truncate block">
                                    {video.url || video.file_url}
                                </a>
                            </div>
                            <button onClick={handleDeleteVideo} className="text-tlb-red p-2"><Trash2 size={16} /></button>
                        </div>
                    ) : (
                        <button
                            onClick={() => videoInputRef.current?.click()}
                            disabled={busyKind === 'video'}
                            className="w-full bg-tlb-wash rounded-2xl border-2 border-dashed border-tlb-edge p-4 flex items-center gap-4 hover:bg-tlb-hover disabled:opacity-60"
                        >
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

                {!cover && <div className="pt-note bg-tlb-amber-soft text-tlb-gold">Cover banner is required to submit this listing.</div>}

                <WizardNav
                    onBack={() => onNavigate('CREATE_CLASS_BATCH')}
                    onNext={() => onNavigate('CREATE_CLASS_POLICIES')}
                    nextText="Next: FAQs & Terms"
                    nextIcon={<ArrowRight size={14} strokeWidth={2.75} />}
                />
            </div>
        </WizardShell>
    );
};
