-- Prevent staff from self-updating sensitive fields on public.users.
--
-- Only service-role writes (e.g. from our /api/admin/users/* Route Handlers
-- executed by an admin) may mutate: role, active, revoked_at.
--
-- We rely on auth.jwt() -> role() == 'authenticated' vs 'service_role' to
-- distinguish: service role bypasses RLS AND bypasses this trigger.

create or replace function public.guard_users_role_lockdown()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role writes come in without an auth.uid(); don't gate them.
  if auth.uid() is null then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'role is admin-only; use an admin Route Handler';
  end if;
  if coalesce(new.active, true) is distinct from coalesce(old.active, true) then
    raise exception 'active is admin-only; use an admin Route Handler';
  end if;
  if new.revoked_at is distinct from old.revoked_at then
    raise exception 'revoked_at is admin-only; use an admin Route Handler';
  end if;
  return new;
end;
$$;

drop trigger if exists users_guard_role_lockdown on public.users;
create trigger users_guard_role_lockdown
  before update on public.users
  for each row
  execute function public.guard_users_role_lockdown();
