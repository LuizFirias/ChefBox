import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, data } = body

  const admin = createSupabaseAdminClient()

  if (!admin) {
    console.error('[mp-webhook] Erro ao conectar com banco de dados')
    return NextResponse.json({ received: false, error: 'Database connection error' }, { status: 500 })
  }

  console.log('[mp-webhook]', type, data?.id)

  try {
    switch (type) {

      // Assinatura criada ou atualizada
      case 'subscription_preapproval': {
        const preapproval = new PreApproval(mp)
        const sub = await preapproval.get({ id: data.id })

        const userId = sub.external_reference // ID do usuário que passamos na criação

        if (!userId) {
          console.error('[mp-webhook] external_reference ausente')
          break
        }

        if (sub.status === 'authorized') {
          // Assinatura ativa — garantir que o usuário tem acesso
          await admin.from('subscriptions')
            .update({ status: 'active' })
            .eq('mp_subscription_id', data.id)

          await admin.from('users')
            .update({ plan_status: 'active' })
            .eq('id', userId)

        } else if (sub.status === 'cancelled' || sub.status === 'paused') {
          // Assinatura cancelada ou pausada
          await admin.from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('mp_subscription_id', data.id)

          // Recalcular plano ativo
          await recalculateUserPlan(userId, admin)
        }
        break
      }

      // Pagamento de renovação
      case 'payment': {
        const paymentId = data.id

        // Buscar detalhes do pagamento no MP
        const paymentRes = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            },
          }
        )
        const payment = await paymentRes.json()

        if (payment.status === 'approved') {
          // Renovação aprovada — resetar contador de gerações se for Básico
          const sub = await admin
            .from('subscriptions')
            .select('user_id, plan_type')
            .eq('mp_subscription_id', payment.metadata?.preapproval_id)
            .single()

          if (sub.data?.plan_type === 'basic') {
            await admin.from('users')
              .update({
                recipe_generations_used: 0,
                generation_cycle_start: new Date().toISOString(),
              })
              .eq('id', sub.data.user_id)
          }
        }
        break
      }
    }
  } catch (error) {
    console.error('[mp-webhook] Erro:', error)
  }

  // Sempre responder 200 para o MP não reenviar
  return NextResponse.json({ received: true })
}

async function recalculateUserPlan(userId: string, admin: any) {
  const { data: activeSubs } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('plan_type', { ascending: false })

  if (!activeSubs || activeSubs.length === 0) {
    await admin.from('users')
      .update({ active_plan: null, plan_status: 'expired' })
      .eq('id', userId)
    return
  }

  const best = activeSubs[0]
  await admin.from('users')
    .update({
      active_plan: best.plan_type,
      plan_period: best.plan_period,
      plan_status: 'active',
    })
    .eq('id', userId)
}
