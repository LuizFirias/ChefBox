import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * PUT /api/profile
 * Update user profile (full_name, weight, height)
 */
export async function PUT(request: Request) {
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
    const { fullName, weight, height } = body;

    // Update user profile in database
    const { error: updateError } = await supabase
      .from("users")
      // @ts-ignore - TypeScript inference limitation with Supabase generics (resolves after type regeneration)
      .update({
        full_name: fullName as string,
        weight: (weight || null) as string | null,
        height: (height || null) as string | null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", user.id);

    if (updateError) {
      console.error("[profile] Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Erro ao salvar perfil" },
        { status: 500 }
      );
    }

    // Also update auth metadata for full_name
    if (fullName) {
      await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[profile] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profile
 * Get user profile
 */
export async function GET() {
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

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("full_name, weight, height, email")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[profile] Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Erro ao carregar perfil" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      fullName: (profile as any)?.full_name || "",
      weight: (profile as any)?.weight || "",
      height: (profile as any)?.height || "",
      email: (profile as any)?.email || user.email || "",
    });
  } catch (error) {
    console.error("[profile] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
