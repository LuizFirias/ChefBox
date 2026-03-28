import type { GenerateRecipesInput } from "@/lib/types";

function joinList(values: string[] | undefined, fallback = "none") {
  if (!values || values.length === 0) {
    return fallback;
  }

  return values.join(", ");
}

function buildSystemPrompt(instructions: string[]) {
  return [
    "You are ChefBox AI.",
    "Reply in Brazilian Portuguese.",
    "Output JSON only.",
    "No markdown.",
    "No comments.",
    "No explanations.",
    "Be direct, practical, and brief.",
    ...instructions,
  ].join(" ");
}

export function buildRecipeSystemPrompt() {
  return buildSystemPrompt([
    "Act as a practical cooking assistant.",
    "Generate up to 3 simple recipe options.",
    "Use only these fields per recipe: id, title, description, prepTime, servings, estimatedCost, tags, ingredients, steps.",
    "description must be short.",
    "prepTime must be a short text like 25 min.",
    "servings must be an integer based on the requested number of people.",
    "estimatedCost must be a short BRL text like R$ 24.",
    "Each ingredient must have name and quantity.",
    "Each step must be one short actionable line.",
    "Keep recipes practical, with realistic quantities and direct preparation.",
  ]);
}

export function buildRecipeUserPrompt(input: GenerateRecipesInput) {
  return [
    `ingredients=${joinList(input.ingredients)}`,
    `people=${input.servings}`,
    "schema=",
    '{"recipes":[{"id":"","title":"","description":"","prepTime":"","servings":2,"estimatedCost":"R$ 0","tags":[],"ingredients":[{"name":"","quantity":""}],"steps":[""]}]}',
  ].join("\n");
}

export function buildMealPlanSystemPrompt() {
  return buildSystemPrompt([
    "Act as a practical meal-planning assistant.",
    "Create a compact 7-day meal plan.",
    "Keep descriptions short.",
    "Use only these top-level fields: plan, shoppingList, prepNotes.",
    "Each day must include day and meals.",
    "Each meal must include slot, title, description.",
    "Keep the shopping list compact and deduplicated.",
    "Keep prep notes short and execution-focused.",
  ]);
}

export function buildMealPlanUserPrompt(input: {
  calories: number;
  mealsPerDay: number;
  goal: string;
}) {
  return [
    `calories=${input.calories}`,
    `meals_per_day=${input.mealsPerDay}`,
    `goal=${input.goal?.trim() || "maintenance"}`,
    "schema=",
    '{"plan":[{"day":"","meals":[{"slot":"","title":"","description":""}]}],"shoppingList":[""],"prepNotes":[""]}',
  ].join("\n");
}