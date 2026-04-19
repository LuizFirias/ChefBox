"use client";

import { useState, useRef, useEffect } from "react";

import { useAccessControl } from "@/lib/hooks/useAccessControl";

type MacroResult = {
  food: string;
  quantity: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

type CalculationResult = {
  items: MacroResult[];
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
};

type MealType = "breakfast" | "lunch" | "snack" | "dinner";

type DailyMeal = {
  id: string;
  meal_type: MealType;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
};

type MacroCalculatorScreenProps = {
  isPremium: boolean;
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Café da manhã",
  lunch: "Almoço",
  snack: "Lanche",
  dinner: "Jantar",
};

export function MacroCalculatorScreen({ isPremium }: MacroCalculatorScreenProps) {
  const { planInfo } = useAccessControl();
  const canUsePhoto = (planInfo?.photoAnalysisLimit ?? 0) > 0;

  const [inputMode, setInputMode] = useState<"text" | "photo">("text");
  const [textInput, setTextInput] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("lunch");
  const [dailyMeals, setDailyMeals] = useState<DailyMeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load today's meals on mount
  useEffect(() => {
    loadDailyMeals();
  }, []);

  async function loadDailyMeals() {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/daily-meals?date=${today}`, {
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setDailyMeals(data.meals || []);
      }
    } catch (error) {
      console.error("Error loading daily meals:", error);
    }
  }

  const dailyTotals = dailyMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.total_calories,
      protein_g: acc.protein_g + meal.total_protein_g,
      carbs_g: acc.carbs_g + meal.total_carbs_g,
      fat_g: acc.fat_g + meal.total_fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione uma imagem válida");
      return;
    }

    setPhotoFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleClearPhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleCalculate() {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (inputMode === "text") {
        if (!textInput.trim()) {
          setError("Digite os alimentos que você comeu");
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/calculate-macros", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textInput }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao calcular macros");
        }

        const data = await response.json();
        setResult(data);
      } else {
        if (!photoFile) {
          setError("Selecione uma foto do seu prato");
          setIsLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("photo", photoFile);

        const response = await fetch("/api/analyze-meal-photo", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao analisar foto");
        }

        const data = await response.json();
        setResult(data);
      }
    } catch (err) {
      console.error("Error calculating macros:", err);
      setError(err instanceof Error ? err.message : "Erro ao calcular macros");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveMeal() {
    if (!result) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/daily-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meal_type: selectedMealType,
          items: result.items,
          total_calories: result.totals.calories,
          total_protein_g: result.totals.protein_g,
          total_carbs_g: result.totals.carbs_g,
          total_fat_g: result.totals.fat_g,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar refeição");
      }

      setSuccessMessage(`${MEAL_LABELS[selectedMealType]} salvo com sucesso!`);
      await loadDailyMeals();
      handleClear();
    } catch (err) {
      console.error("Error saving meal:", err);
      setError(err instanceof Error ? err.message : "Erro ao salvar refeição");
    } finally {
      setIsSaving(false);
    }
  }

  function handleClear() {
    setTextInput("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <section className="mt-6 space-y-4 pb-32">
      {/* Header with Daily Totals */}
      <article className="rounded-[28px] bg-[#2D3142] p-4 md:p-5 text-white shadow-[0_18px_42px_rgba(45,49,66,0.14)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
          Hoje
        </p>
        <h2 className="mt-2 text-xl md:text-2xl font-bold">Macros totais do dia</h2>
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="rounded-2xl bg-white/10 p-2 backdrop-blur">
            <p className="text-[10px] md:text-xs text-white/80">Calorias</p>
            <p className="mt-0.5 text-base md:text-lg font-bold">{dailyTotals.calories}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-2 backdrop-blur">
            <p className="text-[10px] md:text-xs text-white/80">Prot</p>
            <p className="mt-0.5 text-base md:text-lg font-bold">{dailyTotals.protein_g.toFixed(1)}g</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-2 backdrop-blur">
            <p className="text-[10px] md:text-xs text-white/80">Carb</p>
            <p className="mt-0.5 text-base md:text-lg font-bold">{dailyTotals.carbs_g.toFixed(1)}g</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-2 backdrop-blur">
            <p className="text-[10px] md:text-xs text-white/80">Gord</p>
            <p className="mt-0.5 text-base md:text-lg font-bold">{dailyTotals.fat_g.toFixed(1)}g</p>
          </div>
        </div>

        {/* Progress bars — metas estimadas: 2000 kcal, 150g prot, 250g carb, 65g gord */}
        {(dailyTotals.calories > 0 || dailyTotals.protein_g > 0) && (
          <div className="mt-4 space-y-2.5">
            {[
              { label: "Calorias", value: dailyTotals.calories, goal: 2000, unit: "kcal", color: "bg-orange-400" },
              { label: "Proteína", value: dailyTotals.protein_g, goal: 150, unit: "g", color: "bg-blue-400" },
              { label: "Carboidrato", value: dailyTotals.carbs_g, goal: 250, unit: "g", color: "bg-yellow-400" },
              { label: "Gordura", value: dailyTotals.fat_g, goal: 65, unit: "g", color: "bg-pink-400" },
            ].map(({ label, value, goal, unit, color }) => {
              const pct = Math.min(Math.round((value / goal) * 100), 100);
              return (
                <div key={label}>
                  <div className="flex justify-between text-[10px] text-white/70">
                    <span>{label}</span>
                    <span>{value.toFixed(0)}{unit} / {goal}{unit}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/20">
                    <div
                      className={`h-full rounded-full transition-all ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>

      {/* Mode Selector */}
      <article className="rounded-[28px] border border-slate-200 bg-white p-3 md:p-4 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInputMode("text")}
            className={`flex-1 rounded-2xl px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold transition-all ${
              inputMode === "text"
                ? "bg-[#FF6B35] text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            ✍️ Digitar
          </button>
          <button
            type="button"
            onClick={() => canUsePhoto && setInputMode("photo")}
            disabled={!canUsePhoto}
            title={!canUsePhoto ? "Disponível a partir do Plano Vitalício" : undefined}
            className={`flex-1 rounded-2xl px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold transition-all ${
              !canUsePhoto
                ? "cursor-not-allowed opacity-50 bg-slate-100 text-slate-600"
                : inputMode === "photo"
                ? "bg-[#FF6B35] text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            📸 Foto
          </button>
        </div>
      </article>

      {/* Input Area */}
      <article className="rounded-[28px] border border-slate-200 bg-white p-4 md:p-5 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
        {inputMode === "text" ? (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              O que você comeu?
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ex: 150g de arroz cozido, 100g de frango grelhado..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 md:p-4 text-sm text-slate-900 placeholder-slate-400 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              rows={4}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              Foto do seu prato
            </label>
            
            {photoPreview ? (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-2xl">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-48 md:h-64 w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleClearPhoto}
                  className="w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  🗑️ Remover foto
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="photo-input"
                />
                <label
                  htmlFor="photo-input"
                  className="flex min-h-40 md:min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-[#FF6B35] hover:bg-slate-100"
                >
                  <span className="text-3xl md:text-4xl">📸</span>
                  <span className="mt-2 text-sm font-semibold text-slate-700">
                    Tirar ou selecionar foto
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Meal Type Selection */}
        <div className="mt-4 space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Tipo de refeição
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(MEAL_LABELS) as [MealType, string][]).map(([type, label]) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedMealType(type)}
                className={`rounded-2xl px-3 py-2 text-xs md:text-sm font-semibold transition-all ${
                  selectedMealType === type
                    ? "bg-[#4D7C4F] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-3 rounded-2xl bg-green-50 p-3 text-sm text-green-700">
            ✅ {successMessage}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleCalculate}
            disabled={isLoading}
            className="flex-1 rounded-2xl bg-[#FF6B35] px-4 py-2.5 md:py-3 text-sm font-bold text-white shadow-md hover:bg-[#FF5722] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "🔄 Calculando..." : "🧮 Calcular"}
          </button>
          
          {(textInput || photoFile || result) && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="rounded-2xl border-2 border-slate-300 bg-white px-4 py-2.5 md:py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              🗑️
            </button>
          )}
        </div>
      </article>

      {/* Results */}
      {result && (
        <>
          {/* Individual Items */}
          <article className="rounded-[28px] border border-slate-200 bg-white p-4 md:p-5 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Alimentos detectados
            </h3>
            <div className="mt-3 space-y-2">
              {result.items.map((item, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">{item.food}</h4>
                      <p className="text-xs text-slate-600">{item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base md:text-lg font-bold text-[#FF6B35]">
                        {item.calories}
                      </p>
                      <p className="text-[10px] text-slate-500">kcal</p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                    <div className="rounded-xl bg-white p-1.5">
                      <p className="text-[10px] text-slate-500">Prot</p>
                      <p className="text-xs font-bold text-slate-900">{item.protein_g}g</p>
                    </div>
                    <div className="rounded-xl bg-white p-1.5">
                      <p className="text-[10px] text-slate-500">Carb</p>
                      <p className="text-xs font-bold text-slate-900">{item.carbs_g}g</p>
                    </div>
                    <div className="rounded-xl bg-white p-1.5">
                      <p className="text-[10px] text-slate-500">Gord</p>
                      <p className="text-xs font-bold text-slate-900">{item.fat_g}g</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Meal Totals & Save Button */}
          <article className="rounded-[28px] border-2 border-[#FF6B35] bg-gradient-to-br from-[#FF6B35] to-[#FF5722] p-4 md:p-5 text-white shadow-[0_18px_42px_rgba(255,107,53,0.25)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
              {MEAL_LABELS[selectedMealType]}
            </p>
            <div className="mt-3 flex flex-col md:flex-row items-start md:items-end justify-between gap-3">
              <div>
                <p className="text-sm text-white/90">Calorias totais</p>
                <p className="mt-1 text-3xl md:text-4xl font-bold">{result.totals.calories}</p>
                <p className="text-sm text-white/80">kcal</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center w-full md:w-auto">
                <div className="rounded-xl bg-white/20 p-2 backdrop-blur">
                  <p className="text-[10px] text-white/90">Prot</p>
                  <p className="text-base md:text-lg font-bold">{result.totals.protein_g}g</p>
                </div>
                <div className="rounded-xl bg-white/20 p-2 backdrop-blur">
                  <p className="text-[10px] text-white/90">Carb</p>
                  <p className="text-base md:text-lg font-bold">{result.totals.carbs_g}g</p>
                </div>
                <div className="rounded-xl bg-white/20 p-2 backdrop-blur">
                  <p className="text-[10px] text-white/90">Gord</p>
                  <p className="text-base md:text-lg font-bold">{result.totals.fat_g}g</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveMeal}
              disabled={isSaving}
              className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#FF6B35] shadow-md hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "💾 Salvando..." : "💾 Salvar refeição"}
            </button>
          </article>
        </>
      )}
    </section>
  );
}
