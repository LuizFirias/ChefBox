import Link from "next/link";
import { useState } from "react";

import type { Recipe } from "@/lib/types";
import type { SavedMealPlan } from "@/lib/app-storage";
import { SavedMealPlansSection } from "@/components/home/saved-meal-plans-section";

type SavedRecipesScreenProps = {
  recipes: Recipe[];
  onRemoveRecipe: (recipeId: string) => void;
  mealPlans: SavedMealPlan[];
  onRemoveMealPlan: (planId: string) => void;
  onCreateShoppingList?: (plan: SavedMealPlan) => void;
};

export function SavedRecipesScreen({
  recipes,
  onRemoveRecipe,
  mealPlans,
  onRemoveMealPlan,
  onCreateShoppingList,
}: SavedRecipesScreenProps) {
  const [activeTab, setActiveTab] = useState<"recipes" | "plans">("recipes");

  if (recipes.length === 0 && mealPlans.length === 0) {
    return (
      <section className="mt-6 flex flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-4xl">
          🔖
        </div>
        <h3 className="mt-5 text-xl font-bold text-[#1A1A2E]">
          Nenhum item salvo ainda
        </h3>
        <p className="mt-2 max-w-xs text-sm leading-6 text-[#6B7280]">
          Quando você salvar receitas ou planejamentos, eles aparecem aqui para consultar depois.
        </p>
        <button
          type="button"
          onClick={() => {
            const receitasTab = document.querySelector('[data-tab="receitas"]') as HTMLButtonElement;
            receitasTab?.click();
          }}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl border-none bg-[#F4713A] px-7 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#E85D20] hover:shadow-lg active:scale-95"
        >
          Explorar receitas
        </button>
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-4">
      <div className="flex gap-2 rounded-[28px] border border-slate-200 bg-white p-1.5">
        <button
          type="button"
          onClick={() => setActiveTab("recipes")}
          className={`flex-1 rounded-[20px] py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "recipes"
              ? "bg-[#2D3142] text-white"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Receitas ({recipes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("plans")}
          className={`flex-1 rounded-[20px] py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "plans"
              ? "bg-[#2D3142] text-white"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Planejamentos ({mealPlans.length})
        </button>
      </div>

      {activeTab === "recipes" && recipes.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-4xl">
            📖
          </div>
          <h3 className="mt-5 text-xl font-bold text-[#1A1A2E]">
            Nenhuma receita salva ainda
          </h3>
          <p className="mt-2 max-w-xs text-sm leading-6 text-[#6B7280]">
            Quando você salvar uma receita, ela aparece aqui.
          </p>
        </div>
      )}

      {activeTab === "plans" && (
        <SavedMealPlansSection
          plans={mealPlans}
          onCreateShoppingList={onCreateShoppingList}
          onRemovePlan={onRemoveMealPlan}
        />
      )}

      {activeTab === "recipes" && recipes.length > 0 && (
        <div className="space-y-3">{recipes.map((recipe) => (
        <article
          key={recipe.id}
          className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(45,49,66,0.06)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-[#2D3142]">
                {recipe.title}
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {recipe.description}
              </p>
            </div>
            <span className="rounded-full bg-[#FFF1EB] px-3 py-1 text-xs font-semibold text-[#FF6B35]">
              {recipe.prepTime}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500">
            <div className="rounded-2xl bg-[#F7F9FB] px-3 py-2 text-center">
              <p className="font-semibold text-[#2D3142]">{recipe.servings}</p>
              <p>pessoas</p>
            </div>
            <div className="rounded-2xl bg-[#F7F9FB] px-3 py-2 text-center">
              <p className="font-semibold text-[#2D3142]">{recipe.protein.ingredients.length + (recipe.base?.reduce((s, b) => s + b.ingredients.length, 0) ?? 0)}</p>
              <p>itens</p>
            </div>
            <div className="rounded-2xl bg-[#EEF5EE] px-3 py-2 text-center">
              <p className="font-semibold text-[#4D7C4F]">{recipe.prepTime}</p>
              <p>tempo</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Link
              href={`/dashboard?recipe=${recipe.id}`}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-[#2D3142] px-4 text-sm font-semibold text-white"
            >
              Abrir ficha
            </Link>
            <button
              type="button"
              onClick={() => onRemoveRecipe(recipe.id)}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-500"
            >
              Remover
            </button>
          </div>
        </article>
      ))}
        </div>
      )}
    </section>
  );
}