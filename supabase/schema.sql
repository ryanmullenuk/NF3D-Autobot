create extension if not exists pgcrypto;

create table if not exists campaign_runs (
  id uuid primary key,
  trigger text not null check (trigger in ('manual', 'schedule')),
  product_count integer not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists campaign_posts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references campaign_runs(id) on delete cascade,
  platform text not null,
  etsy_listing_id text not null,
  product_title text not null,
  status text not null,
  post_url text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists campaign_posts_listing_date on campaign_posts (etsy_listing_id, created_at desc);
alter table campaign_runs enable row level security;
alter table campaign_posts enable row level security;
