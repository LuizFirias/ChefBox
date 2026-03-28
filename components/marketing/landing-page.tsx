import Link from "next/link";

import { APP_DESCRIPTION, APP_NAME, PREMIUM_FEATURES } from "@/lib/config";

const demoRecipes = [
  "Arroz cremoso de frango com panela unica",
  "Omelete proteica de geladeira",
  "Macarrao rapido com tomate e atum",
];

export function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-8 sm:px-6 sm:py-12">
      <section className="grid gap-8 rounded-[36px] bg-[#f3e7d7] p-6 shadow-[0_30px_100px_rgba(55,35,5,0.1)] lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-800">
            PWA mobile-first
          </p>
          <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-[1.02] text-stone-950 sm:text-6xl">
            {APP_NAME} transforma ingredientes soltos em jantar claro, rapido e
            aproveitavel.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-stone-700 sm:text-lg">
            {APP_DESCRIPTION} Informe o que voce tem, escolha um modo como
            rapido ou high protein e receba sugestoes objetivas com quantidades
            e passo a passo.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
            >
              Testar gratis
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center rounded-full border border-stone-400/50 px-6 py-3 text-sm font-semibold text-stone-800 transition hover:border-stone-900"
            >
              Ver fluxo
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-stone-700">
            <span className="rounded-full bg-white/80 px-4 py-2">
              4 geracoes gratis por dia
            </span>
            <span className="rounded-full bg-white/80 px-4 py-2">
              Instalavel no celular
            </span>
            <span className="rounded-full bg-white/80 px-4 py-2">
              Saida em JSON estruturado na API
            </span>
          </div>
        </div>

        <div className="rounded-[32px] bg-stone-950 p-5 text-stone-50">
          <p className="text-sm uppercase tracking-[0.3em] text-stone-400">
            Demo do resultado
          </p>
          <div className="mt-6 space-y-4">
            {demoRecipes.map((recipe, index) => (
              <div key={recipe} className="rounded-3xl bg-white/8 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-amber-300">
                  Receita {index + 1}
                </p>
                <p className="mt-2 text-xl font-medium">{recipe}</p>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  Ingredientes com quantidade, passos em checklist e variacoes com um toque.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="grid gap-4 md:grid-cols-3">
        {[
          ["1. Digite o que tem", "Ingredientes livres ou atalhos com um toque."],
          ["2. Ajuste o objetivo", "Rapido, leve ou high protein sem reescrever tudo."],
          ["3. Gere e execute", "Receitas claras, com quantidades e passos curtos."],
        ].map(([title, description]) => (
          <div key={title} className="rounded-[28px] border border-black/5 bg-white p-5">
            <h2 className="text-2xl font-semibold text-stone-950">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[32px] bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Valor do MVP
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-stone-950">
            Menos decisao, mais refeicao pronta.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
            O produto foi desenhado para uso diario, celular na mao e baixa friccao.
            A interface evita cadastro forcado, entrega utilidade imediata e
            cria paywall apenas depois de valor percebido.
          </p>
        </div>

        <div className="rounded-[32px] bg-[#efe0cf] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-700">
            Premium bloqueado
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
            {PREMIUM_FEATURES.map((feature) => (
              <li key={feature} className="rounded-2xl bg-white/70 px-4 py-3">
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}