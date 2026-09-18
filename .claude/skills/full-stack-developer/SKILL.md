---
name: full-stack-developer
description: Applies the TLB Partner Portal's permanent engineering standard (pro_fullstackdeveloper.md) — architecture, frontend, security, performance, testing, and self-review checklist. Use before any development session, feature, bug fix, refactor, or code review in this repo. Also supports a focused security-audit mode (API-call safety, sensitive-data exposure, token/auth handling, guard rails) when a security pass is explicitly requested.
---

# Full-Stack Developer — TLB Partner Portal Engineering Standard

This skill packages the repo's existing engineering standard
(`pro_fullstackdeveloper.md`, repo root) into an invocable form instead of a document
that has to be manually "loaded and followed" each time. It does not invent new
philosophy — it operationalizes what's already written there.

## Instructions

### Step 1 — Load the standard

Read `pro_fullstackdeveloper.md` at the repo root **in full** before proceeding. It is
the canonical, versioned engineering standard for this codebase (sections 0–17: Prime
Directive, Project Context, Architecture/Frontend/Backend/Database/Security/Performance/
Code Quality/Error Handling/Testing/Reusability/Dependency/Git standards, Development
Workflow, Self-Review Checklist, Expected Quality Bar). Don't summarize from memory —
the file may have changed since this skill was written. Also skim `CLAUDE.md`
(architecture rules) and `implementation_graph.md` (definitive architecture/API
reference) for anything relevant to the current task.

### Step 2 — Pick a mode

- **General dev session** (feature / bug fix / refactor / review): apply the full
  standard end to end. Follow the Development Workflow (§15) and finish with the
  Self-Review Checklist (§16) before presenting the change.
- **Security audit** (explicitly requested — "check for security issues", "make API
  calls safe", "no sensitive data exposed", etc.): go to Step 3.

### Step 3 — Security audit mode

Work through §7 (Security Standards) as a concrete checklist, scoped to the reality that
this repo is a **frontend-only SPA** talking to an external API
(`https://tlb-api.reluconsultancy.in`):

1. **Token handling.** Every token read/write must go through `src/api/client.ts` only
   (`getAuthToken` / `setAuthToken` / `getRefreshToken` / `setRefreshToken`). Grep the
   rest of `src/` for direct `localStorage`/`sessionStorage` access to
   `access_token`/`refresh_token` — flag and fix any bypass.
2. **No sensitive-data leakage.** Grep for `console.log`/`console.error`/`console.warn`
   that could echo tokens, full API response bodies, PII, or payment details. Check that
   toast/error messages surface a clean, user-facing string — never a raw backend error
   body, stack trace, or internal ID.
3. **API call safety.** Every network call goes through `apiClient` — never a raw
   `fetch(...)` to the API host. Confirm the base URL and auth headers aren't duplicated
   or hardcoded elsewhere, and that authenticated screens don't fire requests before auth
   state has resolved.
4. **XSS / injection.** Grep for `dangerouslySetInnerHTML`, `eval(`, `new Function(`, or
   any template-injected HTML. User- or partner-generated content must render as text,
   never raw HTML, unless explicitly sanitized.
5. **AuthZ / route guards.** Confirm `requiresEntities` / partner-status gating in
   `App.tsx`'s `guardedNavigate` can't be bypassed, and that no screen assumes a role or
   entity access the signed-in partner might not actually have.
6. **Secrets.** No API keys, tokens, or credentials hardcoded in source, committed to
   git, or exposed via client-bundled env vars that shouldn't be public.
7. **Third-party / external calls.** Flag any outward call (analytics, webhooks,
   external CDNs, tracking pixels) that could leak partner or customer data to an
   uncontrolled destination.
8. **Fix, don't just report.** For every real gap, add the guard (input validation,
   safe fallback, redacted logging, response-shape check, escaping) directly, unless the
   fix requires a backend change — in that case, state plainly what the backend must
   change and why the frontend alone can't close the gap.

Report findings like a code review: file/line, the concrete risk (what data could leak,
or what a malicious input could do), and the fix applied or recommended. Don't invent
severity theater for non-issues — a frontend SPA has a narrower attack surface than a
backend, so keep findings grounded in what's actually reachable from the browser.

### Step 4 — Close out

Before presenting any change (either mode), run the Self-Review Checklist (§16)
explicitly. At minimum: `npx tsc --noEmit`, `npx vitest run`, `npx vite build` must all
be green, and the behavior should be spot-checked against the real flow where feasible.
