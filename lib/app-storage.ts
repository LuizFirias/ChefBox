import type { MealPlanResponse, MealPlanSettings, Recipe, RecipePart, ShoppingList, ShoppingListItem, MealPlanShoppingCategory } from "@/lib/types";

export type AccountProfile = {
  email: string;
  fullName: string;
  weight: string;
  height: string;
  plan: string;
};

const GENERATED_RECIPES_KEY = "chefbox-generated-recipes";
const SAVED_RECIPES_KEY = "chefbox-saved-recipes";
const SAVED_MEAL_PLANS_KEY = "chefbox-saved-meal-plans";
const SHOPPING_LISTS_KEY = "chefbox-shopping-lists";
const ACCOUNT_PROFILE_KEY = "chefbox-account-profile";
const MEAL_PLAN_KEY = "chefbox-meal-plan";
const MEAL_PLAN_SETTINGS_KEY = "chefbox-meal-plan-settings";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizePart(raw: unknown, fallbackTitle: string): RecipePart {
  const record = (raw ?? {}) as Record<string, unknown>;

  return {
    title: typeof record.title === "string" && record.title.trim().length > 0
      ? record.title
      : fallbackTitle,
    ingredients: Array.isArray(record.ingredients)
      ? (record.ingredients as RecipePart["ingredients"])
      : [],
    steps: Array.isArray(record.steps) ? (record.steps as string[]) : [],
  };
}

// Backward-compat: recipes saved in old formats are upgraded on read
function normalizeRecipe(raw: unknown): Recipe {
  const record = (raw ?? {}) as Record<string, unknown>;
  const title = typeof record.title === "string" && record.title.trim().length > 0
    ? record.title
    : "Receita";

  if (record.protein) {
    return {
      ...(record as unknown as Recipe),
      title,
      description: typeof record.description === "string" ? record.description : "",
      prepTime: typeof record.prepTime === "string" ? record.prepTime : "20 min",
      servings: typeof record.servings === "number" ? record.servings : 2,
      tags: Array.isArray(record.tags) ? (record.tags as string[]) : [],
      protein: normalizePart(record.protein, title),
      base: Array.isArray(record.base)
        ? (record.base as unknown[]).map((part, index) => normalizePart(part, `Base ${index + 1}`))
        : [],
      assembly: Array.isArray(record.assembly) ? (record.assembly as string[]) : [],
    };
  }

  if (record.main) {
    return {
      ...(record as unknown as Recipe),
      title,
      description: typeof record.description === "string" ? record.description : "",
      prepTime: typeof record.prepTime === "string" ? record.prepTime : "20 min",
      servings: typeof record.servings === "number" ? record.servings : 2,
      tags: Array.isArray(record.tags) ? (record.tags as string[]) : [],
      protein: normalizePart(record.main, title),
      base: record.side ? [normalizePart(record.side, "Base")] : [],
      assembly: [],
    };
  }

  return {
    ...(record as unknown as Recipe),
    title,
    description: typeof record.description === "string" ? record.description : "",
    prepTime: typeof record.prepTime === "string" ? record.prepTime : "20 min",
    servings: typeof record.servings === "number" ? record.servings : 2,
    tags: Array.isArray(record.tags) ? (record.tags as string[]) : [],
    protein: normalizePart(
      {
        title,
        ingredients: record.ingredients,
        steps: record.steps,
      },
      title,
    ),
    base: [],
    assembly: [],
  };
}

function normalizeRecipes(raws: unknown[]): Recipe[] {
  return raws.map(normalizeRecipe);
}

type RecipesWithTimestamp = {
  recipes: Recipe[];
  generatedAt: number;
};

export function getGeneratedRecipes() {
  const data = readJson<RecipesWithTimestamp | unknown[]>(GENERATED_RECIPES_KEY, []);
  
  // Verificar se é o novo formato com timestamp
  if (data && typeof data === 'object' && 'recipes' in data && 'generatedAt' in data) {
    const { recipes, generatedAt } = data as RecipesWithTimestamp;
    
    // Verificar se já se passaram 24 horas (86400000 ms)
    const now = Date.now();
    const elapsed = now - generatedAt;
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    if (elapsed > twentyFourHours) {
      // Limpar receitas expiradas
      writeJson(GENERATED_RECIPES_KEY, { recipes: [], generatedAt: now });
      return [];
    }
    
    const normalized = normalizeRecipes(recipes);
    writeJson(GENERATED_RECIPES_KEY, { recipes: normalized, generatedAt });
    return normalized;
  }
  
  // Formato antigo (array direto) - converter para novo formato
  const recipes = normalizeRecipes(Array.isArray(data) ? data : []);
  const now = Date.now();
  writeJson(GENERATED_RECIPES_KEY, { recipes, generatedAt: now });
  return recipes;
}

export function saveGeneratedRecipes(recipes: Recipe[]) {
  const now = Date.now();
  writeJson(GENERATED_RECIPES_KEY, { recipes, generatedAt: now });
}

export function getSavedRecipes() {
  const recipes = normalizeRecipes(readJson<unknown[]>(SAVED_RECIPES_KEY, []));
  writeJson(SAVED_RECIPES_KEY, recipes);
  return recipes;
}

export function isRecipeSaved(recipeId: string) {
  return getSavedRecipes().some((recipe) => recipe.id === recipeId);
}

export function saveRecipe(recipe: Recipe) {
  const currentRecipes = getSavedRecipes();

  if (currentRecipes.some((currentRecipe) => currentRecipe.id === recipe.id)) {
    return currentRecipes;
  }

  const nextRecipes = [recipe, ...currentRecipes];
  writeJson(SAVED_RECIPES_KEY, nextRecipes);
  return nextRecipes;
}

export function removeSavedRecipe(recipeId: string) {
  const nextRecipes = getSavedRecipes().filter((recipe) => recipe.id !== recipeId);
  writeJson(SAVED_RECIPES_KEY, nextRecipes);
  return nextRecipes;
}

export function getRecipeById(recipeId: string) {
  const savedRecipe = getSavedRecipes().find((recipe) => recipe.id === recipeId);

  if (savedRecipe) {
    return savedRecipe;
  }

  return getGeneratedRecipes().find((recipe) => recipe.id === recipeId) ?? null;
}

export function getAccountProfile(defaults?: Partial<AccountProfile>) {
  return {
    email: defaults?.email ?? "",
    fullName: defaults?.fullName ?? "",
    weight: defaults?.weight ?? "",
    height: defaults?.height ?? "",
    plan: defaults?.plan ?? "Free",
    ...readJson<Partial<AccountProfile>>(ACCOUNT_PROFILE_KEY, {}),
  } as AccountProfile;
}

export function saveAccountProfile(profile: AccountProfile) {
  writeJson(ACCOUNT_PROFILE_KEY, profile);
}

export function getMealPlan<T extends MealPlanResponse & { source?: "ai" | "fallback" }>() {
  const plan = readJson<T | null>(MEAL_PLAN_KEY, null);
  
  // Validar estrutura e limpar dados antigos/inválidos
  if (plan && plan.plan && Array.isArray(plan.plan)) {
    const hasInvalidMeals = plan.plan.some((day) =>
      day.meals?.some((meal: any) => {
        const validTypes = ["breakfast", "lunch", "snack", "dinner"];
        return !validTypes.includes(meal.type);
      })
    );
    
    if (hasInvalidMeals) {
      // Dados antigos detectados, limpar
      console.warn("[app-storage] Invalid meal types detected, clearing meal plan");
      writeJson(MEAL_PLAN_KEY, null);
      return null;
    }
  }
  
  return plan;
}

export function saveMealPlan<T extends MealPlanResponse & { source?: "ai" | "fallback" }>(plan: T) {
  writeJson(MEAL_PLAN_KEY, plan);
}

export function getMealPlanSettings(defaults: MealPlanSettings) {
  return {
    ...defaults,
    ...readJson<Partial<MealPlanSettings>>(MEAL_PLAN_SETTINGS_KEY, {}),
  };
}

export function saveMealPlanSettings(settings: MealPlanSettings) {
  writeJson(MEAL_PLAN_SETTINGS_KEY, settings);
}

// ─── Saved Meal Plans ───────────────────────────────────────────────────────

export type SavedMealPlan = MealPlanResponse & {
  id: string;
  name: string;
  savedAt: number;
  settings: MealPlanSettings;
};

/**
 * Get saved meal plans from localStorage (fallback for logged out users)
 * For logged in users, use getSavedMealPlansFromDB instead
 */
export function getSavedMealPlans(): SavedMealPlan[] {
  return readJson<SavedMealPlan[]>(SAVED_MEAL_PLANS_KEY, []);
}

/**
 * Save meal plan to localStorage (fallback for logged out users)
 * For logged in users, use saveMealPlanToDB instead
 */
export function saveMealPlanToSaved(plan: MealPlanResponse, settings: MealPlanSettings, name?: string): SavedMealPlan[] {
  const currentPlans = getSavedMealPlans();
  
  // Generate default name if not provided
  const defaultName = name || `Planejamento ${new Date().toLocaleDateString("pt-BR")}`;
  
  const newPlan: SavedMealPlan = {
    ...plan,
    id: `meal-plan-${Date.now()}`,
    name: defaultName,
    savedAt: Date.now(),
    settings,
  };
  
  const nextPlans = [newPlan, ...currentPlans];
  writeJson(SAVED_MEAL_PLANS_KEY, nextPlans);
  return nextPlans;
}

/**
 * Remove saved meal plan from localStorage (fallback for logged out users)
 * For logged in users, use deleteSavedMealPlanFromDB instead
 */
export function removeSavedMealPlan(planId: string): SavedMealPlan[] {
  const nextPlans = getSavedMealPlans().filter((plan) => plan.id !== planId);
  writeJson(SAVED_MEAL_PLANS_KEY, nextPlans);
  return nextPlans;
}

// ─── Shopping Lists ───────────────────────────────────────────────────────

/**
 * Get all shopping lists from localStorage
 */
export function getShoppingLists(): ShoppingList[] {
  return readJson<ShoppingList[]>(SHOPPING_LISTS_KEY, []);
}

/**
 * Create a new shopping list from meal plan shopping list
 * If a list with the same name already exists, returns the existing list without creating a duplicate
 */
export function createShoppingListFromMealPlan(
  shoppingCategories: MealPlanShoppingCategory[],
  name?: string
): ShoppingList {
  const listName = name || "Nova compra";
  const currentLists = getShoppingLists();
  
  // Check if a list with this name already exists
  const existingList = currentLists.find(list => list.name === listName);
  if (existingList) {
    console.log(`[app-storage] Shopping list "${listName}" already exists, returning existing list`);
    return existingList;
  }
  
  const items: ShoppingListItem[] = shoppingCategories.flatMap((category) =>
    category.items.map((item) => ({
      id: `item-${Date.now()}-${Math.random()}`,
      name: item.name,
      quantity: item.quantity,
      category: category.category,
      checked: false,
    }))
  );

  const newList: ShoppingList = {
    id: `list-${Date.now()}`,
    name: listName,
    createdAt: Date.now(),
    items,
    isActive: false,
  };

  const nextLists = [newList, ...currentLists];
  writeJson(SHOPPING_LISTS_KEY, nextLists);
  console.log(`[app-storage] Created new shopping list "${listName}"`);
  
  return newList;
}

/**
 * Update shopping list
 */
export function updateShoppingList(listId: string, updates: Partial<ShoppingList>): ShoppingList[] {
  const lists = getShoppingLists();
  const nextLists = lists.map((list) =>
    list.id === listId ? { ...list, ...updates } : list
  );
  writeJson(SHOPPING_LISTS_KEY, nextLists);
  return nextLists;
}

/**
 * Toggle item checked state
 */
export function toggleShoppingListItem(listId: string, itemId: string): ShoppingList[] {
  const lists = getShoppingLists();
  const nextLists = lists.map((list) => {
    if (list.id !== listId) return list;
    
    return {
      ...list,
      items: list.items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    };
  });
  writeJson(SHOPPING_LISTS_KEY, nextLists);
  return nextLists;
}

/**
 * Delete shopping list
 */
export function deleteShoppingList(listId: string): ShoppingList[] {
  const nextLists = getShoppingLists().filter((list) => list.id !== listId);
  writeJson(SHOPPING_LISTS_KEY, nextLists);
  return nextLists;
}

/**
 * Rename shopping list
 */
export function renameShoppingList(listId: string, newName: string): ShoppingList[] {
  return updateShoppingList(listId, { name: newName });
}