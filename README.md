# TLB Partner Portal

The partner-facing web app for **The Little Broadway** — lets event, venue, class, and
program partners onboard, manage their listings, track bookings/enquiries, and handle
payouts.

## Tech stack

- **React 19** + **TypeScript** + **Vite 6**
- **Tailwind CSS v4** for styling
- **Vitest** + **React Testing Library** + **MSW** for testing
- Custom in-app navigation (no router library — see [Architecture](#architecture))

## Getting started

```bash
npm install
npm run dev       # http://localhost:8000
```

The app talks to a live backend API (`https://tlb-api.reluconsultancy.in`) — there is no
local/mock server for the dev build itself; MSW is used only inside the test suite.

## Scripts

| Command              | Description                                          |
| --------------------- | ----------------------------------------------------- |
| `npm run dev`         | Start the Vite dev server on port 8000                |
| `npm run build`       | Production build (output in `dist/`)                  |
| `npm run preview`     | Serve the production build locally                    |
| `npm run typecheck`   | Type-check the project (`tsc --noEmit`)                |
| `npm run lint`        | Lint with ESLint                                       |
| `npm run lint:fix`    | Lint and auto-fix what's fixable                       |
| `npm run format`      | Format the codebase with Prettier                      |
| `npm run format:check`| Check formatting without writing                       |
| `npm test`            | Run the test suite once                                |
| `npm run test:watch`  | Run tests in watch mode                                |
| `npm run test:ui`     | Run tests with the Vitest UI                            |

A pre-commit hook (Husky + lint-staged) runs ESLint and Prettier on staged files
automatically.

## Architecture

- **Navigation** is entirely custom — there is no router library. `src/types.ts` defines
  a `Screen` union of every screen name; `App.tsx` maps each `Screen` to a lazy-loaded
  component. Screens receive an `onNavigate` callback to change screens.
- **`src/context/PartnerContext.tsx`** is the app's only React context. It holds which
  entity types (`Events | Classes | Programs | Venues`) the signed-in partner is allowed
  to offer, and drives both sidebar visibility and route guards.
- **`src/api/client.ts`** is the single fetch wrapper for every network call — it owns
  token storage and automatically retries a `401` by refreshing the access token and
  replaying the original request. Feature-specific API modules (`src/api/listings.ts`,
  `src/api/onboarding.ts`, `src/api/auth.ts`, …) build on top of it and normalize backend
  errors into a small `ApiError`/`AuthApiError` type instead of leaking raw response
  bodies to the UI.
- **Listing creation** (Events, Venues, Classes, Programs) are each a multi-step wizard
  built from shared components in `src/components/portal/wizard/` (`WizardShell`,
  `WizardNav`, `WizardField`, …). Every step persists to a backend draft as the user
  progresses, and supports "Save as draft & exit" so partial progress is never lost.
- **Styling** uses Tailwind v4 with design tokens in `src/styles/theme.css` and shared
  component classes in `src/styles/components.css`.

## Testing

Run the full suite with `npm test`. Screens and API modules are tested against a mocked
backend (MSW) rather than the live API. See `src/test/msw/handlers.ts` for the default
mock responses.

Load testing lives in `loadtest/` (k6).

## Deployment

The app builds to static files and is served via Nginx — see `Dockerfile`,
`docker-compose.yml`, and `nginx.conf`.
