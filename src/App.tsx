/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Screen } from './types';

// Screen imports — organized by module
import { Landing, Login, OTPVerify, PartnerAccess } from './screens/auth';
import {
  Registration, AppSubmitted, AppApproved,
  AgreementSubmit, BankSetup, OnboardingComplete
} from './screens/onboarding';
import { Dashboard } from './screens/dashboard';
import { Attendees } from './screens/attendees';
import { FinancialHub, BankSetupHub } from './screens/financial';
import { Analytics } from './screens/analytics';
import { EditProfile, PreviewProfile } from './screens/profile';
import {
  EventListings, CreateEventDetails, CreateEventTickets,
  CreateEventReview, EventReviewStatus, EventDetails
} from './screens/events';

import { Sidebar } from './components/Navigation';

// ---------------------------------------------------------------------------
// Route configuration map
// Each screen maps to its component and whether it needs sidebar support.
// ---------------------------------------------------------------------------
type ScreenComponent = React.FC<{
  onNavigate: (screen: Screen) => void;
  onOpenSidebar?: () => void;
}>;

interface RouteConfig {
  component: ScreenComponent;
  hasSidebar: boolean;
}

const routes: Record<Screen, RouteConfig> = {
  // Auth — no sidebar
  LANDING: { component: Landing, hasSidebar: false },
  LOGIN: { component: Login, hasSidebar: false },
  OTP_VERIFY: { component: OTPVerify, hasSidebar: false },
  PARTNER_ACCESS: { component: PartnerAccess, hasSidebar: false },

  // Onboarding — no sidebar
  REGISTRATION: { component: Registration, hasSidebar: false },
  APP_SUBMITTED: { component: AppSubmitted, hasSidebar: false },
  APP_APPROVED: { component: AppApproved, hasSidebar: false },
  AGREEMENT_SUBMIT: { component: AgreementSubmit, hasSidebar: false },
  BANK_SETUP: { component: BankSetup, hasSidebar: false },
  BANK_SETUP_HUB: { component: BankSetupHub as ScreenComponent, hasSidebar: false },
  ONBOARDING_COMPLETE: { component: OnboardingComplete, hasSidebar: false },

  // Dashboard & Core — has sidebar
  DASHBOARD: { component: Dashboard, hasSidebar: true },
  ATTENDEES: { component: Attendees, hasSidebar: true },
  FINANCIAL_HUB: { component: FinancialHub, hasSidebar: true },
  ANALYTICS: { component: Analytics, hasSidebar: true },
  EDIT_PROFILE: { component: EditProfile, hasSidebar: true },
  PREVIEW_PROFILE: { component: PreviewProfile, hasSidebar: true },

  // Events — has sidebar
  EVENT_LISTINGS: { component: EventListings, hasSidebar: true },
  CREATE_EVENT_DETAILS: { component: CreateEventDetails, hasSidebar: true },
  CREATE_EVENT_TICKETS: { component: CreateEventTickets, hasSidebar: true },
  CREATE_EVENT_REVIEW: { component: CreateEventReview, hasSidebar: true },
  EVENT_REVIEW_STATUS: { component: EventReviewStatus, hasSidebar: true },
  EVENT_DETAILS: { component: EventDetails, hasSidebar: true },
};

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('LANDING');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const route = routes[currentScreen] ?? routes.LANDING;
  const Component = route.component;

  return (
    <div className="font-sans text-tlb-dark">
      <Component
        onNavigate={setCurrentScreen}
        {...(route.hasSidebar ? { onOpenSidebar: () => setIsSidebarOpen(true) } : {})}
      />
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
      />
    </div>
  );
}
