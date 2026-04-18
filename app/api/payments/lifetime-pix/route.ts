import { NextRequest, NextResponse } from 'next/server'
import { createLifetimePixPayment } from '../lifetime-actions'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID obrigatório' },
        { status: 400 }
      )
    }

    const result = await createLifetimePixPayment(userId)

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[lifetime-pix] Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}
