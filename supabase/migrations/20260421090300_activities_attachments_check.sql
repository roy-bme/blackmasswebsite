-- Require every attachment URL in activities.attachments to point at our
-- Supabase storage endpoint. Stops an attacker from using the feed to
-- render or link <img> / <a> tags to arbitrary external hosts.

alter table public.activities
  drop constraint if exists activities_attachments_hosts_chk;

alter table public.activities
  add constraint activities_attachments_hosts_chk
  check (
    attachments is null
    or (
      cardinality(attachments) <= 10
      and (
        select bool_and(
          u ~ '^https://ipqmdinidqpmchggjdov\.supabase\.co/storage/v1/'
          or u ~ '^photos/'
        )
        from unnest(attachments) as u
      )
    )
  );
