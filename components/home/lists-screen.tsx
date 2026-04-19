"use client";

import { useState } from "react";
import type { ShoppingList } from "@/lib/types";
import { ShoppingListModal } from "./shopping-list-modal";

type ListsScreenProps = {
  shoppingLists: ShoppingList[];
  onUpdateLists: () => void;
  onDeleteList: (listId: string) => void;
  onStartShopping: (listId: string) => void;
};

export function ListsScreen({
  shoppingLists,
  onUpdateLists,
  onDeleteList,
  onStartShopping,
}: ListsScreenProps) {
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [renamingListId, setRenamingListId] = useState<string | null>(null);

  function handleStartShopping(list: ShoppingList) {
    onStartShopping(list.id);
    setSelectedList(list);
  }

  return (
    <>
      <ShoppingListModal
        list={selectedList}
        onClose={() => setSelectedList(null)}
        onUpdate={onUpdateLists}
        onFinish={() => {
          setSelectedList(null);
          onUpdateLists();
        }}
      />

      <section className="mt-6 space-y-4">
        <article className="rounded-[28px] border border-slate-200 border-l-4 border-l-[#F4713A] bg-white p-6 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
          <p className="mb-1 text-xs font-bold uppercase tracking-[1px] text-[#F4713A]">
            Listas
          </p>
          <h2 className="text-2xl font-bold text-[#1A1A2E]">Suas listas de compras</h2>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Gerencie suas listas de compras criadas automaticamente ao salvar planejamentos.
          </p>
        </article>

        {/* Shopping Lists */}
        {shoppingLists.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-8 text-center">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#F0F9F0]">
              <svg className="h-9 w-9 text-[#4D7C4F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            
            <h3 className="mt-6 text-[20px] font-bold leading-tight text-[#111827]">
              Nenhuma lista de compras ainda
            </h3>
            <p className="mt-2.5 max-w-[260px] text-sm leading-relaxed text-[#6B7280]">
              Salve um planejamento semanal e sua lista de compras será gerada automaticamente
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Listas de compras ({shoppingLists.length})
            </h3>
            {shoppingLists.map((list) => {
              const totalItems = list.items.length;
              const checkedItems = list.items.filter((item) => item.checked).length;
              const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

              return (
                <article
                  key={list.id}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(45,49,66,0.06)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-lg font-bold text-[#2D3142]">{list.name}</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        {totalItems} itens • {progress}% concluído
                      </p>
                      
                      {/* Progress Bar */}
                      {progress > 0 && (
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full bg-gradient-to-r from-[#4D7C4F] to-[#6B9F6E] transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onDeleteList(list.id)}
                        className="rounded-full p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                        title="Excluir lista"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartShopping(list)}
                      className="flex-1 rounded-full bg-[#4D7C4F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3D6C3F]"
                    >
                      🛒 {list.isActive ? "Continuar compra" : "Iniciar compra"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}