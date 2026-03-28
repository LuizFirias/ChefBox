import { z } from "zod";

export const recipePreferenceSchema = z.enum([
  "faster",
  "healthier",
  "high-protein",
]);

export const generateRecipesInputSchema = z.object({
  ingredients: z.array(z.string().trim().min(1)).min(2).max(16),
  servings: z.number().int().min(1).max(8).default(2),
  preferences: z.array(recipePreferenceSchema).max(3).default([]),
});

export const recipeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  prepTime: z.string().min(1),
  servings: z.number().int().min(1).max(8),
  estimatedCost: z.string().min(1),
  tags: z.array(z.string().min(1)).max(4),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.string().min(1),
      }),
    )
    .min(3),
  steps: z.array(z.string().min(1)).min(3).max(8),
});

export const generateRecipesResponseSchema = z.object({
  recipes: z.array(recipeSchema).min(2).max(4),
});

export const mealPlanInputSchema = z.object({
  calories: z.number().int().min(1200).max(4500),
  mealsPerDay: z.number().int().min(2).max(6),
  goal: z.string().trim().min(2).max(80),
});

export const mealPlanResponseSchema = z.object({
  plan: z.array(
    z.object({
      day: z.string().min(1),
      meals: z.array(
        z.object({
          slot: z.string().min(1),
          title: z.string().min(1),
          description: z.string().min(1),
        }),
      ),
    }),
  ),
  shoppingList: z.array(z.string().min(1)),
  prepNotes: z.array(z.string().min(1)),
});