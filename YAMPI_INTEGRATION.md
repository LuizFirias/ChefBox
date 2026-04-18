# 💳 Integração Yampi - ChefBox

Documentação completa da integração de pagamentos com a plataforma Yampi.

## 📋 Índice

1. [Configuração Inicial](#configuração-inicial)
2. [Arquitetura](#arquitetura)
3. [Fluxo de Pagamento](#fluxo-de-pagamento)
4. [Configuração da Yampi](#configuração-da-yampi)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Endpoints da API](#endpoints-da-api)
7. [Webhooks](#webhooks)
8. [Planos Disponíveis](#planos-disponíveis)
9. [Liberação de Premium](#liberação-de-premium)
10. [Testes](#testes)
11. [Troubleshooting](#troubleshooting)

---

## 🚀 Configuração Inicial

### 1. Criar conta na Yampi

1. Acesse https://www.yampi.com.br/
2. Crie uma conta comercial
3. Complete o cadastro da sua loja
4. Ative o ambiente de produção

### 2. Executar migration do banco de dados

```bash
# Aplicar migration localmente
psql -U postgres -d chefbox -f supabase/migrations/005_add_yampi_transactions.sql

# OU via Supabase Dashboard
# 1. Acesse o Supabase Dashboard
# 2. Vá em SQL Editor
# 3. Cole o conteúdo de 005_add_yampi_transactions.sql
# 4. Execute
```

### 3. Configurar variáveis de ambiente

Adicione ao `.env.local`:

```bash
# Yampi Configuration
YAMPI_ALIAS=sua-loja-yampi
YAMPI_SECRET_KEY=seu_token_secreto_aqui
YAMPI_WEBHOOK_SECRET=seu_webhook_secret_aqui

# URLs públicas (para webhooks)
NEXT_PUBLIC_SITE_URL=https://seudominio.com
```

---

## 🏗️ Arquitetura

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │
       ├─→ Acessa /planos
       │
       ├─→ Seleciona plano
       │
       ├─→ POST /api/yampi/create-checkout
       │
       └─→ Redireciona para Yampi Checkout
              │
              ├─→ Usuário paga
              │
              └─→ Yampi envia webhook
                     │
                     ├─→ POST /api/yampi/webhook
                     │
                     ├─→ Salva transaction
                     │
                     ├─→ Trigger ativa premium
                     │
                     └─→ Usuário tem acesso Premium ✅
```

---

## 💰 Fluxo de Pagamento

### Passo a Passo Completo

1. **Usuário acessa a página de planos** (`/planos`)
   - Sistema carrega planos via `GET /api/yampi/plans`
   - Exibe opções: Mensal, Trimestral, Anual

2. **Usuário seleciona um plano**
   - Se não autenticado → redireciona para `/login?redirect=/planos`
   - Se autenticado → chama `POST /api/yampi/create-checkout`

3. **Sistema cria checkout na Yampi**
   - Envia dados do usuário e produto
   - Recebe `checkout_url` da Yampi
   - Redireciona usuário para página de pagamento

4. **Usuário finaliza pagamento na Yampi**
   - Preenche dados de cartão/PIX/boleto
   - Yampi processa pagamento

5. **Yampi envia webhook de confirmação**
   - Webhook: `POST /api/yampi/webhook`
   - Sistema verifica assinatura HMAC
   - Registra transação no banco

6. **Sistema ativa Premium automaticamente**
   - Trigger `on_yampi_payment_paid` é acionado
   - Atualiza/cria registro em `subscriptions`
   - Define `status = 'active'`
   - Calcula `current_period_end` baseado no plano

7. **Usuário acessa app com Premium ativo** ✅

---

## 🛠️ Configuração da Yampi

### 1. Criar produtos na Yampi

Acesse o painel Yampi → Produtos → Adicionar Produto

**Produto 1: ChefBox Premium Mensal**
- SKU: `chefbox-premium-mensal`
- Preço: R$ 29,90
- Tipo: Digital
- Recorrência: Não

**Produto 2: ChefBox Premium Trimestral**
- SKU: `chefbox-premium-trimestral`
- Preço: R$ 74,90
- Tipo: Digital
- Recorrência: Não

**Produto 3: ChefBox Premium Anual**
- SKU: `chefbox-premium-anual`
- Preço: R$ 239,90
- Tipo: Digital
- Recorrência: Não

### 2. Configurar Webhook

1. Acesse: Yampi Dashboard → Configurações → Webhooks
2. Adicione novo webhook:
   - **URL:** `https://seudominio.com/api/yampi/webhook`
   - **Eventos:**
     - `order.paid` ✅
     - `order.updated` ✅
     - `order.cancelled` ✅
   - **Secret:** Gere um segredo forte (use para `YAMPI_WEBHOOK_SECRET`)

3. Teste o webhook com evento de teste

### 3. Obter credenciais

1. **Alias da loja:** URL da sua loja Yampi (`sua-loja.yampi.io`)
2. **Token Secreto:**
   - Yampi Dashboard → Configurações → Integrações → API
   - Gere um token com permissões de leitura/escrita
3. **Webhook Secret:** O segredo configurado no webhook

---

## 🔐 Variáveis de Ambiente

```bash
# .env.local

# ===== YAMPI Configuration =====
YAMPI_ALIAS=chefbox                          # Alias da sua loja
YAMPI_SECRET_KEY=ypk_live_xxxxxxxxxxxx       # Token secreto da API
YAMPI_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx  # Secret para validar webhooks

# ===== URLs públicas =====
NEXT_PUBLIC_SITE_URL=https://chefbox.app     # Domínio em produção
```

---

## 📡 Endpoints da API

### `GET /api/yampi/plans`

Retorna lista de planos disponíveis.

**Response:**
```json
{
  "plans": [
    {
      "id": "mensal",
      "name": "ChefBox Premium Mensal",
      "description": "Acesso completo por 1 mês",
      "price": 29.90,
      "interval": "month",
      "yampi_sku": "chefbox-premium-mensal",
      "features": ["..."]
    }
  ],
  "current_plan": null,
  "currency": "BRL"
}
```

### `POST /api/yampi/create-checkout`

Cria sessão de checkout na Yampi.

**Request:**
```json
{
  "plan_id": "mensal"
}
```

**Response:**
```json
{
  "success": true,
  "checkout_url": "https://chefbox.yampi.io/checkout?token=xxx",
  "order_token": "abc123",
  "plan": {
    "sku": "chefbox-premium-mensal",
    "name": "ChefBox Premium Mensal",
    "price": 29.90
  }
}
```

### `POST /api/yampi/webhook`

Recebe notificações de eventos da Yampi.

**Headers:**
```
X-Yampi-Signature: sha256=xxxxx
```

**Body (exemplo):**
```json
{
  "event": "order.paid",
  "data": {
    "id": 12345,
    "number": "ORD-001",
    "status": { "code": "paid" },
    "customer": {
      "id": 789,
      "email": "user@example.com",
      "name": "João Silva"
    },
    "value": { "total": 29.90 },
    "payment": { "method": "credit_card" },
    "items": [
      {
        "sku_code": "chefbox-premium-mensal",
        "name": "ChefBox Premium Mensal",
        "value": 29.90
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment processed",
  "user_id": "uuid-aqui"
}
```

---

## 🪝 Webhooks

### Validação de Assinatura

Todos os webhooks são validados com HMAC SHA256:

```typescript
const signature = request.headers.get("x-yampi-signature");
const secret = process.env.YAMPI_WEBHOOK_SECRET;

const expectedSignature = crypto
  .createHmac("sha256", secret)
  .update(rawBody)
  .digest("hex");

const isValid = crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(expectedSignature)
);
```

### Eventos Suportados

| Evento | Descrição | Ação |
|--------|-----------|------|
| `order.paid` | Pedido pago com sucesso | Ativa premium |
| `order.updated` | Pedido atualizado | Atualiza status |
| `order.cancelled` | Pedido cancelado | Desativa premium |

### Retry Policy

A Yampi tenta reenviar webhooks falhados:
- 1ª tentativa: imediato
- 2ª tentativa: após 5 minutos
- 3ª tentativa: após 30 minutos
- 4ª tentativa: após 2 horas

---

## 📦 Planos Disponíveis

| Plano | SKU | Preço | Economia |
|-------|-----|-------|----------|
| **Mensal** | `chefbox-premium-mensal` | R$ 29,90/mês | - |
| **Trimestral** | `chefbox-premium-trimestral` | R$ 74,90/trimestre | 16% |
| **Anual** | `chefbox-premium-anual` | R$ 239,90/ano | 33% |

### Features Premium

✅ Receitas ilimitadas  
✅ Planejamento semanal de refeições  
✅ Lista de compras automatizada  
✅ Análise de macros e calorias  
✅ Suporte prioritário  
✅ Sem anúncios

---

## 🎁 Liberação de Premium

### Fluxo Automático

O sistema libera Premium **automaticamente** quando:

1. Webhook `order.paid` é recebido
2. Assinatura HMAC é válida
3. Email do cliente corresponde a um usuário no banco
4. Transação é salva em `yampi_transactions` com `status = 'paid'`
5. **Trigger PL/pgSQL é acionado:**
   - Calcula duração baseado no `plan_id`
   - Atualiza/cria registro em `subscriptions`
   - Define `status = 'active'`
   - Define `current_period_end = now() + duration`

### Verificação de Premium

A API `/api/access-status` verifica Premium assim:

```typescript
const { data: subscription } = await supabase
  .from("subscriptions")
  .select("*")
  .eq("user_id", userId)
  .eq("status", "active")
  .single();

const isPremium = 
  subscription && 
  subscription.current_period_end &&
  new Date(subscription.current_period_end) > new Date();
```

### Tabelas Envolvidas

**yampi_transactions**
```sql
id, user_id, yampi_transaction_id, plan_id, 
amount, status, paid_at, expires_at
```

**subscriptions**
```sql
id, user_id, provider, plan, status, 
current_period_end, provider_subscription_id
```

---

## 🧪 Testes

### 1. Testar localmente (Ngrok)

```bash
# 1. Instalar ngrok
npm install -g ngrok

# 2. Expor porta local
ngrok http 3000

# 3. Copiar URL (ex: https://abc123.ngrok.io)

# 4. Configurar webhook na Yampi:
#    URL: https://abc123.ngrok.io/api/yampi/webhook
```

### 2. Testar webhook manualmente

```bash
curl -X POST http://localhost:3000/api/yampi/webhook \
  -H "Content-Type: application/json" \
  -H "X-Yampi-Signature: <calcular HMAC>" \
  -d '{
    "event": "order.paid",
    "data": {
      "id": 123,
      "number": "TEST-001",
      "status": { "code": "paid" },
      "customer": {
        "email": "test@example.com",
        "name": "Test User"
      },
      "value": { "total": 29.90 },
      "payment": { "method": "test" },
      "items": [
        {
          "sku_code": "chefbox-premium-mensal",
          "name": "ChefBox Premium Mensal"
        }
      ]
    }
  }'
```

### 3. Simular pagamento de teste

1. Use cartões de teste da Yampi:
   - **Aprovar:** `4111 1111 1111 1111`
   - **Recusar:** `4000 0000 0000 0002`

2. Verifique logs:
```bash
# No terminal do servidor
[yampi-webhook] Received event: order.paid
[yampi-webhook] ✅ Transaction processed for user: uuid
```

3. Verifique no banco:
```sql
-- Ver transações
SELECT * FROM yampi_transactions ORDER BY created_at DESC LIMIT 5;

-- Ver subscriptions
SELECT * FROM subscriptions WHERE provider = 'yampi';
```

---

## 🐛 Troubleshooting

### Problema: Webhook não é recebido

**Solução:**
1. Verifique URL do webhook na Yampi
2. Confirme que a rota `/api/yampi/webhook` existe
3. Teste com `curl` ou Postman
4. Verifique logs do servidor

### Problema: "Invalid signature"

**Solução:**
1. Verifique `YAMPI_WEBHOOK_SECRET` no `.env.local`
2. Confirme que o secret está correto no painel Yampi
3. Teste localmente sem validação primeiro

### Problema: Premium não ativa automaticamente

**Solução:**
1. Verifique se o trigger foi criado:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_yampi_payment_paid';
```

2. Verifique logs do webhook:
```sql
SELECT * FROM yampi_transactions 
WHERE status = 'paid' 
ORDER BY created_at DESC;
```

3. Execute função manualmente:
```sql
-- Simula update que ativa o trigger
UPDATE yampi_transactions 
SET status = 'paid' 
WHERE yampi_transaction_id = 'TEST-001';
```

### Problema: Usuário não encontrado no webhook

**Solução:**
- Email do cliente na Yampi deve ser EXATAMENTE igual ao email no Supabase
- Verifique:
```sql
SELECT id, email FROM users WHERE email = 'email@cliente.com';
```

---

## 📝 Checklist de Deploy

Antes de ir para produção:

- [ ] Migration 005 aplicada no banco de produção
- [ ] Variáveis de ambiente configuradas no Vercel/Netlify
- [ ] Produtos criados na Yampi com SKUs corretos
- [ ] Webhook configurado com URL de produção
- [ ] Página `/planos` testada em produção
- [ ] Fluxo de pagamento testado end-to-end
- [ ] Verificação de premium funcionando
- [ ] Monitoramento de logs ativo

---

## 📞 Suporte

**Problemas com integração:**
- Documentação Yampi: https://docs.yampi.com.br/
- Suporte Yampi: suporte@yampi.com.br

**Problemas com o código:**
- Revisar logs em `console.log` nos arquivos de rota
- Verificar queries SQL no Supabase Dashboard
- Testar webhooks com Ngrok local

---

## 🎯 Próximos Passos (Opcional)

- [ ] Implementar cancelamento de assinatura
- [ ] Adicionar página "Minha Assinatura" no app
- [ ] Implementar sistema de cupons de desconto
- [ ] Adicionar analytics de conversão
- [ ] Criar emails transacionais (pagamento confirmado, etc)
- [ ] Implementar assinatura recorrente automática

---

**Última atualização:** Abril 2026  
**Versão:** 1.0.0
