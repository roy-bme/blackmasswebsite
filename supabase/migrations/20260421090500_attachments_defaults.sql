-- Database-level defaults for the server-set attribution columns.
--
-- Every Route Handler sets these explicitly from the authenticated session,
-- but defaults mean that even if a new call site forgets to pass them,
-- the row still gets attributed correctly rather than NULL.

alter table public.activities
  alter column user_id set default auth.uid();

alter table public.introductions
  alter column introduced_by set default auth.uid();

alter table public.businesses
  alter column mapped_by set default auth.uid();

alter table public.supply_chain_links
  alter column mapped_by set default auth.uid();

alter table public.tasks
  alter column created_by set default auth.uid();

-- event_debriefs.submitted_by and zitf_paper_responses.collected_by are
-- optional-nullable, so no default is needed there; the Route Handler
-- sets them explicitly.
