import React, { useState, useRef, useEffect } from 'react';
import {
  Menu, Bell, ChevronRight, UserCircle, CheckCircle2,
  Inbox, Eye, BarChart3, CreditCard, Plus, CalendarDays, MapPin, Ticket, Loader2
} from 'lucide-react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { EntityPickerSheet } from '../../components/EntityPickerSheet';
import { getPartnerDashboard, getCurrentPartner } from '../../api/onboarding';

interface HomeProps {
  onNavigate: (screen: Screen) => void;
  onOpenSidebar: () => void;
}

// Status hierarchy for onboarding step mapping
const STATUS_STEPS: Record<string, number> = {
  'otp_verified': 1,
  'category_selected': 1,
  'profile_submitted': 2,
  'under_review': 2,
  'approved': 3,
  'agreement_signed': 4,
  'verification_submitted': 5,
  'activated_limited': 5,
  'activated_full': 5,
};

export const Home: React.FC<HomeProps> = ({ onNavigate, onOpenSidebar }) => {
  const { allowedEntities, setAllowedEntities } = usePartner();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // API data
  const [partnerData, setPartnerData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partnerRes, dashboardRes] = await Promise.allSettled([
          getCurrentPartner(),
          getPartnerDashboard(),
        ]);

        if (partnerRes.status === 'fulfilled') {
          const pData = partnerRes.value.data || partnerRes.value;
          setPartnerData(pData);
          // Sync categories from API to context
          if (pData.categories?.length > 0) {
            const cats = pData.categories.map((c: any) => c.name || c);
            setAllowedEntities(cats);
          }
        }

        if (dashboardRes.status === 'fulfilled') {
          const dData = dashboardRes.value.data || dashboardRes.value;
          setDashboardData(dData);
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

  // Derive onboarding step from partner status
  const partnerStatus = partnerData?.status || partnerData?.partner_status || '';
  const onboardingStep = STATUS_STEPS[partnerStatus] ?? 1;
  const isOnboardingComplete = onboardingStep >= 5;

  // Profile completion from API or fallback
  const profileCompletion = dashboardData?.profile_completion ?? partnerData?.profile_completion ?? 0;

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
    <div className="min-h-screen bg-gray-50 pb-24">
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
          {!isOnboardingComplete && (
            <section className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                  <div>
                      <h2 className="text-xl font-black">Onboarding Progress</h2>
                      <p className="text-xs text-gray-500 mt-1">Complete these steps to activate your partner profile.</p>
                  </div>
                  <span className="bg-tlb-yellow/10 text-tlb-dark px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest hidden sm:block">
                    {partnerStatus.replace(/_/g, ' ')}
                  </span>
              </div>
              <div className="space-y-6">
                  {/* Step 1 — Profile */}
                  <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${onboardingStep >= 2 ? 'bg-emerald-100 text-emerald-600' : 'bg-tlb-yellow text-tlb-dark'}`}>
                          {onboardingStep >= 2 ? <CheckCircle2 size={18} /> : <span className="font-black text-sm">1</span>}
                      </div>
                      <div>
                          <p className={`font-bold ${onboardingStep >= 2 ? 'text-gray-900 opacity-50 line-through' : 'text-gray-900'}`}>Profile Submitted</p>
                      </div>
                  </div>

                  {/* Step 2 — Review */}
                  <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${onboardingStep >= 3 ? 'bg-emerald-100 text-emerald-600' : onboardingStep === 2 ? 'bg-tlb-yellow text-tlb-dark' : 'bg-gray-100 text-gray-400'}`}>
                          {onboardingStep >= 3 ? <CheckCircle2 size={18} /> : <span className="font-black text-sm">2</span>}
                      </div>
                      <div>
                          <p className={`font-bold ${onboardingStep >= 3 ? 'text-gray-900 opacity-50 line-through' : 'text-gray-900'}`}>Admin Review</p>
                          {onboardingStep >= 3 && <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Approved</p>}
                          {onboardingStep === 2 && <p className="text-[10px] text-tlb-yellow font-bold uppercase tracking-widest mt-1">Under Review</p>}
                      </div>
                  </div>

                  {/* Step 3 — Agreement */}
                  <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${onboardingStep >= 4 ? 'bg-emerald-100 text-emerald-600' : onboardingStep === 3 ? 'bg-tlb-yellow text-tlb-dark' : 'bg-gray-100 text-gray-400'}`}>
                          {onboardingStep >= 4 ? <CheckCircle2 size={18} /> : <span className="font-black text-sm">3</span>}
                      </div>
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                              <p className={`font-bold ${onboardingStep >= 4 ? 'text-gray-900 opacity-50 line-through' : 'text-gray-900'}`}>Document Upload & Agreement</p>
                              {onboardingStep === 3 && <p className="text-xs text-gray-500 mt-1">Complete your KYC & sign the partner agreement.</p>}
                          </div>
                          {onboardingStep === 3 && (
                              <button onClick={() => onNavigate('AGREEMENT_SUBMIT')} className="bg-tlb-dark text-tlb-yellow px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-black transition-colors whitespace-nowrap">
                                  Start Step
                              </button>
                          )}
                      </div>
                  </div>

                  {/* Step 4 — Bank */}
                  <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${onboardingStep >= 5 ? 'bg-emerald-100 text-emerald-600' : onboardingStep === 4 ? 'bg-tlb-yellow text-tlb-dark' : 'bg-gray-100 text-gray-400'}`}>
                          {onboardingStep >= 5 ? <CheckCircle2 size={18} /> : <span className="font-black text-sm">4</span>}
                      </div>
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className={onboardingStep < 4 ? 'opacity-50' : ''}>
                              <p className="font-bold text-gray-900">Bank Verification</p>
                              {onboardingStep === 4 && <p className="text-xs text-gray-500 mt-1">Link your payouts bank account.</p>}
                          </div>
                          {onboardingStep === 4 && (
                              <button onClick={() => onNavigate('IDENTITY_VERIFICATION')} className="bg-tlb-dark text-tlb-yellow px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-black transition-colors whitespace-nowrap">
                                  Start Step
                              </button>
                          )}
                          {onboardingStep < 4 && (
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Locked</span>
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
