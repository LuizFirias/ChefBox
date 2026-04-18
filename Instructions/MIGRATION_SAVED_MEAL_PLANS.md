# Migração: Salvamento de Planejamentos de Refeições

## 📋 Resumo

Implementado sistema de persistência de planejamentos de refeições salvos no Supabase, substituindo o uso exclusivo de localStorage por uma solução híbrida com:

- **Usuários autenticados**: Dados salvos no Supabase (sincronizam entre dispositivos)
- **Usuários não autenticados**: Fallback para localStorage (dados locais apenas)

## 🗄️ Mudanças no Banco de Dados

### Nova Tabela: `saved_meal_plans`

```sql
CREATE TABLE public.saved_meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- Nome do planejamento
  payload JSONB NOT NULL,                -- Todo o MealPlanResponse
  settings JSONB NOT NULL,               -- MealPlanSettings (calorias, dias, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Índices
- `idx_saved_meal_plans_user_id` - Para queries rápidas por usuário

### Row Level Security (RLS)
- Usuários podem **ler, inserir, atualizar e deletar** apenas seus próprios planejamentos
- Políticas baseadas em `auth.uid() = user_id`

## 📁 Arquivos Criados/Modificados

### Criados
1. **`supabase/migrations/002_add_saved_meal_plans.sql`**
   - Migration completa com tabela, índices e políticas RLS

2. **`app/api/saved-meal-plans/route.ts`**
   - GET: Buscar todos os planejamentos do usuário
   - POST: Salvar novo planejamento
   - DELETE: Remover planejamento (query param `?id=`)
   - PATCH: Atualizar nome do planejamento

### Modificados
1. **`supabase/schema.sql`**
   - Adicionada definição da tabela `saved_meal_plans`
   - Adicionadas políticas RLS e índice

2. **`lib/supabase/db.ts`**
   - `saveMealPlan()`: Salvar planejamento no Supabase
   - `getUserSavedMealPlans()`: Buscar todos os planejamentos do usuário
   - `deleteSavedMealPlan()`: Deletar planejamento
   - `updateSavedMealPlan()`: Atualizar nome do planejamento

3. **`lib/app-storage.ts`**
   - Atualizado tipo `SavedMealPlan` para incluir campo `name`
   - Funções localStorage mantidas como fallback
   - Documentação indicando uso de API para usuários logados

4. **`components/meal-plan-page.tsx`**
   - `handleSavePlan()`: Agora usa API `/api/saved-meal-plans`
   - Fallback automático para localStorage se usuário não estiver logado
   - Gera nome padrão: "Planejamento DD/MM/AAAA"

5. **`components/home/home-screen.tsx`**
   - `useEffect`: Carrega planejamentos da API com fallback para localStorage
   - `handleRemoveSavedMealPlan()`: Usa API DELETE com fallback
   - Conversão automática de formato API → SavedMealPlan

## 🚀 Como Aplicar a Migração

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# 1. Navegar para a pasta do projeto
cd chefbox

# 2. Aplicar migration
supabase db push

# Ou, se estiver usando migrations locais:
supabase migration up
```

### Opção 2: Via Dashboard do Supabase

1. Acessar [Supabase Dashboard](https://app.supabase.com)
2. Selecionar seu projeto ChefBox
3. Ir em **SQL Editor**
4. Copiar e executar o conteúdo de `supabase/migrations/002_add_saved_meal_plans.sql`
5. Verificar tabela criada em **Table Editor** → `saved_meal_plans`

### Opção 3: SQL Direto (Desenvolvimento)

```sql
-- Executar diretamente no SQL Editor do Supabase
-- (conteúdo do arquivo 002_add_saved_meal_plans.sql)
```

## 🔍 Verificação Pós-Migração

### 1. Verificar Tabela
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'saved_meal_plans';
```

### 2. Verificar Políticas RLS
```sql
SELECT * FROM pg_policies WHERE tablename = 'saved_meal_plans';
```
Deve retornar 4 políticas (SELECT, INSERT, UPDATE, DELETE)

### 3. Verificar Índice
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'saved_meal_plans';
```

### 4. Testar Insert Manual
```sql
-- Substituir USER_ID_AQUI pelo UUID de um usuário de teste
INSERT INTO public.saved_meal_plans (user_id, name, payload, settings)
VALUES (
  'USER_ID_AQUI',
  'Teste Migration',
  '{"plan":[],"shoppingList":[],"prepPlan":[],"estimatedCost":"R$ 0"}',
  '{"calories":2000,"meals":["lunch"],"goal":"manutenção","days":7}'
);

-- Buscar o registro
SELECT * FROM public.saved_meal_plans WHERE name = 'Teste Migration';

-- Deletar o teste
DELETE FROM public.saved_meal_plans WHERE name = 'Teste Migration';
```

## 📊 Fluxo de Dados

### Salvar Planejamento

```
Usuário clica "💾 Salvar"
    ↓
MealPlanPage.handleSavePlan()
    ↓
POST /api/saved-meal-plans
    ↓
├─ Autenticado? 
│  ├─ SIM → saveMealPlan(supabase, userId, name, payload, settings)
│  │         └─ INSERT INTO saved_meal_plans
│  │         └─ Retorna { success: true, id: UUID }
│  │
│  └─ NÃO → Status 401
│            └─ Fallback: saveMealPlanToSaved() → localStorage
    ↓
Mensagem: "✅ Planejamento salvo com sucesso!"
```

### Carregar Planejamentos

```
HomeScreen.useEffect()
    ↓
GET /api/saved-meal-plans
    ↓
├─ Autenticado?
│  ├─ SIM → getUserSavedMealPlans(supabase, userId)
│  │         └─ SELECT * FROM saved_meal_plans WHERE user_id = $1
│  │         └─ Retorna { plans: [...] }
│  │         └─ Converte para SavedMealPlan[]
│  │
│  └─ NÃO → Status 401
│            └─ Fallback: getSavedMealPlans() → localStorage
    ↓
setSavedMealPlans(plans)
```

### Deletar Planejamento

```
Usuário clica "Remover"
    ↓
HomeScreen.handleRemoveSavedMealPlan(planId)
    ↓
DELETE /api/saved-meal-plans?id={planId}
    ↓
├─ Autenticado?
│  ├─ SIM → deleteSavedMealPlan(supabase, userId, planId)
│  │         └─ DELETE FROM saved_meal_plans WHERE id = $1 AND user_id = $2
│  │         └─ Retorna { success: true }
│  │
│  └─ NÃO → Status 401
│            └─ Fallback: removeSavedMealPlan(planId) → localStorage
    ↓
Remove do state local
```

## 🔐 Segurança

### Row Level Security (RLS)
- ✅ Habilitado em `saved_meal_plans`
- ✅ SELECT: Usuário vê apenas seus próprios planejamentos
- ✅ INSERT: Usuário cria apenas com seu próprio `user_id`
- ✅ UPDATE: Usuário atualiza apenas seus próprios planejamentos
- ✅ DELETE: Usuário deleta apenas seus próprios planejamentos

### Validação
- ✅ Autenticação obrigatória em todas as rotas da API
- ✅ `user_id` sempre extraído de `auth.uid()` (não do body)
- ✅ JSONB validado no insert (campos obrigatórios: name, payload, settings)

## 🧪 Testes Manuais

### 1. Teste de Salvamento
1. Fazer login no ChefBox
2. Gerar um planejamento de refeições
3. Clicar em "💾 Salvar"
4. Verificar mensagem de sucesso
5. Abrir aba "Salvos" → "Planejamentos"
6. Confirmar que o planejamento aparece

### 2. Teste de Sincronização
1. Salvar planejamento no Desktop
2. Fazer login no Mobile (mesmo usuário)
3. Abrir aba "Salvos" → "Planejamentos"
4. Confirmar que o planejamento aparece

### 3. Teste de Deleção
1. Na aba "Salvos" → "Planejamentos"
2. Clicar em "Remover" em um planejamento
3. Confirmar que desaparece da lista
4. Verificar no Supabase Dashboard que foi deletado

### 4. Teste de Usuário Não Logado
1. Fazer logout
2. Gerar um planejamento
3. Clicar em "💾 Salvar"
4. Verificar mensagem: "✅ Planejamento salvo localmente!"
5. Fechar e reabrir navegador
6. Planejamento ainda deve estar lá (localStorage)
7. Fazer login
8. Planejamento salvo localmente NÃO aparece (esperado - localStorage vs DB são separados)

## 🐛 Troubleshooting

### Erro: "Configuração do servidor indisponível"
- **Causa**: Supabase client não inicializado
- **Solução**: Verificar variáveis de ambiente `.env.local`
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

### Erro: "new row violates row-level security policy"
- **Causa**: RLS bloqueando insert/update/delete
- **Solução**: Verificar se políticas foram criadas corretamente
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'saved_meal_plans';
  ```

### Erro: "relation 'saved_meal_plans' does not exist"
- **Causa**: Migration não foi aplicada
- **Solução**: Executar migration via CLI ou SQL Editor

### Planejamentos aparecem duplicados
- **Causa**: Dados em localStorage + Supabase simultaneamente
- **Solução**: Limpar localStorage
  ```javascript
  localStorage.removeItem('chefbox-saved-meal-plans');
  ```

## 📈 Próximos Passos (Opcional)

1. **Migração de dados localStorage → Supabase**
   - Script para usuários logados importarem planejamentos do localStorage
   
2. **Edição de planejamentos**
   - UI para renomear planejamentos
   - Usar endpoint PATCH existente
   
3. **Compartilhamento**
   - Gerar link público para compartilhar planejamento
   
4. **Analytics**
   - Rastrear quantos planejamentos são salvos por usuário
   - Identificar padrões (dias mais comuns, calorias médias)

## ✅ Checklist de Deploy

- [ ] Aplicar migration no banco de produção
- [ ] Verificar políticas RLS criadas
- [ ] Testar salvamento com usuário real
- [ ] Testar remoção com usuário real
- [ ] Testar fallback (usuário deslogado)
- [ ] Verificar logs de erro no Sentry/Vercel
- [ ] Monitorar uso de storage do Supabase
