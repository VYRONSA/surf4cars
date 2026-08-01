-- PCP-001J1 Storage buckets and access policies
--
-- Buckets and policies only. No upload code is introduced in this sprint (PCP-001J2 owns the
-- media pipeline); this establishes the storage surface those uploads will target.
--
-- vehicle-media and dealer-branding are public-read because they are rendered on the public
-- marketplace. licence-discs and vehicle-documents hold regulatory and personal documents and
-- stay private, reachable only through signed URLs issued server-side.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('vehicle-media',     'vehicle-media',     true,  15728640, array['image/jpeg','image/png','image/webp','image/avif']),
  ('dealer-branding',   'dealer-branding',   true,   5242880, array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('licence-discs',     'licence-discs',     false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('vehicle-documents', 'vehicle-documents', false, 20971520, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

-- Objects are addressed as <dealership_id>/<vehicle_id>/<file>, so the first path segment is the
-- tenant key that every write policy checks.

-- Public read for marketplace-facing assets.
drop policy if exists storage_public_read_marketplace_assets on storage.objects;

create policy storage_public_read_marketplace_assets
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id in ('vehicle-media', 'dealer-branding'));

-- Dealers may write only beneath their own dealership prefix, in any bucket.
drop policy if exists storage_dealer_write_own_prefix on storage.objects;

create policy storage_dealer_write_own_prefix
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id in ('vehicle-media', 'dealer-branding', 'licence-discs', 'vehicle-documents')
    and exists (
      select 1
      from public.dealerships d
      where d.id = (storage.foldername(name))[1]
        and d.owner_user_id = auth.uid()
    )
  );

drop policy if exists storage_dealer_update_own_prefix on storage.objects;

create policy storage_dealer_update_own_prefix
  on storage.objects
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.dealerships d
      where d.id = (storage.foldername(name))[1]
        and d.owner_user_id = auth.uid()
    )
  );

drop policy if exists storage_dealer_delete_own_prefix on storage.objects;

create policy storage_dealer_delete_own_prefix
  on storage.objects
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.dealerships d
      where d.id = (storage.foldername(name))[1]
        and d.owner_user_id = auth.uid()
    )
  );

-- Private buckets: the owning dealer may read their own documents. Everyone else requires a
-- server-issued signed URL, which bypasses RLS by design.
drop policy if exists storage_dealer_read_private_own_prefix on storage.objects;

create policy storage_dealer_read_private_own_prefix
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id in ('licence-discs', 'vehicle-documents')
    and exists (
      select 1
      from public.dealerships d
      where d.id = (storage.foldername(name))[1]
        and d.owner_user_id = auth.uid()
    )
  );
