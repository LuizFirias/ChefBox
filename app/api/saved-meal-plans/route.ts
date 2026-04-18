import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  saveMealPlan,
  getUserSavedMealPlans,
  deleteSavedMealPlan,
  updateSavedMealPlan,
} from "@/lib/supabase/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Get all saved meal plans for user
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
      return NextResponse.json(
        { error: "Você precisa estar logado." },
        { status: 401 },
      );
    }

    const { plans, error } = await getUserSavedMealPlans(supabase, user.id);

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar planejamentos salvos." },
        { status: 500 },
      );
    }

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("GET /api/saved-meal-plans error", error);
    return NextResponse.json(
      { error: "Erro ao buscar planejamentos." },
      { status: 500 },
    );
  }
}

// POST - Save a new meal plan
export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: "Você precisa estar logado." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { name, payload, settings } = body;

    if (!name || !payload || !settings) {
      return NextResponse.json(
        { error: "Nome, payload e configurações são obrigatórios." },
        { status: 400 },
      );
    }

    const { success, id, error } = await saveMealPlan(
      supabase,
      user.id,
      name,
      payload,
      settings
    );

    if (!success || error) {
      return NextResponse.json(
        { error: error || "Erro ao salvar planejamento." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("POST /api/saved-meal-plans error", error);
    return NextResponse.json(
      { error: "Erro ao salvar planejamento." },
      { status: 500 },
    );
  }
}

// DELETE - Delete a saved meal plan
export async function DELETE(request: NextRequest) {
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
      return NextResponse.json(
        { error: "Você precisa estar logado." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("id");

    if (!planId) {
      return NextResponse.json(
        { error: "ID do planejamento é obrigatório." },
        { status: 400 },
      );
    }

    const { success, error } = await deleteSavedMealPlan(supabase, user.id, planId);

    if (!success || error) {
      return NextResponse.json(
        { error: error || "Erro ao deletar planejamento." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/saved-meal-plans error", error);
    return NextResponse.json(
      { error: "Erro ao deletar planejamento." },
      { status: 500 },
    );
  }
}

// PATCH - Update meal plan name
export async function PATCH(request: NextRequest) {
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
      return NextResponse.json(
        { error: "Você precisa estar logado." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID e nome são obrigatórios." },
        { status: 400 },
      );
    }

    const { success, error } = await updateSavedMealPlan(supabase, user.id, id, name);

    if (!success || error) {
      return NextResponse.json(
        { error: error || "Erro ao atualizar planejamento." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/saved-meal-plans error", error);
    return NextResponse.json(
      { error: "Erro ao atualizar planejamento." },
      { status: 500 },
    );
  }
}
