import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/daily-meals?date=YYYY-MM-DD
 * Get all meals for a specific date
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Erro ao conectar ao banco de dados" },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // @ts-ignore - TypeScript inference limitation with Supabase generics
    const { data: meals, error: mealsError } = await supabase
      .from("daily_meals")
      .select("*")
      .eq("user_id", user.id)
      .eq("meal_date", date)
      .order("created_at", { ascending: true });

    if (mealsError) {
      console.error("[daily-meals] Error fetching meals:", mealsError);
      return NextResponse.json(
        { error: "Erro ao carregar refeições" },
        { status: 500 }
      );
    }

    return NextResponse.json({ meals: meals || [] });
  } catch (error) {
    console.error("[daily-meals] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/daily-meals
 * Save a meal for today
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Erro ao conectar ao banco de dados" },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { meal_type, items, total_calories, total_protein_g, total_carbs_g, total_fat_g } = body;

    if (!meal_type || !items || !total_calories) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // Upsert the meal (insert or update if already exists for this meal type today)
    // @ts-ignore - TypeScript inference limitation with Supabase generics
    const { data, error: insertError } = await supabase
      .from("daily_meals")
      .upsert(
        {
          user_id: user.id,
          meal_date: today,
          meal_type,
          items,
          total_calories,
          total_protein_g,
          total_carbs_g,
          total_fat_g,
          updated_at: new Date().toISOString(),
        } as any,
        {
          onConflict: "user_id,meal_date,meal_type",
        }
      )
      .select()
      .single();

    if (insertError) {
      console.error("[daily-meals] Error saving meal:", insertError);
      return NextResponse.json(
        { error: "Erro ao salvar refeição" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, meal: data });
  } catch (error) {
    console.error("[daily-meals] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
