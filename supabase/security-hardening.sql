-- ============================================================================
-- VanGo security hardening
-- Run this ONCE against the database created by schema.sql
-- (Supabase Dashboard -> SQL Editor -> paste -> Run)
-- Idempotent: safe to run again.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) PROFILES: block privilege escalation
-- Before: "own profile upd" let any user rewrite their OWN row, including
-- role -> 'admin'. Now users may only edit full_name + phone (column grants);
-- role / on_duty changes go through admin-only RPCs below.
-- ----------------------------------------------------------------------------

revoke update on table public.profiles from authenticated;
grant update (full_name, phone) on table public.profiles to authenticated;

drop policy if exists "own profile upd" on public.profiles;
create policy "own profile upd" on public.profiles
  for update to authenticated
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- Harden is_admin(): fixed search_path, definer so policies can't recurse
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

-- Admin-only RPCs (replace direct column writes to role / on_duty)
create or replace function public.admin_set_role(target uuid, new_role public.user_role)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if target = auth.uid() then
    raise exception 'admins cannot change their own role';
  end if;
  update public.profiles set role = new_role where id = target;
end $$;

create or replace function public.admin_set_duty(target uuid, duty boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  update public.profiles set on_duty = duty
  where id = target and role = 'driver';
end $$;

revoke execute on function public.admin_set_role(uuid, public.user_role) from public, anon;
revoke execute on function public.admin_set_duty(uuid, boolean)          from public, anon;
grant  execute on function public.admin_set_role(uuid, public.user_role) to authenticated;
grant  execute on function public.admin_set_duty(uuid, boolean)          to authenticated;

-- ----------------------------------------------------------------------------
-- 2) BOOKINGS: enforce who may change what
-- Before: customers could rewrite ANY column of their pending/confirmed
-- booking (fare -> $0.01!) and drivers could rewrite any column of trips
-- assigned to them. This trigger whitelists every allowed transition.
-- ----------------------------------------------------------------------------

create or replace function public.enforce_booking_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  actor uuid := auth.uid();
  actor_role public.user_role;
begin
  if actor is null then
    raise exception 'authentication required';
  end if;

  select p.role into actor_role from public.profiles p where p.id = actor;

  -- ADMINS: full control
  if actor_role = 'admin' then
    new.updated_at := now();
    return new;
  end if;

  -- CUSTOMER: may only CONFIRM (pending -> confirmed, setting pay_method)
  -- or CANCEL (pending/confirmed -> cancelled). All other fields are locked.
  if old.customer_id = actor then
    if new.customer_id     <> old.customer_id
       or new.reference    <> old.reference
       or new.driver_id    is distinct from old.driver_id
       or new.van_id       is distinct from old.van_id
       or new.pickup_id    <> old.pickup_id
       or new.dropoff_id   <> old.dropoff_id
       or new.distance_km  <> old.distance_km
       or new.passengers   <> old.passengers
       or new.fare         <> old.fare
       or new.scheduled_at <> old.scheduled_at
       or new.paid         is distinct from old.paid then
      raise exception 'booking details are locked after creation';
    end if;

    if (old.status = 'pending' and new.status = 'confirmed')
       or (old.status in ('pending','confirmed') and new.status = 'cancelled') then
      new.updated_at := now();
      return new;
    end if;

    raise exception 'booking cannot move from % to %', old.status, new.status;
  end if;

  -- DRIVER: may only progress trips assigned to them,
  -- and may mark paid ONLY when completing a cash trip.
  if old.driver_id = actor then
    if new.customer_id   <> old.customer_id
       or new.reference  <> old.reference
       or new.driver_id  is distinct from old.driver_id
       or new.van_id     is distinct from old.van_id
       or new.pickup_id  <> old.pickup_id
       or new.dropoff_id <> old.dropoff_id
       or new.distance_km  <> old.distance_km
       or new.passengers <> old.passengers
       or new.fare       <> old.fare
       or new.scheduled_at <> old.scheduled_at
       or new.pay_method <> old.pay_method then
      raise exception 'trip details are managed by dispatch';
    end if;

    if old.status = 'assigned'
       and new.status = 'en_route'
       and new.paid is not distinct from old.paid then
      new.updated_at := now();
      return new;
    end if;

    if old.status = 'en_route'
       and new.status = 'completed'
       and (new.paid is not distinct from old.paid
            or (new.paid is true and old.pay_method = 'cash')) then
      new.updated_at := now();
      return new;
    end if;

    raise exception 'trip cannot move from % to %', old.status, new.status;
  end if;

  raise exception 'you do not have permission to modify this booking';
end $$;

drop trigger if exists booking_guard on public.bookings;
create trigger booking_guard before update on public.bookings
  for each row execute function public.enforce_booking_guard();

-- ----------------------------------------------------------------------------
-- 3) BOOKINGS: sanity-check new rows
-- The client prices the quote, so bound what it can insert: fare must sit
-- between the flat base fare and the most expensive possible trip, and the
-- pickup must be in the future.
-- ----------------------------------------------------------------------------

create or replace function public.validate_new_booking()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  base_fare numeric;
  max_fare  numeric;
  max_km    numeric;
  top_rate  numeric;
begin
  select s.base_fare into base_fare from public.settings s where s.id = 1;
  select max(d.km) into max_km from public.distances d;
  select max(v.rate_per_km) into top_rate from public.vans v;

  max_fare := base_fare + coalesce(max_km, 0) * coalesce(top_rate, 0);

  if new.fare < base_fare or new.fare > max_fare then
    raise exception 'fare out of allowed range';
  end if;

  if new.scheduled_at <= now() then
    raise exception 'pickup time must be in the future';
  end if;

  return new;
end $$;

drop trigger if exists booking_insert_check on public.bookings;
create trigger booking_insert_check before insert on public.bookings
  for each row execute function public.validate_new_booking();

-- Done. Verify in Supabase: Database -> Policies should show the recreated
-- "own profile upd"; try updating your own profiles.role via the API —
-- it must fail with a permission error.
