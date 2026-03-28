import { ZodError } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { generateStructuredJson } from "@/lib/ai/client";
import { generateMockMealPlan } from "@/lib/ai/mock";
import {
  buildMealPlanSystemPrompt,
  buildMealPlanUserPrompt,
} from "@/lib/ai/prompts";
import { hasPremiumAccess } from "@/lib/usage";
import type { MealPlanResponse } from "@/lib/types";
import { mealPlanInputSchema, mealPlanResponseSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const input = mealPlanInputSchema.parse(await request.json());
    const access = await hasPremiumAccess(request);

    if (!access.isPremium) {
      return NextResponse.json(
        {
          error: "Meal planner e um recurso premium.",
          upgradeRequired: true,
          persisted: access.persisted,
        },
        { status: 402 },
      );
    }

    let plan = generateMockMealPlan(input);
    let source: "ai" | "fallback" = "fallback";

    try {
      const aiPayload = await generateStructuredJson<MealPlanResponse>([
        { role: "system", content: buildMealPlanSystemPrompt() },
        { role: "user", content: buildMealPlanUserPrompt(input) },
      ]);

      if (aiPayload) {
        plan = mealPlanResponseSchema.parse(aiPayload);
        source = "ai";
      }
    } catch (error) {
      console.error("generate-meal-plan fallback", error);
    }

    return NextResponse.json({ ...plan, source });
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