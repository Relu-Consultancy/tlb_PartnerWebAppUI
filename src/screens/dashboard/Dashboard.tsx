import React, { useState, useRef, useEffect } from 'react';
import {
  Menu, Bell, ChevronRight, UserCircle, CheckCircle2,
  Inbox, Eye, BarChart3, CreditCard, Plus, CalendarDays, MapPin, Ticket
} from 'lucide-react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { EntityPickerSheet } from '../../components/EntityPickerSheet';

interface HomeProps {
  onNavigate: (screen: Screen) => void;
  onOpenSidebar: () => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onOpenSidebar }) => {
  const { allowedEntities } = usePartner();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const hasClassOrProgram = allowedEntities.includes('Classes') || allowedEntities.includes('Programs');
  const hasEvents = allowedEntities.includes('Events');
  const hasVenues = allowedEntities.includes('Venues');

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

  // Dynamic metrics based on entity types
  const metrics = (() => {
    if (hasClassOrProgram) {
      // Classes/Programs mode → enquiry-centric
      return [
        { label: 'New Enquiries', value: '14', icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Active Batches', value: '8', icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Profile Views', value: '1,240', icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50' },
        { label: 'Credit Balance', value: '22', icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50' },
      ];
    } else {
      // Events/Venues only mode → listing-centric
      return [
        { label: 'Total Listings', value: '5', icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Upcoming Events', value: '3', icon: Ticket, color: 'text-purple-500', bg: 'bg-purple-50' },
        { label: 'Profile Views', value: '1,240', icon: Eye, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: hasVenues ? 'Venue Bookings' : 'Registrations', value: '47', icon: hasVenues ? MapPin : BarChart3, color: 'text-amber-500', bg: 'bg-amber-50' },
      ];
    }
  })();

  // Filter notifications — hide enquiry-related ones if no access
  const notifications = [
    ...(hasClassOrProgram ? [
      { id: 1, title: 'New Enquiry', message: 'Sana Mehta sent a new enquiry for Yoga Basics.', time: '2m ago', unread: true, icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-50' },
    ] : []),
    { id: 2, title: 'Profile Reminder', message: 'Your profile is 85% complete. Add a video to reach 100%.', time: '1h ago', unread: true, icon: UserCircle, color: 'text-tlb-yellow', bg: 'bg-tlb-yellow/10' },
    ...(hasEvents ? [
      { id: 4, title: 'Event Update', message: 'Your Summer Art Festival has 12 new registrations.', time: '30m ago', unread: true, icon: CalendarDays, color: 'text-purple-500', bg: 'bg-purple-50' },
    ] : []),
  ];

  // Dynamic quick links — hide enquiries if not applicable
  const quickLinks = [
    { label: 'Brand Profile', screen: 'BRAND_PROFILE' as Screen, icon: UserCircle },
    { label: 'My Listings', screen: 'SERVICE_LISTINGS' as Screen, icon: CalendarDays },
    ...(hasClassOrProgram ? [{ label: 'Enquiries', screen: 'ENQUIRIES' as Screen, icon: Inbox }] : []),
    { label: 'Finance', screen: 'FINANCIAL_HUB' as Screen, icon: CreditCard },
  ];

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
              {notifications.some(n => n.unread) && (
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
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-4 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0 ${n.unread ? 'bg-blue-50/20' : ''}`}>
                      <div className={`w-10 h-10 ${n.bg} ${n.color} rounded-xl flex items-center justify-center shrink-0`}>
                        <n.icon size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-sm text-gray-900">{n.title}</h4>
                          <span className="text-[10px] text-gray-400 font-medium">{n.time}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                      </div>
                      {n.unread && <div className="w-2 h-2 bg-tlb-yellow rounded-full mt-2" />}
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
          {/* Onboarding Progress Tracker */}
          {(() => {
            const storedStep = sessionStorage.getItem('onboardingStep');
            const currentStep = storedStep ? parseInt(storedStep, 10) : 3;

            return currentStep < 5 ? (
              <section className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-black">Onboarding Progress</h2>
                        <p className="text-xs text-gray-500 mt-1">Complete these steps to activate your partner profile.</p>
                    </div>
                    <span className="bg-tlb-yellow/10 text-tlb-dark px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest hidden sm:block">Step {currentStep - 2} of 2 Remaining</span>
                </div>
                <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 size={18} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 opacity-50 line-through">Profile Submitted</p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 size={18} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 opacity-50 line-through">Admin Review</p>
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Approved</p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${currentStep > 3 ? 'bg-emerald-100 text-emerald-600' : 'bg-tlb-yellow text-tlb-dark'}`}>
                            {currentStep > 3 ? <CheckCircle2 size={18} /> : <span className="font-black text-sm">3</span>}
                        </div>
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <p className={`font-bold ${currentStep > 3 ? 'text-gray-900 opacity-50 line-through' : 'text-gray-900'}`}>Document Upload & Agreement</p>
                                {currentStep === 3 && <p className="text-xs text-gray-500 mt-1">Complete your KYC & sign the partner agreement.</p>}
                            </div>
                            {currentStep === 3 && (
                                <button onClick={() => onNavigate('AGREEMENT_SUBMIT')} className="bg-tlb-dark text-tlb-yellow px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-black transition-colors whitespace-nowrap">
                                    Start Step
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${currentStep > 4 ? 'bg-emerald-100 text-emerald-600' : currentStep === 4 ? 'bg-tlb-yellow text-tlb-dark' : 'bg-gray-100 text-gray-400'}`}>
                            {currentStep > 4 ? <CheckCircle2 size={18} /> : <span className="font-black text-sm">4</span>}
                        </div>
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className={currentStep < 4 ? 'opacity-50' : ''}>
                                <p className="font-bold text-gray-900">Bank Verification</p>
                                {currentStep === 4 && <p className="text-xs text-gray-500 mt-1">Link your payouts bank account.</p>}
                            </div>
                            {currentStep === 4 && (
                                <button onClick={() => onNavigate('IDENTITY_VERIFICATION')} className="bg-tlb-dark text-tlb-yellow px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-black transition-colors whitespace-nowrap">
                                    Start Step
                                </button>
                            )}
                            {currentStep < 4 && (
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Locked</span>
                            )}
                        </div>
                    </div>
                </div>
              </section>
            ) : null;
          })()}

          {/* Welcome Banner */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tlb-dark to-gray-900 p-6 sm:p-8 text-white">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-tlb-yellow/10 rounded-full blur-2xl" />
            <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-tlb-yellow/5 rounded-full blur-xl" />
            <div className="relative z-10">
              <h2 className="text-2xl font-black leading-tight">Welcome back! 👋</h2>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-lg">
                Your profile is <span className="text-tlb-yellow font-black">85% complete</span>.
                <button onClick={() => onNavigate('BRAND_PROFILE')} className="text-tlb-yellow underline ml-1 font-bold">Add a Studio Video</button> to reach 100%.
              </p>

              {/* Profile Completion Bar */}
              <div className="mt-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Profile Completion</span>
                  <span className="text-sm font-black text-tlb-yellow">85%</span>
                </div>
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-tlb-yellow rounded-full w-[85%] transition-all duration-700" />
                </div>
              </div>
            </div>
          </section>

          {/* Metric Cards — Dynamic based on entity types */}
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

          {/* Action Needed Alerts — Conditional */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><Bell size={18} /></div>
              <h3 className="font-black text-lg">Action Needed</h3>
            </div>
            <div className="space-y-3">
              {/* Enquiry alert — only if Classes/Programs */}
              {hasClassOrProgram && (
                <div className="tlb-card p-4 flex gap-4 items-start bg-blue-50/50 border-blue-100">
                  <div className="bg-blue-100 p-2 rounded-xl text-blue-600 shrink-0"><Inbox size={16} /></div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">3 New Enquiries</h4>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      You have new leads waiting. Respond quickly to convert them.
                    </p>
                  </div>
                  <button onClick={() => onNavigate('ENQUIRIES')} className="text-blue-600 shrink-0">
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {/* Event-specific alert */}
              {hasEvents && (
                <div className="tlb-card p-4 flex gap-4 items-start bg-purple-50/50 border-purple-100">
                  <div className="bg-purple-100 p-2 rounded-xl text-purple-600 shrink-0"><CalendarDays size={16} /></div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">Upcoming Event</h4>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      Summer Art Festival starts in 3 days. 12 registrations so far.
                    </p>
                  </div>
                  <button onClick={() => onNavigate('SERVICE_LISTINGS')} className="text-purple-600 shrink-0">
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {/* Venue-specific alert */}
              {hasVenues && (
                <div className="tlb-card p-4 flex gap-4 items-start bg-amber-50/50 border-amber-100">
                  <div className="bg-amber-100 p-2 rounded-xl text-amber-600 shrink-0"><MapPin size={16} /></div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">2 New Booking Requests</h4>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      You have pending venue booking requests to review.
                    </p>
                  </div>
                  <button onClick={() => onNavigate('SERVICE_LISTINGS')} className="text-amber-600 shrink-0">
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
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
