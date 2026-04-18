"use client";

import { useState } from "react";

import type { MealPlanDay, MealPlanMeal } from "@/lib/types";

type MealDayCardProps = {
  day: MealPlanDay;
  defaultOpen?: boolean;
};

const MEAL_META: Record<
  MealPlanMeal["type"],
  { label: string; icon: string; accent: string }
> = {
  breakfast: {
    label: "Café da manhã",
    icon: "☕",
    accent: "border-amber-100 bg-amber-50/70",
  },
  lunch: {
    label: "Almoço",
    icon: "🍽️",
    accent: "border-emerald-100 bg-emerald-50/70",
  },
  snack: {
    label: "Lanche",
    icon: "🥤",
    accent: "border-purple-100 bg-purple-50/70",
  },
  dinner: {
    label: "Jantar",
    icon: "🌙",
    accent: "border-indigo-100 bg-indigo-50/70",
  },
};

export function MealDayCard({ day, defaultOpen = false }: MealDayCardProps) {
  const [open, setOpen] = useState(() => defaultOpen);

  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_42px_rgba(45,49,66,0.06)]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {day.day}
          </p>
          <h3 className="mt-2 text-xl font-bold text-[#2D3142]">
            Plano do dia
          </h3>
          {day.totalCalories ? (
            <p className="mt-1 text-xs text-slate-500">
              Total: <span className="font-semibold text-[#FF6B35]">{day.totalCalories} kcal</span>
            </p>
          ) : null}
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-[#F8FAFC] text-slate-500">
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 fill-none stroke-current transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth="2"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="mt-4 space-y-3">
          {day.meals.map((meal) => {
            const meta = MEAL_META[meal.type];

            // Fallback para dados antigos ou inválidos
            if (!meta) {
              return null;
            }

            return (
              <section
                key={`${day.day}-${meal.type}`}
                className={`rounded-3xl border p-4 ${meta.accent}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {meta.icon} {meta.label}
                  </p>
                  {meal.type !== "lunch" && "calories" in meal && meal.calories ? (
                    <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-slate-600">
                      {meal.calories} kcal
                    </span>
                  ) : null}
                </div>

                {meal.type === "lunch" ? (
                  <>
                    {meal.calories ? (
                      <div className="mt-2 mb-3">
                        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                          {meal.calories} kcal
                        </span>
                      </div>
                    ) : null}
                    <div className="mt-3 space-y-2">
                      <div className="rounded-2xl bg-white/70 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          🍗 Prato principal
                        </p>
                        <p className="mt-1 text-sm font-medium text-[#2D3142]">
                          {meal.mainDish}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white/70 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          🍚 Acompanhamento
                        </p>
                        <p className="mt-1 text-sm font-medium text-[#2D3142]">
                          {meal.sideDish}
                        </p>
                      </div>

                      {meal.extra ? (
                        <div className="rounded-2xl bg-white/70 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            🥦 Extra
                          </p>
                          <p className="mt-1 text-sm font-medium text-[#2D3142]">
                            {meal.extra}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="mt-2 text-base font-semibold text-[#2D3142]">
                      {meal.title}
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {meal.description}
                    </p>
                    {meal.type === "dinner" && "calories" in meal && meal.calories && meal.calories > 1500 ? (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2">
                        <p className="text-[10px] font-medium text-amber-700">
                          ⚠️ Jantar calórico devido a poucas refeições no dia. Considere adicionar mais refeições no planejamento.
                        </p>
                      </div>
                    ) : null}
                  </>
                )}
              </section>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}