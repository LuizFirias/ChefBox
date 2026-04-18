'use server'

import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export async function createLifetimePixPayment(userId: string) {
  try {
    const admin = createSupabaseAdminClient()
    if (!admin) {
      return { error: 'Erro ao conectar com banco de dados' }
    }

    // Buscar email do usuário
    const { data: userData } = await admin
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (!userData?.email) {
      return { error: 'Usuário não encontrado' }
    }

    const payment = new Payment(mp)

    // Criar pagamento PIX
    const response = await payment.create({
      body: {
        transaction_amount: 37.00,
        description: 'Chefbox Plano Vitalício',
        payment_method_id: 'pix',
        payer: {
          email: userData.email,
        },
        external_reference: userId,
        metadata: {
          plan: 'lifetime',
          user_id: userId,
        },
      },
    })

    if (!response.point_of_interaction?.transaction_data) {
      return { error: 'Erro ao gerar PIX' }
    }

    const pixData = response.point_of_interaction.transaction_data

    // Salvar pagamento pendente no banco
    await admin.from('yampi_transactions').insert({
      user_id: userId,
      yampi_transaction_id: `mp_${response.id}`,
      status: 'pending',
      plan: 'lifetime',
      amount: 37.00,
      payment_method: 'pix',
    })

    return {
      success: true,
      pixCode: pixData.qr_code,
      qrCodeBase64: pixData.qr_code_base64,
      paymentId: response.id,
    }
  } catch (error: any) {
    console.error('[lifetime-pix] Erro:', error)
    return { error: 'Erro ao processar pagamento' }
  }
}
