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

// Duração em meses por período (para calcular end_date)
const DURATION_MONTHS = {
  monthly:   1,
  quarterly: 3,
  annual:    12,
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

  // Validar que o userId existe no banco antes de chamar o MP
  const admin = createSupabaseAdminClient()
  if (!admin) {
    return { error: 'Erro ao conectar com banco de dados' }
  }

  const { data: userExists } = await admin
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (!userExists) {
    console.error('[subscription] userId inválido ou sessão expirada:', userId)
    return { error: 'Sessão expirada. Faça login novamente.' }
  }

  // Idempotência: verificar se já existe assinatura ativa para este plano/período
  const planKey = `${plan}_${period}` as keyof typeof PLAN_PRICES
  const { data: existingSub } = await admin
    .from('subscriptions')
    .select('id, status, mp_subscription_id')
    .eq('user_id', userId)
    .eq('plan_type', plan)
    .eq('plan_period', period)
    .eq('status', 'active')
    .maybeSingle()

  if (existingSub) {
    console.warn('[subscription] Assinatura já existe para este usuário/plano:', existingSub.id)
    return { success: true, subscriptionId: existingSub.mp_subscription_id, alreadyActive: true }
  }
  const amount = PLAN_PRICES[planKey]
  const freq = FREQUENCY_MAP[period]

  try {
    // Preparar back_url (MP não aceita localhost)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const isLocalhost = appUrl.includes('localhost')
    
    // Calcular datas
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + DURATION_MONTHS[period])

    // Body EXATO conforme documentação oficial do MP:
    // https://www.mercadopago.com.br/developers/pt/docs/subscriptions/integration-configuration/subscription-no-associated-plan/authorized-payments
    const subscriptionBody: Record<string, unknown> = {
      reason: `Chefbox ${plan === 'pro' ? 'Pro' : 'Básico'} - ${period}`,
      external_reference: userId,
      payer_email: email,
      card_token_id: token,
      notification_url: 'https://www.chefbox.com.br/api/webhooks/mercadopago',
      auto_recurring: {
        frequency: freq.frequency,
        frequency_type: freq.frequency_type,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        transaction_amount: amount,
        currency_id: 'BRL',
      },
      status: 'authorized',
    }
    
    // Adicionar back_url apenas se não for localhost
    if (!isLocalhost) {
      subscriptionBody.back_url = `${appUrl}/dashboard`
    }

    console.log('[subscription] Body enviado ao MP:', JSON.stringify(subscriptionBody, null, 2))

    // Usar REST API diretamente para obter erros detalhados
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(subscriptionBody),
    })

    const subscription = await response.json()

    console.log('[subscription] Resposta MP status:', response.status)
    console.log('[subscription] Resposta MP body:', JSON.stringify(subscription, null, 2))

    if (!response.ok) {
      console.error('[subscription] Erro MP:', subscription)
      
      const errorMessage = subscription?.message || 'Erro ao processar pagamento'
      
      // Mapeamento de erros conhecidos
      if (errorMessage.includes('CC_VAL_433')) {
        return { error: 'Falha na validação do cartão. Verifique os dados ou use outro cartão.' }
      }
      if (subscription?.status === 400) {
        return { error: `Dados inválidos: ${errorMessage}` }
      }
      
      return { error: errorMessage }
    }

    if (!subscription.id) {
      return { error: 'Erro ao criar assinatura' }
    }

    console.log('[subscription] Salvando no Supabase...')
    console.log('[subscription] User ID:', userId)
    console.log('[subscription] MP Subscription ID:', subscription.id)

    const { data: subData, error: subError } = await admin.from('subscriptions').insert({
      user_id: userId,
      provider: 'mercadopago',
      plan: plan,
      status: 'active',
      mp_subscription_id: subscription.id,
      plan_type: plan,
      plan_period: period,
      price: amount,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      current_period_end: endDate.toISOString(),
    }).select()

    if (subError) {
      // CRÍTICO: MP criou a assinatura mas Supabase falhou
      // O mp_subscription_id precisa ser preservado para conciliação manual
      console.error('[subscription] CRÍTICO: Supabase insert falhou após MP criar assinatura.')
      console.error('[subscription] MP Subscription ID para conciliação manual:', subscription.id)
      console.error('[subscription] User ID:', userId)
      console.error('[subscription] Erro Supabase:', subError)
      return { error: `Erro ao salvar assinatura: ${subError.message}` }
    }

    console.log('[subscription] Subscription salva:', subData)

    // Atualizar plano ativo do usuário
    const { data: userData, error: userError } = await admin.from('users').update({
      active_plan: plan,
      plan_period: period,
      plan_status: 'active',
      plan_end_date: endDate.toISOString(),
      recipe_generations_limit: plan === 'pro' ? 999999 : 60,
      recipe_generations_used: 0,
      generation_cycle_start: startDate.toISOString(),
    }).eq('id', userId).select()

    if (userError) {
      console.error('[subscription] Erro ao atualizar user:', userError)
      return { error: `Erro ao atualizar usuário: ${userError.message}` }
    }

    console.log('[subscription] User atualizado:', userData)

    return { success: true, subscriptionId: subscription.id }

  } catch (error: any) {
    console.error('[subscription] Erro inesperado:', error)
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
