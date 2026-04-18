# Guia de Implementação — Sistema de Planos ChefBox

## 🚀 INÍCIO RÁPIDO: Execute as Migrations

**IMPORTANTE:** Antes de usar o sistema, você precisa executar as migrations no banco de dados.

### Como Executar

📖 **Veja instruções detalhadas em:** [`EXECUTE_MIGRATIONS.md`](EXECUTE_MIGRATIONS.md)

**Resumo rápido:**
1. Acesse o **SQL Editor** do Supabase Dashboard
2. Execute `supabase/migrations/005_add_yampi_transactions.sql`
3. Execute `supabase/migrations/006_add_plan_hierarchy.sql`
4. Regenere tipos: `npx supabase gen types typescript --project-id SEU_ID > lib/supabase/database.types.ts`

---

## Resumo das Mudanças Implementadas

Este documento descreve o sistema completo de planos e controle de acesso implementado no ChefBox.

---

## 1. Estrutura de Planos

### Hierarquia
```
PRO (nível 3) > BÁSICO (nível 2) > LIFETIME (nível 1)
```

### Planos Disponíveis

#### LIFETIME — R$37,00 (pagamento único)
- Acesso vitalício ao acervo fixo de receitas
- Sem geração por IA
- Sem recorrência

#### BÁSICO
- **Mensal**: R$14,90/mês (30 dias)
- **Trimestral**: R$34,90 a cada 3 meses (90 dias)
- **Anual**: R$119,90/ano (365 dias)
- Até 60 gerações de receitas por IA por mês
- Limite resetado a cada ciclo de cobrança

#### PRO
- **Mensal**: R$24,90/mês (30 dias)
- **Trimestral**: R$59,90 a cada 3 meses (90 dias)
- **Anual**: R$199,90/ano (365 dias)
- Receitas ilimitadas por IA
- Planejador alimentar semanal
- Lista de mercado inteligente
- Histórico completo
- Calculadora detalhada de macros

---

## 2. Arquivos Criados/Modificados

### Novos Arquivos

1. **`supabase/migrations/006_add_plan_hierarchy.sql`**
   - Adiciona campos de planos nas tabelas `subscriptions` e `users`
   - Cria funções auxiliares: `calculate_end_date`, `get_plan_level`, `get_recipe_limit`
   - Índices para performance

2. **`lib/access-control.ts`**
   - `canAccessFeature()` — verifica acesso granular por feature
   - `getUserPlanInfo()` — obtém informações do plano ativo
   - `incrementRecipeGeneration()` — incrementa contador (Basic)
   - `resetMonthlyGenerations()` — reseta contador mensal
   - `calculateEndDate()` — calcula expiração
   - `getRecipeLimit()` — retorna limite por plano

3. **`lib/plan-management.ts`**
   - `resolveDoublePlan()` — resolve conflitos de planos duplos
   - `cancelYampiSubscription()` — cancela na API Yampi
   - `upsertSubscription()` — cria/atualiza subscription
   - `recalculateUserActivePlan()` — recalcula plano após mudanças
   - `findOrCreateUser()` — busca ou cria usuário

### Arquivos Atualizados

1. **`lib/types.ts`**
   - Adicionados tipos: `PlanType`, `PlanPeriod`, `PlanStatus`, `Feature`
   - Interfaces: `Subscription`, `User`
   - Constantes: `YAMPI_PRODUCT_MAP`, `PLAN_LEVELS`

2. **`lib/usage.ts`**
   - Integrado com `canAccessFeature` e `getUserPlanInfo`
   - `consumeRecipeGeneration()` — usa novo sistema de hierarquia
   - `getMealPlanUsage()` — verifica acesso ao planejador (Pro only)

3. **`app/api/yampi/webhook/route.ts`**
   - Mapeamento de SKUs para planos via `YAMPI_PRODUCT_MAP`
   - Processa eventos: `order.paid`, `subscription.renewed`, `order.cancelled`, `order.refunded`, `subscription.cancelled`
   - Chama `resolveDoublePlan()` após cada novo pedido
   - Reseta gerações mensais em `subscription.renewed`

---

## 3. Mapeamento de Produtos Yampi

Configure os SKUs no painel da Yampi exatamente como abaixo:

```typescript
const YAMPI_PRODUCT_MAP = {
  "chefbox-lifetime":           { planType: "lifetime", planPeriod: "lifetime", price: 37.00 },
  "chefbox-basico-mensal":      { planType: "basic",    planPeriod: "monthly",   price: 14.90 },
  "chefbox-basico-trimestral":  { planType: "basic",    planPeriod: "quarterly", price: 34.90 },
  "chefbox-basico-anual":       { planType: "basic",    planPeriod: "annual",    price: 119.90 },
  "chefbox-pro-mensal":         { planType: "pro",      planPeriod: "monthly",   price: 24.90 },
  "chefbox-pro-trimestral":     { planType: "pro",      planPeriod: "quarterly", price: 59.90 },
  "chefbox-pro-anual":          { planType: "pro",      planPeriod: "annual",    price: 199.90 },
};
```

---

## 4. Controle de Acesso por Feature

### Features Disponíveis

```typescript
type Feature =
  | "recipe_generation"    // geração de receitas por IA
  | "planner"              // planejador semanal
  | "smart_market"         // lista de mercado inteligente
  | "recipe_history"       // histórico completo
  | "fixed_recipes"        // acervo fixo
  | "basic_macros"         // calculadora básica
  | "detailed_macros"      // macros detalhadas
  | "saved_recipes";       // salvos
```

### Matriz de Acesso

| Feature | Lifetime | Basic | Pro |
|---------|----------|-------|-----|
| `fixed_recipes` | ✅ | ✅ | ✅ |
| `basic_macros` | ✅ | ✅ | ✅ |
| `saved_recipes` | ✅ | ✅ | ✅ |
| `recipe_generation` | ❌ | ✅ (60/mês) | ✅ (ilimitado) |
| `planner` | ❌ | ❌ | ✅ |
| `smart_market` | ❌ | ❌ | ✅ |
| `recipe_history` | ❌ | ❌ | ✅ |
| `detailed_macros` | ❌ | ❌ | ✅ |

### Exemplo de Uso

```typescript
import { canAccessFeature } from "@/lib/access-control";

// Verificar acesso
const access = await canAccessFeature(userId, "planner");

if (!access.allowed) {
  return { error: access.reason, upgradeRequired: true };
}

// Prosseguir com a funcionalidade...
```

---

## 5. Webhook da Yampi

### Configuração

1. No painel da Yampi: **Configurações → Integrações → Webhooks**
2. URL: `https://seu-dominio.com/api/yampi/webhook`
3. Secret: definir em `YAMPI_WEBHOOK_SECRET`

### Eventos Processados

#### `order.paid`
- Busca ou cria usuário pelo email
- Mapeia SKU → plano usando `YAMPI_PRODUCT_MAP`
- Registra transação em `yampi_transactions`
- Cria subscription em `subscriptions`
- Chama `resolveDoublePlan()` para resolver conflitos

#### `subscription.renewed`
- Reseta contador mensal via `resetMonthlyGenerations()`

#### `order.cancelled` / `order.refunded`
- Marca subscription como `cancelled`
- Atualiza transação
- Recalcula plano ativo

#### `subscription.cancelled`
- Marca subscription como `cancelled`
- Recalcula plano ativo

---

## 6. Resolução de Planos Duplos

Quando um usuário aceita order bump ou upsell, pode ter dois planos simultaneamente.

### Lógica do `resolveDoublePlan()`

1. Busca todas as subscriptions ativas
2. Ordena por nível de plano (Pro > Basic > Lifetime)
3. Se níveis iguais, ordena por período (Anual > Trimestral > Mensal)
4. Mantém o plano de maior valor
5. Cancela os outros via API Yampi
6. Atualiza limites do usuário

### Exemplo

```
Usuário tem: Basic Mensal + Pro Mensal
Resultado: Mantém Pro Mensal, cancela Basic Mensal
```

```
Usuário tem: Pro Mensal + Pro Trimestral
Resultado: Mantém Pro Trimestral (maior período), cancela Pro Mensal
```

---

## 7. Reset Mensal de Gerações

O plano **Basic** tem limite de 60 receitas/mês. O contador reseta:

- **Via webhook**: no evento `subscription.renewed`
- **Via cron**: job diário verifica data de ciclo

### Implementação do Cron (Recomendado)

```typescript
// app/api/cron/reset-generations/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { resetMonthlyGenerations } from "@/lib/access-control";

export async function GET(request: Request) {
  // Verificar secret do cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "No admin client" }, { status: 500 });

  // Buscar usuários Basic com ciclo para resetar
  const today = new Date();
  const { data: users } = await admin
    .from("users")
    .select("id, generation_cycle_start")
    .neq("recipe_generations_limit", 0); // Basic ou Pro

  let resetCount = 0;
  
  for (const user of users || []) {
    const cycleStart = new Date(user.generation_cycle_start);
    const daysSinceCycle = Math.floor((today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Resetar se passou 30 dias
    if (daysSinceCycle >= 30) {
      await resetMonthlyGenerations(user.id);
      resetCount++;
    }
  }

  return NextResponse.json({ success: true, resetCount });
}
```

Configurar no Vercel Cron:

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/reset-generations",
    "schedule": "0 0 * * *"
  }]
}
```

---

## 8. Variáveis de Ambiente

Adicione ao `.env.local`:

```env
# Yampi
YAMPI_API_TOKEN=seu_token_aqui
YAMPI_WEBHOOK_SECRET=seu_secret_aqui
YAMPI_API_URL=https://api.yampi.io

# Cron
CRON_SECRET=gere_um_secret_aleatorio

# Supabase (já existentes)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 9. Migração de Dados Existentes

Se já existem usuários com subscriptions ativas, rode este script para migrar:

```sql
-- Atualizar subscriptions existentes para o novo formato
UPDATE public.subscriptions
SET
  plan_type = CASE
    WHEN plan LIKE '%pro%' THEN 'pro'
    WHEN plan LIKE '%basic%' OR plan LIKE '%mensal%' THEN 'basic'
    WHEN plan LIKE '%lifetime%' THEN 'lifetime'
    ELSE 'basic'
  END,
  plan_period = CASE
    WHEN plan LIKE '%anual%' THEN 'annual'
    WHEN plan LIKE '%trimestral%' THEN 'quarterly'
    WHEN plan LIKE '%mensal%' THEN 'monthly'
    WHEN plan LIKE '%lifetime%' THEN 'lifetime'
    ELSE 'monthly'
  END,
  start_date = COALESCE(created_at, NOW()),
  end_date = current_period_end
WHERE plan_type IS NULL;

-- Atualizar users com limites de geração
UPDATE public.users u
SET
  recipe_generations_limit = CASE
    WHEN EXISTS (
      SELECT 1 FROM subscriptions s 
      WHERE s.user_id = u.id 
      AND s.status = 'active' 
      AND s.plan_type = 'pro'
    ) THEN 999999
    WHEN EXISTS (
      SELECT 1 FROM subscriptions s 
      WHERE s.user_id = u.id 
      AND s.status = 'active' 
      AND s.plan_type = 'basic'
    ) THEN 60
    ELSE 0
  END,
  recipe_generations_used = 0,
  generation_cycle_start = NOW()
WHERE recipe_generations_limit = 0;
```

---

## 10. Testing Checklist

### Webhook da Yampi

- [ ] Ordem paga cria subscription corretamente
- [ ] Mapeamento de SKU funciona para todos os produtos
- [ ] `resolveDoublePlan()` cancela planos menores
- [ ] Renovação reseta contador mensal
- [ ] Cancelamento/reembolso desativa plano

### Controle de Acesso

- [ ] Lifetime acessa acervo fixo mas não gera receitas
- [ ] Basic gera até 60 receitas/mês
- [ ] Basic é bloqueado no planejador
- [ ] Pro tem acesso ilimitado a tudo
- [ ] Contador de Basic reseta no ciclo correto

### Fluxo de Upgrade

- [ ] Lifetime → Pro: mantém Pro, cancela Lifetime
- [ ] Basic → Pro: mantém Pro, cancela Basic
- [ ] Pro Mensal → Pro Trimestral: mantém Trimestral

---

## 11. UX — Componentes de Bloqueio

### Modal de Upgrade

Quando `access.allowed === false`:

```tsx
<PaywallModal
  isOpen={showPaywall}
  currentPlan={planInfo.planType}
  blockedFeature={feature}
  upgradeUrl={getUpgradeUrl(planInfo.planType)}
/>
```

### Botões Bloqueados

```tsx
<Button
  disabled={!access.allowed}
  className={!access.allowed ? "opacity-50 cursor-not-allowed" : ""}
>
  {!access.allowed && <Lock className="mr-2" />}
  Gerar Planejamento
</Button>
```

---

## 12. Monitoring & Logs

Todos os eventos importantes são logados com prefixo `[plan]`, `[yampi-webhook]`, `[usage]`, `[access]`.

### Buscar logs no Vercel:

```bash
vercel logs --follow | grep '\[plan\]'
vercel logs --follow | grep '\[yampi-webhook\]'
```

### Queries úteis no Supabase:

```sql
-- Ver planos duplos ativos
SELECT user_id, COUNT(*) as plans
FROM subscriptions
WHERE status = 'active'
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Ver usuários Basic que atingiram o limite
SELECT id, email, recipe_generations_used, recipe_generations_limit
FROM users
WHERE recipe_generations_limit = 60
AND recipe_generations_used >= 60;

-- Transações recentes da Yampi
SELECT * FROM yampi_transactions
ORDER BY created_at DESC
LIMIT 20;
```

---

## 13. Próximos Passos

1. **Frontend**: Atualizar componentes para usar `canAccessFeature`
2. **Testes**: Criar testes automatizados para webhook e resolveDoublePlan
3. **Cron**: Configurar job diário de reset no Vercel
4. **Analytics**: Adicionar tracking de conversões (Lifetime → Pro, Basic → Pro)
5. **Email**: Notificar usuário quando atingir limite (55/60 receitas)

---

## 14. Support & Troubleshooting

### Usuário não recebeu acesso após pagamento

1. Verificar webhook recebido: logs do Vercel
2. Checar `yampi_transactions`: status deve ser `paid`
3. Checar `subscriptions`: deve ter registro `active`
4. Rodar manualmente: `SELECT * FROM subscriptions WHERE user_id = '...'`

### Contador de Basic não reseta

1. Verificar `generation_cycle_start` do usuário
2. Rodar manualmente: `SELECT resetMonthlyGenerations('user_id')`
3. Verificar se cron está rodando: logs do Vercel

### Plano duplo não foi resolvido

1. Checar logs: `[plan] Checking for double plans`
2. Verificar se `resolveDoublePlan()` foi chamado após webhook
3. Rodar manualmente: `SELECT resolveDoublePlan('user_id')`

---

**Documentação atualizada em**: 17/04/2026
**Versão**: 1.0
**Autor**: Sistema de IA (Claude Sonnet 4.5)
