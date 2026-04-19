'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createSubscription } from '@/app/api/subscriptions/actions'

// Importar ícones de bandeiras de cartão
import visaIcon from 'payment-icons/min/flat/visa.svg'
import mastercardIcon from 'payment-icons/min/flat/mastercard.svg'
import eloIcon from 'payment-icons/min/flat/elo.svg'
import amexIcon from 'payment-icons/min/flat/amex.svg'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  plan: 'basic' | 'pro'
  period: 'monthly' | 'quarterly' | 'annual'
  price: number
  userId: string
}

// Mapeamento dos planos para os preapproval_plan_id criados no MP
const PLAN_MAP = {
  basic_monthly:   { amount: 14.90, description: 'Chefbox Básico Mensal' },
  basic_quarterly: { amount: 34.90, description: 'Chefbox Básico Trimestral' },
  basic_annual:    { amount: 119.90, description: 'Chefbox Básico Anual' },
  pro_monthly:     { amount: 24.90, description: 'Chefbox Pro Mensal' },
  pro_quarterly:   { amount: 59.90, description: 'Chefbox Pro Trimestral' },
  pro_annual:      { amount: 199.90, description: 'Chefbox Pro Anual' },
}

declare global {
  interface Window {
    MercadoPago: any
  }
}

export default function PaymentModal({
  isOpen, onClose, plan, period, price, userId
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [mp, setMp] = useState<any>(null)
  const [cardForm, setCardForm] = useState<any>(null)
  const [detectedBrand, setDetectedBrand] = useState<string | null>(null)

  const planKey = `${plan}_${period}` as keyof typeof PLAN_MAP

  // Carrega o SDK do MP via CDN
  useEffect(() => {
    if (!isOpen) return

    const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!
    console.log('[PaymentModal] Public Key:', publicKey?.substring(0, 15) + '...')

    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.async = true
    script.onload = () => {
      const mpInstance = new window.MercadoPago(
        publicKey,
        { locale: 'pt-BR' }
      )
      setMp(mpInstance)
      console.log('[PaymentModal] MercadoPago SDK initialized')
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [isOpen])

  // Inicializa o CardForm após o MP estar pronto
  useEffect(() => {
    if (!mp || !isOpen) return

    const form = mp.cardForm({
      amount: String(price),
      iframe: true,
      form: {
        id: 'chefbox-card-form',
        cardNumber: {
          id: 'form-checkout__cardNumber',
          placeholder: 'Número do cartão',
        },
        expirationDate: {
          id: 'form-checkout__expirationDate',
          placeholder: 'MM/AA',
        },
        securityCode: {
          id: 'form-checkout__securityCode',
          placeholder: 'CVV',
        },
        cardholderName: {
          id: 'form-checkout__cardholderName',
          placeholder: 'Nome como no cartão',
        },
        issuer: { id: 'form-checkout__issuer' },
        installments: { id: 'form-checkout__installments' },
        identificationType: { id: 'form-checkout__identificationType' },
        identificationNumber: {
          id: 'form-checkout__identificationNumber',
          placeholder: 'CPF',
        },
        cardholderEmail: {
          id: 'form-checkout__cardholderEmail',
          placeholder: 'E-mail',
        },
      },
      callbacks: {
        onFormMounted: (error: any) => {
          if (error) console.error('Erro ao montar form:', error)
        },
        onCardTokenReceived: (error: any, token: any) => {
          if (error) console.error('Erro no token:', error)
        },
        onBinChange: (bin: string) => {
          // Detectar bandeira do cartão baseado nos primeiros dígitos
          if (bin.length >= 6) {
            const firstDigit = bin[0]
            if (bin.startsWith('4')) setDetectedBrand('visa')
            else if (bin.startsWith('5')) setDetectedBrand('mastercard')
            else if (bin.startsWith('3')) setDetectedBrand('amex')
            else if (bin.startsWith('6')) setDetectedBrand('elo')
            else setDetectedBrand(null)
          }
        },
        onSubmit: async (event: any) => {
          event.preventDefault()
          setLoading(true)
          setError(null)

          const {
            paymentMethodId,
            issuerId,
            cardholderEmail: email,
            token, // CardToken gerado pelo SDK — seguro
            installments,
            identificationNumber,
            identificationType,
          } = form.getCardFormData()

          console.log('[CardForm] Dados capturados:', {
            paymentMethodId,
            issuerId,
            email,
            token: token ? `${token.substring(0, 10)}...` : 'MISSING',
            identificationNumber,
            identificationType,
          })

          // Garantir que identificationType seja 'CPF' se não vier preenchido
          const finalIdentificationType = identificationType || 'CPF'

          try {
            const result = await createSubscription({
              token,
              paymentMethodId,
              issuerId,
              email,
              identificationNumber,
              identificationType: finalIdentificationType,
              plan,
              period,
              userId,
            })

            if (result.error) {
              setError(result.error)
            } else {
              setSuccess(true)
              setTimeout(() => {
                onClose()
                window.location.reload() // Atualiza o plano no app
              }, 2000)
            }
          } catch (err) {
            setError('Erro ao processar pagamento. Tente novamente.')
          } finally {
            setLoading(false)
          }
        },
        onFetching: (resource: any) => {
          // Pode mostrar loading enquanto busca dados do cartão
        },
      },
    })

    setCardForm(form)

    return () => {
      form.unmount()
    }
  }, [mp, isOpen, price, plan, period, userId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-[#2A2A2A] text-center">
              {PLAN_MAP[planKey]?.description}
            </h2>
            <p className="text-[#E8622A] font-bold text-3xl mt-2 text-center">
              R${price.toFixed(2).replace('.', ',')}
              <span className="text-gray-500 text-base font-normal ml-1">
                /{period === 'monthly' ? 'mês' : period === 'quarterly' ? 'trimestre' : 'ano'}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4"
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-semibold text-green-600">Assinatura ativada!</h3>
            <p className="text-gray-500 text-sm mt-1">Seu plano já está ativo.</p>
          </div>
        ) : (
          <>
            {/* Bandeiras de Cartão Aceitas */}
            <div className="mb-4 pb-4 border-b border-gray-100">
              <p className="text-xs text-gray-500 mb-2">
                {detectedBrand ? 'Bandeira detectada:' : 'Aceitamos:'}
              </p>
              <div className="flex items-center gap-2">
                <Image 
                  src={visaIcon} 
                  alt="Visa" 
                  width={38} 
                  height={25}
                  className={`object-contain transition-opacity ${
                    detectedBrand && detectedBrand !== 'visa' ? 'opacity-30' : 'opacity-100'
                  }`}
                />
                <Image 
                  src={mastercardIcon} 
                  alt="Mastercard" 
                  width={38} 
                  height={25}
                  className={`object-contain transition-opacity ${
                    detectedBrand && detectedBrand !== 'mastercard' ? 'opacity-30' : 'opacity-100'
                  }`}
                />
                <Image 
                  src={eloIcon} 
                  alt="Elo" 
                  width={38} 
                  height={25}
                  className={`object-contain transition-opacity ${
                    detectedBrand && detectedBrand !== 'elo' ? 'opacity-30' : 'opacity-100'
                  }`}
                />
                <Image 
                  src={amexIcon} 
                  alt="American Express" 
                  width={38} 
                  height={25}
                  className={`object-contain transition-opacity ${
                    detectedBrand && detectedBrand !== 'amex' ? 'opacity-30' : 'opacity-100'
                  }`}
                />
              </div>
            </div>

            <form id="chefbox-card-form">
              
              {/* Campos tokenizados pelo MP SDK */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Número do cartão</label>
                  <div
                    id="form-checkout__cardNumber"
                    className="border border-gray-200 rounded-xl h-12 px-3 flex items-center"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Validade</label>
                    <div
                      id="form-checkout__expirationDate"
                      className="border border-gray-200 rounded-xl h-12 px-3"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">CVV</label>
                    <div
                      id="form-checkout__securityCode"
                      className="border border-gray-200 rounded-xl h-12 px-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 block mb-1">Nome no cartão</label>
                  <input
                    id="form-checkout__cardholderName"
                    type="text"
                    className="w-full border border-gray-200 rounded-xl h-12 px-3 text-sm focus:outline-none focus:border-[#E8622A]"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 block mb-1">CPF</label>
                  <input
                    id="form-checkout__identificationNumber"
                    type="text"
                    className="w-full border border-gray-200 rounded-xl h-12 px-3 text-sm focus:outline-none focus:border-[#E8622A]"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 block mb-1">E-mail</label>
                  <input
                    id="form-checkout__cardholderEmail"
                    type="email"
                    className="w-full border border-gray-200 rounded-xl h-12 px-3 text-sm focus:outline-none focus:border-[#E8622A]"
                  />
                </div>

                {/* Campos ocultos necessários pelo SDK */}
                <select id="form-checkout__issuer" className="hidden" />
                <select id="form-checkout__installments" className="hidden" />
                <select id="form-checkout__identificationType" className="hidden" />
              </div>

              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full bg-[#E8622A] text-white rounded-full h-12 font-semibold 
                           hover:bg-[#d4561f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processando...' : `Assinar por R$${price.toFixed(2).replace('.', ',')}`}
              </button>

              {/* Footer com selos de segurança */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-xs text-gray-600 font-medium">
                    Pagamento 100% seguro
                  </p>
                </div>
                
                {/* Logo Mercado Pago */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xs text-gray-500">Processado por</span>
                  <Image 
                    src="/mercadopago-logo.png"
                    alt="Mercado Pago"
                    width={100}
                    height={33}
                    className="opacity-90"
                  />
                </div>
                
                <p className="text-center text-xs text-gray-400">
                  Seus dados são criptografados • SSL certificado
                </p>
                <p className="text-center text-xs text-gray-500 mt-2">
                  Cancele quando quiser • Sem taxas de cancelamento
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
