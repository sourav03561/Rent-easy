create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password text not null,
  role text not null check (role in ('STUDENT', 'OWNER', 'ADMIN')),
  created_at timestamp with time zone not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text unique,
  phone text,
  role text check (role in ('STUDENT', 'OWNER', 'ADMIN')),
  avatar_url text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('PG', 'HOSTEL', 'MESS')),
  city text not null,
  address text not null,
  price int4 not null check (price > 0),
  amenities text[] default '{}',
  photos text[] default '{}',
  available bool not null default true,
  description text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'PENDING' check (
    status in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED')
  ),
  message text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  rating int4 not null check (rating between 1 and 5),
  comment text,
  created_at timestamp with time zone not null default now(),
  unique (listing_id, student_id)
);

create index if not exists listings_city_idx on public.listings(city);
create index if not exists listings_type_idx on public.listings(type);
create index if not exists listings_price_idx on public.listings(price);
create index if not exists bookings_listing_id_idx on public.bookings(listing_id);
create index if not exists bookings_student_id_idx on public.bookings(student_id);
create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists reviews_listing_id_idx on public.reviews(listing_id);
