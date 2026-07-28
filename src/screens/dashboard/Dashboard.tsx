import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Menu, UserCircle, CheckCircle2, ArrowRight,
  Inbox, Eye, BarChart3, CalendarDays, LineChart,
  Ticket, MapPin, Edit3, LogOut,
  Heart, Activity, IndianRupee, Star, MessageSquare,
  ClipboardList, Megaphone, RotateCcw, Bell, ExternalLink,
  BookOpen, GraduationCap,
} from 'lucide-react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { EntityPickerSheet } from '../../components/EntityPickerSheet';
import { NotificationCenter } from '../../components/NotificationCenter';
import { SkeletonDashboard, fmtCurrency, BookingsCalendar, LatestListings } from '../../components/ui';
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

// Soft icon-tint palette shared by Activity Summary + Recent Activity rows.
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

// Map a notification_type to an icon + tint for the Recent Activity feed.
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

// --------- Completion ring --------------------------------------------------

const CompletionRing: React.FC<{ pct: number; size?: number }> = ({ pct, size = 56 }) => {
  const r = 24, circ = 2 * Math.PI * r;
  const color = pct >= 100 ? '#141414' : '#FACC15';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 60 60" className="-rotate-90" style={{ width: size, height: size }}>
        <circle cx="30" cy="30" r={r} fill="none" stroke="#F3F4F6" strokeWidth="6" />
        <motion.circle
          cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-black text-gray-900 leading-none ${size < 50 ? 'text-[11px]' : 'text-sm'}`}>{pct}%</span>
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
  // Aggregate sources for the Activity Summary + the Recent Activity feed.
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

  // ------ Derived stat sources (canonical: /stats/*, legacy dashboard as fallback) ------
  const d = dashboardData || {};
  const ticketsSold = eventsData?.tickets_sold ?? d.tickets_sold ?? 0;
  const venueBookings = venuesData?.total_bookings ?? d.venue_bookings ?? 0;
  const profileViews = overviewData?.profile_views ?? d.profile_views ?? 0;
  const newEnquiries = overviewData?.new_enquiries ?? d.new_enquiries ?? 0;
  const activeBatches = overviewData?.active_batches ?? d.active_batches ?? 0;

  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening';

  // ------ Activity Summary rows (partner-scoped, since launch) ------
  const followersTotal = followerCount ?? overviewData?.followers ?? 0;
  const summaryRows: { icon: React.ElementType; tint: string; label: string; value: string }[] = (() => {
    const rows: { icon: React.ElementType; tint: string; label: string; value: string }[] = [];
    rows.push({ icon: CheckCircle2, tint: 'emerald', label: 'Bookings confirmed', value: (revenueData?.confirmed_bookings ?? 0).toLocaleString('en-IN') });
    if (hasEvents) rows.push({ icon: Ticket, tint: 'blue', label: 'Tickets sold', value: (eventsData?.tickets_sold ?? ticketsSold).toLocaleString('en-IN') });
    if (hasVenues) rows.push({ icon: MapPin, tint: 'amber', label: 'Venue bookings', value: (venuesData?.total_bookings ?? venueBookings).toLocaleString('en-IN') });
    rows.push({ icon: MessageSquare, tint: 'blue', label: 'New enquiries', value: newEnquiries.toLocaleString('en-IN') });
    rows.push({ icon: IndianRupee, tint: 'amber', label: 'Revenue collected', value: fmtCurrency(moneyToNum(revenueData?.gross_revenue)) });
    if (moneyToNum(revenueData?.refunds) > 0) rows.push({ icon: RotateCcw, tint: 'rose', label: 'Refunds processed', value: fmtCurrency(moneyToNum(revenueData?.refunds)) });
    rows.push({ icon: Eye, tint: 'purple', label: 'Profile views', value: profileViews.toLocaleString('en-IN') });
    rows.push({ icon: Heart, tint: 'rose', label: 'Followers', value: followersTotal.toLocaleString('en-IN') });
    rows.push({
      icon: Star, tint: 'yellow', label: 'Reviews received',
      value: (reviewsData?.total_reviews ?? 0).toLocaleString('en-IN') + (reviewsData?.avg_rating ? ` · ${reviewsData.avg_rating.toFixed(1)}★` : ''),
    });
    if (hasClassOrProgram) rows.push({ icon: BarChart3, tint: 'emerald', label: 'Active batches', value: activeBatches.toLocaleString('en-IN') });
    return rows;
  })();

  // ------ Primary KPIs (since launch) — the top stat grid ------
  const primaryKpis: { label: string; value: string; sub: string; icon: React.ElementType; hex: string; highlight?: boolean; nav: Screen }[] = [
    { label: 'Bookings Confirmed', value: (revenueData?.confirmed_bookings ?? 0).toLocaleString('en-IN'), sub: 'Since launch total', icon: CheckCircle2, hex: '#10B981', nav: 'BOOKINGS' },
    { label: 'New Enquiries', value: newEnquiries.toLocaleString('en-IN'), sub: 'Awaiting your response', icon: MessageSquare, hex: '#3B82F6', nav: hasClassOrProgram ? 'ENQUIRIES' : 'BOOKINGS' },
    { label: 'Profile Views', value: profileViews.toLocaleString('en-IN'), sub: 'Since launch total', icon: Eye, hex: '#8B5CF6', nav: 'ANALYTICS' },
    { label: 'Followers', value: followersTotal.toLocaleString('en-IN'), sub: 'Across your brand', icon: Heart, hex: '#F43F5E', nav: 'FOLLOWERS' },
    { label: 'Reviews', value: (reviewsData?.total_reviews ?? 0).toLocaleString('en-IN'), sub: reviewsData?.avg_rating ? `${reviewsData.avg_rating.toFixed(1)}★ average rating` : 'No reviews yet', icon: Star, hex: '#F59E0B', nav: 'REVIEWS' },
    { label: 'Revenue Collected', value: fmtCurrency(moneyToNum(revenueData?.gross_revenue)), sub: 'View breakdown', icon: IndianRupee, hex: '#141414', highlight: true, nav: 'ANALYTICS' },
  ];

  // ------ At-a-glance, one card per active offering ------
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

      <main className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">

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

        {/* Intro + profile spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          <motion.div {...fadeUp} transition={{ duration: 0.3 }} className="lg:col-span-2 flex flex-col justify-center">
            <p className="text-xs text-gray-400 font-medium">Good {greeting}, {businessName}</p>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-1">Your Overview</h2>
            <p className="text-[13px] text-gray-500 mt-1.5 max-w-md leading-relaxed">
              A cross-vertical snapshot of your brand — reach, bookings, and revenue in one place.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Showing: Since launch
              </span>
              {allowedEntities.length > 0 && (
                <span className="text-[11px] font-bold text-gray-400">
                  {allowedEntities.length} offering{allowedEntities.length > 1 ? 's' : ''} active
                </span>
              )}
            </div>
          </motion.div>

          {/* Profile spotlight — the top-right focal card */}
          <motion.section {...fadeUp} transition={{ duration: 0.3, delay: 0.05 }} className="relative overflow-hidden rounded-2xl bg-tlb-dark text-white p-5">
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-tlb-yellow/10 rounded-full blur-2xl" />
            <div className="relative flex items-center gap-4">
              <CompletionRing pct={profileCompletion} size={52} />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Your Profile</p>
                <p className="text-sm font-black mt-0.5">
                  {profileCompletion >= 100 ? 'All set 🎉' : profileCompletion >= 60 ? 'Almost there' : 'Getting started'}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{checklistDone} of {checklist.length} steps done</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate(profileCompletion < 100 ? 'BRAND_PROFILE' : 'ANALYTICS')}
              className="relative mt-4 w-full bg-tlb-yellow text-tlb-dark rounded-lg py-2 text-xs font-black flex items-center justify-center gap-1.5 hover:brightness-110 transition-all"
            >
              {profileCompletion < 100 ? 'Complete Your Profile' : 'View Analytics'} <ArrowRight size={13} />
            </button>
          </motion.section>
        </div>

        {/* Primary KPI grid — 6 headline stats (F-pattern, revenue highlighted) */}
        <motion.section className="grid grid-cols-2 lg:grid-cols-3 gap-4" variants={stagger} initial="initial" animate="animate">
          {primaryKpis.map(k => (
            <motion.button
              key={k.label}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              onClick={() => onNavigate(k.nav)}
              className={`group relative text-left rounded-2xl border p-5 overflow-hidden transition-shadow ${k.highlight ? 'bg-gradient-to-br from-tlb-yellow/20 to-tlb-yellow/5 border-tlb-yellow/40 hover:shadow-lg' : 'bg-white border-gray-100 hover:shadow-lg'}`}
            >
              <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-15 transition-opacity duration-500" style={{ background: k.hex }} />
              <div className="relative flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{k.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${k.hex}14`, color: k.hex }}>
                  <k.icon size={14} />
                </div>
              </div>
              <p className={`relative text-3xl font-black leading-none ${k.highlight ? 'text-tlb-dark' : 'text-gray-900'}`}>{k.value}</p>
              <p className={`relative text-[11px] font-bold mt-2 flex items-center gap-1 ${k.highlight ? 'text-amber-700' : 'text-gray-400'}`}>
                {k.sub}
                {k.highlight && <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />}
              </p>
            </motion.button>
          ))}
        </motion.section>

        {/* At a glance — one card per active offering */}
        {offeringCards.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-gray-900 tracking-tight">At a glance — by offering</h3>
              <button onClick={() => onNavigate('SERVICE_LISTINGS')} className="text-[11px] font-black text-blue-500 hover:underline flex items-center gap-1 shrink-0">
                All listings <ArrowRight size={11} />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {offeringCards.map((c, idx) => (
                <motion.button
                  key={c.entity}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.05, 0.2) }}
                  whileHover={{ y: -3 }}
                  onClick={() => onNavigate(c.nav)}
                  className="group text-left bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105" style={{ backgroundColor: `${c.hex}14`, color: c.hex }}>
                      <c.icon size={17} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md" style={{ backgroundColor: `${c.hex}14`, color: c.hex }}>{c.tag}</span>
                  </div>
                  <p className="text-sm font-black text-gray-900 mt-3">{c.entity}</p>
                  <div className="flex items-center gap-5 mt-2">
                    {c.stats.map(([label, value]) => (
                      <div key={label}>
                        <p className="text-lg font-black text-gray-900 leading-none">{value}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* Activity Summary + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Activity Summary */}
          <motion.section {...fadeUp} transition={{ duration: 0.3 }} className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-tlb-dark text-tlb-yellow flex items-center justify-center">
                  <Activity size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 tracking-tight leading-none">Activity Summary</h3>
                  <p className="text-[11px] font-medium text-gray-400 mt-0.5">Your performance since launch</p>
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-0">
              {summaryRows.map((r, i) => (
                <motion.div
                  key={r.label}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.24) }}
                  className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TINT[r.tint]}`}>
                    <r.icon size={15} />
                  </div>
                  <span className="text-[13px] font-medium text-gray-600 flex-1 min-w-0 truncate">{r.label}</span>
                  <span className="text-sm font-black text-gray-900 shrink-0">{r.value}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Recent Activity */}
          <motion.section {...fadeUp} transition={{ duration: 0.3, delay: 0.05 }} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-gray-900 tracking-tight">Recent Activity</h3>
              <button onClick={() => onNavigate('MESSAGES')} className="text-[11px] font-black text-blue-500 hover:underline flex items-center gap-1 shrink-0">
                View all <ArrowRight size={11} />
              </button>
            </div>
            {activity.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10 text-center">
                <Inbox size={30} className="text-gray-200" />
                <p className="text-xs font-bold text-gray-400">No activity yet</p>
                <p className="text-[11px] text-gray-400">Bookings, enquiries &amp; alerts will show up here.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activity.map((n, i) => {
                  const meta = activityMeta(n.notification_type);
                  return (
                    <motion.button
                      key={n.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.24) }}
                      onClick={() => handleActivityClick(n)}
                      className="w-full text-left flex items-start gap-3 py-2.5 px-2 -mx-2 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${TINT[meta.tint]}`}>
                        <meta.icon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] leading-snug truncate ${n.is_read ? 'font-bold text-gray-700' : 'font-black text-gray-900'}`}>{n.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-tlb-yellow shrink-0" />}
                          <span className="text-[10px] font-bold text-gray-400">{timeAgo(n.created_at)}</span>
                          {n.action_url && <ExternalLink size={10} className="text-gray-300 group-hover:text-blue-500 transition-colors" />}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.section>
        </div>

        {/* Latest listings + Bookings calendar (functional widgets) */}
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
