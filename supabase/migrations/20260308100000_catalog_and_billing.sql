create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  description text,
  price_label text,
  merchant_url text not null,
  image_url text,
  tone_labels text[] not null default '{}',
  contrast_labels text[] not null default '{}',
  color_family_tags text[] not null default '{}',
  occasion_tags text[] not null default '{}',
  gender_targets text[] not null default '{unisex}',
  is_premium boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.revenuecat_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  provider_customer_id text,
  event_type text not null,
  product_id text,
  entitlement_ids text[] not null default '{}',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.catalog_items enable row level security;
alter table public.revenuecat_events enable row level security;

create policy "authenticated users can read catalog" on public.catalog_items
for select using (auth.uid() is not null);

create policy "users can read own revenuecat events" on public.revenuecat_events
for select using (auth.uid() = user_id);

create index if not exists idx_catalog_items_active on public.catalog_items(active, created_at desc);
create index if not exists idx_revenuecat_events_user_id on public.revenuecat_events(user_id, created_at desc);

alter table public.feedback_events
  add column if not exists catalog_item_id uuid references public.catalog_items(id) on delete set null;

create or replace function public.match_catalog_items(
  target_user_id uuid,
  desired_context text default 'discover',
  feed_limit integer default 12
)
returns table (
  id uuid,
  title text,
  category text,
  description text,
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
      ci.price_label,
      ci.merchant_url,
      ci.created_at,
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
          where lower(ci.title || ' ' || coalesce(ci.description, '')) like '%' || lower(palette_color.value) || '%'
        ) then 0.14 else 0.05 end
        -
        case when exists (
          select 1
          from profile p,
          jsonb_array_elements_text(coalesce(p.avoid_colors_json, '[]'::jsonb)) as avoid_color(value)
          where lower(ci.title || ' ' || coalesce(ci.description, '')) like '%' || lower(avoid_color.value) || '%'
        ) then 0.18 else 0 end
      )::numeric as fit_score
    from public.catalog_items ci
    where ci.active = true
  )
  select
    prepared.id,
    prepared.title,
    prepared.category,
    prepared.description,
    prepared.price_label,
    prepared.merchant_url,
    round(least(greatest(prepared.fit_score, 0.05), 0.98)::numeric, 2) as fit_score,
    case
      when prepared.fit_score >= 0.82 then 'Strong color alignment for your current style profile.'
      when prepared.fit_score >= 0.68 then 'Works best with your palette when styled with softer support tones.'
      else 'More situational; better as a secondary or context piece.'
    end as reason,
    prepared.is_premium,
    prepared.color_family
  from prepared
  order by prepared.fit_score desc, prepared.created_at desc nulls last
  limit greatest(feed_limit, 1);
$$;

insert into public.catalog_items (
  slug, title, category, description, price_label, merchant_url, tone_labels, contrast_labels,
  color_family_tags, occasion_tags, gender_targets, is_premium
) values
  ('warm-navy-overshirt', 'Warm navy overshirt', 'Outerwear', 'Soft structured overshirt built for cleaner face framing.', '$88', 'https://example.com/products/warm-navy-overshirt', array['Warm Neutral'], array['Medium Contrast','High Contrast'], array['warm earthy'], array['discover','office'], array['unisex'], false),
  ('ecru-heavyweight-tee', 'Ecru heavyweight tee', 'Top', 'Better than optic white for softer warm profiles.', '$44', 'https://example.com/products/ecru-heavyweight-tee', array['Warm Neutral','Olive Soft'], array['Low Contrast','Medium Contrast'], array['muted neutral'], array['discover','casual'], array['unisex'], false),
  ('olive-dinner-knit', 'Olive dinner knit', 'Occasion', 'A refined dinner knit in an olive family that stays flattering.', '$72', 'https://example.com/products/olive-dinner-knit', array['Warm Neutral','Olive Soft'], array['Medium Contrast'], array['olive muted'], array['discover','occasion'], array['unisex'], true),
  ('cobalt-shirt-jacket', 'Cobalt shirt jacket', 'Outerwear', 'Higher contrast outer layer that reads crisp on cooler profiles.', '$112', 'https://example.com/products/cobalt-shirt-jacket', array['Cool Bright'], array['Medium Contrast','High Contrast'], array['cool crisp'], array['discover','office'], array['unisex'], true),
  ('true-white-poplin-shirt', 'True white poplin shirt', 'Top', 'Sharper white poplin for brighter cooler undertones.', '$64', 'https://example.com/products/true-white-poplin-shirt', array['Cool Bright'], array['High Contrast','Medium Contrast'], array['cool crisp'], array['discover','office'], array['unisex'], false),
  ('berry-structured-knit', 'Berry structured knit', 'Occasion', 'Structured berry knit that keeps cool skin from looking flat.', '$89', 'https://example.com/products/berry-structured-knit', array['Cool Bright'], array['Low Contrast','Medium Contrast'], array['cool crisp'], array['discover','occasion'], array['unisex'], true),
  ('moss-camp-collar', 'Moss camp collar shirt', 'Top', 'Grounded moss shirt that supports olive undertones.', '$58', 'https://example.com/products/moss-camp-collar', array['Olive Soft'], array['Low Contrast','Medium Contrast'], array['olive muted'], array['discover','casual'], array['unisex'], false),
  ('pebble-relaxed-blazer', 'Pebble relaxed blazer', 'Outerwear', 'Soft pebble blazer with lower visual harshness.', '$128', 'https://example.com/products/pebble-relaxed-blazer', array['Olive Soft','Warm Neutral'], array['Low Contrast','Medium Contrast'], array['muted neutral'], array['discover','office'], array['unisex'], true),
  ('smoked-teal-polo', 'Smoked teal polo knit', 'Occasion', 'Muted teal polo that adds depth without coldness.', '$76', 'https://example.com/products/smoked-teal-polo', array['Olive Soft','Warm Neutral'], array['Medium Contrast'], array['olive muted'], array['discover','occasion'], array['unisex'], false),
  ('ink-wool-overshirt', 'Ink wool overshirt', 'Outerwear', 'Dense ink overshirt for higher contrast cooler users.', '$138', 'https://example.com/products/ink-wool-overshirt', array['Cool Bright'], array['High Contrast'], array['cool crisp'], array['discover','office'], array['unisex'], true),
  ('stone-utility-jacket', 'Stone utility jacket', 'Outerwear', 'Stone toned utility piece for softer warm or olive wardrobes.', '$118', 'https://example.com/products/stone-utility-jacket', array['Warm Neutral','Olive Soft'], array['Low Contrast','Medium Contrast'], array['muted neutral'], array['discover','casual'], array['unisex'], false),
  ('forest-merino-layer', 'Forest merino layer', 'Occasion', 'Forest merino layer that reads refined on warmer and olive profiles.', '$92', 'https://example.com/products/forest-merino-layer', array['Warm Neutral','Olive Soft'], array['Medium Contrast','High Contrast'], array['olive muted'], array['discover','occasion'], array['unisex'], true)
on conflict (slug) do nothing;
