# Histórico de Receitas Geradas

Esta atualização adiciona a funcionalidade de histórico de receitas geradas, substituindo os exemplos fixos por receitas reais do banco de dados.

## Alterações Realizadas

### 1. Nova Tabela no Banco de Dados

Foi criada a tabela `generated_recipes` para armazenar o histórico de receitas geradas por cada usuário.

**Migration:** `supabase/migrations/002_generated_recipes.sql`

```sql
create table if not exists public.generated_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  recipe_id text not null,
  title text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
```

### 2. Novas Funções na API

- **`saveGeneratedRecipesToHistory()`** - Salva receitas geradas no histórico do usuário
- **`getRecentGeneratedRecipes()`** - Recupera as receitas mais recentes
- **API `/api/recent-recipes`** - Endpoint para buscar receitas recentes

### 3. Mudanças na Home Screen

- ✅ Removidos os exemplos fixos (`historyItems`)
- ✅ Adicionado estado para `recentRecipes`
- ✅ Busca automática de receitas recentes ao carregar a página
- ✅ Exibição condicional do histórico (apenas se houver receitas)

### 4. Integração com Geração de Receitas

Toda vez que receitas são geradas via `/api/generate-recipes`, elas são automaticamente salvas no histórico do usuário no banco de dados.

## Aplicando a Migration

### Opção 1: Supabase Local (Desenvolvimento)

```bash
# Se estiver usando Supabase local
supabase db reset
```

### Opção 2: Supabase Cloud (Produção)

1. Acesse seu projeto no [dashboard do Supabase](https://app.supabase.com)
2. Vá em **Database** → **SQL Editor**
3. Cole o conteúdo do arquivo `supabase/migrations/002_generated_recipes.sql`
4. Execute a migration

### Opção 3: CLI do Supabase

```bash
# Link ao projeto (se ainda não estiver linkado)
supabase link --project-ref <SEU_PROJECT_ID>

# Aplica as migrations pendentes
supabase db push
```

## Atualizando os Tipos TypeScript (Opcional)

Após aplicar a migration, você pode atualizar os tipos TypeScript do Supabase:

```bash
npx supabase gen types typescript --project-id <SEU_PROJECT_ID> > lib/supabase/database.types.ts
```

Depois, remova os comentários `@ts-ignore` nas funções de [lib/supabase/db.ts](lib/supabase/db.ts).

## Comportamento

### Antes
- Exibia 2 exemplos fixos na home (desktop) e 2 no mobile
- Não armazenava histórico de receitas geradas

### Depois
- Exibe até 2 receitas mais recentes (desktop) e até 4 (mobile)
- Histórico só aparece se o usuário tiver receitas geradas
- Cada vez que receitas são geradas, são salvas automaticamente no histórico
- Receitas ordenadas por data de criação (mais recentes primeiro)

## Testando

1. Faça login
2. Gere algumas receitas
3. Navegue para a home (se já estiver nela, recarregue a página)
4. Veja o histórico de "Receitas Recentes" com as receitas que você acabou de gerar

---

**Nota:** Os comentários `@ts-ignore` são temporários e serão removidos após regenerar os tipos do Supabase com o comando acima.
