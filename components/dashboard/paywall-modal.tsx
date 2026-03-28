type PaywallModalProps = {
  open: boolean;
  onClose: () => void;
};

export function PaywallModal({ open, onClose }: PaywallModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 p-4 sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-[32px] bg-[#fffaf4] p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
          Chef AI Pro
        </p>
        <h3 className="mt-3 text-3xl font-semibold text-stone-950">
          Seu limite gratis acabou hoje.
        </h3>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Faça upgrade para continuar gerando receitas, liberar planner semanal e
          organizar compras automaticamente.
        </p>

        <div className="mt-6 rounded-3xl bg-white p-4">
          <ul className="space-y-3 text-sm text-stone-700">
            <li>Geracoes praticamente ilimitadas</li>
            <li>Planner semanal com foco em objetivo</li>
            <li>Lista de compras e meal prep premium</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            Fazer upgrade
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
          >
            Agora nao
          </button>
        </div>
      </div>
    </div>
  );
}