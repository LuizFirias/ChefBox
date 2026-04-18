/**
 * Plan Management
 * Gerencia assinaturas, resolução de planos duplos e integração com Yampi
 */

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { PLAN_LEVELS, type PlanType, type PlanPeriod, type Subscription } from "@/lib/types";
import { calculateEndDate, getRecipeLimit } from "@/lib/access-control";

/**
 * Resolve conflito de planos duplos
 * Mantém o plano de maior nível e cancela os menores
 * Chamada sempre que um novo pagamento é confirmado via webhook
 */
export async function resolveDoublePlan(userId: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    console.error("[plan] Admin client not available");
    return;
  }

  console.log(`[plan] Checking for double plans for user ${userId.substring(0, 8)}`);

  // Buscar todas as subscriptions ativas
  const { data: activeSubscriptions, error } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    console.error("[plan] Error fetching subscriptions:", error);
    return;
  }

  // Se só tem um plano ativo ou nenhum, sem conflito
  if (!activeSubscriptions || activeSubscriptions.length <= 1) {
    console.log("[plan] No double plan conflict found");
    return;
  }

  console.log(`[plan] Found ${activeSubscriptions.length} active plans, resolving...`);

  // Ordenar por nível (maior primeiro), depois por período se forem do mesmo nível
  const sorted = activeSubscriptions.sort((a: any, b: any) => {
    const levelA = PLAN_LEVELS[a.plan_type as PlanType];
    const levelB = PLAN_LEVELS[b.plan_type as PlanType];
    
    // Se níveis diferentes, manter o maior
    if (levelA !== levelB) {
      return levelB - levelA;
    }
    
    // Se mesmo nível, desempatar por período (anual > trimestral > mensal)
    const periodWeight: Record<string, number> = {
      annual: 3,
      quarterly: 2,
      monthly: 1,
      lifetime: 4,
    };
    
    return (periodWeight[b.plan_period] || 0) - (periodWeight[a.plan_period] || 0);
  });

  const planToKeep = sorted[0];
  const plansToCancel = sorted.slice(1);

  // @ts-ignore - plan_type and plan_period added in migration 006
  console.log(`[plan] Keeping plan: ${planToKeep.plan_type} (${planToKeep.plan_period})`);
  console.log(`[plan] Cancelling plans:`, plansToCancel.map((p: any) => `${p.plan_type} (${p.plan_period})`));

  // Cancelar os planos menores
  for (const sub of plansToCancel) {
    // @ts-ignore - yampi_subscription_id added in migration 006
    // Cancelar na Yampi se tiver yampi_subscription_id
    if (sub.yampi_subscription_id) {
      try {
        await cancelYampiSubscription(sub.yampi_subscription_id);
      } catch (error) {
        console.error("[plan] Error cancelling Yampi subscription:", error);
      }
    }

    // Marcar como cancelado no banco
    // @ts-ignore - cancelled_at added in migration 006
    await admin
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id);
  }

  // Atualizar campos de controle do usuário com base no plano mantido
  // @ts-ignore - fields added in migration 006
  await admin
    .from("users")
    .update({
      recipe_generations_limit: getRecipeLimit((planToKeep.plan_type || "basic") as PlanType),
      generation_cycle_start: planToKeep.start_date,
    })
    .eq("id", userId);

  console.log(`[plan] ✅ Double plan resolved for user ${userId.substring(0, 8)}`);
}

/**
 * Cancela uma assinatura na Yampi via API
 */
export async function cancelYampiSubscription(yampiSubscriptionId: string): Promise<void> {
  const apiToken = process.env.YAMPI_API_TOKEN;
  const apiUrl = process.env.YAMPI_API_URL || "https://api.yampi.io";

  if (!apiToken) {
    console.error("[yampi] YAMPI_API_TOKEN not configured");
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/v2/subscriptions/${yampiSubscriptionId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Yampi API error: ${response.status} ${response.statusText}`);
    }

    console.log(`[yampi] ✅ Subscription ${yampiSubscriptionId} cancelled`);
  } catch (error) {
    console.error("[yampi] Error cancelling subscription:", error);
    throw error;
  }
}

/**
 * Cria ou atualiza uma subscription no banco
 */
export async function upsertSubscription(params: {
  userId: string;
  yampiSubscriptionId?: string;
  planType: PlanType;
  planPeriod: PlanPeriod;
  price: number;
  yampiOrderId?: string;
}): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const endDate = calculateEndDate(params.planPeriod);
  const startDate = new Date();

  const subscriptionData = {
    user_id: params.userId,
    yampi_subscription_id: params.yampiSubscriptionId || params.yampiOrderId || null,
    plan_type: params.planType,
    plan_period: params.planPeriod,
    status: "active",
    start_date: startDate.toISOString(),
    end_date: endDate?.toISOString() || null,
    price: params.price,
    provider: "yampi",
    plan: params.planType, // legacy field
    updated_at: new Date().toISOString(),
  };

  // Inserir nova subscription
  const { data, error } = await admin
    .from("subscriptions")
    .insert(subscriptionData as any)
    .select()
    .single();

  if (error) {
    console.error("[plan] Error creating subscription:", error);
    return null;
  }

  // Atualizar limite de gerações do usuário
  // @ts-ignore - fields added in migration 006
  await admin
    .from("users")
    .update({
      recipe_generations_limit: getRecipeLimit(params.planType),
      recipe_generations_used: 0, // reset ao criar novo plano
      generation_cycle_start: startDate.toISOString(),
    })
    .eq("id", params.userId);

  console.log(`[plan] ✅ Subscription created: ${params.planType} (${params.planPeriod})`);

  return (data as any)?.id || null;
}

/**
 * Recalcula o plano ativo do usuário após mudanças
 */
export async function recalculateUserActivePlan(userId: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) return;

  const { data: activeSubscriptions } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!activeSubscriptions || activeSubscriptions.length === 0) {
    // Sem planos ativos - resetar limites
    // @ts-ignore - fields added in migration 006
    await admin
      .from("users")
      .update({
        recipe_generations_limit: 0,
        recipe_generations_used: 0,
      })
      .eq("id", userId);

    console.log(`[plan] User ${userId.substring(0, 8)} has no active plans`);
    return;
  }

  // Pegar o plano de maior nível válido
  const validPlans = activeSubscriptions.filter((sub: any) => {
    const endDate = sub.end_date ? new Date(sub.end_date) : null;
    return !endDate || endDate > new Date();
  });

  if (validPlans.length === 0) {
    // Todos expiraram
    // @ts-ignore - status type will be updated
    await admin
      .from("subscriptions")
      .update({ status: "expired" })
      .eq("user_id", userId)
      .eq("status", "active");

    // @ts-ignore - fields added in migration 006
    await admin
      .from("users")
      .update({
        recipe_generations_limit: 0,
        recipe_generations_used: 0,
      })
      .eq("id", userId);

    return;
  }

  const bestPlan = validPlans.sort((a: any, b: any) => {
    return PLAN_LEVELS[b.plan_type as PlanType] - PLAN_LEVELS[a.plan_type as PlanType];
  })[0];

  // @ts-ignore - fields added in migration 006
  await admin
    .from("users")
    .update({
      recipe_generations_limit: getRecipeLimit((bestPlan.plan_type || "basic") as PlanType),
    })
    .eq("id", userId);

  // @ts-ignore - plan_type added in migration 006
  console.log(`[plan] Recalculated active plan for user ${userId.substring(0, 8)}: ${bestPlan.plan_type}`);
}

/**
 * Busca ou cria usuário pelo email
 */
export async function findOrCreateUser(email: string, name: string, yampiCustomerId?: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  // Primeiro tenta buscar por email na tabela auth.users
  const { data: authUsers } = await admin.auth.admin.listUsers();
  const existingAuthUser = authUsers.users.find(u => u.email === email);

  if (existingAuthUser) {
    // Atualizar yampi_customer_id se necessário
    if (yampiCustomerId) {
      // @ts-ignore - yampi_customer_id added in migration 006
      await admin
        .from("users")
        .update({ yampi_customer_id: yampiCustomerId })
        .eq("id", existingAuthUser.id);
    }
    return existingAuthUser.id;
  }

  // Criar novo usuário
  const { data: newUser, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: name,
    },
  });

  if (error || !newUser.user) {
    console.error("[plan] Error creating user:", error);
    return null;
  }

  // O trigger handle_new_user() vai criar o registro em public.users
  // Mas vamos atualizar o yampi_customer_id
  if (yampiCustomerId) {
    // @ts-ignore - yampi_customer_id added in migration 006
    await admin
      .from("users")
      .update({ yampi_customer_id: yampiCustomerId })
      .eq("id", newUser.user.id);
  }

  console.log(`[plan] ✅ User created: ${email}`);
  return newUser.user.id;
}

