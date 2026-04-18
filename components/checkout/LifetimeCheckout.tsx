'use client'

import { useState } from 'react'
import Image from 'next/image'

interface LifetimeCheckoutProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export default function LifetimeCheckout({ isOpen, onClose, userId }: LifetimeCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix')
  const [loading, setLoading] = useState(false)
  const [pixCode, setPixCode] = useState<string | null>(null)
  const [pixQrCode, setPixQrCode] = useState<string | null>(null)

  if (!isOpen) return null

  async function handlePixPayment() {
    setLoading(true)
    try {
      const response = await fetch('/api/payments/lifetime-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Erro ao gerar PIX')
        return
      }

      setPixCode(data.pixCode)
      setPixQrCode(data.qrCodeBase64)
    } catch (error) {
      alert('Erro ao processar pagamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-center text-2xl font-bold text-slate-900">
          Plano Vitalício
        </h2>
        <p className="mt-2 text-center text-3xl font-bold text-amber-600">
          R$ 37,00
        </p>
        <p className="text-center text-sm text-slate-500">pagamento único</p>

        {/* Seletor de Método de Pagamento */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setPaymentMethod('pix')}
            className={`flex-1 rounded-xl border-2 p-4 text-center font-semibold transition ${
              paymentMethod === 'pix'
                ? 'border-amber-500 bg-amber-50 text-amber-700'
                : 'border-slate-200 text-slate-600 hover:border-amber-300'
            }`}
          >
            <div className="text-2xl">📱</div>
            <div className="mt-1 text-sm">PIX</div>
          </button>
          <button
            onClick={() => setPaymentMethod('card')}
            className={`flex-1 rounded-xl border-2 p-4 text-center font-semibold transition ${
              paymentMethod === 'card'
                ? 'border-amber-500 bg-amber-50 text-amber-700'
                : 'border-slate-200 text-slate-600 hover:border-amber-300'
            }`}
          >
            <div className="text-2xl">💳</div>
            <div className="mt-1 text-sm">Cartão</div>
          </button>
        </div>

        {/* PIX Payment */}
        {paymentMethod === 'pix' && (
          <div className="mt-6">
            {!pixCode ? (
              <button
                onClick={handlePixPayment}
                disabled={loading}
                className="w-full rounded-2xl bg-amber-500 px-6 py-4 font-bold text-white transition hover:bg-amber-600 disabled:opacity-50"
              >
                {loading ? 'Gerando PIX...' : 'Gerar QR Code PIX'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  {pixQrCode && (
                    <Image
                      src={`data:image/png;base64,${pixQrCode}`}
                      alt="QR Code PIX"
                      width={200}
                      height={200}
                      className="mx-auto"
                    />
                  )}
                  <p className="mt-4 text-sm font-semibold text-slate-700">
                    Escaneie o QR Code ou copie o código abaixo:
                  </p>
                  <div className="mt-3 break-all rounded-lg bg-white p-3 text-xs text-slate-600">
                    {pixCode}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pixCode)
                      alert('Código PIX copiado!')
                    }}
                    className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                  >
                    Copiar Código PIX
                  </button>
                </div>
                <p className="text-center text-xs text-slate-500">
                  Após o pagamento, seu acesso será liberado automaticamente em até 5 minutos.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Card Payment */}
        {paymentMethod === 'card' && (
          <div className="mt-6">
            <p className="text-center text-sm text-slate-500">
              Pagamento com cartão em desenvolvimento...
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <Image src="/mercadopago-logo.png" alt="Mercado Pago" width={100} height={33} />
        </div>
      </div>
    </div>
  )
}
