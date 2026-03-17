export type Screen =
  // Auth & Onboarding (unchanged)
  | 'LANDING'
  | 'LOGIN'
  | 'OTP_VERIFY'
  | 'PARTNER_ACCESS'
  | 'PARTNER_ACCESS_OTP'
  | 'PARTNER_CATEGORY'
  | 'REGISTRATION'
  | 'APP_SUBMITTED'
  | 'APP_APPROVED'
  | 'AGREEMENT_SUBMIT'
  | 'IDENTITY_VERIFICATION'
  | 'BANK_SETUP'
  | 'ONBOARDING_COMPLETE'
  // Core App
  | 'HOME'
  | 'BRAND_PROFILE'
  | 'PREVIEW_PROFILE'
  | 'SERVICE_LISTINGS'
  | 'CREATE_LISTING_IDENTITY'
  | 'CREATE_LISTING_BATCH'
  | 'CREATE_LISTING_MEDIA'
  | 'CREATE_LISTING_POLICIES'
  | 'CREATE_LISTING_PREVIEW'
  | 'ENQUIRIES'
  | 'PACKAGES';

// ---------------------------------------------------------------------------
// Partner
// ---------------------------------------------------------------------------
export interface PartnerData {
  businessName: string;
  contactName: string;
  email: string;
  city: string;
  instagram: string;
  facebook: string;
  website: string;
  experience: string;
  category: string;
  aboutUs: string;
  logo: string;
  coverPhoto: string;
  address: string;
}

// ---------------------------------------------------------------------------
// Services & Batches
// ---------------------------------------------------------------------------
export interface BatchData {
  id: string;
  name: string;
  days: string[];          // e.g. ['M','W','F']
  startTime: string;       // e.g. '10:00'
  endTime: string;         // e.g. '11:00'
  capacity: number;
}

export interface ServiceData {
  id: string;
  title: string;
  description: string;
  ageMin: number;
  ageMax: number;
  format: 'Online' | 'Physical' | 'Hybrid' | 'Trial';
  location: string;
  category: string;
  subCategory: string;
  tags: string[];
  batches: BatchData[];
  gallery: string[];
  videoLink: string;
  featureImage: string;
  cancellationPolicy: string;
  refundPolicy: string;
  faqs: { question: string; answer: string }[];
  status: 'Live' | 'Paused';
}

// ---------------------------------------------------------------------------
// Enquiries (CRM)
// ---------------------------------------------------------------------------
export type EnquiryStatus = 'New' | 'Contacted' | 'Converted' | 'Lost';

export interface EnquiryData {
  id: string;
  studentName: string;
  parentName?: string;
  batchInterested: string;
  studentAge: string;
  dateTime: string;
  contactNumber: string;
  isUnlocked: boolean;
  status: EnquiryStatus;
  message?: string;
  area?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Packages / Credits
// ---------------------------------------------------------------------------
export interface PackagePlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  features: string[];
  isCurrent?: boolean;
}

export interface BillingRecord {
  id: string;
  date: string;
  plan: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Failed';
}
