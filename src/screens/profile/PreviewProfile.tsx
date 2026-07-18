import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Mail, CheckCircle2, Star, Play, Phone, Globe } from 'lucide-react';
import { SkeletonProfile } from '../../components/ui';
import { Screen } from '../../types';
import { getBusinessProfile, getExtendedProfile, getPartnerMedia } from '../../api/onboarding';

const Instagram = ({ size, className }: { size: number, className?: string }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>;

interface ProfileProps {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

type Tab = 'about' | 'services' | 'gallery';

export const PreviewProfile: React.FC<ProfileProps> = ({ onNavigate, onOpenSidebar }) => {
    const [activeTab, setActiveTab] = useState<Tab>('about');
    const [loading, setLoading] = useState(true);

    // API data
    const [profile, setProfile] = useState<any>({});
    const [extProfile, setExtProfile] = useState<any>({});
    const [mediaImages, setMediaImages] = useState<any[]>([]);
    const [mediaVideo, setMediaVideo] = useState<any | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, extRes, mediaRes] = await Promise.allSettled([
                    getBusinessProfile(),
                    getExtendedProfile(),
                    getPartnerMedia(),
                ]);

                if (profileRes.status === 'fulfilled') {
                    setProfile(profileRes.value.data || profileRes.value);
                }
                if (extRes.status === 'fulfilled') {
                    setExtProfile(extRes.value.data || extRes.value);
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
                console.error('Preview fetch error', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const tabs: { id: Tab; label: string }[] = [
        { id: 'about', label: 'About' },
        { id: 'services', label: 'Services' },
        { id: 'gallery', label: 'Gallery' },
    ];

    const businessName = profile.business_name || 'Your Business';
    const baseCity = profile.base_city || '';
    const bio = extProfile.bio || '';
    const coverImage = extProfile.cover_image || '';
    const logoImage = extProfile.logo || '';
    const address = extProfile.address || '';
    const instagramUrl = profile.instagram_url || '';
    const websiteUrl = profile.website_url || '';

    if (loading) {
        return <SkeletonProfile />;
    }

    return (
    <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white p-4 sm:p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            <button onClick={() => onNavigate('BRAND_PROFILE')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
            <h1 className="tlb-page-title">Public Profile Preview</h1>
            <div className="w-10" />
        </header>

        <main className="px-4 sm:px-6 py-6">
            <div className="tlb-content space-y-6">
                {/* Banner notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center text-xs font-bold text-amber-700">
                    👁️ This is how your profile appears to the public
                </div>

                {/* Cover + Profile */}
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="h-40 sm:h-52 relative bg-gray-100">
                        {coverImage ? (
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No cover image</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                    <div className="px-6 pb-6 relative">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-xl -mt-10 relative z-10 bg-white">
                            {logoImage ? (
                                <img src={logoImage} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-tlb-yellow/10 flex items-center justify-center text-tlb-yellow font-black text-2xl">
                                    {businessName.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="mt-3 flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-black">{businessName}</h2>
                                    <CheckCircle2 size={18} className="text-tlb-yellow fill-tlb-yellow" />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{baseCity ? `${baseCity}, India` : 'Location not set'}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button className="bg-gray-100 text-gray-400 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-not-allowed opacity-60">
                                <Mail size={16} /> Enquire Now
                            </button>
                            <button className="bg-gray-50 px-3 py-2.5 rounded-xl text-gray-300 cursor-not-allowed opacity-60">
                                <Phone size={16} />
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-300 mt-2 italic">* Enquiry buttons are disabled in preview mode</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-white rounded-2xl p-1.5 border border-gray-100">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                activeTab === tab.id
                                    ? 'bg-tlb-yellow text-tlb-dark shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'about' && (
                    <div className="space-y-6">
                        {/* Bio */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100">
                            <h3 className="font-bold text-base mb-3">About Us</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {bio || 'No bio added yet. Edit your profile to add a description.'}
                            </p>
                        </div>

                        {/* Social Links */}
                        {(instagramUrl || websiteUrl) && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                <h3 className="font-bold text-base mb-3">Connect With Us</h3>
                                <div className="flex gap-3">
                                    {instagramUrl && (
                                        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-3 rounded-xl hover:opacity-80 transition-opacity">
                                            <Instagram size={20} />
                                        </a>
                                    )}
                                    {websiteUrl && (
                                        <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-500 text-white p-3 rounded-xl hover:opacity-80 transition-opacity">
                                            <Globe size={20} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Address */}
                        {address && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <MapPin size={14} className="text-tlb-yellow" /> {address}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'services' && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 text-center">
                            <p className="text-sm text-gray-400">
                                Your services will appear here once you create listings.
                            </p>
                            <button onClick={() => onNavigate('CREATE_CLASS_IDENTITY')} className="mt-4 bg-tlb-yellow text-tlb-dark px-6 py-2 rounded-xl text-sm font-bold">
                                Create Your First Listing
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'gallery' && (
                    <div className="space-y-4">
                        {mediaImages.length === 0 && !mediaVideo ? (
                            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 text-center">
                                <p className="text-sm text-gray-400">No media uploaded yet. Add photos and videos from your Brand Profile.</p>
                            </div>
                        ) : (
                            <>
                                {/* Photo grid */}
                                {mediaImages.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {mediaImages.map((img, i) => (
                                            <div key={img.id} className="aspect-square rounded-2xl overflow-hidden shadow-sm relative group">
                                                <img src={img.file_url || img.file} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                {i === 0 && (
                                                    <div className="absolute top-2 right-2 bg-tlb-yellow p-1.5 rounded-lg shadow">
                                                        <Star size={12} className="text-tlb-dark" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Video */}
                                {mediaVideo && (
                                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                                        <div className="h-48 relative bg-gray-900 flex items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                                                <Play size={28} className="text-tlb-dark ml-1" />
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <p className="text-sm font-bold">Studio Video</p>
                                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Partner Video</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </main>
    </div>
    );
};
