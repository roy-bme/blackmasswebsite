-- Add a soft-disable flag to public.users so admins can revoke a staff
-- member's portal access without deleting their auth user (which would
-- orphan their activity rows).

alter table public.users
  add column if not exists revoked_at timestamptz;

create index if not exists users_revoked_at_idx
  on public.users (revoked_at)
  where revoked_at is not null;

-- Keep loadOpsProfile() in sync: a user with revoked_at set cannot pass the
-- RLS `current_ops_role()` helper (which filters revoked_at is null), so
-- every module page redirects them to /login.
