import { createHash } from "node:crypto";

import type { NextRequest } from "next/server";

import { FREE_DAILY_LIMIT, PREMIUM_DAILY_LIMIT } from "@/lib/config";
import type { UsageState } from "@/lib/types";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

type AccessContext = {
  isPremium: boolean;
  persisted: boolean;
  subjectKey: string;
  userId: string | null;
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
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

async function getPremiumStatus(userId: string | null) {
  const admin = createSupabaseAdminClient();

  if (!admin || !userId) {
    return { isPremium: false, persisted: Boolean(admin) };
  }

  const { data, error } = await admin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { isPremium: false, persisted: true };
  }

  const currentPeriodEnd = data?.current_period_end
    ? new Date(data.current_period_end)
    : null;

  return {
    isPremium: Boolean(data && currentPeriodEnd && currentPeriodEnd > new Date()),
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

export async function consumeRecipeGeneration(
  request: NextRequest,
): Promise<UsageState> {
  const admin = createSupabaseAdminClient();
  const access = await getAccessContext(request);
  const limit = access.isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;

  if (!admin) {
    return buildUsageState(0, limit, access.isPremium, false);
  }

  const usageDate = getTodayKey();
  const { data: existing, error } = await admin
    .from("usage_limits")
    .select("id, used_count")
    .eq("subject_key", access.subjectKey)
    .eq("usage_date", usageDate)
    .maybeSingle();

  if (error) {
    return buildUsageState(0, limit, access.isPremium, true);
  }

  const currentCount = existing?.used_count ?? 0;

  if (!access.isPremium && currentCount >= limit) {
    return buildUsageState(currentCount, limit, false, true);
  }

  if (existing?.id) {
    await admin
      .from("usage_limits")
      .update({ used_count: currentCount + 1, limit_count: limit })
      .eq("id", existing.id);

    return buildUsageState(currentCount + 1, limit, access.isPremium, true);
  }

  await admin.from("usage_limits").insert({
    user_id: access.userId,
    subject_key: access.subjectKey,
    usage_date: usageDate,
    used_count: 1,
    limit_count: limit,
  });

  return buildUsageState(1, limit, access.isPremium, true);
}

export async function hasPremiumAccess(request: NextRequest) {
  const access = await getAccessContext(request);

  return {
    isPremium: access.isPremium,
    persisted: access.persisted,
  };
}