# ChefBox - Supabase Schema Setup

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

1. **`recipes`** - Receitas geradas pela IA
   - Armazena todas as receitas criadas
   - Compartilhadas entre usuários (economia de storage)
   - Indexadas por data e tags

2. **`user_recipes`** - Receitas salvas por usuário
   - Relacionamento many-to-many entre users e recipes
   - Permite notas personalizadas
   - Constraint de unicidade (user não salva receita duplicada)

3. **`shopping_lists`** - Listas de compras
   - Uma lista por documento (flexível)
   - Items em JSONB com status checked/unchecked
   - Soft delete via flag `completed`

4. **`meal_plans`** - Planejamento semanal (Premium)
   - 7 dias de refeições estruturadas
   - Lista de compras integrada
   - Notas de preparo antecipado

5. **`generation_history`** - Auditoria e rate limit
   - Log de todas as gerações de IA
   - Rastreamento por user_id ou IP
   - Base para analytics

### Views

- **`user_recipe_status`** - Combina recipes com status de "salva" do usuário

## 🚀 Como Executar a Migração

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o dashboard do seu projeto: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Navegue até **SQL Editor**
3. Abra o arquivo `supabase/migrations/001_initial_schema.sql`
4. Copie todo o conteúdo
5. Cole no editor SQL
6. Clique em **Run**
7. Aguarde confirmação de execução

### Opção 2: Via Supabase CLI

```bash
# Instalar CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref YOUR_PROJECT_ID

# Executar migração
supabase db push
```

### Opção 3: Arquivo por Arquivo

Se preferir executar em etapas, pode dividir o SQL em blocos:

1. Primeiro: Criar tabelas
2. Segundo: Criar índices
3. Terceiro: Ativar RLS e policies
4. Quarto: Criar triggers e views

## ✅ Validação

Após executar a migração, verifique:

```sql
-- Listar todas as tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Deve retornar:
-- recipes
-- user_recipes
-- shopping_lists
-- meal_plans
-- generation_history

-- Verificar policies RLS
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Verificar view
SELECT * FROM user_recipe_status LIMIT 1;
```

## 🔐 Row Level Security (RLS)

Todas as tabelas têm RLS ativado com políticas específicas:

- **recipes**: Leitura pública, escrita apenas via API
- **user_recipes**: Usuário só acessa suas próprias relações
- **shopping_lists**: Totalmente privado por usuário
- **meal_plans**: Totalmente privado por usuário
- **generation_history**: Usuário só lê seu próprio histórico

## 📊 Próximos Passos

1. ✅ **Schema criado** (você está aqui)
2. ⏳ Atualizar API routes para usar Supabase
3. ⏳ Migrar funções de storage de localStorage para Supabase
4. ⏳ Adicionar autenticação aos endpoints
5. ⏳ Criar hooks React para fetch de dados

## 🔧 Comandos Úteis

```sql
-- Limpar dados de teste
TRUNCATE generation_history, user_recipes, shopping_lists, meal_plans, recipes CASCADE;

-- Ver estatísticas de uso
SELECT 
  generation_type,
  source,
  COUNT(*) as total,
  COUNT(DISTINCT user_id) as unique_users
FROM generation_history
GROUP BY generation_type, source;

-- Ver usuários mais ativos
SELECT 
  user_id,
  COUNT(*) as recipes_saved
FROM user_recipes
GROUP BY user_id
ORDER BY recipes_saved DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### Erro: "relation already exists"
A migração já foi executada. Use DROP TABLE se quiser recriar:
```sql
DROP TABLE IF EXISTS generation_history, meal_plans, shopping_lists, user_recipes, recipes CASCADE;
```

### Erro: "permission denied"
Certifique-se de estar usando a service role key no backend, não a anon key.

### Erro: "could not serialize access"
Conflito de concorrência. Retry a operação ou use transações.
