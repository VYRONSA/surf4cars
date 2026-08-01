-- PCP-001K2 Onboarding completion: allow an explicit owner for service-side callers.
--
-- The dev/cookie dealer session carries no Supabase JWT, so auth.uid() is null and onboarding
-- silently fell back to local persistence — the last vehicle-domain split-brain. The overload
-- lets the server supply the owner it has already resolved, keeping the write atomic.

create or replace function public.complete_dealer_onboarding_atomic(p_payload jsonb, p_owner_user_id uuid default null)
returns jsonb
language plpgsql
security invoker
as $$
declare
  -- Server-side callers holding the service key have no auth.uid(); they identify the owner
  -- explicitly. Session callers keep the previous behaviour. The function remains security
  -- invoker, so RLS still prevents an anon or authenticated caller from claiming another owner.
  v_owner_user_id uuid := coalesce(p_owner_user_id, auth.uid());
  v_now timestamptz := now();
  v_owner_email text := lower(trim(coalesce(p_payload->'ownerAccount'->>'email', '')));
  v_dealership_id text;
  v_primary_branch_id text;
  v_owner_membership_id text;
  v_branch jsonb;
  v_invite jsonb;
  v_branch_idx integer := 0;
  v_first_branch_created boolean := false;
  v_branch_id text;
  v_invite_email text;
begin
  if v_owner_user_id is null then
    raise exception 'Authenticated and verified owner account is required.';
  end if;

  if v_owner_email = '' then
    raise exception 'Owner email is required.';
  end if;

  select d.id
    into v_dealership_id
  from public.dealerships d
  where d.owner_user_id = v_owner_user_id
  order by d.created_at asc
  limit 1;

  if v_dealership_id is null then
    v_dealership_id := 'dealership-owner-' || lower(v_owner_user_id::text);
  end if;

  insert into public.dealerships (
    id,
    owner_user_id,
    business_name,
    trading_name,
    registration_number,
    vat_number,
    dealer_licence_number,
    business_type,
    physical_address,
    province,
    city,
    postal_code,
    gps_latitude,
    gps_longitude,
    telephone,
    whatsapp,
    email,
    website,
    logo_data_url,
    cover_data_url,
    primary_color,
    secondary_color,
    onboarding_status,
    subscription_package,
    completed_at,
    updated_at
  )
  values (
    v_dealership_id,
    v_owner_user_id,
    coalesce(p_payload->'dealership'->>'businessName', ''),
    coalesce(p_payload->'dealership'->>'tradingName', ''),
    coalesce(p_payload->'dealership'->>'registrationNumber', ''),
    coalesce(p_payload->'dealership'->>'vatNumber', ''),
    nullif(p_payload->'dealership'->>'dealerLicenceNumber', ''),
    coalesce(p_payload->'dealership'->>'businessType', ''),
    coalesce(p_payload->'dealership'->>'physicalAddress', ''),
    coalesce(p_payload->'dealership'->>'province', ''),
    coalesce(p_payload->'dealership'->>'city', ''),
    coalesce(p_payload->'dealership'->>'postalCode', ''),
    coalesce(p_payload->'dealership'->'gps'->>'latitude', ''),
    coalesce(p_payload->'dealership'->'gps'->>'longitude', ''),
    coalesce(p_payload->'dealership'->>'telephone', ''),
    coalesce(p_payload->'dealership'->>'whatsapp', ''),
    coalesce(p_payload->'dealership'->>'email', ''),
    nullif(p_payload->'dealership'->>'website', ''),
    nullif(p_payload->'branding'->>'logoPreview', ''),
    nullif(p_payload->'branding'->>'coverPreview', ''),
    coalesce(p_payload->'branding'->>'primaryColor', ''),
    coalesce(p_payload->'branding'->>'secondaryColor', ''),
    'completed',
    nullif(p_payload->>'subscriptionPackage', ''),
    v_now,
    v_now
  )
  on conflict (id) do update
  set business_name = excluded.business_name,
      trading_name = excluded.trading_name,
      registration_number = excluded.registration_number,
      vat_number = excluded.vat_number,
      dealer_licence_number = excluded.dealer_licence_number,
      business_type = excluded.business_type,
      physical_address = excluded.physical_address,
      province = excluded.province,
      city = excluded.city,
      postal_code = excluded.postal_code,
      gps_latitude = excluded.gps_latitude,
      gps_longitude = excluded.gps_longitude,
      telephone = excluded.telephone,
      whatsapp = excluded.whatsapp,
      email = excluded.email,
      website = excluded.website,
      logo_data_url = excluded.logo_data_url,
      cover_data_url = excluded.cover_data_url,
      primary_color = excluded.primary_color,
      secondary_color = excluded.secondary_color,
      onboarding_status = excluded.onboarding_status,
      subscription_package = excluded.subscription_package,
      completed_at = excluded.completed_at,
      updated_at = excluded.updated_at;

  select b.id
    into v_primary_branch_id
  from public.dealership_branches b
  where b.dealership_id = v_dealership_id
  order by b.created_at asc
  limit 1;

  if v_primary_branch_id is null then
    for v_branch in
      select value
      from jsonb_array_elements(coalesce(p_payload->'branches', '[]'::jsonb))
    loop
      v_branch_idx := v_branch_idx + 1;
      if v_branch_idx = 1 then
        v_branch_id := 'branch-primary-' || lower(v_dealership_id);
        v_primary_branch_id := v_branch_id;
        v_first_branch_created := true;
      else
        v_branch_id := 'branch-' || lower(v_dealership_id) || '-' || v_branch_idx::text;
      end if;

      insert into public.dealership_branches (
        id,
        dealership_id,
        name,
        address,
        province,
        city,
        postal_code,
        telephone,
        whatsapp,
        email,
        business_hours,
        branch_manager,
        updated_at
      )
      values (
        v_branch_id,
        v_dealership_id,
        coalesce(v_branch->>'branchName', ''),
        coalesce(v_branch->>'address', ''),
        coalesce(v_branch->>'province', ''),
        coalesce(v_branch->>'city', ''),
        coalesce(v_branch->>'postalCode', ''),
        coalesce(v_branch->>'telephone', ''),
        coalesce(v_branch->>'whatsapp', ''),
        coalesce(v_branch->>'email', ''),
        coalesce(v_branch->>'businessHours', ''),
        coalesce(v_branch->>'branchManager', ''),
        v_now
      )
      on conflict (id) do update
      set name = excluded.name,
          address = excluded.address,
          province = excluded.province,
          city = excluded.city,
          postal_code = excluded.postal_code,
          telephone = excluded.telephone,
          whatsapp = excluded.whatsapp,
          email = excluded.email,
          business_hours = excluded.business_hours,
          branch_manager = excluded.branch_manager,
          updated_at = excluded.updated_at;
    end loop;
  end if;

  if v_primary_branch_id is null and not v_first_branch_created then
    raise exception 'At least one branch is required for onboarding completion.';
  end if;

  insert into public.dealership_staff_memberships (
    id,
    dealership_id,
    branch_id,
    user_id,
    full_name,
    email,
    role_id,
    permissions,
    status,
    invited_at,
    accepted_at,
    updated_at
  )
  values (
    'membership-owner-' || lower(v_dealership_id),
    v_dealership_id,
    v_primary_branch_id,
    v_owner_user_id,
    coalesce(p_payload->'ownerAccount'->>'fullName', ''),
    v_owner_email,
    'owner',
    to_jsonb(array[
      'dealer:dashboard:view',
      'dealer:team:manage',
      'dealer:branches:manage',
      'dealer:billing:manage',
      'dealer:inventory:publish'
    ]::text[]),
    'active',
    v_now,
    v_now,
    v_now
  )
  on conflict (dealership_id, email) do update
  set branch_id = excluded.branch_id,
      user_id = excluded.user_id,
      full_name = excluded.full_name,
      role_id = 'owner',
      permissions = excluded.permissions,
      status = 'active',
      accepted_at = coalesce(public.dealership_staff_memberships.accepted_at, excluded.accepted_at),
      updated_at = excluded.updated_at
  returning id into v_owner_membership_id;

  for v_invite in
    select value
    from jsonb_array_elements(coalesce(p_payload->'staffInvites', '[]'::jsonb))
  loop
    v_invite_email := lower(trim(coalesce(v_invite->>'email', '')));
    if v_invite_email = '' or v_invite_email = v_owner_email then
      continue;
    end if;

    insert into public.dealership_staff_memberships (
      id,
      dealership_id,
      branch_id,
      user_id,
      full_name,
      email,
      role_id,
      permissions,
      status,
      invited_at,
      accepted_at,
      updated_at
    )
    values (
      'staff-invite-' || lower(v_dealership_id) || '-' || replace(replace(v_invite_email, '@', '-at-'), '.', '-'),
      v_dealership_id,
      v_primary_branch_id,
      null,
      coalesce(v_invite->>'fullName', ''),
      v_invite_email,
      coalesce(v_invite->>'role', 'sales-executive'),
      coalesce(v_invite->'permissions', '[]'::jsonb),
      'invited',
      v_now,
      null,
      v_now
    )
    on conflict (dealership_id, email) do update
    set branch_id = excluded.branch_id,
        full_name = excluded.full_name,
        role_id = excluded.role_id,
        permissions = excluded.permissions,
        status = case
          when public.dealership_staff_memberships.status = 'active' then public.dealership_staff_memberships.status
          else 'invited'
        end,
        updated_at = excluded.updated_at;
  end loop;

  delete from public.dealer_onboarding_drafts
  where lower(owner_email) = v_owner_email;

  return jsonb_build_object(
    'dealershipId', v_dealership_id,
    'primaryBranchId', v_primary_branch_id,
    'ownerMembershipId', v_owner_membership_id
  );
end;
$$;

grant execute on function public.complete_dealer_onboarding_atomic(jsonb) to authenticated;
