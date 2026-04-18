import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { Recipe } from "@/lib/types";

type Tables = Database["public"]["Tables"];

/**
 * Save generated recipes to user's history
 */
export async function saveGeneratedRecipesToHistory(
  supabase: SupabaseClient<Database>,
  userId: string,
  recipes: Recipe[]
): Promise<{ success: boolean; error?: string }> {
  const records = recipes.map((recipe) => ({
    user_id: userId,
    recipe_id: recipe.id,
    title: recipe.title,
    payload: recipe as unknown as Record<string, unknown>,
  }));

  // @ts-ignore - Table not in generated types yet (run: npx supabase gen types typescript)
  const { error } = await (supabase as any)
    .from("generated_recipes")
    .insert(records as any);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get user's recently generated recipes
 */
export async function getRecentGeneratedRecipes(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 10
): Promise<{ recipes: Recipe[]; error?: string }> {
  // @ts-ignore - Table not in generated types yet (run: npx supabase gen types typescript)
  const { data, error } = await (supabase as any)
    .from("generated_recipes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { recipes: [], error: error.message };
  }

  // @ts-ignore - Table not in generated types yet
  const recipes = (data as any[]).map((item) => item.payload as unknown as Recipe).filter(Boolean);

  return { recipes };
}

/**
 * Save a generated recipe to the database
 */
export async function saveRecipeToDatabase(
  supabase: SupabaseClient<Database>,
  recipe: Recipe
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { data, error } = await supabase
    .from("recipes")
    // @ts-ignore - TypeScript inference limitation with Supabase generics (resolves after migration)
    .insert({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      prep_time: recipe.prepTime,
      servings: recipe.servings,
      tags: recipe.tags,
      ingredients: recipe.protein.ingredients,
      steps: recipe.protein.steps,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // @ts-ignore
  return { success: true, id: data?.id };
}

/**
 * Save a recipe to user's saved collection
 */
export async function saveRecipeForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  recipeId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  // @ts-ignore - TypeScript inference limitation with Supabase generics (resolves after migration)
  const { error } = await supabase.from("user_recipes").insert({
    user_id: userId,
    recipe_id: recipeId,
    notes,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Remove a recipe from user's saved collection
 */
export async function unsaveRecipeForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  recipeId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("user_recipes")
    .delete()
    .match({ user_id: userId, recipe_id: recipeId });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get user's saved recipes
 */
export async function getUserSavedRecipes(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ recipes: Tables["recipes"]["Row"][]; error?: string }> {
  const { data, error } = await supabase
    .from("user_recipes")
    .select("recipes(*)")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error) {
    return { recipes: [], error: error.message };
  }

  const recipes = data
    .map((item) => (item as unknown as { recipes: Tables["recipes"]["Row"] }).recipes)
    .filter(Boolean);

  return { recipes };
}

/**
 * Create a shopping list
 */
export async function createShoppingList(
  supabase: SupabaseClient<Database>,
  userId: string,
  title: string,
  items: Tables["shopping_lists"]["Row"]["items"] = []
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { data, error } = await supabase
    .from("shopping_lists")
    // @ts-ignore - TypeScript inference limitation with Supabase generics (resolves after migration)
    .insert({
      user_id: userId,
      title,
      items,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // @ts-ignore
  return { success: true, id: data?.id };
}

/**
 * Get user's shopping lists
 */
export async function getUserShoppingLists(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ lists: Tables["shopping_lists"]["Row"][]; error?: string }> {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { lists: [], error: error.message };
  }

  return { lists: data };
}

/**
 * Update shopping list items
 */
export async function updateShoppingList(
  supabase: SupabaseClient<Database>,
  userId: string,
  listId: string,
  updates: Tables["shopping_lists"]["Update"]
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("shopping_lists")
    // @ts-ignore - TypeScript inference limitation with Supabase generics (resolves after migration)
    .update(updates as any)
    .eq("id", listId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Log AI generation for analytics and rate limiting
 */
export async function logGeneration(
  supabase: SupabaseClient<Database>,
  type: "recipe" | "meal_plan",
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  source: "ai" | "fallback",
  userId?: string,
  ipAddress?: string
): Promise<void> {
  // @ts-ignore - TypeScript inference limitation with Supabase generics (resolves after migration)
  await (supabase as any).from("generation_history").insert({
    user_id: userId,
    ip_address: ipAddress,
    generation_type: type,
    input_data: input,
    output_data: output,
    source,
  });
}

/**
 * Save a meal plan to user's saved collection
 */
export async function saveMealPlan(
  supabase: SupabaseClient<Database>,
  userId: string,
  name: string,
  payload: Record<string, unknown>,
  settings: Record<string, unknown>
): Promise<{ success: boolean; id?: string; error?: string }> {
  console.log("[db.saveMealPlan] Attempting to save:", { userId, name });
  
  try {
    // @ts-ignore - Table exists but not in generated types yet
    const { data, error } = await supabase
      .from("saved_meal_plans")
      .insert({
        user_id: userId,
        name,
        payload,
        settings,
      } as any)
      .select("id")
      .single();

    if (error) {
      console.error("[db.saveMealPlan] Database error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return { success: false, error: error.message };
    }

    // @ts-ignore - Type assertion needed for dynamic table
    console.log("[db.saveMealPlan] Save successful, id:", data?.id);
    // @ts-ignore - Type assertion needed for dynamic table
    return { success: true, id: data?.id as string };
  } catch (err) {
    console.error("[db.saveMealPlan] Unexpected error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Get user's saved meal plans
 */
export async function getUserSavedMealPlans(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ plans: Array<{ id: string; name: string; payload: any; settings: any; created_at: string }>; error?: string }> {
  // @ts-ignore - Table exists but not in generated types yet
  const { data, error } = await supabase
    .from("saved_meal_plans")
    .select("id, name, payload, settings, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { plans: [], error: error.message };
  }

  return { plans: data || [] };
}

/**
 * Delete a saved meal plan
 */
export async function deleteSavedMealPlan(
  supabase: SupabaseClient<Database>,
  userId: string,
  planId: string
): Promise<{ success: boolean; error?: string }> {
  // @ts-ignore - Table exists but not in generated types yet
  const { error } = await supabase
    .from("saved_meal_plans")
    .delete()
    .eq("id", planId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Update a saved meal plan name
 */
export async function updateSavedMealPlan(
  supabase: SupabaseClient<Database>,
  userId: string,
  planId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  // @ts-ignore - Table exists but not in generated types yet
  const { error } = await supabase
    .from("saved_meal_plans")
    // @ts-ignore - Type assertion for update payload
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", planId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}


/**
 * Get user's generation count for rate limiting
 */
export async function getUserGenerationCount(
  supabase: SupabaseClient<Database>,
  userId: string,
  type: "recipe" | "meal_plan",
  since: Date
): Promise<number> {
  const { count } = await supabase
    .from("generation_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("generation_type", type)
    .gte("created_at", since.toISOString());

  return count || 0;
}

/**
 * Delete a shopping list (with ownership validation)
 */
export async function deleteShoppingList(
  supabase: SupabaseClient<Database>,
  userId: string,
  listId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get a specific shopping list (with ownership validation)
 */
export async function getShoppingList(
  supabase: SupabaseClient<Database>,
  userId: string,
  listId: string
): Promise<{ list: Tables["shopping_lists"]["Row"] | null; error?: string }> {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("id", listId)
    .eq("user_id", userId)
    .single();

  if (error) {
    return { list: null, error: error.message };
  }

  return { list: data };
}
