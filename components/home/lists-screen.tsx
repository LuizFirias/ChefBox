import type { Recipe } from "@/lib/types";

type ListsScreenProps = {
  recipes: Recipe[];
};

function parseBrl(value: string) {
  const normalized = value.replace(/[^\d,]/g, "").replace(".", "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ListsScreen({ recipes }: ListsScreenProps) {
  const uniqueIngredients = Array.from(
    new Set(recipes.flatMap((recipe) => recipe.ingredients.map((ingredient) => ingredient.name))),
  );
  const weeklyCost = recipes.reduce((total, recipe) => total + parseBrl(recipe.estimatedCost), 0);

  return (
    <section className="mt-6 space-y-4">
      <article className="rounded-[28px] bg-[#2D3142] p-5 text-white shadow-[0_18px_42px_rgba(45,49,66,0.14)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
          Listas
        </p>
        <h2 className="mt-2 text-2xl font-bold">O que é essa área</h2>
        <p className="mt-2 text-sm leading-6 text-white/75">
          Listas reúne sua compra da semana, consolida ingredientes repetidos e organiza o planejamento semanal com foco em custo.
        </p>
      </article>

      <div className="grid grid-cols-2 gap-3">
        <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Receitas base
          </p>
          <p className="mt-2 text-3xl font-bold text-[#2D3142]">{recipes.length}</p>
          <p className="mt-1 text-sm text-slate-500">usadas na semana</p>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Custo estimado
          </p>
          <p className="mt-2 text-3xl font-bold text-[#4D7C4F]">
            {weeklyCost > 0 ? `R$ ${weeklyCost.toFixed(0)}` : "R$ 0"}
          </p>
          <p className="mt-1 text-sm text-slate-500">para a compra</p>
        </article>
      </div>

      <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Lista rápida
            </p>
            <h3 className="mt-1 text-xl font-bold text-[#2D3142]">
              Itens para a próxima semana
            </h3>
          </div>
          <span className="rounded-full bg-[#EEF5EE] px-3 py-1 text-xs font-semibold text-[#4D7C4F]">
            Planejamento semanal
          </span>
        </div>

        {uniqueIngredients.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {uniqueIngredients.map((ingredient) => (
              <span
                key={ingredient}
                className="inline-flex min-h-9 items-center rounded-full bg-[#F7F9FB] px-3 text-sm font-medium text-[#2D3142]"
              >
                {ingredient}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Salve algumas receitas para montar sua primeira lista de compra consolidada.
          </p>
        )}
      </article>
    </section>
  );
}