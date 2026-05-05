/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Suspense, lazy, useCallback } from 'react';
import { Screen, EntityType } from './types';
import { PartnerProvider, usePartner } from './context/PartnerContext';

// Helper for lazy loading named exports
const lazyImport = <T extends Record<string, any>>(
  factory: () => Promise<T>,
  name: keyof T
) => lazy(() => factory().then((module) => ({ default: module[name] })));

// Auth screens
const Landing = lazyImport(() => import('./screens/auth'), 'Landing');
const Login = lazyImport(() => import('./screens/auth'), 'Login');
const OTPVerify = lazyImport(() => import('./screens/auth'), 'OTPVerify');
const PartnerAccess = lazyImport(() => import('./screens/auth'), 'PartnerAccess');
const PartnerAccessOTP = lazyImport(() => import('./screens/auth'), 'PartnerAccessOTP');
const PartnerCategory = lazyImport(() => import('./screens/auth'), 'PartnerCategory');

// Onboarding screens
const Registration = lazyImport(() => import('./screens/onboarding'), 'Registration');
const AppSubmitted = lazyImport(() => import('./screens/onboarding'), 'AppSubmitted');
const AppApproved = lazyImport(() => import('./screens/onboarding'), 'AppApproved');
const AgreementSubmit = lazyImport(() => import('./screens/onboarding'), 'AgreementSubmit');
const IdentityVerification = lazyImport(() => import('./screens/onboarding'), 'IdentityVerification');
const BankSetup = lazyImport(() => import('./screens/onboarding'), 'BankSetup');
const OnboardingComplete = lazyImport(() => import('./screens/onboarding'), 'OnboardingComplete');

// Core App screens
const Dashboard = lazyImport(() => import('./screens/dashboard'), 'Home');
const Attendees = lazy(() => import('./screens/attendees'));
const Packages = lazy(() => import('./screens/packages'));
const FinancialHub = lazy(() => import('./screens/financial'));
const EditProfile = lazy(() => import('./screens/profile/EditProfile'));
const BrandProfile = lazyImport(() => import('./screens/profile'), 'BrandProfile');
const PreviewProfile = lazyImport(() => import('./screens/profile'), 'PreviewProfile');

// Services / Class creation screens
const ServiceListings = lazyImport(() => import('./screens/services'), 'ServiceListings');
const CreateListingIdentity = lazyImport(() => import('./screens/services'), 'CreateListingIdentity');
const CreateListingBatch = lazyImport(() => import('./screens/services'), 'CreateListingBatch');
const CreateListingMedia = lazyImport(() => import('./screens/services'), 'CreateListingMedia');
const CreateListingPolicies = lazyImport(() => import('./screens/services'), 'CreateListingPolicies');
const CreateListingPreview = lazyImport(() => import('./screens/services'), 'CreateListingPreview');

// Event creation screens
const CreateEventDetails = lazyImport(() => import('./screens/events'), 'CreateEventDetails');
const CreateEventSchedule = lazyImport(() => import('./screens/events'), 'CreateEventSchedule');
const CreateEventMedia = lazyImport(() => import('./screens/events'), 'CreateEventMedia');
const CreateEventPreview = lazyImport(() => import('./screens/events'), 'CreateEventPreview');

// Programs creation screens
const CreateProgramIdentity = lazyImport(() => import('./screens/programs'), 'CreateProgramIdentity');
const CreateProgramBatch = lazyImport(() => import('./screens/programs'), 'CreateProgramBatch');
const CreateProgramMedia = lazyImport(() => import('./screens/programs'), 'CreateProgramMedia');
const CreateProgramPolicies = lazyImport(() => import('./screens/programs'), 'CreateProgramPolicies');
const CreateProgramPreview = lazyImport(() => import('./screens/programs'), 'CreateProgramPreview');

// Venue creation screens
const CreateVenueDetails = lazyImport(() => import('./screens/venues'), 'CreateVenueDetails');
const CreateVenueOccasions = lazyImport(() => import('./screens/venues'), 'CreateVenueOccasions');
const CreateVenueAvailability = lazyImport(() => import('./screens/venues'), 'CreateVenueAvailability');
const CreateVenuePackages = lazyImport(() => import('./screens/venues'), 'CreateVenuePackages');
const CreateVenuePreview = lazyImport(() => import('./screens/venues'), 'CreateVenuePreview');

// Enquiries & Packages
const Enquiries = lazyImport(() => import('./screens/enquiries'), 'Enquiries');

import { Sidebar } from './components/Navigation';

// ---------------------------------------------------------------------------
// Route configuration
// ---------------------------------------------------------------------------
interface RouteConfig {
  component: React.LazyExoticComponent<any>;
  hasSidebar: boolean;
  /** Optional: restrict this screen to partners with specific entity types */
  requiresEntities?: EntityType[];
}

const routes: Record<Screen, RouteConfig> = {
  // Auth — no sidebar
  LANDING: { component: Landing, hasSidebar: false },
  LOGIN: { component: Login, hasSidebar: false },
  OTP_VERIFY: { component: OTPVerify, hasSidebar: false },
  PARTNER_ACCESS: { component: PartnerAccess, hasSidebar: false },
  PARTNER_ACCESS_OTP: { component: PartnerAccessOTP, hasSidebar: false },
  PARTNER_CATEGORY: { component: PartnerCategory, hasSidebar: false },

  // Onboarding — no sidebar
  REGISTRATION: { component: Registration, hasSidebar: false },
  APP_SUBMITTED: { component: AppSubmitted, hasSidebar: false },
  APP_APPROVED: { component: AppApproved, hasSidebar: false },
  AGREEMENT_SUBMIT: { component: AgreementSubmit, hasSidebar: false },
  IDENTITY_VERIFICATION: { component: IdentityVerification, hasSidebar: false },
  BANK_SETUP: { component: BankSetup, hasSidebar: false },
  ONBOARDING_COMPLETE: { component: OnboardingComplete, hasSidebar: false },

  // Core App — has sidebar
  HOME: { component: Dashboard, hasSidebar: true },
  BRAND_PROFILE: { component: BrandProfile, hasSidebar: true },
  PREVIEW_PROFILE: { component: PreviewProfile, hasSidebar: true },

  // Services / Listings — has sidebar
  SERVICE_LISTINGS: { component: ServiceListings, hasSidebar: true },
  CREATE_LISTING_IDENTITY: { component: CreateListingIdentity, hasSidebar: true },
  CREATE_LISTING_BATCH: { component: CreateListingBatch, hasSidebar: true },
  CREATE_LISTING_MEDIA: { component: CreateListingMedia, hasSidebar: true },
  CREATE_LISTING_POLICIES: { component: CreateListingPolicies, hasSidebar: true },
  CREATE_LISTING_PREVIEW: { component: CreateListingPreview, hasSidebar: false },

  // Event creation — has sidebar
  CREATE_EVENT_DETAILS: { component: CreateEventDetails, hasSidebar: true },
  CREATE_EVENT_SCHEDULE: { component: CreateEventSchedule, hasSidebar: true },
  CREATE_EVENT_MEDIA: { component: CreateEventMedia, hasSidebar: true },
  CREATE_EVENT_PREVIEW: { component: CreateEventPreview, hasSidebar: false },

  // Venue creation — has sidebar
  CREATE_VENUE_DETAILS: { component: CreateVenueDetails, hasSidebar: true },
  CREATE_VENUE_OCCASIONS: { component: CreateVenueOccasions, hasSidebar: true },
  CREATE_VENUE_AVAILABILITY: { component: CreateVenueAvailability, hasSidebar: true },
  CREATE_VENUE_PACKAGES: { component: CreateVenuePackages, hasSidebar: true },
  CREATE_VENUE_PREVIEW: { component: CreateVenuePreview, hasSidebar: false },

  // Programs creation — has sidebar
  CREATE_PROGRAM_IDENTITY: { component: CreateProgramIdentity, hasSidebar: true },
  CREATE_PROGRAM_BATCH: { component: CreateProgramBatch, hasSidebar: true },
  CREATE_PROGRAM_MEDIA: { component: CreateProgramMedia, hasSidebar: true },
  CREATE_PROGRAM_POLICIES: { component: CreateProgramPolicies, hasSidebar: true },
  CREATE_PROGRAM_PREVIEW: { component: CreateProgramPreview, hasSidebar: false },

  // Enquiries — restricted to Classes/Programs partners
  ENQUIRIES: { component: Enquiries, hasSidebar: true, requiresEntities: ['Classes', 'Programs'] },

  // Other
  ATTENDEES: { component: Attendees, hasSidebar: true },
  PACKAGES: { component: Packages, hasSidebar: true },
  FINANCIAL_HUB: { component: FinancialHub, hasSidebar: true },
};

// ---------------------------------------------------------------------------
// Inner App (consumes PartnerContext)
// ---------------------------------------------------------------------------
function AppInner() {
  const { allowedEntities } = usePartner();
  const [currentScreen, setCurrentScreen] = useState<Screen>('LANDING');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authData, setAuthData] = useState<{ value: string; type: 'email' | 'phone' } | null>(null);

  // Route guard: redirect restricted screens to HOME
  const guardedNavigate = useCallback((screen: Screen) => {
    const targetRoute = routes[screen];
    if (targetRoute?.requiresEntities) {
      const hasAccess = targetRoute.requiresEntities.some(e => allowedEntities.includes(e));
      if (!hasAccess) {
        setCurrentScreen('HOME');
        return;
      }
    }
    setCurrentScreen(screen);
  }, [allowedEntities]);

  const route = routes[currentScreen] ?? routes.LANDING;
  const Component = route.component;

  return (
    <div className="font-sans text-tlb-dark">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-tlb-yellow rounded-full animate-spin"></div>
        </div>
      }>
        <Component
          onNavigate={guardedNavigate}
          authData={authData}
          setAuthData={setAuthData}
          {...(route.hasSidebar ? { onOpenSidebar: () => setIsSidebarOpen(true) } : {})}
        />
      </Suspense>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentScreen={currentScreen}
        onNavigate={guardedNavigate}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// App (provides context)
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <PartnerProvider>
      <AppInner />
    </PartnerProvider>
  );
}
