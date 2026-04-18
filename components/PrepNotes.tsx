import type { MealPlanPrepDay } from "@/lib/types";

type PrepNotesProps = {
  prepPlan: MealPlanPrepDay[];
  onCopy?: () => void;
  onExport?: () => void;
};

export function PrepNotes({ prepPlan, onCopy, onExport }: PrepNotesProps) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-3 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Plano de execução
          </p>
          <h2 className="mt-1.5 text-xl font-bold text-[#2D3142]">
            Ganho real de tempo
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
        {prepPlan.map((prepDay) => (
          <div key={prepDay.day} className="rounded-3xl border border-slate-100 bg-[#F8FAFC] p-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {prepDay.day}
            </h3>
            <div className="mt-2 space-y-1.5">
              {prepDay.tasks.map((task, index) => (
                <label
                  key={`${prepDay.day}-${index}`}
                  className="flex items-start gap-2 rounded-2xl bg-white px-2 py-2"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#4D7C4F] focus:ring-[#4D7C4F]"
                  />
                  <span className="text-sm leading-6 text-slate-700">{task}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}