import React, { useState, useRef, useEffect } from 'react';
import {
  Menu, Bell, UserCircle, CheckCircle2, X,
  Inbox, Eye, BarChart3, CreditCard, Plus, CalendarDays,
  Ticket, DollarSign, MapPin, Percent, Edit3, LogOut,
} from 'lucide-react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { EntityPickerSheet } from '../../components/EntityPickerSheet';
import { Loader, AreaSparkline, TrendBadge, fmtCurrency, trendPct } from '../../components/ui';
import {
  getPartnerDashboard, getCurrentPartner, getBusinessProfile,
  getExtendedProfile, getPartnerMedia, getPartnerFollowerCount
} from '../../api/onboarding';
import { getStatsOverview, StatsOverview } from '../../api/stats';

// --------- Types / Constants ------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const ACTIVE_STATUSES = new Set(['activated_limited', 'under_review', 'approved']);
const VERIFICATION_SUBMITTED_STATUSES = new Set(['under_review', 'approved']);

// --------- Component ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

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
  // Canonical source for profile_views / followers / new_enquiries / active_batches.
  // Falls back to legacy `dashboardData` if /stats/overview/ is unavailable.
  const [overviewData, setOverviewData] = useState<StatsOverview | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [extendedData, setExtendedData] = useState<any>(null);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partnerRes, dashboardRes, overviewRes, profileRes, extRes, mediaRes] = await Promise.allSettled([
          getCurrentPartner(), getPartnerDashboard(), getStatsOverview(), getBusinessProfile(),
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
        if (overviewRes.status === 'fulfilled') {
          const o = overviewRes.value;
          setOverviewData(o);
          // Prefer /stats/overview/'s follower count when available — it's the canonical
          // source per the new API. The separate getPartnerFollowerCount() call above
          // still runs as a fallback in case /stats/overview/ fails.
          if (typeof o?.followers === 'number') setFollowerCount(o.followers);
        }
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

  // ------ KPI data ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  const d = dashboardData || {};
  const upcomingEvents = d.upcoming_events ?? 0;
  const ticketsSold = d.tickets_sold ?? 0;
  const venueBookings = d.venue_bookings ?? 0;
  const occupancyRate = d.occupancy_rate ?? 0;
  const monthlyEarnings = d.monthly_earnings ?? 0;

  // /stats/overview/ is the canonical source for these three; fall back to the
  // legacy dashboard endpoint if the new one hasn't returned (or fails).
  const profileViews = overviewData?.profile_views ?? d.profile_views ?? 0;
  const newEnquiries = overviewData?.new_enquiries ?? d.new_enquiries ?? 0;
  const activeBatches = overviewData?.active_batches ?? d.active_batches ?? 0;

  // ------ KPI Metrics ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  const kpiMetrics = (() => {
    if (hasClassOrProgram) {
      const enqSpark: number[] = d.weekly_enquiries || [0, 0, 0, 0, 0, 0, 0];
      const batchSpark: number[] = d.weekly_batches || [0, 0, 0, 0, 0, 0, 0];
      const viewsSpark: number[] = d.weekly_views || [0, 0, 0, 0, 0, 0, 0];
      return [
        { label: 'New Enquiries', value: newEnquiries.toString(), icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-50', hex: '#3B82F6', sparkId: 'enq', spark: enqSpark },
        { label: 'Active Batches', value: activeBatches.toString(), icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50', hex: '#10B981', sparkId: 'bat', spark: batchSpark },
        { label: 'Profile Views', value: profileViews.toString(), icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50', hex: '#8B5CF6', sparkId: 'vw', spark: viewsSpark },
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
        { label: 'Profile Views', value: profileViews.toString(), icon: Eye, color: 'text-emerald-500', bg: 'bg-emerald-50', hex: '#10B981', sparkId: 'evw', spark: viewsSpark },
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
        { label: 'Profile Views', value: profileViews.toString(), icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50', hex: '#8B5CF6', sparkId: 'vvw', spark: viewsSpark },
        { label: 'Monthly Earnings', value: fmtCurrency(monthlyEarnings), icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50', hex: '#F59E0B', sparkId: 'mea', spark: rvnSpark },
      ];
    }
    return [
      { label: 'New Enquiries', value: newEnquiries.toString(), icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-50', hex: '#3B82F6', sparkId: 'genq', spark: [0,0,0,0,0,0,0] as number[] },
      { label: 'Active Batches', value: activeBatches.toString(), icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50', hex: '#10B981', sparkId: 'gbat', spark: [0,0,0,0,0,0,0] as number[] },
      { label: 'Profile Views', value: profileViews.toString(), icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50', hex: '#8B5CF6', sparkId: 'gvw', spark: [0,0,0,0,0,0,0] as number[] },
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
      {/* Header */}
      <header className="bg-white px-6 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors"><Menu size={22} /></button>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-xs font-medium text-gray-400 hidden sm:block">Welcome back, {businessName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2.5 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors">
              <Bell size={20} />
              {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">No notifications</div>
                  ) : notifications.map((n: any, idx: number) => (
                    <div key={n.id || idx} className="p-3 flex gap-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                      <Bell size={14} className="text-tlb-yellow shrink-0 mt-0.5" />
                      <div><p className="text-xs font-bold text-gray-900">{n.title}</p><p className="text-[11px] text-gray-500">{n.message}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Profile */}
          <div className="relative" ref={profilePopupRef}>
            <button onClick={() => setShowProfilePopup(!showProfilePopup)} className="w-9 h-9 rounded-full bg-tlb-yellow/10 text-tlb-yellow flex items-center justify-center hover:bg-tlb-yellow/20 transition-colors">
              {extendedData?.logo ? <img src={extendedData.logo} alt="" className="w-9 h-9 rounded-full object-cover" /> : <UserCircle size={20} />}
            </button>
            {showProfilePopup && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
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
                      const c = e === 'Events' ? 'bg-blue-50 text-blue-600' : e === 'Classes' ? 'bg-purple-50 text-purple-600' : e === 'Programs' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600';
                      return <span key={e} className={`text-[9px] font-black uppercase tracking-wide px-2.5 py-1 rounded-md ${c}`}>{e}</span>;
                    })}
                  </div>
                )}
                {/* Actions */}
                <div className="p-2">
                  <button onClick={() => { setShowProfilePopup(false); onNavigate('BRAND_PROFILE'); }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"><Edit3 size={14} className="text-gray-400" />Edit Profile</button>
                  <button onClick={() => { setShowProfilePopup(false); onNavigate('PREVIEW_PROFILE'); }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"><Eye size={14} className="text-gray-400" />Preview Profile</button>
                  <div className="my-1 border-t border-gray-100" />
                  <button onClick={() => { setShowProfilePopup(false); onNavigate('LANDING'); }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors"><LogOut size={14} />Sign Out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* Onboarding Tracker */}
        {isActive && !isVerified && (
          <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
            <h2 className="font-bold text-sm text-gray-900 mb-4">Onboarding Progress</h2>
            <div className="space-y-0 relative">
              <div className="absolute left-[15px] top-5 bottom-5 w-px bg-gray-200 z-0" />
              {[
                { done: true, label: 'Profile Created' },
                { done: verificationSubmitted, label: 'Verification Documents', actionLabel: 'Start Verification', action: () => onNavigate('AGREEMENT_SUBMIT') },
                { done: false, active: verificationSubmitted, label: 'Admin Review', note: verificationSubmitted ? 'In progress' : 'Unlocks after step 2' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 relative z-10 pb-4 last:pb-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${step.done ? 'bg-emerald-100 text-emerald-600' : step.active ? 'bg-tlb-yellow text-tlb-dark' : 'bg-gray-100 text-gray-400'}`}>
                    {step.done ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  <div className="flex-1 flex items-center justify-between gap-3 pt-1.5">
                    <div>
                      <p className={`text-sm font-bold ${step.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{step.label}</p>
                      {step.note && <p className="text-[11px] text-gray-400 mt-0.5">{step.note}</p>}
                    </div>
                    {!step.done && step.action && (
                      <button onClick={step.action} className="bg-tlb-yellow text-tlb-dark px-4 py-2 rounded-lg text-xs font-bold shrink-0">
                        {step.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Welcome + Profile row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Welcome card */}
          <section className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f1729] to-gray-900 p-6 text-white">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-tlb-yellow/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <p className="text-sm text-gray-400 font-medium">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},</p>
              <h2 className="text-2xl font-black mt-1">{businessName}</h2>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500 font-medium">Profile completion</span>
                    <span className="text-tlb-yellow font-black">{profileCompletion}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-tlb-yellow rounded-full transition-all duration-700" style={{ width: `${profileCompletion}%` }} />
                  </div>
                </div>
                {profileCompletion < 100 && (
                  <button onClick={() => onNavigate('BRAND_PROFILE')} className="bg-tlb-yellow text-tlb-dark px-4 py-2 rounded-lg text-xs font-bold shrink-0 hover:brightness-110 transition-all">
                    Complete
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Profile stats card */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Profile</p>
              <button onClick={() => onNavigate('BRAND_PROFILE')} className="text-[11px] font-bold text-blue-500 hover:underline">Edit</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Views', value: profileViews, color: 'text-purple-500' },
                { label: 'Followers', value: followerCount === null ? '-' : followerCount, color: 'text-blue-500' },
                { label: 'Complete', value: `${profileCompletion}%`, color: 'text-emerald-500' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${profileCompletion}%`, backgroundColor: profileCompletion >= 80 ? '#10B981' : profileCompletion >= 50 ? '#FACC15' : '#F87171' }} />
                </div>
                <span className="text-[10px] font-bold text-gray-500">{profileCompletion}%</span>
              </div>
            </div>
          </section>
        </div>

        {/* KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiMetrics.map((m) => {
            const sparkHasData = m.spark.some(v => v > 0);
            const trend = trendPct(m.spark);
            return (
              <div key={m.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 ${m.bg} rounded-xl flex items-center justify-center ${m.color}`}>
                    <m.icon size={16} />
                  </div>
                  <TrendBadge pct={trend} />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900 leading-none">{m.value}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{m.label}</p>
                </div>
                {sparkHasData && (
                  <div className="h-10 -mx-1 mt-auto">
                    <AreaSparkline data={m.spark} color={m.hex} id={m.sparkId} />
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Quick actions row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* CTA */}
          <button onClick={handleAddListing} className="lg:col-span-2 bg-tlb-yellow text-tlb-dark rounded-2xl p-5 flex items-center gap-4 hover:brightness-105 active:scale-[0.99] transition-all">
            <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center shrink-0"><Plus size={24} /></div>
            <div className="text-left"><p className="font-black text-base">{ctaLabel}</p><p className="text-xs font-medium text-black/50 mt-0.5">Start building your next listing</p></div>
          </button>
          {/* Quick links */}
          {quickLinks.slice(0, 3).map((link) => (
            <button key={link.label} onClick={() => onNavigate(link.screen)} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 hover:border-gray-300 hover:shadow-sm transition-all group">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-tlb-yellow/10 group-hover:text-tlb-yellow transition-colors">
                <link.icon size={18} />
              </div>
              <span className="text-sm font-bold text-gray-700">{link.label}</span>
            </button>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-[#0f1729] text-white px-6 py-6 mt-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/tlbAppIcon.png" alt="TLB" className="w-8 h-8 rounded-lg" />
            <span className="text-sm font-bold text-gray-400">The Little Broadway</span>
          </div>
          <p className="text-[11px] text-gray-600">&copy; 2026 The Little Broadway &middot; Partner Portal V3.0</p>
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
