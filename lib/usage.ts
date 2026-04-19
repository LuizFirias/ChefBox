import { createHash } from "node:crypto";

import type { NextRequest } from "next/server";

import { FREE_DAILY_LIMIT, PREMIUM_DAILY_LIMIT } from "@/lib/config";
import type { UsageState } from "@/lib/types";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { 
  canAccessFeature, 
  getUserPlanInfo, 
  incrementRecipeGeneration,
  getPlanLimit,
  PLAN_LIMITS,
} from "@/lib/access-control";

type AccessContext = {
  isPremium: boolean;
  persisted: boolean;
  subjectKey: string;
  userId: string | null;
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthKey() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function hashIpAddress(ipAddress: string) {
  return createHash("sha256").update(ipAddress).digest("hex").slice(0, 20);
}

async function getActor(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const userResult = await supabase?.auth.getUser();
  const userId = userResult?.data.user?.id ?? null;
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? "local";

  return {
    userId,
    subjectKey: userId ? `user:${userId}` : `anon:${hashIpAddress(ipAddress)}`,
  };
}

/**
 * Verifica status premium do usuário usando a nova lógica de hierarquia de planos
 */
async function getPremiumStatus(userId: string | null) {
  if (!userId) {
    return { isPremium: false, persisted: false };
  }

  const planInfo = await getUserPlanInfo(userId);
  
  if (!planInfo) {
    return { isPremium: false, persisted: true };
  }

  // Pro é premium, Basic e Test também são considerados premium para features básicas
  const isPremium = planInfo.planType === "pro" || planInfo.planType === "basic" || planInfo.planType === "test";

  return {
    isPremium: isPremium && planInfo.planStatus === "active",
    persisted: true,
  };
}

async function getAccessContext(request: NextRequest): Promise<AccessContext> {
  const actor = await getActor(request);
  const premium = await getPremiumStatus(actor.userId);

  return {
    ...actor,
    isPremium: premium.isPremium,
    persisted: premium.persisted,
  };
}

function buildUsageState(
  used: number,
  limit: number,
  isPremium: boolean,
  persisted: boolean,
): UsageState {
  return {
    used,
    limit,
    remaining: Math.max(limit - used, 0),
    isPremium,
    upgradeRequired: !isPremium && used >= limit,
    persisted,
  };
}

/**
 * Consome uma geração de receita verificando o limite baseado no plano
 */
export async function consumeRecipeGeneration(
  request: NextRequest,
): Promise<UsageState> {
  const access = await getAccessContext(request);

  if (!access.userId) {
    return buildUsageState(0, 0, false, false);
  }

  const accessCheck = await canAccessFeature(access.userId, "recipe_generation");
  const planInfo = await getUserPlanInfo(access.userId);
  const limit = planInfo?.recipeGenerationsLimit || PLAN_LIMITS.recipe_generation.free;

  if (!accessCheck.allowed) {
    const used = planInfo?.recipeGenerationsUsed || 0;
    console.warn("[usage] Recipe generation blocked:", accessCheck.reason);
    return buildUsageState(used, limit, planInfo?.planType === "pro", true);
  }

  if (!planInfo) return buildUsageState(0, 0, false, false);

  const success = await incrementRecipeGeneration(access.userId);
  if (!success) {
    return buildUsageState(planInfo.recipeGenerationsUsed, limit, planInfo.planType === "pro", true);
  }

  return buildUsageState(
    planInfo.recipeGenerationsUsed + 1,
    limit,
    planInfo.planType === "pro",
    true,
  );
}

export async function hasPremiumAccess(request: NextRequest) {
  const access = await getAccessContext(request);

  return {
    isPremium: access.isPremium,
    persisted: access.persisted,
  };
}

/**
 * Consome uma utilização mensal de uma feature rastreada via usage_limits.
 * Retorna { allowed, used, limit } após tentar incrementar.
 */
async function consumeMonthlyFeature(
  userId: string,
  subjectKey: string,
  featureKey: string,
  limit: number,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (limit === 0) return { allowed: false, used: 0, limit: 0 };

  const admin = createSupabaseAdminClient();
  if (!admin) return { allowed: false, used: 0, limit };

  const usageMonth = getMonthKey();
  const key = `${subjectKey}:${featureKey}`;

  const { data: existing } = await admin
    .from("usage_limits")
    .select("id, used_count")
    .eq("subject_key", key)
    .eq("usage_date", usageMonth)
    .maybeSingle();

  // @ts-ignore
  const currentCount = existing?.used_count ?? 0;

  if (currentCount >= limit) {
    return { allowed: false, used: currentCount, limit };
  }

  // @ts-ignore
  if (existing?.id) {
    await admin
      .from("usage_limits")
      // @ts-ignore
      .update({ used_count: currentCount + 1, limit_count: limit })
      // @ts-ignore
      .eq("id", existing.id);
  } else {
    // @ts-ignore
    await admin.from("usage_limits").insert({
      user_id: userId,
      subject_key: key,
      usage_date: usageMonth,
      used_count: 1,
      limit_count: limit,
    });
  }

  return { allowed: true, used: currentCount + 1, limit };
}

/**
 * Verifica uso do meal planner (sem consumir)
 */
export async function getMealPlanUsage(
  request: NextRequest,
): Promise<UsageState & { canGenerate: boolean }> {
  const access = await getAccessContext(request);

  if (!access.userId) {
    return { ...buildUsageState(0, 0, false, false), canGenerate: false };
  }

  const planInfo = await getUserPlanInfo(access.userId);
  const planType = planInfo?.planType ?? null;
  const limit = getPlanLimit("planner", planType);
  const accessCheck = await canAccessFeature(access.userId, "planner");

  if (!accessCheck.allowed) {
    return { ...buildUsageState(0, limit, false, true), canGenerate: false };
  }

  const admin = createSupabaseAdminClient();
  const usageMonth = getMonthKey();
  const key = `${access.subjectKey}:meal_plan`;
  let usedCount = 0;
  if (admin) {
    const { data: existing } = await admin
      .from("usage_limits")
      .select("used_count")
      .eq("subject_key", key)
      .eq("usage_date", usageMonth)
      .maybeSingle();
    usedCount = (existing as any)?.used_count || 0;
  }

  const isPro = planType === "pro";
  return {
    ...buildUsageState(usedCount, limit, isPro, true),
    canGenerate: usedCount < limit,
  };
}

/**
 * Consome uma geração de meal plan com limites por plano.
 * free: 0, lifetime: 1/mês, basic: 6/mês, pro: 10/mês
 */
export async function consumeMealPlanGeneration(
  request: NextRequest,
): Promise<UsageState & { canGenerate: boolean }> {
  const access = await getAccessContext(request);

  if (!access.userId) {
    return { ...buildUsageState(0, 0, false, false), canGenerate: false };
  }

  const planInfo = await getUserPlanInfo(access.userId);
  const planType = planInfo?.planType ?? null;
  const limit = getPlanLimit("planner", planType);

  const accessCheck = await canAccessFeature(access.userId, "planner");
  if (!accessCheck.allowed) {
    return { ...buildUsageState(0, limit, false, true), canGenerate: false };
  }

  const result = await consumeMonthlyFeature(
    access.userId,
    access.subjectKey,
    "meal_plan",
    limit,
  );

  const isPro = planType === "pro";
  return {
    ...buildUsageState(result.used, result.limit, isPro, true),
    canGenerate: result.allowed,
  };
}

/**
 * Consome um cálculo de macros por texto.
 * free: 5/mês, lifetime: 10/mês, basic: 30/mês, pro: 60/mês
 */
export async function consumeMacroText(
  request: NextRequest,
): Promise<UsageState & { canGenerate: boolean }> {
  const access = await getAccessContext(request);

  if (!access.userId) {
    return { ...buildUsageState(0, 0, false, false), canGenerate: false };
  }

  const planInfo = await getUserPlanInfo(access.userId);
  const limit = getPlanLimit("macro_text", planInfo?.planType ?? null);

  const result = await consumeMonthlyFeature(
    access.userId,
    access.subjectKey,
    "macro_text",
    limit,
  );

  const isPro = planInfo?.planType === "pro";
  return {
    ...buildUsageState(result.used, result.limit, isPro, true),
    canGenerate: result.allowed,
  };
}

/**
 * Consome uma análise de foto por IA.
 * free: 0, lifetime: 2/mês, basic: 15/mês, pro: 40/mês
 */
export async function consumePhotoAnalysis(
  request: NextRequest,
): Promise<UsageState & { canGenerate: boolean }> {
  const access = await getAccessContext(request);

  if (!access.userId) {
    return { ...buildUsageState(0, 0, false, false), canGenerate: false };
  }

  const planInfo = await getUserPlanInfo(access.userId);
  const planType = planInfo?.planType ?? null;

  const accessCheck = await canAccessFeature(access.userId, "photo_analysis");
  if (!accessCheck.allowed) {
    return {
      ...buildUsageState(0, 0, false, true),
      canGenerate: false,
    };
  }

  const limit = getPlanLimit("photo_analysis", planType);
  const result = await consumeMonthlyFeature(
    access.userId,
    access.subjectKey,
    "photo_analysis",
    limit,
  );

  const isPro = planType === "pro";
  return {
    ...buildUsageState(result.used, result.limit, isPro, true),
    canGenerate: result.allowed,
  };
}