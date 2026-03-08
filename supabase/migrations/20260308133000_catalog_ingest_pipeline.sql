create table if not exists public.catalog_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_feed text not null,
  mode text not null default 'manual',
  status text not null default 'running',
  received_count integer not null default 0,
  upserted_count integer not null default 0,
  deactivated_count integer not null default 0,
  request_meta jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.catalog_sync_runs enable row level security;

alter table public.catalog_items
  add column if not exists external_id text,
  add column if not exists merchant_name text,
  add column if not exists source_feed text,
  add column if not exists source_hash text,
  add column if not exists currency_code text not null default 'USD',
  add column if not exists price_amount numeric(10,2),
  add column if not exists inventory_status text not null default 'in_stock',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists last_seen_at timestamptz,
  add column if not exists last_synced_at timestamptz,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.catalog_items
set
  external_id = coalesce(external_id, slug),
  merchant_name = coalesce(merchant_name, 'Editorial Seed'),
  source_feed = coalesce(source_feed, 'seed'),
  currency_code = coalesce(currency_code, 'USD'),
  inventory_status = coalesce(inventory_status, 'in_stock'),
  metadata = coalesce(metadata, '{}'::jsonb),
  last_seen_at = coalesce(last_seen_at, created_at, timezone('utc', now())),
  last_synced_at = coalesce(last_synced_at, created_at, timezone('utc', now()))
where true;

create index if not exists idx_catalog_sync_runs_source_feed on public.catalog_sync_runs(source_feed, created_at desc);
create unique index if not exists idx_catalog_items_source_external_id
  on public.catalog_items(source_feed, external_id)
  where source_feed is not null and external_id is not null;
create index if not exists idx_catalog_items_source_feed on public.catalog_items(source_feed, active, updated_at desc);

drop trigger if exists touch_catalog_sync_runs_updated_at on public.catalog_sync_runs;
create trigger touch_catalog_sync_runs_updated_at
before update on public.catalog_sync_runs
for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_catalog_items_updated_at on public.catalog_items;
create trigger touch_catalog_items_updated_at
before update on public.catalog_items
for each row execute procedure public.touch_updated_at();

drop function if exists public.match_catalog_items(uuid, text, integer);

create function public.match_catalog_items(
  target_user_id uuid,
  desired_context text default 'discover',
  feed_limit integer default 12
)
returns table (
  id uuid,
  title text,
  category text,
  description text,
  merchant_name text,
  source_feed text,
  price_label text,
  merchant_url text,
  fit_score numeric,
  reason text,
  is_premium boolean,
  color_family text
)
language sql
security definer
set search_path = public
as $$
  with profile as (
    select
      undertone_label,
      contrast_label,
      palette_json,
      avoid_colors_json
    from public.style_profiles
    where user_id = target_user_id
    limit 1
  ),
  prepared as (
    select
      ci.id,
      ci.title,
      ci.category,
      ci.description,
      ci.merchant_name,
      ci.source_feed,
      ci.price_label,
      ci.merchant_url,
      ci.created_at,
      ci.updated_at,
      ci.inventory_status,
      ci.is_premium,
      coalesce(ci.color_family_tags[1], 'balanced neutral') as color_family,
      (
        case when exists (
          select 1 from profile p
          where p.undertone_label = any(ci.tone_labels)
        ) then 0.40 else 0.12 end
        +
        case when exists (
          select 1 from profile p
          where p.contrast_label = any(ci.contrast_labels)
        ) then 0.22 else 0.08 end
        +
        case when desired_context = any(ci.occasion_tags) then 0.12 else 0.04 end
        +
        case when 'unisex' = any(ci.gender_targets) then 0.06 else 0.03 end
        +
        case when exists (
          select 1
          from profile p,
          jsonb_array_elements_text(coalesce(p.palette_json -> 'core', '[]'::jsonb)) as palette_color(value)
          where lower(
            ci.title || ' ' || coalesce(ci.description, '') || ' ' || coalesce(ci.merchant_name, '')
          ) like '%' || lower(palette_color.value) || '%'
        ) then 0.14 else 0.05 end
        +
        case
          when coalesce(ci.inventory_status, 'in_stock') = 'in_stock' then 0.04
          when coalesce(ci.inventory_status, 'in_stock') = 'low_stock' then 0.02
          else -0.10
        end
        -
        case when exists (
          select 1
          from profile p,
          jsonb_array_elements_text(coalesce(p.avoid_colors_json, '[]'::jsonb)) as avoid_color(value)
          where lower(
            ci.title || ' ' || coalesce(ci.description, '') || ' ' || coalesce(ci.merchant_name, '')
          ) like '%' || lower(avoid_color.value) || '%'
        ) then 0.18 else 0 end
      )::numeric as fit_score
    from public.catalog_items ci
    where ci.active = true
      and coalesce(ci.inventory_status, 'in_stock') <> 'out_of_stock'
  )
  select
    prepared.id,
    prepared.title,
    prepared.category,
    prepared.description,
    prepared.merchant_name,
    prepared.source_feed,
    prepared.price_label,
    prepared.merchant_url,
    round(least(greatest(prepared.fit_score, 0.05), 0.98)::numeric, 2) as fit_score,
    case
      when prepared.fit_score >= 0.84 then 'Strong color alignment for your current style profile.'
      when prepared.fit_score >= 0.70 then 'Works best with your palette when styled with softer support tones.'
      else 'More situational; better as a secondary or context piece.'
    end as reason,
    prepared.is_premium,
    prepared.color_family
  from prepared
  order by prepared.fit_score desc, prepared.updated_at desc nulls last, prepared.created_at desc nulls last
  limit greatest(feed_limit, 1);
$$;
