# TLB Partner Portal — Complete Project Documentation

> **The single consolidated reference for this repository.**
> Synthesized from `CLAUDE.md`, `pro_fullstackdeveloper.md`, `implementation_graph.md`,
> `docs/*-listings-db-spec.md`, `loadtest/README.md`, and a fresh, verified pass over the
> actual current source tree (`src/`) — so it reflects what's really in the repo today,
> not just what earlier docs said.
>
> **Last verified:** 2026-08-10 · **Branch:** `dev-vishesh` · **API base:** `https://tlb-api.reluconsultancy.in`

---

## Table of Contents

1. [What This Project Is](#1-what-this-project-is)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Core Architecture & Conventions](#4-core-architecture--conventions)
5. [Global State, Storage & Session](#5-global-state-storage--session)
6. [Screens & Features](#6-screens--features)
7. [Complete API Documentation](#7-complete-api-documentation)
8. [Design System](#8-design-system)
9. [Security](#9-security)
10. [Performance & Load Profile](#10-performance--load-profile)
11. [Testing](#11-testing)
12. [Engineering Standard](#12-engineering-standard)
13. [Backend Reference Docs](#13-backend-reference-docs)
14. [Project History (Phase Changelog)](#14-project-history-phase-changelog)
15. [Known Gaps & Pending Work](#15-known-gaps--pending-work)
16. [Source Documents Index](#16-source-documents-index)

---

## 1. What This Project Is

**TLB Partner Portal** is the partner-facing web application for **The Little Broadway**
(TLB) — a platform where businesses ("partners") list and manage **Events**, **Classes**,
**Programs**, and **Venues**, handle bookings and enquiries, track payouts, and grow a
following. This repository is a **frontend-only React SPA**. The backend and database
live in a separate repository; this app talks to them exclusively over HTTPS at
`https://tlb-api.reluconsultancy.in`.

A related but **entirely separate** system — a "Super Admin Portal" / "TLB Admin Panel"
used internally to manage partners, customers, and platform-wide operations — is **not
part of this repository**. No admin-facing code, routes, or screens exist here (verified
by full-tree search); any references to "admin" in this codebase describe the partner's
view of an admin-driven workflow (e.g. "Waiting for admin", ticket sender-role labels),
never admin functionality itself.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript, built with Vite 6 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), custom design tokens |
| Animation | `motion` (Framer Motion, imported as `motion/react`) |
| Icons | `lucide-react` |
| Routing | **No router library** — custom `Screen` string-union + a `routes` record in `App.tsx` |
| State | Local `useState`/`useEffect` per screen + one shared React Context (`PartnerContext`) |
| Auth | JWT (`access_token` + `refresh_token`) in `localStorage`, auto-refreshed by the API client |
| Draft persistence | `sessionStorage` (per-entity draft IDs, e.g. `current_event_draft_id`) |
| Testing | Vitest + Testing Library + MSW (Mock Service Worker) |
| API base URL | `https://tlb-api.reluconsultancy.in` |

### Commands

```bash
npm run dev       # Start dev server on port 8000 (0.0.0.0)
npm run build     # Production build via Vite
npm run lint      # Type-check only (tsc --noEmit) — no separate lint step
npm run preview   # Serve the production build locally
npm test          # vitest run (CI mode, single pass)
npm run test:watch
npm run test:ui
npm run test:report   # generates test-report.html/.pdf (gitignored)
```

### Non-obvious environment gotchas

- **No `@types/react` installed** — `react` is implicitly `any`. This is intentional/accepted
  in this codebase; don't "fix" it by adding the package unless asked.
- **`tsconfig` has `noUnusedLocals: true`** — unused imports, top-level vars, and unused
  destructured values **fail the build**, not just lint. Always remove dead imports.
- `npm run lint` really means `tsc --noEmit` — there is no ESLint step configured.

---

## 3. Project Structure

```
tlb-partner-portal/
├── src/
│   ├── api/                         # All backend communication — see §7 for full docs
│   │   ├── client.ts                 # apiClient() fetch wrapper, token storage, 401 refresh
│   │   ├── auth.ts                   # OTP request/verify, getCurrentUser, logout
│   │   ├── onboarding.ts             # Partner profile, media, categories, dashboard, verification
│   │   ├── listings.ts               # Events/Classes/Programs/Venues CRUD + media + FAQs + bookings
│   │   ├── stats.ts                  # Partner analytics (overview/events/venues/enquiries/revenue/reviews)
│   │   ├── coupons.ts                # Discount coupon CRUD + targeting + usages
│   │   ├── help.ts                   # Support tickets + shared (admin-forwarded) queries
│   │   ├── notifications.ts          # In-app notification inbox
│   │   ├── network.ts                # Partner-to-partner directory + 1:1 messaging
│   │   ├── reviews.ts                # Partner & per-listing reviews
│   │   ├── followers.ts              # Follower directory (search/filter/paginate) — self-scoped
│   │   └── banking.ts                # Bank/payout account details (FinancialHub)
│   │
│   ├── context/
│   │   └── PartnerContext.tsx        # The only React context — allowedEntities (sessionStorage-synced)
│   │
│   ├── components/
│   │   ├── Navigation.tsx            # Sidebar (desktop fixed / mobile drawer), entity-aware links
│   │   ├── TopHeader.tsx             # Global sticky header — Latest Listings / Bookings Calendar
│   │   │                              #   popups, notification bell, account profile menu
│   │   ├── NotificationCenter.tsx    # Bell + unread badge (polls every 60s), opens MESSAGES
│   │   ├── EntityPickerSheet.tsx     # Bottom sheet for choosing an entity type ("Add Listing")
│   │   └── ui/                       # Reusable presentational primitives
│   │       ├── DashboardCharts.tsx    # Shared SVG chart primitives (sparkline, trend, donut, bars)
│   │       ├── Toast.tsx              # Imperative toast singleton: toast.success/error/warning/info()
│   │       ├── Select.tsx             # Portal-rendered animated dropdown (replaces native <select>)
│   │       ├── FaqTermsEditor.tsx     # Shared FAQ CRUD + Terms editor + per-FAQ document attachments
│   │       ├── BookingsCalendar.tsx   # Month grid of bookings — used as a TopHeader popup
│   │       ├── LatestListings.tsx     # Upcoming/live listings list — used as a TopHeader popup
│   │       ├── AppListingPreview.tsx  # Phone-frame preview of a listing (all 4 wizard Preview steps)
│   │       ├── Skeleton.tsx           # Layout-matched skeleton loaders (no spinners for full loads)
│   │       ├── Pagination.tsx         # Prev/Next pager + optional "Show: N" page-size selector
│   │       ├── States.tsx             # Shared Loading/Error/Empty state components
│   │       ├── WizardLayout.tsx       # Sticky wizard header: back button, step label, progress bar
│   │       └── WizardNavigation.tsx   # Wizard bottom continue/back button bar
│   │
│   ├── screens/                      # One folder per feature area, each with a barrel `index.ts`
│   │   ├── auth/                      # Landing, Login, OTPVerify, PartnerAccess(+OTP), PartnerCategory
│   │   ├── onboarding/                # Registration → AppSubmitted/AppApproved → AgreementSubmit
│   │   │                              #   → IdentityVerification → BankSetup → OnboardingComplete
│   │   ├── account/                   # Accounts — hub linking to Brand Profile + Documents
│   │   ├── dashboard/                 # Dashboard (HOME) — KPI grid, revenue/activity, offering cards
│   │   ├── profile/                   # EditProfile (Brand Profile), PreviewProfile
│   │   ├── services/                  # ServiceListings — the "My Listings" hub for all 4 entity types
│   │   ├── events/                    # CreateEvent* — 5-step Event creation wizard
│   │   ├── classes/                   # CreateClass* — 5-step Class creation wizard
│   │   ├── programs/                  # CreateProgram* — 5-step Program creation wizard
│   │   ├── venues/                    # CreateVenue* — 7-step Venue creation wizard
│   │   ├── enquiries/                 # EnquiriesHub (unified) wrapping Enquiries/ProgramEnquiries/VenueEnquiries
│   │   ├── attendees/                 # Attendees + Bookings — one shared `variant`-driven component
│   │   ├── reviews/                   # Reviews — per-listing ratings & comments
│   │   ├── followers/                 # Followers — who follows the brand
│   │   ├── documents/                 # Documents — KYC + brand assets + uploaded media
│   │   ├── messages/                  # Messages — full-screen notification inbox
│   │   ├── coupons/                   # CreateCoupon, AllCoupons
│   │   ├── support/                   # Support — Help & Support tickets + Shared Queries
│   │   ├── network/                   # PartnerNetwork — partner directory + 1:1 messaging
│   │   ├── analytics/                 # Analytics — audience/growth/revenue/reviews data hub
│   │   ├── packages/                  # Packages (placeholder — no backend API yet)
│   │   └── financial/                 # FinancialHub — payouts, bank details
│   │
│   ├── test/
│   │   ├── setup.ts                   # MSW lifecycle, jest-dom, IntersectionObserver/ResizeObserver stubs
│   │   └── msw/
│   │       ├── handlers.ts             # Default MSW handlers + shared fixtures for every endpoint
│   │       └── server.ts               # setupServer(...handlers)
│   │
│   ├── data/
│   │   ├── indianStatesAndCities.ts   # 28 states + 8 UTs with cities — cascading State→City dropdowns
│   │   ├── venueCategories.tsx        # Static venue category/subcategory tree for forms
│   │   ├── eventCategories.ts         # ⚠️ Legacy — superseded by live API metadata endpoints
│   │   └── mockData.ts                # ⚠️ Legacy — no longer imported anywhere
│   │
│   ├── styles/
│   │   ├── theme.css                   # Design tokens (tlb-yellow, tlb-dark, etc.)
│   │   ├── components.css              # Reusable classes (.tlb-button, .tlb-card, .tlb-input, type scale)
│   │   ├── base.css                    # Global baseline (font smoothing, line-height)
│   │   └── utilities.css
│   │
│   ├── types.ts                       # `Screen` union, `EntityType`, shared interfaces
│   ├── App.tsx                        # Root: session restore, route table, route guards, sidebar shell
│   └── main.tsx                       # Entry point
│
├── docs/                              # Backend planning specs (see §13) — historical, not live API truth
│   ├── event-listings-db-spec.md
│   ├── class-listings-db-spec.md
│   ├── program-listings-db-spec.md
│   └── venue-listings-db-spec.md
│
├── loadtest/                          # k6 API load-test harness (see §10)
│   ├── k6-portal.js
│   └── README.md
│
├── Development/
│   └── implementation_graph.md        # ⚠️ An early (2026-05-08) superseded snapshot — kept for history only
│
├── .claude/
│   └── skills/
│       └── full-stack-developer/      # This repo's engineering standard, packaged as an invocable skill
│           └── SKILL.md
│
├── CLAUDE.md                          # Quick architecture/commands reference for AI-assisted development
├── pro_fullstackdeveloper.md          # The project's permanent engineering standard (see §12)
├── implementation_graph.md            # The living, detailed architecture reference + phase changelog
└── PROJECT_DOCUMENTATION.md           # This file
```

**Scale:** 121 TypeScript/TSX source files (excluding tests) across 22 screen folders, 12
API modules, and 14 shared UI primitives.

---

## 4. Core Architecture & Conventions

### 4.1 Navigation — no router library

Navigation is entirely custom, by design:

- `src/types.ts` defines `Screen`, a string-union of every possible screen name
  (`'LANDING' | 'LOGIN' | ... | 'PARTNER_NETWORK'`).
- `App.tsx` holds a `routes: Record<Screen, RouteConfig>` mapping each screen to a
  lazy-loaded component, whether it has the sidebar (`hasSidebar`), and an optional
  `requiresEntities: EntityType[]` gate.
- The active screen is a single `useState<Screen>('LANDING')` inside `AppInner`.
- Every screen receives an `onNavigate: (screen: Screen) => void` prop — call it to
  change screens. **Never use `window.location` or browser history anywhere.**
- `guardedNavigate` (`App.tsx`) is the only way navigation actually happens: it checks
  `requiresEntities` against `allowedEntities` from `PartnerContext` and silently
  redirects to `HOME` on mismatch. Logging out (navigating to `LANDING`) also calls
  `clearTokens()` + `sessionStorage.clear()`.
- All routed screens are wrapped in a `ScreenErrorBoundary` so a render crash shows a
  recoverable fallback (with the sidebar still usable) instead of blanking the whole app.
- Screens are lazy-loaded (`React.lazy`) and prefetched on `requestIdleCallback` (with a
  2s `setTimeout` fallback) after first paint, so the initial bundle stays small while
  navigation still feels instant.

### 4.2 API layer

- **`src/api/client.ts`** is the single fetch wrapper (`apiClient(endpoint, options)`).
  Every network call in the app goes through it — **never call `fetch()` directly**
  anywhere else. (One historical exception was found and fixed — see §9.)
- It injects `Authorization: Bearer <access_token>` on every request, sets
  `Content-Type: application/json` (skipped for `FormData` uploads), and on a `401`
  automatically calls the shared `refreshAccessToken()` helper, retries the original
  request once with the new token, and clears tokens on failure.
- **Envelope pattern:** API responses are unwrapped with `json?.data ?? json` throughout
  — some endpoints wrap the payload in `{ data: ... }`, others don't; every API function
  tolerates both. List-shaped responses are read tolerantly too: plain array, or
  `{ results: [...] }`, or a paginated `{ results, next }`.
- Feature APIs live one file per domain in `src/api/*.ts` (see §7 for the complete
  reference) — typed functions, one concern each, errors surfaced via a shared
  `handleError`/`ApiError` pattern, no business logic leaking into components.

### 4.3 Listing creation wizards

Each of the four entity types (Events, Classes, Programs, Venues) has its own
multi-step creation wizard, all built on two shared components:

- **`WizardLayout`** — sticky header with back button, step label, and a themed
  progress bar (`themeColor: 'purple' | 'blue' | 'yellow' | 'emerald' | 'amber'`).
- **`WizardNavigation`** — bottom continue/back buttons matching the theme.

| Entity | Steps | Theme color | Draft ID key (sessionStorage) |
|---|---|---|---|
| Events | 5 (Details → Schedule → Media → Policies → Preview) | `blue` | `current_event_draft_id` |
| Classes | 5 (Identity → Batch → Media → Policies → Preview) | `yellow` | `current_class_draft_id` |
| Programs | 5 (Identity → Batch → Media → Policies → Preview) | `emerald` | `current_program_draft_id` |
| Venues | 7 (Details → Occasions → Availability → Packages → Amenities → Policies → Preview) | `amber` | `current_venue_draft_id` |

Screen naming convention: `CREATE_<ENTITY>_<STEP>` (e.g. `CREATE_EVENT_DETAILS`).

**Common pattern across all wizards:** Step 1 creates a draft (`POST`, minimal fields)
and stores its ID in `sessionStorage`; every later step reads the draft ID, does a
`GET`-on-mount / `PATCH`-on-Next round trip; media uploads/deletes are immediate (no
batching until Next); the final Preview step re-fetches the full listing, runs a
**client-side readiness check that mirrors the backend's submit-time validation**
(critical — see the "Recurring Issue Pattern" callout below), and calls
`submit<Entity>Listing()` which transitions `draft → pending`.

> **Recurring issue pattern (documented so it doesn't happen again):** the backend's
> `POST .../submit/` endpoint enforces strict field-completeness validation that is
> **not** enforced by the individual step `PATCH` endpoints. A wizard can look fully
> working (every step returns 200) and still fail at Submit with a 400 listing missing
> fields. **Whenever integrating a new wizard step or field, mirror every backend submit
> requirement in the Preview screen's readiness check**, and test with a genuinely new
> draft (not an old one created before a field was added).

### 4.4 Styling

Tailwind v4 via `@tailwindcss/vite`. Design tokens in `src/styles/theme.css`:

- `tlb-yellow` = `#FACC15` (brand accent)
- `tlb-dark` = `#141414` (structure/text)
- Theme: **black / white / yellow** — white base, black structure, yellow accents,
  "lively but subtle" (soft tints, not loud/flat).

Reusable component classes (`src/styles/components.css`):

| Class | Purpose |
|---|---|
| `.tlb-button` | Primary yellow CTA button |
| `.tlb-button-dark` | Secondary dark button |
| `.tlb-badge` | Small status/label pill |
| `.tlb-card` | White rounded card, subtle shadow |
| `.tlb-input` | Standard form input with yellow focus ring |
| `.tlb-content` | Full-width content wrapper inside a wizard's main area |
| `.tlb-page-title` / `.tlb-page-sub` | The canonical H1 + muted subtitle for a screen header |
| `.tlb-h2` / `.tlb-h3` | Section / card headings |
| `.tlb-label` | Micro-label above a field/value |
| `.tlb-body` / `.tlb-muted` | Body copy / secondary copy |

### 4.5 Feedback & loading

- **Toasts:** a global imperative singleton — `toast.success/error/warning/info(message,
  { title?, duration? })` — backed by one `<Toaster/>` mounted in `App.tsx`. All
  `alert()` calls across the app have been replaced with this. A legacy
  `useToasts()`/`<ToastContainer/>` shim (same visual design) is still used by some
  auth/onboarding screens.
- **Loading states:** layout-matched skeleton loaders (`components/ui/Skeleton.tsx` —
  `SkeletonPage`/`Dashboard`/`Listings`/`Profile`/`List`/`Card`), not ad-hoc spinners,
  for any full-page load.

---

## 5. Global State, Storage & Session

### 5.1 `PartnerContext` — the only React context

`src/context/PartnerContext.tsx` holds `allowedEntities: EntityType[]` — the subset of
`'Events' | 'Classes' | 'Programs' | 'Venues'` the signed-in partner is allowed to
offer. Persisted to `sessionStorage`, synced from the API (`partner.categories`) on
session restore. Drives sidebar visibility, route guards, and every screen's
entity-conditional UI.

### 5.2 Storage map

| Key | Storage | Set by | Read by |
|---|---|---|---|
| `access_token` | localStorage | OTP verify, token refresh | `apiClient` (every request) |
| `refresh_token` | localStorage | OTP verify | `apiClient` (on 401), `App.tsx` (session restore) |
| `allowedEntities` | sessionStorage | `PartnerContext` (synced from API) | `PartnerContext`, sidebar, route guards |
| `pan_number` / `gst_number` | sessionStorage | `IdentityVerification` | `BankSetup` — **cleared immediately after successful submission** (see §9) |
| `current_event_draft_id` | sessionStorage | Event wizard Step 1 / Edit | All 5 event wizard steps |
| `current_venue_draft_id` | sessionStorage | Venue wizard Step 1 / Edit | All 7 venue wizard steps |
| `current_class_draft_id` | sessionStorage | Class wizard Step 1 / Edit | All 5 class wizard steps |
| `current_program_draft_id` | sessionStorage | Program wizard Step 1 / Edit | All 5 program wizard steps |
| `attendees_density` / `listings_density` | localStorage | View-density toggles | Attendees/Bookings, My Listings |

Auth tokens and all category/draft state are cleared together on logout
(`guardedNavigate` → `LANDING` → `clearTokens()` + `sessionStorage.clear()`).

### 5.3 Session restore flow (on page load / refresh)

```
App mounts → restoreSession()
  ├─ access_token in localStorage?
  │   └─ YES → GET /api/v1/partner/me/ → route by status (apiClient handles 401→refresh transparently)
  ├─ NO access_token, but refresh_token exists?
  │   └─ refreshAccessToken() [shared helper, also used by apiClient's own 401 handler]
  │       ├─ succeeds → GET /partner/me/ → route by status
  │       └─ fails → clearTokens() → LANDING
  └─ No tokens at all → LANDING
```

### 5.4 Partner status → screen routing

| Partner status | Routed to | Notes |
|---|---|---|
| `otp_verified` | `PARTNER_CATEGORY` | Must select categories first |
| `category_selected` | `REGISTRATION` | Must complete profile |
| `profile_created` | `HOME` | Needs ≥3 images to auto-activate |
| `activated_limited` | `HOME` | Can submit KYC verification |
| `under_review` | `HOME` | Waiting for admin |
| `approved` | `HOME` | Fully verified |
| No/invalid token | `LANDING` | Login required |

**Activation gate (backend logic, mirrored client-side):** after
`POST /api/v1/partners/profile/`, the backend auto-transitions
`profile_created → activated_limited` (and sets `is_active = true`) once
`is_safety_confirmed`, `is_info_correct`, and ≥3 uploaded images are all true. The
frontend enforces the same ≥3-image requirement in `Registration.tsx` before allowing
submission.

**Login vs. onboarding boundary:** `OTPVerify` gates entry to `HOME` — after a
successful `verifyOtp`, it fetches `getCurrentPartner()` and only allows statuses
`profile_created` / `activated_limited` / `under_review` / `approved` through; anything
earlier (or a fetch failure) clears tokens and routes back to `LANDING` with a toast
("not registered as a partner"). Conversely, `PartnerCategory` intercepts the
`INVALID_PARTNER_STATE` error from `selectCategories()` (returned when an
already-onboarded partner re-enters onboarding) and redirects to `LOGIN`.

---

## 6. Screens & Features

### 6.1 Auth & Onboarding

| Screen | Purpose |
|---|---|
| `Landing` | Public marketing page — animated hero, floating entity cards, stats, feature grid, "How it works" |
| `Login` | 50/50 split-panel (dark brand panel + form), tabbed Mobile/Email OTP request |
| `OTPVerify` | 6-digit OTP entry, 30s resend countdown, login-gate status check (see §5.4) |
| `PartnerAccess` / `PartnerAccessOTP` | New-partner entry point + its own OTP step |
| `PartnerCategory` | 2×2 entity-type picker (Events/Classes/Programs/Venues) |
| `Registration` | Business profile form + ≥3 photo upload (activation requirement) |
| `AppSubmitted` / `AppApproved` | Static confirmation screens |
| `AgreementSubmit` | Tabbed A/B/C KYC + bank + agreement submission (legacy path) |
| `IdentityVerification` | PAN (regex-validated) + optional GST — stored transiently in sessionStorage |
| `BankSetup` | Account holder/number/IFSC (regex-validated + confirm-match) → `submitVerification()`, then clears the sessionStorage PAN/GST |
| `OnboardingComplete` | Final onboarding screen with "Next Steps" cards |

### 6.2 Core / Account

| Screen | Purpose |
|---|---|
| `Dashboard` (`HOME`) | KPI grid (bookings/enquiries/views/followers/reviews/revenue), profile-completion ring + checklist, revenue & recent-activity panels, entity-specific "at a glance" offering cards. Header exposes **Latest Listings** and **Bookings Calendar** as popups (see `TopHeader`) rather than embedding them inline. |
| `Accounts` | Small hub linking to Brand Profile + Documents |
| `EditProfile` (Brand Profile) | Business identity — logo, cover, bio, social links, gallery |
| `PreviewProfile` | Public-facing preview of the partner's profile |

### 6.3 Listings (`ServiceListings` — "My Listings")

The shared dashboard for all four entity types. Fetches Events/Classes/Programs/Venues
in parallel (`Promise.allSettled`), tags each item with its `entityType` **at fetch
time** (not derived from a `listing_type` field, since Events use `cover_url` and
Venues use `cover`, etc.). Features:

- Status stat-chips (quick filters: All/Live/In Review/Rejected/Drafts/Archived).
- **Latest Active Listing** card — the most recently created listing that's published
  and not paused.
- **History** card — up to 2 other listings with a "+N more" button that opens a modal
  listing all of them, reusing the same `Directory`-style row rendering.
- View density control (Comfortable / Compact / List — persisted), each rendering the
  same actions (Edit, Pause/Resume, Archive/Unarchive, coupon attach).
- Filter bottom sheet (status, listing type, sort) with a staged temp-state pattern
  (only committed on Apply).
- Pagination with a "Show: N entries" page-size selector (5/10/25/50).
- Edit is disabled **only** for `published` and `archived` listings — draft, pending,
  and rejected are all editable. Clicking Edit sets the entity's draft ID and routes to
  that wizard's first step.
- Pause/Resume/Archive/Unarchive use **generic**, entity-agnostic endpoints
  (`/listings/{id}/{action}/`) for all four types.

### 6.4 Listing Creation Wizards

See §4.3 for the shared pattern. Per-entity specifics:

- **Events** (`src/screens/events/`) — mode (online/offline/hybrid), category/format
  from metadata, age groups, ticket-tier CRUD (or free capacity), cover/gallery/video
  media, FAQs & Terms (`FaqTermsEditor`).
- **Classes** (`src/screens/classes/`) — separate `mode` (delivery) and `format` (class
  type) fields, `booking_type` (enquiry/booking) card, weekly recurring batches
  (3-letter day abbreviations), FAQs sent inline in the PATCH body (no dedicated
  endpoint).
- **Programs** (`src/screens/programs/`) — mirrors Classes but with `delivery_mode` /
  `program_format` field names and a **dedicated** `/faqs/` CRUD endpoint (unlike
  Classes).
- **Venues** (`src/screens/venues/`, the largest wizard at 7 steps) — location
  (cascading State→City, district, pincode, lat/lng), occasions + discovery tags +
  required attendee fields, availability time slots, priced packages, an **amenities**
  step (grouped catalog — 11 groups / 58 amenities as of the latest catalog expansion,
  chip-toggle picker with per-amenity icons and graceful fallback for retired
  amenities still attached to older venues), and Policies (FAQs — including **per-FAQ
  document attachments**, up to 5 files/10MB each, PDF/DOC/XLS/image — + Terms).

### 6.5 Bookings, Attendees & Enquiries

- **`Attendees` / `Bookings`** (`src/screens/attendees/Attendees.tsx`) — one shared
  component (`BookingsBase`) exported twice via a `variant: 'attendees' | 'bookings'`
  prop. `Attendees` shows only `status === 'attended'` entries; `Bookings` shows all.
  - **Attendees landing** (unchanged, toggle-based): KPI strip + By-Listing/By-Date
    card grid (density-controlled) + a group drill-down with a Bookings/Attendees/
    Enquiries sub-toggle and a booking detail drawer.
  - **Bookings landing** (redesigned into a tab bar): **Overview** (KPI strip +
    "Bookings by Status" / "Bookings by Listing Type" breakdown panels) · **By
    Listing** / **By Date** (the same card grids) · **Directory** (flat searchable
    table of every listing) · **Bookings** (flat searchable/filterable table of every
    booking across all listings) · **Enquiries** (flat searchable table of every
    enquiry across all lead-based listings) — all four flat tables paginated with a
    page-size selector.
  - **Booking detail drawer** — slides in from the right; entity-colored gradient hero
    (status/type/payment pills + amount), white bordered cards per section (Customer
    with initial-avatar, Order Items, Attendees, Payment Summary, Payment Activity
    rendered as a small connected timeline), and a Cancellation block when applicable.
    "Mark Attended" is the only partner action — **partners cannot cancel bookings**
    (`/cancel/` is 403 for partner tokens; only customers can cancel).
- **`EnquiriesHub`** (route: `ENQUIRIES`) — a single unified screen with an internal
  Classes/Programs/Venues category picker rendering `Enquiries` / `ProgramEnquiries` /
  `VenueEnquiries` inline (these three are no longer separate top-level routes).

### 6.6 Reviews, Followers, Analytics

- **`Reviews`** — overall rating summary + per-listing accordion of reviews
  (`getPartnerReviews`, paginated; `getListingReviews`, 404-safe).
- **`Followers`** — total + new-in-30-days + search over the partner's follower list,
  via the newer self-scoped `api/followers.ts` (server-side search/filter/sort/
  pagination), superseding an older `getPartnerFollowers` helper in `onboarding.ts`.
- **`Analytics`** — audience & growth data hub: hero KPIs (views/followers/reach/
  engagement), auto-generated plain-language growth insights, reach trend, weekly
  activity, audience-by-category donut, plus entity-conditional tabs (Events/Venues/
  Classes/Programs) and Revenue/Reviews tabs — sourced from the six `/stats/*`
  endpoints (see §7.5) fetched in parallel via `Promise.allSettled`.

### 6.7 Coupons, Support, Partner Network, Financial

- **`CreateCoupon` / `AllCoupons`** — live discount-coupon CRUD with targeting
  (specific listing, category, gender/age audience), soft-delete deactivation, and a
  per-listing attach/change/remove modal in ServiceListings.
- **`Support`** — tabbed **My Tickets** (raise/list/chat, status-based polling cadence,
  close) and **Shared Queries** (admin-forwarded customer tickets — three-party chat,
  partner can only reply). Redesigned hero: a plain white card (matching the rest of
  the screen) instead of a bold black gradient banner.
- **`PartnerNetwork`** — Discover (search/filter directory) → partner profile (block/
  unblock, ping) → Messages (1:1 conversations, paginated, multipart attachments).
- **`FinancialHub`** — bank/payout account details via `api/banking.ts`
  (`getBankDetails`/`updateBankDetails`); transaction history and earned/commission
  stat cards remain placeholders pending a dedicated financial API.
- **`Documents`** — KYC (PAN/GST/bank via `submitVerification`), brand assets
  (logo/cover), and uploaded media in one screen.
- **`Messages`** — full-screen notification inbox (list, mark read/all, preferences).
- **`Packages`** — UI placeholder; no backend API exists for it yet.

---

## 7. Complete API Documentation

Every function below lives in `src/api/*.ts` and goes through the shared `apiClient`
(§4.2) unless noted. All partner-scoped endpoints require
`Authorization: Bearer <access_token>` and (for most) an `approved` or otherwise
sufficiently-onboarded partner status.

### 7.1 `client.ts` — the API client itself

| Export | Purpose |
|---|---|
| `apiClient(endpoint, options)` | Central fetch wrapper — base URL, JSON/FormData headers, auth header, 401→refresh→retry |
| `getAuthToken` / `setAuthToken` | Read/write `access_token` (localStorage) |
| `getRefreshToken` / `setRefreshToken` | Read/write `refresh_token` (localStorage) |
| `clearTokens()` | Removes both tokens (logout) |
| `refreshAccessToken()` | Shared refresh-token exchange — used by both `apiClient`'s own 401 handler and `App.tsx`'s session-restore effect (single source of truth, no duplicated fetch logic) |

**401 auto-refresh flow:** `request → 401? → refreshAccessToken() → success: save new
access_token, retry original request once → failure: clearTokens(), return the failed
response.`

### 7.2 `auth.ts` — Authentication

| Function | Method | Endpoint | Payload |
|---|---|---|---|
| `requestOtp` | POST | `/api/v1/auth/request-otp/` | `{ identifier, identifier_type }` |
| `verifyOtp` | POST | `/api/v1/auth/verify-otp/` | `{ identifier, otp, role: "partner" }` |
| `getCurrentUser` | GET | `/api/v1/auth/me/` | — |
| `logout` | POST | `/api/v1/auth/logout/` | `{ refresh_token }` |

### 7.3 `onboarding.ts` — Partner profile & lifecycle

| Function | Method | Endpoint | Payload |
|---|---|---|---|
| `getPartnerCategories` | GET | `/api/v1/partners/categories/` | — |
| `selectCategories` | POST | `/api/v1/partners/select-categories/` | `{ categories: string[] }` |
| `getBusinessProfile` | GET | `/api/v1/partners/profile/` | — |
| `updateBusinessProfile` | POST | `/api/v1/partners/profile/` | Profile fields (JSON) |
| `getExtendedProfile` | GET | `/api/v1/partners/extended-profile/` | — |
| `updateExtendedProfile` | POST | `/api/v1/partners/extended-profile/` | FormData (bio, logo, cover, contact, cities) |
| `getPartnerMedia` | GET | `/api/v1/partners/media/` | — |
| `uploadPartnerMedia` | POST | `/api/v1/partners/media/` | FormData (file, media_type) |
| `deletePartnerMedia` | DELETE | `/api/v1/partners/media/{id}/` | — |
| `getCurrentPartner` | GET | `/api/v1/partner/me/` | — (session restore, Dashboard, FinancialHub, login gate) |
| `getPartnerDashboard` | GET | `/api/v1/partners/dashboard/` | — (legacy fallback; `/stats/overview/` preferred) |
| `getPartnerFollowerCount` | GET | `/api/v1/partner/{partner_id}/followers/count/` | — |
| `getPartnerFollowers` | GET | `/api/v1/partner/{partner_id}/followers/?page=` | — (older, paginated; largely superseded by `api/followers.ts`) |
| `activatePartner` | POST | `/api/v1/partners/activate/` | `{ is_active: true }` (available, not actively used) |
| `submitVerification` | POST | `/api/v1/partner/verification/` | PAN, GST, bank details, agreement |

### 7.4 `listings.ts` — Listings, media, bookings, FAQs (the largest module)

#### Events — base `/api/v1/partner/listings/events/`

| Function | Method | Endpoint | Payload |
|---|---|---|---|
| `getEventMetaCategories` | GET | `/api/v1/listings/events/metadata/categories/` | — |
| `getEventMetaFormats` | GET | `/api/v1/listings/events/metadata/formats/` | — |
| `getEventMetaAgeGroups` | GET | `/api/v1/listings/events/metadata/age-groups/` | — |
| `getEventListings` | GET | `/api/v1/partner/listings/events/` | — |
| `getListingDetail` | GET | `/api/v1/partner/listings/events/<id>/` | — |
| `createEventDraft` | POST | `/api/v1/partner/listings/events/` | `{ title?, description? }` |
| `updateListing` | PATCH | `/api/v1/partner/listings/events/<id>/` | Partial event fields |
| `submitListing` | POST | `/api/v1/partner/listings/events/<id>/submit/` | — |
| `getListingMedia` | GET | `/api/v1/partner/listings/events/<id>/media/` | — |
| `uploadListingMedia` | POST | `/api/v1/partner/listings/events/<id>/media/` | FormData (file, media_type) |
| `deleteListingMedia` | DELETE | `/api/v1/partner/listings/events/<id>/media/<mid>/` | — |
| `getTickets` / `createTicket` / `updateTicket` / `deleteTicket` | GET/POST/PUT/DELETE | `/api/v1/partner/listings/events/<id>/tickets/[<tid>/]` | Ticket tier fields |

> Event media field is `file_url` (not `url`).

#### Venues — base `/api/v1/partner/listings/venues/`

| Function | Method | Endpoint | Payload |
|---|---|---|---|
| `getVenueListings` | GET | `/api/v1/partner/listings/venues/` | — |
| `getVenueListingDetail` | GET | `/api/v1/partner/listings/venues/<id>/` | — (returns all sub-resources inline: media, availability, packages, discovery, occasions, attendee fields) |
| `createVenueListing` | POST | `/api/v1/partner/listings/venues/` | `{ title }` |
| `updateVenueListing` | PATCH | `/api/v1/partner/listings/venues/<id>/` | Partial venue fields |
| `uploadVenueMedia` / `deleteVenueMedia` | POST/DELETE | `/api/v1/partner/listings/venues/<id>/media/[<mid>/]` | FormData |
| `getVenueMetaOccasions` | GET | `/api/v1/listings/venues/meta/occasions/` | — |
| `getVenueMetaDiscoveryEnums` | GET | `/api/v1/listings/venues/meta/discovery-enums/` | — |
| `updateVenueDiscovery` | PUT | `/api/v1/partner/listings/venues/<id>/discovery/` | `{ outing_types, activity_types, format_types }` |
| `getVenueAttendeeFields` / `updateVenueAttendeeFields` | GET/PUT | `/api/v1/partner/listings/venues/<id>/attendee-fields/` | `string[]` field keys |
| `getVenueAvailability` / `createVenueAvailabilitySlot` / `deleteVenueAvailabilitySlot` | GET/POST/DELETE | `/api/v1/partner/listings/venues/<id>/availability/[<sid>/]` | `{ date, start_time, end_time, note? }` |
| `getVenuePackages` / `createVenuePackage` / `updateVenuePackage` / `deleteVenuePackage` | GET/POST/PATCH/DELETE | `/api/v1/partner/listings/venues/<id>/packages/[<pid>/]` | `{ name, price, description, duration_minutes?, max_guests? }` |
| `getAmenityCatalog` | GET | `/api/v1/listings/venues/metadata/amenities/` | — (public, no auth; ~1hr cached; 11 groups/58 amenities) |
| `getVenueAmenities` / `updateVenueAmenities` | GET/PUT | `/api/v1/partner/listings/venues/<id>/amenities/` | `{ amenity_ids: number[], custom_amenities: string[] }` (atomic replace) |
| `getFaqDocuments` / `uploadFaqDocument` / `deleteFaqDocument` | GET/POST/DELETE | `/api/v1/partner/listings/venues/<id>/faqs/<faqId>/documents/[<docId>/]` | Multipart `file` (+ optional `title`, `sort_order`); ≤5 docs/FAQ, ≤10MB, pdf/doc/docx/xls/xlsx/png/jpg/jpeg. Parameterized by entity (`'venues'\|'events'\|'programs'`) — currently only wired for Venues; ready for Events/Programs if the backend adds the same sub-resource. |

> Venue media field is `url` (not `file_url`). Both `CreateClassMedia` and
> `CreateVenueDetails` resolve URLs defensively via
> `resolveUrl(item.url || item.file_url || '')`.

#### Classes — base `/api/v1/partner/listings/classes/`

| Function | Method | Endpoint | Payload |
|---|---|---|---|
| `getClassMetaCategories` / `getClassMetaFormats` | GET | `/api/v1/listings/classes/metadata/{categories,formats}/` | — |
| `getClassListings` | GET | `/api/v1/partner/listings/classes/` | — |
| `getClassListingDetail` | GET | `/api/v1/partner/listings/classes/<id>/` | — (media embedded — no GET `/media/` endpoint exists, returns 405) |
| `createClassDraft` | POST | `/api/v1/partner/listings/classes/` | `{ title, short_description, description, booking_type }` |
| `updateClassListing` | PATCH | `/api/v1/partner/listings/classes/<id>/` | Partial fields (FAQs sent inline as `faqs: [{question, answer}]`, replaces entire list) |
| `submitClassListing` | POST | `/api/v1/partner/listings/classes/<id>/submit/` | — |
| `setClassListingLive` | POST | `/api/v1/partner/listings/classes/<id>/live/` | `{ is_live }` (available, unused — generic pause/resume used instead) |
| `getClassBatches` / `createClassBatch` / `updateClassBatch` / `deleteClassBatch` | GET/POST/PUT/DELETE | `/api/v1/partner/listings/classes/<id>/batches/[<bid>/]` | `days` = 3-letter abbrs, `capacity` field |
| `uploadClassMedia` / `deleteClassMedia` | POST/DELETE | `/api/v1/partner/listings/classes/<id>/media/[<mid>/]` | FormData |

#### Enquiries (Classes & Venues — flat CRM pattern)

| Function | Method | Endpoint |
|---|---|---|
| `getClassEnquiries` / `getClassEnquiryDetail` / `updateClassEnquiry` / `unlockClassEnquiry` | GET/GET/PUT/POST | `/api/v1/partner/listings/classes/enquiries/[<id>/][/unlock/]` |
| `getVenueEnquiries` / `getVenueEnquiryDetail` / `updateVenueEnquiry` / `unlockVenueEnquiry` | GET/GET/PUT/POST | `/api/v1/partner/listings/venues/enquiries/[<id>/][/unlock/]` |

#### Reviews

| Function | Method | Endpoint | Notes |
|---|---|---|---|
| `getPartnerReviews` | GET | `/api/v1/partner/reviews/?page=` | All pages fetched; normalized shape |
| `getListingReviews` | GET | `/api/v1/partner/listings/<id>/reviews/` | Returns `[]` on 404 |

#### Programs — base `/api/v1/partner/listings/programs/`

| Function | Method | Endpoint | Payload |
|---|---|---|---|
| `getProgramMetaCategories` / `getProgramMetaFormats` / `getProgramMetaTags` | GET | `/api/v1/listings/programs/metadata/{categories,formats,tags}/` | — |
| `getProgramListings` / `getProgramListingDetail` | GET | `/api/v1/partner/listings/programs/[<id>/]` | — |
| `createProgramDraft` | POST | `/api/v1/partner/listings/programs/` | `{ title, short_description?, description?, booking_type }` |
| `updateProgramListing` / `deleteProgramListing` | PATCH/DELETE | `/api/v1/partner/listings/programs/<id>/` | Partial fields |
| `submitProgramListing` / `archiveProgramListing` / `unarchiveProgramListing` | POST | `/api/v1/partner/listings/programs/<id>/{submit,archive,unarchive}/` | — |
| `getProgramBatches` / `createProgramBatch` / `updateProgramBatch` / `deleteProgramBatch` | GET/POST/PUT/DELETE | `/api/v1/partner/listings/programs/<id>/batches/[<bid>/]` | `days` = 3-letter abbrs, `capacity` |
| `getProgramEnquiries` / `updateProgramEnquiry` | GET/PATCH | `/api/v1/partner/listings/programs/<id>/enquiries/[<eid>/]` | `{ status?, partner_note? }` |
| `getProgramFaqs` / `createProgramFaq` / `updateProgramFaq` / `deleteProgramFaq` | GET/POST/PATCH/DELETE | `/api/v1/partner/listings/programs/<id>/faqs/[<fid>/]` | `{ question, answer }` — **dedicated** endpoint (unlike Classes) |
| `getProgramMedia` / `uploadProgramMedia` / `deleteProgramMedia` | GET/POST/DELETE | `/api/v1/partner/listings/programs/<id>/media/[<mid>/]` | FormData |

#### Bookings (partner-wide)

| Function | Method | Endpoint | Notes |
|---|---|---|---|
| `getBookings` | GET | `/api/v1/partner/bookings/` | Query: `status?`, `listing_id?`, `page?`; includes `listing_id`+`listing_title` per booking |
| `getBookingDetail` | GET | `/api/v1/partner/bookings/{id}/` | — |
| `markBookingAttended` | POST | `/api/v1/partner/bookings/{id}/mark-attended/` | — |
| `getBookingPaymentDetail` | GET | `/api/v1/partner/bookings/{id}/payment-detail/` | `{ payment_method, amount, status }` — no card/UPI details |
| `cancelBooking` | POST | `/api/v1/partner/bookings/{id}/cancel/` | ⚠️ **403 for partners** — kept for tests only, never wired into the UI |

Booking field reference: `status` ∈ `awaiting_payment/confirmed/attended/cancelled`;
`payment_status` ∈ `paid/pending/refunded`; `booking_type` ∈
`event/class/program/venue`.

#### Generic listing actions (entity-agnostic)

| Function | Method | Endpoint |
|---|---|---|
| `pauseListing` / `resumeListing` | POST | `/api/v1/partner/listings/{id}/{pause,resume}/` |
| `archiveListing` / `unarchiveListing` | POST | `/api/v1/partner/listings/{id}/{archive,unarchive}/` |

> These generic routes are what the backend actually registers for **every** entity
> type; the older entity-specific routes (`/classes/{id}/live/`,
> `/programs/{id}/archive/`) 404. The entity-specific helpers remain in `listings.ts`
> (with passing tests) but are not called from the UI.

#### FAQs & Terms (Events / Venues)

| Function | Method | Endpoint |
|---|---|---|
| `getEventFaqs` / `createEventFaq` / `updateEventFaq` / `deleteEventFaq` | GET/POST/PUT/DELETE | `/api/v1/partner/listings/events/{id}/faqs/[{faqId}/]` |
| `getVenueFaqs` / `createVenueFaq` / `updateVenueFaq` / `deleteVenueFaq` | GET/POST/PUT/DELETE | `/api/v1/partner/listings/venues/{id}/faqs/[{faqId}/]` |
| `getListingTerms` | GET | `/api/v1/partner/listings/{id}/terms/` | Generic — works for all 4 entity types via listing UUID; returns `null` on 404 |
| `setListingTerms` | PUT | `/api/v1/partner/listings/{id}/terms/` | Multipart `content` and/or `document` file |
| `deleteListingTerms` | DELETE | `/api/v1/partner/listings/{id}/terms/` | — |

#### Draft ID helpers (sessionStorage)

`getCurrentDraftId`/`setCurrentDraftId`/`clearCurrentDraftId` (+ the `Venue`/`Class`/
`Program` variants) — see §5.2 for the exact keys.

### 7.5 `stats.ts` — Partner analytics

All six require an `approved` partner. `Analytics` fetches them in parallel via
`Promise.allSettled`.

| Function | Method | Endpoint | Returns (shape) |
|---|---|---|---|
| `getStatsOverview` | GET | `/api/v1/partner/stats/overview/` | `{ profile_views, followers, new_enquiries, active_batches }` |
| `getStatsEvents` | GET | `/api/v1/partner/stats/events/` | `{ upcoming, tickets_sold, registrations, event_reach, engagement_rate, booking_conv_rate, this_month_tickets, prev_month_tickets, ticket_growth_pct, weekly_ticket_sales[], ticket_sales_trend[], by_category[] }` |
| `getStatsVenues` | GET | `/api/v1/partner/stats/venues/` | `{ total_bookings, upcoming, monthly_earnings, occupancy_rate, avg_duration_minutes, repeat_clients, revenue_trend[] }` |
| `getStatsEnquiries` | GET | `/api/v1/partner/stats/enquiries/` | `{ conversion_funnel, trial_requests, avg_response_hours, student_retention_pct, monthly_enrolments, monthly_trend[] }` |
| `getStatsRevenue` | GET | `/api/v1/partner/stats/revenue/?period=` | `period` ∈ `7d\|30d\|90d\|1y\|all`; `{ gross_revenue, platform_fees, refunds, net_earnings, confirmed_bookings, avg_order_value, this_month, prev_month, revenue_growth_pct, revenue_by_type[], revenue_trend[] }` |
| `getStatsReviews` | GET | `/api/v1/partner/stats/reviews/` | `{ avg_rating, total_reviews, reviews_this_month, reviews_prev_month, rating_distribution[], avg_rating_trend[], recent_reviews[] }` |
| `trackProfileView` | POST | `/api/v1/partner/{partner_id}/track-view/` | No auth required; best-effort/silent-fail |

Field gotchas: `engagement_rate` is always `null` until backend tracking is added;
`avg_response_hours` is `null` until the partner's first status change on an enquiry;
money fields (`monthly_earnings`, `gross_revenue`, etc.) come back as **strings** and
are coerced client-side.

### 7.6 `coupons.ts` — Discount coupons (live, requires approved partner)

| Function | Method | Endpoint |
|---|---|---|
| `getCoupons({ is_active?, discount_type? })` | GET | `/api/v1/partner/coupons/` |
| `getCoupon` | GET | `/api/v1/partner/coupons/{id}/` |
| `createCoupon` | POST | `/api/v1/partner/coupons/` |
| `updateCoupon` | PATCH | `/api/v1/partner/coupons/{id}/` |
| `deactivateCoupon` | DELETE | `/api/v1/partner/coupons/{id}/` (soft-delete → `is_active=false`) |
| `getCouponUsages` | GET | `/api/v1/partner/coupons/{id}/usages/` |

Discount math (server-side): `percent` → `amount − (amount × value/100)`, capped at
`max_discount`; `fixed` → `amount − value`. Blocked on ₹0 bookings. Listing PATCH
endpoints accept `coupon_code` (string to attach, `null` to remove).

### 7.7 `help.ts` — Support tickets (base `/api/v1/help/`)

| Function | Method | Endpoint | Notes |
|---|---|---|---|
| `getTicketCategories` | GET | `/help/tickets/categories/` | Role-restricted; don't hardcode |
| `listTickets` / `getTicket` | GET | `/help/tickets/[list/\|{id}/]` | — |
| `createTicket` | POST | `/help/tickets/` | `{ subject, category, body, booking_id? }` |
| `getTicketMessages` | GET | `/help/tickets/{id}/messages/?since=` | Returns `{ ticket_status, messages[] }`; omit `since` for full thread |
| `sendTicketMessage` | POST | `/help/tickets/{id}/messages/send/` | `{ body }` |
| `closeTicket` | POST | `/help/tickets/{id}/close/` | Terminal — cannot reopen |
| `listSharedTickets` / `getSharedTicket` / `getSharedTicketMessages` / `sendSharedTicketMessage` | GET/GET/GET/POST | `/help/partner/shared-tickets/...` | Admin-forwarded customer queries; partner can only reply |

Statuses: `open` → `in_progress` → `resolved` → `closed`. Polling cadence:
`in_progress` 5s, `open` 30s, `resolved` 60s, `closed` stop.

### 7.8 `notifications.ts` — In-app notifications (base `/api/v1/notifications/`)

| Function | Method | Endpoint |
|---|---|---|
| `listNotifications({ unread?, page?, page_size? })` | GET | `/notifications/in-app/` |
| `getUnreadCount` | GET | `/notifications/in-app/unread-count/` (polled every 60s for the bell badge) |
| `markNotificationRead` / `markAllNotificationsRead` | POST | `/notifications/in-app/{id}/read/` / `/read-all/` |
| `getNotificationPreferences` / `updateNotificationPreferences` | GET/PATCH | `/notifications/preferences/` |

### 7.9 `network.ts` — Partner Network (base `/api/v1/partner/network/`)

| Function | Method | Endpoint |
|---|---|---|
| `listNetworkPartners({ search?, category_id? })` | GET | `/network/partners/` |
| `getNetworkPartner` | GET | `/network/partners/{id}/` |
| `blockPartner` / `unblockPartner` | POST/DELETE | `/network/partners/{id}/block/` |
| `listBlockedPartners` | GET | `/network/blocks/` |
| `startConversation({ partner_id })` | POST | `/network/conversations/` (idempotent) |
| `listConversations` / `getConversation` | GET | `/network/conversations/[{id}/]` |
| `getConversationMessages` | GET | `/network/conversations/{id}/messages/?page=` (all pages fetched, oldest-first) |
| `sendConversationMessage` | POST | `/network/conversations/{id}/messages/` (multipart) |
| `markConversationRead` | POST | `/network/conversations/{id}/messages/read/` |

Ownership: a message is yours when `sender.id === your partner id` — there's no
`is_mine` field.

### 7.10 `followers.ts` — Follower directory (self-scoped)

| Function | Method | Endpoint |
|---|---|---|
| `getFollowers({ search?, city?, gender?, ordering?, page?, page_size? })` | GET | `/api/v1/partner/followers/` |
| `getFollowerDetail(followerId)` | GET | `/api/v1/partner/followers/{followerId}/` |

Self-scoped via the bearer token (no partner ID needed in the path) — a newer,
richer-filtering replacement for the older `getPartnerFollowers` in `onboarding.ts`.

### 7.11 `banking.ts` — Bank/payout details

| Function | Method | Endpoint | Payload |
|---|---|---|---|
| `getBankDetails` | GET | `/api/v1/partner/bank-details/` | — (returns `null` on 404) |
| `updateBankDetails(data, cancelledCheque?)` | PUT | `/api/v1/partner/bank-details/` | JSON, or multipart when a cancelled-cheque file is attached |

`BankDetails` shape: `{ account_holder_name, bank_name, branch_name,
account_number_masked, ifsc_code, cancelled_cheque_url, consent_given,
verification_status: 'pending'|'under_review'|'verified'|'rejected', verification_note,
updated_at }`.

---

## 8. Design System

| Token | Value | Usage |
|---|---|---|
| `tlb-yellow` | `#FACC15` | Primary accent, CTAs, highlights |
| `tlb-dark` | `#141414` | Structure, dark text/backgrounds |

| Class | Value | Usage |
|---|---|---|
| `.tlb-page-title` | `text-2xl font-black tracking-tight leading-tight` | The one H1 in a screen's sticky header |
| `.tlb-page-sub` | `text-sm font-medium text-gray-400 mt-0.5` | Muted subtitle |
| `.tlb-h2` | `text-lg font-black tracking-tight` | Major section heading |
| `.tlb-h3` | `text-base font-bold` | Card/sub-section heading |
| `.tlb-label` | `text-[10px] font-bold uppercase tracking-widest text-gray-400` | Micro-label above a field |
| `.tlb-body` | `text-sm text-gray-600 leading-relaxed` | Default body copy |
| `.tlb-muted` | `text-xs text-gray-400` | Secondary/helper copy |

Applied consistently across the app's page headers. The Dashboard keeps its own
bespoke greeting header instead. Chart primitives (`AreaSparkline`, `TrendAreaChart`,
`WeeklyBarChart`, `DonutChart`, `TrendBadge`) are pure SVG, no charting library, shared
via `components/ui/DashboardCharts.tsx`; a Statistics/Analytics-only interactive
toolkit (`StatCharts.tsx`) adds hover crosshairs, animated bars, and funnel charts.

---

## 9. Security

Security is treated as a core requirement even on this frontend-only SPA (see
`pro_fullstackdeveloper.md` §7 and the `full-stack-developer` skill's security-audit
mode, §12). A full audit was performed and every real finding was fixed:

| Area | Status |
|---|---|
| **Token handling** | ✅ Confirmed — `access_token`/`refresh_token` are read/written **only** in `src/api/client.ts`; no bypass anywhere else in `src/` |
| **Console log leakage** | ✅ Confirmed clean — every API wrapper throws `Error(message-string-only)`, never the raw response body; no `console.log(response/data/user)` anywhere |
| **Raw `fetch()` bypassing `apiClient`** | ✅ Fixed — `App.tsx`'s session-restore effect used to duplicate the token-refresh `fetch()` (with its own literal `BASE_URL`) instead of reusing `client.ts`. Extracted a shared `refreshAccessToken()` used by both call sites |
| **XSS (`dangerouslySetInnerHTML`/`eval`/`new Function`)** | ✅ Confirmed clean — zero occurrences anywhere in `src/` |
| **Route guards (`requiresEntities`)** | ✅ Fixed — the field existed on `RouteConfig` and was checked in `guardedNavigate`, but was never actually **set** on any route (dead code). Now wired up on all 21 entity-specific creation-wizard routes and `ENQUIRIES` |
| **Sensitive data in storage** | ✅ Fixed — PAN and GST numbers sat in plaintext `sessionStorage` until logout. `BankSetup` now clears both keys immediately after a successful verification submission |
| **Hardcoded secrets** | ✅ Confirmed clean — no API keys/JWTs/credentials in source; only `.env.example` is tracked (and it was unrelated Gemini/AI-Studio boilerplate — removed) |
| **Third-party/external calls** | ✅ Confirmed benign — Google Fonts CSS, a decorative texture image, user-initiated `wa.me`/Google Maps links (using data already visible on the page), and the API host itself. No analytics/tracking scripts |

**Additional standing rules** (from `pro_fullstackdeveloper.md` §7):

- Never `dangerouslySetInnerHTML` untrusted content.
- Respect route guards and partner-status gating for both AuthN and AuthZ.
- No credentials in the repo; environment values stay in env, not source.
- Never expose internal/sensitive information in the UI or error messages.
- Be deliberate about outward-facing/irreversible actions (e.g. load-testing production
  requires explicit sign-off — see §10).

---

## 10. Performance & Load Profile

### 10.1 Frontend bundle (from `npm run build`)

| Metric | Value |
|---|---|
| Total `dist/` | ~1.8 MB |
| Total JS (uncompressed) | ~1.02 MB |
| Total CSS (uncompressed) | ~106 KB |
| Largest entry chunk | ~210 KB (~65 KB gzip) |
| `motion` (Framer Motion) | ~142 KB (~47 KB gzip) |

Every screen is a separate lazy chunk, prefetched on idle — only entry + vendor +
`motion` load up front.

### 10.2 API load testing (`loadtest/`)

`k6-portal.js` drives the busiest read endpoints. **Never run against production
without explicit sign-off** — it generates sustained concurrent traffic. Thresholds:
`http_req_failed` rate < 1%, `p95 < 800ms` / `p99 < 1500ms`, error rate < 2%.

### 10.3 Client-generated backend load — pagination fan-out amplifiers

Some screens loop through **every page** of a paginated endpoint on load — worth
knowing when sizing the backend:

| Screen | Behaviour |
|---|---|
| Attendees / Bookings | All 4 listing types + **all bookings** (up to 30 pages) |
| Reviews | All 4 listing types + partner reviews (paginated) |
| Followers | Followers list (up to 50 pages) + count |
| Dashboard | 6 parallel calls + follower count |
| (Former) Statistics/Analytics | 4–6 stats calls in parallel + (historically) full booking pagination |

---

## 11. Testing

- **Stack:** Vitest + Testing Library + MSW.
- **Setup:** `src/test/setup.ts` — MSW server lifecycle, jest-dom, clears session/local
  storage per test, stubs `IntersectionObserver`/`ResizeObserver` (needed by
  `motion/react`'s layout/in-view features under jsdom).
- **Fixtures/handlers:** `src/test/msw/handlers.ts` — default handlers + shared
  fixtures for every endpoint domain (listings, stats, etc.).
- **Coverage:** 378 tests across 20 test files, **362 passing**. The 16 currently-failing
  tests are all pre-existing and traced to stale assertions against superseded UI (not
  regressions from any recent work):
  - Cascading State/City `Select` dropdowns replaced free-text `<input placeholder="City">`
    fields — `getByPlaceholderText` no longer matches (affects `CreateEventDetails`,
    `CreateClassIdentity`, `CreateProgramIdentity`).
  - The Followers screen migrated to the newer self-scoped `api/followers.ts` endpoint;
    the test's MSW mocks still target the older `onboarding.ts` shape.
  - Analytics/Enquiries/CreateEventMedia copy changed since the tests were written.
- **Run commands:** see §2.

### 11.1 A note on documentation drift (why this file exists)

While assembling this document, several places where `implementation_graph.md` (last
updated 2026-07-16, Phase 28) had drifted from the actual current codebase were found
and corrected here:

- The `Statistics` screen no longer exists as a separate route/folder — it was merged
  into `Analytics.tsx`.
- `ProgramEnquiries`/`VenueEnquiries` are no longer separate top-level routes — they're
  rendered inline by the new unified `EnquiriesHub` (route `ENQUIRIES`).
- `src/api/followers.ts` and `src/api/banking.ts` are new modules not mentioned there.
- `src/components/TopHeader.tsx`, `src/components/ui/Pagination.tsx`, and
  `src/components/ui/States.tsx` are new files.
- `src/screens/account/` (the `Accounts` hub screen) is new.
- FinancialHub's bank details are now live via `banking.ts` (previously documented as
  fully pending).

`implementation_graph.md` remains the best **narrative history** of *why* things are
built the way they are — this file is the best **current-state snapshot**. When in
doubt about something not covered here, check the actual source; when researching
*why* a pattern exists, check `implementation_graph.md`'s phase changelog (§14 below).

---

## 12. Engineering Standard

The project's permanent engineering standard lives in **`pro_fullstackdeveloper.md`**
(272 lines) and is treated as non-negotiable for every development session, feature,
bug fix, refactor, or review. It's also packaged as an invocable Claude Code skill —
**`.claude/skills/full-stack-developer/`** — with two modes:

- **General dev session** — applies the full standard (architecture, frontend,
  security, performance, testing, code quality, git conventions) and finishes with a
  Self-Review Checklist before presenting any change.
- **Security audit mode** — the checklist used to produce §9 above (token handling,
  console-log leakage, raw `fetch()` bypasses, XSS vectors, route guards, hardcoded
  secrets, third-party calls) — fixes real gaps directly rather than just reporting
  them.

**Prime directive:** this is a production-grade commercial application, never a
prototype — every contribution should read as though built by an experienced team
shipping an enterprise-scale product. Priorities, in order of emphasis: Maintainability
· Scalability · Performance · Security · Readability · Reliability · Reusability ·
Testability · Developer Experience · Long-term project health.

**Non-negotiables worth calling out here:**

- All three of `tsc --noEmit`, `vitest run`, and `vite build` must be green before a
  change is considered done.
- Reuse existing components/hooks/utilities before writing new ones — check
  `components/ui` and `api/*` first.
- No god components/files; respect the layering: **screens** → **components/ui** →
  **api** → **context**.
- Centralize themes/tokens/constants — no magic numbers or ad-hoc colors.
- Keep `implementation_graph.md` updated when structure, routes, or APIs change.
- Commit only when explicitly asked; never stage `.claude/settings*.json`,
  `Development/*.png`, `dist/`, or secrets.

See `pro_fullstackdeveloper.md` directly for the complete, authoritative text (all 17
sections, including the full Self-Review Checklist).

---

## 13. Backend Reference Docs

`docs/*-listings-db-spec.md` are **planning documents prepared for the backend
developer**, dated 2026-05-07 — early proposed schemas for each listing type
(`events`, `classes`, `programs`, `venues`), written before those wizards were fully
API-integrated. They're useful for understanding the *intended* relational shape
(tables, columns, indexes, submission-readiness rules, media constraints) but **should
not be treated as the live API contract** — the actual, current endpoint paths and
payloads are the ones documented in §7 above, derived from the real `src/api/*.ts`
source. Where the two disagree (e.g. proposed `/api/v1/partners/listings/create/` vs.
the actual `/api/v1/partner/listings/events/`), trust §7.

| File | Covers |
|---|---|
| `docs/event-listings-db-spec.md` | `events`, `event_tickets`, `event_media` tables; status lifecycle; submission rules |
| `docs/class-listings-db-spec.md` | `classes`, `class_batches`, `class_media`, `class_faqs` tables |
| `docs/program-listings-db-spec.md` | `programs`, `program_batches`, `program_media`, `program_faqs` tables |
| `docs/venue-listings-db-spec.md` | `venues`, `venue_occasions`, `venue_availability`, `venue_packages`, `venue_media` tables |

---

## 14. Project History (Phase Changelog)

The full, detailed phase-by-phase changelog (Phases 17 through 28, covering every bug
fix, redesign, and API migration with root causes) lives in **`implementation_graph.md`
§12 and its dated phase notes** — it's too long to usefully duplicate here, but the
highlights, newest first:

- **Phase 28 (2026-07-16)** — Venue amenities catalog + picker, cascading State/City
  dropdowns (28 states + 8 UTs) across all 4 wizards, Help & Support "Shared Queries"
  tab (three-party chat), Revenue & Reviews stats tabs, Dashboard cleanup.
- **Phase 27 (2026-07-01)** — New Followers & Analytics screens, structured
  City/District/State/Pincode address fields, black/white/yellow theme unification,
  skeleton loaders, k6 load-test harness, a pause/resume state-derivation bug fix.
- **Phase 26 (2026-06-30)** — Split Attendees/Bookings via a shared `variant` prop,
  Reviews/Documents/Messages screens, Venue Enquiries CRM, Dashboard header popups
  (later re-inlined, then re-popup'd again this session — see below), interactive
  listing cards.
- **Phase 25 (2026-06-12)** — `AppListingPreview` phone-frame preview shared by all 4
  wizards; `BookingsCalendar` Dashboard popup.
- **Phase 24 (2026-06-10)** — FAQ/Terms editor for Events & Venues; Partner Network;
  a top-level `ScreenErrorBoundary`.
- **Phase 23 (2026-06-08)** — In-app notifications; venue `booking_type`; listing
  view-density controls.
- **Phase 22 (2026-06-05)** — Coupons API went live; Help & Support went live;
  Attendees/Bookings aligned to the real bookings API contract.
- **Phase 21 (2026-06-04)** — Global toast system replacing every `alert()`; Coupons
  UI; the reusable portal-rendered `Select`; Attendees two-level redesign.
- **Phase 20 (2026-05-31)** — A bug-fix sweep (sidebar overlay leak, unreadable OTP
  text, blank-screen flash on navigation, photo-upload error swallowing) + Enquiry
  management redesign + a global typography scale.
- **Phase 19 (2026-05-30)** — Statistics screen rebuilt as a tabbed, interactive
  analytics screen (later merged into Analytics — see §11.1).
- **Phase 18 (2026-05-29)** — Full marketing + onboarding visual overhaul (Landing,
  Login, all 10 onboarding screens) on a shared `OnboardingShell`; new `stats.ts` API
  module.
- **Phase 17 (2026-05-28)** — Login/onboarding flow separation (the status-gate logic
  described in §5.4).

### This session's work (beyond what `implementation_graph.md` captures)

Not yet folded into the phase changelog above, but live in the current codebase:

- **Dashboard header redesign** — the Analytics button, Latest Listings, and Bookings
  Calendar were moved out of `TopHeader`/inline Dashboard widgets into two compact
  popup-triggered header buttons (Sparkles + Calendar icons), removing the old
  Analytics shortcut entirely (sidebar navigation covers it).
  Fixed a bug where the header's account popup showed `[object Object]` for the
  follower count instead of the number.
- **Venue amenities catalog overhaul** — remapped every group and per-amenity icon for
  the expanded 11-group/58-amenity catalog (new icon keys like `locker`,
  `paid-parking`, `dj`, `braille-elevator`, etc.), with a generic icon fallback and
  graceful handling of amenities retired from the catalog but still attached to
  existing venues (shown in a "Previously Added" section, still removable).
- **Venue FAQ documents** — per-FAQ document attachments (price lists, floor plans,
  etc.), built generically (parameterized by entity) so Events/Programs can be enabled
  with one line once the backend ships the same sub-resource for them.
- **My Listings ("ServiceListings") additions** — a "Latest Active Listing" highlight
  card, a "History" card with a full-list popup, and a page-size selector added to the
  shared `Pagination` component.
- **Bookings & Enquiries redesign** — the flat toggle-based landing view became a
  6-tab bar (Overview / By Listing / By Date / Directory / Bookings / Enquiries), with
  3 new flat, searchable, paginated tables built from data already being fetched (no
  new API calls). Fixed a status/payment badge visual bug where multi-word values
  (e.g. "AWAITING PAYMENT") wrapped onto two lines inside the pill, looking like two
  separate badges.
- **Booking detail drawer redesign** — slide-in entrance animation, an entity-colored
  gradient hero for status/amount, per-section white cards with colored icon badges,
  an initial-avatar for the customer, and a connected-timeline layout for payment
  activity.
- **Help & Support hero redesign** — replaced a bold black gradient banner with a
  plain white card matching the rest of the screen.
- **Full security audit** — see §9.
- **This documentation file and the `full-stack-developer` skill** — both new.

---

## 15. Known Gaps & Pending Work

| Area | Status |
|---|---|
| `Packages` screen | UI placeholder only — no backend API exists for it |
| `FinancialHub` transaction history & Earned/Commission/Pending stat cards | Show `—`/empty state — awaiting a dedicated financial transactions endpoint (bank details themselves are live via `banking.ts`) |
| `setClassListingLive`, `archiveProgramListing`, `unarchiveProgramListing` | Defined and tested in `listings.ts` but not called from the UI — the generic pause/resume/archive/unarchive endpoints are used for all entity types instead |
| `cancelBooking` | Defined and tested but never wired into the UI — partners get a 403 from this endpoint; only customers can cancel |
| Per-FAQ document attachments for Events/Programs | API client function is entity-parameterized and ready; UI is only enabled for Venues pending backend confirmation those routes exist for the other two entity types |
| Route guard coverage | `requiresEntities` is now wired for the entity-specific creation wizards + Enquiries; screens like Analytics/Reviews/Followers/Coupons remain deliberately ungated since they aren't meaningfully entity-restricted |
| `implementation_graph.md` | Should be updated to fold in "This session's work" (§14 above) per the project's own git/documentation convention |
| `Development/implementation_graph.md` | An early, superseded (2026-05-08) snapshot — safe to treat as historical only, not authoritative |

---

## 16. Source Documents Index

| Document | Role |
|---|---|
| `CLAUDE.md` | Fast orientation — commands, architecture rules, screen/module map |
| `pro_fullstackdeveloper.md` | The permanent engineering standard (§12) |
| `implementation_graph.md` | The living architecture reference + detailed phase-by-phase changelog (§14) |
| `Development/implementation_graph.md` | ⚠️ Superseded early snapshot — historical only |
| `docs/*-listings-db-spec.md` | Backend planning specs, historical (§13) |
| `loadtest/README.md` | Performance profile + k6 load-test instructions (§10) |
| `.claude/skills/full-stack-developer/SKILL.md` | The engineering standard, packaged as an invocable skill (§12) |
| **`PROJECT_DOCUMENTATION.md` (this file)** | The single consolidated, current-state reference |
