# INDABA P2 API Route Audit (2026-05-01)

## Branch
- `work`

## Route inventory (`find app/api/ops -type f | sort`)
- app/api/ops/activities/create/route.ts
- app/api/ops/activities/signed-url/route.ts
- app/api/ops/activities/upload/route.ts
- app/api/ops/businesses/create/route.ts
- app/api/ops/businesses/photo/route.ts
- app/api/ops/businesses/update/route.ts
- app/api/ops/contacts/create/route.ts
- app/api/ops/events/create/route.ts
- app/api/ops/health/route.ts
- app/api/ops/introductions/create/route.ts
- app/api/ops/links/create/route.ts
- app/api/ops/reverse-geocode/route.ts
- app/api/ops/tasks/create/route.ts

## File history (`git log --oneline --follow -- app/api/ops/businesses/create/route.ts`)
- 47aa778 sec(F-2, F-3, F-4): commit RLS, move writes server-side, lock photos bucket

## Apr 27 rebuild spot-check (`git show 0159328 --stat`)
- Confirmed deletions under `app/api/` were limited to:
  - `app/api/auth/signin/route.ts`
  - `app/api/ops/zitf/create-paper/route.ts`
  - `app/api/ops/zitf/update/route.ts`
- No deletions for `app/api/ops/businesses/*`, `contacts/*`, `links/*`, or related ops routes were shown.

## Conclusion
- In this branch snapshot, ops API routes are present and `businesses/create` was **not** deleted by commit `0159328`.
- No restore action was required from a pre-Apr-27 commit in this workspace state.
