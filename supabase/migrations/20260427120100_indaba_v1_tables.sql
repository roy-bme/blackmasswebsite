-- Indaba v1 — new tables for Compliance Queue, Agent Console, and Discovery.
--
-- Compliance Queue
--   compliance_flags     — actionable items the queue surfaces
--   regulatory_signals   — feed of regulator notices (RBZ, FIU, ZRA, …)
--
-- Agent Console
--   agent_runs           — every agent invocation with status + outputs
--   agent_briefs         — markdown daily briefs (Roy + Victor read these)
--   agent_suggestions    — actionable suggestions surfaced for accept/skip
--
-- Discovery (agent-fed Suggested lane in Directory)
--   discovery_candidates — businesses the agent has unearthed
--   pipeline_signals     — supporting evidence per candidate
--
-- Feed channel enum
--   feed_channels        — admin / ground_ops / bd_networking / compliance
--   activities.channel cast over to the new enum so RLS can gate per role.

-- ─── enums ───────────────────────────────────────────────────────────────────

do $$
begin
  if not exists (select 1 from pg_type where typname = 'compliance_severity') then
    create type public.compliance_severity as enum ('info', 'warning', 'blocker');
  end if;
  if not exists (select 1 from pg_type where typname = 'compliance_flag_status') then
    create type public.compliance_flag_status as enum (
      'open', 'in_review', 'resolved', 'escalated'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'compliance_source') then
    create type public.compliance_source as enum ('rule', 'agent', 'manual');
  end if;
  if not exists (select 1 from pg_type where typname = 'regulatory_severity') then
    create type public.regulatory_severity as enum ('low', 'med', 'high');
  end if;
  if not exists (select 1 from pg_type where typname = 'agent_run_status') then
    create type public.agent_run_status as enum (
      'queued', 'running', 'ok', 'warn', 'error'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'agent_suggestion_status') then
    create type public.agent_suggestion_status as enum (
      'open', 'accepted', 'skipped', 'expired'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'discovery_status') then
    create type public.discovery_status as enum (
      'open', 'promoted', 'dismissed'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'feed_channel') then
    create type public.feed_channel as enum (
      'admin', 'ground_ops', 'bd_networking', 'compliance'
    );
  end if;
end
$$;

-- ─── compliance_flags ────────────────────────────────────────────────────────

create table if not exists public.compliance_flags (
  id           uuid primary key default gen_random_uuid(),
  severity     public.compliance_severity not null,
  source       public.compliance_source not null default 'manual',
  business_id  uuid references public.businesses(id) on delete set null,
  link_id      uuid references public.supply_chain_links(id) on delete set null,
  summary      text not null check (char_length(summary) between 1 and 200),
  detail       text,
  status       public.compliance_flag_status not null default 'open',
  notes        text,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz,
  resolved_by  uuid references public.users(id) on delete set null,
  assigned_to  uuid references public.users(id) on delete set null
);

create index if not exists compliance_flags_status_idx
  on public.compliance_flags (status, created_at desc);
create index if not exists compliance_flags_business_idx
  on public.compliance_flags (business_id);

alter table public.compliance_flags enable row level security;

drop policy if exists compliance_flags_select on public.compliance_flags;
create policy compliance_flags_select
  on public.compliance_flags for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'compliance'));

drop policy if exists compliance_flags_insert on public.compliance_flags;
create policy compliance_flags_insert
  on public.compliance_flags for insert
  to authenticated
  with check (public.current_ops_role() in ('admin', 'compliance'));

drop policy if exists compliance_flags_update on public.compliance_flags;
create policy compliance_flags_update
  on public.compliance_flags for update
  to authenticated
  using (public.current_ops_role() in ('admin', 'compliance'))
  with check (public.current_ops_role() in ('admin', 'compliance'));

drop policy if exists compliance_flags_delete on public.compliance_flags;
create policy compliance_flags_delete
  on public.compliance_flags for delete
  to authenticated
  using (public.current_ops_role() = 'admin');

-- ─── regulatory_signals ──────────────────────────────────────────────────────

create table if not exists public.regulatory_signals (
  id           uuid primary key default gen_random_uuid(),
  jurisdiction text not null default 'ZW' check (char_length(jurisdiction) <= 8),
  source       text not null check (char_length(source) between 1 and 64),
  headline     text not null check (char_length(headline) between 1 and 200),
  body         text,
  severity     public.regulatory_severity not null default 'low',
  exposure     jsonb not null default '{}'::jsonb,
  external_url text,
  created_at   timestamptz not null default now()
);

create index if not exists regulatory_signals_created_idx
  on public.regulatory_signals (created_at desc);

alter table public.regulatory_signals enable row level security;

drop policy if exists regulatory_signals_select on public.regulatory_signals;
create policy regulatory_signals_select
  on public.regulatory_signals for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'compliance'));

drop policy if exists regulatory_signals_write_admin on public.regulatory_signals;
create policy regulatory_signals_write_admin
  on public.regulatory_signals for all
  to authenticated
  using (public.current_ops_role() = 'admin')
  with check (public.current_ops_role() = 'admin');

-- ─── agent_runs ──────────────────────────────────────────────────────────────

create table if not exists public.agent_runs (
  id           uuid primary key default gen_random_uuid(),
  agent_name   text not null check (char_length(agent_name) between 1 and 64),
  status       public.agent_run_status not null default 'queued',
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,
  duration_ms  integer,
  outputs      jsonb not null default '{}'::jsonb,
  trace_url    text,
  notes        text
);

create index if not exists agent_runs_started_idx
  on public.agent_runs (started_at desc);
create index if not exists agent_runs_name_idx
  on public.agent_runs (agent_name, started_at desc);

alter table public.agent_runs enable row level security;

drop policy if exists agent_runs_select on public.agent_runs;
create policy agent_runs_select
  on public.agent_runs for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'compliance'));

drop policy if exists agent_runs_write_admin on public.agent_runs;
create policy agent_runs_write_admin
  on public.agent_runs for all
  to authenticated
  using (public.current_ops_role() = 'admin')
  with check (public.current_ops_role() = 'admin');

-- ─── agent_briefs ────────────────────────────────────────────────────────────

create table if not exists public.agent_briefs (
  id         uuid primary key default gen_random_uuid(),
  run_id     uuid references public.agent_runs(id) on delete set null,
  audience   text not null default 'admin' check (audience in ('admin', 'compliance')),
  markdown   text not null check (char_length(markdown) between 1 and 20000),
  created_at timestamptz not null default now()
);

create index if not exists agent_briefs_created_idx
  on public.agent_briefs (created_at desc);

alter table public.agent_briefs enable row level security;

drop policy if exists agent_briefs_select on public.agent_briefs;
create policy agent_briefs_select
  on public.agent_briefs for select
  to authenticated
  using (
    (audience = 'admin' and public.current_ops_role() = 'admin')
    or (audience = 'compliance' and public.current_ops_role() in ('admin', 'compliance'))
  );

drop policy if exists agent_briefs_write_admin on public.agent_briefs;
create policy agent_briefs_write_admin
  on public.agent_briefs for all
  to authenticated
  using (public.current_ops_role() = 'admin')
  with check (public.current_ops_role() = 'admin');

-- Convenience view: most-recent brief per audience.
create or replace view public.v_latest_agent_brief as
  select distinct on (audience) id, run_id, audience, markdown, created_at
  from public.agent_briefs
  order by audience, created_at desc;

grant select on public.v_latest_agent_brief to authenticated;

-- ─── agent_suggestions ───────────────────────────────────────────────────────

create table if not exists public.agent_suggestions (
  id          uuid primary key default gen_random_uuid(),
  run_id      uuid references public.agent_runs(id) on delete set null,
  kind        text not null check (char_length(kind) between 1 and 64),
  target_id   uuid,
  payload     jsonb not null default '{}'::jsonb,
  status      public.agent_suggestion_status not null default 'open',
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_by uuid references public.users(id) on delete set null
);

create index if not exists agent_suggestions_status_idx
  on public.agent_suggestions (status, created_at desc);

alter table public.agent_suggestions enable row level security;

drop policy if exists agent_suggestions_select on public.agent_suggestions;
create policy agent_suggestions_select
  on public.agent_suggestions for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'compliance'));

drop policy if exists agent_suggestions_update on public.agent_suggestions;
create policy agent_suggestions_update
  on public.agent_suggestions for update
  to authenticated
  using (public.current_ops_role() in ('admin', 'compliance'))
  with check (public.current_ops_role() in ('admin', 'compliance'));

drop policy if exists agent_suggestions_write_admin on public.agent_suggestions;
create policy agent_suggestions_write_admin
  on public.agent_suggestions for insert
  to authenticated
  with check (public.current_ops_role() = 'admin');

-- ─── discovery_candidates ────────────────────────────────────────────────────

create table if not exists public.discovery_candidates (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 200),
  sector       text,
  confidence   numeric(5, 2) check (confidence between 0 and 100),
  source       text not null check (char_length(source) between 1 and 64),
  payload      jsonb not null default '{}'::jsonb,
  status       public.discovery_status not null default 'open',
  promoted_to  uuid references public.businesses(id) on delete set null,
  promoted_at  timestamptz,
  promoted_by  uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists discovery_candidates_status_idx
  on public.discovery_candidates (status, created_at desc);

alter table public.discovery_candidates enable row level security;

drop policy if exists discovery_candidates_select on public.discovery_candidates;
create policy discovery_candidates_select
  on public.discovery_candidates for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops', 'bd', 'compliance'));

drop policy if exists discovery_candidates_update on public.discovery_candidates;
create policy discovery_candidates_update
  on public.discovery_candidates for update
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops'))
  with check (public.current_ops_role() in ('admin', 'ops'));

drop policy if exists discovery_candidates_insert_admin on public.discovery_candidates;
create policy discovery_candidates_insert_admin
  on public.discovery_candidates for insert
  to authenticated
  with check (public.current_ops_role() = 'admin');

-- ─── pipeline_signals ────────────────────────────────────────────────────────

create table if not exists public.pipeline_signals (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid not null references public.discovery_candidates(id) on delete cascade,
  kind          text not null check (char_length(kind) between 1 and 64),
  evidence      text,
  payload       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists pipeline_signals_candidate_idx
  on public.pipeline_signals (candidate_id, created_at desc);

alter table public.pipeline_signals enable row level security;

drop policy if exists pipeline_signals_select on public.pipeline_signals;
create policy pipeline_signals_select
  on public.pipeline_signals for select
  to authenticated
  using (public.current_ops_role() in ('admin', 'ops', 'bd', 'compliance'));

drop policy if exists pipeline_signals_write_admin on public.pipeline_signals;
create policy pipeline_signals_write_admin
  on public.pipeline_signals for all
  to authenticated
  using (public.current_ops_role() = 'admin')
  with check (public.current_ops_role() = 'admin');

-- ─── feed_channel column on activities ──────────────────────────────────────

-- The existing `activities.channel` is a free-form text column. Tighten it
-- to the new enum for safer per-channel RLS once compliance starts posting.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'activities'
      and column_name = 'channel'
      and data_type <> 'USER-DEFINED'
  ) then
    -- Map any unrecognised legacy values into 'admin' so the cast succeeds.
    execute $upd$
      update public.activities
      set channel = 'admin'
      where channel not in ('admin', 'ground_ops', 'bd_networking', 'compliance')
    $upd$;
    execute 'alter table public.activities alter column channel type public.feed_channel using channel::public.feed_channel';
  end if;
end
$$;

-- Per-channel SELECT gating. Replaces the open-to-staff policy from the
-- original RLS migration with role-aware channel access.
drop policy if exists activities_select_staff on public.activities;
create policy activities_select_staff
  on public.activities for select
  to authenticated
  using (
    public.current_ops_role() = 'admin'
    or (public.current_ops_role() = 'ops'        and channel = 'ground_ops')
    or (public.current_ops_role() = 'bd'         and channel = 'bd_networking')
    or (public.current_ops_role() = 'compliance' and channel = 'compliance')
  );

-- INSERT: each role may post to its own channel; admin may post anywhere.
drop policy if exists activities_insert_staff on public.activities;
create policy activities_insert_staff
  on public.activities for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      public.current_ops_role() = 'admin'
      or (public.current_ops_role() = 'ops'        and channel = 'ground_ops')
      or (public.current_ops_role() = 'bd'         and channel = 'bd_networking')
      or (public.current_ops_role() = 'compliance' and channel = 'compliance')
    )
  );
