-- =====================================================
-- ADD TEST PLAN TYPE
-- Adiciona 'test' ao constraint de plan_type para planos de teste
-- =====================================================

-- Remover o constraint antigo
alter table public.subscriptions 
  drop constraint if exists subscriptions_plan_type_check;

-- Adicionar novo constraint com 'test' incluído
alter table public.subscriptions 
  add constraint subscriptions_plan_type_check 
  check (plan_type in ('lifetime', 'basic', 'pro', 'test'));

-- Atualizar constraint de plan_type nos users também
alter table public.users
  drop constraint if exists users_active_plan_check;

alter table public.users
  add constraint users_active_plan_check
  check (active_plan in ('lifetime', 'basic', 'pro', 'test'));

-- Comentário
comment on constraint subscriptions_plan_type_check on public.subscriptions is 
  'Tipos de plano permitidos: lifetime (vitalício), basic (60 receitas/mês), pro (ilimitado), test (para testes)';
