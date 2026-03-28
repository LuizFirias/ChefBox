import Link from "next/link";

import type { Recipe } from "@/lib/types";

type RecipeCardProps = {
  recipe: Recipe;
  isSaved: boolean;
  onSaveRecipe: (recipe: Recipe) => void;
};

export function RecipeCard({ recipe, isSaved, onSaveRecipe }: RecipeCardProps) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_42px_rgba(45,49,66,0.06)]">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F7F9FB] text-[#4D7C4F]">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.8">
            <path d="M4 13h16" />
            <path d="M6 13v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3" />
            <path d="M8 10a2 2 0 1 1 4 0v3" />
            <path d="M12 9a2 2 0 1 1 4 0v4" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-base font-semibold text-[#2D3142]">
              {recipe.title}
            </p>
            <span className="shrink-0 rounded-full bg-[#FFF1EB] px-2.5 py-1 text-xs font-semibold text-[#FF6B35]">
              {recipe.prepTime}
            </span>
          </div>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            {recipe.description}
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-2xl bg-[#F7F9FB] px-3 py-2 text-center text-slate-500">
              <p className="font-semibold text-[#2D3142]">{recipe.ingredients.length}</p>
              <p>itens</p>
            </div>
            <div className="rounded-2xl bg-[#F7F9FB] px-3 py-2 text-center text-slate-500">
              <p className="font-semibold text-[#2D3142]">{recipe.servings}</p>
              <p>pessoas</p>
            </div>
            <div className="rounded-2xl bg-[#EEF5EE] px-3 py-2 text-center text-slate-500">
              <p className="font-semibold text-[#4D7C4F]">{recipe.estimatedCost}</p>
              <p>custo</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Link
              href={`/dashboard?recipe=${recipe.id}`}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-[#2D3142] px-4 text-sm font-semibold text-white"
            >
              Ver ficha
            </Link>
            <button
              type="button"
              onClick={() => onSaveRecipe(recipe)}
              disabled={isSaved}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-500 disabled:opacity-60"
            >
              {isSaved ? "Salva" : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}