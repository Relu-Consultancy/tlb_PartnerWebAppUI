/*
 * TLB Partner Portal — API load test (k6)
 * ---------------------------------------------------------------------------
 * Exercises the read-heavy endpoints the portal calls on its busiest screens
 * (Dashboard, Statistics, Analytics, Listings, Bookings) under concurrent load.
 *
 * USAGE (never point this at production without sign-off):
 *   k6 run -e BASE_URL=https://staging-api... -e TOKEN=<jwt> loadtest/k6-portal.js
 *
 * Tunables (all via -e):
 *   BASE_URL   API base                (default: the prod base — override for staging!)
 *   TOKEN      Bearer JWT access token  (required for authed endpoints)
 *   VUS        peak virtual users       (default 20)
 *   DURATION   steady-state duration    (default 1m)
 *
 * Profile: ramp 0→VUS over 30s, hold VUS for DURATION, ramp down over 20s.
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'https://tlb-api.reluconsultancy.in';
const TOKEN = __ENV.TOKEN || '';
const VUS = Number(__ENV.VUS || 20);
const DURATION = __ENV.DURATION || '1m';

const errorRate = new Rate('portal_errors');
const screenLatency = new Trend('portal_screen_latency', true);

export const options = {
    scenarios: {
        portal: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: VUS },
                { duration: DURATION, target: VUS },
                { duration: '20s', target: 0 },
            ],
            gracefulRampDown: '10s',
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],          // <1% transport failures
        http_req_duration: ['p(95)<800', 'p(99)<1500'],
        portal_errors: ['rate<0.02'],            // <2% non-2xx responses
    },
};

const authHeaders = () => ({
    headers: {
        Authorization: TOKEN ? `Bearer ${TOKEN}` : '',
        'Content-Type': 'application/json',
    },
    tags: {},
});

// Fetch a batch of endpoints (a "screen"), record aggregate latency + errors.
function screen(name, paths) {
    group(name, () => {
        const t0 = Date.now();
        const reqs = paths.map((p) => ({ method: 'GET', url: `${BASE_URL}${p}`, params: { ...authHeaders(), tags: { screen: name } } }));
        const responses = http.batch(reqs);
        responses.forEach((res) => {
            const ok = check(res, { 'status is 2xx': (r) => r.status >= 200 && r.status < 300 });
            errorRate.add(!ok);
        });
        screenLatency.add(Date.now() - t0, { screen: name });
    });
}

export default function () {
    // Dashboard — 6 parallel calls on load
    screen('dashboard', [
        '/api/v1/partner/me/',
        '/api/v1/partner/dashboard/',
        '/api/v1/partner/stats/overview/',
        '/api/v1/partner/profile/',
        '/api/v1/partner/extended-profile/',
        '/api/v1/partner/media/',
    ]);
    sleep(1);

    // Statistics / Analytics — stats fan-out
    screen('statistics', [
        '/api/v1/partner/stats/overview/',
        '/api/v1/partner/stats/events/',
        '/api/v1/partner/stats/venues/',
        '/api/v1/partner/stats/enquiries/',
    ]);
    sleep(1);

    // Listings catalog — all four entity types
    screen('listings', [
        '/api/v1/partner/listings/events/',
        '/api/v1/partner/listings/classes/',
        '/api/v1/partner/listings/programs/',
        '/api/v1/partner/listings/venues/',
    ]);
    sleep(1);

    // Bookings — first page (the app paginates the rest)
    screen('bookings', ['/api/v1/partner/bookings/?page=1']);
    sleep(2);
}
