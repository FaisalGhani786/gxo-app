-- gxoeditz — core schema: profiles, packages (courses + 1-1 mentoring), lessons,
-- enrolments, lesson progress, bookings, orders, team applications, showcase
-- and site settings. Every table has Row Level Security; anything that grants
-- access or moves money goes through a SECURITY DEFINER function so the price,
-- status and ownership are decided by the database, not the browser.

-- ───────────────────────────── helpers ─────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  discord_username text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- New auth user → profile row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own profile but never promote themselves.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_admin is distinct from old.is_admin and not public.is_admin()
     and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'Only an admin can change admin rights';
  end if;
  new.email := old.email;
  return new;
end;
$$;

create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ───────────────────────────── catalogue ─────────────────────────────

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind text not null check (kind in ('course', 'mentoring')),
  title text not null,
  tagline text not null default '',
  description text not null default '',
  price_pence integer not null check (price_pence >= 0),
  currency text not null default 'gbp',
  features text[] not null default '{}',
  duration_minutes integer,           -- mentoring: length of each session
  sessions integer not null default 1, -- mentoring: sessions in the pack
  includes_discord boolean not null default false,
  bundles text[] not null default '{}', -- course: slugs of other courses unlocked with it
  highlight boolean not null default false,
  sort integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages (id) on delete cascade,
  section text not null default 'Lessons',
  title text not null,
  summary text not null default '',
  video_url text,
  duration_minutes integer,
  is_preview boolean not null default false,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
create index lessons_package_idx on public.lessons (package_id, sort);

create table public.enrolments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  package_id uuid not null references public.packages (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (user_id, package_id)
);

create table public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create or replace function public.is_enrolled(p_package uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.enrolments e where e.user_id = auth.uid() and e.package_id = p_package
  );
$$;

-- ───────────────────────────── bookings & orders ─────────────────────────────

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  package_id uuid not null references public.packages (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  notes text not null default '',
  status text not null default 'requested'
    check (status in ('requested', 'confirmed', 'completed', 'cancelled')),
  paid boolean not null default false,
  meeting_link text,
  created_at timestamptz not null default now()
);
-- One live booking per slot.
create unique index bookings_slot_unique on public.bookings (starts_at)
  where status in ('requested', 'confirmed');
create index bookings_user_idx on public.bookings (user_id, starts_at desc);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  package_id uuid not null references public.packages (id) on delete restrict,
  booking_id uuid references public.bookings (id) on delete set null,
  amount_pence integer not null,
  currency text not null default 'gbp',
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'refunded')),
  provider text not null default 'manual' check (provider in ('manual', 'stripe')),
  provider_ref text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index orders_user_idx on public.orders (user_id, created_at desc);

-- ───────────────────────────── team ─────────────────────────────

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  portfolio_url text not null,
  discord_username text not null,
  uses_premiere boolean not null,
  uses_capcut boolean not null,
  experience text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint applications_requirements check (uses_premiere and uses_capcut)
);

-- ───────────────────────────── content & settings ─────────────────────────────

create table public.showcase (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  url text not null,
  sort integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.site_settings (
  id integer primary key default 1 check (id = 1),
  editor_email text not null default 'hello@gxoeditz.com',
  whatsapp_number text not null default '',
  youtube_url text not null default 'https://www.youtube.com/@gxoeditz',
  tiktok_url text not null default '',
  instagram_url text not null default '',
  timezone text not null default 'Europe/London',
  first_slot_hour integer not null default 10 check (first_slot_hour between 0 and 23),
  last_slot_hour integer not null default 20 check (last_slot_hour between 0 and 23),
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1);

-- Kept separate: only admins can read it directly.
create table public.private_settings (
  id integer primary key default 1 check (id = 1),
  discord_invite text not null default ''
);
insert into public.private_settings (id) values (1);

-- ───────────────────────────── RLS ─────────────────────────────

alter table public.profiles enable row level security;
alter table public.packages enable row level security;
alter table public.lessons enable row level security;
alter table public.enrolments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.bookings enable row level security;
alter table public.orders enable row level security;
alter table public.applications enable row level security;
alter table public.showcase enable row level security;
alter table public.site_settings enable row level security;
alter table public.private_settings enable row level security;

create policy "own profile or admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "update own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

create policy "public catalogue" on public.packages for select
  using (active or (select public.is_admin()));
create policy "admin manages packages" on public.packages for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "preview, enrolled or admin" on public.lessons for select
  using (is_preview or (select public.is_enrolled(package_id)) or (select public.is_admin()));
create policy "admin manages lessons" on public.lessons for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "own enrolments or admin" on public.enrolments for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "admin manages enrolments" on public.enrolments for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "own progress or admin" on public.lesson_progress for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "complete own enrolled lessons" on public.lesson_progress for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.lessons l where l.id = lesson_id and public.is_enrolled(l.package_id))
  );
create policy "uncomplete own lessons" on public.lesson_progress for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "own bookings or admin" on public.bookings for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "admin manages bookings" on public.bookings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "own orders or admin" on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "own application or admin" on public.applications for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "apply once" on public.applications for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and reviewed_at is null);
create policy "admin reviews applications" on public.applications for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "public showcase" on public.showcase for select
  using (active or (select public.is_admin()));
create policy "admin manages showcase" on public.showcase for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "public settings" on public.site_settings for select using (true);
create policy "admin updates settings" on public.site_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admin private settings" on public.private_settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ───────────────────────────── RPCs ─────────────────────────────

-- Discord invite, only for course students with Discord access, approved
-- team editors, and admins.
create or replace function public.discord_invite()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  allowed boolean;
begin
  if auth.uid() is null then
    return null;
  end if;
  select public.is_admin()
      or exists (
        select 1 from public.enrolments e join public.packages p on p.id = e.package_id
        where e.user_id = auth.uid() and p.includes_discord)
      or exists (
        select 1 from public.applications a where a.user_id = auth.uid() and a.status = 'approved')
    into allowed;
  if not allowed then
    return null;
  end if;
  return (select nullif(discord_invite, '') from public.private_settings where id = 1);
end;
$$;

-- Taken slots in a window, without saying who booked them.
create or replace function public.booked_slots(p_from timestamptz, p_to timestamptz)
returns setof timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select b.starts_at from public.bookings b
  where b.status in ('requested', 'confirmed') and b.starts_at >= p_from and b.starts_at < p_to;
$$;

-- Creates a pending order at the catalogue price. The browser never sends a price.
create or replace function public.create_order(p_package_slug text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  pkg public.packages;
  order_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  select * into pkg from public.packages where slug = p_package_slug and active and kind = 'course';
  if pkg.id is null then
    raise exception 'Course not found';
  end if;
  if exists (select 1 from public.enrolments where user_id = auth.uid() and package_id = pkg.id) then
    raise exception 'You already own this course';
  end if;
  -- Reuse an open order rather than piling up duplicates.
  select id into order_id from public.orders
  where user_id = auth.uid() and package_id = pkg.id and status = 'pending' and booking_id is null
  order by created_at desc limit 1;
  if order_id is null then
    insert into public.orders (user_id, package_id, amount_pence, currency)
    values (auth.uid(), pkg.id, pkg.price_pence, pkg.currency)
    returning id into order_id;
  end if;
  return order_id;
end;
$$;

-- Requests a 1-1 slot (local date + hour in the editor's timezone) and opens
-- an order for it.
create or replace function public.request_booking(
  p_package_slug text,
  p_date date,
  p_hour integer,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  pkg public.packages;
  cfg public.site_settings;
  slot timestamptz;
  booking_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  select * into pkg from public.packages where slug = p_package_slug and active and kind = 'mentoring';
  if pkg.id is null then
    raise exception 'Session type not found';
  end if;
  select * into cfg from public.site_settings where id = 1;
  if p_hour < cfg.first_slot_hour or p_hour > cfg.last_slot_hour then
    raise exception 'That time is outside booking hours';
  end if;
  slot := (p_date + make_time(p_hour, 0, 0)) at time zone cfg.timezone;
  if slot < now() + interval '12 hours' then
    raise exception 'Please pick a slot at least 12 hours from now';
  end if;
  if slot > now() + interval '90 days' then
    raise exception 'Bookings open up to 90 days ahead';
  end if;

  begin
    insert into public.bookings (user_id, package_id, starts_at, ends_at, notes)
    values (auth.uid(), pkg.id, slot, slot + make_interval(mins => coalesce(pkg.duration_minutes, 60)),
            left(coalesce(p_notes, ''), 2000))
    returning id into booking_id;
  exception when unique_violation then
    raise exception 'Sorry, that slot has just been taken';
  end;

  insert into public.orders (user_id, package_id, booking_id, amount_pence, currency)
  values (auth.uid(), pkg.id, booking_id, pkg.price_pence, pkg.currency);
  return booking_id;
end;
$$;

-- Client cancels their own booking while it is still only a request.
create or replace function public.cancel_my_booking(p_booking uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.bookings set status = 'cancelled'
  where id = p_booking and user_id = auth.uid() and status = 'requested' and not paid;
  if not found then
    raise exception 'This booking can no longer be cancelled online — please message us';
  end if;
  update public.orders set status = 'cancelled' where booking_id = p_booking and status = 'pending';
end;
$$;

-- Marks an order paid and grants what it bought. Called by the Stripe webhook
-- (service role) or by an admin for bank transfers / cash.
create or replace function public.fulfil_order(p_order uuid, p_provider text, p_ref text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders;
  pkg public.packages;
begin
  if not (public.is_admin() or (select auth.role()) = 'service_role') then
    raise exception 'Not allowed';
  end if;
  select * into o from public.orders where id = p_order for update;
  if o.id is null then
    raise exception 'Order not found';
  end if;
  if o.status = 'paid' then
    return; -- idempotent: webhooks can be delivered twice
  end if;
  update public.orders
    set status = 'paid', paid_at = now(), provider = coalesce(p_provider, provider),
        provider_ref = coalesce(p_ref, provider_ref)
    where id = o.id;
  select * into pkg from public.packages where id = o.package_id;
  if pkg.kind = 'course' then
    insert into public.enrolments (user_id, package_id)
    select o.user_id, p.id from public.packages p
    where p.id = o.package_id or (p.kind = 'course' and p.slug = any (pkg.bundles))
    on conflict (user_id, package_id) do nothing;
  elsif o.booking_id is not null then
    update public.bookings set paid = true where id = o.booking_id;
  end if;
end;
$$;

revoke execute on function public.fulfil_order(uuid, text, text) from public, anon;
revoke execute on function public.create_order(text) from public, anon;
revoke execute on function public.request_booking(text, date, integer, text) from public, anon;
revoke execute on function public.cancel_my_booking(uuid) from public, anon;
revoke execute on function public.discord_invite() from public, anon;
