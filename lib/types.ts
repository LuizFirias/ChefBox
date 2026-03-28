export type RecipePreference = "faster" | "healthier" | "high-protein";

export type RecipeIngredient = {
  name: string;
  quantity: string;
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  servings: number;
  estimatedCost: string;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
};

export type UsageState = {
  used: number;
  limit: number;
  remaining: number;
  isPremium: boolean;
  upgradeRequired: boolean;
  persisted: boolean;
};

export type GenerateRecipesInput = {
  ingredients: string[];
  servings: number;
  preferences?: RecipePreference[];
};

export type GenerateRecipesResponse = {
  recipes: Recipe[];
};

export type MealPlanMeal = {
  slot: string;
  title: string;
  description: string;
};

export type MealPlanDay = {
  day: string;
  meals: MealPlanMeal[];
};

export type MealPlanResponse = {
  plan: MealPlanDay[];
  shoppingList: string[];
  prepNotes: string[];
};

export const recipePreferenceOptions: Array<{
  value: RecipePreference;
  label: string;
}> = [
  { value: "faster", label: "Mais rapido" },
  { value: "healthier", label: "Mais leve" },
  { value: "high-protein", label: "High protein" },
];