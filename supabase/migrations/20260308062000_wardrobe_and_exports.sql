create table if not exists public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  photo_asset_id uuid references public.photo_assets(id) on delete set null,
  name text not null,
  note text,
  color_tags text[] not null default '{}',
  fit_score numeric(5,2),
  usage_contexts text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.wardrobe_items enable row level security;

create policy "users can manage own wardrobe items" on public.wardrobe_items
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_wardrobe_items_user_id on public.wardrobe_items(user_id, created_at desc);

drop trigger if exists touch_wardrobe_items_updated_at on public.wardrobe_items;
create trigger touch_wardrobe_items_updated_at
before update on public.wardrobe_items
for each row execute procedure public.touch_updated_at();
