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
      <section className="mt-6 flex flex-col items-center justify-center px-6 py-8 text-center">
        {/* SVG ilustração */}
        <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#FFF0EB]">
          <svg className="h-9 w-9 text-[#E05A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
          </svg>
        </div>
        
        <h3 className="mt-6 text-[20px] font-bold leading-tight text-[#111827]">
          Suas receitas favoritas ficam aqui
        </h3>
        <p className="mt-2.5 max-w-[260px] text-sm leading-relaxed text-[#6B7280]">
          Gere receitas com os ingredientes que você tem e salve as que mais gostar
        </p>
        
        <button
          type="button"
          onClick={() => {
            const receitasTab = document.querySelector('[data-tab="receitas"]') as HTMLButtonElement;
            receitasTab?.click();
            // Scroll para o formulário de ingredientes
            setTimeout(() => {
              const ingredientInput = document.querySelector('input[placeholder*="cenoura"]') as HTMLInputElement;
              ingredientInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              ingredientInput?.focus();
            }, 100);
          }}
          className="mt-6 inline-flex h-[50px] items-center justify-center rounded-xl bg-[#E05A2B] px-6 text-sm font-semibold text-white transition hover:bg-[#C54E24]"
        >
          Gerar minha primeira receita
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
        <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
          {/* SVG ilustração */}
          <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#FFF0EB]">
            <svg className="h-9 w-9 text-[#E05A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
            </svg>
          </div>
          
          <h3 className="mt-6 text-[20px] font-bold leading-tight text-[#111827]">
            Suas receitas favoritas ficam aqui
          </h3>
          <p className="mt-2.5 max-w-[260px] text-sm leading-relaxed text-[#6B7280]">
            Gere receitas com os ingredientes que você tem e salve as que mais gostar
          </p>
          
          <button
            type="button"
            onClick={() => {
              setActiveTab("recipes");
              const receitasTab = document.querySelector('[data-tab="receitas"]') as HTMLButtonElement;
              receitasTab?.click();
            }}
            className="mt-6 inline-flex h-[50px] items-center justify-center rounded-xl bg-[#E05A2B] px-6 text-sm font-semibold text-white transition hover:bg-[#C54E24]"
          >
            Gerar minha primeira receita
          </button>
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