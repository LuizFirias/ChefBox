import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateStructuredJson } from "@/lib/ai/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MacroItem = {
  food: string;
  quantity: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

type MacroResponse = {
  items: MacroItem[];
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
};

const SYSTEM_PROMPT = `You are a nutritionist AI that calculates macronutrients for Brazilian food.

Given a description of food items and their quantities, return accurate nutritional information.

RULES:
- All values must be realistic and based on standard Brazilian nutritional tables (TACO)
- Consider cooking methods (cozido, frito, grelhado, assado) when calculating
- Round calories to nearest 5 kcal
- Round macros to 1 decimal place
- Be conservative with estimates - better to underestimate than overestimate
- Use metric units (grams, ml)

COMMON BRAZILIAN FOODS REFERENCE:
- Arroz branco cozido: ~130 kcal/100g (28g carbs, 2.5g protein, 0.2g fat)
- Arroz integral cozido: ~110 kcal/100g (23g carbs, 2.6g protein, 0.9g fat)
- Feijão carioca cozido: ~77 kcal/100g (14g carbs, 4.8g protein, 0.5g fat)
- Frango grelhado (peito): ~165 kcal/100g (0g carbs, 31g protein, 3.6g fat)
- Frango frito: ~220 kcal/100g (5g carbs, 27g protein, 10g fat)
- Carne bovina magra grelhada: ~250 kcal/100g (0g carbs, 26g protein, 15g fat)
- Batata cozida: ~77 kcal/100g (17g carbs, 2g protein, 0.1g fat)
- Batata frita: ~312 kcal/100g (41g carbs, 3.8g protein, 15g fat)
- Brócolis cozido: ~35 kcal/100g (7g carbs, 2.4g protein, 0.4g fat)
- Ovo cozido: ~155 kcal/100g (1.1g carbs, 13g protein, 11g fat)
- Pão francês: ~300 kcal/100g (58g carbs, 9g protein, 3.6g fat)

OUTPUT JSON FORMAT:
{
  "items": [
    {
      "food": "name of food in Portuguese",
      "quantity": "quantity with unit",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number
    }
  ],
  "totals": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number
  }
}`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Configuração do servidor indisponível" },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Você precisa estar logado para usar a calculadora" },
        { status: 401 }
      );
    }

    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Descrição dos alimentos é obrigatória" },
        { status: 400 }
      );
    }

    const userPrompt = `Calculate macronutrients for this meal:\n\n${text}\n\nProvide detailed breakdown for each food item mentioned.`;

    const result = await generateStructuredJson<MacroResponse>(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      {
        feature: "macro_calculator",
        isPremium: true,
        modelTier: "premium",
      }
    );

    if (!result) {
      throw new Error("Failed to generate macro calculation");
    }

    console.log("[calculate-macros] Success:", {
      userId: user.id.slice(0, 8),
      itemCount: result.items.length,
      totalCalories: result.totals.calories,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[calculate-macros] Error:", error);
    return NextResponse.json(
      { error: "Erro ao calcular macros. Tente novamente." },
      { status: 500 }
    );
  }
}
