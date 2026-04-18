"use client";

import { useState } from "react";
import type { ShoppingList } from "@/lib/types";
import { toggleShoppingListItem, updateShoppingList } from "@/lib/app-storage";

type ShoppingListModalProps = {
  list: ShoppingList | null;
  onClose: () => void;
  onUpdate: () => void;
  onFinish: () => void;
};

export function ShoppingListModal({
  list,
  onClose,
  onUpdate,
  onFinish,
}: ShoppingListModalProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  if (!list) return null;

  const categories = Array.from(new Set(list.items.map((item) => item.category)));
  const totalItems = list.items.length;
  const checkedItems = list.items.filter((item) => item.checked).length;
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  function handleToggleItem(itemId: string) {
    if (!list) return;
    toggleShoppingListItem(list.id, itemId);
    onUpdate();
  }

  function handleStartRename() {
    if (!list) return;
    setTempName(list.name);
    setIsEditingName(true);
  }

  function handleSaveRename() {
    if (!list) return;
    if (tempName.trim()) {
      updateShoppingList(list.id, { name: tempName.trim() });
      onUpdate();
    }
    setIsEditingName(false);
  }

  function handleFinish() {
    if (!list) return;
    updateShoppingList(list.id, { isActive: false });
    onFinish();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[32px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {isEditingName ? (
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleSaveRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveRename();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  autoFocus
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xl font-bold text-[#2D3142] focus:border-[#FF6B35] focus:outline-none"
                />
              ) : (
                <h2
                  className="cursor-pointer text-2xl font-bold text-[#2D3142] hover:text-[#FF6B35]"
                  onClick={handleStartRename}
                >
                  {list.name}
                </h2>
              )}
              <p className="mt-1 text-sm text-slate-500">
                {checkedItems} de {totalItems} itens • {progress}% concluído
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-[#4D7C4F] to-[#6B9F6E] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="max-h-[calc(90vh-220px)] overflow-y-auto p-6">
          {categories.map((category) => {
            const categoryItems = list.items.filter((item) => item.category === category);
            
            return (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-[#FF6B35] hover:shadow-sm"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleItem(item.id)}
                        className="mt-0.5 h-5 w-5 cursor-pointer rounded border-slate-300 text-[#4D7C4F] focus:ring-2 focus:ring-[#4D7C4F] focus:ring-offset-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`font-medium ${item.checked ? "text-slate-400 line-through" : "text-[#2D3142]"}`}>
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-sm text-slate-500">{item.quantity}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="flex-1 rounded-full bg-[#4D7C4F] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3D6C3F]"
            >
              ✓ Finalizar compra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
