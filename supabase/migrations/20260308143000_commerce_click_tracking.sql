create table if not exists public.commerce_click_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  catalog_item_id uuid references public.catalog_items(id) on delete set null,
  source_context text not null default 'discover',
  merchant_name text,
  source_feed text,
  product_title text,
  target_url text not null,
  resolved_url text not null,
  click_state text not null default 'pending',
  clicked_at timestamptz,
  last_attempted_at timestamptz,
  failure_reason text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'commerce_click_events_click_state_check'
  ) then
    alter table public.commerce_click_events
      add constraint commerce_click_events_click_state_check
      check (click_state = any (array['pending', 'opened', 'blocked', 'failed']));
  end if;
end
$$;

alter table public.commerce_click_events enable row level security;

create policy "users can manage own commerce click events" on public.commerce_click_events
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_commerce_click_events_user_id
  on public.commerce_click_events(user_id, created_at desc);

create index if not exists idx_commerce_click_events_catalog_item_id
  on public.commerce_click_events(catalog_item_id, created_at desc);

create index if not exists idx_commerce_click_events_source_context
  on public.commerce_click_events(source_context, click_state, created_at desc);

drop trigger if exists touch_commerce_click_events_updated_at on public.commerce_click_events;
create trigger touch_commerce_click_events_updated_at
before update on public.commerce_click_events
for each row execute procedure public.touch_updated_at();

create or replace function public.delete_user_data(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.feedback_events where user_id = target_user_id;
  delete from public.commerce_click_events where user_id = target_user_id;
  delete from public.quick_check_results where user_id = target_user_id;
  delete from public.wardrobe_items where user_id = target_user_id;
  delete from public.recommendation_sets where user_id = target_user_id;
  delete from public.style_profiles where user_id = target_user_id;
  delete from public.analysis_sessions where user_id = target_user_id;
  delete from public.photo_assets where user_id = target_user_id;
  delete from public.subscription_states where user_id = target_user_id;
  delete from public.users where id = target_user_id;
end;
$$;
