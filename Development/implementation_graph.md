# TLB Partner Portal — Implementation Graph

> Branch: `dev-vishesh` | Last updated: 2026-05-08

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), custom tokens in `theme.css` |
| State | Local `useState` + `PartnerContext` (allowedEntities) |
| Navigation | Custom — `Screen` union type in `types.ts`, `routes` record in `App.tsx` |
| Auth | JWT in `localStorage`, auto-refresh via `apiClient` interceptor |
| Draft persistence | `sessionStorage` (`current_event_draft_id`, `current_venue_draft_id`) |
| API base | `https://tlb-api.reluconsultancy.in` |
| Testing | Vitest + Testing Library + MSW (Mock Service Worker) |

---

## Screen Map & Status

### Auth & Onboarding

| Screen (const) | File | Status |
|---|---|---|
| `LANDING` | `auth/Landing.tsx` | ✅ Done |
| `LOGIN` | `auth/Login.tsx` | ✅ Done |
| `OTP_VERIFY` | `auth/OTPVerify.tsx` | ✅ Done (resend timer) |
| `PARTNER_ACCESS` | `auth/PartnerAccess.tsx` | ✅ Done |
| `PARTNER_ACCESS_OTP` | `auth/PartnerAccessOTP.tsx` | ✅ Done |
| `PARTNER_CATEGORY` | `auth/PartnerCategory.tsx` | ✅ Done |
| `REGISTRATION` | `onboarding/Registration.tsx` | ✅ Done |
| `APP_SUBMITTED` | `onboarding/AppSubmitted.tsx` | ✅ Done |
| `APP_APPROVED` | `onboarding/AppApproved.tsx` | ✅ Done |
| `AGREEMENT_SUBMIT` | `onboarding/AgreementSubmit.tsx` | ✅ Done |
| `IDENTITY_VERIFICATION` | `onboarding/IdentityVerification.tsx` | ✅ Done |
| `BANK_SETUP` | `onboarding/BankSetup.tsx` | ✅ Done (hardcoded saved-account section removed) |
| `ONBOARDING_COMPLETE` | `onboarding/OnboardingComplete.tsx` | ✅ Done |

### Core App

| Screen | File | Status |
|---|---|---|
| `HOME` | `dashboard/Dashboard.tsx` | ✅ Done — dynamic KPIs, profile popup on user icon, entity chips |
| `BRAND_PROFILE` | `profile/EditProfile.tsx` | ✅ Done |
| `PREVIEW_PROFILE` | `profile/PreviewProfile.tsx` | ✅ Done |
| `SERVICE_LISTINGS` | `services/ServiceListings.tsx` | ✅ Done — multi-entity tabs, search, filter dialog, edit navigation per entity |
| `ENQUIRIES` | `enquiries/Enquiries.tsx` | ✅ Done |
| `PROGRAM_ENQUIRIES` | `enquiries/ProgramEnquiries.tsx` | ✅ Done |
| `ATTENDEES` | `attendees/Attendees.tsx` | ✅ Done |
| `FINANCIAL_HUB` | `financial/FinancialHub.tsx` | ✅ Done |
| `PACKAGES` | `packages/Packages.tsx` | ✅ Done |

### Event Creation Wizard (4 steps, theme: purple)

| Screen | File | API Status |
|---|---|---|
| `CREATE_EVENT_DETAILS` | `events/CreateEventDetails.tsx` | ✅ Full API — categories/formats/age-groups from metadata; create/update draft |
| `CREATE_EVENT_SCHEDULE` | `events/CreateEventSchedule.tsx` | ✅ Full API — patch schedule + tickets |
| `CREATE_EVENT_MEDIA` | `events/CreateEventMedia.tsx` | ✅ Full API — cover/gallery/video upload, delete; `resolveUrl()` for previews |
| `CREATE_EVENT_PREVIEW` | `events/CreateEventPreview.tsx` | ✅ Full API — fetch detail, submit, success/under-review/error modals |

**Draft key:** `current_event_draft_id` (sessionStorage)

### Venue Creation Wizard (5 steps, theme: amber)

| Screen | File | API Status |
|---|---|---|
| `CREATE_VENUE_DETAILS` | `venues/CreateVenueDetails.tsx` | ✅ Full API — categories from metadata; `ensureDraft()` auto-creates on first upload; cover/gallery/video upload; `resolveUrl()` for previews |
| `CREATE_VENUE_OCCASIONS` | `venues/CreateVenueOccasions.tsx` | ✅ Full API — occasions from metadata; load/save occasions + capacity + attendee fields |
| `CREATE_VENUE_AVAILABILITY` | `venues/CreateVenueAvailability.tsx` | ✅ Full API — slot CRUD (date + start_time + end_time + note) |
| `CREATE_VENUE_PACKAGES` | `venues/CreateVenuePackages.tsx` | ✅ Full API — load/create/update/delete packages (name, price, duration_minutes, max_guests) |
| `CREATE_VENUE_PREVIEW` | `venues/CreateVenuePreview.tsx` | ✅ Full API — fetch detail + packages + slots; submit; success/under-review/error modals |

**Draft key:** `current_venue_draft_id` (sessionStorage)

### Class Creation Wizard (5 steps, theme: blue)

| Screen | File | API Status |
|---|---|---|
| `CREATE_LISTING_IDENTITY` | `services/CreateListingIdentity.tsx` | ⚠️ Local state only — no API integration |
| `CREATE_LISTING_BATCH` | `services/CreateListingBatch.tsx` | ⚠️ Local state only |
| `CREATE_LISTING_MEDIA` | `services/CreateListingMedia.tsx` | ⚠️ Local state only |
| `CREATE_LISTING_POLICIES` | `services/CreateListingPolicies.tsx` | ⚠️ Local state only |
| `CREATE_LISTING_PREVIEW` | `services/CreateListingPreview.tsx` | ⚠️ Local state only |

### Program Creation Wizard (5 steps, theme: emerald)

| Screen | File | API Status |
|---|---|---|
| `CREATE_PROGRAM_IDENTITY` | `programs/CreateProgramIdentity.tsx` | ⚠️ Local state only |
| `CREATE_PROGRAM_BATCH` | `programs/CreateProgramBatch.tsx` | ⚠️ Local state only |
| `CREATE_PROGRAM_MEDIA` | `programs/CreateProgramMedia.tsx` | ⚠️ Local state only |
| `CREATE_PROGRAM_POLICIES` | `programs/CreateProgramPolicies.tsx` | ⚠️ Local state only |
| `CREATE_PROGRAM_PREVIEW` | `programs/CreateProgramPreview.tsx` | ⚠️ Local state only |

---

## API Layer (`src/api/`)

### `client.ts`
- Central `apiClient` fetch wrapper — base URL, JSON headers, 401 auto-refresh + replay

### `auth.ts`
- `requestOtp`, `verifyOtp`, `getCurrentUser`, `logout`

### `onboarding.ts`
- `getPartnerCategories`, `getPartnerMedia`, `uploadPartnerMedia`, `deletePartnerMedia`
- `getBusinessProfile`, `updateBusinessProfile`, `selectCategories`
- `getPartnerDashboard`, `getCurrentPartner`, `getExtendedProfile`, `updateExtendedProfile`
- `activatePartner`, `submitVerification`

### `listings.ts`

**Event metadata (public)**
- `getEventMetaCategories`, `getEventMetaFormats`, `getEventMetaAgeGroups`

**Event listings** — base: `/api/v1/partners/listings/events/`
- `getEventListings(status?)`, `getListingDetail(id)`, `createEventDraft(data)`, `updateListing(id, data)` (PATCH), `submitListing(id)`

**Event media** — `/events/{id}/media/`
- `getListingMedia`, `uploadListingMedia(id, file, type)`, `deleteListingMedia(id, mediaId)`

**Event tickets** — `/events/{id}/tickets/`
- `getTickets`, `createTicket`, `updateTicket`, `deleteTicket`

**Venue metadata (public)**
- `getVenueMetaCategories`, `getVenueMetaDiscoveryEnums`, `getVenueMetaOccasions`

**Venue listings** — base: `/api/v1/partners/listings/venues/`
- `getVenueListings(status?)`, `getVenueListingDetail(id)`, `createVenueDraft(data)`, `updateVenueListing(id, data)` (PATCH), `deleteVenueListing(id)`, `submitVenueListing(id)`

**Venue media** — `/venues/{id}/media/`
- `getVenueListingMedia`, `uploadVenueListingMedia(id, file, type)`, `deleteVenueListingMedia(id, mediaId)`

**Venue packages** — `/venues/{id}/packages/`
- `getVenuePackages`, `createVenuePackage`, `updateVenuePackage` (PUT), `deleteVenuePackage`

**Venue availability** — `/venues/{id}/availability/`
- `getVenueAvailability`, `createVenueAvailabilitySlot`, `updateVenueAvailabilitySlot` (PUT), `deleteVenueAvailabilitySlot`

**Venue attendee fields** — `/venues/{id}/attendee-fields/`
- `getVenueAttendeeFields`, `updateVenueAttendeeFields(id, fields[])` (PUT)

**Venue discovery** — `/venues/{id}/discovery/`
- `getVenueDiscovery`, `updateVenueDiscovery` (PUT)

**Draft ID helpers (sessionStorage)**
- `getCurrentDraftId / setCurrentDraftId / clearCurrentDraftId` — key: `current_event_draft_id`
- `getCurrentVenueDraftId / setCurrentVenueDraftId / clearCurrentVenueDraftId` — key: `current_venue_draft_id`

---

## Shared Components

| Component | Path | Notes |
|---|---|---|
| `WizardLayout` | `components/ui/WizardLayout.tsx` | Sticky header, back button, step label, progress bar. Prop: `themeColor: 'purple'|'blue'|'yellow'|'emerald'|'amber'` |
| `WizardNavigation` | `components/ui/WizardNavigation.tsx` | Bottom continue/back buttons, matches theme |
| `EntityPickerSheet` | `components/EntityPickerSheet.tsx` | Bottom sheet for selecting entity type on "Add Listing" |
| `Sidebar` | — (in `App.tsx`) | Navigation drawer, visibility driven by `allowedEntities` |

---

## Global State

| Store | Mechanism | Contents |
|---|---|---|
| `PartnerContext` | React Context + sessionStorage | `allowedEntities: EntityType[]` |
| Auth tokens | localStorage | `access_token`, `refresh_token` |
| Event draft | sessionStorage | `current_event_draft_id` |
| Venue draft | sessionStorage | `current_venue_draft_id` |

---

## Navigation Guards

`guardedNavigate` in `App.tsx:157` — if target screen has `requiresEntities`, checks `allowedEntities` from `PartnerContext`. Falls back to `HOME` on mismatch.

**Theme colors by wizard:**
- Events → `purple`
- Classes → `blue`
- Programs → `emerald`
- Venues → `amber`

---

## Test Coverage

| File | Tests | Scope |
|---|---|---|
| `events/__tests__/CreateEventDetails.test.tsx` | ~12 | Metadata load, pre-fill, form interactions, Next validation |
| `events/__tests__/CreateEventSchedule.test.tsx` | ~12 | Draft load, pricing toggle, ticket CRUD, date validation, Next |
| `events/__tests__/CreateEventMedia.test.tsx` | ~12 | Media load, cover/gallery display, delete, navigation |
| `events/__tests__/CreateEventPreview.test.tsx` | ~14 | Load/error states, detail display, submit modals (success/under-review/error), navigation |
| `services/__tests__/ServiceListings.test.tsx` | ~14 | Loading, listing display, tabs, search, edit/create navigation |
| `api/__tests__/listings.test.ts` | ~8 | API function unit tests via MSW |

**MSW handlers** — `src/test/msw/handlers.ts`  
Mock endpoints: events (GET list, GET detail, POST create, PATCH update, POST submit, GET/POST/DELETE media), venues (GET list).

---

## Known Patterns & Conventions

- **Never use `fetch` directly** — always use `apiClient` from `src/api/client.ts`
- **Relative media URLs** — API may return paths like `/media/uploads/...`; use `resolveUrl()` (defined locally in each media screen) to prefix with `https://tlb-api.reluconsultancy.in`
- **`ensureDraft()` pattern** — venue details page auto-creates a draft on first media pick; only requires a title
- **`Promise.allSettled`** — used in `ServiceListings` to fetch from multiple entity endpoints; shows error only if all fail with no data
- **No router library** — navigation is `onNavigate(Screen)` prop; `App.tsx` holds the route registry
- **PATCH not PUT** — all listing updates use PATCH; venue packages and availability slots use PUT for full-replace updates
- **`noUnusedLocals: true`** — in tsconfig; dead imports must be removed

---

## Pending / Not Yet Integrated

| Area | Work Needed |
|---|---|
| Class wizard (5 screens) | Full API integration — same pattern as event wizard |
| Program wizard (5 screens) | Full API integration — same pattern as event wizard |
| Venue discovery | `updateVenueDiscovery` function exists in API layer but no UI step yet |
| Classes/Programs in ServiceListings | `getEventListings` fetches events+venues; need to add class/program endpoints when APIs are ready |
| Edit Profile screen | `EditProfile.tsx` has named exports only — no default export; not currently routed (would crash if routed via `lazy()`) |
