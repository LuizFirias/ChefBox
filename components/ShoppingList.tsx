import type { MealPlanShoppingCategory } from "@/lib/types";

type ShoppingListProps = {
  categories: MealPlanShoppingCategory[];
  onCopy?: () => void;
  onExport?: () => void;
};

export function ShoppingList({ categories, onCopy, onExport }: ShoppingListProps) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-3 shadow-[0_18px_42px_rgba(45,49,66,0.06)] md:sticky md:top-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Lista de compras
          </p>
          <h2 className="mt-1.5 text-xl font-bold text-[#2D3142]">
            Ver lista completa
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600"
          >
            Copiar
          </button>
          <button
            type="button"
            onClick={onExport}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#FFF1EB] px-3 text-xs font-semibold text-[#FF6B35]"
          >
            Exportar
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {categories.map((category) => (
          <div
            key={category.category}
            className="rounded-3xl border border-slate-100 bg-[#F8FAFC] p-3"
          >
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {category.category}
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              {category.items.map((item, index) => (
                <li
                  key={`${category.category}-${item.name}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white px-2 py-1.5"
                >
                  <span>{item.name}</span>
                  <span className="font-medium text-slate-500">{item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}