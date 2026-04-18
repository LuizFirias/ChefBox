import { ZodError } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { generateStructuredJson } from "@/lib/ai/client";
import { generateMockRecipes } from "@/lib/ai/mock";
import {
  buildRecipeSystemPrompt,
  buildRecipeUserPrompt,
} from "@/lib/ai/prompts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveGeneratedRecipesToHistory } from "@/lib/supabase/db";
import { consumeRecipeGeneration } from "@/lib/usage";
import { correctIngredients } from "@/lib/ingredient-correction";
import type { GenerateRecipesInput, GenerateRecipesResponse } from "@/lib/types";
import {
  generateRecipesInputSchema,
  generateRecipesResponseSchema,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function generateRecipesWithAi(input: GenerateRecipesInput, isPremium: boolean) {
  const messages = [
    { role: "system" as const, content: buildRecipeSystemPrompt() },
    { role: "user" as const, content: buildRecipeUserPrompt(input) },
  ];
  const tiers: Array<"base" | "premium"> = isPremium ? ["premium"] : ["base", "premium"];

  console.log("[generate-recipes] Attempting AI generation with:", {
    dishType: input.dishType,
    ingredients: input.ingredients,
    servings: input.servings,
    isPremium,
    tiers,
  });

  for (const modelTier of tiers) {
    try {
      console.log(`[generate-recipes] Trying ${modelTier} model...`);
      
      const aiPayload = await generateStructuredJson<GenerateRecipesResponse>(messages, {
        feature: "recipes",
        isPremium,
        modelTier,
        useCache: false, // Desabilita cache para garantir variação nas receitas
      });

      if (!aiPayload) {
        console.log(`[generate-recipes] ${modelTier} returned null/undefined`);
        continue;
      }

      console.log(`[generate-recipes] ${modelTier} returned payload, parsing...`);
      const parsed = generateRecipesResponseSchema.parse(aiPayload);
      console.log(`[generate-recipes] ${modelTier} SUCCESS - ${parsed.recipes.length} recipes`);
      return cleanRecipeSteps(parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI error";
      console.error(`[generate-recipes] ${modelTier} attempt failed:`, message);
      if (error instanceof Error && error.stack) {
        console.error(`[generate-recipes] Stack:`, error.stack.split('\n').slice(0, 3).join('\n'));
      }
    }
  }

  console.log("[generate-recipes] All AI tiers failed, will use mock fallback");
  return null;
}

// Sanity check: verifica se o ingrediente principal bate com o título da receita
// Detecta o caso clássico: "Frango grelhado" mas ingrediente é "picanha"
const PROTEIN_MAP: Record<string, string[]> = {
  frango: ["frango", "peito de frango", "coxa", "sobrecoxa", "frango inteiro", "frango picado", "frango cortado"],
  carne: ["carne", "patinho", "acém", "contrafilé", "alcatra", "carne bovina", "carne moída", "bife", "filé"],
  picanha: ["picanha"],
  peixe: ["peixe", "tilápia", "salmão", "atum", "bacalhau", "merluza", "filé de peixe"],
  camarão: ["camarão"],
  porco: ["porco", "carne suína", "costela", "lombo", "pernil", "linguiça"],
  ovo: ["ovo", "ovos"],
  tapioca: ["tapioca", "goma", "polvilho"],
  iogurte: ["iogurte", "yogurt"],
  queijo: ["queijo", "mussarela", "prato", "minas"],
};

const MIXED_DISH_KEYWORDS = [
  "omelete",
  "omeleta",
  "mexido",
  "mexida",
  "bowl",
  "salteado",
  "salteada",
  "refogado",
  "refogada",
  "frigideira",
  "crepioca",
  "tapioca",
  "wrap",
  "sanduiche",
  "sanduíche",
];

const ALTERNATIVE_KEYWORDS = [
  "low carb",
  "salada",
  "lanche",
  "snack",
  "wrap",
  "tapioca",
  "crepioca",
  "omelete",
  "omeleta",
  "bowl",
];

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Remove numeração automática das etapas (ex: "1. Tempere" → "Tempere")
function cleanStepNumbering(step: string): string {
  // Remove padrões como "1.", "2)", "1 -", "1-", "1–", "1 –" no início
  return step.replace(/^\s*\d+\s*[\.\)\-–—]\s*/, "").trim();
}

/**
 * Remove redundâncias em ingredientes gerados pela IA.
 * Ex: quantity="180g de frango em cubos" + name="frango" → quantity="180g em cubos"
 * A UI já concatena automaticamente como "{quantity} de {name}".
 */
function cleanIngredientRedundancy(ingredient: { name: string; quantity: string }) {
  const ingredientName = normalizeText(ingredient.name);
  let cleanedQuantity = ingredient.quantity;

  // Padrões a remover: "de {ingrediente}", "de {ingrediente} em", "de {ingrediente} picado", etc.
  // Exemplo: "180g de frango em cubos" → "180g em cubos"
  const patterns = [
    new RegExp(`\\s+de\\s+${ingredientName}(?=\\s|$)`, "gi"),
    new RegExp(`\\s+${ingredientName}\\s+de\\s+`, "gi"),
  ];

  for (const pattern of patterns) {
    cleanedQuantity = cleanedQuantity.replace(pattern, " ");
  }

  // Remove espaços múltiplos e trim
  cleanedQuantity = cleanedQuantity.replace(/\s+/g, " ").trim();

  return {
    ...ingredient,
    quantity: cleanedQuantity,
  };
}

// Processa todas as receitas para remover numeração dos steps e redundâncias dos ingredientes
function cleanRecipeSteps(recipes: GenerateRecipesResponse): GenerateRecipesResponse {
  return {
    ...recipes,
    recipes: recipes.recipes.map((recipe) => ({
      ...recipe,
      protein: {
        ...recipe.protein,
        ingredients: recipe.protein.ingredients.map(cleanIngredientRedundancy),
        steps: recipe.protein.steps.map(cleanStepNumbering),
      },
      base: recipe.base?.map((base) => ({
        ...base,
        ingredients: base.ingredients.map(cleanIngredientRedundancy),
        steps: base.steps.map(cleanStepNumbering),
      })),
      assembly: recipe.assembly?.map(cleanStepNumbering),
    })),
  };
}

function hasKeyword(value: string, keywords: string[]): boolean {
  const normalized = normalizeText(value);
  return keywords.some((keyword) => normalized.includes(keyword));
}

function recipeUsesRice(recipe: GenerateRecipesResponse["recipes"][number]): boolean {
  return (recipe.base ?? []).some((part) =>
    part.ingredients.some((ingredient) => normalizeText(ingredient.name).includes("arroz")) ||
    normalizeText(part.title).includes("arroz")
  );
}

function countMatchedUserIngredients(
  recipe: GenerateRecipesResponse["recipes"][number],
  userIngredients: string[],
): number {
  const recipeIngredients = [
    ...recipe.protein.ingredients.map((ingredient) => normalizeText(ingredient.name)),
    ...(recipe.base?.flatMap((part) => part.ingredients.map((ingredient) => normalizeText(ingredient.name))) ?? []),
  ];
  const normalizedUserIngredients = userIngredients.map(normalizeText);

  return normalizedUserIngredients.filter((userIngredient) =>
    recipeIngredients.some((recipeIngredient) =>
      recipeIngredient.includes(userIngredient) || userIngredient.includes(recipeIngredient)
    )
  ).length;
}

function hasRequiredRecipeVariety(
  recipes: GenerateRecipesResponse["recipes"],
  input: GenerateRecipesInput,
): boolean {
  if (recipes.length < 2) {
    console.log("[hasRequiredRecipeVariety] Failed: less than 2 recipes");
    return false;
  }

  // Para café da manhã e lanches, validações são mais flexíveis
  if (input.dishType === "breakfast" || input.dishType === "snack") {
    const hasThreeIngredientRecipe = recipes.some((recipe) => countMatchedUserIngredients(recipe, input.ingredients) >= 2);
    console.log("[hasRequiredRecipeVariety] Breakfast/snack check:", { hasThreeIngredientRecipe });
    return hasThreeIngredientRecipe;
  }

  // Validações para almoço/jantar
  if (recipes.length !== 3) {
    console.log("[hasRequiredRecipeVariety] Failed: not exactly 3 recipes for lunch/dinner");
    return false;
  }

  const hasTraditional = recipes.some((recipe) => (recipe.base?.length ?? 0) > 0 && !hasKeyword(recipe.title, MIXED_DISH_KEYWORDS));
  const hasMixedDish = recipes.some((recipe) => hasKeyword(`${recipe.title} ${recipe.protein.title}`, MIXED_DISH_KEYWORDS));
  const hasAlternative = recipes.some((recipe) => !recipeUsesRice(recipe) || hasKeyword(`${recipe.title} ${recipe.protein.title}`, ALTERNATIVE_KEYWORDS));
  const hasNonRiceOption = recipes.some((recipe) => !recipeUsesRice(recipe));
  const hasThreeIngredientRecipe = recipes.some((recipe) => countMatchedUserIngredients(recipe, input.ingredients) >= 3);

  console.log("[hasRequiredRecipeVariety] Lunch/dinner checks:", {
    hasTraditional,
    hasMixedDish,
    hasAlternative,
    hasNonRiceOption,
    hasThreeIngredientRecipe,
  });

  return hasTraditional && hasMixedDish && hasAlternative && hasNonRiceOption && hasThreeIngredientRecipe;
}

function isRecipeConsistent(recipes: GenerateRecipesResponse["recipes"]): boolean {
  for (const recipe of recipes) {
    const titleLower = recipe.title.toLowerCase();
    const allIngredients = [
      ...recipe.protein.ingredients.map((i) => i.name.toLowerCase()),
      ...(recipe.base?.flatMap((b) => b.ingredients.map((i) => i.name.toLowerCase())) ?? []),
    ];

    for (const [protein, variants] of Object.entries(PROTEIN_MAP)) {
      if (titleLower.includes(protein)) {
        const hasMatch = allIngredients.some((ing) =>
          variants.some((v) => ing.includes(v) || v.includes(ing))
        );
        if (!hasMatch) {
          console.warn(`[isRecipeConsistent] REJECT: "${recipe.title}" has "${protein}" in title but ingredients don't match:`, allIngredients);
          return false;
        }
      }
    }
  }
  console.log("[isRecipeConsistent] PASS: All recipes are consistent");
  return true;
}

/**
 * Valida se todos os ingredientes usados nas receitas estão na lista fornecida pelo usuário.
 * Permite apenas temperos básicos como exceção (sal, óleo, água, alho, cebola, pimenta).
 * BLOQUEIA invenção de proteínas, vegetais e outros ingredientes principais.
 */
function areIngredientsValid(
  recipes: GenerateRecipesResponse["recipes"],
  userIngredients: string[]
): boolean {
  // Temperos básicos sempre permitidos (devem estar em qualquer cozinha)
  const BASIC_SEASONINGS = [
    "sal", "óleo", "azeite", "água", "alho", "cebola",
    "pimenta", "pimenta do reino", "pimenta-do-reino",
    "limão", "vinagre", "cheiro verde", "salsinha", "cebolinha",
  ];

  const normalizedUserIngredients = userIngredients.map(normalizeText);

  for (const recipe of recipes) {
    const allRecipeIngredients = [
      ...recipe.protein.ingredients.map((i) => normalizeText(i.name)),
      ...(recipe.base?.flatMap((b) => b.ingredients.map((i) => normalizeText(i.name))) ?? []),
    ];

    for (const ingredient of allRecipeIngredients) {
      // Ignorar temperos básicos
      const isBasicSeasoning = BASIC_SEASONINGS.some((basic) => 
        ingredient.includes(basic) || basic.includes(ingredient)
      );
      
      if (isBasicSeasoning) {
        continue; // Permitir temperos básicos
      }

      // Verificar se o ingrediente está na lista do usuário
      const isInUserList = normalizedUserIngredients.some((userIng) =>
        ingredient.includes(userIng) || userIng.includes(ingredient)
      );

      if (!isInUserList) {
        console.warn(
          `[areIngredientsValid] REJECT: Recipe "${recipe.title}" uses "${ingredient}" which is NOT in user's list:`,
          { userIngredients, recipeIngredient: ingredient }
        );
        return false;
      }
    }
  }

  console.log("[areIngredientsValid] PASS: All non-basic ingredients are from user's list");
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Configuração do servidor indisponível." },
        { status: 500 },
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Você precisa estar logado para gerar receitas." },
        { status: 401 },
      );
    }

    const input = generateRecipesInputSchema.parse(await request.json());
    
    // Corrigir erros comuns de digitação nos ingredientes
    const originalIngredients = [...input.ingredients];
    input.ingredients = correctIngredients(input.ingredients);
    
    const hadCorrections = originalIngredients.some((orig, i) => orig !== input.ingredients[i]);
    if (hadCorrections) {
      console.log("[generate-recipes] Ingredient corrections:", {
        original: originalIngredients,
        corrected: input.ingredients,
      });
    }

    const usage = await consumeRecipeGeneration(request);

    console.log("[generate-recipes] New request:", {
      ingredients: input.ingredients,
      servings: input.servings,
      dishType: input.dishType,
      userId: user.id.substring(0, 8),
    });

    if (usage.upgradeRequired) {
      return NextResponse.json(
        {
          error: "Limite diario atingido. Faça upgrade para continuar.",
          usage,
          upgradeRequired: true,
        },
        { status: 402 },
      );
    }

    let recipes = cleanRecipeSteps(generateMockRecipes(input));
    let source: "ai" | "fallback" = "fallback";

    const aiRecipes = await generateRecipesWithAi(input, usage.isPremium);

    if (aiRecipes) {
      const isConsistent = isRecipeConsistent(aiRecipes.recipes);
      const hasVariety = hasRequiredRecipeVariety(aiRecipes.recipes, input);
      const validIngredients = areIngredientsValid(aiRecipes.recipes, input.ingredients);
      
      console.log("[generate-recipes] AI validation:", {
        isConsistent,
        hasVariety,
        validIngredients,
        isPremium: usage.isPremium,
        recipeCount: aiRecipes.recipes.length,
      });

      // Sanity check: refaz com premium se houver inconsistência, pouca variedade estrutural ou menos de 3 receitas
      if ((!isConsistent || !hasVariety || !validIngredients) && !usage.isPremium) {
        console.warn("[generate-recipes] Retrying with premium (inconsistency, weak variety, or invalid ingredients)");
        const premiumRetry = await generateRecipesWithAi(input, true);
        if (
          premiumRetry && 
          isRecipeConsistent(premiumRetry.recipes) && 
          hasRequiredRecipeVariety(premiumRetry.recipes, input) &&
          areIngredientsValid(premiumRetry.recipes, input.ingredients)
        ) {
          console.log("[generate-recipes] Premium retry PASSED validations");
          recipes = premiumRetry;
          source = "ai";
        } else {
          // Premium também falhou —usa base mesmo (melhor que fallback mock)
          console.log("[generate-recipes] Premium retry also failed, using original AI recipes anyway");
          recipes = aiRecipes;
          source = "ai";
        }
      } else if (isConsistent && hasVariety && validIngredients) {
        console.log("[generate-recipes] AI recipes PASSED all validations");
        recipes = aiRecipes;
        source = "ai";
      } else {
        // Premium user mas validações falharam - ainda assim usa AI (melhor que mock)
        console.log("[generate-recipes] Premium user, using AI despite validation failures");
        recipes = aiRecipes;
        source = "ai";
      }
    } else {
      console.log("[generate-recipes] No AI recipes generated, using mock fallback");
    }

    // Salvar receitas geradas no histórico do usuário
    try {
      await saveGeneratedRecipesToHistory(supabase, user.id, recipes.recipes);
    } catch (error) {
      console.error("Failed to save generated recipes to history:", error);
      // Não falha a requisição se o salvamento falhar
    }

    console.log("[generate-recipes] Success:", {
      count: recipes.recipes.length,
      source,
      titles: recipes.recipes.map(r => r.title),
      userId: user.id.substring(0, 8),
    });

    return NextResponse.json(
      {
        recipes: recipes.recipes,
        unusedIngredients: recipes.unusedIngredients ?? [],
        usage,
        source,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Entrada invalida. Envie entre 2 e 16 ingredientes e a quantidade de pessoas.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    console.error("generate-recipes error:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar receitas." },
      { status: 500 },
    );
  }
}
