import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRecentGeneratedRecipes } from "@/lib/supabase/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Configuração do servidor indisponível." },
        { status: 500 },
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      // Retorna array vazio se não estiver autenticado
      return NextResponse.json({ recipes: [] });
    }

    const { recipes, error } = await getRecentGeneratedRecipes(supabase, user.id, 10);

    if (error) {
      console.error("Failed to fetch recent recipes:", error);
      return NextResponse.json({ recipes: [] });
    }

    return NextResponse.json({ recipes });
  } catch (error) {
    console.error("Error in recent-recipes API:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar receitas recentes." },
      { status: 500 },
    );
  }
}
