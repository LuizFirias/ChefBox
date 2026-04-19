import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consumePhotoAnalysis } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

const SYSTEM_PROMPT = `You are a Brazilian nutritionist AI analyzing meal photos.

Analyze the image and identify all food items visible, estimating their quantities and macronutrients.

RULES:
- Identify all food items in the image
- Estimate quantities in grams based on visual portion sizes
- Consider standard Brazilian plate sizes and portions
- Use TACO nutritional database values for Brazilian foods
- Be realistic and conservative with estimates
- If a food is unclear, provide your best estimate with a qualifier
- Round calories to nearest 5 kcal
- Round macros to 1 decimal place

COMMON BRAZILIAN FOODS REFERENCE:
- Arroz branco cozido: ~130 kcal/100g (28g carbs, 2.5g protein, 0.2g fat)
- Feijão carioca: ~77 kcal/100g (14g carbs, 4.8g protein, 0.5g fat)
- Frango grelhado: ~165 kcal/100g (0g carbs, 31g protein, 3.6g fat)
- Frango frito: ~220 kcal/100g (5g carbs, 27g protein, 10g fat)
- Carne bovina grelhada: ~250 kcal/100g (0g carbs, 26g protein, 15g fat)
- Batata cozida: ~77 kcal/100g (17g carbs, 2g protein, 0.1g fat)
- Batata frita: ~312 kcal/100g (41g carbs, 3.8g protein, 15g fat)
- Salada (alface, tomate): ~20 kcal/100g (4g carbs, 1g protein, 0.2g fat)
- Macarrão cozido: ~131 kcal/100g (25g carbs, 5g protein, 1.1g fat)

PORTION ESTIMATION GUIDE:
- Standard protein portion (meat, chicken, fish): 120-180g
- Rice portion: 100-150g
- Beans portion: 60-100g
- Vegetables: 80-120g
- Salad: 50-80g

OUTPUT JSON FORMAT (STRICT):
{
  "items": [
    {
      "food": "nome do alimento em português",
      "quantity": "quantidade estimada com unidade (ex: ~150g)",
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

async function analyzeImageWithVision(base64Image: string): Promise<MacroResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this meal photo and calculate the macronutrients. Identify all food items, estimate their quantities, and provide nutritional breakdown.",
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[analyze-meal-photo] OpenAI error:", errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const result = JSON.parse(content) as MacroResponse;

  // Validate response structure
  if (!result.items || !Array.isArray(result.items) || !result.totals) {
    throw new Error("Invalid response format from AI");
  }

  return result;
}

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

    // Verificar e consumir cota mensal de análise de foto
    const usage = await consumePhotoAnalysis(request);
    if (!usage.canGenerate) {
      return NextResponse.json(
        {
          error: usage.limit === 0
            ? "Análise de foto por IA está disponível a partir do Plano Vitalício."
            : `Você atingiu o limite de ${usage.limit} análises de foto este mês. Faça upgrade para continuar.`,
          upgradeRequired: true,
          usage,
        },
        { status: 402 }
      );
    }

    const formData = await request.formData();
    const photo = formData.get("photo") as File;

    if (!photo) {
      return NextResponse.json(
        { error: "Foto é obrigatória" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!photo.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Arquivo deve ser uma imagem" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (photo.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Imagem muito grande. Máximo: 10MB" },
        { status: 400 }
      );
    }

    // Convert to base64
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${photo.type};base64,${buffer.toString("base64")}`;

    console.log("[analyze-meal-photo] Processing image:", {
      userId: user.id.slice(0, 8),
      fileType: photo.type,
      fileSize: `${(photo.size / 1024).toFixed(1)}KB`,
    });

    const result = await analyzeImageWithVision(base64Image);

    console.log("[analyze-meal-photo] Success:", {
      userId: user.id.slice(0, 8),
      itemCount: result.items.length,
      totalCalories: result.totals.calories,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[analyze-meal-photo] Error:", error);
    return NextResponse.json(
      { error: "Erro ao analisar foto. Tente novamente." },
      { status: 500 }
    );
  }
}
