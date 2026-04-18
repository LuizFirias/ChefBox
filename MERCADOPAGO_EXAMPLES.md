# Exemplo de Uso do Checkout Transparente

Este arquivo mostra exemplos de como integrar o `PaymentModal` nas telas do ChefBox.

## 1. Tela de Planos (/planos)

```tsx
'use client'

import { useState } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import PaymentModal from '@/components/checkout/PaymentModal'

export default async function PlansPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase?.auth.getUser() ?? { data: { user: null } }

  if (!user) {
    return <div>Faça login para ver os planos</div>
  }

  return <PlansClient userId={user.id} />
}

function PlansClient({ userId }: { userId: string }) {
  const [modal, setModal] = useState<{
    isOpen: boolean
    plan: 'basic' | 'pro'
    period: 'monthly' | 'quarterly' | 'annual'
    price: number
  }>({ isOpen: false, plan: 'pro', period: 'monthly', price: 24.90 })

  const openModal = (
    plan: 'basic' | 'pro',
    period: 'monthly' | 'quarterly' | 'annual',
    price: number
  ) => {
    setModal({ isOpen: true, plan, period, price })
  }

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Escolha seu Plano
      </h1>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Plano Básico */}
        <div className="border-2 border-gray-200 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-2">Básico</h2>
          <p className="text-gray-600 mb-4">
            Perfeito para quem está começando
          </p>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => openModal('basic', 'monthly', 14.90)}
              className="w-full bg-[#E8622A] text-white rounded-full py-3 font-semibold hover:bg-[#d4561f]"
            >
              R$14,90/mês
            </button>
            <button
              onClick={() => openModal('basic', 'quarterly', 34.90)}
              className="w-full bg-white border-2 border-[#E8622A] text-[#E8622A] rounded-full py-3 font-semibold hover:bg-orange-50"
            >
              R$34,90/trimestre
            </button>
            <button
              onClick={() => openModal('basic', 'annual', 119.90)}
              className="w-full bg-white border-2 border-[#E8622A] text-[#E8622A] rounded-full py-3 font-semibold hover:bg-orange-50"
            >
              R$119,90/ano
            </button>
          </div>

          <ul className="space-y-2 text-sm text-gray-600">
            <li>✓ 60 receitas por mês</li>
            <li>✓ Planejamento de refeições</li>
            <li>✓ Lista de compras automática</li>
          </ul>
        </div>

        {/* Plano Pro */}
        <div className="border-2 border-[#E8622A] rounded-2xl p-6 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E8622A] text-white px-4 py-1 rounded-full text-sm font-semibold">
            Mais Popular
          </div>

          <h2 className="text-2xl font-bold mb-2">Pro</h2>
          <p className="text-gray-600 mb-4">
            Recursos ilimitados para quem leva a sério
          </p>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => openModal('pro', 'monthly', 24.90)}
              className="w-full bg-[#E8622A] text-white rounded-full py-3 font-semibold hover:bg-[#d4561f]"
            >
              R$24,90/mês
            </button>
            <button
              onClick={() => openModal('pro', 'quarterly', 59.90)}
              className="w-full bg-white border-2 border-[#E8622A] text-[#E8622A] rounded-full py-3 font-semibold hover:bg-orange-50"
            >
              R$59,90/trimestre
            </button>
            <button
              onClick={() => openModal('pro', 'annual', 199.90)}
              className="w-full bg-white border-2 border-[#E8622A] text-[#E8622A] rounded-full py-3 font-semibold hover:bg-orange-50"
            >
              R$199,90/ano
            </button>
          </div>

          <ul className="space-y-2 text-sm text-gray-600">
            <li>✓ Receitas ilimitadas</li>
            <li>✓ Planejamento de refeições</li>
            <li>✓ Lista de compras automática</li>
            <li>✓ Análise nutricional avançada</li>
            <li>✓ Suporte prioritário</li>
          </ul>
        </div>
      </div>

      {/* Modal de Pagamento */}
      <PaymentModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        plan={modal.plan}
        period={modal.period}
        price={modal.price}
        userId={userId}
      />
    </div>
  )
}
```

## 2. Botão de Upgrade no Dashboard

```tsx
'use client'

import { useState } from 'react'
import PaymentModal from '@/components/checkout/PaymentModal'

interface UpgradeButtonProps {
  userId: string
  currentPlan: 'basic' | 'pro' | null
}

export default function UpgradeButton({ userId, currentPlan }: UpgradeButtonProps) {
  const [showModal, setShowModal] = useState(false)

  // Não mostrar se já for Pro
  if (currentPlan === 'pro') {
    return null
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-gradient-to-r from-[#E8622A] to-orange-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
      >
        ⭐ Fazer Upgrade para Pro
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

## 3. Paywall Modal (quando limite de receitas acabar)

```tsx
'use client'

import { useState } from 'react'
import PaymentModal from '@/components/checkout/PaymentModal'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  recipesUsed: number
  recipesLimit: number
}

export default function PaywallModal({
  isOpen,
  onClose,
  userId,
  recipesUsed,
  recipesLimit,
}: PaywallModalProps) {
  const [showPayment, setShowPayment] = useState(false)

  if (showPayment) {
    return (
      <PaymentModal
        isOpen={true}
        onClose={() => {
          setShowPayment(false)
          onClose()
        }}
        plan="pro"
        period="monthly"
        price={24.90}
        userId={userId}
      />
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-2xl font-bold mb-2">Limite Atingido</h2>
          <p className="text-gray-600">
            Você usou {recipesUsed} de {recipesLimit} receitas este mês.
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-[#E8622A] mb-2">
            ⭐ Upgrade para Pro e tenha:
          </h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>✓ Receitas ilimitadas</li>
            <li>✓ Sem interrupções</li>
            <li>✓ Recursos exclusivos</li>
          </ul>
        </div>

        <button
          onClick={() => setShowPayment(true)}
          className="w-full bg-[#E8622A] text-white rounded-full py-3 font-semibold hover:bg-[#d4561f] mb-3"
        >
          Fazer Upgrade por R$24,90/mês
        </button>

        <button
          onClick={onClose}
          className="w-full text-gray-600 hover:text-gray-800 text-sm"
        >
          Agora não
        </button>
      </div>
    </div>
  )
}
```

## 4. Banner de Upgrade na Tela de Receitas

```tsx
'use client'

import { useState } from 'react'
import PaymentModal from '@/components/checkout/PaymentModal'

interface UpgradeBannerProps {
  userId: string
  recipesUsed: number
  recipesLimit: number
  currentPlan: 'basic' | 'pro' | null
}

export default function UpgradeBanner({
  userId,
  recipesUsed,
  recipesLimit,
  currentPlan,
}: UpgradeBannerProps) {
  const [showModal, setShowModal] = useState(false)

  // Não mostrar se já for Pro
  if (currentPlan === 'pro') return null

  const percentage = (recipesUsed / recipesLimit) * 100

  // Mostrar quando usar mais de 70% do limite
  if (percentage < 70) return null

  return (
    <>
      <div className="bg-gradient-to-r from-orange-500 to-[#E8622A] text-white rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">
              {percentage >= 100 ? '🔒 Limite Atingido!' : '⚠️ Você está quase no limite'}
            </h3>
            <p className="text-sm text-orange-100 mb-3">
              {recipesUsed} de {recipesLimit} receitas usadas este mês
            </p>
            <div className="w-full bg-white/30 rounded-full h-2 mb-4">
              <div
                className="bg-white rounded-full h-2 transition-all"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-white text-[#E8622A] px-6 py-2 rounded-full font-semibold hover:bg-orange-50 transition-colors"
        >
          Upgrade para Ilimitado → R$24,90/mês
        </button>
      </div>

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

---

## Dicas de Implementação

### 1. Sempre busque o userId do Supabase
```tsx
const supabase = await createSupabaseServerClient()
const { data: { user } } = await supabase?.auth.getUser() ?? { data: { user: null } }
```

### 2. Verifique se o usuário está logado antes de mostrar o modal
```tsx
if (!user) {
  router.push('/login')
  return
}
```

### 3. Recarregue a página após sucesso para atualizar o plano
```tsx
// Isso já está implementado no PaymentModal.tsx
setTimeout(() => {
  onClose()
  window.location.reload()
}, 2000)
```

### 4. Mostre feedback visual durante o processamento
```tsx
// O PaymentModal já mostra "Processando..." durante o pagamento
// E mostra "Assinatura ativada!" quando concluído
```
