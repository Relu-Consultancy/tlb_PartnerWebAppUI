# Load testing — TLB Partner Portal

The portal is a client-side SPA; its only backend is the shared API
(`https://tlb-api.reluconsultancy.in`) and every real endpoint needs a JWT.
So "system load testing" splits into two parts:

## 1. Frontend load profile (no network)

Measured from the production build (`npm run build`):

| Metric | Value |
| --- | --- |
| Total `dist/` | ~1.8 MB |
| Total JS (uncompressed) | ~1.02 MB |
| Total CSS (uncompressed) | ~106 KB |
| Largest entry chunk | `index-*.js` ~210 KB (~65 KB gzip) |
| `motion` (framer-motion) | ~142 KB (~47 KB gzip) |
| Route chunks | code-split & lazy-loaded per screen (see `App.tsx`) |

Only the entry + vendor + `motion` load up front; every screen is a separate
lazy chunk, prefetched on idle. This keeps first-load light.

## 2. API load test (k6) — requires authorization

`k6-portal.js` drives the read-heavy endpoints the busiest screens call.

> ⚠️ **Do not run against production without explicit sign-off.** It generates
> sustained concurrent traffic and can trip rate limits / affect real users /
> incur cost. Prefer a staging environment.

### Install k6
- macOS: `brew install k6`
- Windows: `winget install k6 --source winget` (or `choco install k6`)
- Linux: see https://grafana.com/docs/k6/latest/set-up/install-k6/

### Run
```bash
k6 run \
  -e BASE_URL=https://<staging-api-host> \
  -e TOKEN=<partner-jwt-access-token> \
  -e VUS=20 -e DURATION=1m \
  loadtest/k6-portal.js
```

Get a `TOKEN` by logging into the portal and copying the `access` token from
`localStorage` (key managed in `src/api/client.ts`).

### Thresholds (pass/fail)
- `http_req_failed rate < 1%`
- `http_req_duration p95 < 800ms`, `p99 < 1500ms`
- `portal_errors rate < 2%` (non-2xx responses)

### What each iteration simulates
| Group | Endpoints | Mirrors |
| --- | --- | --- |
| `dashboard` | me, dashboard, stats/overview, profile, extended-profile, media | Dashboard first paint (6 parallel) |
| `statistics` | stats overview/events/venues/enquiries | Statistics + Analytics |
| `listings` | events/classes/programs/venues listings | My Listings, Reviews, Latest |
| `bookings` | bookings?page=1 | Bookings / Attendees |

## Client-generated backend load (worth knowing)

Some screens fan out heavily on the client — relevant when sizing the backend:

| Screen | Behaviour |
| --- | --- |
| Statistics | 4 stats calls + **paginates ALL bookings** (up to 30 pages) + venue enquiries |
| Attendees / Bookings | all 4 listing types + **all bookings** (up to 30 pages) |
| Reviews | all 4 listing types + partner reviews (paginated) |
| Followers | followers list (up to 50 pages) + count |
| Dashboard | 6 parallel calls + follower count |

These pagination loops are the main amplifiers of per-user backend load.
