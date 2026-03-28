import Link from "next/link";

import type { Recipe } from "@/lib/types";

type SavedRecipesScreenProps = {
  recipes: Recipe[];
  onRemoveRecipe: (recipeId: string) => void;
};

export function SavedRecipesScreen({
  recipes,
  onRemoveRecipe,
}: SavedRecipesScreenProps) {
  if (recipes.length === 0) {
    return (
      <section className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-white/90 p-6 text-center shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Salvos
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#2D3142]">
          Nenhuma receita salva ainda
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Quando você salvar uma sugestão gerada, ela aparece aqui para consultar depois.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-3">
      {recipes.map((recipe) => (
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
              <p className="font-semibold text-[#2D3142]">{recipe.ingredients.length}</p>
              <p>itens</p>
            </div>
            <div className="rounded-2xl bg-[#EEF5EE] px-3 py-2 text-center">
              <p className="font-semibold text-[#4D7C4F]">{recipe.estimatedCost}</p>
              <p>custo</p>
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
    </section>
  );
}