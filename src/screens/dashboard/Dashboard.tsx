import React, { useState, useRef, useEffect } from 'react';
import {
  Menu, Bell, ChevronRight, UserCircle, CheckCircle2,
  Inbox, Eye, BarChart3, CreditCard, Plus, CalendarDays, MapPin, Ticket, Loader2
} from 'lucide-react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { EntityPickerSheet } from '../../components/EntityPickerSheet';
import { getPartnerDashboard, getCurrentPartner, getBusinessProfile, getExtendedProfile, getPartnerMedia } from '../../api/onboarding';

interface HomeProps {
  onNavigate: (screen: Screen) => void;
  onOpenSidebar: () => void;
}

const ACTIVE_STATUSES = new Set([
  'activated_limited', 'under_review', 'approved',
]);

const VERIFICATION_SUBMITTED_STATUSES = new Set([
  'under_review', 'approved',
]);

export const Home: React.FC<HomeProps> = ({ onNavigate, onOpenSidebar }) => {
  const { allowedEntities, setAllowedEntities } = usePartner();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // API data
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
          getCurrentPartner(),
          getPartnerDashboard(),
          getBusinessProfile(),
          getExtendedProfile(),
          getPartnerMedia(),
        ]);

        if (partnerRes.status === 'fulfilled') {
          const pData = partnerRes.value.data || partnerRes.value;
          setPartnerData(pData);
          if (pData.categories?.length > 0) {
            const cats = pData.categories.map((c: any) => c.name || c);
            setAllowedEntities(cats);
          }
        }

        if (dashboardRes.status === 'fulfilled') {
          setDashboardData(dashboardRes.value.data || dashboardRes.value);
        }

        if (profileRes.status === 'fulfilled') {
          setProfileData(profileRes.value.data || profileRes.value);
        }

        if (extRes.status === 'fulfilled') {
          setExtendedData(extRes.value.data || extRes.value);
        }

        if (mediaRes.status === 'fulfilled') {
          const m = mediaRes.value.data || mediaRes.value;
          setMediaItems(Array.isArray(m) ? m : []);
        }
      } catch (err) {
        console.error('Dashboard fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hasClassOrProgram = allowedEntities.includes('Classes') || allowedEntities.includes('Programs');
  const hasEvents = allowedEntities.includes('Events');
  const hasVenues = allowedEntities.includes('Venues');

  // Onboarding state — derived from API status
  const partnerStatus = partnerData?.status || '';
  const isActive = partnerData?.is_active === true || ACTIVE_STATUSES.has(partnerStatus);
  const isVerified = partnerData?.is_verified === true || partnerStatus === 'approved';
  const verificationSubmitted = VERIFICATION_SUBMITTED_STATUSES.has(partnerStatus);

  // Redirect incomplete onboarding statuses
  useEffect(() => {
    if (!loading && partnerData) {
      if (partnerStatus === 'otp_verified') {
        onNavigate('PARTNER_CATEGORY');
      } else if (partnerStatus === 'category_selected') {
        onNavigate('REGISTRATION');
      }
    }
  }, [loading, partnerData, partnerStatus]);

  // Profile completion — mirrors the same 10-field formula used in EditProfile.tsx
  const profileCompletion = (() => {
    const galleryImages = mediaItems.filter((m: any) => m.media_type === 'image');
    const fields = [
      !!(extendedData?.cover_image),
      !!(extendedData?.logo),
      galleryImages.length > 0,
      !!(profileData?.business_name || partnerData?.business_name),
      !!(extendedData?.bio),
      !!(extendedData?.contact_number),
      !!(profileData?.instagram_url),
      !!(profileData?.facebook_url),
      !!(profileData?.website_url),
      !!(extendedData?.address),
    ];
    const filled = fields.filter(Boolean).length;
    // Fall back to API-provided value only if none of the profile data loaded
    if (filled === 0 && !extendedData && !profileData) {
      return dashboardData?.profile_completion ?? partnerData?.profile_completion ?? 0;
    }
    return Math.round((filled / fields.length) * 100);
  })();

  // Business name
  const businessName = partnerData?.business_name || partnerData?.business_profile?.business_name || 'Partner';

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddListing = () => {
    if (allowedEntities.length === 1) {
      const entity = allowedEntities[0];
      if (entity === 'Events') onNavigate('CREATE_EVENT_DETAILS');
      else onNavigate('CREATE_LISTING_IDENTITY');
    } else if (allowedEntities.length > 1) {
      setShowEntityPicker(true);
    } else {
      onNavigate('CREATE_LISTING_IDENTITY');
    }
  };

  // Dynamic CTA label
  const ctaLabel = (() => {
    if (allowedEntities.length === 0) return 'Add New Listing';
    if (allowedEntities.length === 1) {
      const e = allowedEntities[0];
      if (e === 'Events') return 'Create Event';
      if (e === 'Classes') return 'Add New Class';
      if (e === 'Programs') return 'Add New Program';
      if (e === 'Venues') return 'Add Venue';
    }
    return 'Add New Listing';
  })();

  // Metrics from API data
  const metrics = (() => {
    const d = dashboardData;
    if (hasClassOrProgram) {
      return [
        { label: 'New Enquiries', value: d?.new_enquiries?.toString() || '0', icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Active Batches', value: d?.active_batches?.toString() || '0', icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Profile Views', value: d?.profile_views?.toString() || '0', icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50' },
        { label: 'Credit Balance', value: d?.credit_balance?.toString() || '0', icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50' },
      ];
    } else {
      return [
        { label: 'Total Listings', value: d?.total_listings?.toString() || '0', icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Upcoming Events', value: d?.upcoming_events?.toString() || '0', icon: Ticket, color: 'text-purple-500', bg: 'bg-purple-50' },
        { label: 'Profile Views', value: d?.profile_views?.toString() || '0', icon: Eye, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: hasVenues ? 'Venue Bookings' : 'Registrations', value: d?.registrations?.toString() || d?.venue_bookings?.toString() || '0', icon: hasVenues ? MapPin : BarChart3, color: 'text-amber-500', bg: 'bg-amber-50' },
      ];
    }
  })();

  // Notifications: empty by default — show API-provided ones if available
  const notifications = dashboardData?.notifications || [];

  // Dynamic quick links — hide enquiries if not applicable
  const quickLinks = [
    { label: 'Brand Profile', screen: 'BRAND_PROFILE' as Screen, icon: UserCircle },
    { label: 'My Listings', screen: 'SERVICE_LISTINGS' as Screen, icon: CalendarDays },
    ...(hasClassOrProgram ? [{ label: 'Enquiries', screen: 'ENQUIRIES' as Screen, icon: Inbox }] : []),
    { label: 'Finance', screen: 'FINANCIAL_HUB' as Screen, icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="text-tlb-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

            {/* Notification Popup */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-black text-lg">Notifications</h3>
                  <button className="text-[10px] font-black uppercase tracking-widest text-tlb-yellow hover:text-yellow-600">Mark all as read</button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">No notifications yet</div>
                  ) : (
                    notifications.map((n: any, idx: number) => (
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
                    ))
                  )}
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
          {/* Onboarding Progress Tracker — driven by partner status */}
          {/* Onboarding Progress — shown only while isActive=true and isVerified=false */}
          {isActive && !isVerified && (
            <section className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-black">Onboarding Progress</h2>
                <p className="text-xs text-gray-500 mt-1">Complete all steps to fully activate your partner account.</p>
              </div>

              {/* Connecting line */}
              <div className="space-y-0 relative">
                <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-gray-100 z-0" />

                {/* Step 1 — Profile Created */}
                <div className="flex items-start gap-4 relative z-10 pb-6">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="pt-0.5">
                    <p className="font-bold text-gray-900 opacity-60 line-through">Profile Created</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">Completed</p>
                  </div>
                </div>

                {/* Step 2 — Verification Documents */}
                <div className="flex items-start gap-4 relative z-10 pb-6">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    verificationSubmitted ? 'bg-emerald-100 text-emerald-600' : 'bg-tlb-yellow text-tlb-dark'
                  }`}>
                    {verificationSubmitted ? <CheckCircle2 size={18} /> : <span className="font-black text-sm">2</span>}
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-0.5">
                    <div>
                      <p className={`font-bold ${verificationSubmitted ? 'text-gray-900 opacity-60 line-through' : 'text-gray-900'}`}>
                        Verification Documents
                      </p>
                      {!verificationSubmitted && (
                        <p className="text-xs text-gray-500 mt-1">Submit PAN, bank details &amp; sign the partner agreement.</p>
                      )}
                      {verificationSubmitted && (
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">Submitted</p>
                      )}
                    </div>
                    {!verificationSubmitted && (
                      <button
                        onClick={() => onNavigate('AGREEMENT_SUBMIT')}
                        className="bg-tlb-dark text-tlb-yellow px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-black transition-colors whitespace-nowrap self-start"
                      >
                        Start Verification
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 3 — Admin Review */}
                <div className="flex items-start gap-4 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    verificationSubmitted ? 'bg-tlb-yellow text-tlb-dark' : 'bg-gray-100 text-gray-300'
                  }`}>
                    <span className="font-black text-sm">3</span>
                  </div>
                  <div className={`pt-0.5 ${!verificationSubmitted ? 'opacity-40' : ''}`}>
                    <p className="font-bold text-gray-900">Admin Review</p>
                    {verificationSubmitted && (
                      <p className="text-[10px] text-tlb-yellow font-bold uppercase tracking-widest mt-0.5">In Progress — typically 24–48 hrs</p>
                    )}
                    {!verificationSubmitted && (
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Unlocks after Step 2</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Welcome Banner */}
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

              {/* Profile Completion Bar */}
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

          {/* Metric Cards — Dynamic from API */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <div key={m.label} className="tlb-card p-5 flex flex-col gap-3">
                <div className={`w-10 h-10 ${m.bg} rounded-xl flex items-center justify-center ${m.color}`}>
                  <m.icon size={20} />
                </div>
                <div>
                  <p className="text-3xl font-black">{m.value}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{m.label}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Add New Listing CTA — Dynamic label */}
          <section>
            <button
              onClick={handleAddListing}
              className="tlb-button w-full py-5 shadow-lg shadow-tlb-yellow/20 text-base gap-3"
            >
              <Plus size={22} /> {ctaLabel}
            </button>
          </section>

          {/* Quick Links — Conditional */}
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

      {/* Footer */}
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
              <p>Events</p>
              <p className="mt-1">Classes</p>
              <p className="mt-1">Venues</p>
            </div>
          </div>

          <div className="w-full border-t border-white/10 my-2" />

          <p className="text-gray-500 text-[10px] text-center">
            © 2026 The Little Broadway. All rights reserved.<br />Partner Portal V3.0
          </p>
        </div>
      </footer>

      {/* Entity Picker Bottom Sheet */}
      <EntityPickerSheet
        isOpen={showEntityPicker}
        onClose={() => setShowEntityPicker(false)}
        allowedEntities={allowedEntities}
        onNavigate={onNavigate}
      />
    </div>
  );
};
