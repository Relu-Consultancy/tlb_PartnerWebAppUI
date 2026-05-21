import React, { useState, useRef, useEffect } from 'react';
import {
  Menu, Bell, UserCircle, CheckCircle2,
  Inbox, Eye, BarChart3, CreditCard, Plus, CalendarDays,
  Ticket, Users, Award, DollarSign, MapPin, Percent,
} from 'lucide-react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { EntityPickerSheet } from '../../components/EntityPickerSheet';
import { Loader, AreaSparkline, TrendBadge, fmtCurrency, trendPct } from '../../components/ui';
import {
  getPartnerDashboard, getCurrentPartner, getBusinessProfile,
  getExtendedProfile, getPartnerMedia, getPartnerFollowerCount
} from '../../api/onboarding';

// â”€â”€â”€ Types / Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ACTIVE_STATUSES = new Set(['activated_limited', 'under_review', 'approved']);
const VERIFICATION_SUBMITTED_STATUSES = new Set(['under_review', 'approved']);

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface HomeProps { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

export const Home: React.FC<HomeProps> = ({ onNavigate, onOpenSidebar }) => {
  const { allowedEntities, setAllowedEntities } = usePartner();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profilePopupRef = useRef<HTMLDivElement>(null);

  const [partnerData, setPartnerData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [extendedData, setExtendedData] = useState<any>(null);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partnerRes, dashboardRes, profileRes, extRes, mediaRes] = await Promise.allSettled([
          getCurrentPartner(), getPartnerDashboard(), getBusinessProfile(),
          getExtendedProfile(), getPartnerMedia(),
        ]);
        if (partnerRes.status === 'fulfilled') {
          const pData = partnerRes.value.data || partnerRes.value;
          setPartnerData(pData);
          if (pData.categories?.length > 0) setAllowedEntities(pData.categories.map((c: any) => c.name || c));
          const pid = pData.id || pData.partner_id;
          if (pid) {
            getPartnerFollowerCount(pid)
              .then(res => setFollowerCount((res?.data ?? res)?.follower_count ?? 0))
              .catch(() => {});
          }
        }
        if (dashboardRes.status === 'fulfilled') setDashboardData(dashboardRes.value.data || dashboardRes.value);
        if (profileRes.status === 'fulfilled') setProfileData(profileRes.value.data || profileRes.value);
        if (extRes.status === 'fulfilled') setExtendedData(extRes.value.data || extRes.value);
        if (mediaRes.status === 'fulfilled') {
          const m = mediaRes.value.data || mediaRes.value;
          setMediaItems(Array.isArray(m) ? m : []);
        }
      } catch (err) { console.error('Dashboard fetch error', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const hasClassOrProgram = allowedEntities.includes('Classes') || allowedEntities.includes('Programs');
  const hasEvents = allowedEntities.includes('Events');
  const hasVenues = allowedEntities.includes('Venues');

  const partnerStatus = partnerData?.status || '';
  const isActive = partnerData?.is_active === true || ACTIVE_STATUSES.has(partnerStatus);
  const isVerified = partnerData?.is_verified === true || partnerStatus === 'approved';
  const verificationSubmitted = VERIFICATION_SUBMITTED_STATUSES.has(partnerStatus);

  useEffect(() => {
    if (!loading && partnerData) {
      if (partnerStatus === 'otp_verified') onNavigate('PARTNER_CATEGORY');
      else if (partnerStatus === 'category_selected') onNavigate('REGISTRATION');
    }
  }, [loading, partnerData, partnerStatus]);

  const profileCompletion = (() => {
    const galleryImages = mediaItems.filter((m: any) => m.media_type === 'image');
    const fields = [
      !!(extendedData?.cover_image), !!(extendedData?.logo), galleryImages.length > 0,
      !!(profileData?.business_name || partnerData?.business_name), !!(extendedData?.bio),
      !!(extendedData?.contact_number), !!(profileData?.instagram_url),
      !!(profileData?.facebook_url), !!(profileData?.website_url), !!(extendedData?.address),
    ];
    const filled = fields.filter(Boolean).length;
    if (filled === 0 && !extendedData && !profileData)
      return dashboardData?.profile_completion ?? partnerData?.profile_completion ?? 0;
    return Math.round((filled / fields.length) * 100);
  })();

  const businessName = partnerData?.business_name || partnerData?.business_profile?.business_name || 'Partner';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node))
        setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profilePopupRef.current && !profilePopupRef.current.contains(event.target as Node))
        setShowProfilePopup(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddListing = () => {
    if (allowedEntities.length === 1) {
      const e = allowedEntities[0];
      if (e === 'Events') onNavigate('CREATE_EVENT_DETAILS');
      else if (e === 'Venues') onNavigate('CREATE_VENUE_DETAILS');
      else if (e === 'Programs') onNavigate('CREATE_PROGRAM_IDENTITY');
      else onNavigate('CREATE_CLASS_IDENTITY');
    } else if (allowedEntities.length > 1) setShowEntityPicker(true);
    else onNavigate('CREATE_CLASS_IDENTITY');
  };

  const ctaLabel = (() => {
    if (!allowedEntities.length) return 'Add New Listing';
    if (allowedEntities.length === 1) {
      const e = allowedEntities[0];
      if (e === 'Events') return 'Create Event';
      if (e === 'Classes') return 'Add New Class';
      if (e === 'Programs') return 'Add New Program';
      if (e === 'Venues') return 'Add Venue';
    }
    return 'Add New Listing';
  })();

  const notifications = dashboardData?.notifications || [];

  const quickLinks = [
    { label: 'Brand Profile', screen: 'BRAND_PROFILE' as Screen, icon: UserCircle },
    { label: 'My Listings', screen: 'SERVICE_LISTINGS' as Screen, icon: CalendarDays },
    { label: 'Statistics', screen: 'STATISTICS' as Screen, icon: BarChart3 },
    ...(hasClassOrProgram ? [{ label: 'Enquiries', screen: 'ENQUIRIES' as Screen, icon: Inbox }] : []),
    { label: 'Finance', screen: 'FINANCIAL_HUB' as Screen, icon: CreditCard },
  ];

  // â”€â”€ KPI data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const d = dashboardData || {};
  const upcomingEvents = d.upcoming_events ?? 0;
  const ticketsSold = d.tickets_sold ?? 0;
  const venueBookings = d.venue_bookings ?? 0;
  const occupancyRate = d.occupancy_rate ?? 0;
  const monthlyEarnings = d.monthly_earnings ?? 0;

  // â”€â”€ KPI Metrics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const kpiMetrics = (() => {
    if (hasClassOrProgram) {
      const enqSpark: number[] = d.weekly_enquiries || [0, 0, 0, 0, 0, 0, 0];
      const batchSpark: number[] = d.weekly_batches || [0, 0, 0, 0, 0, 0, 0];
      const viewsSpark: number[] = d.weekly_views || [0, 0, 0, 0, 0, 0, 0];
      return [
        { label: 'New Enquiries', value: d.new_enquiries?.toString() || '0', icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-50', hex: '#3B82F6', sparkId: 'enq', spark: enqSpark },
        { label: 'Active Batches', value: d.active_batches?.toString() || '0', icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50', hex: '#10B981', sparkId: 'bat', spark: batchSpark },
        { label: 'Profile Views', value: d.profile_views?.toString() || '0', icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50', hex: '#8B5CF6', sparkId: 'vw', spark: viewsSpark },
      ];
    }
    if (hasEvents) {
      const tktSpark: number[] = d.weekly_tickets || [0, 0, 0, 0, 0, 0, 0];
      const regSpark: number[] = d.weekly_registrations || [0, 0, 0, 0, 0, 0, 0];
      const viewsSpark: number[] = d.weekly_views || [0, 0, 0, 0, 0, 0, 0];
      const rvnSpark: number[] = d.weekly_revenue || [0, 0, 0, 0, 0, 0, 0];
      return [
        { label: 'Upcoming Events', value: upcomingEvents.toString(), icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-50', hex: '#3B82F6', sparkId: 'upe', spark: tktSpark },
        { label: 'Tickets Sold', value: ticketsSold.toString(), icon: Ticket, color: 'text-purple-500', bg: 'bg-purple-50', hex: '#8B5CF6', sparkId: 'tkt', spark: regSpark },
        { label: 'Profile Views', value: d.profile_views?.toString() || '0', icon: Eye, color: 'text-emerald-500', bg: 'bg-emerald-50', hex: '#10B981', sparkId: 'evw', spark: viewsSpark },
        { label: 'Total Revenue', value: fmtCurrency(d.total_revenue || 0), icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50', hex: '#F59E0B', sparkId: 'rev', spark: rvnSpark },
      ];
    }
    if (hasVenues) {
      const bkSpark: number[] = d.weekly_bookings || [0, 0, 0, 0, 0, 0, 0];
      const viewsSpark: number[] = d.weekly_views || [0, 0, 0, 0, 0, 0, 0];
      const rvnSpark: number[] = d.weekly_revenue || [0, 0, 0, 0, 0, 0, 0];
      return [
        { label: 'Venue Bookings', value: venueBookings.toString(), icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-50', hex: '#3B82F6', sparkId: 'vbk', spark: bkSpark },
        { label: 'Occupancy Rate', value: `${occupancyRate}%`, icon: Percent, color: 'text-emerald-500', bg: 'bg-emerald-50', hex: '#10B981', sparkId: 'occ', spark: viewsSpark },
        { label: 'Profile Views', value: d.profile_views?.toString() || '0', icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50', hex: '#8B5CF6', sparkId: 'vvw', spark: viewsSpark },
        { label: 'Monthly Earnings', value: fmtCurrency(monthlyEarnings), icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50', hex: '#F59E0B', sparkId: 'mea', spark: rvnSpark },
      ];
    }
    return [
      { label: 'New Enquiries', value: d.new_enquiries?.toString() || '0', icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-50', hex: '#3B82F6', sparkId: 'genq', spark: [0,0,0,0,0,0,0] as number[] },
      { label: 'Active Batches', value: d.active_batches?.toString() || '0', icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50', hex: '#10B981', sparkId: 'gbat', spark: [0,0,0,0,0,0,0] as number[] },
      { label: 'Profile Views', value: d.profile_views?.toString() || '0', icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50', hex: '#8B5CF6', sparkId: 'gvw', spark: [0,0,0,0,0,0,0] as number[] },
    ];
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* â”€â”€ Header â”€â”€ */}
      <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
        <button onClick={onOpenSidebar} className="p-2 -ml-2"><Menu size={24} /></button>
        <h1 className="font-black text-lg">TLB Partner</h1>
        <div className="flex items-center gap-3">
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-xl transition-colors ${showNotifications ? 'bg-gray-100 text-tlb-dark' : 'hover:bg-gray-50 text-gray-600'}`}
            >
              <Bell size={22} />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-black text-lg">Notifications</h3>
                  <button className="text-[10px] font-black uppercase tracking-widest text-tlb-yellow hover:text-yellow-600">Mark all as read</button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">No notifications yet</div>
                  ) : notifications.map((n: any, idx: number) => (
                    <div key={n.id || idx} className="p-4 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0">
                      <div className="w-10 h-10 bg-tlb-yellow/10 text-tlb-yellow rounded-xl flex items-center justify-center shrink-0">
                        <Bell size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-sm text-gray-900">{n.title}</h4>
                          <span className="text-[10px] text-gray-400 font-medium">{n.time || ''}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full p-4 text-center text-xs font-black uppercase tracking-widest text-gray-400 hover:text-tlb-dark hover:bg-gray-50 transition-colors border-t border-gray-100">
                  View All Notifications
                </button>
              </div>
            )}
          </div>
          <div className="relative" ref={profilePopupRef}>
            <button
              onClick={() => setShowProfilePopup(!showProfilePopup)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showProfilePopup ? 'bg-tlb-yellow/20 text-tlb-yellow' : 'bg-tlb-yellow/10 text-tlb-yellow hover:bg-tlb-yellow/20'}`}
            >
              <UserCircle size={24} />
            </button>
            {showProfilePopup && (
              <div className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                {/* Avatar + name */}
                <div className="p-5 flex items-center gap-4 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-2xl bg-tlb-yellow/10 flex items-center justify-center text-tlb-yellow shrink-0">
                    {extendedData?.logo
                      ? <img src={extendedData.logo} alt="logo" className="w-12 h-12 rounded-2xl object-cover" />
                      : <UserCircle size={28} />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-gray-900 truncate">
                      {profileData?.business_name || partnerData?.business_name || 'Your Business'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {partnerData?.email || partnerData?.phone || ''}
                    </p>
                  </div>
                </div>
                {/* Stats row */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
                  <div className="text-center">
                    <p className="text-base font-black text-gray-900">{profileCompletion}%</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Profile</p>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="text-center">
                    <p className="text-base font-black text-gray-900">{allowedEntities.length}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Services</p>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="text-center">
                    <p className="text-base font-black text-gray-900">
                      {followerCount === null ? 'â€”' : followerCount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Followers</p>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                      isVerified ? 'bg-emerald-50 text-emerald-600' :
                      verificationSubmitted ? 'bg-blue-50 text-blue-500' :
                      isActive ? 'bg-amber-50 text-amber-500' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {isVerified ? 'Verified' : verificationSubmitted ? 'In Review' : isActive ? 'Active' : 'Pending'}
                    </span>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Status</p>
                  </div>
                </div>
                {/* Categories */}
                {allowedEntities.length > 0 && (
                  <div className="px-5 py-3 flex flex-wrap gap-1.5 border-b border-gray-100">
                    {allowedEntities.map(e => (
                      <span key={e} className="text-[10px] font-black uppercase tracking-wide bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{e}</span>
                    ))}
                  </div>
                )}
                {/* Actions */}
                <div className="p-3 flex flex-col gap-1">
                  <button
                    onClick={() => { setShowProfilePopup(false); onNavigate('BRAND_PROFILE'); }}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => { setShowProfilePopup(false); onNavigate('PREVIEW_PROFILE'); }}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Preview Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="tlb-content space-y-6">

          {/* â”€â”€ Onboarding Tracker â”€â”€ */}
          {isActive && !isVerified && (
            <section className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-black">Onboarding Progress</h2>
                <p className="text-xs text-gray-500 mt-1">Complete all steps to fully activate your partner account.</p>
              </div>
              <div className="space-y-0 relative">
                <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-gray-100 z-0" />
                <div className="flex items-start gap-4 relative z-10 pb-6">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="pt-0.5">
                    <p className="font-bold text-gray-900 opacity-60 line-through">Profile Created</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">Completed</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 relative z-10 pb-6">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${verificationSubmitted ? 'bg-emerald-100 text-emerald-600' : 'bg-tlb-yellow text-tlb-dark'}`}>
                    {verificationSubmitted ? <CheckCircle2 size={18} /> : <span className="font-black text-sm">2</span>}
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-0.5">
                    <div>
                      <p className={`font-bold ${verificationSubmitted ? 'text-gray-900 opacity-60 line-through' : 'text-gray-900'}`}>Verification Documents</p>
                      {!verificationSubmitted && <p className="text-xs text-gray-500 mt-1">Submit PAN, bank details &amp; sign the partner agreement.</p>}
                      {verificationSubmitted && <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">Submitted</p>}
                    </div>
                    {!verificationSubmitted && (
                      <button onClick={() => onNavigate('AGREEMENT_SUBMIT')} className="bg-tlb-dark text-tlb-yellow px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-black transition-colors whitespace-nowrap self-start">
                        Start Verification
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${verificationSubmitted ? 'bg-tlb-yellow text-tlb-dark' : 'bg-gray-100 text-gray-300'}`}>
                    <span className="font-black text-sm">3</span>
                  </div>
                  <div className={`pt-0.5 ${!verificationSubmitted ? 'opacity-40' : ''}`}>
                    <p className="font-bold text-gray-900">Admin Review</p>
                    {verificationSubmitted
                      ? <p className="text-[10px] text-tlb-yellow font-bold uppercase tracking-widest mt-0.5">In Progress â€” typically 24â€“48 hrs</p>
                      : <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Unlocks after Step 2</p>}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* â”€â”€ Welcome Banner â”€â”€ */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tlb-dark to-gray-900 p-6 sm:p-8 text-white">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-tlb-yellow/10 rounded-full blur-2xl" />
            <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-tlb-yellow/5 rounded-full blur-xl" />
            <div className="relative z-10">
              <h2 className="text-2xl font-black leading-tight">Welcome back, {businessName}! ðŸ‘‹</h2>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-lg">
                Your profile is <span className="text-tlb-yellow font-black">{profileCompletion}% complete</span>.
                {profileCompletion < 100 && (
                  <button onClick={() => onNavigate('BRAND_PROFILE')} className="text-tlb-yellow underline ml-1 font-bold">Complete your profile</button>
                )}
              </p>
              <div className="mt-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Profile Completion</span>
                  <span className="text-sm font-black text-tlb-yellow">{profileCompletion}%</span>
                </div>
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-tlb-yellow rounded-full transition-all duration-700" style={{ width: `${profileCompletion}%` }} />
                </div>
              </div>
            </div>
          </section>

          {/* â”€â”€ Profile Performance â”€â”€ */}
          <section className="tlb-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-black text-gray-900">Profile Performance</h3>
                <p className="text-xs text-gray-400 mt-0.5">Visibility and engagement metrics</p>
              </div>
              <button onClick={() => onNavigate('BRAND_PROFILE')} className="text-xs font-bold text-tlb-yellow hover:underline">
                Edit Profile
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Profile Views', value: d.profile_views ?? 0, icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50' },
                { label: 'Followers', value: followerCount === null ? 'â€”' : followerCount.toLocaleString('en-IN'), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Completion', value: `${profileCompletion}%`, icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col items-center text-center gap-2">
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={18} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900">{stat.value}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Profile Strength</span>
                <span className="text-[10px] font-black text-gray-700">{profileCompletion}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${profileCompletion}%`,
                    backgroundColor: profileCompletion >= 80 ? '#10B981' : profileCompletion >= 50 ? '#FACC15' : '#F87171',
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                {profileCompletion === 100 ? 'Your profile is fully complete!' :
                 profileCompletion >= 80 ? 'Almost there! Add a few more details.' :
                 profileCompletion >= 50 ? 'Good progress. Add bio, links & gallery.' :
                 'Complete your profile to improve discoverability.'}
              </p>
            </div>
          </section>

          {/* â”€â”€ KPI Cards â”€â”€ */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiMetrics.map((m) => {
              const sparkHasData = m.spark.some(v => v > 0);
              const trend = trendPct(m.spark);
              return (
                <div key={m.label} className="tlb-card p-5 flex flex-col gap-2 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 ${m.bg} rounded-xl flex items-center justify-center ${m.color}`}>
                      <m.icon size={18} />
                    </div>
                    <TrendBadge pct={trend} />
                  </div>
                  <div>
                    <p className="text-3xl font-black leading-none mt-1">{m.value}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{m.label}</p>
                  </div>
                  {sparkHasData && (
                    <div className="h-11 -mx-1 mt-1">
                      <AreaSparkline data={m.spark} color={m.hex} id={m.sparkId} />
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {/* â”€â”€ CTA Button â”€â”€ */}
          <section>
            <button onClick={handleAddListing} className="tlb-button w-full py-5 shadow-lg shadow-tlb-yellow/20 text-base gap-3">
              <Plus size={22} /> {ctaLabel}
            </button>
          </section>

          {/* â”€â”€ Quick Links â”€â”€ */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => onNavigate(link.screen)}
                className="tlb-card p-4 flex flex-col items-center gap-2 hover:border-tlb-yellow transition-colors cursor-pointer"
              >
                <div className="bg-tlb-yellow/10 p-3 rounded-xl text-tlb-yellow"><link.icon size={22} /></div>
                <span className="text-xs font-bold text-gray-600">{link.label}</span>
              </button>
            ))}
          </section>


        </div>
      </main>

      {/* â”€â”€ Footer â”€â”€ */}
      <footer className="mt-10 bg-tlb-dark text-white px-6 py-8">
        <div className="flex flex-col items-center gap-4">
          <img src="/tlbAppIcon.png" alt="The Little Broadway" className="w-14 h-14 rounded-2xl" />
          <p className="text-white font-black text-base tracking-tight">The Little Broadway</p>
          <p className="text-gray-400 text-xs text-center leading-relaxed">
            Your premier partner portal for Broadway events,<br />classes, and venue management.
          </p>
          <div className="w-full border-t border-white/10 my-2" />
          <div className="w-full grid grid-cols-2 gap-4 text-xs text-gray-400">
            <div>
              <p className="text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-2">Contact</p>
              <p>support@thelittlebroadway.in</p>
              <p className="mt-1">+91 98765 43210</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-2">Platform</p>
              <p>Events</p><p className="mt-1">Classes</p><p className="mt-1">Venues</p>
            </div>
          </div>
          <div className="w-full border-t border-white/10 my-2" />
          <p className="text-gray-500 text-[10px] text-center">
            Â© 2026 The Little Broadway. All rights reserved.<br />Partner Portal V3.0
          </p>
        </div>
      </footer>

      <EntityPickerSheet
        isOpen={showEntityPicker}
        onClose={() => setShowEntityPicker(false)}
        allowedEntities={allowedEntities}
        onNavigate={onNavigate}
      />
    </div>
  );
};
