# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server on port 3000 (0.0.0.0)
npm run build     # Production build via Vite
npm run lint      # Type-check only (tsc --noEmit), no test runner configured
npm run preview   # Serve the production build locally
```

## Architecture

### Navigation (no router library)
Navigation is entirely custom. `src/types.ts` defines a `Screen` union type listing every possible screen name. `App.tsx` holds a `routes` record mapping each `Screen` to a lazy-loaded component and metadata (`hasSidebar`, optional `requiresEntities`). The active screen is a single `useState<Screen>` inside `AppInner`. All screens receive an `onNavigate` prop — call it to change screens. Never use `window.location` or browser history.

Route guards live in `guardedNavigate` (`App.tsx:157`): if the target screen has `requiresEntities`, it checks against `allowedEntities` from `PartnerContext` and falls back to `HOME` on mismatch.

### Global State — PartnerContext
`src/context/PartnerContext.tsx` is the only React context. It holds `allowedEntities: EntityType[]` (the four types a partner can offer: `'Events' | 'Classes' | 'Programs' | 'Venues'`), persisted to `sessionStorage`. This drives both sidebar visibility and route guards. Auth tokens (JWT access + refresh) are stored in `localStorage` and managed entirely in `src/api/client.ts`.

### API Layer
- `src/api/client.ts` — central `apiClient` fetch wrapper. Base URL is `https://tlb-api.reluconsultancy.in`. Automatically retries a 401 response by refreshing the token and replaying the original request. Always use this; never call `fetch` directly.
- `src/api/auth.ts` — OTP request/verify, `getCurrentUser`, `logout`.
- `src/api/onboarding.ts` — partner profile, media upload/delete, categories, dashboard, extended profile, verification.

### Listing Creation Flows (Wizards)
Each entity type has a multi-step creation flow. All wizard screens share two reusable components:
- `src/components/ui/WizardLayout.tsx` — sticky header with back button, step label, and a themed progress bar. Accepts a `ThemeColor` prop (`'purple' | 'blue' | 'yellow' | 'emerald' | 'amber'`).
- `src/components/ui/WizardNavigation.tsx` — bottom continue/back buttons.

Flow screen naming convention: `CREATE_<ENTITY>_<STEP>` (e.g. `CREATE_EVENT_DETAILS`, `CREATE_EVENT_SCHEDULE`). Theme colors by entity: Classes → `purple`, Events → `blue`, Programs → `emerald`, Venues → `amber`.

### Styling
Tailwind v4 (via `@tailwindcss/vite`). Custom design tokens are in `src/styles/theme.css`:
- `tlb-yellow` = `#FACC15`
- `tlb-dark` = `#141414`

Reusable component classes (in `src/styles/components.css`):
- `.tlb-button` — primary yellow CTA button
- `.tlb-card` — white rounded card with subtle shadow
- `.tlb-input` — standard form input with yellow focus ring
- `.tlb-content` — full-width content wrapper inside wizard main

### Screens & Modules
```
src/screens/
  auth/          Landing, Login, OTPVerify, PartnerAccess, PartnerCategory
  onboarding/    Registration → AppSubmitted → AppApproved → AgreementSubmit
                 → IdentityVerification → BankSetup → OnboardingComplete
  dashboard/     Home (Dashboard)
  services/      ServiceListings + 5-step class creation wizard
  events/        4-step event creation wizard
  programs/      5-step program creation wizard
  venues/        5-step venue creation wizard
  profile/       BrandProfile, EditProfile, PreviewProfile
  enquiries/     Enquiries (Classes CRM), ProgramEnquiries
  attendees/     Attendees
  financial/     FinancialHub
  packages/      Packages
```

Each screen folder exports named components via its `index.ts`; `App.tsx` imports them all through the barrel files.

### Key Data
`src/data/mockData.ts` — fallback mock listings used when the API has no data. `src/data/eventCategories.ts` and `src/data/venueCategories.tsx` — static category/subcategory trees for forms.
