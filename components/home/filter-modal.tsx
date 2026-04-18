"use client";

type FilterState = {
  time: string[];
  diet: string[];
  allergies: string[];
  goals: string[];
  dishTypes: string[];
};

type FilterModalProps = {
  open: boolean;
  value: FilterState;
  onClose: () => void;
  onToggle: (group: keyof FilterState, value: string) => void;
  onClear: () => void;
};

const filterSections: Array<{
  key: keyof FilterState;
  title: string;
  options: string[];
}> = [
  {
    key: "time",
    title: "Tempo",
    options: ["Até 15 min", "Até 30 min", "Até 60 min"],
  },
  {
    key: "diet",
    title: "Dieta",
    options: ["Vegano", "Vegetariano", "Low-carb", "Keto", "Pescetariano"],
  },
  {
    key: "allergies",
    title: "Alergias",
    options: ["Leite", "Ovo", "Amendoim", "Soja", "Gluten", "Peixe"],
  },
  {
    key: "goals",
    title: "Objetivo",
    options: ["Fitness", "Econômico", "Rápido", "Aprender a cozinhar"],
  },
  {
    key: "dishTypes",
    title: "Tipo de prato",
    options: ["Café", "Brunch", "Almoço", "Jantar", "Snack", "Sobremesa"],
  },
];

export function FilterModal({
  onClear,
  onClose,
  onToggle,
  open,
  value,
}: FilterModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#2D3142]/30 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Fechar filtros"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div className="relative mx-auto w-full max-w-[430px] max-h-[85vh] overflow-y-auto rounded-t-[32px] bg-white px-5 pb-6 pt-5 shadow-[0_-18px_52px_rgba(45,49,66,0.18)]">
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2D3142]">Filtros da receita</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F9FB] text-slate-400"
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {filterSections.map((section) => (
            <section key={section.key}>
              <p className="text-sm font-semibold text-[#2D3142]">{section.title}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {section.options.map((option) => {
                  const active = value[section.key].includes(option);

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onToggle(section.key, option)}
                      className={`min-h-10 rounded-full px-4 text-sm font-medium transition ${
                        active
                          ? "bg-[#FF6B35] text-white"
                          : "bg-[#F7F9FB] text-slate-500"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <button
          type="button"
          onClick={onClear}
          className="mt-6 w-full text-center text-sm font-semibold text-[#FF6B35]"
        >
          Limpar tudo
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#FF6B35] px-5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(255,107,53,0.22)] transition hover:bg-[#e85d2b]"
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}