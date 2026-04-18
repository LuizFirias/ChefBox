# Scripts Administrativos ChefBox

## create-user.ts

Cria usuários no Supabase usando a Admin API (Service Role Key).

### Uso

```bash
npx tsx scripts/create-user.ts <email>
```

### Exemplo

```bash
npx tsx scripts/create-user.ts iriasnandinho@gmail.com
```

### O que o script faz

1. Verifica se as variáveis de ambiente estão configuradas:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Cria o usuário usando `supabase.auth.admin.createUser()`:
   - Email automaticamente confirmado
   - Estrutura completa do Supabase Auth
   - Permite login imediato via magic link

3. Exibe confirmação com ID e email do usuário criado

### Requisitos

- Arquivo `.env.local` com as variáveis corretas
- Package `tsx` instalado (já incluído em devDependencies)
- Service Role Key do Supabase (nunca compartilhe publicamente!)

### Vantagens sobre criação manual via SQL

✅ Cria estrutura completa e válida no `auth.users` e `auth.identities`  
✅ Gera IDs e tokens corretos automaticamente  
✅ Email já confirmado (sem necessidade de magic link de confirmação)  
✅ Pronto para login imediato  
✅ Sem erros "Database error finding user"

### Troubleshooting

**Erro: Missing environment variables**
- Verifique se `.env.local` existe e contém `SUPABASE_SERVICE_ROLE_KEY`

**Erro: Invalid API key**
- Verifique se a Service Role Key está correta no Supabase Dashboard

**E-mail já existe**
- Delete o usuário existente no dashboard ou via SQL antes de recriar
