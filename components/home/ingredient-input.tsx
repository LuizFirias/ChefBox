"use client";

import { useState } from "react";

type IngredientInputProps = {
  inputValue: string;
  onInputChange: (value: string) => void;
  ingredients: string[];
  servings: number;
  onServingsChange: (value: number) => void;
  dishType: "breakfast" | "lunch" | "snack" | "dinner";
  onDishTypeChange: (value: "breakfast" | "lunch" | "snack" | "dinner") => void;
  diet: string;
  onDietChange: (value: string) => void;
  onRemoveIngredient: (ingredient: string) => void;
  onAddIngredient: (ingredient: string) => void;
};

export function IngredientInput({
  inputValue,
  onInputChange,
  ingredients,
  servings,
  onServingsChange,
  dishType,
  onDishTypeChange,
  diet,
  onDietChange,
  onRemoveIngredient,
  onAddIngredient,
}: IngredientInputProps) {
  const [draft, setDraft] = useState("");

  function BoxIcon() {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
        <path d="M4 7.5 12 4l8 3.5" />
        <path d="M4 7.5V16.5L12 20l8-3.5V7.5" />
        <path d="M12 20V12" />
        <path d="M4 7.5 12 12l8-4.5" />
      </svg>
    );
  }

  function commitIngredient(rawValue: string) {
    const value = rawValue.trim();

    if (!value) {
      return;
    }

    onAddIngredient(value);
    setDraft("");
    onInputChange("");
  }

  return (
    <div className="rounded-[28px] border border-[#e7ebf1] bg-white p-4 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F7F9FB] text-[#4D7C4F] shadow-sm">
          <BoxIcon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#2D3142]">
            Ingredientes disponíveis
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Adicione itens para gerar sugestões com gramaturas e preparo objetivo.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-[#F7F9FB] p-3">
        <div className="flex flex-wrap gap-2">
          {ingredients.map((ingredient) => (
            <button
              key={ingredient}
              type="button"
              onClick={() => onRemoveIngredient(ingredient)}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-[#2D3142]"
            >
              <span>{ingredient}</span>
              <span className="text-[#FF6B35]">×</span>
            </button>
          ))}

          <input
            value={draft || inputValue}
            onChange={(event) => {
              setDraft(event.target.value);
              onInputChange(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                commitIngredient(draft || inputValue);
              }
            }}
            placeholder="Adicionar ingrediente"
            className="min-w-32 flex-1 bg-transparent px-2 py-2 text-sm text-[#2D3142] outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between rounded-3xl bg-[#F7F9FB] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[#2D3142]">Quantidade de pessoas</p>
            <p className="mt-1 text-xs text-slate-500">
              A IA calcula quantidades e preparo com base nesse número.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => onServingsChange(Math.max(1, servings - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold text-slate-500"
            >
              −
            </button>
            <span className="min-w-10 text-center text-sm font-semibold text-[#2D3142]">
              {servings}
            </span>
            <button
              type="button"
              onClick={() => onServingsChange(Math.min(8, servings + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold text-slate-500"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <div className="rounded-3xl bg-[#F7F9FB] p-3">
          <p className="text-sm font-semibold text-[#2D3142]">Tipo de prato *</p>
          <p className="mt-1 text-xs text-slate-500">
            Escolha qual refeição você quer preparar.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onDishTypeChange("breakfast")}
              className={`rounded-xl border-[1.5px] px-4 py-2.5 text-sm font-medium transition-all ${
                dishType === "breakfast"
                  ? "border-[#F4713A] bg-[#F4713A] text-white shadow-sm font-semibold"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#F4713A] hover:text-[#F4713A]"
              }`}
            >
              ☕ Café da manhã
            </button>
            <button
              type="button"
              onClick={() => onDishTypeChange("lunch")}
              className={`rounded-xl border-[1.5px] px-4 py-2.5 text-sm font-medium transition-all ${
                dishType === "lunch"
                  ? "border-[#F4713A] bg-[#F4713A] text-white shadow-sm font-semibold"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#F4713A] hover:text-[#F4713A]"
              }`}
            >
              🍲 Almoço
            </button>
            <button
              type="button"
              onClick={() => onDishTypeChange("snack")}
              className={`rounded-xl border-[1.5px] px-4 py-2.5 text-sm font-medium transition-all ${
                dishType === "snack"
                  ? "border-[#F4713A] bg-[#F4713A] text-white shadow-sm font-semibold"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#F4713A] hover:text-[#F4713A]"
              }`}
            >
              🥤 Lanche
            </button>
            <button
              type="button"
              onClick={() => onDishTypeChange("dinner")}
              className={`rounded-xl border-[1.5px] px-4 py-2.5 text-sm font-medium transition-all ${
                dishType === "dinner"
                  ? "border-[#F4713A] bg-[#F4713A] text-white shadow-sm font-semibold"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#F4713A] hover:text-[#F4713A]"
              }`}
            >
              🍴 Jantar
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-[#F7F9FB] p-3">
          <p className="text-sm font-semibold text-[#2D3142]">Restrição diética</p>
          <p className="mt-1 text-xs text-slate-500">
            Opcional: selecione se tiver preferência alimentar.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onDietChange(diet === "" ? "" : "")}
              className={`rounded-xl border-[1.5px] px-4 py-2.5 text-sm font-medium transition-all ${
                diet === ""
                  ? "border-[#F4713A] bg-[#F4713A] text-white shadow-sm font-semibold"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#F4713A] hover:text-[#F4713A]"
              }`}
            >
              Nenhuma
            </button>
            <button
              type="button"
              onClick={() => onDietChange(diet === "vegetariana" ? "" : "vegetariana")}
              className={`rounded-xl border-[1.5px] px-4 py-2.5 text-sm font-medium transition-all ${
                diet === "vegetariana"
                  ? "border-[#F4713A] bg-[#F4713A] text-white shadow-sm font-semibold"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#F4713A] hover:text-[#F4713A]"
              }`}
            >
              🥕 Vegetariana
            </button>
            <button
              type="button"
              onClick={() => onDietChange(diet === "vegana" ? "" : "vegana")}
              className={`rounded-xl border-[1.5px] px-4 py-2.5 text-sm font-medium transition-all ${
                diet === "vegana"
                  ? "border-[#F4713A] bg-[#F4713A] text-white shadow-sm font-semibold"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#F4713A] hover:text-[#F4713A]"
              }`}
            >
              🌱 Vegana
            </button>
            <button
              type="button"
              onClick={() => onDietChange(diet === "low-carb" ? "" : "low-carb")}
              className={`rounded-xl border-[1.5px] px-4 py-2.5 text-sm font-medium transition-all ${
                diet === "low-carb"
                  ? "border-[#F4713A] bg-[#F4713A] text-white shadow-sm font-semibold"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#F4713A] hover:text-[#F4713A]"
              }`}
            >
              ⚡ Low-carb
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => commitIngredient(draft || inputValue)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#FFF1EB] px-4 text-sm font-semibold text-[#FF6B35] transition hover:bg-[#ffe8de]"
        >
          <span className="text-lg leading-none">+</span>
          <span>Adicionar ingrediente</span>
        </button>
      </div>
    </div>
  );
}