-- =====================================================
-- YAMPI INTEGRATION - TRANSACTIONS & SUBSCRIPTIONS
-- =====================================================

-- Tabela de transações Yampi
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

-- Atualizar tabela de subscriptions para suportar Yampi
alter table public.subscriptions 
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists metadata jsonb default '{}';

-- Função para ativar Premium ao receber pagamento
create or replace function public.activate_premium_on_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  subscription_duration interval;
  new_period_end timestamptz;
begin
  -- Só ativa se o status for 'paid'
  if new.status = 'paid' and old.status != 'paid' then
    
    -- Define duração baseado no plano
    case new.plan_id
      when 'mensal' then subscription_duration := interval '1 month';
      when 'trimestral' then subscription_duration := interval '3 months';
      when 'anual' then subscription_duration := interval '1 year';
      else subscription_duration := interval '1 month';
    end case;
    
    new_period_end := now() + subscription_duration;
    
    -- Atualiza ou cria subscription
    insert into public.subscriptions (
      user_id,
      provider,
      plan,
      status,
      current_period_end,
      provider_subscription_id,
      metadata
    ) values (
      new.user_id,
      'yampi',
      new.plan_id,
      'active',
      new_period_end,
      new.yampi_order_id,
      new.metadata
    )
    on conflict (user_id) do update
    set
      status = 'active',
      current_period_end = new_period_end,
      provider = 'yampi',
      plan = excluded.plan,
      provider_subscription_id = excluded.provider_subscription_id,
      metadata = excluded.metadata,
      updated_at = now();
      
    raise notice 'Premium ativado para user_id: % até %', new.user_id, new_period_end;
  end if;
  
  return new;
end;
$$;

-- Trigger para ativar premium automaticamente
drop trigger if exists on_yampi_payment_paid on public.yampi_transactions;
create trigger on_yampi_payment_paid
  after update on public.yampi_transactions
  for each row
  when (new.status = 'paid')
  execute function public.activate_premium_on_payment();

-- Índices para performance
create index if not exists idx_yampi_transactions_user_id on public.yampi_transactions(user_id);
create index if not exists idx_yampi_transactions_status on public.yampi_transactions(status);
create index if not exists idx_yampi_transactions_yampi_id on public.yampi_transactions(yampi_transaction_id);
create index if not exists idx_subscriptions_user_provider on public.subscriptions(user_id, provider);

-- Row Level Security
alter table public.yampi_transactions enable row level security;

create policy "Users can view own transactions"
  on public.yampi_transactions for select
  using (auth.uid() = user_id);

create policy "Service role can manage all transactions"
  on public.yampi_transactions for all
  using (auth.role() = 'service_role');

-- Comentários
comment on table public.yampi_transactions is 'Armazena transações de pagamento da Yampi';
comment on column public.yampi_transactions.yampi_transaction_id is 'ID único da transação na Yampi';
comment on column public.yampi_transactions.status is 'Status: pending, paid, cancelled, refunded, expired';
comment on column public.yampi_transactions.plan_id is 'Identificador do plano: mensal, trimestral, anual';
