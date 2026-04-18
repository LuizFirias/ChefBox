create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  weight text,
  height text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  subject_key text not null,
  usage_date date not null default current_date,
  used_count integer not null default 0,
  limit_count integer not null default 4,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_key, usage_date)
);

create table if not exists public.saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  payload jsonb not null,
  settings jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null default 'stripe',
  plan text not null default 'pro',
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  meal_date date not null default current_date,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'snack', 'dinner')),
  items jsonb not null,
  total_calories integer not null,
  total_protein_g numeric(6,2) not null,
  total_carbs_g numeric(6,2) not null,
  total_fat_g numeric(6,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, meal_date, meal_type)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;
alter table public.usage_limits enable row level security;
alter table public.saved_recipes enable row level security;
alter table public.saved_meal_plans enable row level security;
alter table public.subscriptions enable row level security;

create index if not exists idx_saved_meal_plans_user_id on public.saved_meal_plans(user_id, created_at desc);

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
on public.users for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users for update
using (auth.uid() = id);

drop policy if exists "Users can read own usage" on public.usage_limits;
create policy "Users can read own usage"
on public.usage_limits for select
using (auth.uid() = user_id);

drop policy if exists "Users can read own saved recipes" on public.saved_recipes;
create policy "Users can read own saved recipes"
on public.saved_recipes for select
using (auth.uid() = user_id);

drop policy if exists "Users can write own saved recipes" on public.saved_recipes;
create policy "Users can write own saved recipes"
on public.saved_recipes for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own saved recipes" on public.saved_recipes;
create policy "Users can delete own saved recipes"
on public.saved_recipes for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own meal plans" on public.saved_meal_plans;
create policy "Users can read own meal plans"
on public.saved_meal_plans for select
using (auth.uid() = user_id);

drop policy if exists "Users can write own meal plans" on public.saved_meal_plans;
create policy "Users can write own meal plans"
on public.saved_meal_plans for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own meal plans" on public.saved_meal_plans;
create policy "Users can update own meal plans"
on public.saved_meal_plans for update
using (auth.uid() = user_id);

drop policy if exists "Users can delete own meal plans" on public.saved_meal_plans;
create policy "Users can delete own meal plans"
on public.saved_meal_plans for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own subscriptions" on public.subscriptions;
create policy "Users can read own subscriptions"
on public.subscriptions for select
using (auth.uid() = user_id);