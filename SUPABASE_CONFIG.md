# Configuração do Supabase para ChefBox

## ⚠️ SOLUÇÃO PARA "Database error finding user" / "Database error checking email"

Este erro ocorre quando:
1. **"Confirm email" está ativado** mas o usuário não foi criado corretamente
2. O usuário foi criado manualmente no SQL sem a estrutura completa do Supabase Auth
3. O usuário já existe mas está em estado inconsistente

### 🔥 SOLUÇÃO MAIS RÁPIDA (RECOMENDADO)

**Passo 1**: Desative a confirmação de email no Supabase Dashboard
1. Acesse **Authentication** → **Providers** → **Email**
2. **DESATIVE** a opção **"Confirm email"**
3. Clique em **Save changes**

**Passo 2**: Delete o usuário existente no SQL Editor do Supabase
```sql
-- Execute este SQL no Supabase SQL Editor
DELETE FROM auth.identities WHERE provider_id IN (
  SELECT id::text FROM auth.users WHERE email = 'iriasnandinho@gmail.com'
);
DELETE FROM auth.users WHERE email = 'iriasnandinho@gmail.com';
```

**Passo 3**: Tente fazer login novamente
- O código já tem `shouldCreateUser: true`
- O Supabase criará o usuário automaticamente na primeira tentativa de login
- O email será enviado normalmente

### Alternativa: Usar script Admin API (se preferir criar manualmente)

Primeiro delete o usuário existente usando o SQL acima, depois:

```bash
npx tsx scripts/create-user.ts iriasnandinho@gmail.com
```

Este script:
- ✅ Cria o usuário com a estrutura correta do Supabase Auth
- ✅ Confirma o email automaticamente
- ✅ Permite login imediato via magic link

---

## Autenticação - Email Settings

Para que o login com magic link funcione corretamente no ChefBox, você precisa configurar estas opções no **Supabase Dashboard**:

### 1. Acessar Configurações de Auth
1. Abra o dashboard do Supabase
2. Vá em **Authentication** → **Providers** → **Email**

### 2. Configurações Necessárias

Certifique-se de que as seguintes opções estão **ATIVADAS**:

- ✅ **Enable email provider** - Habilita autenticação por email
- ✅ **Enable email signup** - Permite novos usuários se cadastrarem
- ⚠️ **Confirm email** - Pode estar **DESATIVADO para testes** (ativado em produção)

### 3. Email Templates (Opcional mas recomendado)

Em **Authentication** → **Email Templates**, você pode personalizar:
- **Magic Link** - Email enviado com o link de acesso
- **Confirm signup** - Email de confirmação (se habilitado)

Use variáveis como `{{ .ConfirmationURL }}` para o magic link.

### 4. URL Configuration

Em **Authentication** → **URL Configuration**:
- **Site URL**: `https://chef-box-luiz-fernando-da-silva-irias-projects.vercel.app/` (produção)
- **Redirect URLs**: Adicione:
  - `http://localhost:3000/auth/callback`
  - `https://chef-box-luiz-fernando-da-silva-irias-projects.vercel.app/auth/callback`
  - `https://chef-*-box-luiz-fernando-da-silva-irias-projects.vercel.app/**` (wildcard para preview deployments)

## Troubleshooting

### Erro: "Database error finding user"
**Causa**: Usuário criado manualmente sem a estrutura correta do Supabase Auth, ou "Confirm email" ativado sem confirmação válida.

**Soluções**:
1. **Opção 1**: Desative "Confirm email" e delete o usuário manual (deixe `shouldCreateUser: true` criar automaticamente)
2. **Opção 2**: Use `npx tsx scripts/create-user.ts <email>` para criar via Admin API

### Erro: "Email link is invalid or has expired"
**Causa**: O link expirou (padrão: 1 hora) ou a URL de redirect não está configurada.
**Solução**: Verifique **Redirect URLs** nas configurações.

### Emails não chegam
**Causa**: Em desenvolvimento, Supabase limita envio de emails.
**Solução**: 
- Verifique a aba **Logs** em **Authentication** do dashboard
- Configure um provedor de email customizado (SendGrid, etc) em produção
