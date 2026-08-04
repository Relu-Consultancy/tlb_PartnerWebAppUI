import React, { useState, useRef, useEffect } from 'react';
import { Menu, Sparkles, CalendarDays, UserCircle, LogOut, Edit3, Eye } from 'lucide-react';
import { Screen } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { LatestListings, BookingsCalendar } from './ui';
import { getCurrentPartner, getBusinessProfile, getExtendedProfile, getPartnerFollowerCount } from '../api/onboarding';
import { usePartner } from '../context/PartnerContext';

interface TopHeaderProps {
    onOpenSidebar: () => void;
    onNavigate: (screen: Screen) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenSidebar, onNavigate }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [activePopup, setActivePopup] = useState<'latest' | 'calendar' | null>(null);

    const { allowedEntities } = usePartner();
    const [partnerData, setPartnerData] = useState<any>(null);
    const [profileData, setProfileData] = useState<any>(null);
    const [extendedData, setExtendedData] = useState<any>(null);
    const [followerCount, setFollowerCount] = useState<number | null>(null);

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [partnerRes, profileRes, extRes] = await Promise.allSettled([
                    getCurrentPartner(),
                    getBusinessProfile(),
                    getExtendedProfile()
                ]);
                let pId = null;
                if (partnerRes.status === 'fulfilled') {
                    const data = partnerRes.value.data || partnerRes.value;
                    setPartnerData(data);
                    pId = data.id;
                }
                if (profileRes.status === 'fulfilled') {
                    setProfileData(profileRes.value.data || profileRes.value);
                }
                if (extRes.status === 'fulfilled') {
                    setExtendedData(extRes.value.data || extRes.value);
                }
                if (pId) {
                    getPartnerFollowerCount(pId)
                        .then(res => setFollowerCount((res?.data ?? res)?.follower_count ?? 0))
                        .catch(() => {});
                }
            } catch (err) {}
        };
        fetchInitial();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    const checklist = [
        { label: 'Upload a logo', done: !!extendedData?.logo },
        { label: 'Upload a cover photo', done: !!(extendedData?.cover_image || extendedData?.cover_image_url || extendedData?.cover) },
        { label: 'Add your bio', done: !!extendedData?.bio },
        { label: 'Add contact number', done: !!extendedData?.contact_number },
        { label: 'Set your business name', done: !!(profileData?.business_name || partnerData?.business_name) },
    ];
    const profileCompletion = (() => {
        const filled = checklist.filter(c => c.done).length;
        if (filled === 0 && !extendedData && !profileData)
            return partnerData?.profile_completion ?? 0;
        return Math.round((filled / checklist.length) * 100);
    })();

    const isVerified = partnerData?.verification_status === 'approved' || profileData?.status === 'approved';
    const verificationSubmitted = partnerData?.verification_status === 'under_review' || profileData?.status === 'under_review';
    const isActive = partnerData?.status === 'activated_limited' || partnerData?.status === 'under_review' || partnerData?.status === 'approved' || profileData?.status === 'approved';

    return (
        <header className="bg-white px-6 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 border-b border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
                <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors lg:hidden">
                    <Menu size={22} className="text-gray-700" />
                </button>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
                <button
                    onClick={() => setActivePopup('latest')}
                    title="Latest Listings"
                    className="p-2.5 border border-gray-200 hover:bg-gray-50 rounded-[14px] transition-colors text-gray-400 hover:text-gray-700 shadow-sm"
                >
                    <Sparkles size={18} strokeWidth={2.5} />
                </button>

                <button
                    onClick={() => setActivePopup('calendar')}
                    title="Bookings Calendar"
                    className="p-2.5 border border-gray-200 hover:bg-gray-50 rounded-[14px] transition-colors text-gray-400 hover:text-gray-700 shadow-sm"
                >
                    <CalendarDays size={18} strokeWidth={2.5} />
                </button>

                <NotificationCenter variant="light" onNavigate={onNavigate} />

                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setMenuOpen(!menuOpen)} 
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border border-gray-100 ${menuOpen ? 'bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                        title="Account Profile"
                    >
                        {extendedData?.logo ? (
                            <img src={extendedData.logo} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <UserCircle size={22} className="text-gray-500" strokeWidth={2.5} />
                        )}
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 origin-top-right transition-all">
                            {/* Dark header */}
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 ring-2 ring-white/20 overflow-hidden">
                                        {extendedData?.logo
                                            ? <img src={extendedData.logo} alt="logo" className="w-12 h-12 object-cover" />
                                            : <UserCircle size={26} />
                                        }
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-black text-sm text-white truncate">{profileData?.business_name || partnerData?.business_name || 'Your Business'}</p>
                                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{partnerData?.email || partnerData?.phone || ''}</p>
                                    </div>
                                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${
                                        isVerified ? 'bg-emerald-500/20 text-emerald-400' :
                                        verificationSubmitted ? 'bg-blue-500/20 text-blue-400' :
                                        isActive ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-white/10 text-gray-400'
                                    }`}>
                                        {isVerified ? 'Verified' : verificationSubmitted ? 'In Review' : isActive ? 'Active' : 'Pending'}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Stats */}
                            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                                <div className="px-3 py-3 text-center">
                                    <p className="text-base font-black text-gray-900">{profileCompletion}%</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Profile</p>
                                </div>
                                <div className="px-3 py-3 text-center">
                                    <p className="text-base font-black text-gray-900">{allowedEntities.length}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Services</p>
                                </div>
                                <div className="px-3 py-3 text-center">
                                    <p className="text-base font-black text-gray-900">{followerCount === null ? '-' : followerCount.toLocaleString('en-IN')}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Followers</p>
                                </div>
                            </div>
                            
                            {/* Entity chips */}
                            {allowedEntities.length > 0 && (
                                <div className="px-4 py-3 flex flex-wrap gap-1.5 border-b border-gray-100">
                                    {allowedEntities.map(e => {
                                        const c = e === 'EVENT' ? 'bg-blue-50 text-blue-600' : e === 'CLASS' ? 'bg-purple-50 text-purple-600' : e === 'PROGRAM' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600';
                                        return <span key={e} className={`text-[9px] font-black uppercase tracking-wide px-2.5 py-1 rounded-md ${c}`}>{e}</span>;
                                    })}
                                </div>
                            )}
                            
                            {/* Actions */}
                            <div className="p-2">
                                <button onClick={() => { setMenuOpen(false); onNavigate('ACCOUNTS'); }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                                    <UserCircle size={14} className="text-gray-400" /> Accounts
                                </button>
                                <button onClick={() => { setMenuOpen(false); onNavigate('BRAND_PROFILE'); }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                                    <Edit3 size={14} className="text-gray-400" /> Edit Profile
                                </button>
                                <button onClick={() => { setMenuOpen(false); onNavigate('PREVIEW_PROFILE'); }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                                    <Eye size={14} className="text-gray-400" /> Preview Profile
                                </button>
                                <div className="my-1 border-t border-gray-100" />
                                <button onClick={() => { setMenuOpen(false); onNavigate('LANDING'); }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                                    <LogOut size={14} /> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {activePopup && (
                <div
                    className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-20 bg-black/40 backdrop-blur-sm"
                    onClick={() => setActivePopup(null)}
                >
                    <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                        {activePopup === 'latest' ? (
                            <LatestListings
                                onClose={() => setActivePopup(null)}
                                onViewAll={() => { setActivePopup(null); onNavigate('SERVICE_LISTINGS'); }}
                            />
                        ) : (
                            <BookingsCalendar
                                onClose={() => setActivePopup(null)}
                                onViewAll={() => { setActivePopup(null); onNavigate('BOOKINGS'); }}
                            />
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};
