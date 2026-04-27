-- Cleanup migration — drop legacy module tables that the indaba portal v1
-- rebuild no longer touches.
--
-- This runs AFTER the v1 rebuild has shipped (20260427120100) so that any
-- leftover code paths have a chance to be exercised in production before
-- the underlying tables disappear. Each `if exists` guard means the
-- migration is idempotent across environments where some of these tables
-- may already have been removed manually.
--
-- Affected prefixes:
--   sentinel_*  — the abandoned threat-monitoring scratch.
--   growth_*    — the early growth-loops experiment, replaced by `loops`.
--   investor_*  — the investor-facing reporting prototype.
--
-- We use `cascade` so any dependent views / sequences / FKs go with each
-- table. None of these are referenced from the active schema.

do $$
declare
  rec record;
begin
  for rec in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
      and (
        tablename like 'sentinel\_%' escape '\'
        or tablename like 'growth\_%' escape '\'
        or tablename like 'investor\_%' escape '\'
      )
  loop
    execute format('drop table if exists %I.%I cascade', rec.schemaname, rec.tablename);
  end loop;

  for rec in
    select schemaname, viewname
    from pg_views
    where schemaname = 'public'
      and (
        viewname like 'sentinel\_%' escape '\'
        or viewname like 'v\_sentinel%' escape '\'
        or viewname like 'growth\_%' escape '\'
        or viewname like 'v\_growth%' escape '\'
        or viewname like 'investor\_%' escape '\'
        or viewname like 'v\_investor%' escape '\'
      )
  loop
    execute format('drop view if exists %I.%I cascade', rec.schemaname, rec.viewname);
  end loop;
end
$$;
