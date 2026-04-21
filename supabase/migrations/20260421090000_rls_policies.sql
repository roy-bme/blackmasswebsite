-- Row-Level Security policies for the Indaba ops portal.
--
-- Every table under public.* that the portal touches gets RLS enabled and
-- explicit SELECT / INSERT / UPDATE / DELETE policies per role. WITH CHECK
-- is used on INSERT and UPDATE to prevent spoofing server-set attribution
-- columns (user_id, introduced_by, mapped_by, created_by, collected_by,
-- submitted_by).
--
-- Role resolution: public.users holds a `role` column. The
-- `public.current_ops_role()` helper reads that once per statement using
-- auth.uid() and is usable in policy predicates.
--
-- Defence-in-depth: every client write path (/api/ops/*) also performs the
-- same role check using the service-role key and then writes via that key.
-- RLS is the second line, not the first.

-- ─── helper ──────────────────────────────────────────────────────────────────

create or replace function public.current_ops_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.role
  from public.users u
  where u.id = auth.uid()
    and coalesce(u.active, false) = true
    and u.revoked_at is null
  limit 1;
$$;

revoke all on function public.current_ops_role() from public;
grant execute on function public.current_ops_role() to authenticated;

-- ─── users ───────────────────────────────────────────────────────────────────

alter table public.users enable row level security;

drop policy if exists users_select_self_or_staff on public.users;
create policy users_select_self_or_staff
  on public.users for select
  to authenticated
  using (
    id = auth.uid()
    or public.current_ops_role() in ('admin', 'ops', 'bd', 'compliance')
  );

drop policy if exists users_insert_never on public.users;
create policy users_insert_never
  on public.users for insert
  to authenticated
  with check (false);

drop policy if exists users_update_self_limited on public.users;
create policy users_update_self_limited
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists users_delete_never on public.users;
create policy users_delete_never
  on public.users for delete
  to authenticated
  using (false);

-- See 20260421090400_users_role_lockdown.sql for the trigger that forbids
-- self-update of role / active / revoked_at.

-- ─── zones ───────────────────────────────────────────────────────────────────

alter table public.zones enable row level security;

drop policy if exists zones_select_staff on public.zones;
create policy zones_select_staff
  on public.zones for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops', 'bd'));

drop policy if exists zones_write_admin on public.zones;
create policy zones_write_admin
  on public.zones for all
  to authenticated
  using (public.current_ops_role() = 'admin')
  with check (public.current_ops_role() = 'admin');

-- ─── businesses ──────────────────────────────────────────────────────────────

alter table public.businesses enable row level security;

drop policy if exists businesses_select_staff on public.businesses;
create policy businesses_select_staff
  on public.businesses for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops', 'bd'));

drop policy if exists businesses_insert_staff on public.businesses;
create policy businesses_insert_staff
  on public.businesses for insert
  to authenticated
  with check (
    public.current_ops_role() in ('admin', 'ops')
    and mapped_by = auth.uid()
  );

drop policy if exists businesses_update_staff on public.businesses;
create policy businesses_update_staff
  on public.businesses for update
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops'))
  with check (public.current_ops_role() in ('admin', 'ops'));

drop policy if exists businesses_delete_admin on public.businesses;
create policy businesses_delete_admin
  on public.businesses for delete
  to authenticated
  using (public.current_ops_role() = 'admin');

-- See 20260421090600_state_machine_onboarding.sql for the stage-transition
-- trigger that restricts onboarding_stage mutation to admins and forbids
-- skipping stages.

-- ─── contacts ────────────────────────────────────────────────────────────────

alter table public.contacts enable row level security;

drop policy if exists contacts_select_staff on public.contacts;
create policy contacts_select_staff
  on public.contacts for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops', 'bd'));

drop policy if exists contacts_insert_staff on public.contacts;
create policy contacts_insert_staff
  on public.contacts for insert
  to authenticated
  with check (
    public.current_ops_role() in ('admin', 'ops', 'bd')
    and (introduced_by is null or introduced_by = auth.uid())
  );

drop policy if exists contacts_update_staff on public.contacts;
create policy contacts_update_staff
  on public.contacts for update
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops', 'bd'))
  with check (public.current_ops_role() in ('admin', 'ops', 'bd'));

drop policy if exists contacts_delete_admin on public.contacts;
create policy contacts_delete_admin
  on public.contacts for delete
  to authenticated
  using (public.current_ops_role() = 'admin');

-- ─── supply_chain_links ──────────────────────────────────────────────────────

alter table public.supply_chain_links enable row level security;

drop policy if exists links_select_staff on public.supply_chain_links;
create policy links_select_staff
  on public.supply_chain_links for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops'));

drop policy if exists links_insert_staff on public.supply_chain_links;
create policy links_insert_staff
  on public.supply_chain_links for insert
  to authenticated
  with check (
    public.current_ops_role() in ('admin', 'ops')
    and mapped_by = auth.uid()
  );

drop policy if exists links_update_staff on public.supply_chain_links;
create policy links_update_staff
  on public.supply_chain_links for update
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops'))
  with check (public.current_ops_role() in ('admin', 'ops'));

drop policy if exists links_delete_admin on public.supply_chain_links;
create policy links_delete_admin
  on public.supply_chain_links for delete
  to authenticated
  using (public.current_ops_role() = 'admin');

-- ─── loops ───────────────────────────────────────────────────────────────────

alter table public.loops enable row level security;

drop policy if exists loops_select_staff on public.loops;
create policy loops_select_staff
  on public.loops for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops', 'bd'));

drop policy if exists loops_write_admin on public.loops;
create policy loops_write_admin
  on public.loops for all
  to authenticated
  using (public.current_ops_role() = 'admin')
  with check (public.current_ops_role() = 'admin');

-- ─── introductions ───────────────────────────────────────────────────────────

alter table public.introductions enable row level security;

drop policy if exists intros_select_staff on public.introductions;
create policy intros_select_staff
  on public.introductions for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'bd'));

drop policy if exists intros_insert_staff on public.introductions;
create policy intros_insert_staff
  on public.introductions for insert
  to authenticated
  with check (
    public.current_ops_role() in ('admin', 'bd')
    and introduced_by = auth.uid()
    -- Non-admins can never flip roy_approved on insert.
    and (
      public.current_ops_role() = 'admin'
      or coalesce(roy_approved, false) = false
    )
  );

drop policy if exists intros_update_staff on public.introductions;
create policy intros_update_staff
  on public.introductions for update
  to authenticated
  using (public.current_ops_role() in ('admin', 'bd'))
  with check (public.current_ops_role() in ('admin', 'bd'));

-- roy_approved mutation is additionally trigger-guarded below so that only
-- admins may flip it.
create or replace function public.guard_intro_roy_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.roy_approved is distinct from old.roy_approved
     and public.current_ops_role() <> 'admin' then
    raise exception 'only admins may change roy_approved';
  end if;
  return new;
end;
$$;

drop trigger if exists introductions_guard_roy_approved on public.introductions;
create trigger introductions_guard_roy_approved
  before update on public.introductions
  for each row
  execute function public.guard_intro_roy_approved();

drop policy if exists intros_delete_admin on public.introductions;
create policy intros_delete_admin
  on public.introductions for delete
  to authenticated
  using (public.current_ops_role() = 'admin');

-- ─── events ──────────────────────────────────────────────────────────────────

alter table public.events enable row level security;

drop policy if exists events_select_staff on public.events;
create policy events_select_staff
  on public.events for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops', 'bd'));

drop policy if exists events_insert_staff on public.events;
create policy events_insert_staff
  on public.events for insert
  to authenticated
  with check (public.current_ops_role() in ('admin', 'bd', 'ops'));

drop policy if exists events_update_staff on public.events;
create policy events_update_staff
  on public.events for update
  to authenticated
  using (public.current_ops_role() in ('admin', 'bd', 'ops'))
  with check (public.current_ops_role() in ('admin', 'bd', 'ops'));

drop policy if exists events_delete_admin on public.events;
create policy events_delete_admin
  on public.events for delete
  to authenticated
  using (public.current_ops_role() = 'admin');

-- ─── event_debriefs ──────────────────────────────────────────────────────────

alter table public.event_debriefs enable row level security;

drop policy if exists debriefs_select_staff on public.event_debriefs;
create policy debriefs_select_staff
  on public.event_debriefs for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops', 'bd'));

drop policy if exists debriefs_insert_staff on public.event_debriefs;
create policy debriefs_insert_staff
  on public.event_debriefs for insert
  to authenticated
  with check (
    public.current_ops_role() in ('admin', 'ops', 'bd')
    and (submitted_by is null or submitted_by = auth.uid())
  );

drop policy if exists debriefs_update_staff on public.event_debriefs;
create policy debriefs_update_staff
  on public.event_debriefs for update
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops', 'bd'))
  with check (public.current_ops_role() in ('admin', 'ops', 'bd'));

drop policy if exists debriefs_delete_admin on public.event_debriefs;
create policy debriefs_delete_admin
  on public.event_debriefs for delete
  to authenticated
  using (public.current_ops_role() = 'admin');

-- ─── activities ──────────────────────────────────────────────────────────────

alter table public.activities enable row level security;

drop policy if exists activities_select_staff on public.activities;
create policy activities_select_staff
  on public.activities for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops', 'bd'));

drop policy if exists activities_insert_staff on public.activities;
create policy activities_insert_staff
  on public.activities for insert
  to authenticated
  with check (
    public.current_ops_role() in ('admin', 'ops', 'bd')
    and user_id = auth.uid()
  );

drop policy if exists activities_update_self on public.activities;
create policy activities_update_self
  on public.activities for update
  to authenticated
  using (user_id = auth.uid() or public.current_ops_role() = 'admin')
  with check (user_id = auth.uid() or public.current_ops_role() = 'admin');

drop policy if exists activities_delete_admin on public.activities;
create policy activities_delete_admin
  on public.activities for delete
  to authenticated
  using (public.current_ops_role() = 'admin' or user_id = auth.uid());

-- ─── tasks ───────────────────────────────────────────────────────────────────

alter table public.tasks enable row level security;

drop policy if exists tasks_select_staff on public.tasks;
create policy tasks_select_staff
  on public.tasks for select
  to authenticated
  using (
    public.current_ops_role() = 'admin'
    or assigned_to = auth.uid()
    or created_by = auth.uid()
  );

drop policy if exists tasks_insert_staff on public.tasks;
create policy tasks_insert_staff
  on public.tasks for insert
  to authenticated
  with check (
    public.current_ops_role() in ('admin', 'ops', 'bd')
    and created_by = auth.uid()
  );

drop policy if exists tasks_update_staff on public.tasks;
create policy tasks_update_staff
  on public.tasks for update
  to authenticated
  using (
    public.current_ops_role() = 'admin'
    or assigned_to = auth.uid()
    or created_by = auth.uid()
  )
  with check (
    public.current_ops_role() = 'admin'
    or assigned_to = auth.uid()
    or created_by = auth.uid()
  );

drop policy if exists tasks_delete_admin on public.tasks;
create policy tasks_delete_admin
  on public.tasks for delete
  to authenticated
  using (public.current_ops_role() = 'admin');

-- ─── competitive_intel ───────────────────────────────────────────────────────

alter table public.competitive_intel enable row level security;

drop policy if exists intel_select_staff on public.competitive_intel;
create policy intel_select_staff
  on public.competitive_intel for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops', 'bd'));

drop policy if exists intel_insert_staff on public.competitive_intel;
create policy intel_insert_staff
  on public.competitive_intel for insert
  to authenticated
  with check (
    public.current_ops_role() in ('admin', 'ops', 'bd')
    and (observed_by is null or observed_by = auth.uid())
  );

drop policy if exists intel_update_staff on public.competitive_intel;
create policy intel_update_staff
  on public.competitive_intel for update
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops', 'bd'))
  with check (public.current_ops_role() in ('admin', 'ops', 'bd'));

drop policy if exists intel_delete_admin on public.competitive_intel;
create policy intel_delete_admin
  on public.competitive_intel for delete
  to authenticated
  using (public.current_ops_role() = 'admin');

-- ─── zitf_responses ──────────────────────────────────────────────────────────

alter table public.zitf_responses enable row level security;

drop policy if exists zitf_select_staff on public.zitf_responses;
create policy zitf_select_staff
  on public.zitf_responses for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops', 'bd', 'compliance'));

drop policy if exists zitf_insert_never_client on public.zitf_responses;
-- All inserts go through the edge function (for digital) or through our
-- /api/ops/zitf/create-paper Route Handler (for paper). Neither path uses
-- the authenticated role directly to write; the policy therefore denies
-- authenticated-role inserts entirely and relies on service-role writes.
create policy zitf_insert_never_client
  on public.zitf_responses for insert
  to authenticated
  with check (false);

drop policy if exists zitf_update_staff on public.zitf_responses;
create policy zitf_update_staff
  on public.zitf_responses for update
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops', 'bd'))
  with check (public.current_ops_role() in ('admin', 'ops', 'bd'));

drop policy if exists zitf_delete_admin on public.zitf_responses;
create policy zitf_delete_admin
  on public.zitf_responses for delete
  to authenticated
  using (public.current_ops_role() = 'admin');

-- ─── zitf_paper_responses (if separate table) ────────────────────────────────

do $$
begin
  if exists (
    select 1 from pg_tables where schemaname = 'public' and tablename = 'zitf_paper_responses'
  ) then
    execute 'alter table public.zitf_paper_responses enable row level security';
    execute $$
      drop policy if exists zitf_paper_select_staff on public.zitf_paper_responses;
      create policy zitf_paper_select_staff
        on public.zitf_paper_responses for select
        to authenticated
        using (public.current_ops_role() in ('admin', 'ops', 'bd', 'compliance'));
    $$;
    execute $$
      drop policy if exists zitf_paper_insert_staff on public.zitf_paper_responses;
      create policy zitf_paper_insert_staff
        on public.zitf_paper_responses for insert
        to authenticated
        with check (
          public.current_ops_role() in ('admin', 'ops')
          and collected_by = auth.uid()
        );
    $$;
    execute $$
      drop policy if exists zitf_paper_update_staff on public.zitf_paper_responses;
      create policy zitf_paper_update_staff
        on public.zitf_paper_responses for update
        to authenticated
        using (public.current_ops_role() in ('admin', 'ops', 'bd'))
        with check (public.current_ops_role() in ('admin', 'ops', 'bd'));
    $$;
    execute $$
      drop policy if exists zitf_paper_delete_admin on public.zitf_paper_responses;
      create policy zitf_paper_delete_admin
        on public.zitf_paper_responses for delete
        to authenticated
        using (public.current_ops_role() = 'admin');
    $$;
  end if;
end
$$;
