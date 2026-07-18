import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Menu, UserCircle, CheckCircle2, ArrowRight, ChevronRight,
  Inbox, Eye, BarChart3, CreditCard, CalendarDays, LineChart,
  Ticket, DollarSign, MapPin, Percent, Edit3, LogOut,
  Heart, TrendingUp,
} from 'lucide-react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { EntityPickerSheet } from '../../components/EntityPickerSheet';
import { NotificationCenter } from '../../components/NotificationCenter';
import { SkeletonDashboard, AreaSparkline, TrendBadge, fmtCurrency, trendPct, BookingsCalendar, LatestListings } from '../../components/ui';
import {
  getPartnerDashboard, getCurrentPartner, getBusinessProfile,
  getExtendedProfile, getPartnerMedia, getPartnerFollowerCount
} from '../../api/onboarding';
import { getStatsOverview, StatsOverview } from '../../api/stats';

// --------- Types / Constants -----------------------------------------------

const ACTIVE_STATUSES = new Set(['activated_limited', 'under_review', 'approved']);
const VERIFICATION_SUBMITTED_STATUSES = new Set(['under_review', 'approved']);

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

// --------- Completion ring --------------------------------------------------

const CompletionRing: React.FC<{ pct: number }> = ({ pct }) => {
  const r = 34, circ = 2 * Math.PI * r;
  const color = pct >= 100 ? '#141414' : '#FACC15';
  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#F3F4F6" strokeWidth="7" />
        <motion.circle
          cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-gray-900 leading-none">{pct}%</span>
        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Done</span>
      </div>
    </div>
  );
};

// --------- Component --------------------------------------------------------

interface HomeProps { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

export const Home: React.FC<HomeProps> = ({ onNavigate, onOpenSidebar }) => {
  const { allowedEntities, setAllowedEntities } = usePartner();
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
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

  const hasClasses = allowedEntities.includes('Classes');
  const hasPrograms = allowedEntities.includes('Programs');
  const hasClassOrProgram = hasClasses || hasPrograms;
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

  // ------ Profile completion + actionable checklist ------
  const galleryImages = mediaItems.filter((m: any) => m.media_type === 'image');
  const checklist = [
    { label: 'Add a cover image', done: !!extendedData?.cover_image },
    { label: 'Add your logo', done: !!extendedData?.logo },
    { label: 'Upload gallery photos', done: galleryImages.length > 0 },
    { label: 'Write your bio', done: !!extendedData?.bio },
    { label: 'Add a contact number', done: !!extendedData?.contact_number },
    { label: 'Add your address', done: !!extendedData?.address },
    { label: 'Link Instagram', done: !!profileData?.instagram_url },
    { label: 'Link Facebook', done: !!profileData?.facebook_url },
    { label: 'Add your website', done: !!profileData?.website_url },
    { label: 'Set your business name', done: !!(profileData?.business_name || partnerData?.business_name) },
  ];
  const profileCompletion = (() => {
    const filled = checklist.filter(c => c.done).length;
    if (filled === 0 && !extendedData && !profileData)
      return dashboardData?.profile_completion ?? partnerData?.profile_completion ?? 0;
    return Math.round((filled / checklist.length) * 100);
  })();
  const pendingChecklist = checklist.filter(c => !c.done).slice(0, 4);

  const businessName = partnerData?.business_name || partnerData?.business_profile?.business_name || 'Partner';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profilePopupRef.current && !profilePopupRef.current.contains(event.target as Node))
        setShowProfilePopup(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ------ KPI data ------
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

  const kpiMetrics = (() => {
    if (hasClassOrProgram) {
      const enqSpark: number[] = d.weekly_enquiries || [0, 0, 0, 0, 0, 0, 0];
      const batchSpark: number[] = d.weekly_batches || [0, 0, 0, 0, 0, 0, 0];
      const viewsSpark: number[] = d.weekly_views || [0, 0, 0, 0, 0, 0, 0];
      return [
        { label: 'New Enquiries', value: newEnquiries.toString(), icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-50', hex: '#3B82F6', sparkId: 'enq', spark: enqSpark },
        { label: 'Active Batches', value: activeBatches.toString(), icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50', hex: '#10B981', sparkId: 'bat', spark: batchSpark },
        { label: 'Profile Views', value: profileViews.toString(), icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50', hex: '#8B5CF6', sparkId: 'vw', spark: viewsSpark },
        { label: 'Followers', value: (followerCount ?? 0).toString(), icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', hex: '#F43F5E', sparkId: 'flw', spark: viewsSpark },
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
      { label: 'New Enquiries', value: newEnquiries.toString(), icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-50', hex: '#3B82F6', sparkId: 'genq', spark: [0, 0, 0, 0, 0, 0, 0] as number[] },
      { label: 'Active Batches', value: activeBatches.toString(), icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50', hex: '#10B981', sparkId: 'gbat', spark: [0, 0, 0, 0, 0, 0, 0] as number[] },
      { label: 'Profile Views', value: profileViews.toString(), icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50', hex: '#8B5CF6', sparkId: 'gvw', spark: [0, 0, 0, 0, 0, 0, 0] as number[] },
      { label: 'Followers', value: (followerCount ?? 0).toString(), icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', hex: '#F43F5E', sparkId: 'gflw', spark: [0, 0, 0, 0, 0, 0, 0] as number[] },
    ];
  })();

  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening';

  if (loading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm px-6 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors"><Menu size={22} /></button>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-xs font-medium text-gray-400 hidden sm:block">Welcome back, {businessName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('ANALYTICS')}
            className="h-9 px-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-2"
            title="Analytics"
          >
            <LineChart size={18} />
            <span className="text-sm font-bold hidden md:inline">Analytics</span>
          </button>
          {/* Notifications */}
          <NotificationCenter variant="light" onNavigate={onNavigate} />
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

        {/* Hero + profile completion */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Welcome hero */}
          <motion.section
            {...fadeUp}
            transition={{ duration: 0.3 }}
            className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-tlb-dark via-gray-900 to-black p-6 sm:p-8 text-white"
          >
            <div className="absolute -right-10 -top-10 w-52 h-52 bg-tlb-yellow/10 rounded-full blur-3xl" />
            <div className="absolute -right-16 bottom-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col h-full">
              <p className="text-sm text-gray-400 font-medium">Good {greeting},</p>
              <h2 className="text-2xl sm:text-3xl font-black mt-1">{businessName}</h2>
              <p className="text-sm text-gray-400 mt-2 max-w-md">
                Here's how your brand is doing today. Track your reach, manage listings, and grow your audience — all from one place.
              </p>

              <div className="mt-auto pt-6 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[180px]">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500 font-medium">Profile completion</span>
                    <span className="text-tlb-yellow font-black">{profileCompletion}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-tlb-yellow rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${profileCompletion}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                {profileCompletion < 100 ? (
                  <button onClick={() => onNavigate('BRAND_PROFILE')} className="bg-tlb-yellow text-tlb-dark px-4 py-2.5 rounded-xl text-xs font-black shrink-0 hover:brightness-110 transition-all flex items-center gap-1.5">
                    Complete Profile <ArrowRight size={14} />
                  </button>
                ) : (
                  <button onClick={() => onNavigate('ANALYTICS')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5">
                    View Analytics <TrendingUp size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.section>

          {/* Profile completion card w/ checklist */}
          <motion.section {...fadeUp} transition={{ duration: 0.3, delay: 0.05 }} className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 flex flex-col">
            <div className="flex items-center gap-4">
              <CompletionRing pct={profileCompletion} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Profile</p>
                <p className="text-sm font-black text-gray-900 mt-1">
                  {profileCompletion >= 100 ? 'All set! 🎉' : profileCompletion >= 60 ? 'Almost there' : 'Getting started'}
                </p>
                <button onClick={() => onNavigate('BRAND_PROFILE')} className="text-[11px] font-black text-blue-500 hover:underline mt-1 flex items-center gap-1">
                  Edit profile <ChevronRight size={12} />
                </button>
              </div>
            </div>

            {pendingChecklist.length > 0 ? (
              <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Finish setting up</p>
                {pendingChecklist.map(item => (
                  <button
                    key={item.label}
                    onClick={() => onNavigate('BRAND_PROFILE')}
                    className="w-full flex items-center gap-2.5 text-left group"
                  >
                    <span className="w-4 h-4 rounded-full border-2 border-gray-200 group-hover:border-tlb-yellow transition-colors shrink-0" />
                    <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors flex-1">{item.label}</span>
                    <ArrowRight size={13} className="text-gray-300 group-hover:text-tlb-yellow group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={16} />
                <span className="text-xs font-bold">Your profile is complete</span>
              </div>
            )}
          </motion.section>
        </div>

        {/* KPI Cards */}
        <motion.section
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {kpiMetrics.map((m, i) => {
            const sparkHasData = m.spark.some(v => v > 0);
            const trend = trendPct(m.spark);
            // Brand rhythm: the lead KPI is a solid black card, the rest are
            // white cards with a black badge + yellow glyph. Sparklines follow.
            const dark = i === 0;
            return (
              <motion.div
                key={m.label}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className={`rounded-2xl border p-5 flex flex-col gap-3 overflow-hidden transition-shadow ${dark ? 'bg-tlb-dark border-tlb-dark text-white hover:shadow-lg' : 'bg-white border-gray-100 hover:shadow-md'}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-tlb-yellow text-tlb-dark' : 'bg-tlb-dark text-tlb-yellow'}`}>
                    <m.icon size={16} />
                  </div>
                  <TrendBadge pct={trend} />
                </div>
                <div>
                  <p className={`text-2xl font-black leading-none ${dark ? 'text-white' : 'text-gray-900'}`}>{m.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-gray-400">{m.label}</p>
                </div>
                {sparkHasData && (
                  <div className="h-10 -mx-1 mt-auto">
                    <AreaSparkline data={m.spark} color={dark ? '#FACC15' : '#141414'} id={m.sparkId} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.section>

        {/* Latest listings + Bookings calendar (functional widgets) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div {...fadeUp} transition={{ duration: 0.3 }}>
            <LatestListings onViewAll={() => onNavigate('SERVICE_LISTINGS')} />
          </motion.div>
          <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.05 }}>
            <BookingsCalendar onViewAll={() => onNavigate('BOOKINGS')} />
          </motion.div>
        </div>

      </main>

      <EntityPickerSheet
        isOpen={showEntityPicker}
        onClose={() => setShowEntityPicker(false)}
        allowedEntities={allowedEntities}
        onNavigate={onNavigate}
      />
    </div>
  );
};
