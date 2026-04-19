"use client";

import { useState } from "react";

import { LIBRARY_CATEGORIES, type LibraryRecipe } from "@/lib/recipe-library-data";

// ─── Card de receita do acervo ──────────────────────────────────────────────
function LibraryRecipeCard({
  recipe,
  categoryEmoji,
}: {
  recipe: LibraryRecipe;
  categoryEmoji: string;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <article className="w-[160px] shrink-0 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_4px_16px_rgba(45,49,66,0.07)]">
      {/* Imagem / placeholder */}
      <div className="relative flex h-[120px] w-full items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-emerald-50">
        <span className="text-4xl">{categoryEmoji}</span>
        <span className="absolute right-2 top-2 rounded-full bg-[#FFF1EB] px-2 py-0.5 text-[10px] font-semibold text-[#FF6B35]">
          {recipe.prepTime}
        </span>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="line-clamp-2 text-xs font-semibold leading-4 text-[#2D3142]">
          {recipe.name}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            {recipe.servings} pessoa{recipe.servings !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={() => setSaved((s) => !s)}
            className={`flex h-6 w-6 items-center justify-center rounded-lg border transition ${
              saved
                ? "border-[#FF6B35] bg-orange-50 text-[#FF6B35]"
                : "border-slate-200 text-slate-400 hover:border-[#FF6B35] hover:text-[#FF6B35]"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-3.5 w-3.5 ${saved ? "fill-current stroke-current" : "fill-none stroke-current"}`}
              strokeWidth="2"
            >
              <path d="m12 20-1.4-1.27C6.2 14.73 3.5 12.28 3.5 8.98A4.48 4.48 0 0 1 8 4.5c1.54 0 3.02.72 4 1.87A5.2 5.2 0 0 1 16 4.5a4.48 4.48 0 0 1 4.5 4.48c0 3.3-2.7 5.75-7.1 9.76z" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Modal de detalhes da receita ────────────────────────────────────────────
function RecipeDetailModal({
  recipe,
  categoryEmoji,
  onClose,
}: {
  recipe: LibraryRecipe;
  categoryEmoji: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white pb-8 pt-5 shadow-2xl"
        style={{ maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 text-2xl">
              {categoryEmoji}
            </div>
            <div>
              <h2 className="text-lg font-bold leading-5 text-[#2D3142]">{recipe.name}</h2>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <span>⏱ {recipe.prepTime}</span>
                <span>·</span>
                <span>👥 {recipe.servings} pessoa{recipe.servings !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Ingredients */}
        <div className="mt-5 px-5">
          <h3 className="text-sm font-bold text-[#2D3142]">Ingredientes</h3>
          <ul className="mt-2 space-y-1.5">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
                {ing}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="mt-5 px-5">
          <h3 className="text-sm font-bold text-[#2D3142]">Modo de Preparo</h3>
          <ol className="mt-2 space-y-3">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="leading-5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

// ─── Linha de categoria com scroll horizontal ─────────────────────────────────
function CategoryRow({
  category,
}: {
  category: (typeof LIBRARY_CATEGORIES)[number];
}) {
  const [selectedRecipe, setSelectedRecipe] = useState<LibraryRecipe | null>(null);

  return (
    <section>
      {/* Header da categoria */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{category.emoji}</span>
          <h2 className="text-base font-bold text-[#2D3142]">{category.label}</h2>
          {category.recipes.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {category.recipes.length}
            </span>
          )}
        </div>
        {category.recipes.length > 0 && (
          <button type="button" className="text-xs font-semibold text-[#FF6B35] hover:text-[#E85D20]">
            Ver mais →
          </button>
        )}
      </div>

      {/* Cards ou empty state */}
      {category.recipes.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {category.recipes.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => setSelectedRecipe(recipe)}
              className="text-left"
            >
              <LibraryRecipeCard recipe={recipe} categoryEmoji={category.emoji} />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-400">Receitas em breve</p>
        </div>
      )}

      {/* Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          categoryEmoji={category.emoji}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </section>
  );
}

// ─── Tela principal do acervo ─────────────────────────────────────────────────
export function RecipeLibraryScreen() {
  return (
    <section className="mt-4 space-y-6 pb-32">
      {/* Header */}
      <article className="rounded-[28px] bg-[#2D3142] p-5 text-white shadow-[0_18px_42px_rgba(45,49,66,0.14)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
          Acervo
        </p>
        <h1 className="mt-1 text-2xl font-bold">Receitas</h1>
        <p className="mt-1 text-sm leading-5 text-white/70">
          Receitas testadas e organizadas por categoria, prontas para você preparar.
        </p>
      </article>

      {/* Categorias */}
      {LIBRARY_CATEGORIES.map((category) => (
        <CategoryRow key={category.id} category={category} />
      ))}
    </section>
  );
}
