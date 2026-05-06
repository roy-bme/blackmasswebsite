# Repository audit — 2026-05-06

## What this repository is about

This is a dual-surface Next.js 14 monorepo:
- **Public marketing website** for Blackmass (`/`, `/about`, `/contact`, `/press`).
- **Private operations portal** (“Indaba”) served from the same deployment via hostname routing, with authenticated modules for map/directory/intros/events/feed/compliance workflows. See `middleware.ts`, `app/(marketing)/**`, and `app/indaba/**`.

Data/auth are backed by **Supabase**; mutations are routed through server handlers under `app/api/ops/**` and guarded by shared authz/csrf/rate-limit logic in `lib/server/ops-handler.ts`.

## Recent commit history signals (last ~2 months)

From `git log --oneline -n 20`, recent work is concentrated on:
1. **Map UX + role access fixes** (BD role map access, adding businesses, pin/group behavior).
2. **Hardening + route audits** (authorization and onboarding state handling).
3. **Workflow reliability** improvements (intro status update, placeholder wiring).

Overall trend: the product is currently in active **ops tool stabilization**, especially map + role permissions.

## Architecture snapshot

### Strengths
- **Host-based traffic segmentation** with portal cloaked on non-indaba hosts (404) and noindex behavior for private surface.
- **Security-focused middleware path** including CSP nonce handling.
- **Centralized write-guard helper** (`withOpsWrite`) that consistently enforces same-origin, rate limit, authn/authz, and typed JSON responses.
- **Committed DB migrations** for RLS and operational table evolution, which is good for repeatable environments.
- **Living security changelog** (`CHANGES.md`) that documents threat model and remediations clearly.

### Risks / weak points observed
1. **Test script/runtime mismatch**
   - `npm test` currently fails in this environment due to `node --experimental-strip-types` flag support mismatch.
   - This indicates tests are more fragile than necessary across Node patch/minor variance.

2. **Manual-security steps still required in production**
   - README lists several security-critical dashboard toggles (bucket privacy, JWT expiry, GH scanning settings, env vars).
   - These can drift between environments and are not automatically verifiable.

3. **Potential confusion around route rewriting model**
   - Middleware rewrites indaba-host root paths to `/indaba/*` while also blocking `/indaba/*` on marketing hosts.
   - Functional, but this is subtle and prone to regressions when future routes are added unless heavily tested.

4. **Rate limiting degrades open when Upstash env vars absent**
   - Acceptable in local dev, but risky if a staging/prod-like environment is misconfigured.

5. **No visible CI contract in-repo for full gate**
   - Lint/typecheck/test/audit scripts exist, but baseline expectations and required versions are not yet strongly enforced in automation documentation.

## Suggested improvements and fixes (prioritized)

## P0 (do first)
1. **Make tests Node-version resilient**
   - Replace `--experimental-strip-types` dependency with a stable test transpile path (e.g., `tsx --test` or precompiled tests via `tsc` + node test runner).
   - Add a short compatibility matrix in README/CI for Node 20.x exact tested versions.

2. **Fail-closed rate-limit mode outside local dev**
   - In `lib/ratelimit`, keep dev fallback open, but fail closed (or loudly fail startup) when `NODE_ENV=production` and Upstash env vars are missing.

3. **Add an executable post-deploy security check script**
   - Script should validate: health token enforcement, host allowlist behavior, expected headers, and signed URL flow assumptions.

## P1
4. **Add middleware behavior tests**
   - Cover combinations of host/path/auth state to prevent accidental exposure or broken rewrites during refactors.

5. **Standardize API error envelope**
   - Some handlers return generic `db_error`; introduce structured internal error codes + correlation IDs for easier debugging without leaking internals.

6. **Add OpenAPI-lite or route contract docs for `/api/ops/*`**
   - Even a generated markdown schema improves onboarding and reduces client/server drift.

## P2
7. **Observability hardening**
   - Add request IDs and structured logs for write endpoints and auth callback flows.

8. **Configuration drift prevention**
   - Add a startup/admin diagnostics endpoint (auth-protected) to confirm mandatory env + deployment invariants.

9. **Repository hygiene**
   - Evaluate whether `INDABA refresh..zip` should remain tracked; large archive artifacts can slow clones and complicate reviews.

## Quick wins you can implement this week

- Update `test` script to a stable TS test path and ensure it passes in CI.
- Add one middleware test file for host/path rewrite + access-control matrix.
- Add production env assertion for Upstash keys.
- Add `npm run verify:security` script that checks health endpoint token enforcement + expected headers.

## Bottom line

The repo is clearly an actively maintained, security-conscious **marketing + internal ops platform**. The main improvements now are less about feature correctness and more about **operational robustness**: deterministic tests, fail-closed production config, and automated verification of the security posture that is currently partly manual.
