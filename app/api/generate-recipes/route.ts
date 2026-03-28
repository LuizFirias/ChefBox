import { ZodError } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { generateStructuredJson } from "@/lib/ai/client";
import { generateMockRecipes } from "@/lib/ai/mock";
import {
  buildRecipeSystemPrompt,
  buildRecipeUserPrompt,
} from "@/lib/ai/prompts";
import { consumeRecipeGeneration } from "@/lib/usage";
import type { GenerateRecipesInput, GenerateRecipesResponse } from "@/lib/types";
import {
  generateRecipesInputSchema,
  generateRecipesResponseSchema,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const input = generateRecipesInputSchema.parse(await request.json());
    const usage = await consumeRecipeGeneration(request);

    if (usage.upgradeRequired) {
      return NextResponse.json(
        {
          error: "Limite diario atingido. Faça upgrade para continuar.",
          usage,
          upgradeRequired: true,
        },
        { status: 402 },
      );
    }

    let recipes = generateMockRecipes(input);
    let source: "ai" | "fallback" = "fallback";

    try {
      const aiPayload = await generateStructuredJson<GenerateRecipesResponse>([
        { role: "system", content: buildRecipeSystemPrompt() },
        { role: "user", content: buildRecipeUserPrompt(input as GenerateRecipesInput) },
      ]);

      if (aiPayload) {
        recipes = generateRecipesResponseSchema.parse(aiPayload);
        source = "ai";
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI error";
      console.error("generate-recipes fallback", message);
    }

    return NextResponse.json({
      recipes: recipes.recipes,
      usage,
      source,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Entrada invalida. Envie entre 2 e 16 ingredientes e a quantidade de pessoas.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Erro interno ao gerar receitas." },
      { status: 500 },
    );
  }
}
