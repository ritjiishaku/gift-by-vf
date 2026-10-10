-- Gifts by VF — initial schema
-- Run in the Supabase SQL editor (or via supabase db push).
-- All access is server-side with the service role key, so RLS is enabled
-- with NO policies: the anon key can read nothing.

create table if not exists site_settings (
  key text primary key,
  value text
);

create table if not exists products (
  id bigint generated always as identity primary key,
  slug text unique,
  name text not null,
  description text,
  image_url text,
  video_url text,
  price text,
  category text,
  subcategory text,
  product_type text,
  display_order int,
  is_visible boolean default true,
  in_stock boolean default true,
  stock_label text,
  occasion text,
  featured boolean default false,
  material text,
  size text,
  turnaround text,
  delivery_note text,
  payment_note text,
  sales_caption text,
  icon text,
  created_at timestamptz default now()
);

create table if not exists sales_reps (
  id bigint generated always as identity primary key,
  rep_id text unique not null,
  name text,
  commission_rate numeric,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists payouts (
  id bigint generated always as identity primary key,
  rep_id text,
  product text,
  order_amount numeric,
  commission numeric,
  status text,
  date text,
  created_at timestamptz default now()
);

create table if not exists testimonials (
  id bigint generated always as identity primary key,
  name text,
  quote text,
  source text,
  rating int,
  display_order int,
  is_visible boolean default true
);

create table if not exists portfolio (
  id bigint generated always as identity primary key,
  image_url text,
  caption text,
  category text,
  is_wide boolean default false,
  display_order int,
  is_visible boolean default true
);

create table if not exists why_us (
  id bigint generated always as identity primary key,
  heading text,
  title text,
  description text,
  icon text,
  display_order int,
  is_visible boolean default true
);

create table if not exists how_to_order (
  id bigint generated always as identity primary key,
  title text,
  description text,
  display_order int,
  is_visible boolean default true
);

create table if not exists faqs (
  id bigint generated always as identity primary key,
  question text,
  answer text,
  display_order int,
  is_visible boolean default true
);

-- Enable RLS everywhere with no policies (deny-all for anon/authenticated).
-- The server uses the service role key, which bypasses RLS.
alter table site_settings enable row level security;
alter table products enable row level security;
alter table sales_reps enable row level security;
alter table payouts enable row level security;
alter table testimonials enable row level security;
alter table portfolio enable row level security;
alter table why_us enable row level security;
alter table how_to_order enable row level security;
alter table faqs enable row level security;
