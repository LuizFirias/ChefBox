import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { createHmac } from 'crypto'

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

/**
 * Valida a assinatura do webhook do Mercado Pago.
 * Formato: x-signature: ts=<timestamp>,v1=<hmac>
 * Template: id:<notification_id>;request-id:<x-request-id>;ts:<timestamp>
 * Ref: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
function validateMpSignature(req: NextRequest, notificationId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    // Sem secret configurado: aceitar mas logar aviso
    console.warn('[mp-webhook] MP_WEBHOOK_SECRET não configurado — assinatura não validada')
    return true
  }

  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id') ?? ''

  if (!xSignature) {
    console.error('[mp-webhook] Header x-signature ausente')
    return false
  }

  // Extrair ts e v1 do header
  const parts = Object.fromEntries(
    xSignature.split(',').map(part => part.split('=').map(s => s.trim()) as [string, string])
  )
  const ts = parts['ts']
  const v1 = parts['v1']

  if (!ts || !v1) {
    console.error('[mp-webhook] Header x-signature malformado:', xSignature)
    return false
  }

  const template = `id:${notificationId};request-id:${xRequestId};ts:${ts}`
  const expected = createHmac('sha256', secret).update(template).digest('hex')

  if (expected !== v1) {
    console.error('[mp-webhook] Assinatura inválida')
    return false
  }

  return true
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    // Body vazio ou inválido — ainda retorna 200 para o MP não reenviar
    return NextResponse.json({ received: true })
  }

  const { type, data } = body as { type?: string; data?: { id?: string } }

  const notificationId = String(data?.id ?? body?.id ?? '')

  // Validar assinatura do MP
  if (!validateMpSignature(req, notificationId)) {
    return NextResponse.json({ received: false, error: 'Invalid signature' }, { status: 401 })
  }

  const admin = createSupabaseAdminClient()

  if (!admin) {
    console.error('[mp-webhook] Erro ao conectar com banco de dados')
    return NextResponse.json({ received: false, error: 'Database connection error' }, { status: 500 })
  }

  console.log('[mp-webhook]', type, notificationId)

  // Idempotência: checar se este evento já foi processado
  if (notificationId && type) {
    const eventKey = `${type}:${notificationId}`
    const { data: existing } = await (admin as any)
      .from('processed_webhook_events')
      .select('id')
      .eq('event_key', eventKey)
      .maybeSingle()

    if (existing) {
      console.log('[mp-webhook] Evento já processado, ignorando:', eventKey)
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Registrar como processado antes de executar a lógica (previne race conditions)
    await (admin as any).from('processed_webhook_events').insert({
      event_key: eventKey,
      event_type: type,
      notification_id: notificationId,
      processed_at: new Date().toISOString(),
    }).select()
  }

  try {
    switch (type) {

      // Assinatura criada ou atualizada
      case 'subscription_preapproval': {
        const preapproval = new PreApproval(mp)
        const sub = await preapproval.get({ id: notificationId })

        const userId = sub.external_reference // ID do usuário que passamos na criação

        if (!userId) {
          // Fallback: buscar pelo mp_subscription_id no Supabase
          console.error('[mp-webhook] external_reference ausente, tentando fallback por mp_subscription_id')
          const { data: subRecord } = await admin
            .from('subscriptions')
            .select('user_id')
            .eq('mp_subscription_id', notificationId)
            .maybeSingle()
          if (!subRecord?.user_id) {
            console.error('[mp-webhook] Usuário não encontrado para subscription:', notificationId)
            break
          }
        }

        const resolvedUserId = userId || ''

        if (sub.status === 'authorized') {
          // Assinatura ativa — garantir que o usuário tem acesso
          await admin.from('subscriptions')
            .update({ status: 'active' })
            .eq('mp_subscription_id', notificationId)

          await admin.from('users')
            .update({ plan_status: 'active' })
            .eq('id', resolvedUserId)

        } else if (sub.status === 'cancelled' || sub.status === 'paused') {
          // Assinatura cancelada ou pausada
          await admin.from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('mp_subscription_id', notificationId)

          // Recalcular plano ativo
          await recalculateUserPlan(resolvedUserId, admin)
        }
        break
      }

      // Pagamento de renovação
      case 'payment': {
        const paymentId = notificationId
        if (!paymentId) break

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
