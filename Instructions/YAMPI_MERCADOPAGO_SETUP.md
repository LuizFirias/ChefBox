# 🛒 Yampi + Mercado Pago - Setup Completo

## 📖 Arquitetura

```
Usuário → [Yampi Checkout] → [Mercado Pago] → [Yampi Webhook] → ChefBox
```

1. **Yampi** = Plataforma de e-commerce (gerencia produtos, checkout, carrinho)
2. **Mercado Pago** = Gateway de pagamento (processa o pagamento dentro da Yampi)
3. **ChefBox** = Recebe webhooks da **Yampi** (não do Mercado Pago diretamente)

---

## 🚀 Passo a Passo de Configuração

### 1️⃣ Configurar Mercado Pago na Yampi

1. Acesse o **Painel da Yampi** → **Configurações** → **Meios de Pagamento**
2. Ative **Mercado Pago**
3. Configure as credenciais:
   - **Public Key**
   - **Access Token**
4. Defina se deseja PIX, Boleto, Cartão de Crédito
5. Salve as configurações

### 2️⃣ Criar Produtos na Yampi

Crie os produtos com os **SKUs exatos** que estão mapeados no código:

#### Lifetime
- **Nome:** ChefBox Lifetime
- **SKU:** `chefbox-lifetime`
- **Preço:** R$ 37,00
- **Tipo:** Produto único (não recorrente)

#### Básico
- **SKU:** `chefbox-basico-mensal` | Preço: R$ 14,90 | Recorrência: Mensal
- **SKU:** `chefbox-basico-trimestral` | Preço: R$ 34,90 | Recorrência: Trimestral
- **SKU:** `chefbox-basico-anual` | Preço: R$ 119,90 | Recorrência: Anual

#### Pro
- **SKU:** `chefbox-pro-mensal` | Preço: R$ 24,90 | Recorrência: Mensal
- **SKU:** `chefbox-pro-trimestral` | Preço: R$ 59,90 | Recorrência: Trimestral
- **SKU:** `chefbox-pro-anual` | Preço: R$ 199,90 | Recorrência: Anual

### 3️⃣ Obter Credenciais da Yampi

1. **Painel Yampi** → **Configurações** → **API**
2. Gere um **Token de API** (ou copie o existente)
3. Anote o **Alias da sua loja** (aparece na URL: `sua-loja.yampi.io`)

### 4️⃣ Configurar Webhook da Yampi

1. **Painel Yampi** → **Configurações** → **Webhooks**
2. Clique em **Novo Webhook**
3. **URL:** `https://seu-dominio.com/api/yampi/webhook`
4. **Secret:** Crie uma string aleatória (ex: `whsec_abc123xyz...`)
5. **Eventos:** Selecione todos os eventos de pedido e assinatura
   - ✅ `order.paid`
   - ✅ `order.cancelled`
   - ✅ `order.refunded`
   - ✅ `subscription.renewed`
   - ✅ `subscription.cancelled`
6. Clique em **Salvar**

### 5️⃣ Configurar Variáveis de Ambiente

Adicione ao `.env.local`:

```env
# Yampi Configuration
YAMPI_API_TOKEN=seu_token_aqui_da_api_yampi
YAMPI_API_URL=https://api.yampi.io
YAMPI_WEBHOOK_SECRET=o_secret_que_voce_criou_no_passo_4
YAMPI_ALIAS=sua-loja
```

**⚠️ Importante:** O Mercado Pago NÃO precisa de configuração no ChefBox, pois ele só processa pagamentos dentro da Yampi.

---

## 🔄 Fluxo de Pagamento

### Pagamento Único (Lifetime)

```
1. Usuário acessa página /planos no ChefBox
2. Clica em "Comprar Lifetime"
3. Redirecionado para checkout.yampi.io/sua-loja
4. Yampi exibe produto (R$ 37,00)
5. Usuário escolhe "Mercado Pago" como forma de pagamento
6. Paga com PIX/Cartão/Boleto
7. Mercado Pago processa o pagamento
8. Yampi recebe confirmação do Mercado Pago
9. Yampi envia webhook "order.paid" → ChefBox
10. ChefBox cria subscription e ativa acesso
```

### Assinatura Recorrente (Basic/Pro)

```
1. Usuário clica em "Assinar Pro Mensal"
2. Redirecionado para checkout da Yampi
3. Escolhe Mercado Pago → Autoriza débito recorrente
4. Primeira cobrança → Webhook "order.paid"
5. ChefBox cria subscription
6. A cada renovação → Webhook "subscription.renewed"
7. ChefBox reseta contador mensal (Basic) ou mantém ilimitado (Pro)
```

---

## 📋 Checklist de Implementação

### ✅ Já Implementado

- [x] Webhook da Yampi (`app/api/yampi/webhook/route.ts`)
- [x] Mapeamento de SKUs (`YAMPI_PRODUCT_MAP` em `lib/types.ts`)
- [x] Função `resolveDoublePlan()` (cancela planos menores)
- [x] Função `upsertSubscription()` (cria/atualiza planos)
- [x] Função `recalculateUserActivePlan()` (recalcula após mudanças)
- [x] Sistema de hierarquia de planos (PRO > BASIC > LIFETIME)
- [x] Reset mensal de gerações (Basic)

### 🔧 Você Precisa Fazer

- [ ] Configurar Mercado Pago no painel da Yampi
- [ ] Criar produtos com SKUs corretos na Yampi
- [ ] Configurar webhook no painel da Yampi
- [ ] Adicionar credenciais da Yampi ao `.env.local`
- [ ] Criar links de checkout no frontend (ver abaixo)
- [ ] Testar fluxo completo em ambiente de teste

---

## 🎨 Criar Links de Checkout no Frontend

### Opção 1: Link direto para produto

```tsx
<a 
  href="https://sua-loja.yampi.io/r/chefbox-lifetime"
  className="btn-primary"
>
  Comprar Lifetime - R$ 37,00
</a>
```

### Opção 2: Usar API da Yampi para criar checkout personalizado

```tsx
// app/api/create-checkout/route.ts
export async function POST(request: Request) {
  const { sku, userEmail } = await request.json();
  
  const response = await fetch(`https://api.yampi.io/v1/checkout`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.YAMPI_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ sku, quantity: 1 }],
      customer: { email: userEmail },
      // ... outros campos
    }),
  });
  
  const data = await response.json();
  return Response.json({ checkoutUrl: data.checkout_url });
}
```

### Opção 3: Embed do Yampi (Recomendado)

```tsx
"use client";

import Script from "next/script";

export function YampiCheckoutButton({ sku, price, title }: Props) {
  return (
    <>
      <Script src="https://static.yampi.io/checkout/checkout-button.min.js" />
      <button
        className="yampi-checkout-button"
        data-sku={sku}
        data-name={title}
        data-price={price}
        data-alias="sua-loja"
      >
        Comprar Agora
      </button>
    </>
  );
}
```

---

## 🧪 Testar em Ambiente Sandbox

### 1. Usar Modo de Teste da Yampi

1. Painel Yampi → **Modo de Teste** (switch no topo)
2. Configure Mercado Pago com credenciais **TEST**
3. Faça pedidos de teste

### 2. Cartões de Teste (Mercado Pago)

- **Aprovado:** `5031 4332 1540 6351` | CVV: 123 | Validade: qualquer futura
- **Recusado:** `5031 7557 3453 0604` | CVV: 123

### 3. Testar Webhook Localmente (ngrok)

```bash
# Expor localhost
ngrok http 3000

# URL gerada: https://abc123.ngrok.io
```

Configure no painel da Yampi:
```
https://abc123.ngrok.io/api/yampi/webhook
```

---

## 🔍 Monitoramento

### Ver Logs do Webhook

```bash
# Vercel
vercel logs --follow | grep '\[yampi-webhook\]'

# Local (dev server)
# Logs aparecem automaticamente no console
```

### Ver Pedidos na Yampi

**Painel Yampi** → **Pedidos** → Ver detalhes

### Ver Transações no Supabase

```sql
-- Transações recentes
SELECT * FROM yampi_transactions
ORDER BY created_at DESC
LIMIT 20;

-- Subscriptions ativas
SELECT u.email, s.plan_type, s.plan_period, s.status, s.end_date
FROM subscriptions s
JOIN users u ON u.id = s.user_id
WHERE s.status = 'active'
ORDER BY s.created_at DESC;

-- Usuários com planos duplos (para resolver)
SELECT user_id, COUNT(*) as plans
FROM subscriptions
WHERE status = 'active'
GROUP BY user_id
HAVING COUNT(*) > 1;
```

---

## 🚨 Troubleshooting

### Webhook não está sendo chamado

1. **Verificar URL no painel da Yampi** (deve ser HTTPS em produção)
2. **Ver logs de webhooks na Yampi:** Painel → Webhooks → Logs
3. **Testar manualmente:**
   ```bash
   curl -X POST https://seu-dominio.com/api/yampi/webhook \
     -H "Content-Type: application/json" \
     -d '{"event": "order.paid", "data": {...}}'
   ```

### Plano não está sendo ativado

1. **Verificar SKU:** Deve estar exatamente igual ao `YAMPI_PRODUCT_MAP`
2. **Ver logs:** Procurar por `[yampi-webhook]` e `[plan]`
3. **Verificar se webhook foi recebido:**
   ```sql
   SELECT * FROM yampi_transactions WHERE yampi_order_id = 'ORDER_ID';
   ```

### Plano duplo não foi resolvido

1. Ver logs: `[plan] Checking for double plans`
2. Rodar manualmente no Supabase SQL Editor:
   ```sql
   -- Substituir USER_ID pelo ID real
   SELECT * FROM resolve_double_plan('USER_ID');
   ```

---

## 🔐 Segurança

### Validar Webhook Secret

O código já valida automaticamente o `YAMPI_WEBHOOK_SECRET`.

Se quiser adicionar validação extra:

```typescript
// No webhook route.ts
const signature = request.headers.get("x-yampi-signature");
const webhookSecret = process.env.YAMPI_WEBHOOK_SECRET;

// Verificar se a assinatura bate
// (implementação depende do formato que a Yampi envia)
```

---

## 📚 Links Úteis

- 📖 **Yampi Docs:** https://docs.yampi.com.br
- 📖 **Yampi API:** https://docs.yampi.com.br/reference/api
- 📖 **Webhooks Yampi:** https://docs.yampi.com.br/docs/webhooks
- 📖 **Mercado Pago (na Yampi):** Configurado no painel da Yampi
- 🎨 **Yampi Checkout Button:** https://docs.yampi.com.br/docs/botao-de-checkout

---

## ✅ Resumo da Arquitetura

```
┌─────────────┐
│   ChefBox   │
│  (Frontend) │
└──────┬──────┘
       │ Link para checkout
       ↓
┌─────────────┐     Processa     ┌───────────────┐
│    Yampi    │────pagamento────→│ Mercado Pago  │
│  (Checkout) │                  │   (Gateway)   │
└──────┬──────┘                  └───────────────┘
       │ Webhook (order.paid, etc)
       ↓
┌─────────────┐
│   ChefBox   │
│  (Backend)  │
│  webhook    │
└─────────────┘
```

**Fluxo:** ChefBox → Yampi → Mercado Pago → Yampi → ChefBox (webhook)

---

**Última atualização:** 17/04/2026  
**Integração:** Yampi + Mercado Pago
