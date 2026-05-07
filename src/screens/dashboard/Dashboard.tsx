import React, { useState, useRef, useEffect } from 'react';
import {
  Menu, Bell, UserCircle, CheckCircle2,
  Inbox, Eye, BarChart3, CreditCard, Plus, CalendarDays, MapPin, Ticket, Loader2,
  TrendingUp, TrendingDown, Users, Target, Activity, Star, ArrowRight,
  Clock, DollarSign, Percent, Zap, BookOpen, Award
} from 'lucide-react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { EntityPickerSheet } from '../../components/EntityPickerSheet';
import {
  getPartnerDashboard, getCurrentPartner, getBusinessProfile,
  getExtendedProfile, getPartnerMedia
} from '../../api/onboarding';

// ─── Chart Primitives ─────────────────────────────────────────────────────────

const AreaSparkline: React.FC<{ data: number[]; color: string; id: string }> = ({ data, color, id }) => {
  if (data.length < 2) return null;
  const h = 44, w = 100;
  const max = Math.max(...data); const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = pts.join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sp-${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {(() => {
        const last = pts[pts.length - 1].split(',').map(Number);
        return <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />;
      })()}
    </svg>
  );
};

const TrendAreaChart: React.FC<{
  data: number[]; labels: string[]; color: string; id: string; formatY?: (v: number) => string;
}> = ({ data, labels, color, id, formatY }) => {
  if (data.length < 2) return null;
  const h = 80, w = 400;
  const max = Math.max(...data, 1); const min = 0;
  const range = max - min;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = pts.join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  const step = Math.ceil(labels.length / 5);
  const shown = labels.map((l, i) => ({ l, i, show: i % step === 0 || i === labels.length - 1 })).filter(x => x.show);
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id={`ta-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#ta-${id})`} />
        <polyline points={line} fill="none" stroke={color} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />
        {(() => {
          const last = pts[pts.length - 1].split(',').map(Number);
          return <circle cx={last[0]} cy={last[1]} r="3.5" fill="white" stroke={color} strokeWidth="2" />;
        })()}
      </svg>
      <div className="flex justify-between mt-1.5 px-0.5">
        {shown.map(({ l, i }) => (
          <span key={i} className="text-[9px] text-gray-400 font-bold">{l}</span>
        ))}
      </div>
    </div>
  );
};

const WeeklyBarChart: React.FC<{ data: number[]; labels: string[]; color: string; highlightLast?: boolean }> = ({
  data, labels, color, highlightLast = true,
}) => {
  const max = Math.max(...data, 1);
  const total = data.reduce((a, b) => a + b, 0);
  return (
    <div>
      <div className="flex items-end gap-1.5 h-20">
        {data.map((v, i) => {
          const isLast = highlightLast && i === data.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              {v > 0 ? (
                <div
                  className="w-full rounded-t-lg transition-all duration-500"
                  style={{
                    height: `${Math.max((v / max) * 64, 4)}px`,
                    backgroundColor: color,
                    opacity: isLast ? 1 : 0.45 + (i / data.length) * 0.45,
                  }}
                />
              ) : (
                <div className="w-full rounded-t-lg" style={{ height: 4, backgroundColor: '#F3F4F6' }} />
              )}
              <span className={`text-[9px] font-bold ${isLast ? 'text-gray-700' : 'text-gray-400'}`}>{labels[i]}</span>
            </div>
          );
        })}
      </div>
      {total === 0 && (
        <p className="text-center text-[10px] font-bold text-gray-300 mt-3 uppercase tracking-widest">No activity yet this week</p>
      )}
    </div>
  );
};

const DonutChart: React.FC<{
  segments: { value: number; color: string; label: string }[];
  centerLabel?: string; centerSub?: string;
}> = ({ segments, centerLabel, centerSub }) => {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  const r = 35, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  let acc = 0;
  const arcs = segments.map(seg => {
    const dash = (seg.value / total) * circ;
    const arc = { ...seg, dash, acc };
    acc += dash;
    return arc;
  });
  const hasData = segments.some(s => s.value > 0);
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth="12" />
      {hasData ? arcs.map((arc, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={arc.color} strokeWidth="12"
          strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
          strokeDashoffset={circ / 4 - arc.acc}
          transform="rotate(-90 50 50)"
          strokeLinecap="butt"
        />
      )) : (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth="12" strokeDasharray="4 3" />
      )}
      {centerLabel && (
        <text x="50" y="47" textAnchor="middle" fill="#111827" fontSize="13" fontWeight="900">{centerLabel}</text>
      )}
      {centerSub && (
        <text x="50" y="58" textAnchor="middle" fill="#9CA3AF" fontSize="6.5" fontWeight="700">{centerSub}</text>
      )}
    </svg>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`;

const trendPct = (arr: number[]) => {
  if (arr.length < 2) return 0;
  const prev = arr[arr.length - 2]; const curr = arr[arr.length - 1];
  return prev ? Math.round(((curr - prev) / prev) * 100) : 0;
};

const TrendBadge: React.FC<{ pct: number }> = ({ pct }) => {
  if (pct === 0) return <span className="text-[9px] font-bold text-gray-300">—</span>;
  const up = pct > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] font-black ${up ? 'text-emerald-500' : 'text-red-400'}`}>
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {Math.abs(pct)}%
    </span>
  );
};

// ─── Types / Constants ────────────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set(['activated_limited', 'under_review', 'approved']);
const VERIFICATION_SUBMITTED_STATUSES = new Set(['under_review', 'approved']);

const MONTH_LABELS_6 = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Component ────────────────────────────────────────────────────────────────

interface HomeProps { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

export const Home: React.FC<HomeProps> = ({ onNavigate, onOpenSidebar }) => {
  const { allowedEntities, setAllowedEntities } = usePartner();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [partnerData, setPartnerData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [extendedData, setExtendedData] = useState<any>(null);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
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

  const handleAddListing = () => {
    if (allowedEntities.length === 1) {
      const e = allowedEntities[0];
      if (e === 'Events') onNavigate('CREATE_EVENT_DETAILS');
      else if (e === 'Venues') onNavigate('CREATE_VENUE_DETAILS');
      else if (e === 'Programs') onNavigate('CREATE_PROGRAM_IDENTITY');
      else onNavigate('CREATE_LISTING_IDENTITY');
    } else if (allowedEntities.length > 1) setShowEntityPicker(true);
    else onNavigate('CREATE_LISTING_IDENTITY');
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
    ...(hasClassOrProgram ? [{ label: 'Enquiries', screen: 'ENQUIRIES' as Screen, icon: Inbox }] : []),
    { label: 'Finance', screen: 'FINANCIAL_HUB' as Screen, icon: CreditCard },
  ];

  // ── Analytics data: API first, then stub fallback ──────────────────────────

  const d = dashboardData || {};

  const weeklyActivity: number[] = d.weekly_activity ||
    (hasEvents ? [0, 0, 0, 0, 0, 0, 0] :
     hasVenues ? [0, 0, 0, 0, 0, 0, 0] :
                 [0, 0, 0, 0, 0, 0, 0]);

  const monthlyEnquiries: number[] = d.monthly_enquiries || [0, 0, 0, 0, 0, 0];
  const monthlyRevenue: number[] = d.monthly_revenue || [0, 0, 0, 0, 0, 0];
  const monthlyTickets: number[] = d.monthly_tickets || [0, 0, 0, 0, 0, 0];
  const monthlyBookings: number[] = d.monthly_bookings || [0, 0, 0, 0, 0, 0];

  const funnelNew = d.funnel_new ?? d.new_enquiries ?? 0;
  const funnelContacted = d.funnel_contacted ?? 0;
  const funnelConverted = d.funnel_converted ?? 0;
  const convRate = funnelNew > 0 ? Math.round((funnelConverted / funnelNew) * 100) : 0;

  const ticketsSold = d.tickets_sold ?? 0;
  const totalRegistrations = d.total_registrations ?? 0;
  const upcomingEvents = d.upcoming_events ?? 0;
  const eventReach = d.event_reach ?? 0;

  const venueBookings = d.venue_bookings ?? 0;
  const occupancyRate = d.occupancy_rate ?? 0;
  const upcomingReservations = d.upcoming_reservations ?? 0;
  const monthlyEarnings = d.monthly_earnings ?? 0;

  const topListings: any[] = d.top_listings || [];
  const recentActivity: any[] = d.recent_activity || [];

  // ── KPI Metrics ─────────────────────────────────────────────────────────────

  const kpiMetrics = (() => {
    if (hasClassOrProgram) {
      const enqSpark: number[] = d.weekly_enquiries || [0, 0, 0, 0, 0, 0, 0];
      const batchSpark: number[] = d.weekly_batches || [0, 0, 0, 0, 0, 0, 0];
      const viewsSpark: number[] = d.weekly_views || [0, 0, 0, 0, 0, 0, 0];
      const creditSpark: number[] = d.weekly_credits || [0, 0, 0, 0, 0, 0, 0];
      return [
        { label: 'New Enquiries', value: d.new_enquiries?.toString() || '0', icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-50', hex: '#3B82F6', sparkId: 'enq', spark: enqSpark },
        { label: 'Active Batches', value: d.active_batches?.toString() || '0', icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50', hex: '#10B981', sparkId: 'bat', spark: batchSpark },
        { label: 'Profile Views', value: d.profile_views?.toString() || '0', icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50', hex: '#8B5CF6', sparkId: 'vw', spark: viewsSpark },
        { label: 'Credit Balance', value: d.credit_balance?.toString() || '0', icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50', hex: '#F59E0B', sparkId: 'cr', spark: creditSpark },
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
      { label: 'Credit Balance', value: d.credit_balance?.toString() || '0', icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50', hex: '#F59E0B', sparkId: 'gcr', spark: [0,0,0,0,0,0,0] as number[] },
    ];
  })();

  // ── Section label helpers ──────────────────────────────────────────────────

  const weeklyLabel = hasEvents ? 'Weekly Ticket Sales' :
                      hasVenues ? 'Weekly Bookings' :
                                  'Weekly Enquiries';

  const trendLabel = hasEvents ? 'Ticket Sales Trend' :
                     hasVenues ? 'Booking Revenue Trend' :
                                 'Enquiry & Enrolment Trend';

  const trendData = hasEvents ? monthlyTickets :
                    hasVenues ? monthlyRevenue :
                                monthlyEnquiries;

  const trendColor = hasEvents ? '#8B5CF6' : hasVenues ? '#F59E0B' : '#3B82F6';
  const trendId = hasEvents ? 'evtkt' : hasVenues ? 'vnrev' : 'clsenq';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="text-tlb-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
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
          <button
            onClick={() => onNavigate('BRAND_PROFILE')}
            className="w-10 h-10 rounded-full bg-tlb-yellow/10 flex items-center justify-center text-tlb-yellow hover:bg-tlb-yellow/20 transition-colors"
          >
            <UserCircle size={24} />
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="tlb-content space-y-8">

          {/* ── Onboarding Tracker ── */}
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
                      ? <p className="text-[10px] text-tlb-yellow font-bold uppercase tracking-widest mt-0.5">In Progress — typically 24–48 hrs</p>
                      : <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Unlocks after Step 2</p>}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── Welcome Banner ── */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tlb-dark to-gray-900 p-6 sm:p-8 text-white">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-tlb-yellow/10 rounded-full blur-2xl" />
            <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-tlb-yellow/5 rounded-full blur-xl" />
            <div className="relative z-10">
              <h2 className="text-2xl font-black leading-tight">Welcome back, {businessName}! 👋</h2>
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

          {/* ── KPI Cards ── */}
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

          {/* ── Weekly Activity ── */}
          <section className="tlb-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-black text-gray-900">{weeklyLabel}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <Activity size={13} className="text-gray-400" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Total: {weeklyActivity.reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>
            <WeeklyBarChart
              data={weeklyActivity}
              labels={WEEK_LABELS}
              color={hasEvents ? '#8B5CF6' : hasVenues ? '#F59E0B' : '#3B82F6'}
            />
          </section>

          {/* ── Classes / Programs: Enquiry Insights ── */}
          {hasClassOrProgram && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900">Enquiry Insights</h3>
                <button onClick={() => onNavigate('ENQUIRIES')} className="text-xs font-bold text-tlb-yellow flex items-center gap-1 hover:underline">
                  View All <ArrowRight size={12} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Funnel Donut */}
                <div className="tlb-card p-5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Conversion Funnel</p>
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-28 shrink-0">
                      <DonutChart
                        segments={[
                          { value: funnelNew, color: '#3B82F6', label: 'New' },
                          { value: funnelContacted, color: '#FACC15', label: 'Contacted' },
                          { value: funnelConverted, color: '#10B981', label: 'Converted' },
                        ]}
                        centerLabel={`${convRate}%`}
                        centerSub="CONV. RATE"
                      />
                    </div>
                    <div className="flex-1 space-y-2.5">
                      {[
                        { label: 'New Leads', value: funnelNew, color: 'bg-blue-500' },
                        { label: 'Contacted', value: funnelContacted, color: 'bg-tlb-yellow' },
                        { label: 'Converted', value: funnelConverted, color: 'bg-emerald-500' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                          <span className="text-xs text-gray-500 flex-1">{item.label}</span>
                          <span className="text-xs font-black text-gray-900">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {funnelNew === 0 && (
                    <p className="text-center text-[10px] font-bold text-gray-300 mt-3 uppercase tracking-widest">No enquiries yet</p>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Trial Requests', value: d.trial_requests ?? 0, icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Avg. Response', value: d.avg_response_time ? `${d.avg_response_time}h` : '—', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Student Retention', value: d.retention_rate ? `${d.retention_rate}%` : '—', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Monthly Enrolments', value: d.monthly_enrolments?.toString() ?? '0', icon: Target, color: 'text-amber-500', bg: 'bg-amber-50' },
                  ].map(stat => (
                    <div key={stat.label} className="tlb-card p-4 flex flex-col gap-2">
                      <div className={`w-8 h-8 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>
                        <stat.icon size={16} />
                      </div>
                      <div>
                        <p className="text-xl font-black leading-none">{stat.value}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Enquiry Trend */}
              <div className="tlb-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-black text-gray-900">Monthly Trend</p>
                    <p className="text-xs text-gray-400 mt-0.5">Enquiries over last 6 months</p>
                  </div>
                  <span className="text-lg font-black text-blue-500">{monthlyEnquiries[monthlyEnquiries.length - 1]}</span>
                </div>
                <TrendAreaChart data={monthlyEnquiries} labels={MONTH_LABELS_6} color="#3B82F6" id="moenq" />
              </div>
            </section>
          )}

          {/* ── Events Analytics ── */}
          {hasEvents && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900">Event Analytics</h3>
                <button onClick={() => onNavigate('SERVICE_LISTINGS')} className="text-xs font-bold text-tlb-yellow flex items-center gap-1 hover:underline">
                  My Events <ArrowRight size={12} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Upcoming', value: upcomingEvents, icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { label: 'Tickets Sold', value: ticketsSold, icon: Ticket, color: 'text-purple-500', bg: 'bg-purple-50' },
                  { label: 'Registrations', value: totalRegistrations, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { label: 'Event Reach', value: eventReach, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map(stat => (
                  <div key={stat.label} className="tlb-card p-4 flex flex-col gap-2">
                    <div className={`w-8 h-8 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>
                      <stat.icon size={16} />
                    </div>
                    <div>
                      <p className="text-2xl font-black leading-none">{stat.value}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ticket Sales Trend */}
              <div className="tlb-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-black text-gray-900">Ticket Sales Trend</p>
                    <p className="text-xs text-gray-400 mt-0.5">Monthly over last 6 months</p>
                  </div>
                  <span className="text-lg font-black text-purple-500">{monthlyTickets[monthlyTickets.length - 1]}</span>
                </div>
                <TrendAreaChart data={monthlyTickets} labels={MONTH_LABELS_6} color="#8B5CF6" id="evtkt" />
              </div>

              {/* Engagement Rate + Booking Trends */}
              <div className="grid grid-cols-2 gap-3">
                <div className="tlb-card p-5">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 mb-3">
                    <Activity size={16} />
                  </div>
                  <p className="text-2xl font-black">{d.engagement_rate ? `${d.engagement_rate}%` : '—'}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Engagement Rate</p>
                </div>
                <div className="tlb-card p-5">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 mb-3">
                    <Target size={16} />
                  </div>
                  <p className="text-2xl font-black">{d.booking_conversion ? `${d.booking_conversion}%` : '—'}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Booking Conv. Rate</p>
                </div>
              </div>
            </section>
          )}

          {/* ── Venue Analytics ── */}
          {hasVenues && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900">Venue Analytics</h3>
                <button onClick={() => onNavigate('SERVICE_LISTINGS')} className="text-xs font-bold text-tlb-yellow flex items-center gap-1 hover:underline">
                  My Venues <ArrowRight size={12} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Occupancy Donut */}
                <div className="tlb-card p-5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Occupancy Rate</p>
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-28 shrink-0">
                      <DonutChart
                        segments={[
                          { value: occupancyRate, color: '#10B981', label: 'Occupied' },
                          { value: 100 - occupancyRate, color: '#F3F4F6', label: 'Available' },
                        ]}
                        centerLabel={`${occupancyRate}%`}
                        centerSub="OCCUPANCY"
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                      {[
                        { label: 'Total Bookings', value: venueBookings, color: 'bg-blue-500' },
                        { label: 'Upcoming', value: upcomingReservations, color: 'bg-amber-400' },
                        { label: 'Monthly Earnings', value: fmtCurrency(monthlyEarnings), color: 'bg-emerald-500' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                          <span className="text-xs text-gray-500 flex-1">{item.label}</span>
                          <span className="text-xs font-black text-gray-900">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Venue Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Bookings', value: venueBookings, icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Upcoming', value: upcomingReservations, icon: CalendarDays, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Avg. Duration', value: d.avg_booking_hours ? `${d.avg_booking_hours}h` : '—', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Repeat Clients', value: d.repeat_clients ?? '—', icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  ].map(stat => (
                    <div key={stat.label} className="tlb-card p-4 flex flex-col gap-2">
                      <div className={`w-8 h-8 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>
                        <stat.icon size={16} />
                      </div>
                      <div>
                        <p className="text-xl font-black leading-none">{stat.value}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Booking Revenue Trend */}
              <div className="tlb-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-black text-gray-900">Revenue Trend</p>
                    <p className="text-xs text-gray-400 mt-0.5">Monthly earnings over last 6 months</p>
                  </div>
                  <span className="text-lg font-black text-amber-500">{fmtCurrency(monthlyRevenue[monthlyRevenue.length - 1])}</span>
                </div>
                <TrendAreaChart data={monthlyRevenue} labels={MONTH_LABELS_6} color="#F59E0B" id="vnrev" />
              </div>
            </section>
          )}

          {/* ── Revenue Snapshot (universal) ── */}
          <section className="tlb-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-black text-gray-900">{trendLabel}</h3>
                <p className="text-xs text-gray-400 mt-0.5">6-month overview</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: trendColor }} />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  {hasEvents ? 'Tickets' : hasVenues ? 'Revenue' : 'Enquiries'}
                </span>
              </div>
            </div>
            <TrendAreaChart data={trendData} labels={MONTH_LABELS_6} color={trendColor} id={trendId} />

            {/* Category Breakdown */}
            {hasClassOrProgram && (
              <div className="mt-5 grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                {[
                  { label: 'New', value: monthlyEnquiries[monthlyEnquiries.length - 1], pct: 100 },
                  { label: 'Prev Month', value: monthlyEnquiries[monthlyEnquiries.length - 2], pct: monthlyEnquiries[monthlyEnquiries.length - 1] > 0 ? Math.round((monthlyEnquiries[monthlyEnquiries.length - 2] / Math.max(monthlyEnquiries[monthlyEnquiries.length - 1], 1)) * 100) : 0 },
                  { label: 'Growth', value: `${trendPct(monthlyEnquiries) > 0 ? '+' : ''}${trendPct(monthlyEnquiries)}%`, pct: null },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <p className="text-xl font-black text-gray-900">{item.value}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Top Performing Listings ── */}
          {topListings.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-900">Top Performing Listings</h3>
                <button onClick={() => onNavigate('SERVICE_LISTINGS')} className="text-xs font-bold text-tlb-yellow flex items-center gap-1 hover:underline">
                  All Listings <ArrowRight size={12} />
                </button>
              </div>
              <div className="space-y-3">
                {topListings.slice(0, 3).map((listing: any, i: number) => (
                  <div key={listing.id || i} className="tlb-card p-4 flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${i === 0 ? 'bg-tlb-yellow text-tlb-dark' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-600'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{listing.title || 'Untitled'}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{listing.listing_type || ''}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-gray-900">{listing.views ?? 0}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">views</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Recent Activity ── */}
          {recentActivity.length > 0 && (
            <section>
              <h3 className="font-black text-gray-900 mb-4">Recent Activity</h3>
              <div className="tlb-card overflow-hidden">
                {recentActivity.slice(0, 5).map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <div className="w-8 h-8 bg-tlb-yellow/10 text-tlb-yellow rounded-xl flex items-center justify-center shrink-0">
                      <Activity size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{item.title || item.text}</p>
                      {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold shrink-0 mt-0.5">{item.time || item.created_at || ''}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Profile Performance ── */}
          <section className="tlb-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-black text-gray-900">Profile Performance</h3>
                <p className="text-xs text-gray-400 mt-0.5">Visibility and engagement metrics</p>
              </div>
              <button onClick={() => onNavigate('BRAND_PROFILE')} className="text-xs font-bold text-tlb-yellow flex items-center gap-1 hover:underline">
                Edit Profile <ArrowRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Profile Views', value: d.profile_views ?? 0, icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50' },
                { label: 'Completion', value: `${profileCompletion}%`, icon: Award, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Credits', value: d.credit_balance ?? 0, icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50' },
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
            {/* Profile completion bar */}
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
                {profileCompletion === 100 ? 'Your profile is fully complete 🎉' :
                 profileCompletion >= 80 ? 'Almost there! Add a few more details.' :
                 profileCompletion >= 50 ? 'Good progress. Add bio, links & gallery.' :
                 'Complete your profile to improve discoverability.'}
              </p>
            </div>
          </section>

          {/* ── CTA Button ── */}
          <section>
            <button onClick={handleAddListing} className="tlb-button w-full py-5 shadow-lg shadow-tlb-yellow/20 text-base gap-3">
              <Plus size={22} /> {ctaLabel}
            </button>
          </section>

          {/* ── Quick Links ── */}
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

      {/* ── Footer ── */}
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
            © 2026 The Little Broadway. All rights reserved.<br />Partner Portal V3.0
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
