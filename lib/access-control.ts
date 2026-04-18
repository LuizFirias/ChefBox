/**
 * Access Control & Plan Management
 * Implementa controle de acesso granular baseado em hierarquia de planos
 */

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Feature, PlanType } from "@/lib/types";

/**
 * Dados completos do plano ativo do usuário
 */
export type UserPlanInfo = {
  userId: string;
  planType: PlanType | null;
  planPeriod: string | null;
  planStatus: "active" | "expired" | "none";
  planEndDate: Date | null;
  recipeGenerationsUsed: number;
  recipeGenerationsLimit: number;
  generationCycleStart: Date | null;
};

/**
 * Verifica se o usuário tem acesso a uma funcionalidade específica
 */
export async function canAccessFeature(
  userId: string,
  feature: Feature
): Promise<{ allowed: boolean; reason?: string }> {
  const planInfo = await getUserPlanInfo(userId);
  
  if (!planInfo) {
    return { allowed: false, reason: "Usu\u00e1rio n\u00e3o encontrado" };
  }

  const { planType, planStatus } = planInfo;

  // Sem plano ativo ou plano expirado
  if (!planType || planStatus !== "active") {
    return { allowed: false, reason: "Nenhum plano ativo" };
  }

  switch (feature) {
    case "fixed_recipes":
    case "basic_macros":
      return { allowed: true };

    case "saved_recipes":
      return { allowed: true };

    case "recipe_generation":
      if (planType === "lifetime") {
        return { allowed: false, reason: "Plano Lifetime n\u00e3o inclui gera\u00e7\u00e3o com IA" };
      }
      if (planType === "basic" || planType === "test") {
        if (planInfo.recipeGenerationsUsed >= 60) {
          return { allowed: false, reason: "Limite de 60 receitas/m\u00eas atingido" };
        }
        return { allowed: true };
      }
      if (planType === "pro") {
        return { allowed: true };
      }
      return { allowed: false };

    case "planner":
    case "smart_market":
    case "detailed_macros":
    case "recipe_history":
      if (planType === "pro") {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        reason: planType === "lifetime" 
          ? "Recurso dispon\u00edvel apenas no Plano Pro" 
          : "Fa\u00e7a upgrade para o Plano Pro" 
      };

    default:
      return { allowed: false, reason: "Funcionalidade desconhecida" };
  }
}

/**
 * Obtém informações completas do plano ativo do usuário
 */
export async function getUserPlanInfo(userId: string): Promise<UserPlanInfo | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  // @ts-ignore - fields added in migration 006
  const { data: userData, error: userError } = await admin
    .from("users")
    .select("recipe_generations_used, recipe_generations_limit, generation_cycle_start")
    .eq("id", userId)
    .single();

  if (userError || !userData) {
    console.error("[access] Error fetching user data:", userError);
    return null;
  }

  // @ts-ignore - fields added in migration 006
  const { data: subscriptions, error: subError } = await admin
    .from("subscriptions")
    .select("plan_type, plan_period, status, end_date")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("plan_type", { ascending: false });

  if (subError) {
    console.error("[access] Error fetching subscriptions:", subError);
    return null;
  }

  if (!subscriptions || subscriptions.length === 0) {
    return {
      userId,
      planType: null,
      planPeriod: null,
      planStatus: "none",
      planEndDate: null,
      recipeGenerationsUsed: (userData as any).recipe_generations_used || 0,
      recipeGenerationsLimit: 0,
      generationCycleStart: null,
    };
  }

  const activeSub = subscriptions.find((sub: any) => {
    const endDate = sub.end_date ? new Date(sub.end_date) : null;
    return !endDate || endDate > new Date();
  });

  if (!activeSub) {
    return {
      userId,
      planType: null,
      planPeriod: null,
      planStatus: "expired",
      planEndDate: null,
      recipeGenerationsUsed: (userData as any).recipe_generations_used || 0,
      recipeGenerationsLimit: 0,
      generationCycleStart: null,
    };
  }

  const endDate = (activeSub as any).end_date ? new Date((activeSub as any).end_date) : null;
  const isExpired = endDate && endDate < new Date();

  return {
    userId,
    planType: (activeSub as any).plan_type,
    planPeriod: (activeSub as any).plan_period,
    planStatus: isExpired ? "expired" : "active",
    planEndDate: endDate,
    recipeGenerationsUsed: (userData as any).recipe_generations_used || 0,
    recipeGenerationsLimit: (userData as any).recipe_generations_limit || 0,
    generationCycleStart: (userData as any).generation_cycle_start 
      ? new Date((userData as any).generation_cycle_start) 
      : null,
  };
}

/**
 * Incrementa o contador de gerações de receitas
 */
export async function incrementRecipeGeneration(userId: string): Promise<boolean> {
  const planInfo = await getUserPlanInfo(userId);
  
  if (!planInfo || planInfo.planType === "lifetime") {
    return false;
  }

  if (planInfo.planType === "pro") {
    return true;
  }

  if (planInfo.planType === "basic" || planInfo.planType === "test") {
    if (planInfo.recipeGenerationsUsed >= 60) {
      return false;
    }

    const admin = createSupabaseAdminClient();
    if (!admin) return false;

    // @ts-ignore - fields added in migration 006
    await admin
      .from("users")
      .update({
        recipe_generations_used: planInfo.recipeGenerationsUsed + 1,
      } as any)
      .eq("id", userId);

    return true;
  }

  return false;
}

/**
 * Reseta o contador mensal de gerações
 */
export async function resetMonthlyGenerations(userId: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) return;

  // @ts-ignore - fields added in migration 006
  await admin
    .from("users")
    .update({
      recipe_generations_used: 0,
      generation_cycle_start: new Date().toISOString(),
    } as any)
    .eq("id", userId);

  console.log(`[access] Reset monthly generations for user ${userId}`);
}

/**
 * Calcula data de expiração baseada no período
 */
export function calculateEndDate(period: string, from: Date = new Date()): Date | null {
  const date = new Date(from);
  
  switch (period) {
    case "monthly":
      date.setDate(date.getDate() + 30);
      return date;
    case "quarterly":
      date.setDate(date.getDate() + 90);
      return date;
    case "annual":
      date.setDate(date.getDate() + 365);
      return date;
    case "lifetime":
      return null;
    default:
      return null;
  }
}

/**
 * Obtém o limite de receitas para um plano
 */
export function getRecipeLimit(planType: PlanType): number {
  switch (planType) {
    case "pro":
      return Number.POSITIVE_INFINITY;
    case "basic":
      return 60;
    case "lifetime":
      return 0;
    default:
      return 0;
  }
}
