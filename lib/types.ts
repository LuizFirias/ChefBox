export type RecipePreference = "faster" | "healthier" | "high-protein";
export type MealType = "breakfast" | "lunch" | "snack" | "dinner";
export type MealVariety = "normal" | "baixa";

export type RecipeIngredient = {
  name: string;
  quantity: string;
};

export type RecipePart = {
  title: string;
  ingredients: RecipeIngredient[];
  steps: string[];
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  servings: number;
  tags: string[];
  protein: RecipePart;
  base?: RecipePart[];
  assembly?: string[];
  macros?: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
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
  dishType: "breakfast" | "lunch" | "snack" | "dinner";
  diet?: string;
  preferences?: RecipePreference[];
};

export type GenerateRecipesResponse = {
  recipes: Recipe[];
  unusedIngredients?: string[];
};

export type MealPlanBreakfast = {
  type: "breakfast";
  title: string;
  description: string;
  calories: number;
};

export type MealPlanLunch = {
  type: "lunch";
  mainDish: string;
  sideDish: string;
  extra?: string;
  calories: number;
};

export type MealPlanSnack = {
  type: "snack";
  title: string;
  description: string;
  calories: number;
};

export type MealPlanDinner = {
  type: "dinner";
  title: string;
  description: string;
  calories: number;
};

export type MealPlanMeal = MealPlanBreakfast | MealPlanLunch | MealPlanSnack | MealPlanDinner;

export type MealPlanShoppingItem = {
  name: string;
  quantity: string;
};

export type MealPlanShoppingCategory = {
  category: string;
  items: MealPlanShoppingItem[];
};

export type MealPlanPrepDay = {
  day: string;
  tasks: string[];
};

export type MealPlanSettings = {
  calories: number;
  meals: MealType[];
  goal: string;
  days?: number;
  servings?: number;
  allergies?: string[];
  preferences?: string[];
  variety?: MealVariety;
};

export type MealPlanDay = {
  day: string;
  meals: MealPlanMeal[];
  totalCalories: number;
};

export type MealPlanResponse = {
  plan: MealPlanDay[];
  shoppingList: MealPlanShoppingCategory[];
  prepPlan: MealPlanPrepDay[];
  macroSummary: {
    protein_g: number;
    carb_g: number;
    fat_g: number;
  };
  estimatedCost: string;
};

export const recipePreferenceOptions: Array<{
  value: RecipePreference;
  label: string;
}> = [
  { value: "faster", label: "Mais rapido" },
  { value: "healthier", label: "Mais leve" },
  { value: "high-protein", label: "High protein" },
];

// ─── Shopping Lists ───────────────────────────────────────────────────────

export type ShoppingListItem = {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
};

export type ShoppingList = {
  id: string;
  name: string;
  createdAt: number;
  items: ShoppingListItem[];
  isActive: boolean;
};

// ─── Plans & Subscriptions ────────────────────────────────────────────────

export type PlanType = "lifetime" | "basic" | "pro";
export type PlanPeriod = "lifetime" | "monthly" | "quarterly" | "annual";
export type PlanStatus = "active" | "cancelled" | "expired" | "past_due" | "trialing";

export type Subscription = {
  id: string;
  userId: string;
  yampiSubscriptionId: string | null;
  planType: PlanType;
  planPeriod: PlanPeriod;
  status: PlanStatus;
  startDate: Date;
  endDate: Date | null;
  price: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
};

export type User = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  yampiCustomerId: string | null;
  
  // Controle de uso
  recipeGenerationsUsed: number;
  recipeGenerationsLimit: number;
  generationCycleStart: Date | null;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
};

export type Feature =
  | "recipe_generation"
  | "planner"
  | "smart_market"
  | "recipe_history"
  | "fixed_recipes"
  | "basic_macros"
  | "detailed_macros"
  | "saved_recipes";

// Mapeamento de produtos Yampi para planos
export const YAMPI_PRODUCT_MAP: Record<string, { planType: PlanType; planPeriod: PlanPeriod; price: number }> = {
  "chefbox-lifetime": { planType: "lifetime", planPeriod: "lifetime", price: 37.00 },
  "chefbox-basico-mensal": { planType: "basic", planPeriod: "monthly", price: 14.90 },
  "chefbox-basico-trimestral": { planType: "basic", planPeriod: "quarterly", price: 34.90 },
  "chefbox-basico-anual": { planType: "basic", planPeriod: "annual", price: 119.90 },
  "chefbox-pro-mensal": { planType: "pro", planPeriod: "monthly", price: 24.90 },
  "chefbox-pro-trimestral": { planType: "pro", planPeriod: "quarterly", price: 59.90 },
  "chefbox-pro-anual": { planType: "pro", planPeriod: "annual", price: 199.90 },
};

export const PLAN_LEVELS: Record<PlanType, number> = {
  lifetime: 1,
  basic: 2,
  pro: 3,
};