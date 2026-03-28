"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import {
  getSavedRecipes,
  removeSavedRecipe,
  saveGeneratedRecipes,
  saveRecipe,
} from "@/lib/app-storage";
import { FilterModal } from "@/components/home/filter-modal";
import { AccountScreen } from "@/components/home/account-screen";
import { HistoryCard } from "@/components/home/history-card";
import { IngredientInput } from "@/components/home/ingredient-input";
import { ListsScreen } from "@/components/home/lists-screen";
import { RecipeCard } from "@/components/home/recipe-card";
import { SavedRecipesScreen } from "@/components/home/saved-recipes-screen";
import { AppButton } from "@/components/ui/app-button";
import { mergeIngredients } from "@/lib/ingredients";
import type { Recipe, UsageState } from "@/lib/types";

type GenerateRecipesPayload = {
  recipes: Recipe[];
  usage: UsageState;
  source: "ai" | "fallback";
};

type FilterState = {
  time: string[];
  diet: string[];
  allergies: string[];
  goals: string[];
  dishTypes: string[];
};

type TabId = "home" | "saved" | "lists" | "account";

const initialFilters: FilterState = {
  time: [],
  diet: [],
  allergies: [],
  goals: ["Rápido"],
  dishTypes: [],
};

const historyItems = [
  {
    title: "Arroz cremoso de frango com tomate",
    time: "25 min",
    ingredientsCount: 6,
    dateLabel: "24 Mar",
  },
  {
    title: "Nasi liwet de frigideira",
    time: "15 min",
    ingredientsCount: 4,
    dateLabel: "17 Mar",
  },
];

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="m4 11 8-6 8 6" />
      <path d="M6 10.5V19h12v-8.5" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M7 5h10a1 1 0 0 1 1 1v13l-6-3-6 3V6a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M8 7h11" />
      <path d="M8 12h11" />
      <path d="M8 17h11" />
      <path d="M4 7h.01" />
      <path d="M4 12h.01" />
      <path d="M4 17h.01" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M16 19a4 4 0 0 0-8 0" />
      <circle cx="12" cy="10" r="3" />
      <path d="M4 19a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function HomeScreen() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [inputValue, setInputValue] = useState("");
  const [servings, setServings] = useState(2);
  const [selectedIngredients, setSelectedIngredients] = useState([
    "Frango",
    "Ovo",
    "Cebola",
  ]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
    setSavedRecipes(getSavedRecipes());
  }, []);

  const navItems = [
    { id: "home" as const, label: "Home", icon: <HomeIcon /> },
    { id: "saved" as const, label: "Salvos", icon: <BookmarkIcon /> },
    { id: "lists" as const, label: "Listas", icon: <ListIcon /> },
    { id: "account" as const, label: "Conta", icon: <UserIcon /> },
  ];

  if (!mounted) {
    return (
      <main className="mx-auto flex w-full max-w-107.5 flex-1 flex-col px-4 pb-24 pt-6 sm:px-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-h-20 flex-1 items-center md:hidden">
            <Image
              src="/header%201200x400%20transparente.png"
              alt="ChefBox"
              width={260}
              height={88}
              className="h-16 w-auto object-contain object-left"
              priority
            />
          </div>

          <div className="hidden md:block">
            <h1 className="max-w-[12ch] text-4xl font-bold leading-[1.02] text-[#2D3142]">
              Não sabe o que cozinhar hoje?
            </h1>
            <p className="mt-3 max-w-[28ch] text-sm leading-6 text-slate-500">
              Gere uma sugestão objetiva com custo estimado, porções e preparo sem enrolação.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 rounded-full border border-slate-200 bg-white shadow-[0_12px_24px_rgba(45,49,66,0.06)]" />
        </header>

        <section className="mt-6 rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_40px_rgba(45,49,66,0.08)]">
          <div className="h-5 w-32 rounded-full bg-slate-100" />
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedIngredients.map((ingredient) => (
              <div
                key={ingredient}
                className="inline-flex h-9 w-20 rounded-full bg-slate-100"
              />
            ))}
          </div>
          <div className="mt-4 h-14 rounded-2xl bg-slate-100" />
          <div className="mt-4 h-14 rounded-2xl bg-[#FF6B35]/12" />
        </section>

        <section className="mt-5 h-36 rounded-[28px] bg-[#FF6B35] p-4 opacity-90" />

        <section className="mt-6 space-y-3">
          <div className="h-6 w-24 rounded-full bg-slate-100" />
          <div className="h-28 rounded-[28px] bg-white/90 shadow-[0_18px_40px_rgba(45,49,66,0.08)]" />
          <div className="h-28 rounded-[28px] bg-white/90 shadow-[0_18px_40px_rgba(45,49,66,0.08)]" />
        </section>
      </main>
    );
  }

  function addIngredient(ingredient: string) {
    setSelectedIngredients((current) => {
      if (current.some((item) => item.toLowerCase() === ingredient.toLowerCase())) {
        return current;
      }

      return [...current, ingredient];
    });
  }

  function removeIngredient(ingredient: string) {
    setSelectedIngredients((current) => current.filter((item) => item !== ingredient));
  }

  function toggleFilter(group: keyof FilterState, option: string) {
    setFilters((current) => ({
      ...current,
      [group]: current[group].includes(option)
        ? current[group].filter((item) => item !== option)
        : [...current[group], option],
    }));
  }

  function clearFilters() {
    setFilters(initialFilters);
  }

  function handleSaveRecipe(recipe: Recipe) {
    setSavedRecipes(saveRecipe(recipe));
  }

  function handleRemoveSavedRecipe(recipeId: string) {
    setSavedRecipes(removeSavedRecipe(recipeId));
  }

  function generateRecipes() {
    const ingredients = mergeIngredients(selectedIngredients, inputValue);

    if (ingredients.length < 2) {
      setError("Adicione pelo menos 2 ingredientes para gerar uma receita útil.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/generate-recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredients,
          servings,
        }),
      });

      const payload = (await response.json()) as
        | GenerateRecipesPayload
        | { error?: string; usage?: UsageState };

      if (!response.ok) {
        const errorPayload = payload as { error?: string; usage?: UsageState };
        setError(errorPayload.error ?? "Não foi possível gerar receita agora.");
        if (errorPayload.usage) {
          setUsage(errorPayload.usage);
        }
        return;
      }

      const successPayload = payload as GenerateRecipesPayload;
      setRecipes(successPayload.recipes);
      saveGeneratedRecipes(successPayload.recipes);
      setUsage(successPayload.usage);
      setActiveTab("home");
    });
  }

  return (
    <>
      <FilterModal
        open={showFilters}
        value={filters}
        onClose={() => setShowFilters(false)}
        onToggle={toggleFilter}
        onClear={clearFilters}
      />

      <main className="mx-auto flex w-full max-w-107.5 flex-1 flex-col px-4 pb-24 pt-6 sm:px-6">
        {activeTab === "home" ? (
          <>
            <header className="flex items-start justify-between gap-4">
              <div className="flex min-h-20 flex-1 items-center md:hidden">
                <Image
                  src="/header%201200x400%20transparente.png"
                  alt="ChefBox"
                  width={260}
                  height={88}
                  className="h-16 w-auto object-contain object-left"
                  priority
                />
              </div>

              <div className="hidden md:block">
                <h1 className="max-w-[12ch] text-3xl font-bold leading-[1.05] text-[#2D3142]">
                  Não sabe o que cozinhar?
                </h1>
                <p className="mt-3 max-w-[28ch] text-sm leading-6 text-slate-500">
                  Gere uma receita prática com ingredientes, quantidade certa para cada pessoa e custo estimado.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_12px_24px_rgba(45,49,66,0.06)]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
                  <path d="M4 7h16" />
                  <path d="M7 12h10" />
                  <path d="M10 17h4" />
                  <circle cx="18" cy="7" r="1.5" fill="currentColor" />
                  <circle cx="6" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="14" cy="17" r="1.5" fill="currentColor" />
                </svg>
              </button>
            </header>

            <section className="mt-6">
              <IngredientInput
                inputValue={inputValue}
                onInputChange={setInputValue}
                ingredients={selectedIngredients}
                servings={servings}
                onServingsChange={setServings}
                onAddIngredient={addIngredient}
                onRemoveIngredient={removeIngredient}
              />

              <AppButton
                fullWidth
                className="mt-4"
                onClick={generateRecipes}
                disabled={isPending}
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                }
              >
                {isPending ? "Gerando receita" : "Gerar receita"}
              </AppButton>

              {usage ? (
                <p className="mt-3 text-center text-xs font-medium text-slate-400">
                  {usage.isPremium
                    ? "Plano premium ativo"
                    : `${usage.remaining} gerações restantes hoje`}
                </p>
              ) : null}

              {error ? (
                <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
            </section>

            <section className="mt-5 rounded-[28px] bg-[#FF6B35] p-4 text-white shadow-[0_18px_38px_rgba(255,107,53,0.22)]">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                    Premium
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-white">
                    Receitas ilimitadas
                  </h2>
                  <p className="mt-1 text-sm text-white/80">
                    Destrave planejamento semanal, lista de compras e visão consolidada de custos.
                  </p>
                </div>
                <div className="grid h-20 w-24 grid-cols-2 gap-2 rounded-3xl bg-white/12 p-3">
                  <div className="rounded-2xl bg-white/18 p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/70">Semana</p>
                    <p className="mt-1 text-sm font-bold">7d</p>
                  </div>
                  <div className="rounded-2xl bg-white/18 p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/70">Custo</p>
                    <p className="mt-1 text-sm font-bold">R$</p>
                  </div>
                </div>
              </div>
            </section>

            {recipes.length > 0 ? (
              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#2D3142]">Sugestões</h2>
                  <Link href={`/dashboard?recipe=${recipes[0]?.id ?? ""}`} className="text-sm font-semibold text-[#4D7C4F]">
                    Abrir ficha
                  </Link>
                </div>
                <div className="space-y-3">
                  {recipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      isSaved={savedRecipes.some((savedRecipe) => savedRecipe.id === recipe.id)}
                      onSaveRecipe={handleSaveRecipe}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-6 flex-1">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#2D3142]">Histórico</h2>
                <button type="button" className="text-sm font-semibold text-slate-500">
                  Ver tudo
                </button>
              </div>

              <div className="space-y-3">
                {historyItems.map((item) => (
                  <HistoryCard key={item.title} {...item} />
                ))}
              </div>
            </section>
          </>
        ) : null}

        {activeTab === "saved" ? (
          <SavedRecipesScreen
            recipes={savedRecipes}
            onRemoveRecipe={handleRemoveSavedRecipe}
          />
        ) : null}

        {activeTab === "lists" ? <ListsScreen recipes={savedRecipes} /> : null}

        {activeTab === "account" ? (
          <AccountScreen isPremium={usage?.isPremium ?? false} />
        ) : null}

        <nav className="fixed inset-x-0 bottom-4 mx-auto flex w-[calc(100%-2rem)] max-w-99.5 items-center justify-around rounded-[28px] border border-slate-200 bg-white/92 px-4 py-3 shadow-[0_18px_42px_rgba(45,49,66,0.10)] backdrop-blur md:bottom-6">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-3 text-xs font-medium ${
                activeTab === item.id ? "text-[#FF6B35]" : "text-slate-400"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </>
  );
}