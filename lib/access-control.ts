/**
 * Access Control & Plan Management
 * Implementa controle de acesso granular baseado em hierarquia de planos
 */

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Feature, PlanType } from "@/lib/types";

// ─── Limites por plano ────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  recipe_generation: { free: 5,   lifetime: 10, basic: 60,  pro: 150 },
  macro_text:        { free: 5,   lifetime: 10, basic: 30,  pro: 60  },
  planner:           { free: 0,   lifetime: 1,  basic: 6,   pro: 10  },
  photo_analysis:    { free: 0,   lifetime: 2,  basic: 15,  pro: 40  },
  saved_recipes:     { free: 5,   lifetime: Infinity, basic: Infinity, pro: Infinity },
} as const;

export function getPlanLimit(feature: keyof typeof PLAN_LIMITS, planType: PlanType | null): number {
  const limits = PLAN_LIMITS[feature];
  if (!planType || planType === "test") return limits.free;
  if (planType === "lifetime") return limits.lifetime;
  if (planType === "basic") return limits.basic;
  if (planType === "pro") return limits.pro;
  return limits.free;
}

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
  savedRecipesCount?: number;
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
    return { allowed: false, reason: "Usuário não encontrado" };
  }

  const { planType, planStatus } = planInfo;
  const isActive = planType && planStatus === "active";

  switch (feature) {
    case "fixed_recipes":
    case "basic_macros":
    case "smart_market":
      return { allowed: true };

    case "saved_recipes":
      if (isActive) return { allowed: true };
      return { allowed: true }; // free pode salvar (limite checado no frontend)

    case "recipe_generation": {
      const limit = getPlanLimit("recipe_generation", planType);
      if (limit === 0) return { allowed: false, reason: "Plano não inclui geração de receitas por IA" };
      const used = planInfo.recipeGenerationsUsed || 0;
      if (used >= limit) {
        return { allowed: false, reason: `Limite de ${limit} receitas/mês atingido. Faça upgrade para continuar.` };
      }
      return { allowed: true };
    }

    case "macro_text": {
      const limit = getPlanLimit("macro_text", planType);
      if (limit === 0) return { allowed: false, reason: "Plano não inclui cálculo de macros por texto" };
      return { allowed: true };
    }

    case "photo_analysis": {
      const limit = getPlanLimit("photo_analysis", planType);
      if (limit === 0) return { allowed: false, reason: "Análise de foto por IA está disponível a partir do Plano Vitalício." };
      if (!isActive) return { allowed: false, reason: "Análise de foto por IA está disponível a partir do Plano Vitalício." };
      return { allowed: true };
    }

    case "planner": {
      const limit = getPlanLimit("planner", planType);
      if (limit === 0 || !isActive) return { allowed: false, reason: "Planejador semanal não está disponível no plano gratuito." };
      return { allowed: true };
    }

    case "detailed_macros":
    case "recipe_history":
      if (planType === "pro" && isActive) return { allowed: true };
      return {
        allowed: false,
        reason: "Recurso disponível apenas no Plano Pro",
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
      recipeGenerationsLimit: PLAN_LIMITS.recipe_generation.free,
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
      recipeGenerationsLimit: PLAN_LIMITS.recipe_generation.free,
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
    recipeGenerationsLimit: getPlanLimit("recipe_generation", (activeSub as any).plan_type),
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
  if (!planInfo) return false;

  const limit = getPlanLimit("recipe_generation", planInfo.planType);
  if (limit === 0) return false;
  if (planInfo.recipeGenerationsUsed >= limit) return false;

  const admin = createSupabaseAdminClient();
  if (!admin) return false;

  // @ts-ignore - fields added in migration 006
  await admin
    .from("users")
    .update({ recipe_generations_used: planInfo.recipeGenerationsUsed + 1 } as any)
    .eq("id", userId);

  return true;
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
