import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Camera, Link2, Save, MapPin, Eye, Upload, Play, Trash2,
    Edit3, Phone, Globe, CheckCircle2, Building2, Share2, Images, X,
} from 'lucide-react';
import { Screen } from '../../types';
import { getBusinessProfile, getExtendedProfile, updateExtendedProfile, updateBusinessProfile, getPartnerMedia, uploadPartnerMedia, deletePartnerMedia } from '../../api/onboarding';
import { SkeletonProfile, toast } from '../../components/ui';

const Instagram = ({ size, className }: { size: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
);

// A single contact/link row in the view-mode "Contact & Links" card.
const DetailRow = ({ icon, value }: { icon: React.ReactNode; value: string }) => (
    <div className="flex items-center gap-3 px-5 py-3">
        <span className="shrink-0">{icon}</span>
        <span className="text-sm text-gray-700 truncate">{value}</span>
    </div>
);

// Section header (icon tile + title + subtitle) for the edit-mode form cards.
const SectionHead = ({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) => (
    <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-tlb-yellow/10 text-tlb-yellow flex items-center justify-center shrink-0">{icon}</div>
        <div>
            <h3 className="text-base font-black text-gray-900 leading-none">{title}</h3>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">{sub}</p>
        </div>
    </div>
);

interface ProfileProps {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

export const BrandProfile: React.FC<ProfileProps> = ({ onNavigate, onOpenSidebar }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Profile data from API
    const [businessName, setBusinessName] = useState('');
    const [bio, setBio] = useState('');
    const [initialProfileData, setInitialProfileData] = useState<any>(null);
    const [contactNumber, setContactNumber] = useState('');
    const [operatingCities, setOperatingCities] = useState<string[]>([]);
    const [instagramUrl, setInstagramUrl] = useState('');
    const [facebookUrl, setFacebookUrl] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [address, setAddress] = useState('');

    // Media
    const [mediaImages, setMediaImages] = useState<any[]>([]);
    const [mediaVideo, setMediaVideo] = useState<any | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [profileRes, extRes, mediaRes] = await Promise.allSettled([
                    getBusinessProfile(),
                    getExtendedProfile(),
                    getPartnerMedia(),
                ]);

                if (profileRes.status === 'fulfilled') {
                    const p = profileRes.value.data || profileRes.value;
                    setBusinessName(p.business_name || '');
                    setInstagramUrl(p.instagram_url || '');
                    setFacebookUrl(p.facebook_url || '');
                    setWebsiteUrl(p.website_url || '');
                    setInitialProfileData({
                        business_name: p.business_name || '',
                        instagram_url: p.instagram_url || '',
                        facebook_url: p.facebook_url || '',
                        website_url: p.website_url || '',
                    });
                }

                if (extRes.status === 'fulfilled') {
                    const e = extRes.value.data || extRes.value;
                    setBio(e.bio || '');
                    setContactNumber(e.contact_number || '');
                    setOperatingCities(e.operating_cities || []);
                    setAddress(e.address || '');
                    if (e.logo || e.logo_url) setLogoPreview(e.logo || e.logo_url);
                    const coverSrc = e.cover_image || e.cover_image_url || e.cover || e.cover_photo || e.cover_url;
                    if (coverSrc) setCoverPreview(coverSrc);
                }

                if (mediaRes.status === 'fulfilled') {
                    const m = mediaRes.value.data || mediaRes.value;
                    if (Array.isArray(m)) {
                        setMediaImages(m.filter((item: any) => item.media_type === 'image'));
                        const vid = m.find((item: any) => item.media_type === 'video');
                        if (vid) setMediaVideo(vid);
                    }
                }
            } catch (err) {
                console.error('Profile fetch error', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Profile completion calculation (10 fields from edit form)
    const profileFields = [
        !!coverPreview,
        !!logoPreview,
        mediaImages.length > 0,
        !!businessName,
        !!bio,
        !!contactNumber,
        !!instagramUrl,
        !!facebookUrl,
        !!websiteUrl,
        !!address,
    ];
    const completedCount = profileFields.filter(Boolean).length;
    const progressPercent = Math.round((completedCount / profileFields.length) * 100);
    const remaining = profileFields.length - completedCount;

    // Shared profile-completion card (used by both view + edit sidebars)
    const completionCard = (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Profile Completion</span>
                <span className="text-sm font-black text-gray-900">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-tlb-yellow rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                {progressPercent === 100
                    ? <span className="text-emerald-500 font-bold">All set — your profile is 100% complete 🎉</span>
                    : `${remaining} field${remaining !== 1 ? 's' : ''} left to complete your brand profile.`}
            </p>
        </div>
    );

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            if (bio) formData.append('bio', bio);
            if (contactNumber) formData.append('contact_number', contactNumber);
            if (address) formData.append('address', address);
            if (logoFile) formData.append('logo', logoFile);
            if (coverFile) formData.append('cover_image', coverFile);
            operatingCities.forEach(city => formData.append('operating_cities', city));

            const profileData = {
                business_name: businessName,
                instagram_url: instagramUrl,
                facebook_url: facebookUrl,
                website_url: websiteUrl
            };
            
            const profileChanged = !initialProfileData || 
                initialProfileData.business_name !== profileData.business_name ||
                initialProfileData.instagram_url !== profileData.instagram_url ||
                initialProfileData.facebook_url !== profileData.facebook_url ||
                initialProfileData.website_url !== profileData.website_url;

            const promises: Promise<any>[] = [updateExtendedProfile(formData)];
            
            if (profileChanged) {
                promises.push(
                    updateBusinessProfile(profileData).catch(err => {
                        if (err.message?.toLowerCase().includes('locked')) {
                            toast.warning('Core brand details (name/socials) are locked after verification, but other changes were saved.');
                        } else {
                            throw err;
                        }
                    })
                );
            }

            await Promise.all(promises);
            // Refresh initial data so subsequent saves don't think it changed if we bypassed it
            if (profileChanged) {
                setInitialProfileData(profileData);
            }
            setIsEditing(false);
        } catch (err: any) {
            console.error('Save error', err);
            toast.error(`Failed to save profile: ${err.message || err}`);
        } finally {
            setSaving(false);
        }
    };

    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];

    const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploadingMedia(true);
        try {
            const files = e.target.files;
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
                    toast.warning(`${file.name}: unsupported format. Use JPG or PNG.`);
                    continue;
                }
                if (file.size > 5 * 1024 * 1024) {
                    toast.warning(`${file.name} is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 5MB.`);
                    continue;
                }
                const res = await uploadPartnerMedia(file, 'image');
                const data = res.data || res;
                setMediaImages(prev => [...prev, data]);
            }
        } catch (err: any) {
            console.error('Image upload failed', err);
            toast.error(err?.message || 'Could not upload image. Please try again.');
        }
        finally { setUploadingMedia(false); e.target.value = ''; }
    };

    const handleAddVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        if (file.type && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
            toast.warning(`${file.name}: unsupported format. Use MP4 or MOV.`);
            e.target.value = '';
            return;
        }
        if (file.size > 100 * 1024 * 1024) {
            toast.warning(`${file.name} is too large (${(file.size / 1024 / 1024).toFixed(0)}MB). Max is 100MB.`);
            e.target.value = '';
            return;
        }
        setUploadingMedia(true);
        try {
            const res = await uploadPartnerMedia(file, 'video');
            setMediaVideo(res.data || res);
        } catch (err: any) {
            console.error('Video upload failed', err);
            toast.error(err?.message || 'Could not upload video. Please try again.');
        }
        finally { setUploadingMedia(false); e.target.value = ''; }
    };

    const handleDeleteMedia = async (id: number, type: 'image' | 'video') => {
        try {
            await deletePartnerMedia(id);
            if (type === 'image') setMediaImages(prev => prev.filter(m => m.id !== id));
            else setMediaVideo(null);
        } catch { toast.error('Delete failed.'); }
    };

    if (loading) {
        return <SkeletonProfile />;
    }

    return (
        <div className="min-h-screen bg-[#FDFCF8] pb-8">
            <header className="bg-white/95 backdrop-blur-sm px-4 sm:px-6 py-4 flex items-center justify-between gap-3 sticky top-0 z-30 border-b border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => isEditing ? setIsEditing(false) : onNavigate('HOME')}
                        className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors shrink-0"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="tlb-page-title truncate">{isEditing ? 'Edit Profile' : 'Brand Profile'}</h1>
                        <p className="tlb-page-sub hidden sm:block">{isEditing ? 'Update how customers see your brand' : 'Your public-facing brand identity'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => onNavigate('PREVIEW_PROFILE')} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-bold text-xs px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                        <Eye size={15} /> <span className="hidden sm:inline">Preview</span>
                    </button>
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="tlb-button px-4 py-2 text-xs gap-1.5">
                            <Edit3 size={15} /> Edit
                        </button>
                    ) : (
                        <button onClick={handleSave} disabled={saving} className={`tlb-button px-4 py-2 text-xs gap-1.5 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Save size={15} /> {saving ? 'Saving…' : 'Save'}
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {!isEditing ? (
                    /* ── VIEW MODE ── */
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Main column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Hero card */}
                            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                                <div className="h-40 sm:h-52 relative">
                                    {coverPreview ? (
                                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">No Cover Photo</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                                <div className="px-5 sm:px-6 pb-6">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-xl -mt-10 relative z-10 bg-white">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-tlb-yellow/10 flex items-center justify-center text-tlb-yellow font-black text-3xl">
                                                {businessName.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <h2 className="text-2xl font-black text-gray-900">{businessName || 'Your Business Name'}</h2>
                                        {businessName && <CheckCircle2 size={18} className="text-tlb-yellow fill-tlb-yellow shrink-0" />}
                                    </div>
                                    {bio ? (
                                        <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-2xl">{bio}</p>
                                    ) : (
                                        <p className="text-sm text-gray-300 mt-2 italic">No bio yet — add one so customers know your story.</p>
                                    )}
                                    {operatingCities.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-4">
                                            {operatingCities.map(city => (
                                                <span key={city} className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
                                                    <MapPin size={11} className="text-tlb-yellow" /> {city}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Gallery */}
                            {mediaImages.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Images size={16} className="text-gray-400" />
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gallery</p>
                                        <span className="text-[11px] font-bold text-gray-300">{mediaImages.length}</span>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {mediaImages.map((img) => (
                                            <div key={img.id} className="aspect-square rounded-xl overflow-hidden bg-gray-50">
                                                <img src={img.file_url || img.file} alt="Gallery" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
                            {completionCard}

                            {/* Contact & links */}
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact &amp; Links</p>
                                </div>
                                {(contactNumber || instagramUrl || facebookUrl || websiteUrl || address) ? (
                                    <div className="divide-y divide-gray-50">
                                        {contactNumber && <DetailRow icon={<Phone size={15} className="text-gray-400" />} value={contactNumber} />}
                                        {instagramUrl && <DetailRow icon={<Instagram size={15} className="text-pink-500" />} value={instagramUrl} />}
                                        {facebookUrl && <DetailRow icon={<Link2 size={15} className="text-blue-500" />} value={facebookUrl} />}
                                        {websiteUrl && <DetailRow icon={<Globe size={15} className="text-gray-400" />} value={websiteUrl} />}
                                        {address && <DetailRow icon={<MapPin size={15} className="text-tlb-yellow" />} value={address} />}
                                    </div>
                                ) : (
                                    <button onClick={() => setIsEditing(true)} className="w-full px-5 py-6 text-center text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
                                        No contact details yet — add them
                                    </button>
                                )}
                            </div>
                        </aside>
                    </div>
                ) : (
                    /* ── EDIT MODE ── */
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Form column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Visual Assets */}
                            <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5">
                                <SectionHead icon={<Camera size={18} />} title="Visual Assets" sub="Cover, logo & portfolio gallery" />

                                {/* Cover Photo */}
                                <label className="relative rounded-xl overflow-hidden h-40 sm:h-48 bg-gray-50 border-2 border-dashed border-gray-200 hover:border-tlb-yellow/40 group cursor-pointer block transition-colors">
                                    {coverPreview ? (
                                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-1">
                                            <Upload size={28} />
                                            <span className="text-[11px] font-bold">Upload cover photo</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-white/90 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold">
                                            <Upload size={16} /> Change Cover
                                        </div>
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setCoverFile(e.target.files[0]);
                                            setCoverPreview(URL.createObjectURL(e.target.files[0]));
                                        }
                                    }} />
                                </label>

                                {/* Logo */}
                                <div className="flex items-center gap-4">
                                    <label className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-tlb-yellow/30 bg-tlb-yellow/5 flex items-center justify-center relative group cursor-pointer shrink-0">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera size={24} className="text-tlb-yellow" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera size={20} className="text-white" />
                                        </div>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setLogoFile(e.target.files[0]);
                                                setLogoPreview(URL.createObjectURL(e.target.files[0]));
                                            }
                                        }} />
                                    </label>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Studio Logo</p>
                                        <p className="text-xs text-gray-400">Square image, min 200×200px</p>
                                    </div>
                                </div>

                                {/* Portfolio Gallery */}
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Portfolio Gallery</label>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        <label className={`aspect-square bg-tlb-yellow/10 rounded-xl border-2 border-dashed border-tlb-yellow/30 flex flex-col items-center justify-center text-tlb-yellow cursor-pointer hover:bg-tlb-yellow/20 transition-colors ${uploadingMedia ? 'opacity-50' : ''}`}>
                                            <Camera size={20} />
                                            <span className="text-[10px] font-bold mt-1">Add Photo</span>
                                            <input type="file" multiple accept="image/png,image/jpeg" className="hidden" onChange={handleAddImage} disabled={uploadingMedia} />
                                        </label>
                                        {!mediaVideo && (
                                            <label className={`aspect-square bg-tlb-yellow/10 rounded-xl border-2 border-dashed border-tlb-yellow/30 flex flex-col items-center justify-center text-tlb-yellow cursor-pointer hover:bg-tlb-yellow/20 transition-colors ${uploadingMedia ? 'opacity-50' : ''}`}>
                                                <Play size={20} />
                                                <span className="text-[10px] font-bold mt-1">Add Video</span>
                                                <input type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={handleAddVideo} disabled={uploadingMedia} />
                                            </label>
                                        )}
                                        {mediaImages.map((img) => (
                                            <div key={img.id} className="aspect-square rounded-xl overflow-hidden relative group bg-gray-50">
                                                <img src={img.file_url || img.file} alt="Gallery" className="w-full h-full object-cover" />
                                                <button onClick={() => handleDeleteMedia(img.id, 'image')} className="absolute top-1 right-1 bg-white/90 p-1 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {mediaVideo && (
                                            <div className="aspect-square rounded-xl overflow-hidden relative group bg-gray-900 flex items-center justify-center">
                                                <Play size={24} className="text-white" />
                                                <button onClick={() => handleDeleteMedia(mediaVideo.id, 'video')} className="absolute top-1 right-1 bg-white/90 p-1 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Business Info */}
                            <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5">
                                <SectionHead icon={<Building2 size={18} />} title="Business Info" sub="Name, story & contact number" />
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Studio / Brand Name</label>
                                    <input className="tlb-input w-full" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your brand name" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">About Us</label>
                                    <textarea className="tlb-input w-full min-h-[140px] resize-y" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell your story — what makes your studio special?"></textarea>
                                    <p className="text-xs text-gray-300 mt-1">This will be visible on your public profile page.</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Contact Number</label>
                                    <input className="tlb-input w-full" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+91 98765 43210" />
                                </div>
                            </section>

                            {/* Digital Reach */}
                            <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5">
                                <SectionHead icon={<Share2 size={18} />} title="Digital Reach" sub="Where customers find you online" />
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 focus-within:border-tlb-yellow focus-within:bg-white transition-colors">
                                        <Instagram size={18} className="text-pink-500 shrink-0" />
                                        <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Instagram URL" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} />
                                    </div>
                                    <div className="flex items-center gap-3 border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 focus-within:border-tlb-yellow focus-within:bg-white transition-colors">
                                        <Link2 size={18} className="text-blue-500 shrink-0" />
                                        <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Facebook Page" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} />
                                    </div>
                                    <div className="flex items-center gap-3 border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 focus-within:border-tlb-yellow focus-within:bg-white transition-colors">
                                        <Globe size={18} className="text-gray-400 shrink-0" />
                                        <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Website" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
                                    </div>
                                </div>
                            </section>

                            {/* Location */}
                            <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5">
                                <SectionHead icon={<MapPin size={18} />} title="Location" sub="Where your studio is based" />
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Written Address</label>
                                    <textarea className="tlb-input w-full min-h-[80px] resize-y" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address of your studio or teaching space..."></textarea>
                                </div>
                            </section>
                        </div>

                        {/* Sidebar: live preview + completion + actions */}
                        <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
                            {/* Live preview */}
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="px-5 py-3 border-b border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Preview</p>
                                </div>
                                <div className="h-20 bg-gradient-to-br from-gray-100 to-gray-200 relative">
                                    {coverPreview && <img src={coverPreview} className="w-full h-full object-cover" alt="" />}
                                </div>
                                <div className="px-4 pb-4">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow -mt-6 relative bg-white">
                                        {logoPreview
                                            ? <img src={logoPreview} className="w-full h-full object-cover" alt="" />
                                            : <div className="w-full h-full bg-tlb-yellow/10 flex items-center justify-center text-tlb-yellow font-black">{businessName.charAt(0) || '?'}</div>}
                                    </div>
                                    <p className="font-black text-sm mt-2 text-gray-900 truncate">{businessName || 'Your Business Name'}</p>
                                    <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">{bio || 'Your bio will appear here.'}</p>
                                </div>
                            </div>

                            {completionCard}

                            <div className="flex flex-col gap-2">
                                <button onClick={handleSave} disabled={saving} className={`tlb-button w-full py-3 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <Save size={18} /> {saving ? 'Saving…' : 'Save Profile'}
                                </button>
                                <button onClick={() => setIsEditing(false)} className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center justify-center gap-1.5 transition-colors">
                                    <X size={14} /> Cancel
                                </button>
                            </div>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
};
