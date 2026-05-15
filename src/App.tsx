/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
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
const BrandProfile = lazyImport(() => import('./screens/profile'), 'BrandProfile');
const PreviewProfile = lazyImport(() => import('./screens/profile'), 'PreviewProfile');

// Services / Class creation screens
const ServiceListings = lazyImport(() => import('./screens/services'), 'ServiceListings');
const CreateClassIdentity = lazyImport(() => import('./screens/classes'), 'CreateClassIdentity');
const CreateClassBatch = lazyImport(() => import('./screens/classes'), 'CreateClassBatch');
const CreateClassMedia = lazyImport(() => import('./screens/classes'), 'CreateClassMedia');
const CreateClassPolicies = lazyImport(() => import('./screens/classes'), 'CreateClassPolicies');
const CreateClassPreview = lazyImport(() => import('./screens/classes'), 'CreateClassPreview');

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
const ProgramEnquiries = lazyImport(() => import('./screens/enquiries'), 'ProgramEnquiries');

import { Sidebar } from './components/Navigation';
import { getAuthToken, getRefreshToken, setAuthToken, clearTokens } from './api/client';
import { getCurrentPartner } from './api/onboarding';

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
  CREATE_CLASS_IDENTITY: { component: CreateClassIdentity, hasSidebar: true },
  CREATE_CLASS_BATCH: { component: CreateClassBatch, hasSidebar: true },
  CREATE_CLASS_MEDIA: { component: CreateClassMedia, hasSidebar: true },
  CREATE_CLASS_POLICIES: { component: CreateClassPolicies, hasSidebar: true },
  CREATE_CLASS_PREVIEW: { component: CreateClassPreview, hasSidebar: false },

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
  ENQUIRIES: { component: Enquiries, hasSidebar: true, requiresEntities: ['Classes'] },
  PROGRAM_ENQUIRIES: { component: ProgramEnquiries, hasSidebar: true, requiresEntities: ['Programs'] },

  // Other
  ATTENDEES: { component: Attendees, hasSidebar: true },
  PACKAGES: { component: Packages, hasSidebar: true },
  FINANCIAL_HUB: { component: FinancialHub, hasSidebar: true },
};

// ---------------------------------------------------------------------------
// Inner App (consumes PartnerContext)
// ---------------------------------------------------------------------------
function AppInner() {
  const { allowedEntities, setAllowedEntities } = usePartner();
  const [currentScreen, setCurrentScreen] = useState<Screen>('LANDING');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authData, setAuthData] = useState<{ value: string; type: 'email' | 'phone' } | null>(null);
  const [initializing, setInitializing] = useState(true);

  // ── Session restore on page load / refresh ──
  useEffect(() => {
    const restoreSession = async () => {
      let token = getAuthToken();

      // If no access token, try refreshing with the refresh token
      if (!token) {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          // No tokens at all — go to LANDING
          setInitializing(false);
          return;
        }

        try {
          const BASE_URL = 'https://tlb-api.reluconsultancy.in';
          const refreshRes = await fetch(`${BASE_URL}/api/v1/auth/refresh-token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (refreshRes.ok) {
            const res = await refreshRes.json();
            const payload = res.data || res;
            const newAccess = payload.access_token || payload.access;
            if (newAccess) {
              setAuthToken(newAccess);
              token = newAccess;
            } else {
              clearTokens();
              setInitializing(false);
              return;
            }
          } else {
            // Refresh token is invalid/expired — full logout
            clearTokens();
            setInitializing(false);
            return;
          }
        } catch {
          clearTokens();
          setInitializing(false);
          return;
        }
      }

      // We have a (possibly refreshed) access token — fetch partner status
      try {
        const res = await getCurrentPartner();
        const partner = res.data || res;
        const status = partner.status || '';

        // Sync categories into context
        if (partner.categories?.length > 0) {
          const cats = partner.categories.map((c: any) => c.name || c);
          setAllowedEntities(cats);
        }

        // Route based on partner status
        switch (status) {
          case 'otp_verified':
            setCurrentScreen('PARTNER_CATEGORY');
            break;
          case 'category_selected':
            setCurrentScreen('REGISTRATION');
            break;
          case 'profile_created':
          case 'activated_limited':
          case 'under_review':
          case 'approved':
            setCurrentScreen('HOME');
            break;
          default:
            // Unknown status but valid token — go to HOME
            setCurrentScreen('HOME');
            break;
        }
      } catch (err) {
        console.error('Session restore failed:', err);
        // Token is invalid even after refresh — clear and show landing
        clearTokens();
        setCurrentScreen('LANDING');
      } finally {
        setInitializing(false);
      }
    };

    restoreSession();
  }, []);

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
    // If navigating to LANDING, clear tokens (logout)
    if (screen === 'LANDING') {
      clearTokens();
      sessionStorage.clear();
    }
    setCurrentScreen(screen);
  }, [allowedEntities]);

  // Show loading spinner while restoring session
  if (initializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="w-14 h-14 border-4 border-gray-200 border-t-tlb-yellow rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading your session…</p>
      </div>
    );
  }

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
