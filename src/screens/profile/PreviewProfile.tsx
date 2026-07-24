import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Star, Users, CalendarDays, Share2, Image as ImageIcon } from 'lucide-react';
import { SkeletonProfile } from '../../components/ui';
import { Screen } from '../../types';
import { 
    getCurrentPartner, 
    getBusinessProfile, 
    getExtendedProfile, 
    getPartnerFollowerCount 
} from '../../api/onboarding';
import { getStatsReviews } from '../../api/stats';
import { 
    getClassListings, 
    getEventListings, 
    getProgramListings 
} from '../../api/listings';
import { usePartner } from '../../context/PartnerContext';

const API_BASE = 'https://tlb-api.reluconsultancy.in';
const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface ProfileProps {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

export const PreviewProfile: React.FC<ProfileProps> = ({ onNavigate }) => {
    const { allowedEntities } = usePartner();
    const [loading, setLoading] = useState(true);

    const [profile, setProfile] = useState<any>({});
    const [extProfile, setExtProfile] = useState<any>({});
    const [followersCount, setFollowersCount] = useState(0);
    const [avgRating, setAvgRating] = useState<number | null>(null);
    const [totalReviews, setTotalReviews] = useState(0);
    const [listings, setListings] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // We run these concurrently
                const [partnerRes, profileRes, extRes, statsRes] = await Promise.allSettled([
                    getCurrentPartner(),
                    getBusinessProfile(),
                    getExtendedProfile(),
                    getStatsReviews()
                ]);

                if (profileRes.status === 'fulfilled') {
                    setProfile(profileRes.value.data || profileRes.value);
                }
                if (extRes.status === 'fulfilled') {
                    setExtProfile(extRes.value.data || extRes.value);
                }
                if (statsRes.status === 'fulfilled') {
                    setAvgRating(statsRes.value.avg_rating);
                    setTotalReviews(statsRes.value.total_reviews || 0);
                }

                if (partnerRes.status === 'fulfilled') {
                    const pId = partnerRes.value?.id;
                    if (pId) {
                        try {
                            const count = await getPartnerFollowerCount(pId);
                            setFollowersCount(count || 0);
                        } catch (e) { }
                    }
                }

                // Fetch listings based on allowedEntities
                const listingPromises = [];
                if (allowedEntities.includes('CLASS')) listingPromises.push(getClassListings('active'));
                if (allowedEntities.includes('EVENT')) listingPromises.push(getEventListings('active'));
                if (allowedEntities.includes('PROGRAM')) listingPromises.push(getProgramListings('active'));

                const listingResults = await Promise.allSettled(listingPromises);
                const allListings: any[] = [];
                for (const res of listingResults) {
                    if (res.status === 'fulfilled') {
                        const data = res.value.data || res.value || [];
                        if (Array.isArray(data)) allListings.push(...data);
                    }
                }
                // Sort by ID descending (newest first)
                allListings.sort((a, b) => b.id - a.id);
                setListings(allListings.slice(0, 10)); // Take top 10

            } catch (err) {
                console.error('Preview fetch error', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [allowedEntities]);

    const businessName = profile.business_name || 'Your Business';
    const bio = extProfile.bio || 'No bio added yet. Edit your profile to add a description.';
    const coverImage = resolveUrl(extProfile.cover_image);
    const logoImage = resolveUrl(extProfile.logo);

    if (loading) {
        return <SkeletonProfile />;
    }

    const formatFollowers = (count: number) => {
        if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
        return String(count);
    };

    const getPrimaryLabel = () => {
        if (allowedEntities.includes('CLASS')) return 'Our Classes';
        if (allowedEntities.includes('EVENT')) return 'Our Events';
        if (allowedEntities.includes('PROGRAM')) return 'Our Programs';
        return 'Our Offerings';
    };

    const fmtDate = (d?: string) => {
        if (!d) return '';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return d;
        const datePart = dt.toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'short' });
        const timePart = dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
        return `${datePart} | ${timePart}`;
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-8">
            <div className="relative w-[360px] shrink-0 rounded-[2.5rem] border-[10px] border-gray-900 bg-white shadow-2xl flex flex-col h-[780px] max-h-[90vh] overflow-hidden">
                {/* iPhone notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-gray-900 rounded-b-2xl z-30" />

                <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
                    {/* Cover Banner */}
                    <div className="relative h-44 shrink-0">
                        {coverImage ? (
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#FFDE81] to-[#FFF4D9]" />
                        )}
                        <button 
                            onClick={() => onNavigate('BRAND_PROFILE')} 
                            className="absolute top-7 left-4 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-gray-800 transition-transform active:scale-95 z-20 hover:bg-gray-50"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <button 
                            className="absolute top-7 right-4 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-gray-800 transition-transform active:scale-95 z-20 hover:bg-gray-50"
                        >
                            <Share2 size={16} />
                        </button>
                    </div>

                    {/* Logo & Header */}
                    <div className="px-5 relative text-center">
                        <div className="w-24 h-24 rounded-full mx-auto -mt-12 relative shadow-lg bg-white border-4 border-white shrink-0">
                            {logoImage ? (
                                <img src={logoImage} alt="Logo" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-tlb-yellow/10 flex items-center justify-center text-tlb-yellow font-black text-3xl">
                                    {businessName.charAt(0)}
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 bg-white rounded-full">
                                <CheckCircle2 size={22} className="text-emerald-500 fill-white" />
                            </div>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mt-3 tracking-tight">{businessName}</h1>
                    </div>

                    <div className="mx-6 my-5 h-px bg-gray-100" />

                    {/* About */}
                    <div className="px-6">
                        <h2 className="text-[15px] font-bold text-gray-900 mb-2">About</h2>
                        <p className="text-[13px] text-gray-500 leading-relaxed font-medium">{bio}</p>
                    </div>

                    <div className="mx-6 my-6 h-px bg-gray-100" />

                    {/* Stats Row */}
                    <div className="px-6 grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center text-center">
                            <span className="text-xl font-black text-gray-900 tracking-tight">{formatFollowers(followersCount)}</span>
                            <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Followers</span>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="flex items-center gap-1">
                                <span className="text-xl font-black text-gray-900 tracking-tight">{avgRating ? avgRating.toFixed(1) : '—'}</span>
                                <Star size={14} className="text-[#FFDE81] fill-[#FFDE81] -mt-0.5" />
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Rating</span>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <span className="text-xl font-black text-gray-900 tracking-tight">{totalReviews}</span>
                            <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Reviews</span>
                        </div>
                    </div>

                    <div className="mx-6 my-6 h-px bg-gray-100" />

                    {/* Our Classes / Listings */}
                    <div className="pl-6 pb-6">
                        <div className="flex items-center justify-between pr-6 mb-0.5">
                            <h2 className="text-[15px] font-bold text-gray-900">{getPrimaryLabel()}</h2>
                            <button className="text-[11px] font-bold text-blue-500 flex items-center hover:opacity-80 transition-opacity">
                                See All <ChevronRightIcon size={12} className="ml-0.5" />
                            </button>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-4 pr-6 font-medium">shouldn't miss wonder fun experience!</p>

                        <div className="flex gap-4 overflow-x-auto pb-4 pr-6 snap-x custom-scrollbar">
                            {listings.length === 0 ? (
                                <div className="w-full bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 mr-6 snap-center">
                                    <p className="text-xs text-gray-400 font-medium">No active listings yet.</p>
                                </div>
                            ) : (
                                listings.map((listing, i) => {
                                    const cover = listing.media?.find((m: any) => m.media_type === 'cover')?.file_url;
                                    const age = listing.age_group ? `${listing.age_group.min_age}-${listing.age_group.max_age} Yrs` : 'All Ages';
                                    const dt = listing.start_datetime || listing.created_at;

                                    return (
                                        <div key={listing.id || i} className="w-[240px] shrink-0 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm snap-start">
                                            <div className="h-32 bg-gray-50 relative">
                                                {cover ? (
                                                    <img src={resolveUrl(cover)} alt="Cover" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                                        <ImageIcon size={24} />
                                                    </div>
                                                )}
                                                {/* Clip Icon (decorative from design) */}
                                                <div className="absolute top-3 left-3 opacity-80">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M14.321 4.79289C15.6543 3.45956 17.8151 3.45956 19.1484 4.79289C20.4817 6.12623 20.4817 8.28704 19.1484 9.62037L9.62024 19.1485C7.62014 21.1486 4.3769 21.1486 2.3768 19.1485C0.376698 17.1484 0.376698 13.9052 2.3768 11.9051L9.12354 5.15832C9.48962 4.79224 10.0832 4.79224 10.4493 5.15832C10.8154 5.5244 10.8154 6.11797 10.4493 6.48406L3.70258 13.2309C2.43632 14.4971 2.43632 16.55 3.70258 17.8163C4.96884 19.0825 7.02175 19.0825 8.28801 17.8163L17.8162 8.28812C18.4162 7.68813 18.4162 6.71518 17.8162 6.11519C17.2162 5.5152 16.2433 5.5152 15.6433 6.11519L7.42436 14.3341C7.05828 14.7002 6.46471 14.7002 6.09862 14.3341C5.73254 13.9681 5.73254 13.3745 6.09862 13.0084L14.321 4.79289Z" fill="#FACC15"/>
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="p-3.5">
                                                <h3 className="font-bold text-[13px] text-gray-900 truncate mb-2.5 tracking-tight">{listing.title}</h3>
                                                
                                                <div className="flex items-center justify-between mb-2.5">
                                                    <div className="flex items-center text-[10px] text-gray-500 font-medium">
                                                        <Star size={11} className="text-[#FFDE81] fill-[#FFDE81] mr-1" />
                                                        {listing.rating ? listing.rating.toFixed(1) : (avgRating ? avgRating.toFixed(1) : '—')} ({listing.review_count || totalReviews || 0})
                                                    </div>
                                                    <div className="flex items-center text-[10px] text-gray-500 font-medium">
                                                        <Users size={11} className="mr-1" />
                                                        {age}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-end justify-between mt-1 pt-1">
                                                    <div className="flex items-start text-[9px] text-gray-400 font-medium mt-1">
                                                        <CalendarDays size={11} className="mr-1.5 shrink-0 mt-0.5" />
                                                        <span className="leading-tight w-20 line-clamp-2">{fmtDate(dt)}</span>
                                                    </div>
                                                    <button className="bg-[#FFDE81] text-gray-900 text-[10px] font-bold px-3 py-1.5 rounded-full hover:brightness-95 transition-all">
                                                        View details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
            `}</style>
        </div>
    );
};

const ChevronRightIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);
