create type user_role      as enum ('customer','driver','admin');
create type van_status     as enum ('available','in_service','maintenance');
create type booking_status as enum ('pending','confirmed','assigned','en_route','completed','cancelled');

create table profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  role user_role not null default 'customer',
  on_duty boolean not null default false,
  created_at timestamptz not null default now()
);

create table vans(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class text not null check (class in ('shuttle','cruiser','mover')),
  capacity int not null,
  rate_per_km numeric(6,2) not null,
  plate text not null unique,
  status van_status not null default 'available',
  created_at timestamptz not null default now()
);

create table locations(
  id int generated always as identity primary key,
  name text not null unique,
  short_name text not null
);

create table distances(
  from_id int not null references locations(id),
  to_id   int not null references locations(id),
  km numeric(6,1) not null,
  primary key (from_id,to_id)
);

create table settings(
  id int primary key default 1 check (id = 1),
  base_fare numeric(6,2) not null default 10.00,
  free_cancel_hours int not null default 4
);

create table bookings(
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid not null references profiles(id) on delete cascade,
  driver_id uuid null references profiles(id) on delete set null,
  van_id uuid null references vans(id) on delete set null,
  pickup_id int not null references locations(id),
  dropoff_id int not null references locations(id),
  distance_km numeric(6,1) not null,
  passengers int not null check (passengers between 1 and 19),
  fare numeric(8,2) not null,
  pay_method text not null default 'cash' check (pay_method in ('cash','online')),
  paid boolean not null default false,
  status booking_status not null default 'pending',
  scheduled_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on bookings(customer_id);
create index on bookings(driver_id,status);
create index on bookings(status,scheduled_at);

-- auto-create profile on signup (reads sign-up metadata full_name, phone)
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.raw_user_meta_data->>'phone',''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table profiles  enable row level security;
alter table vans      enable row level security;
alter table locations enable row level security;
alter table distances enable row level security;
alter table settings  enable row level security;
alter table bookings  enable row level security;

create function is_admin() returns boolean language sql stable as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

create policy "profile read" on profiles for select using (
  id = auth.uid() or is_admin() or role in ('driver','customer')
);
create policy "own profile upd"   on profiles for update using (id = auth.uid() or is_admin());
create policy "vans public read"  on vans for select using (true);
create policy "vans admin write"  on vans for all using (is_admin()) with check (is_admin());
create policy "loc public read"   on locations  for select using (true);
create policy "loc admin write"   on locations  for all using (is_admin()) with check (is_admin());
create policy "dist public read"  on distances  for select using (true);
create policy "dist admin write"  on distances  for all using (is_admin()) with check (is_admin());
create policy "set public read"   on settings   for select using (true);
create policy "set admin write"   on settings   for all using (is_admin()) with check (is_admin());
create policy "booking insert own" on bookings for insert with check (customer_id = auth.uid() and status = 'pending');
create policy "booking select"     on bookings for select using (customer_id = auth.uid() or driver_id = auth.uid() or is_admin());
create policy "booking staff update" on bookings for update
  using (is_admin() or driver_id = auth.uid())
  with check (is_admin() or driver_id = auth.uid());
create policy "booking owner pre-trip update" on bookings for update
  using (customer_id = auth.uid() and status in ('pending','confirmed'))
  with check (customer_id = auth.uid()
              and status in ('pending','confirmed','cancelled'));

insert into locations(name, short_name) values
 ('Depot — City Center','City Center'),('International Airport','Airport'),
 ('North Rail Station','N. Station'),('Harbor Terminal','Harbor'),
 ('Grand Stadium','Stadium'),('Riverside Tech Park','Tech Park');

insert into distances(from_id,to_id,km)
select a.id,b.id,d.km from (values
 ('City Center','Airport',28),('City Center','N. Station',42),('City Center','Harbor',12),('City Center','Stadium',9),('City Center','Tech Park',17),
 ('Airport','N. Station',51),('Airport','Harbor',31),('Airport','Stadium',26),('Airport','Tech Park',35),
 ('N. Station','Harbor',47),('N. Station','Stadium',50),('N. Station','Tech Park',58),
 ('Harbor','Stadium',8),('Harbor','Tech Park',21),
 ('Stadium','Tech Park',14)
) as p(a,b,km)
join locations a on a.short_name = p.a join locations b on b.short_name = p.b
union all
select b.id,a.id,d.km from (values
 ('City Center','Airport',28),('City Center','N. Station',42),('City Center','Harbor',12),('City Center','Stadium',9),('City Center','Tech Park',17),
 ('Airport','N. Station',51),('Airport','Harbor',31),('Airport','Stadium',26),('Airport','Tech Park',35),
 ('N. Station','Harbor',47),('N. Station','Stadium',50),('N. Station','Tech Park',58),
 ('Harbor','Stadium',8),('Harbor','Tech Park',21),
 ('Stadium','Tech Park',14)
) as q(a,b,km)
join locations a on a.short_name = q.a join locations b on b.short_name = q.b;

insert into vans(name,class,capacity,rate_per_km,plate,status) values
 ('Shuttle Seven','shuttle',7,1.20,'VG-S-101','available'),
 ('Cruiser Twelve','cruiser',12,1.50,'VG-C-204','available'),
 ('Mover Nineteen','mover',19,2.00,'VG-M-307','available');

insert into settings(id,base_fare,free_cancel_hours) values (1,10.00,4);