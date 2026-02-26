export type Screen = 
  | 'LANDING'
  | 'LOGIN'
  | 'OTP_VERIFY'
  | 'REGISTRATION'
  | 'APP_SUBMITTED'
  | 'APP_APPROVED'
  | 'AGREEMENT_SUBMIT'
  | 'BANK_SETUP'
  | 'ONBOARDING_COMPLETE'
  | 'DASHBOARD'
  | 'FINANCIAL_HUB'
  | 'EVENT_LISTINGS'
  | 'CREATE_EVENT_DETAILS'
  | 'CREATE_EVENT_TICKETS'
  | 'CREATE_EVENT_REVIEW'
  | 'EVENT_REVIEW_STATUS'
  | 'EVENT_DETAILS'
  | 'ANALYTICS'
  | 'EDIT_PROFILE'
  | 'PREVIEW_PROFILE';

export interface PartnerData {
  businessName: string;
  contactName: string;
  email: string;
  city: string;
  instagram: string;
  facebook: string;
  website: string;
  experience: string;
}

export interface EventData {
  name: string;
  banner: string;
  date: string;
  time: string;
  category: string;
  location: string;
  description: string;
  tickets: TicketTier[];
}

export interface TicketTier {
  name: string;
  price: number;
  capacity: number;
}
