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
  incrementRecipeGeneration 
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

  // Pro é premium, Basic também é considerado premium para features básicas
  const isPremium = planInfo.planType === "pro" || planInfo.planType === "basic";

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
 * Retorna se o usuário pode gerar e incrementa o contador
 */
export async function consumeRecipeGeneration(
  request: NextRequest,
): Promise<UsageState> {
  const admin = createSupabaseAdminClient();
  const access = await getAccessContext(request);

  console.log("[usage] consumeRecipeGeneration START:", {
    userId: access.userId?.substring(0, 8),
    subjectKey: access.subjectKey.substring(0, 20),
  });

  if (!access.userId) {
    // Anônimo não pode gerar receitas
    return buildUsageState(0, 0, false, false);
  }

  // Verificar acesso à feature
  const accessCheck = await canAccessFeature(access.userId, "recipe_generation");
  
  if (!accessCheck.allowed) {
    const planInfo = await getUserPlanInfo(access.userId);
    const used = planInfo?.recipeGenerationsUsed || 0;
    const limit = planInfo?.recipeGenerationsLimit || 0;
    
    console.warn("[usage] Recipe generation blocked:", accessCheck.reason);
    
    return buildUsageState(
      used,
      limit,
      planInfo?.planType === "pro",
      true
    );
  }

  // Incrementar contador se não for Pro (Pro é ilimitado)
  const planInfo = await getUserPlanInfo(access.userId);
  
  if (!planInfo) {
    return buildUsageState(0, 0, false, false);
  }

  // Pro tem acesso ilimitado
  if (planInfo.planType === "pro") {
    return buildUsageState(0, Number.POSITIVE_INFINITY, true, true);
  }

  // Basic precisa incrementar
  if (planInfo.planType === "basic") {
    const success = await incrementRecipeGeneration(access.userId);
    
    if (!success) {
      return buildUsageState(60, 60, false, true);
    }

    return buildUsageState(
      planInfo.recipeGenerationsUsed + 1,
      60,
      false,
      true
    );
  }

  // Lifetime não tem acesso a geração por IA
  return buildUsageState(0, 0, false, true);
}

export async function hasPremiumAccess(request: NextRequest) {
  const access = await getAccessContext(request);

  return {
    isPremium: access.isPremium,
    persisted: access.persisted,
  };
}

/**
 * Verifica uso do meal planner
 * Pro: acesso ilimitado
 * Basic e Lifetime: bloqueado
 */
export async function getMealPlanUsage(
  request: NextRequest,
): Promise<UsageState & { canGenerate: boolean }> {
  const access = await getAccessContext(request);
  
  if (!access.userId) {
    return {
      ...buildUsageState(0, 0, false, false),
      canGenerate: false,
    };
  }

  const accessCheck = await canAccessFeature(access.userId, "planner");
  const planInfo = await getUserPlanInfo(access.userId);

  if (!accessCheck.allowed || !planInfo) {
    // Buscar quantos meal plans o usuário já gerou este mês (free: 1 por mês)
    const admin = createSupabaseAdminClient();
    const usageMonth = getMonthKey();
    const subjectKey = `${access.subjectKey}:meal_plan`;
    
    let usedCount = 0;
    if (admin) {
      const { data: existing } = await admin
        .from("usage_limits")
        .select("used_count")
        .eq("subject_key", subjectKey)
        .eq("usage_date", usageMonth)
        .maybeSingle();
      
      usedCount = existing?.used_count || 0;
    }
    
    return {
      ...buildUsageState(usedCount, 1, false, true),
      canGenerate: false,
    };
  }

  // Pro tem acesso ilimitado
  return {
    ...buildUsageState(0, Number.POSITIVE_INFINITY, true, true),
    canGenerate: true,
  };
}

/**
 * Consome uma geração de meal plan (apenas Pro)
 */
export async function consumeMealPlanGeneration(
  request: NextRequest,
): Promise<UsageState & { canGenerate: boolean }> {
  const admin = createSupabaseAdminClient();
  const access = await getAccessContext(request);

  // Premium users: unlimited
  if (access.isPremium) {
    return {
      ...buildUsageState(0, 999, true, access.persisted),
      canGenerate: true,
    };
  }

  const freeMonthlyLimit = 1;

  if (!admin) {
    return {
      ...buildUsageState(0, freeMonthlyLimit, false, false),
      canGenerate: false,
    };
  }

  const usageMonth = getMonthKey(); // YYYY-MM
  const subjectKey = `${access.subjectKey}:meal_plan`;

  const { data: existing, error } = await admin
    .from("usage_limits")
    .select("id, used_count")
    .eq("subject_key", subjectKey)
    .eq("usage_date", usageMonth)
    .maybeSingle();

  if (error) {
    return {
      ...buildUsageState(0, freeMonthlyLimit, false, true),
      canGenerate: false,
    };
  }

  // @ts-ignore
  const currentCount = existing?.used_count ?? 0;

  // Free users: block after 1 generation per month
  if (currentCount >= freeMonthlyLimit) {
    return {
      ...buildUsageState(currentCount, freeMonthlyLimit, false, true),
      canGenerate: false,
    };
  }

  // @ts-ignore
  if (existing?.id) {
    await admin
      .from("usage_limits")
      // @ts-ignore
      .update({ used_count: currentCount + 1, limit_count: freeMonthlyLimit })
      // @ts-ignore
      .eq("id", existing.id);

    return {
      ...buildUsageState(currentCount + 1, freeMonthlyLimit, false, true),
      canGenerate: currentCount + 1 < freeMonthlyLimit,
    };
  }

  // @ts-ignore
  await admin.from("usage_limits").insert({
    user_id: access.userId,
    subject_key: subjectKey,
    usage_date: usageMonth,
    used_count: 1,
    limit_count: freeMonthlyLimit,
  });

  return {
    ...buildUsageState(1, freeMonthlyLimit, false, true),
    canGenerate: false, // Used the only one allowed
  };
}