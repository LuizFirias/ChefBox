import Link from "next/link";

import type { Recipe } from "@/lib/types";

type RecipeCardProps = {
  recipe: Recipe;
  isSaved: boolean;
  onSaveRecipe: (recipe: Recipe) => void;
};

export function RecipeCard({ recipe, isSaved, onSaveRecipe }: RecipeCardProps) {
  const protein = recipe.protein ?? { title: "Receita", ingredients: [], steps: [] };
  const baseParts = recipe.base ?? [];
  const ingredientCount = protein.ingredients.length + baseParts.reduce((sum, part) => sum + part.ingredients.length, 0);
  const stepsCount = protein.steps.length + baseParts.reduce((sum, part) => sum + part.steps.length, 0) + (recipe.assembly?.length ?? 0);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_4px_16px_rgba(45,49,66,0.06)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-[#f2f8f2] text-[#4D7C4F]">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
            <path d="M4 13h16" />
            <path d="M6 13v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3" />
            <path d="M8 10a2 2 0 1 1 4 0v3" />
            <path d="M12 9a2 2 0 1 1 4 0v4" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-[#2D3142]">
              {recipe.title}
            </p>
            <span className="shrink-0 rounded-full bg-[#FFF1EB] px-2 py-0.5 text-[11px] font-semibold text-[#FF6B35]">
              {recipe.prepTime}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
            <span><strong className="font-semibold text-[#2D3142]">{ingredientCount}</strong> itens</span>
            <span><strong className="font-semibold text-[#2D3142]">{recipe.servings}</strong> pessoas</span>
            <span className="text-[#4D7C4F]"><strong className="font-semibold">{stepsCount}</strong> etapas</span>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <Link
          href={`/dashboard?recipe=${recipe.id}`}
          className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl bg-[#F4713A] px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#E85D20] active:scale-95"
        >
          Ver ficha
        </Link>
        <button
          type="button"
          onClick={() => onSaveRecipe(recipe)}
          disabled={isSaved}
          className={`inline-flex min-h-9 w-10 shrink-0 items-center justify-center rounded-xl border-[1.5px] text-sm font-semibold transition-all ${
            isSaved
              ? "border-[#F4713A] bg-orange-50 text-[#F4713A] cursor-not-allowed"
              : "border-slate-200 bg-white text-slate-500 hover:border-[#F4713A] hover:text-[#F4713A] hover:bg-orange-50 active:scale-95"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 ${isSaved ? "fill-current stroke-current" : "fill-none stroke-current"}`}
            strokeWidth="1.8"
          >
            <path d="m12 20-1.4-1.27C6.2 14.73 3.5 12.28 3.5 8.98A4.48 4.48 0 0 1 8 4.5c1.54 0 3.02.72 4 1.87A5.2 5.2 0 0 1 16 4.5a4.48 4.48 0 0 1 4.5 4.48c0 3.3-2.7 5.75-7.1 9.76z" />
          </svg>
        </button>
      </div>
    </article>
  );
}