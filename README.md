# Blackmass

Blackmass corporate site + `indaba.zimx.io` internal ops portal, built on Next.js 14 and Supabase.

## Local dev

```bash
npm install
cp .env.local.example .env.local   # then fill in the Supabase + Upstash keys
npm run dev
```

The app runs at `http://localhost:3000`. Marketing pages live at `/`, `/about`,
`/contact`, `/press`. The ops portal lives under `/indaba` and is served on
`indaba.zimx.io` in production via hostname-based routing (see
`middleware.ts`).

## Environment

See `.env.local.example` for the full list.

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL` — project URL; safe to ship to the browser
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — publishable anon key (RLS-scoped)
- `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS; server-only, **never** commit

### Security env vars (added by the 2026-04 hardening pass)

- `UPSTASH_REDIS_REST_URL` — Upstash Redis REST URL for edge rate limiting.
  Optional in dev; **required in prod**. Without it the rate limiters
  degrade open (allow all).
- `UPSTASH_REDIS_REST_TOKEN` — matching Upstash token.
- `HEALTH_CHECK_TOKEN` — any opaque random string. `GET /api/ops/health`
  returns 403 unless the request carries `X-Health-Token: <value>`.

## Production

Auto-deploys to Vercel on push to the default branch. `blackmass.co.uk` (and
the Vercel preview URL) serve the marketing site; `indaba.zimx.io` serves the
internal ops portal off the same deployment.

### Manual operational steps

These do NOT live in code and must be completed in the Supabase dashboard /
GitHub settings before the hardening pass is considered deployed:

1. **Supabase → Storage → `photos`** — flip the bucket from public to
   private. The RLS policies in
   `supabase/migrations/20260421090100_storage_policies.sql` assume a
   private bucket; leaving it public leaves the legacy public-read path
   open in parallel.
2. **Supabase → Settings → Auth → JWT expiry** — set to `3600` (1 hour).
   The client uses the refresh-token flow; shorter JWTs limit the blast
   radius of a leaked access token.
3. **Supabase → Settings → API → Service role key** — verify no historical
   git commit contained the real key (checked 2026-04, clean). If it ever
   does leak, rotate here and redeploy; note the rotation date in
   `CHANGES.md`.
4. **GitHub → Settings → Code security and analysis** — enable **Secret
   scanning** and **Push protection** on `roy-bme/blackmasswebsite`.
5. **Upstash → create a Redis database** — copy the REST URL + token to
   Vercel project env vars as `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN`.
6. **Vercel → Environment Variables** — set `HEALTH_CHECK_TOKEN` to a
   fresh random value and wire it into the uptime monitor.
7. **`npm update`** — run locally after cloning to pull Next 14.2.35+
   and the Upstash SDKs into `node_modules`; commit the refreshed
   `package-lock.json` if your environment differs.
8. **Basemap provider** — we still load Carto tiles with lat/lng in the
   URL. Acceptable given internal-only usage; follow-up item to host
   tiles ourselves if we expand to customer-facing map surfaces.

## indaba.zimx.io

Hostname-routed internal portal, Supabase auth via magic link, role-based
access with four roles (`admin`, `ops`, `bd`, `compliance`) enforced
server-side in `lib/ops/auth.ts` + `lib/ops/nav.ts`. All mutations go
through `/api/ops/*` Route Handlers which re-check role, call the
service-role key, and set attribution columns from the server session —
RLS (under `supabase/migrations/`) is defence-in-depth.

Modules:

- Dashboard — live KPIs
- Map — interactive Bulawayo map with business pins, supply links, zone overlays
- Directory — business directory (kanban + list views)
- Supply chain — graph + loop detection
- Introductions — BD pipeline with Roy approval gate
- Events — trade fairs, chambers, networking + post-event debriefs
- Ops feed — channel-based daily reporting (ground ops / BD / admin)
- ZITF — paper + digital stand-response pipeline

Healthcheck: `GET /api/ops/health` with `X-Health-Token: $HEALTH_CHECK_TOKEN`.

## Scripts

- `npm run dev` — Next.js dev server
- `npm run build` — production build
- `npm run lint` — ESLint + Next.js rules
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — unit tests (Node built-in runner, currently CSV escape)
- `npm run audit:check` — waiver-aware `npm audit --omit=dev` wrapper;
  fails on un-waived highs / criticals
