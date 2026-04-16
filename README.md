# Blackmass

Blackmass corporate site + `indaba.zimx.io` internal ops portal, built on Next.js 14 and Supabase.

## Local dev

```bash
npm install
cp .env.local.example .env.local   # then fill in the Supabase keys
npm run dev
```

The app runs at `http://localhost:3000`. Marketing pages live at `/`, `/about`,
`/contact`, `/press`. The ops portal lives under `/indaba` and is served on
`indaba.zimx.io` in production via hostname-based routing (see
`middleware.ts`).

## Environment

See `.env.local.example` for the full list. In short:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Production

Auto-deploys to Vercel on push to the default branch. `blackmass.co.uk` (and
the Vercel preview URL) serve the marketing site; `indaba.zimx.io` serves the
internal ops portal off the same deployment.

## indaba.zimx.io

Hostname-routed internal portal, Supabase auth via magic link, role-based
access with three roles (`admin`, `ops`, `bd`) enforced server-side in
`lib/ops/auth.ts` + `lib/ops/nav.ts`. Seven modules:

- Dashboard — live KPIs
- Map — interactive Bulawayo map with business pins, supply links, zone overlays
- Directory — business directory (kanban + list views)
- Supply chain — graph + loop detection
- Introductions — BD pipeline with Roy approval gate
- Events — trade fairs, chambers, networking + post-event debriefs
- Ops feed — channel-based daily reporting (ground ops / BD / admin)

Healthcheck: `GET /api/ops/health`.
