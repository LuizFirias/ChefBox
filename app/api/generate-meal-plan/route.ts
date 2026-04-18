import { ZodError } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { generateStructuredJson } from "@/lib/ai/client";
import { generateMockMealPlan } from "@/lib/ai/mock";
import {
  buildMealPlanSystemPrompt,
  buildMealPlanUserPrompt,
} from "@/lib/ai/prompts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consumeMealPlanGeneration } from "@/lib/usage";
import type { MealPlanResponse } from "@/lib/types";
import { mealPlanInputSchema, mealPlanResponseSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Configuração do servidor indisponível." },
        { status: 500 },
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Você precisa estar logado para gerar planos alimentares." },
        { status: 401 },
      );
    }

    const input = mealPlanInputSchema.parse(await request.json());
    const usage = await consumeMealPlanGeneration(request);

    // Free users who exceeded monthly limit
    if (!usage.canGenerate && !usage.isPremium) {
      return NextResponse.json(
        {
          error: "Voc\u00ea atingiu o limite mensal de geração de planejamentos. Upgrade para Premium para acesso ilimitado.",
          upgradeRequired: true,
          usage,
        },
        { status: 402 },
      );
    }

    let plan = generateMockMealPlan(input);
    let source: "ai" | "fallback" = "fallback";

    try {
      const planType: "free" | "premium" = usage.isPremium ? "premium" : "free";

      const aiPayload = await generateStructuredJson<MealPlanResponse>(
        [
          { role: "system", content: buildMealPlanSystemPrompt(planType) },
          { role: "user", content: buildMealPlanUserPrompt(input) },
        ],
        {
          feature: "meal_plan",
          isPremium: usage.isPremium,
          modelTier: "premium",
        },
      );

      if (aiPayload) {
        // Post-process: Remove shopping list categories with empty items array
        if (aiPayload.shoppingList && Array.isArray(aiPayload.shoppingList)) {
          aiPayload.shoppingList = aiPayload.shoppingList.filter(
            (category: any) => category.items && category.items.length > 0
          );
          console.log("[generate-meal-plan] Filtered empty shopping list categories:", {
            remainingCategories: aiPayload.shoppingList.length
          });
        }

        // Post-process: If user is vegetarian, remove meat from shopping list
        const isVegetarian = input.preferences?.some(pref => 
          pref.toLowerCase().includes('vegetarian') || pref.toLowerCase().includes('vegetariana')
        );
        
        if (isVegetarian && aiPayload.shoppingList) {
          const beforeLength = aiPayload.shoppingList.length;
          aiPayload.shoppingList = aiPayload.shoppingList.filter(
            (category: any) => !['Açougue', 'AÇOUGUE', 'acougue'].includes(category.category)
          );
          if (beforeLength !== aiPayload.shoppingList.length) {
            console.log("[generate-meal-plan] Removed meat category for vegetarian user");
          }
        }

        plan = mealPlanResponseSchema.parse(aiPayload);
        source = "ai";
      }
    } catch (error) {
      console.error("generate-meal-plan fallback", error);
    }

    return NextResponse.json(
      { ...plan, source, usage },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Entrada invalida para o meal planner." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Erro interno ao gerar planejamento." },
      { status: 500 },
    );
  }
}