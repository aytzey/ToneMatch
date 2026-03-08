create table if not exists public.quick_check_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  photo_asset_id uuid not null references public.photo_assets(id) on delete cascade,
  label text not null,
  score numeric(5,2) not null,
  confidence numeric(5,2) not null,
  best_use text not null,
  reason text not null,
  color_family text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.quick_check_results enable row level security;

create policy "users can read own quick check results" on public.quick_check_results
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_quick_check_results_user_id on public.quick_check_results(user_id, created_at desc);

create or replace function public.delete_user_data(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.feedback_events where user_id = target_user_id;
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
