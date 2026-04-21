# Security hardening — 2026-04

One-line summary of every finding addressed, the primary files touched, and
how the fix works.

## Critical

- **F-1 — Next.js CVE-2025-29927 middleware bypass**
  - `package.json`, `package-lock.json`, `.github/workflows/audit.yml`,
    `.audit-waivers.json`, `scripts/audit-check.mjs`
  - Bumped Next from 14.2.15 → 14.2.35. Five remaining advisories affecting
    the `next` 9.5.0–15.5.14 range (no 14.x patch available) are documented
    with justification in `.audit-waivers.json`; `scripts/audit-check.mjs`
    fails the audit CI job only on un-waived high/critical advisories.

- **F-2 — Server-side authorization + committed RLS**
  - `supabase/migrations/20260421090000_rls_policies.sql`,
    `supabase/migrations/20260421090500_attachments_defaults.sql`,
    `app/api/ops/**/route.ts`, `lib/server/ops-handler.ts`,
    `lib/ops/api-client.ts`, every Dialog / Tab / Form under
    `components/ops/**`
  - RLS enabled on every portal table with explicit SELECT / INSERT /
    UPDATE / DELETE policies per role and `WITH CHECK` on writes that
    pin attribution columns (`user_id`, `introduced_by`, `mapped_by`,
    `created_by`, `collected_by`, `submitted_by`) to `auth.uid()`. Every
    client-side `supabase.from(...).insert|update|delete` was replaced
    with a POST to `/api/ops/<resource>/<verb>` that re-checks auth and
    role via `loadOpsProfile`, then writes with the service-role key.
    `public.users` role / active / revoked_at mutation is blocked by a
    BEFORE UPDATE trigger; `introductions.roy_approved` is admin-only;
    `businesses.onboarding_stage` is admin + state-machine constrained.

## High

- **F-3 — Attachment URL validation**
  - `lib/ops/attachments.ts`, `components/ops/Feed/SignedAttachment.tsx`,
    `components/ops/Feed/FeedItem.tsx`,
    `components/ops/Feed/ThreadReplies.tsx`,
    `components/ops/Directory/tabs/OverviewTab.tsx`,
    `app/api/ops/activities/create/route.ts`,
    `supabase/migrations/20260421090300_activities_attachments_check.sql`
  - DB CHECK constraint requires every attachment path/URL to start with
    the Supabase storage prefix. Server filters on insert. Client renders
    via a signed-URL component that validates before building `<img>` /
    `<a>` and shows an "invalid" placeholder otherwise.

- **F-4 — Private photos bucket + signed URLs**
  - `supabase/migrations/20260421090100_storage_policies.sql`,
    `app/api/ops/activities/upload/route.ts`,
    `app/api/ops/activities/signed-url/route.ts`,
    `app/api/ops/businesses/photo/route.ts`,
    `components/ops/Feed/SignedAttachment.tsx`
  - Bucket becomes private (manual dashboard flip, see README). RLS on
    storage.objects: authenticated SELECT only; INSERT limited to the
    user's own folder with a 255-byte name cap; UPDATE denied. All uploads
    go through server Route Handlers that enforce MIME allowlist (JPEG /
    PNG / WebP only — SVG refused) and a 10 MB size cap. Signed URLs
    (300s TTL) are minted server-side and never cached in the DB.

- **F-5 — Security headers + CSP nonce**
  - `next.config.mjs`, `middleware.ts`, `app/(marketing)/layout.tsx`
  - HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
    Permissions-Policy, and a full CSP are emitted globally. Middleware
    generates a per-request nonce and substitutes the
    `NONCE_PLACEHOLDER` token in the CSP header; `<Script>` tags receive
    the same nonce via `headers().get('x-nonce')`.

- **F-6 — CSV formula-injection sanitiser**
  - `components/ops/Zitf/csv.ts`, `components/ops/Zitf/csv-escape.ts`,
    `components/ops/Zitf/__tests__/csv.test.ts`
  - `escapeCell` now prefixes any cell beginning with `=`, `+`, `-`, `@`,
    TAB, or CR with a single quote before RFC 4180 quoting. Covered by
    seven unit tests (=HYPERLINK, +cmd, -2+3, @SUM, TAB/CR, RFC 4180,
    ordinary-string passthrough).

- **F-7 — Constant-time, rate-limited sign-in**
  - `app/api/auth/signin/route.ts`, `app/indaba/(auth)/login/LoginForm.tsx`
  - `signInWithOtp` now runs in a Route Handler that rate-limits 5/15m
    per IP and 10/h per email via Upstash, always sleeps to a 600 ms
    floor, and always returns the generic "If your email is registered,
    a link is on its way." response. The browser client never sees
    provider error messages.

- **F-8 — Opaque auth error tokens**
  - `lib/ops/auth-error.ts`, `app/indaba/(auth)/auth/callback/route.ts`,
    `app/indaba/(auth)/auth/auth-error/page.tsx`
  - Callback maps every Supabase failure (and the new profile-lookup /
    disabled-account paths) to one of six opaque tokens. The error page
    re-validates the token against the allowlist; unknown tokens
    degrade to "unknown" copy.

## Medium

- **F-9 — Flash message whitelist**
  - `lib/ops/flash.ts`, `app/indaba/(ops)/dashboard/page.tsx`,
    `app/indaba/(ops)/zitf/page.tsx`,
    `app/indaba/(ops)/zitf/new-paper/page.tsx`,
    `lib/ops/auth.ts`,
    `components/ops/Zitf/PaperResponseForm.tsx`
  - Pages only accept keys from `FLASH_MESSAGES`; `decodeURIComponent` is
    wrapped in try/catch. Every redirect that used to encode free text
    (`?flash=Saved%20…`) now passes a key (`?flash=paper_saved`).

- **F-10 — Hostname allowlist**
  - `lib/ops/host-allowlist.ts`, `middleware.ts`, `app/robots.ts`,
    `app/sitemap.ts`
  - Replaced `startsWith("indaba.")` with an allowlist of exact hosts
    plus the `indaba-*.vercel.app` preview regex. Unknown hosts are
    logged with `console.warn` so Vercel logs flag probing attempts.

- **F-11 — Nominatim proxy + referrer policy**
  - `app/api/ops/reverse-geocode/route.ts`,
    `lib/ops/reverse-geocode.ts`, `next.config.mjs`
  - Browser never calls Nominatim directly; the proxy enforces auth,
    rate-limits (30/min via Upstash), sets the policy-compliant
    User-Agent, and caches responses. `Referrer-Policy: no-referrer`
    applied to every `/indaba/*` route via a route-specific `headers()`
    block in `next.config.mjs`. Basemap provider swap is tracked as
    follow-up (documented in README).

- **F-12 — Same-origin check on every state-changing endpoint**
  - `lib/ops/csrf.ts`, `lib/server/ops-handler.ts`,
    `app/indaba/(auth)/auth/signout/route.ts`,
    `app/api/auth/signin/route.ts`,
    `app/api/ops/reverse-geocode/route.ts`
  - `assertSameOrigin(request)` is the first line of every POST-backed
    Route Handler. Accepts either `Sec-Fetch-Site: same-origin` or an
    `Origin` header whose hostname is in the indaba allowlist.

- **F-13 — Role lookup + revoked_at column**
  - `supabase/migrations/20260421090200_revoked_at_column.sql`,
    `supabase/migrations/20260421090400_users_role_lockdown.sql`,
    `lib/ops/auth.ts`
  - New `public.users.revoked_at` column; `loadOpsProfile` refuses
    revoked users. Trigger blocks non-service-role writes to role /
    active / revoked_at. Supabase JWT expiry → 3600s is a manual
    dashboard change (see README).

- **F-14 — Strict `next` param validation**
  - `lib/ops/next-param.ts`, `app/indaba/(auth)/login/page.tsx`,
    `app/indaba/(auth)/login/LoginForm.tsx`,
    `app/indaba/(auth)/auth/callback/route.ts`,
    `app/api/auth/signin/route.ts`
  - `safeNext()` enforces NEXT_RE, forbids `\`, `@`, `%2f%2f`, `//`,
    and caps to an allowlist of first-path-segments (dashboard,
    directory, map, graph, intros, events, feed, zitf, settings).
    Applied identically in login-page parsing, the sign-in handler's
    callback URL, and the callback route's redirect target.

- **F-15 — Edge rate-limiting**
  - `lib/ratelimit/index.ts`, `app/api/auth/signin/route.ts`,
    `app/indaba/(auth)/auth/callback/route.ts`,
    `app/indaba/(auth)/auth/signout/route.ts`,
    `lib/server/ops-handler.ts`, `app/api/ops/health/route.ts`,
    `app/api/ops/reverse-geocode/route.ts`
  - Upstash Redis-backed sliding-window limiters for signin/IP,
    signin/email, auth-callback, signout, ops-API global, health, and
    geocode. Absent env vars degrades to allow-all (dev). Health
    endpoint additionally requires `X-Health-Token: $HEALTH_CHECK_TOKEN`.

## Low

- **F-16 — Escape `</script>` in JSON-LD**
  - `app/(marketing)/layout.tsx`
  - `JSON.stringify(...).replace(/</g, "\\u003c")`; rendered via
    `dangerouslySetInnerHTML` with a nonce. A future injection into the
    schema object can no longer close our `<script>` tag.

- **F-17 — `emailRedirectTo` uses safeNext**
  - `app/api/auth/signin/route.ts`
  - The callback URL handed to `signInWithOtp({ emailRedirectTo })` is
    built from `safeNext(body.next)` so a crafted `next=` in the sign-in
    POST cannot redirect the email recipient to a third-party host.

- **F-18 — Short-circuit `getUser()` when no auth cookies**
  - `lib/supabase/middleware.ts`
  - Middleware now early-returns `{ user: null }` when the request has
    no `sb-*-auth-token` cookie, saving the Supabase round-trip on
    anonymous probes and bot traffic.

- **F-19 — Dependency lockdown**
  - `package.json`, `.npmrc`, `.github/dependabot.yml`
  - Critical runtime deps pinned to exact versions (next, react,
    react-dom, tailwind-merge, @supabase/\*, @upstash/\*). Dev deps
    keep caret ranges. `.npmrc` sets `ignore-scripts=true`. Dependabot
    watches npm + github-actions weekly. `engines` declares
    `node >=20.11 <21`. Secret scanning / push protection is a manual
    repo-settings toggle (see README).

- **F-20 — Clean `.env.local.example`**
  - `.env.local.example`
  - Real-looking Supabase project URL replaced with `<your-project>`.
    Added `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
    `HEALTH_CHECK_TOKEN` placeholders. Git history audit produced no
    committed service-role key (only empty placeholders); no rotation
    required. Re-check before merge.
