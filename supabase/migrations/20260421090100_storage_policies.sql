-- Private photos bucket + tight storage.objects policies.
--
-- Operational steps that MUST also be done in the Supabase dashboard
-- (see README):
--   1. Flip the `photos` bucket from public to private.
--   2. Rotate any signed URLs currently cached client-side (they will expire
--      naturally within 5 minutes of the deploy since we use 300s TTLs).
--
-- All uploads are proxied through the authenticated Route Handlers under
-- /api/ops/*, which call createSupabaseServiceRoleClient(). The client-side
-- SDK is no longer used to touch `photos`; the policies below enforce that
-- even if a client key leaks, it cannot upload or read directly.

-- ─── storage.objects ─────────────────────────────────────────────────────────

-- Drop any legacy public-read policies from the old "public bucket" world.
drop policy if exists "Public photos are viewable by everyone." on storage.objects;
drop policy if exists "public_read_photos" on storage.objects;

-- Authenticated SELECT only (signed URLs are still required for clients that
-- don't attach the auth header, which is our render path).
drop policy if exists select_authenticated on storage.objects;
create policy select_authenticated
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'photos'
    and auth.role() = 'authenticated'
  );

-- Uploads: only the user's own folder (first path segment = uid).
-- Also cap path length to prevent filesystem-style pathological keys.
drop policy if exists insert_own_folder on storage.objects;
create policy insert_own_folder
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and octet_length(name) < 255
  );

-- Users may delete their own uploads; admins may delete anyone's.
drop policy if exists delete_own_or_admin on storage.objects;
create policy delete_own_or_admin
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_ops_role() = 'admin'
    )
  );

-- No client UPDATE on storage.objects.
drop policy if exists update_never on storage.objects;
create policy update_never
  on storage.objects for update
  to authenticated
  using (false)
  with check (false);
