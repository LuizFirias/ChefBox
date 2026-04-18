# ✅ Verificação de Instalação do Checkout Mercado Pago

## Status da Configuração

### ✅ 1. Dependências Instaladas
- ✅ `mercadopago: ^2.12.0` instalado em package.json

### ✅ 2. Arquivos Criados
- ✅ `components/checkout/PaymentModal.tsx` — Modal de pagamento
- ✅ `app/api/subscriptions/actions.ts` — Lógica de assinaturas
- ✅ `app/api/webhooks/mercadopago/route.ts` — Webhook para renovações
- ✅ `supabase/migrations/007_add_mercadopago_integration.sql` — Migração

### ✅ 3. Configuração
- ✅ `next.config.ts` — Expõe NEXT_PUBLIC_MP_PUBLIC_KEY
- ✅ `.env.local` — Credenciais configuradas:
  - ✅ MP_PUBLIC_KEY
  - ✅ NEXT_PUBLIC_MP_PUBLIC_KEY
  - ✅ MP_ACCESS_TOKEN
  - ✅ MP_WEBHOOK_SECRET
  - ✅ NEXT_PUBLIC_APP_URL

### ✅ 4. Banco de Dados
- ✅ Migração 007 executada no Supabase
- ✅ Tipos TypeScript regenerados

---

## 🎯 Próximos Passos

### 1. Reiniciar Servidor de Desenvolvimento

As variáveis de ambiente foram atualizadas, então reinicie o servidor:

```bash
# Pare o servidor (Ctrl+C) e reinicie
npm run dev
```

### 2. Criar Página de Teste

Crie uma página simples para testar o checkout:

**Arquivo: `app/teste-checkout/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import PaymentModal from '@/components/checkout/PaymentModal'

export default function TesteCheckoutPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    async function getUser() {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase?.auth.getUser() ?? { data: { user: null } }
      setUserId(user?.id ?? null)
    }
    getUser()
  }, [])

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Faça login para testar</h1>
          <a href="/login" className="text-[#E8622A] underline">
            Ir para login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          🧪 Teste de Checkout Mercado Pago
        </h1>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Planos Disponíveis</h2>
          
          <div className="space-y-3">
            {/* Plano Pro Mensal */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-[#E8622A] text-white rounded-xl py-4 px-6 text-left hover:bg-[#d4561f] transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold">Chefbox Pro</div>
                  <div className="text-sm text-orange-100">Receitas ilimitadas</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">R$24,90</div>
                  <div className="text-xs text-orange-100">por mês</div>
                </div>
              </div>
            </button>

            {/* Plano Básico */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full border-2 border-gray-200 rounded-xl py-4 px-6 text-left hover:border-[#E8622A] transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold">Chefbox Básico</div>
                  <div className="text-sm text-gray-600">60 receitas por mês</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">R$14,90</div>
                  <div className="text-xs text-gray-600">por mês</div>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="font-semibold text-blue-900 mb-2">
              🧪 Modo de Teste
            </h3>
            <p className="text-sm text-blue-800 mb-2">
              Use cartões de teste do Mercado Pago:
            </p>
            <div className="text-xs text-blue-700 font-mono bg-white p-2 rounded">
              <div>Número: 4509 9535 6623 3704</div>
              <div>CVV: 123</div>
              <div>Validade: 11/25</div>
              <div>Nome: APRO</div>
              <div>CPF: 123.456.789-01</div>
            </div>
          </div>
        </div>

        <PaymentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          plan="pro"
          period="monthly"
          price={24.90}
          userId={userId}
        />
      </div>
    </div>
  )
}
```

### 3. Acessar Página de Teste

```
http://localhost:3000/teste-checkout
```

### 4. Testar Fluxo Completo

1. ✅ Faça login no app
2. ✅ Acesse `/teste-checkout`
3. ✅ Clique em "Chefbox Pro"
4. ✅ Preencha o formulário com os dados de teste:
   ```
   Número: 4509 9535 6623 3704
   CVV: 123
   Validade: 11/25
   Nome: APRO
   CPF: 123.456.789-01
   E-mail: seu@email.com
   ```
5. ✅ Clique em "Assinar"
6. ✅ Aguarde o processamento
7. ✅ Verifique se aparece "Assinatura ativada!"
8. ✅ Verifique no Supabase se:
   - Tabela `subscriptions` tem uma nova linha
   - Tabela `users` foi atualizada com `active_plan: 'pro'`

---

## 🔍 Verificações no Supabase

Após fazer o teste, verifique no Supabase:

### Tabela `subscriptions`

```sql
SELECT * FROM subscriptions WHERE user_id = 'SEU_USER_ID' ORDER BY created_at DESC;
```

Deve mostrar:
- ✅ `mp_subscription_id` preenchido
- ✅ `plan_type: 'pro'`
- ✅ `plan_period: 'monthly'`
- ✅ `status: 'active'`
- ✅ `price: 24.90`

### Tabela `users`

```sql
SELECT 
  active_plan, 
  plan_period, 
  plan_status, 
  recipe_generations_limit 
FROM users 
WHERE id = 'SEU_USER_ID';
```

Deve mostrar:
- ✅ `active_plan: 'pro'`
- ✅ `plan_period: 'monthly'`
- ✅ `plan_status: 'active'`
- ✅ `recipe_generations_limit: 999999`

---

## 🐛 Troubleshooting

### Erro: "NEXT_PUBLIC_MP_PUBLIC_KEY is undefined"

**Solução:** Reinicie o servidor (`npm run dev`)

### Erro: "mp_subscription_id não existe"

**Solução:** 
1. Verifique se a migração foi executada
2. Regenere os tipos: `npx supabase gen types typescript --project-id xsevdtxigjxdtqfhfbth > lib/supabase/database.types.ts`
3. Reinicie o TypeScript Server no VSCode

### Modal não abre

**Solução:**
1. Abra o console do navegador (F12)
2. Verifique se há erros
3. Verifique se o userId está sendo passado corretamente

### Pagamento não processa

**Solução:**
1. Verifique se as credenciais do MP estão corretas
2. Verifique se está usando cartão de teste válido
3. Veja os logs no console do servidor
4. Verifique os logs no painel do MP

---

## 📊 Logs Importantes

### No servidor Next.js:

```bash
# Veja os logs em tempo real
npm run dev

# Procure por:
[subscription] Erro ao criar: ...
[mp-webhook] ...
```

### No Painel do Mercado Pago:

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Vá em "Webhooks" → "Logs"
3. Veja as tentativas de envio de webhook

---

## ✅ Sistema Pronto para Uso

Se todos os testes passarem:

1. ✅ O checkout transparente está funcionando
2. ✅ Assinaturas são criadas corretamente
3. ✅ Banco de dados é atualizado
4. ✅ Usuário recebe acesso imediatamente

**Próximos passos:**
- Integre o `PaymentModal` na página de planos real
- Adicione botões de upgrade no dashboard
- Configure webhook em produção (quando fizer deploy)

---

## 📚 Documentação de Referência

- [MERCADOPAGO_SETUP.md](./MERCADOPAGO_SETUP.md) — Guia de instalação
- [MERCADOPAGO_CHECKOUT.md](./MERCADOPAGO_CHECKOUT.md) — Documentação técnica
- [MERCADOPAGO_EXAMPLES.md](./MERCADOPAGO_EXAMPLES.md) — Exemplos de uso
- [MERCADOPAGO_DEV_WEBHOOK.md](./MERCADOPAGO_DEV_WEBHOOK.md) — Webhooks em desenvolvimento
