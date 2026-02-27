/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Screen } from './types';
import { Landing, Login, OTPVerify, PartnerAccess } from './screens/AuthScreens';
import {
  Registration,
  AppSubmitted,
  AppApproved,
  AgreementSubmit,
  BankSetup,
  OnboardingComplete
} from './screens/OnboardingScreens';
import { Dashboard } from './screens/Dashboard';
import { FinancialHub, BankSetupHub } from './screens/FinancialHub';
import { Analytics } from './screens/Analytics';
import { EditProfile, PreviewProfile } from './screens/ProfileScreens';
import {
  EventListings,
  CreateEventDetails,
  CreateEventTickets,
  CreateEventReview,
  EventReviewStatus,
  EventDetails
} from './screens/EventScreens';
import { Sidebar } from './components/Navigation';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('LANDING');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderScreen = () => {
    switch (currentScreen) {
      // Auth
      case 'LANDING': return <Landing onNavigate={setCurrentScreen} />;
      case 'LOGIN': return <Login onNavigate={setCurrentScreen} />;
      case 'OTP_VERIFY': return <OTPVerify onNavigate={setCurrentScreen} />;
      case 'PARTNER_ACCESS': return <PartnerAccess onNavigate={setCurrentScreen} />;

      // Onboarding
      case 'REGISTRATION': return <Registration onNavigate={setCurrentScreen} />;
      case 'APP_SUBMITTED': return <AppSubmitted onNavigate={setCurrentScreen} />;
      case 'APP_APPROVED': return <AppApproved onNavigate={setCurrentScreen} />;
      case 'AGREEMENT_SUBMIT': return <AgreementSubmit onNavigate={setCurrentScreen} />;
      case 'BANK_SETUP': return <BankSetup onNavigate={setCurrentScreen} />;
      case 'BANK_SETUP_HUB': return <BankSetupHub onNavigate={setCurrentScreen} />;
      case 'ONBOARDING_COMPLETE': return <OnboardingComplete onNavigate={setCurrentScreen} />;

      // Dashboard & Core
      case 'DASHBOARD': return <Dashboard onNavigate={setCurrentScreen} onOpenSidebar={() => setIsSidebarOpen(true)} />;
      case 'FINANCIAL_HUB': return <FinancialHub onNavigate={setCurrentScreen} onOpenSidebar={() => setIsSidebarOpen(true)} />;
      case 'ANALYTICS': return <Analytics onNavigate={setCurrentScreen} onOpenSidebar={() => setIsSidebarOpen(true)} />;
      case 'EDIT_PROFILE': return <EditProfile onNavigate={setCurrentScreen} onOpenSidebar={() => setIsSidebarOpen(true)} />;
      case 'PREVIEW_PROFILE': return <PreviewProfile onNavigate={setCurrentScreen} onOpenSidebar={() => setIsSidebarOpen(true)} />;

      // Events
      case 'EVENT_LISTINGS': return <EventListings onNavigate={setCurrentScreen} onOpenSidebar={() => setIsSidebarOpen(true)} />;
      case 'CREATE_EVENT_DETAILS': return <CreateEventDetails onNavigate={setCurrentScreen} onOpenSidebar={() => setIsSidebarOpen(true)} />;
      case 'CREATE_EVENT_TICKETS': return <CreateEventTickets onNavigate={setCurrentScreen} onOpenSidebar={() => setIsSidebarOpen(true)} />;
      case 'CREATE_EVENT_REVIEW': return <CreateEventReview onNavigate={setCurrentScreen} onOpenSidebar={() => setIsSidebarOpen(true)} />;
      case 'EVENT_REVIEW_STATUS': return <EventReviewStatus onNavigate={setCurrentScreen} onOpenSidebar={() => setIsSidebarOpen(true)} />;
      case 'EVENT_DETAILS': return <EventDetails onNavigate={setCurrentScreen} onOpenSidebar={() => setIsSidebarOpen(true)} />;

      default: return <Landing onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="font-sans text-tlb-dark">
      {renderScreen()}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
      />
    </div>
  );
}
