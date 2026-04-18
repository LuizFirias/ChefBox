"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import {
  getGeneratedRecipes,
  getSavedRecipes,
  removeSavedRecipe,
  saveGeneratedRecipes,
  saveRecipe,
  getSavedMealPlans,
  removeSavedMealPlan,
  getShoppingLists,
  deleteShoppingList,
  updateShoppingList,
  type SavedMealPlan,
} from "@/lib/app-storage";
import { AccountScreen } from "@/components/home/account-screen";
import { HistoryCard } from "@/components/home/history-card";
import { IngredientInput } from "@/components/home/ingredient-input";
import { ListsScreen } from "@/components/home/lists-screen";
import { MacroCalculatorScreen } from "@/components/home/macro-calculator-screen";
import { RecipeCard } from "@/components/home/recipe-card";
import { SavedRecipesScreen } from "@/components/home/saved-recipes-screen";
import { MealPlanPage } from "@/components/meal-plan-page";
import { AppButton } from "@/components/ui/app-button";
import { UsageIndicator } from "@/components/shared/usage-indicator";
import { mergeIngredients } from "@/lib/ingredients";
import type { Recipe, UsageState, ShoppingList } from "@/lib/types";

type GenerateRecipesPayload = {
  recipes: Recipe[];
  usage: UsageState;
  source: "ai" | "fallback";
  unusedIngredients?: string[];
};

type TabId = "receitas" | "planner" | "saved" | "lists" | "macros" | "account";

// Ícone de utensílios de cozinha
function ReceitasIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
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

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
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

function MacrosIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h6" />
      <path d="M9 12h6" />
      <path d="M9 15h6" />
      <circle cx="6" cy="9" r="0.5" fill="currentColor" />
      <circle cx="6" cy="12" r="0.5" fill="currentColor" />
      <circle cx="6" cy="15" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function HomeScreen() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("receitas");
  const [inputValue, setInputValue] = useState("");
  const [servings, setServings] = useState(2);
  const [dishType, setDishType] = useState<"breakfast" | "lunch" | "snack" | "dinner">("lunch");
  const [diet, setDiet] = useState<string>("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [unusedIngredients, setUnusedIngredients] = useState<string[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [savedMealPlans, setSavedMealPlans] = useState<SavedMealPlan[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [hasLoadedAccess, setHasLoadedAccess] = useState(false);
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedParams, setConfirmedParams] = useState<{
    ingredients: string[];
    servings: number;
    dishType: string;
    diet?: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    // Carregar receitas geradas do localStorage (só desaparecem ao gerar novas)
    setRecipes(getGeneratedRecipes());
    setSavedRecipes(getSavedRecipes());
    setShoppingLists(getShoppingLists());
    
    // Load saved meal plans from API (with localStorage fallback)
    loadSavedMealPlans();

    // Listen for meal plan save events from other components
    window.addEventListener("mealPlanSaved", handleMealPlanSaved);
    window.addEventListener("shoppingListCreated", handleShoppingListCreated);

    let cancelled = false;

    function handleMealPlanSaved() {
      console.log("[home-screen] Received mealPlanSaved event, reloading...");
      loadSavedMealPlans();
    }

    function handleShoppingListCreated() {
      console.log("[home-screen] Received shoppingListCreated event, reloading...");
      setShoppingLists(getShoppingLists());
    }

    async function loadSavedMealPlans() {
      try {
        const response = await fetch("/api/saved-meal-plans", {
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          if (!cancelled && data.plans) {
            // Convert API format to SavedMealPlan format
            const formattedPlans: SavedMealPlan[] = data.plans.map((p: any) => ({
              ...p.payload,
              id: p.id,
              name: p.name,
              savedAt: new Date(p.created_at).getTime(),
              settings: p.settings,
            }));
            setSavedMealPlans(formattedPlans);
          }
        } else if (response.status === 401) {
          // Not logged in, use localStorage fallback
          if (!cancelled) {
            setSavedMealPlans(getSavedMealPlans());
          }
        }
      } catch (error) {
        // Fallback to localStorage if API fails
        if (!cancelled) {
          setSavedMealPlans(getSavedMealPlans());
        }
      }
    }

    async function loadAccessStatus() {
      try {
        const response = await fetch("/api/access-status", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setHasLoadedAccess(true);
          }
          return;
        }

        const payload = (await response.json()) as { isPremium?: boolean };

        if (!cancelled) {
          setIsPremium(Boolean(payload.isPremium));
          setHasLoadedAccess(true);
        }
      } catch {
        // Keep the default free state if the access check fails.
        if (!cancelled) {
          setHasLoadedAccess(true);
        }
      }
    }

    async function loadRecentRecipes() {
      try {
        const response = await fetch("/api/recent-recipes", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { recipes: Recipe[] };

        if (!cancelled && payload.recipes) {
          setRecentRecipes(payload.recipes);
        }
      } catch (error) {
        console.error("Failed to load recent recipes:", error);
      }
    }

    void loadAccessStatus();
    void loadRecentRecipes();

    return () => {
      cancelled = true;
      window.removeEventListener("mealPlanSaved", handleMealPlanSaved);
      window.removeEventListener("shoppingListCreated", handleShoppingListCreated);
    };
  }, []);

  const premiumActive = usage?.isPremium ?? isPremium;

  const navItems = [
    { id: "receitas" as const, label: "Receitas", icon: <ReceitasIcon /> },
    { id: "planner" as const, label: "Planejador", icon: <CalendarIcon /> },
    { id: "saved" as const, label: "Salvos", icon: <BookmarkIcon /> },
    { id: "lists" as const, label: "Mercado", icon: <CartIcon /> },
    { id: "macros" as const, label: "Macros", icon: <MacrosIcon /> },
    { id: "account" as const, label: "Conta", icon: <UserIcon /> },
  ];

  if (!mounted) {
    return (
      <main className="mx-auto flex w-full flex-1 flex-col px-4 pb-24 pt-4 sm:px-6 md:max-w-7xl md:pt-8">
        {/* Mobile header skeleton */}
        <header className="mb-3 flex items-center justify-center md:hidden">
          <div className="h-20 w-64 rounded-lg bg-slate-100" />
        </header>

        {/* 2-column skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:gap-12">
          {/* Left column */}
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="h-5 w-32 rounded-full bg-slate-100" />
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="h-9 w-20 rounded-full bg-slate-100" />
                <div className="h-9 w-16 rounded-full bg-slate-100" />
                <div className="h-9 w-24 rounded-full bg-slate-100" />
              </div>
              <div className="mt-4 h-14 rounded-2xl bg-slate-100" />
            </div>

            <div className="h-16 rounded-2xl bg-[#FF6B35]/10" />
          </div>

          {/* Right column */}
          <div className="hidden space-y-4 md:block">
            <div className="h-48 rounded-3xl bg-slate-50" />
            <div className="h-48 rounded-3xl bg-slate-50" />
          </div>
        </div>
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

  function handleSaveRecipe(recipe: Recipe) {
    setSavedRecipes(saveRecipe(recipe));
    setActiveTab("saved");
  }

  function handleRemoveSavedRecipe(recipeId: string) {
    setSavedRecipes(removeSavedRecipe(recipeId));
  }

  async function handleRemoveSavedMealPlan(planId: string) {
    try {
      const response = await fetch(`/api/saved-meal-plans?id=${planId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove from state if API call succeeds
        setSavedMealPlans((current) => current.filter((plan) => plan.id !== planId));
      } else if (response.status === 401) {
        // Not logged in, use localStorage
        setSavedMealPlans(removeSavedMealPlan(planId));
      } else {
        console.error("Failed to delete meal plan from database");
        // Still remove from local state as fallback
        setSavedMealPlans(removeSavedMealPlan(planId));
      }
    } catch (error) {
      console.error("Error deleting meal plan:", error);
      // Fallback to localStorage
      setSavedMealPlans(removeSavedMealPlan(planId));
    }
  }

  function handleDeleteShoppingList(listId: string) {
    setShoppingLists(deleteShoppingList(listId));
  }

  function handleUpdateShoppingLists() {
    setShoppingLists(getShoppingLists());
  }

  function handleStartShopping(listId: string) {
    const updatedLists = updateShoppingList(listId, { isActive: true });
    setShoppingLists(updatedLists);
  }

  function handleCreateShoppingListFromPlan(plan: SavedMealPlan) {
    const listName = `Compras - ${plan.name}`;
    
    // Check if a shopping list with this name already exists
    const existingList = shoppingLists.find(list => list.name === listName);
    
    if (existingList) {
      // List already exists, just switch to lists tab
      console.log("[home-screen] Shopping list already exists, switching to lists tab");
      setActiveTab("lists");
      return;
    }
    
    // Import the function dynamically to avoid circular dependency
    const { createShoppingListFromMealPlan } = require("@/lib/app-storage");
    
    // Create shopping list from meal plan
    const newList = createShoppingListFromMealPlan(
      plan.shoppingList,
      listName
    );
    
    // Update local state
    setShoppingLists(getShoppingLists());
    
    // Switch to lists tab
    setActiveTab("lists");
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent("shoppingListCreated"));
  }

  function handleConfirmRecipeGeneration() {
    const ingredients = mergeIngredients(selectedIngredients, inputValue);

    if (ingredients.length < 2) {
      setError("Adicione pelo menos 2 ingredientes para gerar uma receita útil.");
      return;
    }

    setError(null);
    
    // Mostrar confirmação com parâmetros extraídos
    setConfirmedParams({
      ingredients,
      servings,
      dishType,
      diet: diet || undefined,
    });
    setShowConfirmation(true);
  }

  function generateRecipes() {
    if (!confirmedParams) return;

    setShowConfirmation(false);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/generate-recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Time": Date.now().toString(),
        },
        cache: "no-store",
        body: JSON.stringify(confirmedParams),
      });

      const payload = (await response.json()) as
        | GenerateRecipesPayload
        | { error?: string; usage?: UsageState };

      if (!response.ok) {
        const errorPayload = payload as { error?: string; usage?: UsageState };
        
        // Redirect to login if user is not authenticated
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        
        setError(errorPayload.error ?? "Não foi possível gerar receita agora.");
        if (errorPayload.usage) {
          setUsage(errorPayload.usage);
          setIsPremium(errorPayload.usage.isPremium);
        }
        return;
      }

      const successPayload = payload as GenerateRecipesPayload;
      // Substituir completamente as receitas antigas pelas novas geradas
      // Receitas antigas ficam apenas no histórico (recentRecipes do banco)
      setRecipes(successPayload.recipes);
      saveGeneratedRecipes(successPayload.recipes);
      setUnusedIngredients(successPayload.unusedIngredients ?? []);
      setUsage(successPayload.usage);
      setIsPremium(successPayload.usage.isPremium);
      setActiveTab("receitas");
      setConfirmedParams(null);
    });
  }

  return (
    <>
      <main className="mx-auto flex w-full flex-1 flex-col px-4 pb-20 pt-2 sm:px-6 md:max-w-7xl md:pb-24 md:pt-4">
        {activeTab === "receitas" ? (
          <>
            {/* Mobile header with logo */}
            <header className="mb-4 flex items-center justify-center md:hidden">
              <Image
                src="/mobile 900x270 (1).png"
                alt="ChefBox"
                width={270}
                height={81}
                className="h-20 object-contain"
                style={{ width: 'auto' }}
                priority
              />
            </header>



            {/* 2-column layout on desktop */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:gap-12">
              {/* LEFT COLUMN - Input & CTA */}
              <div className="space-y-5">
                <IngredientInput
                  inputValue={inputValue}
                  onInputChange={setInputValue}
                  ingredients={selectedIngredients}
                  servings={servings}
                  onServingsChange={setServings}
                  dishType={dishType}
                  onDishTypeChange={setDishType}
                  diet={diet}
                  onDietChange={setDiet}
                  onAddIngredient={addIngredient}
                  onRemoveIngredient={removeIngredient}
                />

                {/* Prominent CTA */}
                <AppButton
                  fullWidth
                  className="h-14! text-base font-semibold md:h-16! md:text-lg"
                  onClick={handleConfirmRecipeGeneration}
                  disabled={isPending}
                  icon={
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  }
                >
                  Gerar receita
                </AppButton>

                {/* Loading Overlay com Chapéu de Chef */}
                {isPending && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin">
                        <svg viewBox="0 0 64 64" className="h-24 w-24 text-white" fill="currentColor">
                          {/* Chapéu de Chef - Toque */}
                          <path d="M32 4c-3.5 0-6.5 2.2-7.6 5.3C23 9.1 21.5 9 20 9c-5.5 0-10 4.5-10 10 0 1.4.3 2.7.8 3.9.2.5.7.8 1.2.8h40c.5 0 1-.3 1.2-.8.5-1.2.8-2.5.8-3.9 0-5.5-4.5-10-10-10-1.5 0-2.9.3-4.2.7C38.5 6.2 35.5 4 32 4z" />
                          <rect x="14" y="26" width="36" height="30" rx="1" />
                          <rect x="16" y="28" width="32" height="26" rx="0.5" opacity="0.2" />
                          <path d="M17 30h30M17 34h30M17 38h30" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                        </svg>
                      </div>
                      <p className="text-lg font-semibold text-white">Gerando suas receitas...</p>
                    </div>
                  </div>
                )}

                {/* Confirmation Modal */}
                {showConfirmation && confirmedParams && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-[#2D3142]">Confirmar dados</h3>
                        <button
                          onClick={() => {
                            setShowConfirmation(false);
                            setConfirmedParams(null);
                          }}
                          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ingredientes</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {confirmedParams.ingredients.map((ing, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-full bg-[#FF6B35]/10 px-3 py-1 text-sm font-medium text-[#FF6B35]"
                              >
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Porções</p>
                            <p className="mt-1 text-lg font-bold text-[#2D3142]">{confirmedParams.servings} {confirmedParams.servings === 1 ? 'pessoa' : 'pessoas'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tipo de refeição</p>
                            <p className="mt-1 text-lg font-bold text-[#2D3142] capitalize">
                              {confirmedParams.dishType === 'breakfast' ? 'Café da manhã' :
                               confirmedParams.dishType === 'lunch' ? 'Almoço' :
                               confirmedParams.dishType === 'snack' ? 'Lanche' : 'Jantar'}
                            </p>
                          </div>
                        </div>

                        {confirmedParams.diet && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Restrição</p>
                            <p className="mt-1 text-lg font-bold text-[#2D3142] capitalize">{confirmedParams.diet}</p>
                          </div>
                        )}

                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={() => {
                              setShowConfirmation(false);
                              setConfirmedParams(null);
                            }}
                            className="flex-1 rounded-full border-2 border-slate-200 px-6 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            Editar
                          </button>
                          <button
                            onClick={generateRecipes}
                            disabled={isPending}
                            className="flex-1 rounded-full bg-[#FF6B35] px-6 py-3 font-semibold text-white transition hover:bg-[#FF8C42] disabled:opacity-60"
                          >
                            {isPending ? 'Gerando...' : 'Confirmar e gerar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Usage indicator */}
                <UsageIndicator variant="compact" className="mb-2" />

                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                {/* Premium upsell - show on mobile or when no recipes */}
                {recipes.length === 0 && hasLoadedAccess && !premiumActive && (
                  <section className="rounded-3xl bg-linear-to-br from-[#FF6B35] to-[#FF8C42] p-5 text-white shadow-lg md:hidden">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                      Premium
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">
                      Receitas ilimitadas
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/90">
                      Destrave planejamento semanal, lista de compras e custos consolidados.
                    </p>
                    <Link href="/planos" className="mt-4 block w-full rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-[#FF6B35] transition hover:bg-white/95">
                      Ver planos
                    </Link>
                  </section>
                )}
              </div>

              {/* RIGHT COLUMN - Preview & Benefits */}
              <div className="space-y-6">
                {recipes.length > 0 ? (
                  <section>
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-[#2D3142]">Suas receitas</h2>
                      <Link href={`/dashboard?recipe=${recipes[0]?.id ?? ""}`} className="text-sm font-semibold text-[#FF6B35] hover:text-[#FF8C42]">
                        Ver detalhes →
                      </Link>
                    </div>

                    {unusedIngredients.length > 0 && (
                      <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                          Não utilizados nesta geração
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {unusedIngredients.map((ing) => (
                            <span
                              key={ing}
                              className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-300"
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

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
                ) : (
                  <>
                    {/* Benefits cards */}
                    <div className="hidden space-y-2.5 md:block">
                      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_10px_28px_rgba(45,49,66,0.04)]">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4D7C4F]/8 text-[#4D7C4F]">
                            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current" strokeWidth="2">
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-[#2D3142]">Custo estimado</h3>
                            <p className="mt-0.5 text-xs leading-5 text-slate-500">
                              Saiba quanto vai gastar antes de ir ao mercado.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_10px_28px_rgba(45,49,66,0.04)]">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF6B35]/8 text-[#FF6B35]">
                            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 6v6l4 2" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-[#2D3142]">Tempo real</h3>
                            <p className="mt-0.5 text-xs leading-5 text-slate-500">
                              Receitas com tempo de preparo ajustado para sua rotina.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_10px_28px_rgba(45,49,66,0.04)]">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/8 text-blue-600">
                            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current" strokeWidth="2">
                              <path d="M9 11 12 14 22 4" />
                              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-[#2D3142]">Porções exatas</h3>
                            <p className="mt-0.5 text-xs leading-5 text-slate-500">
                              Gramatura certa para cada ingrediente, sem desperdício.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop premium card */}
                    {hasLoadedAccess && !premiumActive ? (
                    <section className="hidden rounded-3xl bg-linear-to-br from-[#FF6B35] to-[#FF8C42] p-8 text-white shadow-xl md:block">
                      <p className="text-sm font-semibold uppercase tracking-wider text-white/80">
                        Premium
                      </p>
                      <h2 className="mt-3 text-3xl font-bold">
                        Receitas ilimitadas
                      </h2>
                      <p className="mt-3 leading-relaxed text-white/90">
                        Destrave planejamento semanal, lista de compras automatizada e visão consolidada de custos.
                      </p>
                      <Link href="/planos" className="mt-6 block w-full rounded-full bg-white px-6 py-4 text-center font-semibold text-[#FF6B35] transition hover:bg-white/95">
                        Ver planos
                      </Link>
                    </section>
                    ) : null}
                  </>
                )}

                {/* Recent history - desktop only, bottom */}
                {recipes.length === 0 && recentRecipes.length > 0 && (
                  <section className="hidden md:block">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-[#2D3142]">Recente</h2>
                    </div>
                    <div className="space-y-2">
                      {recentRecipes.slice(0, 2).map((recipe) => (
                        <HistoryCard
                          key={recipe.id}
                          title={recipe.title}
                          time={recipe.prepTime}
                          ingredientsCount={recipe.protein.ingredients.length + (recipe.base?.reduce((acc, b) => acc + b.ingredients.length, 0) ?? 0)}
                          dateLabel={"Recente"}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>

            {/* Mobile history - below fold */}
            {recipes.length === 0 && recentRecipes.length > 0 && (
              <section className="mt-8 md:hidden">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#2D3142]">Histórico</h2>
                </div>
                <div className="space-y-3">
                  {recentRecipes.slice(0, 4).map((recipe) => (
                    <HistoryCard
                      key={recipe.id}
                      title={recipe.title}
                      time={recipe.prepTime}
                      ingredientsCount={recipe.protein.ingredients.length + (recipe.base?.reduce((acc, b) => acc + b.ingredients.length, 0) ?? 0)}
                      dateLabel={"Recente"}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : null}

        {activeTab === "planner" ? (
          <MealPlanPage />
        ) : null}

        {activeTab === "saved" ? (
          <SavedRecipesScreen
            recipes={savedRecipes}
            onRemoveRecipe={handleRemoveSavedRecipe}
            mealPlans={savedMealPlans}
            onRemoveMealPlan={handleRemoveSavedMealPlan}
            onCreateShoppingList={handleCreateShoppingListFromPlan}
          />
        ) : null}

        {activeTab === "lists" ? (
          <ListsScreen
            shoppingLists={shoppingLists}
            onUpdateLists={handleUpdateShoppingLists}
            onDeleteList={handleDeleteShoppingList}
            onStartShopping={handleStartShopping}
          />
        ) : null}

        {activeTab === "macros" ? (
          <MacroCalculatorScreen isPremium={premiumActive} />
        ) : null}

        {activeTab === "account" ? (
          <AccountScreen isPremium={premiumActive} />
        ) : null}

        <nav className="fixed inset-x-0 bottom-0 left-0 right-0 flex w-full items-center justify-around border-t border-slate-200/80 bg-white px-2 py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] md:px-4">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium transition-all hover:bg-orange-50 md:px-3 ${
                activeTab === item.id ? "bg-orange-50 text-[#FF6B35] font-semibold" : "text-slate-500"
              }`}
            >
              <span className="flex items-center justify-center">{item.icon}</span>
              <span className="text-[10px] md:text-xs">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </>
  );
}