create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public)
values ('selfies', 'selfies', false), ('wardrobe', 'wardrobe', false)
on conflict (id) do nothing;

create type public.analysis_status as enum ('pending_upload', 'queued', 'processing', 'completed', 'failed', 'deleted');
create type public.asset_kind as enum ('selfie', 'wardrobe');
create type public.subscription_plan as enum ('free', 'plus', 'pro');

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text default 'en',
  style_goal text,
  gender_presentation text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.photo_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  bucket text not null default 'selfies',
  storage_path text not null unique,
  kind public.asset_kind not null default 'selfie',
  content_type text,
  file_name text,
  uploaded_at timestamptz,
  retention_delete_after timestamptz not null default timezone('utc', now()) + interval '24 hours',
  status public.analysis_status not null default 'pending_upload',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.analysis_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  photo_asset_id uuid not null references public.photo_assets(id) on delete cascade,
  status public.analysis_status not null default 'queued',
  worker_job_id text,
  quality_score numeric(5,2),
  light_score numeric(5,2),
  confidence_score numeric(5,2),
  error_code text,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.style_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  undertone_label text not null,
  undertone_confidence numeric(5,2) not null,
  contrast_label text not null,
  contrast_confidence numeric(5,2) not null,
  palette_json jsonb not null default '{}'::jsonb,
  avoid_colors_json jsonb not null default '[]'::jsonb,
  fit_explanation text,
  source_analysis_session_id uuid references public.analysis_sessions(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recommendation_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  analysis_session_id uuid references public.analysis_sessions(id) on delete set null,
  context text not null default 'home',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recommendation_items (
  id uuid primary key default gen_random_uuid(),
  recommendation_set_id uuid not null references public.recommendation_sets(id) on delete cascade,
  title text not null,
  category text not null,
  reason text,
  score numeric(5,2) not null default 0,
  price_label text,
  merchant_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscription_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  plan public.subscription_plan not null default 'free',
  provider text not null default 'revenuecat',
  provider_customer_id text,
  period_ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.feedback_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  recommendation_item_id uuid references public.recommendation_items(id) on delete set null,
  analysis_session_id uuid references public.analysis_sessions(id) on delete set null,
  signal text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.delete_user_data(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.feedback_events where user_id = target_user_id;
  delete from public.recommendation_sets where user_id = target_user_id;
  delete from public.style_profiles where user_id = target_user_id;
  delete from public.analysis_sessions where user_id = target_user_id;
  delete from public.photo_assets where user_id = target_user_id;
  delete from public.subscription_states where user_id = target_user_id;
  delete from public.users where id = target_user_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', new.email))
  on conflict (id) do nothing;

  insert into public.subscription_states (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists touch_users_updated_at on public.users;
create trigger touch_users_updated_at
before update on public.users
for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_analysis_sessions_updated_at on public.analysis_sessions;
create trigger touch_analysis_sessions_updated_at
before update on public.analysis_sessions
for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_style_profiles_updated_at on public.style_profiles;
create trigger touch_style_profiles_updated_at
before update on public.style_profiles
for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_subscription_states_updated_at on public.subscription_states;
create trigger touch_subscription_states_updated_at
before update on public.subscription_states
for each row execute procedure public.touch_updated_at();

alter table public.users enable row level security;
alter table public.photo_assets enable row level security;
alter table public.analysis_sessions enable row level security;
alter table public.style_profiles enable row level security;
alter table public.recommendation_sets enable row level security;
alter table public.recommendation_items enable row level security;
alter table public.subscription_states enable row level security;
alter table public.feedback_events enable row level security;

create policy "users can manage own profile" on public.users
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "users can manage own photo assets" on public.photo_assets
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users can manage own analysis sessions" on public.analysis_sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users can read own style profile" on public.style_profiles
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users can read own recommendation sets" on public.recommendation_sets
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users can read own recommendation items" on public.recommendation_items
for select using (
  exists (
    select 1
    from public.recommendation_sets rs
    where rs.id = recommendation_items.recommendation_set_id
      and rs.user_id = auth.uid()
  )
);

create policy "users can manage own subscription state" on public.subscription_states
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users can manage own feedback events" on public.feedback_events
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_photo_assets_user_id on public.photo_assets(user_id, created_at desc);
create index if not exists idx_analysis_sessions_user_id on public.analysis_sessions(user_id, created_at desc);
create index if not exists idx_recommendation_sets_user_id on public.recommendation_sets(user_id, created_at desc);
create index if not exists idx_feedback_events_user_id on public.feedback_events(user_id, created_at desc);
