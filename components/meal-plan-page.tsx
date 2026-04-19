"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { MealDayCard } from "@/components/MealDayCard";
import { PrepNotes } from "@/components/PrepNotes";
import { ShoppingList } from "@/components/ShoppingList";
import { PaywallModal } from "@/components/dashboard/paywall-modal";
import { ProBadge, FeatureWithBadge } from "@/components/shared/pro-badge";
import { useAccessControl } from "@/lib/hooks/useAccessControl";
import {
  getMealPlan,
  getMealPlanSettings,
  saveMealPlan,
  saveMealPlanSettings,
  saveMealPlanToSaved,
  createShoppingListFromMealPlan,
} from "@/lib/app-storage";
import type {
  MealPlanPrepDay,
  MealPlanResponse,
  MealPlanSettings,
  MealPlanShoppingCategory,
  MealType,
  MealVariety,
  UsageState,
} from "@/lib/types";

type MealPlanPayload = MealPlanResponse & {
  source: "ai" | "fallback";
  usage?: UsageState & { canGenerate?: boolean };
};

const initialParams: MealPlanSettings = {
  calories: 2000,
  meals: ["lunch"],
  goal: "manutenção",
  days: 7,
  servings: 1,
  allergies: [],
  preferences: [],
  variety: "normal",
};

export function MealPlanPage() {
  const [params, setParams] = useState(initialParams);
  const [draftParams, setDraftParams] = useState(initialParams);
  const [allergiesInput, setAllergiesInput] = useState("");
  const [preferencesInput, setPreferencesInput] = useState("");
  const [plan, setPlan] = useState<MealPlanPayload | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [usageInfo, setUsageInfo] = useState<(UsageState & { canGenerate?: boolean }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  
  // Verificar acesso ao meal planner
  const { loading: accessLoading, allowed: hasAccess, reason: accessReason, isPro } = useAccessControl("planner");

  useEffect(() => {
    console.log("[meal-plan-page] Component mounted, loading saved data...");
    const savedSettings = getMealPlanSettings(initialParams);
    const savedPlan = getMealPlan<MealPlanPayload>();

    console.log("[meal-plan-page] Loaded from storage:", {
      hasSettings: !!savedSettings,
      hasPlan: !!savedPlan,
      planDays: savedPlan?.plan?.length,
      planSource: savedPlan?.source
    });

    setParams(savedSettings);
    setDraftParams(savedSettings);
    setAllergiesInput((savedSettings.allergies ?? []).join(", "));
    setPreferencesInput((savedSettings.preferences ?? []).join(", "));

    if (savedPlan) {
      setPlan(savedPlan);
      setUsageInfo(savedPlan.usage ?? null);
      setShowSettings(false);
      console.log("[meal-plan-page] Restored saved meal plan");
    } else {
      console.log("[meal-plan-page] No saved plan found, showing settings");
    }

    // Fetch usage status
    fetch("/api/meal-plan-usage")
      .then((res) => res.json())
      .then((data) => {
        if (data.usage) {
          setUsageInfo(data.usage);
        }
      })
      .catch(() => {
        // Silent fail
      });
  }, []);

  function showTemporaryMessage(message: string) {
    setActionMessage(message);
    window.setTimeout(() => {
      setActionMessage((current) => (current === message ? null : current));
    }, 2500);
  }

  async function handleSavePlan() {
    if (!plan || isSaving) return;
    
    console.log("[meal-plan-page] Starting save process...");
    setIsSaving(true);
    setError(null);
    
    try {
      // Generate default name with current date
      const defaultName = `Planejamento ${new Date().toLocaleDateString("pt-BR")}`;
      
      console.log("[meal-plan-page] Saving plan:", {
        name: defaultName,
        hasShoppingList: !!plan.shoppingList,
        shoppingListLength: plan.shoppingList?.length
      });
      
      let response: Response;
      
      try {
        response = await fetch("/api/saved-meal-plans", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: defaultName,
            payload: plan,
            settings: params,
          }),
        });
        
        console.log("[meal-plan-page] API response status:", response.status);
      } catch (fetchError) {
        // Network error - server might be down or unreachable
        console.error("[meal-plan-page] Network error:", fetchError);
        
        // Fallback to localStorage
        saveMealPlanToSaved(plan, params, defaultName);
        console.log("[meal-plan-page] Saved to localStorage (network error fallback)");
        
        // Create shopping list automatically
        if (plan.shoppingList && plan.shoppingList.length > 0) {
          createShoppingListFromMealPlan(plan.shoppingList, `Compras - ${defaultName}`);
          console.log("[meal-plan-page] Shopping list created (network error fallback)");
          window.dispatchEvent(new CustomEvent("shoppingListCreated"));
        }
        
        showTemporaryMessage("✅ Planejamento e lista de compras salvos localmente!");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[meal-plan-page] API error:", { status: response.status, errorData });
        
        // If not logged in, save to localStorage as fallback
        if (response.status === 401) {
          console.log("[meal-plan-page] User not logged in, saving to localStorage");
          saveMealPlanToSaved(plan, params, defaultName);
          
          // Create shopping list automatically
          if (plan.shoppingList && plan.shoppingList.length > 0) {
            createShoppingListFromMealPlan(plan.shoppingList, `Compras - ${defaultName}`);
            console.log("[meal-plan-page] Shopping list created (fallback)");
            window.dispatchEvent(new CustomEvent("shoppingListCreated"));
          }
          
          showTemporaryMessage("✅ Planejamento e lista de compras salvos!");
          return;
        }
        
        throw new Error(errorData.error || "Erro ao salvar");
      }

      const responseData = await response.json();
      console.log("[meal-plan-page] Save successful:", responseData);

      // Create shopping list automatically for logged-in users too
      if (plan.shoppingList && plan.shoppingList.length > 0) {
        createShoppingListFromMealPlan(plan.shoppingList, `Compras - ${defaultName}`);
        console.log("[meal-plan-page] Shopping list created from meal plan");
        window.dispatchEvent(new CustomEvent("shoppingListCreated"));
      }

      // Dispatch custom event to notify other components (e.g., home-screen) to refresh
      window.dispatchEvent(new CustomEvent("mealPlanSaved", {
        detail: { id: responseData.id, name: defaultName }
      }));
      console.log("[meal-plan-page] Dispatched mealPlanSaved event");

      showTemporaryMessage("✅ Planejamento e lista de compras salvos!");
    } catch (error) {
      console.error("[meal-plan-page] Error saving meal plan:", error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível salvar o planejamento.";
      setError(errorMessage);
      
      // Show error message temporarily
      window.setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setIsSaving(false);
      console.log("[meal-plan-page] Save process finished");
    }
  }

  async function copyText(content: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(content);
      showTemporaryMessage(successMessage);
    } catch {
      setError("Não foi possível copiar agora.");
    }
  }

  function downloadTextFile(fileName: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    showTemporaryMessage("Arquivo exportado.");
  }

  function formatShoppingList(categories: MealPlanShoppingCategory[]) {
    return [
      "ChefBox - Lista de compras",
      "",
      ...categories.flatMap((category) => [
        `${category.category.toUpperCase()}:`,
        ...category.items.map((item) => `  - ${item.name}: ${item.quantity}`),
        "",
      ]),
    ].join("\n");
  }

  function formatPrepPlan(prepPlan: MealPlanPrepDay[]) {
    return [
      "ChefBox - Plano de execução",
      "",
      ...prepPlan.flatMap((prepDay) => [
        `${prepDay.day.toUpperCase()}:`,
        ...prepDay.tasks.map((task) => `  ☐ ${task}`),
        "",
      ]),
    ].join("\n");
  }

  function generatePlan(next = params, forceVariation = false) {
    setError(null);
    setActionMessage(null);

    startTransition(async () => {
      // Add variation seed if forcing variation
      const payload = forceVariation
        ? { ...next, variationSeed: Date.now() }
        : next;

      const response = await fetch("/api/generate-meal-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Time": Date.now().toString(),
        },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const responsePayload = (await response.json()) as
        | MealPlanPayload
        | { error?: string; upgradeRequired?: boolean };

      if (!response.ok) {
        const errorPayload = responsePayload as {
          error?: string;
          upgradeRequired?: boolean;
        };
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (errorPayload.upgradeRequired) {
          setShowPaywall(true);
        }
        setError(errorPayload.error ?? "Não foi possível gerar o planejamento agora.");
        return;
      }

      const nextPlan = responsePayload as MealPlanPayload;
      setPlan(nextPlan);
      setParams(next);
      setDraftParams(next);
      saveMealPlanSettings(next);
      saveMealPlan(nextPlan);
      console.log("[meal-plan-page] New plan generated and saved:", {
        days: nextPlan.plan.length,
        source: nextPlan.source,
        hasMeals: nextPlan.plan[0]?.meals?.length
      });
      setShowSettings(false);
      
      // Update usage info if returned
      if (nextPlan.usage) {
        setUsageInfo(nextPlan.usage);
      }
    });
  }

  return (
    <>
      <PaywallModal 
        open={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        feature="planner"
      />

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
            <p className="text-lg font-semibold text-white">Montando seu planejamento...</p>
          </div>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-10 mb-6 rounded-[28px] border border-slate-200 bg-white/90 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/75">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Planejador
                  </p>
                  {isPro && <ProBadge variant="gradient" size="sm" />}
                </div>
                <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#2D3142]">
                  Planejamento da semana
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!hasAccess) {
                    setShowPaywall(true);
                    return;
                  }
                  if (usageInfo && !usageInfo.canGenerate && !usageInfo.isPremium) {
                    setShowPaywall(true);
                    return;
                  }
                  generatePlan();
                }}
                disabled={isPending || accessLoading}
                className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#2D3142] px-3 text-xs font-semibold text-white disabled:opacity-60"
              >
                {isPending 
                  ? "Gerando..." 
                  : !hasAccess || (usageInfo && !usageInfo.canGenerate && !usageInfo.isPremium)
                  ? "✨ Premium"
                  : "Gerar novo"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!hasAccess) {
                    setShowPaywall(true);
                    return;
                  }
                  if (usageInfo && !usageInfo.canGenerate && !usageInfo.isPremium) {
                    setShowPaywall(true);
                    return;
                  }
                  generatePlan(params, true);
                }}
                disabled={isPending || !plan || accessLoading || !hasAccess}
                className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#2D3142] bg-white px-3 text-xs font-semibold text-[#2D3142] disabled:opacity-40"
              >
                {isPending ? "Gerando..." : "🔄 Variação"}
              </button>
              <button
                type="button"
                onClick={handleSavePlan}
                disabled={!plan || isSaving || !hasAccess}
                className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#FF6B35] bg-white px-3 text-xs font-semibold text-[#FF6B35] transition-opacity disabled:opacity-40 aria-busy:opacity-50"
                aria-busy={isSaving}
              >
                {isSaving ? "Salvando..." : "💾 Salvar"}
              </button>
              <button
                type="button"
                onClick={() => setShowSettings((current) => !current)}
                disabled={!!(usageInfo && !usageInfo.canGenerate && !usageInfo.isPremium)}
                className="inline-flex min-h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
              >
                Editar parâmetros
              </button>
            </div>
          </div>
        </header>
        
        {/* Bloqueio de acesso para não-Pro */}
        {!accessLoading && !hasAccess && (
          <div className="mb-6 rounded-[32px] border-2 border-[#FF6B35] bg-gradient-to-br from-[#FFF9F3] to-[#FFE5D9] p-8 shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] p-4 text-white">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[#2D3142]">
                Planejador Semanal Exclusivo
              </h2>
              <p className="mt-3 max-w-lg text-base text-slate-600">
                {accessReason || "O planejamento semanal é exclusivo para assinantes do Plano Pro. Crie planos personalizados com lista de compras e rotina de meal prep."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => setShowPaywall(true)}
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] px-6 py-3 font-semibold text-white transition hover:opacity-90"
                >
                  ✨ Fazer upgrade para Pro
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border-2 border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-400"
                >
                  ← Voltar para receitas
                </Link>
              </div>
            </div>
          </div>
        )}

        {usageInfo && !usageInfo.canGenerate && !usageInfo.isPremium ? (
          <div className="mb-4 rounded-xl border border-[#FF6B35]/20 bg-gradient-to-r from-[#FFF9F3] to-[#FFE5D9] px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#2D3142]">
                  ⚠️ Limite mensal atingido — Você já gerou {usageInfo.used}/{usageInfo.limit} planejamento{usageInfo.limit > 1 ? 's' : ''}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Planos anuais com até <span className="font-bold text-[#FF6B35]">50% de desconto</span>
                </p>
              </div>
              <button
                onClick={() => setShowPaywall(true)}
                className="shrink-0 rounded-xl bg-[#8B4513] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#A0522D]"
              >
                ✨ Upgrade para Premium
              </button>
            </div>
          </div>
        ) : null}

        <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#fff9f3_0%,#f7fafb_100%)] p-5 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
          {showSettings ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm font-medium text-slate-700">
                  Calorias por dia
                  <input
                    type="number"
                    min={1200}
                    max={4500}
                    value={draftParams.calories}
                    onChange={(event) =>
                      setDraftParams((current) => ({
                        ...current,
                        calories: Number(event.target.value) || 2000,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#FF6B35]"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Objetivo
                  <select
                    value={draftParams.goal}
                    onChange={(event) =>
                      setDraftParams((current) => ({
                        ...current,
                        goal: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#FF6B35]"
                  >
                    <option value="manutenção">Manutenção</option>
                    <option value="perda de peso">Perda de peso</option>
                    <option value="ganho de massa">Ganho de massa</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Dias
                  <select
                    value={draftParams.days ?? 7}
                    onChange={(event) =>
                      setDraftParams((current) => ({
                        ...current,
                        days: Number(event.target.value),
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#FF6B35]"
                  >
                    <option value={3}>3 dias</option>
                    <option value={5}>5 dias</option>
                    <option value={7}>7 dias</option>
                    <option value={14}>14 dias</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Variedade de refeições
                  <select
                    value={draftParams.variety ?? "normal"}
                    onChange={(event) =>
                      setDraftParams((current) => ({
                        ...current,
                        variety: event.target.value as MealVariety,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#FF6B35]"
                  >
                    <option value="normal">Normal - Variado</option>
                    <option value="baixa">Baixa - Mais prático</option>
                  </select>
                </label>
              </div>
              <p className="text-xs text-slate-500">
                {draftParams.variety === "baixa" 
                  ? "💡 Modo prático: Proteínas repetidas durante a semana para facilitar o preparo de marmitas"
                  : "💡 Modo variado: Refeições diversas com diferentes proteínas e preparos"}
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="text-sm font-medium text-slate-700">
                  <p className="mb-3">Refeições (selecione pelo menos uma)</p>
                  <div className="space-y-2">
                    {(["breakfast", "lunch", "snack", "dinner"] as MealType[]).map((meal) => (
                      <label key={meal} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftParams.meals.includes(meal)}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            setDraftParams((current) => ({
                              ...current,
                              meals: checked
                                ? [...current.meals, meal]
                                : current.meals.filter((m) => m !== meal),
                            }));
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-[#FF6B35] focus:ring-[#FF6B35]"
                        />
                        <span className="capitalize">
                          {meal === "breakfast" ? "Café da manhã" : meal === "lunch" ? "Almoço" : meal === "snack" ? "Lanche" : "Jantar"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="text-sm font-medium text-slate-700">
                  Número de pessoas
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={draftParams.servings ?? 1}
                    onChange={(event) =>
                      setDraftParams((current) => ({
                        ...current,
                        servings: Number(event.target.value) || 1,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#FF6B35]"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Alergias (separadas por vírgula)
                  <input
                    type="text"
                    placeholder="Ex: glúten, lactose"
                    value={allergiesInput}
                    onChange={(event) => setAllergiesInput(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#FF6B35]"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Preferências (separadas por vírgula)
                  <input
                    type="text"
                    placeholder="Ex: legumes variados, sem fritura"
                    value={preferencesInput}
                    onChange={(event) => setPreferencesInput(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#FF6B35]"
                  />
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (usageInfo && !usageInfo.canGenerate && !usageInfo.isPremium) {
                      setShowPaywall(true);
                      return;
                    }

                    const updatedParams = {
                      ...draftParams,
                      allergies: allergiesInput
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s.length > 0),
                      preferences: preferencesInput
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s.length > 0),
                    };
                    generatePlan(updatedParams);
                  }}
                  disabled={isPending || draftParams.meals.length === 0}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#FF6B35] px-5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isPending 
                    ? "Gerando..." 
                    : usageInfo && !usageInfo.canGenerate && !usageInfo.isPremium
                    ? "✨ Upgrade para continuar"
                    : "Aplicar e gerar"}
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {actionMessage ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {actionMessage}
          </div>
        ) : null}

        {plan ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Dias
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-[#2D3142]">
                    Semana organizada
                  </h2>
                </div>
                <span className="rounded-full bg-[#EEF5EE] px-3 py-1 text-xs font-semibold text-[#4D7C4F]">
                  {plan.source === "ai" ? "Gerado por IA" : "Modelo de apoio"}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {plan.plan.map((day, index) => (
                  <MealDayCard key={day.day} day={day} defaultOpen={index === 0} />
                ))}
              </div>
            </section>

            <div className="space-y-6">
              <ShoppingList
                categories={plan.shoppingList}
                onCopy={() =>
                  void copyText(
                    formatShoppingList(plan.shoppingList),
                    "Lista de compras copiada.",
                  )
                }
                onExport={() =>
                  downloadTextFile(
                    "chefbox-lista-de-compras.txt",
                    formatShoppingList(plan.shoppingList),
                  )
                }
              />
              <PrepNotes
                prepPlan={plan.prepPlan}
                onCopy={() =>
                  void copyText(
                    formatPrepPlan(plan.prepPlan),
                    "Plano de execução copiado.",
                  )
                }
                onExport={() =>
                  downloadTextFile(
                    "chefbox-plano-de-execucao.txt",
                    formatPrepPlan(plan.prepPlan),
                  )
                }
              />
            </div>
          </div>
        ) : (
          <section className="mt-6 rounded-[32px] border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-[0_18px_42px_rgba(45,49,66,0.04)]">
            <p className="text-sm leading-6 text-slate-500">
              Gere o primeiro plano para ver os dias organizados, a lista de compras
              consolidada e o prep da semana.
            </p>
          </section>
        )}
      </main>
    </>
  );
}
