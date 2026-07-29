import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Menu, UserCircle, CheckCircle2, ArrowRight,
  Inbox, Eye, CalendarDays, LineChart,
  Ticket, MapPin, Edit3, LogOut,
  Heart, Activity, IndianRupee, Star, MessageSquare,
  ClipboardList, Megaphone, Bell, ExternalLink,
  BookOpen, GraduationCap, TrendingUp, TrendingDown,
  ChevronRight,
} from 'lucide-react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { EntityPickerSheet } from '../../components/EntityPickerSheet';
import { NotificationCenter } from '../../components/NotificationCenter';
import {
  SkeletonDashboard, fmtCurrency,
  BookingsCalendar, LatestListings,
  AreaSparkline, TrendAreaChart, DonutChart,
} from '../../components/ui';
import {
  getPartnerDashboard, getCurrentPartner, getBusinessProfile,
  getExtendedProfile, getPartnerMedia, getPartnerFollowerCount
} from '../../api/onboarding';
import {
  getStatsOverview, getStatsRevenue, getStatsReviews, getStatsEvents, getStatsVenues,
  StatsOverview, StatsRevenue, StatsReviews, StatsEvents, StatsVenues,
} from '../../api/stats';
import { listNotifications, markNotificationRead, InAppNotification } from '../../api/notifications';

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

const RECENT_LIMIT = 6;

const TINT: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  purple: 'bg-purple-50 text-purple-600',
  rose: 'bg-rose-50 text-rose-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  gray: 'bg-gray-100 text-gray-500',
};

const moneyToNum = (v: unknown): number => {
  const n = parseFloat(String(v ?? '0'));
  return Number.isFinite(n) ? n : 0;
};

const timeAgo = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24); if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const activityMeta = (type: string): { icon: React.ElementType; tint: string } => {
  const t = (type || '').toLowerCase();
  if (t.includes('booking')) return { icon: Ticket, tint: 'emerald' };
  if (t.includes('payment') || t.includes('payout') || t.includes('refund')) return { icon: IndianRupee, tint: 'amber' };
  if (t.includes('enquiry') || t.includes('lead')) return { icon: MessageSquare, tint: 'blue' };
  if (t.includes('follower')) return { icon: Heart, tint: 'rose' };
  if (t.includes('listing')) return { icon: ClipboardList, tint: 'purple' };
  if (t === 'broadcast') return { icon: Megaphone, tint: 'blue' };
  return { icon: Bell, tint: 'gray' };
};

// --------- Count-up animation hook ------------------------------------------

const useCountUp = (target: number, duration = 1200): number => {
  const [val, setVal] = useState(0);
  const rafRef = useRef(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return val;
};

// --------- Animated number display ------------------------------------------

const CountUpValue: React.FC<{ value: number; prefix?: string; suffix?: string; className?: string }> = ({ value, prefix = '', suffix = '', className = '' }) => {
  const animated = useCountUp(value);
  return <span className={className}>{prefix}{animated.toLocaleString('en-IN')}{suffix}</span>;
};

// Formatted currency with count-up
const CountUpCurrency: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => {
  const animated = useCountUp(value);
  return <span className={className}>{fmtCurrency(animated)}</span>;
};

// --------- Completion ring --------------------------------------------------

const CompletionRing: React.FC<{ pct: number; size?: number; trackColor?: string; strokeColor?: string }> = ({
  pct, size = 56, trackColor = 'rgba(255,255,255,0.1)', strokeColor,
}) => {
  const r = 24, circ = 2 * Math.PI * r;
  const color = strokeColor || (pct >= 100 ? '#10B981' : '#FACC15');
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 60 60" className="-rotate-90" style={{ width: size, height: size }}>
        <circle cx="30" cy="30" r={r} fill="none" stroke={trackColor} strokeWidth="5" />
        <motion.circle
          cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-black leading-none ${size < 50 ? 'text-[11px]' : 'text-sm'}`} style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
};

// --------- Trend Badge ------------------------------------------------------

const TrendBadge: React.FC<{ pct: number; className?: string }> = ({ pct, className = '' }) => {
  if (pct === 0) return <span className={`inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 ${className}`}>— flat</span>;
  const up = pct > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-black ${up ? 'text-emerald-500' : 'text-red-400'} ${className}`}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {Math.abs(pct)}%
    </span>
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
  const [overviewData, setOverviewData] = useState<StatsOverview | null>(null);
  const [revenueData, setRevenueData] = useState<StatsRevenue | null>(null);
  const [reviewsData, setReviewsData] = useState<StatsReviews | null>(null);
  const [eventsData, setEventsData] = useState<StatsEvents | null>(null);
  const [venuesData, setVenuesData] = useState<StatsVenues | null>(null);
  const [activity, setActivity] = useState<InAppNotification[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [extendedData, setExtendedData] = useState<any>(null);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          partnerRes, dashboardRes, overviewRes, profileRes, extRes, mediaRes,
          revenueRes, reviewsRes, eventsRes, venuesRes, activityRes,
        ] = await Promise.allSettled([
          getCurrentPartner(), getPartnerDashboard(), getStatsOverview(), getBusinessProfile(),
          getExtendedProfile(), getPartnerMedia(),
          getStatsRevenue('all'), getStatsReviews(), getStatsEvents(), getStatsVenues(),
          listNotifications({ page_size: RECENT_LIMIT }),
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
          if (typeof o?.followers === 'number') setFollowerCount(o.followers);
        }
        if (profileRes.status === 'fulfilled') setProfileData(profileRes.value.data || profileRes.value);
        if (extRes.status === 'fulfilled') setExtendedData(extRes.value.data || extRes.value);
        if (mediaRes.status === 'fulfilled') {
          const m = mediaRes.value.data || mediaRes.value;
          setMediaItems(Array.isArray(m) ? m : []);
        }
        if (revenueRes.status === 'fulfilled') setRevenueData(revenueRes.value);
        if (reviewsRes.status === 'fulfilled') setReviewsData(reviewsRes.value);
        if (eventsRes.status === 'fulfilled') setEventsData(eventsRes.value);
        if (venuesRes.status === 'fulfilled') setVenuesData(venuesRes.value);
        if (activityRes.status === 'fulfilled') setActivity(activityRes.value.results || []);
      } catch (err) { console.error('Dashboard fetch error', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const hasClasses = allowedEntities.includes('Classes');
  const hasPrograms = allowedEntities.includes('Programs');
  const hasClassOrProgram = hasClasses || hasPrograms;

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
  const checklistDone = checklist.filter(c => c.done).length;

  const businessName = partnerData?.business_name || partnerData?.business_profile?.business_name || 'Partner';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profilePopupRef.current && !profilePopupRef.current.contains(event.target as Node))
        setShowProfilePopup(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ------ Derived stat sources ------
  const d = dashboardData || {};
  const ticketsSold = eventsData?.tickets_sold ?? d.tickets_sold ?? 0;
  const venueBookings = venuesData?.total_bookings ?? d.venue_bookings ?? 0;
  const profileViews = overviewData?.profile_views ?? d.profile_views ?? 0;
  const newEnquiries = overviewData?.new_enquiries ?? d.new_enquiries ?? 0;
  const activeBatches = overviewData?.active_batches ?? d.active_batches ?? 0;
  const followersTotal = followerCount ?? overviewData?.followers ?? 0;

  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening';
  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ------ Revenue helpers ------
  const grossRevenue = moneyToNum(revenueData?.gross_revenue);
  const netEarnings = moneyToNum(revenueData?.net_earnings);
  const revenueGrowth = revenueData?.revenue_growth_pct ?? 0;
  const revenueTrendData = (revenueData?.revenue_trend || []).map(b => moneyToNum(b.earnings));
  const revenueTrendLabels = (revenueData?.revenue_trend || []).map(b => b.month);
  const revenueByType = (revenueData?.revenue_by_type || []).map(t => ({
    value: moneyToNum(t.amount), color: t.type === 'event' ? '#3B82F6' : t.type === 'class' ? '#8B5CF6' : t.type === 'program' ? '#10B981' : t.type === 'venue' ? '#F59E0B' : '#6B7280', label: t.type,
  }));

  // ------ KPI cards ------
  type KpiItem = {
    label: string; rawValue: number; formatted: string; sub: string;
    icon: React.ElementType; hex: string; trendPct?: number;
    sparkData?: number[]; highlight?: boolean; nav: Screen; isCurrency?: boolean;
  };
  const primaryKpis: KpiItem[] = [
    {
      label: 'Bookings Confirmed', rawValue: revenueData?.confirmed_bookings ?? 0,
      formatted: (revenueData?.confirmed_bookings ?? 0).toLocaleString('en-IN'), sub: 'Since launch',
      icon: CheckCircle2, hex: '#10B981', nav: 'BOOKINGS',
    },
    {
      label: 'New Enquiries', rawValue: newEnquiries,
      formatted: newEnquiries.toLocaleString('en-IN'), sub: 'Awaiting response',
      icon: MessageSquare, hex: '#3B82F6', nav: hasClassOrProgram ? 'ENQUIRIES' : 'BOOKINGS',
    },
    {
      label: 'Profile Views', rawValue: profileViews,
      formatted: profileViews.toLocaleString('en-IN'), sub: 'Total reach',
      icon: Eye, hex: '#8B5CF6', nav: 'ANALYTICS',
    },
    {
      label: 'Followers', rawValue: followersTotal,
      formatted: followersTotal.toLocaleString('en-IN'), sub: 'Brand followers',
      icon: Heart, hex: '#F43F5E', nav: 'FOLLOWERS',
    },
    {
      label: 'Reviews', rawValue: reviewsData?.total_reviews ?? 0,
      formatted: (reviewsData?.total_reviews ?? 0).toLocaleString('en-IN'),
      sub: reviewsData?.avg_rating ? `${reviewsData.avg_rating.toFixed(1)}★ avg` : 'No reviews yet',
      icon: Star, hex: '#F59E0B', nav: 'REVIEWS',
    },
    {
      label: 'Revenue', rawValue: grossRevenue, isCurrency: true,
      formatted: fmtCurrency(grossRevenue), sub: 'Gross collected',
      icon: IndianRupee, hex: '#141414', highlight: true, nav: 'ANALYTICS',
      trendPct: revenueGrowth,
      sparkData: revenueTrendData.length >= 2 ? revenueTrendData : undefined,
    },
  ];

  // ------ Offering cards ------
  type OfferingCard = { entity: string; icon: React.ElementType; hex: string; tag: string; stats: [string, string | number][]; nav: Screen };
  const offeringCards: OfferingCard[] = allowedEntities.map((entity): OfferingCard | null => {
    switch (entity) {
      case 'Events': return { entity, icon: CalendarDays, hex: '#3B82F6', tag: 'Ticketing', stats: [['Tickets sold', ticketsSold], ['Upcoming', eventsData?.upcoming ?? 0]], nav: 'SERVICE_LISTINGS' };
      case 'Classes': return { entity, icon: BookOpen, hex: '#8B5CF6', tag: 'Enquiry', stats: [['Active batches', activeBatches], ['Enquiries', newEnquiries]], nav: 'ENQUIRIES' };
      case 'Programs': return { entity, icon: GraduationCap, hex: '#10B981', tag: 'Enquiry', stats: [['Active batches', activeBatches], ['Enquiries', newEnquiries]], nav: 'ENQUIRIES' };
      case 'Venues': return { entity, icon: MapPin, hex: '#F59E0B', tag: 'Hybrid', stats: [['Bookings', venueBookings], ['Occupancy', `${venuesData?.occupancy_rate ?? 0}%`]], nav: 'SERVICE_LISTINGS' };
      default: return null;
    }
  }).filter((c): c is OfferingCard => c !== null);

  const handleActivityClick = (n: InAppNotification) => {
    if (!n.is_read) {
      markNotificationRead(n.id).catch(() => { /* non-fatal */ });
      setActivity(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    if (n.action_url) window.open(n.action_url, '_blank', 'noopener,noreferrer');
    else onNavigate('MESSAGES');
  };

  if (loading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-colors lg:hidden">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">Dashboard</h1>
              <p className="text-[11px] font-medium text-gray-400 mt-0.5 hidden sm:block">{todayStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Command bar hint */}
            <button
              onClick={() => onNavigate('ANALYTICS')}
              className="hidden md:flex items-center gap-2 h-9 px-3.5 rounded-xl bg-gray-50 border border-gray-200/80 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all"
            >
              <LineChart size={15} />
              <span className="text-xs font-semibold">Analytics</span>
            </button>
            <NotificationCenter variant="light" onNavigate={onNavigate} />
            {/* Profile avatar */}
            <div className="relative" ref={profilePopupRef}>
              <button
                onClick={() => setShowProfilePopup(!showProfilePopup)}
                className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors overflow-hidden ring-2 ring-transparent hover:ring-gray-300"
              >
                {extendedData?.logo
                  ? <img src={extendedData.logo} alt="" className="w-9 h-9 rounded-xl object-cover" />
                  : <UserCircle size={20} className="text-gray-500" />
                }
              </button>
              {showProfilePopup && (
                <div className="absolute right-0 mt-2 w-[320px] bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 border border-gray-200/60 overflow-hidden z-50">
                  {/* Dark header */}
                  <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 py-5 overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl" />
                    <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-blue-400/10 rounded-full blur-2xl" />
                    <div className="relative flex items-center gap-3.5">
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
                      <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide ${
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
                  <div className="grid grid-cols-3 divide-x divide-gray-100">
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
                    <div className="px-4 py-3 flex flex-wrap gap-1.5 border-t border-gray-100">
                      {allowedEntities.map(e => {
                        const c = e === 'Events' ? 'bg-blue-50 text-blue-600' : e === 'Classes' ? 'bg-purple-50 text-purple-600' : e === 'Programs' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600';
                        return <span key={e} className={`text-[9px] font-black uppercase tracking-wide px-2.5 py-1 rounded-md ${c}`}>{e}</span>;
                      })}
                    </div>
                  )}
                  {/* Actions */}
                  <div className="p-2 border-t border-gray-100">
                    <button onClick={() => { setShowProfilePopup(false); onNavigate('BRAND_PROFILE'); }} className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"><Edit3 size={14} className="text-gray-400" />Edit Profile</button>
                    <button onClick={() => { setShowProfilePopup(false); onNavigate('PREVIEW_PROFILE'); }} className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"><Eye size={14} className="text-gray-400" />Preview Profile</button>
                    <div className="my-1 border-t border-gray-100" />
                    <button onClick={() => { setShowProfilePopup(false); onNavigate('LANDING'); }} className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors"><LogOut size={14} />Sign Out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        {/* ─── Welcome Hero ─── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5"
        >
          {/* Decorative elements */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-yellow-400/[0.06] rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-blue-400/[0.06] rounded-full blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 ring-2 ring-white/5">
                {extendedData?.logo ? <img src={extendedData.logo} alt="" className="w-10 h-10 rounded-full object-cover" /> : <UserCircle size={22} className="text-white/70" />}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
                  Good {greeting}, {businessName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Showing: Since launch
                  </span>
                  {allowedEntities.length > 0 && (
                    <span className="text-[10px] font-bold text-gray-500 border-l border-gray-600 pl-2">
                      {allowedEntities.length} offering{allowedEntities.length > 1 ? 's' : ''} active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile completion ring */}
            <div className="shrink-0 flex items-center gap-3 bg-white/[0.05] backdrop-blur-sm rounded-xl p-2.5 border border-white/[0.08]">
              <CompletionRing pct={profileCompletion} size={42} />
              <div className="min-w-0 pr-2">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{profileCompletion >= 100 ? 'All set 🎉' : 'Profile Progress'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] font-bold text-white">{checklistDone} / {checklist.length} steps</p>
                  <button
                    onClick={() => onNavigate(profileCompletion < 100 ? 'BRAND_PROFILE' : 'ANALYTICS')}
                    className="flex items-center gap-1 text-[10px] font-black text-yellow-400 hover:text-yellow-300 transition-colors bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-md"
                  >
                    {profileCompletion < 100 ? 'Complete' : 'Analytics'} <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ─── Onboarding Tracker ─── */}
        {isActive && !isVerified && (
          <motion.section {...fadeUp} transition={{ duration: 0.3 }} className="bg-white rounded-2xl border border-gray-200/60 p-5 sm:p-6 shadow-sm">
            <h2 className="font-bold text-sm text-gray-900 mb-4 flex items-center gap-2">
              <Activity size={16} className="text-amber-500" /> Onboarding Progress
            </h2>
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
                      <button onClick={step.action} className="bg-tlb-yellow text-tlb-dark px-4 py-2 rounded-lg text-xs font-bold shrink-0 hover:brightness-110 transition-all">
                        {step.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ─── KPI Grid ─── */}
        <motion.section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3" variants={stagger} initial="initial" animate="animate">
          {primaryKpis.map(k => (
            <motion.button
              key={k.label}
              variants={fadeUp}
              whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
              onClick={() => onNavigate(k.nav)}
              className={`group relative text-left rounded-2xl border overflow-hidden transition-all duration-200 ${
                k.highlight
                  ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 text-white hover:shadow-xl hover:shadow-gray-900/20'
                  : 'bg-white border-gray-200/60 hover:shadow-lg hover:shadow-gray-200/60 hover:border-gray-300'
              }`}
            >
              {/* Sparkline background */}
              {k.sparkData && (
                <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20 pointer-events-none">
                  <AreaSparkline data={k.sparkData} color={k.highlight ? '#FACC15' : k.hex} id={`kpi-${k.label.replace(/\s/g,'')}`} />
                </div>
              )}
              <div className="relative p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${k.highlight ? 'text-gray-400' : 'text-gray-400'}`}>
                    {k.label}
                  </p>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: k.highlight ? 'rgba(250,204,21,0.15)' : `${k.hex}14`, color: k.highlight ? '#FACC15' : k.hex }}
                  >
                    <k.icon size={14} />
                  </div>
                </div>
                <div>
                  {k.isCurrency
                    ? <CountUpCurrency value={k.rawValue} className={`text-2xl xl:text-[22px] font-black leading-none ${k.highlight ? 'text-white' : 'text-gray-900'}`} />
                    : <CountUpValue value={k.rawValue} className={`text-2xl xl:text-[22px] font-black leading-none ${k.highlight ? 'text-white' : 'text-gray-900'}`} />
                  }
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <p className={`text-[11px] font-medium ${k.highlight ? 'text-gray-400' : 'text-gray-400'}`}>{k.sub}</p>
                  {k.trendPct !== undefined && <TrendBadge pct={k.trendPct} />}
                </div>
              </div>
            </motion.button>
          ))}
        </motion.section>

        {/* ─── Revenue Overview + Recent Activity ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Revenue Overview — 2/3 */}
          <motion.section {...fadeUp} transition={{ duration: 0.35 }} className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-900 text-yellow-400 flex items-center justify-center">
                    <IndianRupee size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 tracking-tight leading-none">Revenue Overview</h3>
                    <p className="text-[11px] font-medium text-gray-400 mt-0.5">All-time performance</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {revenueGrowth !== 0 && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black ${revenueGrowth > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      {revenueGrowth > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {Math.abs(revenueGrowth)}% MoM
                    </span>
                  )}
                  <button onClick={() => onNavigate('ANALYTICS')} className="text-[11px] font-black text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                    Details <ArrowRight size={11} />
                  </button>
                </div>
              </div>

              {/* Revenue figures */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Gross Revenue</p>
                  <p className="text-xl font-black text-gray-900">{fmtCurrency(grossRevenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Net Earnings</p>
                  <p className="text-xl font-black text-gray-900">{fmtCurrency(netEarnings)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Avg Order</p>
                  <p className="text-xl font-black text-gray-900">{fmtCurrency(moneyToNum(revenueData?.avg_order_value))}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Refunds</p>
                  <p className="text-xl font-black text-gray-900">{fmtCurrency(moneyToNum(revenueData?.refunds))}</p>
                </div>
              </div>

              {/* Revenue trend chart + donut side by side */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Trend chart */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Revenue Trend</p>
                  {revenueTrendData.length >= 2 ? (
                    <TrendAreaChart data={revenueTrendData} labels={revenueTrendLabels} color="#141414" id="rev-trend" />
                  ) : (
                    <div className="h-20 flex items-center justify-center">
                      <p className="text-[11px] text-gray-300 font-bold">Not enough data yet</p>
                    </div>
                  )}
                </div>
                {/* Donut breakdown */}
                <div className="w-full md:w-40 shrink-0 flex flex-col items-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">By Type</p>
                  <div className="w-28 h-28">
                    <DonutChart
                      segments={revenueByType.length > 0 ? revenueByType : [{ value: 1, color: '#E5E7EB', label: 'None' }]}
                      centerLabel={fmtCurrency(grossRevenue)}
                      centerSub="Total"
                    />
                  </div>
                  {revenueByType.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                      {revenueByType.map(s => (
                        <span key={s.label} className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Recent Activity — 1/3 */}
          <motion.section {...fadeUp} transition={{ duration: 0.35, delay: 0.05 }} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm flex flex-col">
            <div className="p-5 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-base font-black text-gray-900 tracking-tight">Recent Activity</h3>
              <button onClick={() => onNavigate('MESSAGES')} className="text-[11px] font-black text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                View all <ArrowRight size={11} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto" style={{ maxHeight: 420 }}>
              {activity.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2.5 py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                    <Inbox size={22} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-400">No activity yet</p>
                  <p className="text-[11px] text-gray-400 max-w-[200px]">Bookings, enquiries &amp; alerts will appear here.</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {activity.map((n, i) => {
                    const meta = activityMeta(n.notification_type);
                    return (
                      <motion.button
                        key={n.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.24) }}
                        onClick={() => handleActivityClick(n)}
                        className="w-full text-left flex items-start gap-3 py-3 px-3 -mx-1 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${TINT[meta.tint]}`}>
                          <meta.icon size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[13px] leading-snug ${n.is_read ? 'font-semibold text-gray-600' : 'font-bold text-gray-900'}`}>
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">{n.body}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />}
                            <span className="text-[10px] font-semibold text-gray-400">{timeAgo(n.created_at)}</span>
                            {n.action_url && <ExternalLink size={10} className="text-gray-300 group-hover:text-blue-500 transition-colors" />}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.section>
        </div>

        {/* ─── At a Glance — Offering Cards ─── */}
        {offeringCards.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-gray-900 tracking-tight">At a glance — by offering</h3>
              <button onClick={() => onNavigate('SERVICE_LISTINGS')} className="text-[11px] font-black text-blue-500 hover:text-blue-600 flex items-center gap-1 shrink-0 transition-colors">
                All listings <ArrowRight size={11} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {offeringCards.map((c, idx) => (
                <motion.button
                  key={c.entity}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.05, 0.2) }}
                  whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                  onClick={() => onNavigate(c.nav)}
                  className="group text-left bg-white rounded-2xl border border-gray-200/60 overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  {/* Colored top accent */}
                  <div className="h-1" style={{ backgroundColor: c.hex }} />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105" style={{ backgroundColor: `${c.hex}12`, color: c.hex }}>
                          <c.icon size={17} />
                        </div>
                        <p className="text-sm font-black text-gray-900">{c.entity}</p>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md" style={{ backgroundColor: `${c.hex}12`, color: c.hex }}>{c.tag}</span>
                    </div>
                    <div className="flex items-center gap-5">
                      {c.stats.map(([label, value]) => (
                        <div key={label}>
                          <p className="text-lg font-black text-gray-900 leading-none">{value}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1 text-[11px] font-semibold text-gray-400 group-hover:text-gray-600 transition-colors">
                      View details <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* ─── Latest Listings + Bookings Calendar ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
