import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Camera, Link2, Save, MapPin, Eye, Upload, Play, Trash2,
    Edit3, Phone, Globe, CheckCircle2,
} from 'lucide-react';
import { Screen } from '../../types';
import { getBusinessProfile, getExtendedProfile, updateExtendedProfile, updateBusinessProfile, getPartnerMedia, uploadPartnerMedia, deletePartnerMedia } from '../../api/onboarding';
import { SkeletonProfile, toast } from '../../components/ui';

const Instagram = ({ size, className }: { size: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
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
                    if (e.logo) setLogoPreview(e.logo);
                    if (e.cover_image) setCoverPreview(e.cover_image);
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
        } catch (err) {
            console.error('Save error', err);
            toast.error('Failed to save profile.');
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
            <header className="bg-white p-4 sm:p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                <button
                    onClick={() => isEditing ? setIsEditing(false) : onNavigate('HOME')}
                    className="p-2 -ml-2"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="tlb-page-title">{isEditing ? 'Edit Profile' : 'Brand Profile'}</h1>
                <button onClick={() => onNavigate('PREVIEW_PROFILE')} className="flex items-center gap-1.5 text-tlb-yellow font-black text-sm uppercase tracking-widest">
                    <Eye size={16} /> Preview
                </button>
            </header>

            <main className="px-4 sm:px-6 py-6">
                {!isEditing ? (
                    /* ── VIEW MODE ── */
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                            <div className="h-36 bg-gray-100 relative">
                                {coverPreview ? (
                                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">No Cover Photo</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>
                            <div className="px-6 pb-6">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border-4 border-white shadow-xl -mt-8 relative z-10 bg-white">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-tlb-yellow/10 flex items-center justify-center text-tlb-yellow font-black text-2xl">
                                            {businessName.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <h2 className="text-xl font-black">{businessName || 'Your Business Name'}</h2>
                                    {businessName && <CheckCircle2 size={16} className="text-tlb-yellow fill-tlb-yellow shrink-0" />}
                                </div>
                                {bio && <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-3">{bio}</p>}
                            </div>
                        </div>

                        {/* Profile Details */}
                        <div className="space-y-2">
                            {contactNumber && (
                                <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
                                    <Phone size={16} className="text-gray-400 shrink-0" />
                                    <span className="text-sm text-gray-700">{contactNumber}</span>
                                </div>
                            )}
                            {instagramUrl && (
                                <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
                                    <Instagram size={16} className="text-pink-500 shrink-0" />
                                    <span className="text-sm text-gray-700 truncate">{instagramUrl}</span>
                                </div>
                            )}
                            {facebookUrl && (
                                <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
                                    <Link2 size={16} className="text-blue-500 shrink-0" />
                                    <span className="text-sm text-gray-700 truncate">{facebookUrl}</span>
                                </div>
                            )}
                            {websiteUrl && (
                                <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
                                    <Globe size={16} className="text-gray-400 shrink-0" />
                                    <span className="text-sm text-gray-700 truncate">{websiteUrl}</span>
                                </div>
                            )}
                            {address && (
                                <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-start gap-3">
                                    <MapPin size={16} className="text-tlb-yellow shrink-0 mt-0.5" />
                                    <span className="text-sm text-gray-700">{address}</span>
                                </div>
                            )}
                        </div>

                        {/* Gallery Preview */}
                        {mediaImages.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Gallery</p>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {mediaImages.slice(0, 6).map((img) => (
                                        <div key={img.id} className="w-20 h-20 shrink-0 rounded-xl overflow-hidden">
                                            <img src={img.file_url || img.file} alt="Gallery" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    {mediaImages.length > 6 && (
                                        <div className="w-20 h-20 shrink-0 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold">
                                            +{mediaImages.length - 6}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Edit Profile Button */}
                        <button
                            onClick={() => setIsEditing(true)}
                            className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20 text-base gap-3"
                        >
                            <Edit3 size={20} /> Edit Profile
                        </button>

                        {/* Profile Completion Progress Bar */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-100">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Profile Completion</span>
                                <span className="text-sm font-black text-tlb-yellow">{progressPercent}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-tlb-yellow rounded-full transition-all duration-700"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            {progressPercent < 100 && (
                                <p className="text-xs text-gray-400 mt-2">
                                    {profileFields.length - completedCount} field{profileFields.length - completedCount !== 1 ? 's' : ''} remaining — click Edit Profile to complete.
                                </p>
                            )}
                            {progressPercent === 100 && (
                                <p className="text-xs text-emerald-500 font-bold mt-2">Your profile is 100% complete!</p>
                            )}
                        </div>
                    </div>
                ) : (
                    /* ── EDIT MODE ── */
                    <div className="space-y-8">
                        {/* Visual Assets */}
                        <section className="space-y-5">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🎨</span>
                                <h3 className="font-black text-xl">Visual Assets</h3>
                            </div>

                            {/* Cover Photo */}
                            <label className="relative rounded-2xl overflow-hidden h-48 bg-gray-100 border-2 border-dashed border-gray-200 group cursor-pointer block">
                                {coverPreview ? (
                                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Upload size={32} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="bg-white/90 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold">
                                        <Upload size={16} /> Change Cover Photo
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
                                <label className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-tlb-yellow/30 bg-tlb-yellow/5 flex items-center justify-center relative group cursor-pointer">
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
                                    <p className="font-bold text-sm">Studio Logo</p>
                                    <p className="text-xs text-gray-400">Square image, min 200×200px</p>
                                </div>
                            </div>

                            {/* Portfolio Gallery */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Portfolio Gallery</label>
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    <label className={`w-28 h-28 shrink-0 bg-tlb-yellow/10 rounded-2xl border-2 border-dashed border-tlb-yellow/30 flex flex-col items-center justify-center text-tlb-yellow cursor-pointer hover:bg-tlb-yellow/20 transition-colors ${uploadingMedia ? 'opacity-50' : ''}`}>
                                        <Camera size={22} />
                                        <span className="text-[10px] font-bold mt-1">Add Photo</span>
                                        <input type="file" multiple accept="image/png,image/jpeg" className="hidden" onChange={handleAddImage} disabled={uploadingMedia} />
                                    </label>
                                    {!mediaVideo && (
                                        <label className={`w-28 h-28 shrink-0 bg-tlb-yellow/10 rounded-2xl border-2 border-dashed border-tlb-yellow/30 flex flex-col items-center justify-center text-tlb-yellow cursor-pointer hover:bg-tlb-yellow/20 transition-colors ${uploadingMedia ? 'opacity-50' : ''}`}>
                                            <Play size={22} />
                                            <span className="text-[10px] font-bold mt-1">Add Video</span>
                                            <input type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={handleAddVideo} disabled={uploadingMedia} />
                                        </label>
                                    )}
                                    {mediaImages.map((img) => (
                                        <div key={img.id} className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden shadow-sm relative group">
                                            <img src={img.file_url || img.file} alt="Gallery" className="w-full h-full object-cover" />
                                            <button onClick={() => handleDeleteMedia(img.id, 'image')} className="absolute top-1 right-1 bg-white/80 p-1 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {mediaVideo && (
                                        <div className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden shadow-sm relative group bg-gray-900 flex items-center justify-center">
                                            <Play size={24} className="text-white" />
                                            <button onClick={() => handleDeleteMedia(mediaVideo.id, 'video')} className="absolute top-1 right-1 bg-white/80 p-1 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Business Info */}
                        <section className="space-y-5">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">📝</span>
                                <h3 className="font-black text-xl">Business Info</h3>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Studio / Brand Name</label>
                                <input className="tlb-input w-full" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your brand name" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">About Us</label>
                                <textarea className="tlb-input w-full min-h-[140px] resize-y" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell your story — what makes your studio special?"></textarea>
                                <p className="text-xs text-gray-300 mt-1">This will be visible on your public profile page.</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Contact Number</label>
                                <input className="tlb-input w-full" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+91 98765 43210" />
                            </div>
                        </section>

                        {/* Digital Reach */}
                        <section className="space-y-5">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🔗</span>
                                <h3 className="font-black text-xl">Digital Reach</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 border border-gray-100 bg-white rounded-2xl px-4 py-3">
                                    <Link2 size={18} className="text-gray-300" />
                                    <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Instagram URL" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} />
                                </div>
                                <div className="flex items-center gap-3 border border-gray-100 bg-white rounded-2xl px-4 py-3">
                                    <Link2 size={18} className="text-gray-300" />
                                    <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Facebook Page" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} />
                                </div>
                                <div className="flex items-center gap-3 border border-gray-100 bg-white rounded-2xl px-4 py-3">
                                    <Link2 size={18} className="text-gray-300" />
                                    <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Website" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
                                </div>
                            </div>
                        </section>

                        {/* Location */}
                        <section className="space-y-5">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">📍</span>
                                <h3 className="font-black text-xl">Location</h3>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Written Address</label>
                                <textarea className="tlb-input w-full min-h-[80px] resize-y" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address of your studio or teaching space..."></textarea>
                            </div>
                        </section>

                        {/* Save Button */}
                        <button onClick={handleSave} disabled={saving} className={`tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Save size={20} /> {saving ? 'Saving...' : 'Save Profile'}
                        </button>

                        <p className="text-center text-gray-300 text-[10px] font-bold tracking-widest uppercase">
                            TLB Partner Portal V3.0
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};
