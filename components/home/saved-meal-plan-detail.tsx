"use client";

import { useState } from "react";
import type { SavedMealPlan } from "@/lib/app-storage";
import { MealDayCard } from "@/components/MealDayCard";
import { ShoppingList } from "@/components/ShoppingList";
import { PrepNotes } from "@/components/PrepNotes";

type SavedMealPlanDetailProps = {
  plan: SavedMealPlan;
  onClose: () => void;
  onRemove: (planId: string) => void;
};

const SHOPPING_CATEGORIES = [
  "Hortifruti",
  "Açougue",
  "Mercearia",
  "Laticínios",
  "Padaria",
  "Congelados",
  "Bebidas",
  "Limpeza",
  "Higiene",
  "Outros",
];

export function SavedMealPlanDetail({
  plan,
  onClose,
  onRemove,
}: SavedMealPlanDetailProps) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Hortifruti");
  const [customItems, setCustomItems] = useState<Array<{ name: string; category: string }>>([]);

  function handleAddItem() {
    if (!newItemName.trim()) return;
    
    setCustomItems([...customItems, { name: newItemName.trim(), category: newItemCategory }]);
    setNewItemName("");
    setShowAddItem(false);
  }

  function handleRemoveCustomItem(index: number) {
    setCustomItems(customItems.filter((_, i) => i !== index));
  }

  const savedDate = new Date(plan.savedAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="sticky top-0 z-10 rounded-[28px] border border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Planejamento Salvo
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#2D3142]">{plan.name}</h2>
            <p className="mt-1 text-sm text-slate-500">Salvo em {savedDate}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onRemove(plan.id)}
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              Excluir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#2D3142] px-3 text-xs font-semibold text-white"
            >
              ← Voltar
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Calorias
            </p>
            <p className="mt-1 text-lg font-bold text-[#FF6B35]">{plan.settings.calories}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Dias
            </p>
            <p className="mt-1 text-lg font-bold text-[#2D3142]">{plan.plan.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Refeições
            </p>
            <p className="mt-1 text-lg font-bold text-[#4D7C4F]">{plan.settings.meals.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Objetivo
            </p>
            <p className="mt-1 text-lg font-bold capitalize text-[#2D3142]">{plan.settings.goal}</p>
          </div>
        </div>
      </div>

      {/* Meal Plan Days */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Refeições por dia
        </h3>
        {plan.plan.map((day, index) => (
          <MealDayCard key={index} day={day} />
        ))}
      </div>

      {/* Shopping List with Custom Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Lista de compras
          </h3>
          <button
            type="button"
            onClick={() => setShowAddItem(!showAddItem)}
            className="inline-flex items-center gap-1 rounded-full border border-[#4D7C4F] bg-white px-3 py-1.5 text-xs font-semibold text-[#4D7C4F] hover:bg-[#EEF5EE]"
          >
            + Adicionar item
          </button>
        </div>

        {showAddItem && (
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-[#2D3142]">Adicionar item personalizado</p>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Nome do item
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Ex: Azeite extra virgem"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#4D7C4F] focus:outline-none focus:ring-2 focus:ring-[#4D7C4F]/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Categoria
                </label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#4D7C4F] focus:outline-none focus:ring-2 focus:ring-[#4D7C4F]/20"
                >
                  {SHOPPING_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex-1 rounded-full bg-[#4D7C4F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3D6C3F]"
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddItem(false);
                    setNewItemName("");
                  }}
                  className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Items */}
        {customItems.length > 0 && (
          <div className="rounded-[24px] border border-[#4D7C4F] bg-[#EEF5EE] p-4">
            <p className="text-sm font-semibold text-[#2D3142]">Itens adicionados para próxima semana</p>
            <div className="mt-3 space-y-2">
              {customItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl bg-white px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-[#2D3142]">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.category}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomItem(index)}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <ShoppingList categories={plan.shoppingList} />
      </div>

      {/* Prep Plan */}
      {plan.prepPlan && plan.prepPlan.length > 0 && (
        <PrepNotes prepPlan={plan.prepPlan} />
      )}

      {/* Macros and Cost */}
      {(plan.macroSummary || plan.estimatedCost) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {plan.macroSummary && (
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Macros médios diários
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-blue-50 px-3 py-2 text-center">
                  <p className="text-xs font-medium text-slate-600">Proteína</p>
                  <p className="mt-1 text-lg font-bold text-blue-600">
                    {plan.macroSummary.protein_g}g
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-50 px-3 py-2 text-center">
                  <p className="text-xs font-medium text-slate-600">Carboidrato</p>
                  <p className="mt-1 text-lg font-bold text-amber-600">
                    {plan.macroSummary.carb_g}g
                  </p>
                </div>
                <div className="rounded-2xl bg-rose-50 px-3 py-2 text-center">
                  <p className="text-xs font-medium text-slate-600">Gordura</p>
                  <p className="mt-1 text-lg font-bold text-rose-600">
                    {plan.macroSummary.fat_g}g
                  </p>
                </div>
              </div>
            </div>
          )}

          {plan.estimatedCost && (
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Custo estimado
              </p>
              <p className="mt-3 text-3xl font-bold text-[#FF6B35]">
                {plan.estimatedCost}
              </p>
              <p className="mt-1 text-sm text-slate-500">Para toda a semana</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
