/**
 * TYPE-SAFE HELPERS FOR DATABASE OPERATIONS
 * 
 * Estes helpers fornecem type-safety para operações em tabelas que foram
 * modificadas pela migration 006 mas cujos tipos ainda não foram regenerados.
 * 
 * IMPORTANTE: Após rodar a migration 006, regenere os tipos do Supabase:
 * npx supabase gen types typescript --local > lib/supabase/database.types.ts
 * 
 * Depois disso, você pode remover este arquivo e substituir as chamadas
 * por operações normais do Supabase.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Helper para update de users com campos da migration 006
 */
export async function updateUserFields(
  supabase: SupabaseClient<any>,
  userId: string,
  fields: {
    recipe_generations_used?: number;
    recipe_generations_limit?: number;
    generation_cycle_start?: string;
    yampi_customer_id?: string;
  }
) {
  // @ts-ignore - fields added in migration 006
  return supabase.from("users").update(fields).eq("id", userId);
}

/**
 * Helper para update de subscriptions com campos da migration 006
 */
export async function updateSubscriptionFields(
  supabase: SupabaseClient<any>,
  subscriptionId: string,
  fields: {
    status?: string;
    cancelled_at?: string;
    updated_at?: string;
  }
) {
  // @ts-ignore - fields added in migration 006
  return supabase.from("subscriptions").update(fields).eq("id", subscriptionId);
}

/**
 * Helper para update de yampi_transactions
 */
export async function updateYampiTransaction(
  supabase: SupabaseClient<any>,
  orderId: string,
  fields: {
    status?: string;
    updated_at?: string;
  }
) {
  // @ts-ignore - yampi_transactions table
  return supabase.from("yampi_transactions").update(fields).eq("yampi_order_id", orderId);
}
