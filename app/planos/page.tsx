"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/config";
import PaymentModal from "@/components/checkout/PaymentModal";
import LifetimeCheckout from "@/components/checkout/LifetimeCheckout";

const CHECKOUT_URLS: Record<string, string> = {
  "lifetime": "https://seguro.chefbox.com.br/r/C3M8X3UL9Q", // Mantém Yampi apenas para Vitalício
};

type PlanGroup = "basico" | "pro" | "lifetime";
type PlanPeriod = "mensal" | "trimestral" | "anual";

const PLANS = {
  lifetime: {
    id: "lifetime",
    name: "Vitalício",
    description: "Acesso completo para sempre",
    price: 37,
    priceLabel: "R$ 37",
    periodLabel: "pagamento único",
    badge: null,
    features: [
      "Acesso vitalício ao plano Básico",
      "60 receitas por mês",
      "Calculadora de macros",
      "Histórico e favoritos salvos",
      "Sem renovações ou cobranças futuras",
    ],
    popular: false,
    checkoutKey: "lifetime",
  },
};

const BASICO_PLANS = [
  {
    id: "basico-mensal",
    period: "mensal" as PlanPeriod,
    price: 14.90,
    priceLabel: "R$ 14,90",
    periodLabel: "/mês",
    badge: null,
    savings: null,
    checkoutKey: "basico-mensal",
  },
  {
    id: "basico-trimestral",
    period: "trimestral" as PlanPeriod,
    price: 34.90,
    priceLabel: "R$ 34,90",
    periodLabel: "/trimestre",
    badge: "22% OFF",
    savings: "R$ 9,80 de economia",
    checkoutKey: "basico-trimestral",
  },
  {
    id: "basico-anual",
    period: "anual" as PlanPeriod,
    price: 119.90,
    priceLabel: "R$ 119,90",
    periodLabel: "/ano",
    badge: "33% OFF",
    savings: "R$ 58,90 de economia",
    checkoutKey: "basico-anual",
  },
];

const PRO_PLANS = [
  {
    id: "pro-mensal",
    period: "mensal" as PlanPeriod,
    price: 24.90,
    priceLabel: "R$ 24,90",
    periodLabel: "/mês",
    badge: null,
    savings: null,
    checkoutKey: "pro-mensal",
  },
  {
    id: "pro-trimestral",
    period: "trimestral" as PlanPeriod,
    price: 59.90,
    priceLabel: "R$ 59,90",
    periodLabel: "/trimestre",
    badge: "20% OFF",
    savings: "R$ 14,80 de economia",
    checkoutKey: "pro-trimestral",
  },
  {
    id: "pro-anual",
    period: "anual" as PlanPeriod,
    price: 199.90,
    priceLabel: "R$ 199,90",
    periodLabel: "/ano",
    badge: "33% OFF",
    savings: "R$ 98,90 de economia",
    checkoutKey: "pro-anual",
  },
];

export default function PlanosPage() {
  const [user, setUser] = useState<any>(null);
  const [activePeriod, setActivePeriod] = useState<PlanPeriod>("anual");
  const [activeGroup, setActiveGroup] = useState<PlanGroup>("pro");
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    plan: 'basic' | 'pro';
    period: 'monthly' | 'quarterly' | 'annual';
    price: number;
  }>({
    isOpen: false,
    plan: 'pro',
    period: 'monthly',
    price: 24.90,
  });
  const [lifetimeCheckout, setLifetimeCheckout] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const basicoPlan = BASICO_PLANS.find((p) => p.period === activePeriod)!;
  const proPlan = PRO_PLANS.find((p) => p.period === activePeriod)!;

  // Mapear período PT → EN para o PaymentModal
  const periodMap: Record<PlanPeriod, 'monthly' | 'quarterly' | 'annual'> = {
    'mensal': 'monthly',
    'trimestral': 'quarterly',
    'anual': 'annual',
  };

  function handleCheckout(checkoutKey: string) {
    // Se for Vitalício, abre checkout transparente MP
    if (checkoutKey === "lifetime") {
      if (!user) {
        window.location.href = "/login?redirect=/planos";
        return;
      }
      setLifetimeCheckout(true);
      return;
    }

    // Se usuário não está logado, redireciona para login
    if (!user) {
      window.location.href = "/login?redirect=/planos";
      return;
    }

    // Para planos recorrentes, abre o PaymentModal do Mercado Pago
    const isPro = checkoutKey.startsWith("pro-");
    const planType = isPro ? 'pro' : 'basic';
    const plan = isPro ? proPlan : basicoPlan;

    setPaymentModal({
      isOpen: true,
      plan: planType,
      period: periodMap[activePeriod],
      price: plan.price,
    });
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Image
                src="/icone-mestre-1024x1024.png"
                alt={APP_NAME}
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-xl font-bold text-slate-900">{APP_NAME}</span>
          </Link>
          {user ? (
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Voltar ao app
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FF8C42]"
            >
              Entrar
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
            Escolha seu plano <span className="text-[#FF6B35]">Premium</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Desbloqueie todo o potencial do {APP_NAME} com acesso ilimitado a receitas,
            planejamento de refeições e análise nutricional completa.
          </p>

          {/* Seletor de período */}
          <div className="mt-8 inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            {(["anual", "trimestral", "mensal"] as PlanPeriod[]).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setActivePeriod(period)}
                className={`relative rounded-xl px-5 py-2 text-sm font-semibold transition ${
                  activePeriod === period
                    ? "bg-[#FF6B35] text-white shadow"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
                {period !== "mensal" && (
                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                    {period === "trimestral" ? "22% OFF" : "33% OFF"}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-center">

          {/* Plano Lifetime — extrema esquerda */}
          <article className="relative rounded-[28px] border-2 border-slate-200 bg-white p-6 sm:p-8 shadow-lg transition hover:shadow-xl lg:scale-95 lg:order-1">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-900">
              💎 Pagamento Único
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Vitalício</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-900">
                R$ 37
              </h3>
              <p className="text-sm font-normal text-slate-500">pagamento único</p>
              <p className="mt-1 text-xs font-medium text-amber-600">Sem renovações ou cobranças futuras</p>
              <button
                type="button"
                onClick={() => handleCheckout("lifetime")}
                className="mt-6 w-full rounded-2xl border-2 border-amber-500 bg-amber-50 px-6 py-3 text-base font-semibold text-amber-700 transition hover:bg-amber-500 hover:text-white"
              >
                Comprar Vitalício
              </button>
            </div>
            <ul className="mt-6 space-y-2.5">
              {[
                "Acervo completo de receitas fixas",
                "Calculadora de macros básica",
                "Salvos de receitas",
                "Sem limite de tempo",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-center text-xs text-slate-400">🚫 Geração de receitas por IA não inclusa</p>
          </article>

          {/* Plano Pro — destaque no centro com melhor custo-benefício */}
          <article className="relative rounded-[28px] border-2 border-[#FF6B35] bg-white p-6 sm:p-8 shadow-xl ring-4 ring-[#FF6B35]/10 transition hover:shadow-2xl lg:scale-105 lg:order-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FF6B35] px-3 py-1 text-xs font-bold text-white">
              ⭐ Melhor Custo-Benefício
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#FF6B35]">Pro</p>
              <h3 className="mt-2 text-4xl font-bold text-slate-900">
                {proPlan.priceLabel}
              </h3>
              <p className="text-sm font-normal text-slate-500">{proPlan.periodLabel}</p>
              {proPlan.savings && (
                <p className="mt-1 text-xs font-medium text-green-600">{proPlan.savings}</p>
              )}
              <button
                type="button"
                onClick={() => handleCheckout(proPlan.checkoutKey)}
                className="mt-6 w-full rounded-2xl bg-[#FF6B35] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#FF8C42]"
              >
                Assinar Pro
              </button>
              <p className="mt-3 text-xs text-slate-400">
                🔄 Renova automaticamente
              </p>
            </div>
            <ul className="mt-6 space-y-2.5">
              {[
                "Geração por IA: ILIMITADA",
                "Planejador semanal de refeições",
                "Lista de mercado inteligente",
                "Calculadora de macros detalhada",
                "Histórico completo de receitas",
                "Salvos ilimitados",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6B35]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </article>

          {/* Plano Básico */}
          <article className="relative rounded-[28px] border-2 border-slate-200 bg-white p-6 sm:p-8 shadow-lg transition hover:shadow-xl lg:scale-95 lg:order-3">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Básico</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-900">
                {basicoPlan.priceLabel}
              </h3>
              <p className="text-sm font-normal text-slate-500">{basicoPlan.periodLabel}</p>
              {basicoPlan.savings && (
                <p className="mt-1 text-xs font-medium text-green-600">{basicoPlan.savings}</p>
              )}
              <button
                type="button"
                onClick={() => handleCheckout(basicoPlan.checkoutKey)}
                className="mt-6 w-full rounded-2xl border-2 border-[#FF6B35] px-6 py-3 text-base font-semibold text-[#FF6B35] transition hover:bg-[#FF6B35] hover:text-white"
              >
                Assinar Básico
              </button>
              <p className="mt-3 text-xs text-slate-400">
                🔄 Renova automaticamente
              </p>
            </div>
            <ul className="mt-6 space-y-2.5">
              {[
                "Acervo completo de receitas fixas",
                "Geração por IA: até 60/mês",
                "Calculadora de macros básica",
                "Salvos de receitas",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#4D7C4F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {/* Tabela Comparativa de Funcionalidades */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-slate-900">
            Compare os Planos
          </h2>
          
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Funcionalidade</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-amber-700">Vitalício</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Básico</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-[#FF6B35]">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-700">Acervo de receitas fixas</td>
                  <td className="px-6 py-4 text-center text-2xl">✅</td>
                  <td className="px-6 py-4 text-center text-2xl">✅</td>
                  <td className="px-6 py-4 text-center text-2xl">✅</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-700">Calculadora de macros básica</td>
                  <td className="px-6 py-4 text-center text-2xl">✅</td>
                  <td className="px-6 py-4 text-center text-2xl">✅</td>
                  <td className="px-6 py-4 text-center text-2xl">✅</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-700">Salvos de receitas</td>
                  <td className="px-6 py-4 text-center text-2xl">✅</td>
                  <td className="px-6 py-4 text-center text-2xl">✅</td>
                  <td className="px-6 py-4 text-center text-2xl">✅</td>
                </tr>
                <tr className="bg-amber-50/50 hover:bg-amber-50">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">Geração de receitas por IA</td>
                  <td className="px-6 py-4 text-center text-2xl">❌</td>
                  <td className="px-6 py-4 text-center text-xs font-semibold text-green-700">✅ até 60/mês</td>
                  <td className="px-6 py-4 text-center text-xs font-semibold text-[#FF6B35]">✅ ILIMITADO</td>
                </tr>
                <tr className="bg-orange-50/50 hover:bg-orange-50">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">Planejador semanal</td>
                  <td className="px-6 py-4 text-center text-2xl">❌</td>
                  <td className="px-6 py-4 text-center text-2xl">❌</td>
                  <td className="px-6 py-4 text-center text-2xl">✅</td>
                </tr>
                <tr className="bg-orange-50/50 hover:bg-orange-50">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">Lista de mercado inteligente</td>
                  <td className="px-6 py-4 text-center text-2xl">❌</td>
                  <td className="px-6 py-4 text-center text-2xl">❌</td>
                  <td className="px-6 py-4 text-center text-2xl">✅</td>
                </tr>
                <tr className="bg-orange-50/50 hover:bg-orange-50">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">Macros detalhadas com histórico</td>
                  <td className="px-6 py-4 text-center text-2xl">❌</td>
                  <td className="px-6 py-4 text-center text-2xl">❌</td>
                  <td className="px-6 py-4 text-center text-2xl">✅</td>
                </tr>
                <tr className="bg-orange-50/50 hover:bg-orange-50">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">Histórico de receitas geradas</td>
                  <td className="px-6 py-4 text-center text-2xl">❌</td>
                  <td className="px-6 py-4 text-center text-2xl">❌</td>
                  <td className="px-6 py-4 text-center text-2xl">✅</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-4 md:hidden">
            {[
              { name: 'Acervo de receitas fixas', lifetime: true, basic: true, pro: true },
              { name: 'Calculadora de macros básica', lifetime: true, basic: true, pro: true },
              { name: 'Salvos de receitas', lifetime: true, basic: true, pro: true },
              { name: 'Geração de receitas por IA', lifetime: false, basic: '60/mês', pro: 'ILIMITADO', highlight: true },
              { name: 'Planejador semanal', lifetime: false, basic: false, pro: true, highlight: true },
              { name: 'Lista de mercado inteligente', lifetime: false, basic: false, pro: true, highlight: true },
              { name: 'Macros detalhadas', lifetime: false, basic: false, pro: true, highlight: true },
              { name: 'Histórico de receitas', lifetime: false, basic: false, pro: true, highlight: true },
            ].map((feature) => (
              <div
                key={feature.name}
                className={`rounded-xl border p-4 ${
                  feature.highlight ? 'border-orange-200 bg-orange-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                <p className={`mb-3 text-sm font-semibold ${feature.highlight ? 'text-slate-900' : 'text-slate-700'}`}>
                  {feature.name}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="mb-1 text-xs font-medium text-amber-600">Vitalício</p>
                    <p className="text-lg">
                      {feature.lifetime === true ? '✅' : feature.lifetime === false ? '❌' : feature.lifetime}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="mb-1 text-xs font-medium text-slate-600">Básico</p>
                    <p className={`text-lg ${typeof feature.basic === 'string' ? 'text-xs font-semibold text-green-700' : ''}`}>
                      {feature.basic === true ? '✅' : feature.basic === false ? '❌' : feature.basic}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="mb-1 text-xs font-medium text-[#FF6B35]">Pro</p>
                    <p className={`text-lg ${typeof feature.pro === 'string' ? 'text-xs font-semibold text-[#FF6B35]' : ''}`}>
                      {feature.pro === true ? '✅' : feature.pro === false ? '❌' : feature.pro}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            ⭐ Destaque: Recursos exclusivos do plano Pro
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-slate-900">
            Perguntas Frequentes
          </h2>

          <div className="space-y-6">
            <details className="group rounded-2xl border border-slate-200 p-6">
              <summary className="cursor-pointer text-lg font-semibold text-slate-900">
                Posso cancelar a qualquer momento?
              </summary>
              <p className="mt-3 text-slate-600">
                Sim! Você pode cancelar sua assinatura a qualquer momento através das
                configurações da sua conta. Após o cancelamento, você ainda terá acesso
                até o final do período pago.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200 p-6">
              <summary className="cursor-pointer text-lg font-semibold text-slate-900">
                Quais métodos de pagamento são aceitos?
              </summary>
              <p className="mt-3 text-slate-600">
                Aceitamos cartão de crédito através do Mercado Pago, com processamento
                seguro e criptografado. Seus dados de pagamento nunca são armazenados
                em nossos servidores.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200 p-6">
              <summary className="cursor-pointer text-lg font-semibold text-slate-900">
                Existe período de teste gratuito?
              </summary>
              <p className="mt-3 text-slate-600">
                O plano gratuito permite gerar até 4 receitas por dia. Para acesso
                ilimitado, você pode assinar qualquer um dos nossos planos Premium.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200 p-6">
              <summary className="cursor-pointer text-lg font-semibold text-slate-900">
                O que acontece se eu mudar de plano?
              </summary>
              <p className="mt-3 text-slate-600">
                Você pode fazer upgrade ou downgrade a qualquer momento. No caso de upgrade,
                o valor é calculado proporcionalmente. No downgrade, o novo plano entra
                em vigor no próximo ciclo.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
        <p>
          Pagamento seguro processado pela <strong>Mercado Pago</strong>
        </p>
        <p className="mt-2">
          Tem dúvidas?{" "}
          <a href="mailto:suporte@chefbox.app" className="font-medium text-[#FF6B35] hover:underline">
            Entre em contato
          </a>
        </p>
      </footer>

      {/* Modal de Pagamento do Mercado Pago */}
      {user && (
        <>
          <PaymentModal
            isOpen={paymentModal.isOpen}
            onClose={() => setPaymentModal((prev) => ({ ...prev, isOpen: false }))}
            plan={paymentModal.plan}
            period={paymentModal.period}
            price={paymentModal.price}
            userId={user.id}
          />
          
          <LifetimeCheckout
            isOpen={lifetimeCheckout}
            onClose={() => setLifetimeCheckout(false)}
            userId={user.id}
          />
        </>
      )}
    </main>
  );
}
