# Checkout Transparente — Mercado Pago

Este documento explica como configurar e usar o checkout transparente do Mercado Pago no ChefBox.

## O que é Checkout Transparente?

O checkout transparente permite que o cliente assine e faça upgrade de plano **sem sair do app**. O formulário de cartão fica dentro do ChefBox, com identidade visual personalizada. O Mercado Pago processa o pagamento por baixo, de forma invisível ao usuário.

**Custo:** Zero adicional — mesma taxa de 3,99% por transação. Nenhuma mensalidade pela API.

---

## Configuração Inicial

### 1. Obter Credenciais do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/credentials
2. Copie as credenciais:
   - `PUBLIC_KEY` (usada no frontend)
   - `ACCESS_TOKEN` (usada SOMENTE no backend — nunca expor)

### 2. Configurar Variáveis de Ambiente

No arquivo `.env.local`, configure:

```env
# Mercado Pago — Checkout Transparente
MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx
MP_WEBHOOK_SECRET=sua_chave_secreta_mp
NEXT_PUBLIC_APP_URL=https://chefbox.com.br
```

**⚠️ Importante:**
- `MP_PUBLIC_KEY` e `NEXT_PUBLIC_MP_PUBLIC_KEY` devem ter o mesmo valor
- `MP_ACCESS_TOKEN` NUNCA deve ser exposto no frontend
- `MP_WEBHOOK_SECRET` é uma string aleatória que você cria para validar webhooks

### 3. Executar Migração do Banco de Dados

Execute a migração para adicionar as colunas necessárias:

```bash
# Se estiver usando Supabase CLI
supabase migration up

# Ou execute manualmente o arquivo:
# supabase/migrations/007_add_mercadopago_integration.sql
```

### 4. Configurar Webhook no Painel do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
2. URL do webhook: `https://chefbox.com.br/api/webhooks/mercadopago`
3. Eventos para ativar:
   - `subscription_preapproval` — mudanças na assinatura
   - `payment` — confirmação de renovações

---

## Como Usar

### Exemplo: Botão de Assinatura

```tsx
'use client'

import { useState } from 'react'
import PaymentModal from '@/components/checkout/PaymentModal'

export default function SubscribeButton({ userId }: { userId: string }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-[#E8622A] text-white rounded-full px-6 py-3"
      >
        Assinar Pro Mensal — R$24,90/mês
      </button>

      <PaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        plan="pro"
        period="monthly"
        price={24.90}
        userId={userId}
      />
    </>
  )
}
```

### Exemplo: Upgrade de Plano

```tsx
import { upgradeSubscription } from '@/app/api/subscriptions/actions'

// O usuário já tem uma assinatura ativa
// Buscar o mpSubscriptionId do Supabase

const handleUpgrade = async () => {
  const result = await upgradeSubscription({
    token,              // Gerado pelo SDK do MP no frontend
    paymentMethodId,
    issuerId,
    email,
    identificationNumber,
    identificationType,
    plan: 'pro',
    period: 'annual',
    userId,
    currentMpSubscriptionId: user.mpSubscriptionId, // Do Supabase
  })

  if (result.error) {
    console.error(result.error)
  } else {
    console.log('Upgrade realizado com sucesso!')
  }
}
```

### Exemplo: Cancelar Assinatura

```tsx
import { cancelSubscription } from '@/app/api/subscriptions/actions'

const handleCancel = async () => {
  const result = await cancelSubscription(
    user.mpSubscriptionId,
    userId
  )

  if (result.success) {
    console.log('Assinatura cancelada')
  }
}
```

---

## Fluxo de Pagamento

```
Usuário clica "Assinar Pro"
  ↓
Modal de checkout abre DENTRO do app
  ↓
Usuário preenche dados do cartão
  ↓
Frontend gera CardToken via MercadoPago.js (seguro)
  ↓
Frontend envia CardToken + plano para backend
  ↓
Backend cria assinatura recorrente via API do MP
  ↓
MP confirma assinatura
  ↓
Backend atualiza plano no Supabase
  ↓
App libera acesso imediatamente
  ↓
Webhook do MP confirma renovações futuras automaticamente
```

---

## Ambiente de Testes (Sandbox)

O Mercado Pago tem ambiente de sandbox completo para testes.

### Usar Credenciais de Teste

1. No painel do MP, ative o modo de teste
2. Use as credenciais de TESTE (não de produção)
3. Cartões de teste disponíveis em:
   https://www.mercadopago.com.br/developers/pt/docs/your-integrations/test/cards

### Cartões de Teste Rápidos

```
Visa aprovado:
  Número: 4509953566233704
  CVV: 123
  Validade: 11/25

Mastercard negado:
  Número: 5031433215406351
  CVV: 123
  Validade: 11/25
```

---

## Preços dos Planos

Os preços estão definidos em `app/api/subscriptions/actions.ts`:

```typescript
const PLAN_PRICES = {
  basic_monthly:    14.90,
  basic_quarterly:  34.90,
  basic_annual:    119.90,
  pro_monthly:      24.90,
  pro_quarterly:    59.90,
  pro_annual:      199.90,
}
```

Para alterar os preços, edite este objeto.

---

## Estrutura de Arquivos

```
components/
  checkout/
    PaymentModal.tsx        ← Formulário tokenizado dentro do app

app/api/
  subscriptions/
    actions.ts              ← createSubscription, cancelSubscription, upgradeSubscription
  webhooks/
    mercadopago/
      route.ts              ← Recebe eventos do MP (renovações, cancelamentos)

supabase/migrations/
  007_add_mercadopago_integration.sql  ← Adiciona colunas necessárias

.env.local                  ← MP_PUBLIC_KEY, MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET
next.config.ts              ← Expõe NEXT_PUBLIC_MP_PUBLIC_KEY
```

---

## Documentação Oficial

- Checkout Transparente: https://www.mercadopago.com.br/developers/pt/docs/subscriptions/additional-content/cardtoken
- Assinaturas API: https://www.mercadopago.com.br/developers/pt/docs/subscriptions/overview
- SDK JS: https://www.mercadopago.com.br/developers/pt/docs/sdks-library/client-side/sdk-js/initialization
- Cartões de teste: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/test/cards
- Webhooks: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks

---

## Troubleshooting

### Erro: "Cartão recusado"

- Verifique se está usando cartões de teste no ambiente de teste
- Verifique se as credenciais estão corretas
- Veja os logs de erro retornados pelo MP

### Erro: "Public key inválida"

- Verifique se `NEXT_PUBLIC_MP_PUBLIC_KEY` está configurada no `.env.local`
- Verifique se `next.config.ts` está expondo a variável corretamente
- Reinicie o servidor de desenvolvimento após alterar `.env.local`

### Webhook não está sendo chamado

- Verifique se a URL do webhook está correta no painel do MP
- Verifique se a URL é acessível publicamente (use ngrok em desenvolvimento)
- Veja os logs do webhook no painel do MP

### Assinatura criada mas usuário não tem acesso

- Verifique se o webhook está funcionando
- Verifique se a tabela `subscriptions` foi atualizada
- Verifique se o campo `mp_subscription_id` foi preenchido
- Veja os logs do servidor
