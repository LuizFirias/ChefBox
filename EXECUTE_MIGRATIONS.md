# 🚀 Como Executar as Migrations

Como o projeto local não está linkado ao Supabase, execute as migrations manualmente no dashboard.

## 📋 Passo a Passo

### 1. Acesse o SQL Editor do Supabase

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto **ChefBox**
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New query**

### 2. Execute a Migration 005 (Yampi Transactions)

**Arquivo:** `supabase/migrations/005_add_yampi_transactions.sql`

1. Abra o arquivo no VS Code
2. Copie **TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Verifique se apareceu "Success" ✅

### 3. Execute a Migration 006 (Plan Hierarchy)

**Arquivo:** `supabase/migrations/006_add_plan_hierarchy.sql`

1. Abra o arquivo no VS Code
2. Copie **TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Verifique se apareceu "Success" ✅

### 4. Regenere os Tipos TypeScript

Volte ao terminal e execute:

```powershell
# Substitua YOUR_PROJECT_ID pelo ID do seu projeto (visível na URL do dashboard)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
```

**Como encontrar o PROJECT_ID:**
- Na URL do dashboard: `https://supabase.com/dashboard/project/[ESTE_É_O_ID]/...`
- Ou em: **Settings** → **General** → **Project URL**

### 5. Verifique se Funcionou

Execute este teste rápido no SQL Editor:

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('yampi_transactions', 'subscriptions', 'users');

-- Verificar se as colunas novas existem
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND column_name IN ('plan_type', 'plan_period', 'yampi_subscription_id');
```

Você deve ver 3 tabelas e 3 colunas listadas. ✅

---

## 🔗 Alternativa: Linkar o Projeto (Opcional)

Se preferir usar a CLI do Supabase no futuro:

```powershell
# 1. Instalar CLI globalmente (se ainda não tiver)
npm install -g supabase

# 2. Login
supabase login

# 3. Linkar projeto
supabase link --project-ref YOUR_PROJECT_ID

# 4. Agora 'supabase db push' funcionará
supabase db push
```

---

## ⚠️ Troubleshooting

### Erro: "relation already exists"

Algumas partes das migrations já foram executadas. Isso é normal se você rodou scripts SQL antes.

**Solução:** Continue executando - o `IF NOT EXISTS` previne duplicações.

### Erro: "permission denied"

Você precisa ser **Owner** do projeto no Supabase.

**Solução:** Verifique suas permissões em **Settings** → **Team**

### Erro: "column already exists"

A migration 006 já foi parcialmente executada.

**Solução:** Execute este SQL para limpar:

```sql
-- Reverter as alterações (apenas se necessário)
ALTER TABLE subscriptions 
  DROP COLUMN IF EXISTS plan_type,
  DROP COLUMN IF EXISTS plan_period,
  DROP COLUMN IF EXISTS yampi_subscription_id;

ALTER TABLE users
  DROP COLUMN IF EXISTS recipe_generations_used,
  DROP COLUMN IF EXISTS recipe_generations_limit,
  DROP COLUMN IF EXISTS generation_cycle_start;
```

Depois execute a migration 006 novamente.

---

## ✅ Checklist Final

- [ ] Migration 005 executada (yampi_transactions criada)
- [ ] Migration 006 executada (colunas de plano adicionadas)
- [ ] Tipos regenerados (`database.types.ts` atualizado)
- [ ] Verificação SQL rodada com sucesso
- [ ] Erros de tipo no VS Code desapareceram

**Depois disso, o sistema de planos estará 100% funcional!** 🎉
