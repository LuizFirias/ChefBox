'use server'

import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

// Frequência por período
const FREQUENCY_MAP = {
  monthly:   { frequency: 1,  frequency_type: 'months' },
  quarterly: { frequency: 3,  frequency_type: 'months' },
  annual:    { frequency: 12, frequency_type: 'months' },
}

// Valores por plano e período
const PLAN_PRICES = {
  basic_monthly:    14.90,
  basic_quarterly:  34.90,
  basic_annual:    119.90,
  pro_monthly:      24.90,
  pro_quarterly:    59.90,
  pro_annual:      199.90,
}

interface CreateSubscriptionParams {
  token: string              // CardToken gerado no frontend pelo SDK
  paymentMethodId: string
  issuerId: string
  email: string
  identificationNumber: string
  identificationType: string
  plan: 'basic' | 'pro'
  period: 'monthly' | 'quarterly' | 'annual'
  userId: string
}

export async function createSubscription(params: CreateSubscriptionParams) {
  const {
    token, paymentMethodId, issuerId, email,
    identificationNumber, identificationType,
    plan, period, userId,
  } = params

  const planKey = `${plan}_${period}` as keyof typeof PLAN_PRICES
  const amount = PLAN_PRICES[planKey]
  const freq = FREQUENCY_MAP[period]

  try {
    // 1. Criar assinatura recorrente no Mercado Pago
    const preapproval = new PreApproval(mp)

    // Preparar back_url (MP não aceita localhost)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const isLocalhost = appUrl.includes('localhost')
    
    const subscriptionBody: any = {
      reason: `Chefbox ${plan === 'pro' ? 'Pro' : 'Básico'} - ${period}`,
      external_reference: userId,
      payer_email: email,
      card_token_id: token,
      auto_recurring: {
        frequency: freq.frequency,
        frequency_type: freq.frequency_type as 'months',
        transaction_amount: amount,
        currency_id: 'BRL',
      },
      status: 'authorized',
    }
    
    // Adicionar back_url apenas se não for localhost
    if (!isLocalhost) {
      subscriptionBody.back_url = `${appUrl}/dashboard`
    }

    const subscription = await preapproval.create({
      body: subscriptionBody,
    })

    if (!subscription.id) {
      return { error: 'Erro ao criar assinatura' }
    }

    // 2. Calcular data de expiração
    const endDate = calculateEndDate(period)

    // 3. Salvar no Supabase
    const admin = createSupabaseAdminClient()

    if (!admin) {
      return { error: 'Erro ao conectar com banco de dados' }
    }

    await admin.from('subscriptions').insert({
      user_id: userId,
      mp_subscription_id: subscription.id,
      plan_type: plan,
      plan_period: period,
      status: 'active',
      price: amount,
      start_date: new Date().toISOString(),
      end_date: endDate?.toISOString() ?? null,
    })

    // 4. Atualizar plano ativo do usuário
    await admin.from('users').update({
      active_plan: plan,
      plan_period: period,
      plan_status: 'active',
      plan_end_date: endDate?.toISOString() ?? null,
      recipe_generations_limit: plan === 'pro' ? 999999 : 60,
      recipe_generations_used: 0,
      generation_cycle_start: new Date().toISOString(),
    }).eq('id', userId)

    return { success: true, subscriptionId: subscription.id }

  } catch (error: any) {
    console.error('[subscription] Erro ao criar:', error)

    // Tratamento de erros específicos do MP
    if (error?.cause?.[0]?.code === '2001') {
      return { error: 'Cartão já possui uma assinatura ativa.' }
    }
    if (error?.cause?.[0]?.code === '3010') {
      return { error: 'Cartão recusado. Tente outro cartão.' }
    }

    return { error: 'Erro ao processar pagamento. Tente novamente.' }
  }
}

// Cancelar assinatura (upgrade ou cancelamento pelo usuário)
export async function cancelSubscription(mpSubscriptionId: string, userId: string) {
  try {
    const preapproval = new PreApproval(mp)

    await preapproval.update({
      id: mpSubscriptionId,
      body: { status: 'cancelled' },
    })

    const admin = createSupabaseAdminClient()

    if (!admin) {
      return { error: 'Erro ao conectar com banco de dados' }
    }

    await admin.from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('mp_subscription_id', mpSubscriptionId)

    return { success: true }
  } catch (error) {
    console.error('[subscription] Erro ao cancelar:', error)
    return { error: 'Erro ao cancelar assinatura' }
  }
}

// Upgrade de plano: cancela o atual e cria o novo
export async function upgradeSubscription(params: CreateSubscriptionParams & {
  currentMpSubscriptionId: string
}) {
  const { currentMpSubscriptionId, ...createParams } = params

  // 1. Cancela o plano atual
  await cancelSubscription(currentMpSubscriptionId, createParams.userId)

  // 2. Cria o novo plano
  return createSubscription(createParams)
}

// Helper: calcular data de expiração
function calculateEndDate(period: string): Date | null {
  const date = new Date()
  switch (period) {
    case 'monthly':   date.setDate(date.getDate() + 30);  return date
    case 'quarterly': date.setDate(date.getDate() + 90);  return date
    case 'annual':    date.setDate(date.getDate() + 365); return date
    default:          return null
  }
}
