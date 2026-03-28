"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AppButton } from "@/components/ui/app-button";
import { Tabs } from "@/components/ui/tabs";
import { getRecipeById, isRecipeSaved, saveRecipe } from "@/lib/app-storage";
import type { Recipe } from "@/lib/types";

const fallbackRecipe: Recipe = {
  id: "demo-bife-a-parmegiana",
  description: "Receita caseira com quantidade ajustada, custo previsto e ficha textual pronta para consulta.",
  title: "Nasi liwet de frigideira",
  prepTime: "22 min",
  servings: 2,
  estimatedCost: "R$ 18",
  tags: ["Caseiro", "Pratico"],
  ingredients: [
    { name: "Arroz", quantity: "500 g" },
    { name: "Cebola", quantity: "2" },
    { name: "Alho", quantity: "2 dentes" },
    { name: "Frango", quantity: "300 g" },
  ],
  steps: [
    "Refogue cebola e alho por 2 minutos.",
    "Junte o frango e sele até dourar.",
    "Adicione arroz cozido e ajuste o sal.",
    "Finalize com cheiro-verde e sirva quente.",
  ],
};

export function RecipeDetailsScreen() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState("Ingredientes");
  const [recipe, setRecipe] = useState<Recipe>(fallbackRecipe);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const recipeId = searchParams.get("recipe");

    if (!recipeId) {
      setRecipe(fallbackRecipe);
      setSaved(false);
      return;
    }

    const nextRecipe = getRecipeById(recipeId) ?? fallbackRecipe;
    setRecipe(nextRecipe);
    setSaved(isRecipeSaved(nextRecipe.id));
  }, [searchParams]);

  function handleSaveRecipe() {
    saveRecipe(recipe);
    setSaved(true);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-6 sm:px-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-[0_10px_22px_rgba(45,49,66,0.08)]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveRecipe}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF1EB] text-[#FF6B35] shadow-[0_10px_22px_rgba(255,107,53,0.14)]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
              <path d="m12 20-1.4-1.27C6.2 14.73 3.5 12.28 3.5 8.98A4.48 4.48 0 0 1 8 4.5c1.54 0 3.02.72 4 1.87A5.2 5.2 0 0 1 16 4.5a4.48 4.48 0 0 1 4.5 4.48c0 3.3-2.7 5.75-7.1 9.76z" />
            </svg>
          </button>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-[0_10px_22px_rgba(45,49,66,0.08)]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
              <path d="M14 5h5v5" />
              <path d="m10 14 9-9" />
              <path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" />
            </svg>
          </button>
        </div>
      </div>

      <section className="mt-5 rounded-4xl border border-slate-200 bg-white px-6 pb-6 pt-8 text-center shadow-[0_24px_50px_rgba(45,49,66,0.06)]">
        <div className="mx-auto grid grid-cols-2 gap-3 rounded-[32px] bg-[#F7F9FB] p-5">
          <div className="rounded-3xl bg-white p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tempo</p>
            <p className="mt-2 text-2xl font-bold text-[#FF6B35]">{recipe.prepTime}</p>
          </div>
          <div className="rounded-3xl bg-white p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Custo</p>
            <p className="mt-2 text-2xl font-bold text-[#4D7C4F]">{recipe.estimatedCost}</p>
          </div>
          <div className="rounded-3xl bg-white p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ingredientes</p>
            <p className="mt-2 text-2xl font-bold text-[#2D3142]">{recipe.ingredients.length}</p>
          </div>
          <div className="rounded-3xl bg-white p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Porções</p>
            <p className="mt-2 text-2xl font-bold text-[#2D3142]">{recipe.servings}</p>
          </div>
        </div>

        <h1 className="mt-6 text-4xl font-bold leading-none text-[#2D3142]">
          {recipe.title}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Receita objetiva, com quantidades claras para {recipe.servings} pessoas e execução prática.
        </p>

        <div className="mt-5">
          <Tabs
            options={["Ingredientes", "Modo de preparo"]}
            value={tab}
            onChange={setTab}
          />
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Serve {recipe.servings} {recipe.servings > 1 ? "pessoas" : "pessoa"}
        </p>

        <div className="mt-4 space-y-3 text-left">
          {tab === "Ingredientes"
            ? recipe.ingredients.map((ingredient) => (
                <div
                  key={ingredient.name}
                  className="flex items-center justify-between rounded-3xl border border-slate-200 bg-[#F7F9FB] px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#4D7C4F] shadow-sm">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
                        <path d="M7 5h10" />
                        <path d="M6 9h12" />
                        <path d="M8 13h8" />
                        <path d="M9 17h6" />
                      </svg>
                    </div>
                    <span className="text-base font-medium text-[#2D3142]">
                      {ingredient.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-400">
                    {ingredient.quantity}
                  </span>
                </div>
              ))
            : recipe.steps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-3 rounded-3xl border border-slate-200 bg-[#F7F9FB] px-4 py-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4D7C4F] text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-600">{step}</p>
                </div>
              ))}
        </div>

        <div className="mt-6 rounded-[32px] border border-[#e8dcc9] bg-[linear-gradient(180deg,#f5ebd8_0%,#efe2cb_100%)] p-6 text-left shadow-[0_24px_50px_rgba(124,94,58,0.12)]">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-[#7b6045]">
            Ficha da receita
          </p>
          <h2 className="mt-3 text-center text-3xl font-semibold text-[#5d442f]">
            {recipe.title}
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7b6045]">
                Ingredientes
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5d442f]">
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient.name}>{`• ${ingredient.quantity} de ${ingredient.name}`}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7b6045]">
                Modo de preparo
              </h3>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-[#5d442f]">
                {recipe.steps.map((step, index) => (
                  <li key={step}>{`${index + 1}. ${step}`}</li>
                ))}
              </ol>
            </section>
          </div>
        </div>

        <AppButton
          fullWidth
          className="mt-6"
          icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
              <path d="M20 12a8 8 0 1 1-2.34-5.66" />
              <path d="M20 4v6h-6" />
            </svg>
          }
        >
          Gerar novamente
        </AppButton>
        <p className="mt-2 text-xs font-medium text-slate-400">
          {saved ? "Receita salva na aba Salvos" : "Você pode salvar essa receita para consultar depois"}
        </p>
      </section>
    </main>
  );
}