-- ZITF (Zimbabwe International Trade Fair) decommissioning.
--
-- The ZITF 2026 stand-response pipeline shipped as a one-off lead-capture
-- surface. With the indaba portal v1 rebuild the entire ZITF module is
-- being retired:
--   - All routes under app/indaba/(ops)/zitf/* are deleted.
--   - All API handlers under /api/ops/zitf/* are deleted.
--   - All client types and components are deleted.
--
-- We rename the table to `zitf_responses_archive` so the historical data is
-- preserved for audit / export and disable RLS on the archive (no portal
-- code references it any more). The summary view is dropped outright.

-- Drop the summary view first — it depends on the table.
drop view if exists public.v_zitf_ops_summary cascade;

-- Drop RLS policies (they reference public.current_ops_role which still
-- exists for the rest of the portal).
drop policy if exists zitf_select_staff on public.zitf_responses;
drop policy if exists zitf_insert_never_client on public.zitf_responses;
drop policy if exists zitf_update_staff on public.zitf_responses;
drop policy if exists zitf_delete_admin on public.zitf_responses;
drop policy if exists zitf_paper_select_staff on public.zitf_paper_responses;
drop policy if exists zitf_paper_insert_staff on public.zitf_paper_responses;
drop policy if exists zitf_paper_update_staff on public.zitf_paper_responses;
drop policy if exists zitf_paper_delete_admin on public.zitf_paper_responses;

-- Archive the digital response table.
do $$
begin
  if exists (
    select 1 from pg_tables where schemaname = 'public' and tablename = 'zitf_responses'
  ) then
    execute 'alter table public.zitf_responses rename to zitf_responses_archive';
    execute 'alter table public.zitf_responses_archive disable row level security';
    execute $cmt$comment on table public.zitf_responses_archive is 'Archived ZITF 2026 stand responses. Module retired 2026-04-27 — read-only.'$cmt$;
  end if;
end
$$;

-- Archive the paper response table if it ever materialised separately.
do $$
begin
  if exists (
    select 1 from pg_tables where schemaname = 'public' and tablename = 'zitf_paper_responses'
  ) then
    execute 'alter table public.zitf_paper_responses rename to zitf_paper_responses_archive';
    execute 'alter table public.zitf_paper_responses_archive disable row level security';
  end if;
end
$$;
