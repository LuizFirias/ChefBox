"use client";

import { useState, useTransition } from "react";

import { InstallPrompt } from "@/components/pwa/install-prompt";
import { PaywallModal } from "@/components/dashboard/paywall-modal";
import { RecipeCard } from "@/components/dashboard/recipe-card";
import { QUICK_INGREDIENTS } from "@/lib/config";
import { mergeIngredients } from "@/lib/ingredients";
import { recipePreferenceOptions } from "@/lib/types";
import type { Recipe, RecipePreference, UsageState } from "@/lib/types";

type GenerateRecipesPayload = {
  recipes: Recipe[];
  usage: UsageState;
  source: "ai" | "fallback";
};

export function DashboardClient() {
  const [ingredientsText, setIngredientsText] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([
    "frango",
    "arroz",
  ]);
  const [preferences, setPreferences] = useState<RecipePreference[]>([]);
  const [servings, setServings] = useState(2);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleIngredient(ingredient: string) {
    setSelectedIngredients((current) =>
      current.includes(ingredient)
        ? current.filter((item) => item !== ingredient)
        : [...current, ingredient],
    );
  }

  function togglePreference(preference: RecipePreference) {
    setPreferences((current) =>
      current.includes(preference)
        ? current.filter((item) => item !== preference)
        : [...current, preference],
    );
  }

  function submitRecipeRequest(nextPreferences = preferences) {
    const ingredients = mergeIngredients(selectedIngredients, ingredientsText);

    if (ingredients.length < 2) {
      setError("Adicione pelo menos 2 ingredientes para gerar ideias uteis.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/generate-recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Time": Date.now().toString(),
        },
        cache: "no-store",
        body: JSON.stringify({
          ingredients,
          preferences: nextPreferences,
          servings,
        }),
      });

      const payload = (await response.json()) as
        | GenerateRecipesPayload
        | { error?: string; usage?: UsageState; upgradeRequired?: boolean };

      if (!response.ok) {
        const errorPayload = payload as {
          error?: string;
          usage?: UsageState;
          upgradeRequired?: boolean;
        };

        setError(
          errorPayload.error ?? "Nao foi possivel gerar receitas agora.",
        );
        if (errorPayload.usage) {
          setUsage(errorPayload.usage);
        }
        if (errorPayload.upgradeRequired) {
          setShowPaywall(true);
        }
        return;
      }

      const data = payload as GenerateRecipesPayload;
      setRecipes(data.recipes);
      setUsage(data.usage);
    });
  }

  function handleVariation(preference: RecipePreference) {
    const nextPreferences = preferences.includes(preference)
      ? preferences
      : [...preferences, preference];

    setPreferences(nextPreferences);
    submitRecipeRequest(nextPreferences);
  }

  return (
    <>
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <section className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-4xl bg-[#f3e7d7] p-6 shadow-[0_24px_90px_rgba(71,39,0,0.1)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-800">
                  Dashboard
                </p>
                <h1 className="mt-3 text-4xl font-semibold leading-tight text-stone-950">
                  O que tem na sua cozinha hoje?
                </h1>
              </div>
              <InstallPrompt />
            </div>

            <p className="mt-4 text-sm leading-6 text-stone-700">
              Misture ingredientes avulsos, gere receitas em segundos e refine com um toque.
            </p>

            <label className="mt-6 block text-sm font-medium text-stone-800">
              Ingredientes livres
              <textarea
                value={ingredientsText}
                onChange={(event) => setIngredientsText(event.target.value)}
                placeholder="Ex.: frango, arroz, cebola, tomate"
                className="mt-2 min-h-32 w-full rounded-3xl border border-stone-300 bg-white px-4 py-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-900"
              />
            </label>

            <div className="mt-6">
              <p className="text-sm font-medium text-stone-800">Atalhos rapidos</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_INGREDIENTS.map((ingredient) => {
                  const active = selectedIngredients.includes(ingredient);

                  return (
                    <button
                      key={ingredient}
                      type="button"
                      onClick={() => toggleIngredient(ingredient)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-stone-900 text-white"
                          : "bg-white text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      {ingredient}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-stone-800">Variacoes</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {recipePreferenceOptions.map((option) => {
                  const active = preferences.includes(option.value);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => togglePreference(option.value)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-300 bg-transparent text-stone-700 hover:border-stone-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="mt-6 block text-sm font-medium text-stone-800">
              Número de pessoas
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-lg font-semibold text-stone-700 transition hover:bg-stone-50"
                >
                  −
                </button>
                <span className="text-xl font-semibold text-stone-900">{servings}</span>
                <button
                  type="button"
                  onClick={() => setServings(Math.min(8, servings + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-lg font-semibold text-stone-700 transition hover:bg-stone-50"
                >
                  +
                </button>
              </div>
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => submitRecipeRequest()}
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Gerando receitas..." : "Gerar receitas"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIngredientsText("");
                  setSelectedIngredients([]);
                  setPreferences([]);
                  setRecipes([]);
                  setError(null);
                }}
                className="inline-flex items-center justify-center rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-900"
              >
                Limpar
              </button>
            </div>

            {usage ? (
              <div className="mt-6 rounded-3xl bg-white/80 p-4 text-sm text-stone-700">
                <p className="font-semibold text-stone-900">
                  {usage.isPremium
                    ? "Conta premium ativa"
                    : `${usage.remaining} geracoes restantes hoje`}
                </p>
                <p className="mt-1 text-stone-600">
                  {usage.persisted
                    ? `Uso diario: ${usage.used}/${usage.limit}`
                    : "Configure o Supabase para ativar limite diario persistente e historico."}
                </p>
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-4xl bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">
                Resultado
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-stone-950">
                Sugestoes prontas para cozinhar.
              </h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Gere uma primeira resposta e use os atalhos abaixo para refinar sem recomeçar.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {recipePreferenceOptions.map((option) => (
                  <button
                    key={`variation-${option.value}`}
                    type="button"
                    onClick={() => handleVariation(option.value)}
                    className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-900 hover:text-white"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {recipes.length === 0 ? (
              <div className="flex min-h-80 items-center justify-center rounded-4xl border border-dashed border-stone-300 bg-white/70 p-8 text-center text-sm leading-6 text-stone-500">
                Sua primeira geracao vai aparecer aqui com 2 a 4 receitas, quantidades e checklist de preparo.
              </div>
            ) : (
              recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)
            )}
          </div>
        </section>
      </main>
    </>
  );
}