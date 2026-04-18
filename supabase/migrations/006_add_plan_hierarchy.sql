-- =====================================================
-- PLAN HIERARCHY & USAGE LIMITS
-- Implementa hierarquia de planos: lifetime < basic < pro
-- =====================================================

-- Adicionar campos de controle de plano detalhado na tabela subscriptions
alter table public.subscriptions 
  add column if not exists plan_type text check (plan_type in ('lifetime', 'basic', 'pro')),
  add column if not exists plan_period text check (plan_period in ('lifetime', 'monthly', 'quarterly', 'annual')),
  add column if not exists yampi_subscription_id text unique,
  add column if not exists price decimal(10,2),
  add column if not exists start_date timestamptz default now(),
  add column if not exists end_date timestamptz,
  add column if not exists cancelled_at timestamptz;

-- Adicionar campos de controle mensal de geração nos usuários
alter table public.users
  add column if not exists recipe_generations_used integer not null default 0,
  add column if not exists recipe_generations_limit integer not null default 0,
  add column if not exists generation_cycle_start timestamptz,
  add column if not exists yampi_customer_id text;

-- Criar tabela yampi_transactions se não existir (caso migration 005 não tenha rodado)
create table if not exists public.yampi_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  
  -- Dados da Yampi
  yampi_transaction_id text unique not null,
  yampi_order_id text,
  yampi_customer_id text,
  
  -- Dados do plano
  plan_id text not null,
  plan_name text not null,
  amount decimal(10,2) not null,
  currency text default 'BRL',
  
  -- Status da transação
  status text not null check (status in ('pending', 'paid', 'cancelled', 'refunded', 'expired')),
  payment_method text,
  
  -- Datas
  paid_at timestamptz,
  expires_at timestamptz,
  
  -- Metadata
  metadata jsonb default '{}',
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Atualizar tabela de transactions para separar melhor os campos
alter table public.yampi_transactions
  add column if not exists plan_type text check (plan_type in ('lifetime', 'basic', 'pro')),
  add column if not exists plan_period text check (plan_period in ('lifetime', 'monthly', 'quarterly', 'annual'));

-- Função para calcular data de expiração baseada no período
create or replace function calculate_end_date(
  period text,
  start_date timestamptz default now()
) returns timestamptz
language plpgsql
immutable
as $$
begin
  case period
    when 'monthly' then return start_date + interval '30 days';
    when 'quarterly' then return start_date + interval '90 days';
    when 'annual' then return start_date + interval '365 days';
    when 'lifetime' then return null; -- sem expiração
    else return start_date + interval '30 days';
  end case;
end;
$$;

-- Função para obter nível do plano (para comparação)
create or replace function get_plan_level(plan_type text) 
returns integer
language plpgsql
immutable
as $$
begin
  case plan_type
    when 'lifetime' then return 1;
    when 'basic' then return 2;
    when 'pro' then return 3;
    else return 0;
  end case;
end;
$$;

-- Função para obter limite de receitas baseado no plano
create or replace function get_recipe_limit(plan_type text)
returns integer
language plpgsql
immutable
as $$
begin
  case plan_type
    when 'pro' then return 999999; -- ilimitado
    when 'basic' then return 60;
    when 'lifetime' then return 0; -- sem IA
    else return 0;
  end case;
end;
$$;

-- Índices para melhorar performance
create index if not exists idx_subscriptions_user_status 
  on public.subscriptions(user_id, status) 
  where status = 'active';

create index if not exists idx_subscriptions_plan_type 
  on public.subscriptions(plan_type);

create index if not exists idx_yampi_transactions_user 
  on public.yampi_transactions(user_id, created_at desc);

create index if not exists idx_users_yampi_customer 
  on public.users(yampi_customer_id) 
  where yampi_customer_id is not null;

-- Comentários para documentação
comment on column public.subscriptions.plan_type is 'Tipo do plano: lifetime, basic ou pro';
comment on column public.subscriptions.plan_period is 'Período: lifetime, monthly, quarterly ou annual';
comment on column public.users.recipe_generations_used is 'Contador de receitas geradas no ciclo atual';
comment on column public.users.recipe_generations_limit is 'Limite de receitas para o plano atual';
comment on column public.users.generation_cycle_start is 'Data de início do ciclo atual de gerações';

-- Row Level Security para yampi_transactions (caso migration 005 não tenha rodado)
alter table public.yampi_transactions enable row level security;

drop policy if exists "Users can view own transactions" on public.yampi_transactions;
create policy "Users can view own transactions"
  on public.yampi_transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage all transactions" on public.yampi_transactions;
create policy "Service role can manage all transactions"
  on public.yampi_transactions for all
  using (auth.role() = 'service_role');
