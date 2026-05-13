// ---------------------------------------------------------------------------
// Entity Types (selected during onboarding)
// ---------------------------------------------------------------------------
export type EntityType = 'Events' | 'Classes' | 'Programs' | 'Venues';

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------
export type Screen =
  // Auth & Onboarding
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
  // Class creation flow (existing)
  | 'CREATE_CLASS_IDENTITY'
  | 'CREATE_CLASS_BATCH'
  | 'CREATE_CLASS_MEDIA'
  | 'CREATE_CLASS_POLICIES'
  | 'CREATE_CLASS_PREVIEW'
  // Event creation flow (new)
  | 'CREATE_EVENT_DETAILS'
  | 'CREATE_EVENT_SCHEDULE'
  | 'CREATE_EVENT_MEDIA'
  | 'CREATE_EVENT_PREVIEW'
  // Venue creation flow (new)
  | 'CREATE_VENUE_DETAILS'
  | 'CREATE_VENUE_OCCASIONS'
  | 'CREATE_VENUE_AVAILABILITY'
  | 'CREATE_VENUE_PACKAGES'
  | 'CREATE_VENUE_PREVIEW'
  // Programs flow
  | 'CREATE_PROGRAM_IDENTITY'
  | 'CREATE_PROGRAM_BATCH'
  | 'CREATE_PROGRAM_MEDIA'
  | 'CREATE_PROGRAM_POLICIES'
  | 'CREATE_PROGRAM_PREVIEW'
  // Other
  | 'ENQUIRIES'
  | 'PROGRAM_ENQUIRIES'
  | 'PACKAGES'
  | 'ATTENDEES'
  | 'FINANCIAL_HUB';

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
// Services & Batches (Classes)
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
// Event Listings (new)
// ---------------------------------------------------------------------------
export type EventFormat =
  | 'Workshop'
  | 'Camp'
  | 'Masterclass'
  | 'Competition'
  | 'Tournament'
  | 'Showcase'
  | 'Bootcamp'
  | 'Demo / Trial'
  | 'Meetup'
  | 'Webinar';

export type EventMode = 'Online' | 'Offline' | 'Hybrid';
export type AgeGroup = '0-3' | '3-5' | '6-8' | '9-12' | '13-16' | 'All Ages';
export type PricingType = 'Free' | 'Paid';

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description: string;
}

export interface EventListingData {
  id: string;
  title: string;
  description: string;
  category: string;
  subCategory: string;
  formats: EventFormat[];
  ageGroups: AgeGroup[];
  mode: EventMode;
  location: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  pricingType: PricingType;
  tickets: TicketTier[];
  seatsAvailable: number;
  registrationDeadline: string;
  gallery: string[];
  coverImage: string;
  videoLink: string;
  status: 'Draft' | 'Live' | 'Paused' | 'Completed';
  entityType: EntityType;
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

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------
export type VenueOccasion = 'Birthday' | 'Playdate' | 'Celebration' | 'Workshop' | 'Meetup' | 'Showcase';

export interface VenuePackage {
  id: string;
  name: string; // e.g., 'Basic Party', 'Standard', 'Premium Party'
  price: number;
  description: string;
}

export interface VenueListingData {
  id: string;
  title: string;
  description: string;
  location: string;
  gallery: string[];
  occasions: VenueOccasion[];
  minGuests: number;
  maxGuests: number;
  requiredAttendeeFields: string[];
  availableDates: string[]; // e.g. ISO date strings
  timeSlots: string[]; // e.g. ['Morning', 'Afternoon']
  packages: VenuePackage[];
  status: 'Draft' | 'Live' | 'Paused';
  entityType: EntityType;
}
