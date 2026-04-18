-- =====================================================
-- MERCADO PAGO INTEGRATION - CHECKOUT TRANSPARENTE
-- Adiciona suporte para assinaturas recorrentes via MP
-- =====================================================

-- Adicionar campo para armazenar ID de assinatura do Mercado Pago
alter table public.subscriptions 
  add column if not exists mp_subscription_id text unique;

-- Adicionar campo para armazenar plano ativo e período nos usuários
-- (caso não tenha sido adicionado anteriormente)
alter table public.users
  add column if not exists active_plan text check (active_plan in ('lifetime', 'basic', 'pro')),
  add column if not exists plan_period text check (plan_period in ('lifetime', 'monthly', 'quarterly', 'annual')),
  add column if not exists plan_status text check (plan_status in ('active', 'expired', 'cancelled')) default 'expired',
  add column if not exists plan_end_date timestamptz;

-- Índice para melhorar performance de consultas por mp_subscription_id
create index if not exists idx_subscriptions_mp_subscription_id 
  on public.subscriptions(mp_subscription_id) 
  where mp_subscription_id is not null;

-- Comentários para documentação
comment on column public.subscriptions.mp_subscription_id is 'ID da assinatura recorrente no Mercado Pago';
comment on column public.users.active_plan is 'Plano ativo atual do usuário (baseado em hierarquia)';
comment on column public.users.plan_status is 'Status do plano: active, expired ou cancelled';
comment on column public.users.plan_end_date is 'Data de expiração do plano atual';
