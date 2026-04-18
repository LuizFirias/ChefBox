# 🚀 Setup Rápido - Yampi Integration

Guia passo a passo para configurar pagamentos com Yampi em 10 minutos.

## ✅ Checklist de Setup

### 1️⃣ Configurar Banco de Dados (2 min)

```bash
# Executar migration
psql -U postgres -d chefbox < supabase/migrations/005_add_yampi_transactions.sql

# OU via Supabase Dashboard:
# SQL Editor → Nova Query → Colar conteúdo → Run
```

**Verificar criação:**
```sql
SELECT tablename FROM pg_tables 
WHERE tablename = 'yampi_transactions';
```

---

### 2️⃣ Criar Conta na Yampi (5 min)

1. **Acesse:** https://www.yampi.com.br/
2. **Cadastre-se** com email corporativo
3. **Complete perfil** da loja
4. **Ative ambiente de produção**

---

### 3️⃣ Criar Produtos na Yampi (3 min)

Acesse: **Dashboard → Produtos → Novo Produto**

**Produto 1:**
```
Nome: ChefBox Premium Mensal
SKU: chefbox-premium-mensal
Preço: R$ 29,90
Tipo: Digital
```

**Produto 2:**
```
Nome: ChefBox Premium Trimestral
SKU: chefbox-premium-trimestral
Preço: R$ 74,90
Tipo: Digital
```

**Produto 3:**
```
Nome: ChefBox Premium Anual
SKU: chefbox-premium-anual
Preço: R$ 239,90
Tipo: Digital
```

---

### 4️⃣ Obter Credenciais (2 min)

**4.1. Alias da Loja:**
- URL da loja: `https://SUA-LOJA.yampi.io`
- Alias = `SUA-LOJA`

**4.2. Token Secreto:**
1. Dashboard → Configurações → Integrações → API
2. Clicar em "Gerar Token"
3. Copiar token: `ypk_live_xxxxx...`

**4.3. Webhook Secret:**
1. Dashboard → Configurações → Webhooks
2. Adicionar webhook
3. URL temporária: `https://webhook.site/` (para gerar secret)
4. Copiar secret gerado: `whsec_xxxxx...`

---

### 5️⃣ Configurar Variáveis de Ambiente (1 min)

Adicione ao `.env.local`:

```bash
# Yampi
YAMPI_ALIAS=sua-loja
YAMPI_SECRET_KEY=ypk_live_xxxxxxxxxxxxx
YAMPI_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxx

# Production URL (importante para webhooks)
NEXT_PUBLIC_SITE_URL=https://seudominio.com
```

**Verificar:**
```bash
grep YAMPI .env.local
```

---

### 6️⃣ Testar Localmente com Ngrok (5 min)

**Instalar Ngrok:**
```bash
npm install -g ngrok
```

**Expor porta local:**
```bash
npm run dev
# Em outro terminal:
ngrok http 3000
```

**Copiar URL:** `https://abc123.ngrok.io`

**Configurar webhook na Yampi:**
1. Dashboard → Webhooks → Editar webhook
2. URL: `https://abc123.ngrok.io/api/yampi/webhook`
3. Eventos: `order.paid`, `order.updated`, `order.cancelled`
4. Salvar

---

### 7️⃣ Testar Fluxo Completo (5 min)

**7.1. Criar usuário de teste:**
```bash
# No app, criar conta com email: teste@example.com
```

**7.2. Acessar página de planos:**
```
http://localhost:3000/planos
```

**7.3. Selecionar plano:**
- Clicar em "Assinar Premium"
- Será redirecionado para checkout Yampi

**7.4. Usar cartão de teste:**
```
Número: 4111 1111 1111 1111
CVV: 123
Validade: qualquer data futura
```

**7.5. Verificar logs:**
```bash
# No terminal do servidor (npm run dev)
[yampi-webhook] Received event: order.paid
[yampi-webhook] ✅ Transaction processed for user: xxx
```

**7.6. Verificar banco:**
```sql
SELECT * FROM yampi_transactions 
WHERE user_id = (SELECT id FROM users WHERE email = 'teste@example.com');

SELECT * FROM subscriptions 
WHERE user_id = (SELECT id FROM users WHERE email = 'teste@example.com');
```

**7.7. Testar no app:**
- Fazer logout e login novamente
- Tentar gerar mais de 4 receitas (deve permitir se Premium ativo)

---

## 🎯 Comandos Úteis

**Verificar status premium de usuário:**
```bash
npx tsx scripts/check-premium-status.ts user@example.com
```

**Ver últimas transações:**
```sql
SELECT * FROM yampi_transactions ORDER BY created_at DESC LIMIT 10;
```

**Ver subscriptions ativas:**
```sql
SELECT u.email, s.* 
FROM subscriptions s
JOIN users u ON u.id = s.user_id
WHERE s.status = 'active';
```

**Ativar premium manualmente (teste):**
```sql
INSERT INTO subscriptions (user_id, provider, plan, status, current_period_end)
VALUES (
  (SELECT id FROM users WHERE email = 'teste@example.com'),
  'yampi',
  'mensal',
  'active',
  NOW() + INTERVAL '1 month'
);
```

**Limpar dados de teste:**
```sql
DELETE FROM yampi_transactions WHERE user_id = (SELECT id FROM users WHERE email = 'teste@example.com');
DELETE FROM subscriptions WHERE user_id = (SELECT id FROM users WHERE email = 'teste@example.com');
```

---

## 🐛 Troubleshooting Rápido

### ❌ Webhook não chega

**Verificar:**
```bash
# 1. Ngrok está rodando?
curl http://127.0.0.1:4040/api/tunnels

# 2. URL no webhook está correta?
# Dashboard Yampi → Webhooks → Verificar URL

# 3. Servidor está rodando?
curl http://localhost:3000/api/yampi/webhook
# Deve retornar: {"status":"active",...}
```

### ❌ "Invalid signature"

**Verificar:**
```bash
# Secret está correto?
echo $YAMPI_WEBHOOK_SECRET

# Se vazio, adicionar ao .env.local
```

### ❌ Premium não ativou

**Verificar trigger:**
```sql
SELECT tgname FROM pg_trigger WHERE tgname = 'on_yampi_payment_paid';
```

**Forçar ativação:**
```sql
UPDATE yampi_transactions 
SET status = 'paid', updated_at = NOW()
WHERE yampi_transaction_id = 'ID_DA_TRANSACAO';
```

---

## 📝 Deploy para Produção

### Vercel/Netlify

1. **Adicionar variáveis de ambiente:**
   - `YAMPI_ALIAS`
   - `YAMPI_SECRET_KEY`
   - `YAMPI_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_SITE_URL`

2. **Deploy:**
```bash
vercel --prod
# OU
netlify deploy --prod
```

3. **Atualizar webhook na Yampi:**
   - URL: `https://seudominio.com/api/yampi/webhook`

4. **Testar webhook:**
```bash
# Via Dashboard Yampi → Webhooks → Testar Webhook
```

---

## ✅ Validação Final

- [ ] Migration aplicada no banco
- [ ] 3 produtos criados na Yampi
- [ ] Variáveis de ambiente configuradas
- [ ] Webhook configurado e testado
- [ ] Página `/planos` acessível
- [ ] Fluxo de pagamento testado end-to-end
- [ ] Premium ativando automaticamente
- [ ] Script `check-premium-status.ts` funcionando

---

## 📚 Documentação Completa

Para detalhes técnicos completos, consulte:
- **[YAMPI_INTEGRATION.md](./YAMPI_INTEGRATION.md)** - Documentação técnica completa
- **[Yampi Docs](https://docs.yampi.com.br/)** - Documentação oficial

---

**Tempo total estimado:** 10-15 minutos ⚡
