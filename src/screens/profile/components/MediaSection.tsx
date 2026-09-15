import React from 'react';
import { ImagePlus, Loader2, Play, Trash2, Video } from 'lucide-react';
import { SectionCard } from './fields';

interface MediaSectionProps {
    coverUrl: string | null;
    onCoverSelected: (file: File) => void;
    images: any[];
    video: any | null;
    uploading: boolean;
    onAddImages: (files: File[]) => void;
    onAddVideo: (file: File) => void;
    onDelete: (id: number, kind: 'image' | 'video') => void;
}

const TILE = 'aspect-square rounded-xl overflow-hidden relative';
const ADD_TILE = `${TILE} flex flex-col items-center justify-center gap-1 border border-dashed border-tlb-amber-line bg-tlb-cream text-tlb-gold cursor-pointer hover:bg-tlb-amber-soft transition-colors focus-within:ring-2 focus-within:ring-tlb-amber`;

const DeleteButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-white/90 text-tlb-red opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
    >
        <Trash2 size={13} />
    </button>
);

export const MediaSection: React.FC<MediaSectionProps> = ({
    coverUrl, onCoverSelected, images, video, uploading, onAddImages, onAddVideo, onDelete,
}) => (
    <SectionCard title="Photos & media" subtitle="Cover photo and gallery shown on your public page">
        <label className="group relative block h-40 sm:h-48 rounded-xl overflow-hidden border border-dashed border-tlb-edge bg-tlb-wash cursor-pointer focus-within:ring-2 focus-within:ring-tlb-amber">
            {coverUrl ? (
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : (
                <span className="flex h-full flex-col items-center justify-center gap-1 text-tlb-muted">
                    <ImagePlus size={24} />
                    <span className="text-xs font-semibold text-tlb-sub">Upload a cover photo</span>
                    <span className="text-[11px]">JPG or PNG, up to 5 MB</span>
                </span>
            )}
            {coverUrl && (
                <span className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="pt-btn pt-btn-o">Change cover</span>
                </span>
            )}
            <input
                type="file"
                accept="image/png,image/jpeg"
                className="sr-only"
                aria-label="Upload cover photo"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) onCoverSelected(file);
                    e.target.value = '';
                }}
            />
        </label>
        <p className="text-[11px] text-tlb-muted mt-1.5">Cover and logo changes are stored when you save.</p>

        <div className="flex items-center gap-2 mt-5 mb-2">
            <span className="pt-field-k">Gallery</span>
            {uploading && <Loader2 size={13} className="animate-spin text-tlb-muted" aria-label="Uploading" />}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-3">
            <label className={`${ADD_TILE} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <ImagePlus size={18} />
                <span className="text-[11px] font-bold">Add photos</span>
                <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.files?.length) onAddImages(Array.from(e.target.files));
                        e.target.value = '';
                    }}
                />
            </label>
            {!video && (
                <label className={`${ADD_TILE} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Video size={18} />
                    <span className="text-[11px] font-bold">Add video</span>
                    <input
                        type="file"
                        accept="video/mp4,video/quicktime"
                        className="sr-only"
                        disabled={uploading}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const file = e.target.files?.[0];
                            if (file) onAddVideo(file);
                            e.target.value = '';
                        }}
                    />
                </label>
            )}
            {images.map(img => (
                <div key={img.id} className={`${TILE} group bg-tlb-wash`}>
                    <img src={img.file_url || img.file} alt="Gallery photo" className="w-full h-full object-cover" />
                    <DeleteButton label="Delete photo" onClick={() => onDelete(img.id, 'image')} />
                </div>
            ))}
            {video && (
                <div className={`${TILE} group bg-tlb-ink flex items-center justify-center`}>
                    <Play size={22} className="text-white" aria-hidden="true" />
                    <span className="sr-only">Gallery video</span>
                    <DeleteButton label="Delete video" onClick={() => onDelete(video.id, 'video')} />
                </div>
            )}
        </div>
    </SectionCard>
);
