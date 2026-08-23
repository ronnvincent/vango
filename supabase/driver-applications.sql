-- ============================================================================
-- VanGo driver applications
-- Run ONCE after security-hardening.sql (Supabase Dashboard -> SQL Editor)
-- Idempotent: safe to run again.
-- Flow: anyone can APPLY from /apply -> lands as role='customer' with a
-- pending application -> admin reviews (docs + details) -> approve flips
-- their profile.role to 'driver'.
-- ============================================================================

-- 1) TABLE -------------------------------------------------------------------

create table public.driver_applications(
  id uuid primary key default gen_random_uuid(),
  applicant uuid not null unique references public.profiles(id) on delete cascade,
  license_number text not null,
  license_expiry date not null,
  years_experience int not null default 0 check (years_experience between 0 and 60),
  license_doc_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewer_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.driver_applications(status, created_at);

alter table public.driver_applications enable row level security;

create policy "apps read own/admin" on public.driver_applications
  for select to authenticated
  using (applicant = auth.uid() or is_admin());

create policy "apps insert own" on public.driver_applications
  for insert to authenticated
  with check (
    applicant = auth.uid()
    and status = 'pending'
    and not exists (
      select 1 from public.driver_applications da where da.applicant = auth.uid()
    )
  );

create policy "apps admin update" on public.driver_applications
  for update to authenticated
  using (is_admin()) with check (is_admin());
-- NOTE: no update policy for applicants — an application is sealed once submitted.

-- 2) REVIEW RPC (atomic: decision + role flip) --------------------------------

create or replace function public.admin_review_application(
  app_id uuid,
  decision text,
  note text default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  target uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if decision not in ('approved', 'rejected') then
    raise exception 'invalid decision';
  end if;

  select a.applicant into target
  from public.driver_applications a
  where a.id = app_id and a.status = 'pending';

  if target is null then
    raise exception 'application not found or already reviewed';
  end if;

  update public.driver_applications
     set status = decision,
         reviewer_note = note,
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         updated_at = now()
   where id = app_id;

  if decision = 'approved' then
    update public.profiles set role = 'driver' where id = target;
  end if;
end $$;

revoke execute on function public.admin_review_application(uuid, text, text) from public, anon;
grant  execute on function public.admin_review_application(uuid, text, text) to authenticated;

-- 3) PRIVATE STORAGE BUCKET for license documents ------------------------------

insert into storage.buckets (id, name, public)
values ('driver-docs', 'driver-docs', false)
on conflict (id) do nothing;

drop policy if exists "docs owner upload"   on storage.objects;
drop policy if exists "docs owner read"     on storage.objects;
drop policy if exists "docs admin read"     on storage.objects;
drop policy if exists "docs owner delete"   on storage.objects;

-- applicants may only touch files inside their own folder: driver-docs/<uid>/...
create policy "docs owner upload" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'driver-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "docs owner read" on storage.objects
  for select to authenticated using (
    bucket_id = 'driver-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "docs admin read" on storage.objects
  for select to authenticated using (
    bucket_id = 'driver-docs'
    and is_admin()
  );

create policy "docs owner delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'driver-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Done. Test: apply from /apply with a test account, then check
-- Table Editor -> driver_applications, and Storage -> driver-docs.
