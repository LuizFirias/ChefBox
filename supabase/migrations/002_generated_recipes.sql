-- Tabela para armazenar histórico de receitas geradas
create table if not exists public.generated_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  recipe_id text not null,
  title text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- Índices para melhorar performance de consultas
create index if not exists generated_recipes_user_id_idx on public.generated_recipes (user_id);
create index if not exists generated_recipes_created_at_idx on public.generated_recipes (created_at desc);

-- RLS políticas
alter table public.generated_recipes enable row level security;

drop policy if exists "Users can read own generated recipes" on public.generated_recipes;
create policy "Users can read own generated recipes"
on public.generated_recipes for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own generated recipes" on public.generated_recipes;
create policy "Users can insert own generated recipes"
on public.generated_recipes for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own generated recipes" on public.generated_recipes;
create policy "Users can delete own generated recipes"
on public.generated_recipes for delete
using (auth.uid() = user_id);
