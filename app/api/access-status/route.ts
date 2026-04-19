import { NextRequest, NextResponse } from "next/server";

import { hasPremiumAccess } from "@/lib/usage";
import { canAccessFeature, getUserPlanInfo } from "@/lib/access-control";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Feature } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get("detailed") === "true";
  const feature = searchParams.get("feature") as Feature | null;

  // Se solicitou uma feature específica, verificar acesso
  if (feature) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { allowed: false, reason: "Servidor indisponível" },
        { status: 500 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({
        allowed: false,
        reason: "Usuário não autenticado",
        planType: null,
      });
    }

    const accessCheck = await canAccessFeature(user.id, feature);
    const planInfo = await getUserPlanInfo(user.id);

    return NextResponse.json({
      allowed: accessCheck.allowed,
      reason: accessCheck.reason,
      planType: planInfo?.planType || null,
    });
  }

  // Se solicitou informações detalhadas, retornar dados completos do plano
  if (detailed) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { 
          planType: null,
          planStatus: null,
          recipeGenerationsUsed: 0,
          recipeGenerationsLimit: 0,
          canAccessMealPlanner: false,
          isPremium: false,
        },
        { status: 500 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({
        planType: null,
        planStatus: null,
        recipeGenerationsUsed: 0,
        recipeGenerationsLimit: 0,
        canAccessMealPlanner: false,
        isPremium: false,
      });
    }

    const planInfo = await getUserPlanInfo(user.id);
    const mealPlannerAccess = await canAccessFeature(user.id, "planner");

    return NextResponse.json({
      planType: planInfo?.planType || null,
      planStatus: planInfo?.planStatus || null,
      recipeGenerationsUsed: planInfo?.recipeGenerationsUsed || 0,
      recipeGenerationsLimit: planInfo?.recipeGenerationsLimit || 0,
      canAccessMealPlanner: mealPlannerAccess.allowed,
      isPremium: planInfo?.planType === "pro" || planInfo?.planType === "basic" || planInfo?.planType === "test",
    });
  }

  // Resposta padrão (apenas isPremium)
  const access = await hasPremiumAccess(request);
  return NextResponse.json(access);
}