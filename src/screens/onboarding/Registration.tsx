import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
    CheckCircle2,
    FileText,
    Building2,
    Instagram,
    Facebook,
    Globe,
    Video,
    Image as ImageIcon,
    Mail,
    Trash2,
    ImagePlus,
    ShieldCheck,
} from 'lucide-react';
import { Screen } from '../../types';
import {
    updateBusinessProfile,
    uploadPartnerMedia,
    deletePartnerMedia,
    getCurrentPartner,
} from '../../api/onboarding';
import { OnboardingShell, PageHeader, ToastContainer, useToasts } from '../../components/ui';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

const BUSINESS_TYPES = ['Individual', 'Sole Proprietor', 'Partnership', 'Company', 'LLP'];

export const Registration: React.FC<OnboardingProps> = ({ onNavigate }) => {
    const [formData, setFormData] = useState({
        business_name: '',
        business_type: 'Company',
        contact_person_name: '',
        email: '',
        base_city: '',
        instagram_url: '',
        is_info_correct: false,
        is_safety_confirmed: false,
    });
    const [loading, setLoading] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<any[]>([]);
    const [uploadedVideo, setUploadedVideo] = useState<any | null>(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const { toasts, showToast, dismissToast } = useToasts();

    const update = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploadingMedia(true);
        try {
            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
                    showToast(`${file.name}: unsupported format. Use JPG or PNG.`, 'warning');
                    continue;
                }
                if (file.size > 5 * 1024 * 1024) {
                    showToast(`${file.name} is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 5MB.`, 'warning');
                    continue;
                }
                const res = await uploadPartnerMedia(file, 'image');
                const data = res.data || res;
                setUploadedImages((prev) => [...prev, data]);
            }
        } catch (error: any) {
            console.error('Image upload failed', error);
            showToast(error?.message || 'Could not upload image. Please try again.', 'error');
        } finally {
            setUploadingMedia(false);
            e.target.value = '';
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        if (file.type && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
            showToast(`${file.name}: unsupported format. Use MP4 or MOV.`, 'warning');
            e.target.value = '';
            return;
        }
        if (file.size > 100 * 1024 * 1024) {
            showToast(`${file.name} is too large (${(file.size / 1024 / 1024).toFixed(0)}MB). Max is 100MB.`, 'warning');
            e.target.value = '';
            return;
        }
        setUploadingMedia(true);
        try {
            const res = await uploadPartnerMedia(file, 'video');
            const data = res.data || res;
            setUploadedVideo(data);
        } catch (error: any) {
            console.error('Video upload failed', error);
            showToast(error?.message || 'Could not upload video. Please try again.', 'error');
        } finally {
            setUploadingMedia(false);
            e.target.value = '';
        }
    };

    const handleDeleteMedia = async (mediaId: number, type: 'image' | 'video') => {
        try {
            await deletePartnerMedia(mediaId);
            if (type === 'image') {
                setUploadedImages((prev) => prev.filter((img) => img.id !== mediaId));
            } else {
                setUploadedVideo(null);
            }
        } catch (error) {
            console.error('Delete media failed', error);
            showToast('Failed to delete media.', 'error');
        }
    };

    const handleSubmit = async () => {
        if (!formData.is_info_correct || !formData.is_safety_confirmed) {
            showToast('Please confirm both safety declarations.', 'warning');
            return;
        }
        if (!formData.instagram_url) {
            showToast('Please provide at least one social media link (Instagram).', 'warning');
            return;
        }
        if (uploadedImages.length < 3) {
            showToast('Please upload at least 3 images. Required for account activation.', 'warning');
            return;
        }

        setLoading(true);
        try {
            await updateBusinessProfile(formData);
            // Backend auto-activates if profile_created + ≥3 images.
            await getCurrentPartner();
            onNavigate('APP_SUBMITTED');
        } catch (error: any) {
            console.error('Failed to submit application', error);
            showToast(error?.message || 'Failed to submit application. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const sectionCls = 'bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm';
    const sectionTitleCls = 'flex items-center gap-3 mb-5';

    return (
        <OnboardingShell
            title="Business Profile"
            eyebrow="Step 4 of 4"
            onBack={() => onNavigate('PARTNER_CATEGORY')}
            progress={{ current: 4, total: 4 }}
            maxWidth="max-w-2xl"
        >
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            <PageHeader
                eyebrow="Build your brand"
                title={
                    <>
                        Tell us about your <span className="text-tlb-yellow">business.</span>
                    </>
                }
                subtitle="A complete profile builds trust and unlocks bookings. You can refine everything later from your dashboard."
            />

            <div className="space-y-5">
                {/* ── Business Details ── */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 }}
                    className={sectionCls}
                >
                    <div className={sectionTitleCls}>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Building2 size={18} />
                        </div>
                        <div>
                            <h3 className="font-black text-base">Business Details</h3>
                            <p className="text-[11px] text-gray-400 font-medium">Who you are, where you're based</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                                Business / Brand Name
                            </label>
                            <input
                                className="tlb-input"
                                placeholder="The Grand Theater"
                                value={formData.business_name}
                                onChange={(e) => update('business_name', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                                Contact Person Name
                            </label>
                            <input
                                className="tlb-input"
                                placeholder="Sarah Bernhardt"
                                value={formData.contact_person_name}
                                onChange={(e) => update('contact_person_name', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                                Business Type
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {BUSINESS_TYPES.map((type) => {
                                    const active = formData.business_type === type;
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => update('business_type', type)}
                                            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                                active
                                                    ? 'bg-tlb-yellow text-tlb-dark shadow-md shadow-tlb-yellow/30'
                                                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                                Email
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    className="tlb-input pl-11"
                                    placeholder="sarah@grandtheater.com"
                                    value={formData.email}
                                    onChange={(e) => update('email', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                                City
                            </label>
                            <input
                                type="text"
                                className="tlb-input"
                                placeholder="Mumbai"
                                value={formData.base_city}
                                onChange={(e) => update('base_city', e.target.value)}
                            />
                        </div>
                    </div>
                </motion.section>

                {/* ── Digital Presence ── */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className={sectionCls}
                >
                    <div className={sectionTitleCls}>
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Globe size={18} />
                        </div>
                        <div>
                            <h3 className="font-black text-base">Digital Presence</h3>
                            <p className="text-[11px] text-gray-400 font-medium">At least Instagram is required</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl focus-within:border-tlb-yellow focus-within:ring-2 focus-within:ring-tlb-yellow/20 transition-all">
                            <Instagram size={18} className="text-pink-500 shrink-0" />
                            <input
                                className="bg-transparent flex-1 text-sm outline-none placeholder:text-gray-400"
                                placeholder="https://instagram.com/yourbusiness"
                                value={formData.instagram_url}
                                onChange={(e) => update('instagram_url', e.target.value)}
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Required</span>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl focus-within:border-tlb-yellow focus-within:ring-2 focus-within:ring-tlb-yellow/20 transition-all">
                            <Facebook size={18} className="text-blue-600 shrink-0" />
                            <input
                                className="bg-transparent flex-1 text-sm outline-none placeholder:text-gray-400"
                                placeholder="https://facebook.com/yourbusiness"
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Optional</span>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl focus-within:border-tlb-yellow focus-within:ring-2 focus-within:ring-tlb-yellow/20 transition-all">
                            <Globe size={18} className="text-tlb-dark shrink-0" />
                            <input
                                className="bg-transparent flex-1 text-sm outline-none placeholder:text-gray-400"
                                placeholder="https://www.yourbusiness.com"
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Optional</span>
                        </div>
                    </div>
                </motion.section>

                {/* ── Proof of Work / Media ── */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.15 }}
                    className={sectionCls}
                >
                    <div className={sectionTitleCls}>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <ImageIcon size={18} />
                        </div>
                        <div>
                            <h3 className="font-black text-base">Proof of Work</h3>
                            <p className="text-[11px] text-gray-400 font-medium">3-5 photos required for activation</p>
                        </div>
                    </div>

                    {/* Image gallery */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Photos · {uploadedImages.length} uploaded
                            </label>
                            <div
                                className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                    uploadedImages.length >= 3
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-amber-50 text-amber-600'
                                }`}
                            >
                                {uploadedImages.length >= 3 ? '✓ Ready' : `${3 - uploadedImages.length} more needed`}
                            </div>
                        </div>

                        {uploadedImages.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {uploadedImages.map((img) => (
                                    <div
                                        key={img.id}
                                        className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group"
                                    >
                                        <img
                                            src={img.file_url || img.file}
                                            alt="Upload"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => handleDeleteMedia(img.id, 'image')}
                                            className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur p-1.5 rounded-lg text-red-500 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="Remove image"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <label
                            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl py-8 bg-gray-50/50 transition-colors ${
                                uploadingMedia ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 hover:border-tlb-yellow/50'
                            }`}
                        >
                            <div className="w-10 h-10 rounded-xl bg-tlb-yellow/15 text-tlb-yellow flex items-center justify-center">
                                <ImagePlus size={20} />
                            </div>
                            <p className="text-sm font-bold">
                                {uploadingMedia ? 'Uploading…' : (
                                    <>
                                        <span className="text-tlb-yellow">Click to upload</span> or drop files here
                                    </>
                                )}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                PNG, JPG · 5MB max each
                            </p>
                            <input
                                type="file"
                                multiple
                                accept="image/png,image/jpeg"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={uploadingMedia}
                            />
                        </label>
                    </div>

                    {/* Video */}
                    <div className="mt-6 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Short Video
                            </label>
                            <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-black uppercase">
                                Optional
                            </span>
                        </div>
                        {uploadedVideo ? (
                            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-3 rounded-xl">
                                <div className="w-10 h-10 rounded-lg bg-gray-200 text-gray-500 flex items-center justify-center">
                                    <Video size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold">Video uploaded</p>
                                    <p className="text-[10px] text-gray-400 truncate">
                                        {uploadedVideo.file_url || uploadedVideo.file}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDeleteMedia(uploadedVideo.id, 'video')}
                                    className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                    aria-label="Remove video"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ) : (
                            <label
                                className={`flex items-center gap-3 bg-gray-50 border border-gray-100 p-3 rounded-xl transition-colors ${
                                    uploadingMedia ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-200'
                                }`}
                            >
                                <div className="w-10 h-10 rounded-lg bg-gray-200 text-gray-500 flex items-center justify-center">
                                    <Video size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold">Add a short intro video</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">MP4, MOV · 100MB max</p>
                                </div>
                                <span className="text-tlb-yellow font-black text-xs">Browse</span>
                                <input
                                    type="file"
                                    accept="video/mp4,video/quicktime"
                                    className="hidden"
                                    onChange={handleVideoUpload}
                                    disabled={uploadingMedia}
                                />
                            </label>
                        )}
                    </div>
                </motion.section>

                {/* ── Safety Confirmation ── */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.2 }}
                    className={sectionCls}
                >
                    <div className={sectionTitleCls}>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <FileText size={18} />
                        </div>
                        <div>
                            <h3 className="font-black text-base">Safety &amp; Confirmation</h3>
                            <p className="text-[11px] text-gray-400 font-medium">Both checks required to submit</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {[
                            {
                                key: 'is_info_correct' as const,
                                label: 'I confirm that all information provided above is accurate and genuine.',
                            },
                            {
                                key: 'is_safety_confirmed' as const,
                                label: 'I confirm my offerings are safe and age-appropriate for children.',
                            },
                        ].map(({ key, label }) => {
                            const checked = formData[key];
                            return (
                                <label
                                    key={key}
                                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                        checked
                                            ? 'bg-tlb-yellow/5 border-tlb-yellow'
                                            : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                                    }`}
                                >
                                    <div
                                        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                            checked ? 'bg-tlb-yellow text-tlb-dark' : 'bg-white border-2 border-gray-300'
                                        }`}
                                    >
                                        {checked && <CheckCircle2 size={14} />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={checked}
                                        onChange={(e) => update(key, e.target.checked)}
                                    />
                                    <span className="flex-1 text-sm font-medium leading-relaxed text-tlb-dark">{label}</span>
                                </label>
                            );
                        })}
                    </div>
                </motion.section>
            </div>

            <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                whileHover={!loading ? { scale: 1.01 } : undefined}
                whileTap={!loading ? { scale: 0.99 } : undefined}
                className={`mt-6 w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-base transition-all ${
                    loading
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-tlb-yellow text-tlb-dark shadow-xl shadow-tlb-yellow/30'
                }`}
            >
                {loading ? (
                    <>
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Submitting…
                    </>
                ) : (
                    <>
                        Submit Application <CheckCircle2 size={18} />
                    </>
                )}
            </motion.button>

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-gray-400">
                <ShieldCheck size={12} className="text-emerald-500" />
                Activation requires 3+ photos and both safety confirmations.
            </div>
        </OnboardingShell>
    );
};
