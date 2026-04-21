-- Onboarding-stage state machine.
--
-- Business.onboarding_stage may only progress one step along the canonical
-- order, and only admins may change it. Regressions (e.g. a lost deal
-- moving back to identified) go through a deliberate admin path.
--
-- The canonical order (from types/ops.ts) is:
--   identified → intel_gathered → intro_made → meeting_set →
--   meeting_done → loi_signed → onboarded

create or replace function public.guard_businesses_stage_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  stages text[] := array[
    'identified',
    'intel_gathered',
    'intro_made',
    'meeting_set',
    'meeting_done',
    'loi_signed',
    'onboarded'
  ];
  old_idx int;
  new_idx int;
begin
  -- Service-role writes bypass this guard, consistent with RLS bypass.
  if auth.uid() is null then
    return new;
  end if;

  if new.onboarding_stage is not distinct from old.onboarding_stage then
    return new;
  end if;

  if public.current_ops_role() <> 'admin' then
    raise exception 'only admins may change onboarding_stage';
  end if;

  old_idx := array_position(stages, old.onboarding_stage);
  new_idx := array_position(stages, new.onboarding_stage);

  if old_idx is null or new_idx is null then
    raise exception 'unknown onboarding_stage value';
  end if;

  -- Forward by exactly one step, or any backwards move (admin explicitly
  -- walking a deal back). Forbid skipping forward past a stage.
  if new_idx > old_idx + 1 then
    raise exception
      'onboarding_stage cannot skip from % to %',
      old.onboarding_stage, new.onboarding_stage;
  end if;

  return new;
end;
$$;

drop trigger if exists businesses_guard_stage_transition on public.businesses;
create trigger businesses_guard_stage_transition
  before update of onboarding_stage on public.businesses
  for each row
  execute function public.guard_businesses_stage_transition();
