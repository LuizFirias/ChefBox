"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AppButton } from "@/components/ui/app-button";
import { Tabs } from "@/components/ui/tabs";
import { getRecipeById, isRecipeSaved, saveRecipe } from "@/lib/app-storage";
import type { Recipe } from "@/lib/types";

const fallbackRecipe: Recipe = {
  id: "demo-bife-a-parmegiana",
  description: "Receita caseira com quantidades claras e execução prática.",
  title: "Frango grelhado com arroz branco",
  prepTime: "25 min",
  servings: 2,
  tags: ["Caseiro", "Simples"],
  protein: {
    title: "Frango grelhado",
    ingredients: [
      { name: "Frango", quantity: "300 g" },
      { name: "Alho", quantity: "2 dentes" },
      { name: "Azeite", quantity: "1 colher" },
    ],
    steps: [
      "Tempere o frango com sal e alho.",
      "Aqueça o azeite na frigideira.",
      "Grelhe o frango até dourar dos dois lados.",
    ],
  },
  base: [
    {
      title: "Arroz branco",
      ingredients: [
        { name: "Arroz", quantity: "1 xícara" },
        { name: "Água", quantity: "2 xícaras" },
        { name: "Sal", quantity: "a gosto" },
      ],
      steps: [
        "Lave o arroz.",
        "Cozinhe com água e sal até secar.",
      ],
    },
  ],
  assembly: [
    "Sirva o arroz no prato.",
    "Coloque o frango por cima.",
  ],
  macros: {
    calories: 450,
    protein_g: 35,
    carbs_g: 48,
    fat_g: 12,
  },
};

type RecipePrintCardProps = {
  recipe: Recipe;
  className?: string;
  captureRef?: React.RefObject<HTMLDivElement | null>;
};

function slugifyRecipeTitle(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "receita-chefbox";
}

function RecipePrintCard({ recipe, className, captureRef }: RecipePrintCardProps) {
  const allParts = [
    { label: recipe.protein.title, part: recipe.protein },
    ...(recipe.base?.map((b) => ({ label: b.title, part: b })) ?? []),
  ];
  return (
    <div ref={captureRef} className={className}>
      <h2 className="text-2xl font-bold leading-tight text-[#5d442f]">
        {recipe.title}
      </h2>

      <p className="mt-2 text-sm font-medium text-[#7b6045]">
        ⏱ {recipe.prepTime} &nbsp;•&nbsp; 🍽 {recipe.servings} {recipe.servings > 1 ? "porções" : "porção"}
      </p>

      <div className="mt-5 space-y-5">
        {allParts.map(({ label, part }) => (
          <div key={label} className="rounded-[28px] border border-[#e6d7bf] bg-[#fffaf1] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7b6045]">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#4D7C4F] shadow-sm">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
                  <path d="M7 5h10" />
                  <path d="M6 9h12" />
                  <path d="M8 13h8" />
                </svg>
              </span>
              Ingredientes – {label}
            </p>
            <ul className="mt-3 space-y-1 text-sm leading-6 text-[#5d442f]">
              {part.ingredients.map((ing) => (
                <li key={ing.name}>{`${ing.quantity} de ${ing.name}`}</li>
              ))}
            </ul>

            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#7b6045]">
              Preparo – {label}
            </p>
            <ol className="mt-2 space-y-1 text-sm leading-6 text-[#5d442f]">
              {part.steps.map((step, i) => (
                <li key={step}>{`${i + 1}. ${step}`}</li>
              ))}
            </ol>
          </div>
        ))}

        {recipe.assembly && recipe.assembly.length > 0 && (
          <div className="rounded-[28px] border border-[#f1d2c4] bg-[#fff4ef] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7b6045]">
              Montagem
            </p>
            <ol className="mt-2 space-y-1 text-sm leading-6 text-[#5d442f]">
              {recipe.assembly.map((step, i) => (
                <li key={step}>{`${i + 1}. ${step}`}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export function RecipeDetailsScreen() {
  const searchParams = useSearchParams();
  const printableCardRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState("Ingredientes");
  const [recipe, setRecipe] = useState<Recipe>(fallbackRecipe);
  const [saved, setSaved] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"image" | "pdf" | null>(null);

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

  async function handleExport(format: "image" | "pdf") {
    if (!printableCardRef.current) {
      return;
    }

    try {
      setExportingFormat(format);
      
      // Usa html2canvas que tem melhor compatibilidade com CORS
      const canvas = await html2canvas(printableCardRef.current, {
        scale: 2,
        backgroundColor: "#f5ebd8",
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      const fileName = slugifyRecipeTitle(recipe.title);

      if (format === "image") {
        // Imagem em proporção 9:16 (vertical mobile-friendly)
        const targetCanvas = document.createElement("canvas");
        const ctx = targetCanvas.getContext("2d")!;
        
        // Formato vertical otimizado para mobile (9:16)
        const targetWidth = 1080;
        const targetHeight = 1920;
        
        targetCanvas.width = targetWidth;
        targetCanvas.height = targetHeight;
        
        // Preenche fundo
        ctx.fillStyle = "#f5ebd8";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        
        // Calcula escala mantendo proporção
        const scale = Math.min(targetWidth / canvas.width, targetHeight / canvas.height);
        const scaledWidth = canvas.width * scale;
        const scaledHeight = canvas.height * scale;
        const x = (targetWidth - scaledWidth) / 2;
        const y = (targetHeight - scaledHeight) / 2;
        
        ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight);
        
        const link = document.createElement("a");
        link.download = `${fileName}.png`;
        link.href = targetCanvas.toDataURL("image/png");
        link.click();
        return;
      }

      // PDF em formato A4 (210mm x 297mm = 595pt x 842pt)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4", // A4: 595 x 842 pontos
      });

      // Dimensões A4 em pontos
      const pdfWidth = 595;
      const pdfHeight = 842;
      
      // Calcula dimensões mantendo proporção dentro do A4
      const scale = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      const scaledWidth = canvas.width * scale;
      const scaledHeight = canvas.height * scale;
      
      // Centraliza no A4
      const x = (pdfWidth - scaledWidth) / 2;
      const y = (pdfHeight - scaledHeight) / 2;

      const dataUrl = canvas.toDataURL("image/png");
      pdf.addImage(dataUrl, "PNG", x, y, scaledWidth, scaledHeight);
      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error("export recipe card", error);
      alert("Erro ao exportar receita. Tente novamente.");
    } finally {
      setExportingFormat(null);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      {/* Nav bar */}
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
            aria-label={saved ? "Receita salva" : "Salvar receita"}
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow-[0_10px_22px_rgba(255,107,53,0.14)] ${
              saved ? "bg-[#FF6B35] text-white" : "bg-[#FFF1EB] text-[#FF6B35]"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-5 w-5 ${saved ? "fill-current stroke-current" : "fill-none stroke-current"}`}
              strokeWidth="1.8"
            >
              <path d="m12 20-1.4-1.27C6.2 14.73 3.5 12.28 3.5 8.98A4.48 4.48 0 0 1 8 4.5c1.54 0 3.02.72 4 1.87A5.2 5.2 0 0 1 16 4.5a4.48 4.48 0 0 1 4.5 4.48c0 3.3-2.7 5.75-7.1 9.76z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => void handleExport("image")}
            disabled={exportingFormat !== null}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-slate-600 shadow-[0_10px_22px_rgba(45,49,66,0.08)] disabled:opacity-60"
          >
            PNG
          </button>
          <button
            type="button"
            onClick={() => void handleExport("pdf")}
            disabled={exportingFormat !== null}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-slate-600 shadow-[0_10px_22px_rgba(45,49,66,0.08)] disabled:opacity-60"
          >
            PDF
          </button>
        </div>
      </div>

      {/* Desktop: 2 columns | Mobile: single column */}
      <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start md:gap-8">
        {/* LEFT COLUMN — stats + interactive tabs */}
        <section className="rounded-4xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 pb-6 pt-8 text-center shadow-[0_24px_50px_rgba(45,49,66,0.06)]">
          <div className="mx-auto grid grid-cols-2 gap-3 rounded-4xl border border-slate-100 bg-[#F7F9FB] p-5">
            <div className="rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tempo</p>
              <p className="mt-2 text-2xl font-bold text-[#FF6B35]">{recipe.prepTime}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ingred.</p>
              <p className="mt-2 text-2xl font-bold text-[#4D7C4F]">{recipe.protein.ingredients.length + (recipe.base?.reduce((s, b) => s + b.ingredients.length, 0) ?? 0)}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Etapas</p>
              <p className="mt-2 text-2xl font-bold text-[#2D3142]">{recipe.protein.steps.length + (recipe.base?.reduce((s, b) => s + b.steps.length, 0) ?? 0) + (recipe.assembly?.length ?? 0)}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
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

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="1.8">
                <path d="M4 13h16" />
                <path d="M6 13v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3" />
              </svg>
              {recipe.protein.title}
            </span>
            {recipe.base?.map((part) => (
              <span key={part.title} className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="1.8">
                  <path d="M5 12h14" />
                  <path d="M7 8h10" />
                  <path d="M9 16h6" />
                </svg>
                {part.title}
              </span>
            ))}
          </div>

          <div className="mt-5">
            <Tabs
              options={["Ingredientes", "Modo de preparo", "Macros"]}
              value={tab}
              onChange={setTab}
            />
          </div>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Serve {recipe.servings} {recipe.servings > 1 ? "pessoas" : "pessoa"}
          </p>

          <div className="mt-4 space-y-3 text-left">
            {tab === "Ingredientes" ? (
              <>
                {[{ label: recipe.protein.title, part: recipe.protein }, ...(recipe.base?.map((b) => ({ label: b.title, part: b })) ?? [])].map(({ label, part }) => (
                  <div key={label} className="rounded-[28px] border border-slate-100 bg-white p-4 shadow-[0_10px_24px_rgba(45,49,66,0.04)]">
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F9FB] text-[#4D7C4F]">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
                          <path d="M7 5h10" />
                          <path d="M6 9h12" />
                          <path d="M8 13h8" />
                          <path d="M9 17h6" />
                        </svg>
                      </span>
                      {label}
                    </p>
                    {part.ingredients.map((ingredient) => (
                      <div
                        key={ingredient.name}
                        className="mb-2 flex items-center justify-between rounded-3xl border border-slate-100 bg-[#F8FAFC] px-4 py-4 last:mb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 bg-white text-[#4D7C4F] shadow-sm">
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
                              <path d="M7 5h10" />
                              <path d="M6 9h12" />
                              <path d="M8 13h8" />
                              <path d="M9 17h6" />
                            </svg>
                          </div>
                          <span className="text-base font-medium text-[#2D3142]">{ingredient.name}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-400">{ingredient.quantity}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            ) : tab === "Macros" ? (
              <>
                {recipe.macros ? (
                  <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_10px_24px_rgba(45,49,66,0.04)]">
                    <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Informações Nutricionais por Porção
                    </p>
                    
                    {/* Calorias destaque */}
                    <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#4D7C4F] to-[#3a5f3c] p-5 text-center text-white shadow-sm">
                      <p className="text-sm font-medium opacity-90">Calorias</p>
                      <p className="mt-1 text-4xl font-bold">{recipe.macros.calories}</p>
                      <p className="mt-1 text-xs opacity-75">kcal</p>
                    </div>

                    {/* Macronutrientes */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#FFE5E5]">
                          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-[#FF6B6B]" strokeWidth="2">
                            <path d="M12 2v20M2 12h20" />
                          </svg>
                        </div>
                        <p className="text-2xl font-bold text-[#2D3142]">{recipe.macros.protein_g}g</p>
                        <p className="mt-1 text-xs font-medium text-slate-400">Proteína</p>
                      </div>
                      
                      <div className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF4E5]">
                          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-[#FFB84D]" strokeWidth="2">
                            <circle cx="12" cy="12" r="9" />
                          </svg>
                        </div>
                        <p className="text-2xl font-bold text-[#2D3142]">{recipe.macros.carbs_g}g</p>
                        <p className="mt-1 text-xs font-medium text-slate-400">Carboidratos</p>
                      </div>
                      
                      <div className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#E5F4FF]">
                          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-[#4D9FFF]" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                          </svg>
                        </div>
                        <p className="text-2xl font-bold text-[#2D3142]">{recipe.macros.fat_g}g</p>
                        <p className="mt-1 text-xs font-medium text-slate-400">Gordura</p>
                      </div>
                    </div>

                    <p className="mt-5 text-center text-xs text-slate-400">
                      Valores aproximados calculados com base nos ingredientes
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 fill-none stroke-slate-300" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    <p className="mt-3 text-sm font-medium text-slate-400">
                      Informações nutricionais não disponíveis para esta receita
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {[{ label: recipe.protein.title, part: recipe.protein }, ...(recipe.base?.map((b) => ({ label: b.title, part: b })) ?? [])].map(({ label, part }) => (
                  <div key={label} className="rounded-[28px] border border-slate-100 bg-white p-4 shadow-[0_10px_24px_rgba(45,49,66,0.04)]">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                    {part.steps.map((step, index) => (
                      <div
                        key={step}
                        className="mb-2 flex gap-3 rounded-3xl border border-slate-100 bg-[#F8FAFC] px-4 py-4 last:mb-0"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4D7C4F] text-sm font-semibold text-white">
                          {index + 1}
                        </span>
                        <p className="text-sm leading-6 text-slate-600">{step}</p>
                      </div>
                    ))}
                  </div>
                ))}
                {recipe.assembly && recipe.assembly.length > 0 && (
                  <div className="rounded-[28px] border border-[#ffd9ca] bg-[#fff4ef] p-4 shadow-[0_10px_24px_rgba(255,107,53,0.06)]">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Montagem</p>
                    {recipe.assembly.map((step, index) => (
                      <div
                        key={step}
                        className="mb-2 flex gap-3 rounded-3xl border border-[#ffd9ca] bg-white/80 px-4 py-4 last:mb-0"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-sm font-semibold text-white">
                          {index + 1}
                        </span>
                        <p className="text-sm leading-6 text-slate-600">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <p className="mt-6 text-center text-xs font-medium text-slate-400">
            {saved ? "Receita salva na aba Salvos" : "Você pode salvar essa receita para consultar depois"}
          </p>
        </section>

        {/* RIGHT COLUMN — ficha impressa (desktop only, sticky) */}
        <RecipePrintCard
          recipe={recipe}
          className="hidden rounded-4xl border border-[#e8dcc9] bg-[linear-gradient(180deg,#f5ebd8_0%,#efe2cb_100%)] p-6 shadow-[0_24px_50px_rgba(124,94,58,0.12)] md:block md:sticky md:top-6 md:self-start"
        />
      </div>

      <div className="pointer-events-none fixed -left-[200vw] top-0 w-[720px]">
        <RecipePrintCard
          recipe={recipe}
          captureRef={printableCardRef}
          className="rounded-4xl border border-[#e8dcc9] bg-[linear-gradient(180deg,#f5ebd8_0%,#efe2cb_100%)] p-6 shadow-[0_24px_50px_rgba(124,94,58,0.12)]"
        />
      </div>
    </main>
  );
}