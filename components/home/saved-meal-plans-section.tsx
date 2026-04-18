"use client";

import { useState } from "react";
import type { SavedMealPlan } from "@/lib/app-storage";
import { SavedMealPlanDetail } from "./saved-meal-plan-detail";

type SavedMealPlansSectionProps = {
  plans: SavedMealPlan[];
  onRemovePlan: (planId: string) => void;
  onCreateShoppingList?: (plan: SavedMealPlan) => void;
};

export function SavedMealPlansSection({
  plans,
  onRemovePlan,
  onCreateShoppingList,
}: SavedMealPlansSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<SavedMealPlan | null>(null);

  if (selectedPlan) {
    return (
      <SavedMealPlanDetail
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onRemove={(planId) => {
          onRemovePlan(planId);
          setSelectedPlan(null);
        }}
      />
    );
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/90 p-6 text-center shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Planejamentos
        </p>
        <h3 className="mt-2 text-xl font-bold text-[#2D3142]">
          Nenhum planejamento salvo ainda
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Quando você salvar um planejamento semanal, ele aparece aqui para consultar depois.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {plans.map((plan) => {
        const daysCount = plan.plan.length;
        const mealsPerDay = plan.settings.meals.length;
        const savedDate = new Date(plan.savedAt).toLocaleDateString("pt-BR");

        return (
          <article
            key={plan.id}
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(45,49,66,0.06)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-[#2D3142]">
                  Plano de {daysCount} {daysCount === 1 ? "dia" : "dias"}
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {plan.settings.calories} kcal/dia • {mealsPerDay} refeições • {plan.settings.goal}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Salvo em {savedDate}
                </p>
              </div>
              <span className="rounded-full bg-[#EEF5EE] px-3 py-1 text-xs font-semibold text-[#4D7C4F]">
                {daysCount}d
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500">
              <div className="rounded-2xl bg-[#F7F9FB] px-3 py-2 text-center">
                <p className="font-semibold text-[#2D3142]">{plan.settings.calories}</p>
                <p>kcal/dia</p>
              </div>
              <div className="rounded-2xl bg-[#F7F9FB] px-3 py-2 text-center">
                <p className="font-semibold text-[#2D3142]">{mealsPerDay}</p>
                <p>refeições</p>
              </div>
              <div className="rounded-2xl bg-[#FFF1EB] px-3 py-2 text-center">
                <p className="font-semibold text-[#FF6B35]">{plan.shoppingList.length}</p>
                <p>categorias</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedPlan(plan)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-[#2D3142] px-4 text-sm font-semibold text-white"
              >
                Abrir planejamento
              </button>
              {onCreateShoppingList && (
                <button
                  type="button"
                  onClick={() => onCreateShoppingList(plan)}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#4D7C4F] bg-white px-4 text-sm font-semibold text-[#4D7C4F] hover:bg-[#EEF5EE] transition-colors"
                  title="Ver lista de compras"
                >
                  🛒
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemovePlan(plan.id)}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-500"
              >
                Remover
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
