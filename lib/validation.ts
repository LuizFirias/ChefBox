import { z } from "zod";

export const recipePreferenceSchema = z.enum([
  "faster",
  "healthier",
  "high-protein",
]);

export const generateRecipesInputSchema = z.object({
  ingredients: z.array(z.string().trim().min(1)).min(2).max(16),
  servings: z.number().int().min(1).max(8).default(2),
  dishType: z.enum(["breakfast", "lunch", "snack", "dinner"]),
  diet: z.string().optional(),
  preferences: z.array(recipePreferenceSchema).max(3).default([]),
});

const recipePartSchema = z.object({
  title: z.string().min(1),
  ingredients: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.string().min(1),
    }),
  ).min(1),
  steps: z.array(z.string().min(1)).min(1).max(12),
});

export const recipeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  prepTime: z.string().min(1),
  servings: z.number().int().min(1).max(8),
  tags: z.array(z.string().min(1)).max(4),
  protein: recipePartSchema,
  base: z.array(recipePartSchema).optional(),
  assembly: z.array(z.string().min(1)).optional(),
  macros: z.object({
    calories: z.number().min(0),
    protein_g: z.number().min(0),
    carbs_g: z.number().min(0),
    fat_g: z.number().min(0),
  }).optional(),
});

export const generateRecipesResponseSchema = z.object({
  recipes: z.array(recipeSchema).min(1).max(3),
  unusedIngredients: z.array(z.string().min(1)).optional(),
});

export const mealPlanInputSchema = z.object({
  calories: z.number().int().min(1200).max(4500),
  meals: z.array(z.enum(["breakfast", "lunch", "snack", "dinner"])).min(1).max(4),
  goal: z.string().trim().min(2).max(80),
  days: z.number().int().min(1).max(14).optional().default(7),
  servings: z.number().int().min(1).max(10).optional().default(1),
  allergies: z.array(z.string().trim().min(1)).optional().default([]),
  preferences: z.array(z.string().trim().min(1)).optional().default([]),
  variationSeed: z.number().optional(),
  variety: z.enum(["normal", "baixa"]).optional().default("normal"),
});

const mealPlanBreakfastSchema = z.object({
  type: z.literal("breakfast"),
  title: z.string().min(1),
  description: z.string().min(1),
  calories: z.number().min(0),
});

const mealPlanLunchSchema = z.object({
  type: z.literal("lunch"),
  mainDish: z.string().min(1),
  sideDish: z.string().min(1),
  extra: z.string().optional(),
  calories: z.number().min(0),
});

const mealPlanSnackSchema = z.object({
  type: z.literal("snack"),
  title: z.string().min(1),
  description: z.string().min(1),
  calories: z.number().min(0),
});

const mealPlanDinnerSchema = z.object({
  type: z.literal("dinner"),
  title: z.string().min(1),
  description: z.string().min(1),
  calories: z.number().min(0),
});

const mealPlanMealSchema = z.discriminatedUnion("type", [
  mealPlanBreakfastSchema,
  mealPlanLunchSchema,
  mealPlanSnackSchema,
  mealPlanDinnerSchema,
]);

export const mealPlanResponseSchema = z.object({
  plan: z.array(
    z.object({
      day: z.string().min(1),
      meals: z.array(mealPlanMealSchema).min(1).max(6),
      totalCalories: z.number().min(0),
    }),
  ).min(1).max(14),
  shoppingList: z.array(
    z.object({
      category: z.string().min(1),
      items: z.array(
        z.object({
          name: z.string().min(1),
          quantity: z.string().min(1),
        }),
      ).min(1),
    }),
  ).min(1),
  prepPlan: z.array(
    z.object({
      day: z.string().min(1),
      tasks: z.array(z.string().min(1)).min(1),
    }),
  ).min(1),
  macroSummary: z.object({
    protein_g: z.number().min(0),
    carb_g: z.number().min(0),
    fat_g: z.number().min(0),
  }),
  estimatedCost: z.string().min(1),
});