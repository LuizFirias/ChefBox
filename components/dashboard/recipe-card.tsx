import type { Recipe } from "@/lib/types";

type RecipeCardProps = {
  recipe: Recipe;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <article className="rounded-[28px] border border-black/5 bg-[linear-gradient(180deg,#fffdfa_0%,#f7f3ec_100%)] p-5 shadow-[0_24px_80px_rgba(36,26,11,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-700">
            {recipe.prepTime}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-stone-950">
            {recipe.title}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
            {recipe.description}
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {recipe.tags.map((tag) => (
            <span
              key={`${recipe.id}-${tag}`}
              className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-stone-200/80 bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          {[{ label: recipe.protein.title, part: recipe.protein }, ...(recipe.base?.map((b) => ({ label: b.title, part: b })) ?? [])].map(({ label, part }) => (
            <div key={label} className="mt-4 rounded-2xl border border-stone-100 bg-[#fcfaf7] p-3 first:mt-0">
              <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-stone-700">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
                    <path d="M4 13h16" />
                    <path d="M6 13v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3" />
                  </svg>
                </span>
                {label} — Ingredientes
              </h4>
              <ul className="mt-3 space-y-3 text-sm text-stone-700">
                {part.ingredients.map((ingredient) => (
                  <li
                    key={`${recipe.id}-${label}-${ingredient.name}`}
                    className="flex items-center justify-between gap-3 border-b border-stone-200/80 pb-3 last:border-b-0 last:pb-0"
                  >
                    <span>{ingredient.name}</span>
                    <span className="text-stone-500">{ingredient.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <details className="group rounded-3xl border border-stone-200 bg-white p-4 open:bg-stone-50">
          <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-[0.2em] text-stone-700">
            Passo a passo
          </summary>
          {[{ label: recipe.protein.title, part: recipe.protein }, ...(recipe.base?.map((b) => ({ label: b.title, part: b })) ?? [])].map(({ label, part }) => (
            <div key={label} className="mt-3 rounded-2xl border border-stone-100 bg-[#fcfaf7] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
              <ol className="mt-2 space-y-3">
                {part.steps.map((step, index) => (
                  <li key={`${recipe.id}-${label}-step-${index}`} className="flex gap-3 text-sm text-stone-700">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                      {index + 1}
                    </span>
                    <span className="leading-6">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
          {recipe.assembly && recipe.assembly.length > 0 && (
            <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Montagem</p>
              <ol className="mt-2 space-y-3">
                {recipe.assembly.map((step, index) => (
                  <li key={`${recipe.id}-assembly-step-${index}`} className="flex gap-3 text-sm text-stone-700">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                      {index + 1}
                    </span>
                    <span className="leading-6">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </details>
      </div>
    </article>
  );
}