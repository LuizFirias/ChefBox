import type { Recipe } from "@/lib/types";

export type AccountProfile = {
  email: string;
  fullName: string;
  weight: string;
  height: string;
  plan: string;
};

const GENERATED_RECIPES_KEY = "chefbox-generated-recipes";
const SAVED_RECIPES_KEY = "chefbox-saved-recipes";
const ACCOUNT_PROFILE_KEY = "chefbox-account-profile";

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

export function getGeneratedRecipes() {
  return readJson<Recipe[]>(GENERATED_RECIPES_KEY, []);
}

export function saveGeneratedRecipes(recipes: Recipe[]) {
  writeJson(GENERATED_RECIPES_KEY, recipes);
}

export function getSavedRecipes() {
  return readJson<Recipe[]>(SAVED_RECIPES_KEY, []);
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