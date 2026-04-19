"use client";

import { useRouter } from "next/navigation";
import type { Feature } from "@/lib/types";

type PaywallModalProps = {
  open: boolean;
  onClose: () => void;
  feature?: Feature;
  title?: string;
  description?: string;
};

const FEATURE_INFO: Record<
  Feature,
  {
    title: string;
    description: string;
    badge: string;
    benefits: string[];
    suggestedPlan: "basic" | "pro";
  }
> = {
  recipe_generation: {
    title: "Limite de receitas atingido",
    description:
      "Você atingiu o limite mensal de 60 receitas. Faça upgrade para continuar gerando receitas personalizadas.",
    badge: "Plano Básico",
    benefits: [
      "60 receitas por mês",
      "Calculadora de macros ilimitada",
      "Histórico e favoritos salvos",
    ],
    suggestedPlan: "basic",
  },
  planner: {
    title: "Planejamento semanal exclusivo",
    description:
      "O planejador de refeições é exclusivo para assinantes Pro. Crie planos semanais inteligentes com lista de compras.",
    badge: "Plano Pro",
    benefits: [
      "Receitas ilimitadas",
      "Planejamento semanal personalizado",
      "Lista de compras automática",
      "Rotina de meal prep",
      "Estimativa de custos",
    ],
    suggestedPlan: "pro",
  },
  basic_macros: {
    title: "Calculadora de Macros",
    description: "Disponível em todos os planos",
    badge: "Free",
    benefits: ["Cálculo básico de macros"],
    suggestedPlan: "basic",
  },
  saved_recipes: {
    title: "Receitas Salvas",
    description: "Disponível para usuários premium",
    badge: "Premium",
    benefits: ["Salvar receitas favoritas", "Histórico ilimitado"],
    suggestedPlan: "basic",
  },
  smart_market: {
    title: "Lista de Compras Inteligente",
    description: "Recurso disponível para usuários premium",
    badge: "Premium",
    benefits: ["Lista de compras otimizada", "Organização por categorias"],
    suggestedPlan: "basic",
  },
  recipe_history: {
    title: "Histórico de Receitas",
    description: "Disponível para usuários premium",
    badge: "Premium",
    benefits: ["Histórico completo de receitas", "Acesso ilimitado"],
    suggestedPlan: "basic",
  },
  fixed_recipes: {
    title: "Receitas Fixas",
    description: "Recurso premium",
    badge: "Premium",
    benefits: ["Acesso a receitas fixas testadas"],
    suggestedPlan: "basic",
  },
  detailed_macros: {
    title: "Macros Detalhados",
    description: "Cálculo avançado de macronutrientes",
    badge: "Plano Pro",
    benefits: ["Análise detalhada de macros", "Micronutrientes", "Recomendações personalizadas"],
    suggestedPlan: "pro",
  },
  macro_text: {
    title: "Calculadora de Macros por Texto",
    description: "Você atingiu o limite mensal de cálculos de macros. Faça upgrade para continuar.",
    badge: "Plano Básico",
    benefits: ["30 cálculos de macros/mês", "Análise nutricional detalhada"],
    suggestedPlan: "basic",
  },
  photo_analysis: {
    title: "Análise de Foto por IA",
    description: "A análise de refeições por foto é exclusiva para assinantes. Faça upgrade para usar.",
    badge: "Plano Básico",
    benefits: ["15 análises de foto/mês", "Identificação automática de ingredientes"],
    suggestedPlan: "basic",
  },
};

export function PaywallModal({
  open,
  onClose,
  feature = "recipe_generation",
  title,
  description,
}: PaywallModalProps) {
  const router = useRouter();
  const info = FEATURE_INFO[feature];

  if (!open) {
    return null;
  }

  const displayTitle = title || info.title;
  const displayDescription = description || info.description;

  function handleUpgrade() {
    router.push("/planos");
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end bg-black/45 p-4 sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md rounded-[32px] bg-[#fffaf4] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
            {info.badge}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
            aria-label="Fechar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        <h3 className="mt-3 text-3xl font-semibold text-stone-950">
          {displayTitle}
        </h3>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          {displayDescription}
        </p>

        <div className="mt-6 rounded-3xl bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            {info.suggestedPlan === "pro" ? "Plano Pro inclui:" : "Plano Básico inclui:"}
          </p>
          <ul className="space-y-3 text-sm text-stone-700">
            {info.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#4D7C4F]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {info.suggestedPlan === "pro" && (
          <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] p-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-90">
              Recomendado
            </p>
            <p className="mt-1 text-sm font-medium">
              Plano Pro a partir de R$ 24,90/mês
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleUpgrade}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            Ver planos
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}