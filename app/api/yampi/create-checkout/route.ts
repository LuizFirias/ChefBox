import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

/**
 * Cria link de checkout da Yampi para o usuário
 * Documentação: https://docs.yampi.com.br/docs/criar-checkout
 */

const checkoutSchema = z.object({
  plan_id: z.enum(["mensal", "trimestral", "anual"]),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      throw new Error("Supabase not available");
    }

    // Verifica autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Valida input
    const body = await request.json();
    const { plan_id } = checkoutSchema.parse(body);

    // Busca dados do usuário
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("[yampi-checkout] User not found:", user.id);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Define produto baseado no plano
    const products: Record<string, { sku: string; name: string; price: number }> = {
      mensal: {
        sku: "chefbox-premium-mensal",
        name: "ChefBox Premium Mensal",
        price: 29.90,
      },
      trimestral: {
        sku: "chefbox-premium-trimestral",
        name: "ChefBox Premium Trimestral (3 meses)",
        price: 74.90,
      },
      anual: {
        sku: "chefbox-premium-anual",
        name: "ChefBox Premium Anual (12 meses)",
        price: 239.90,
      },
    };

    const product = products[plan_id];

    // Prepara dados do checkout
    const yampiAlias = process.env.YAMPI_ALIAS;
    const yampiToken = process.env.YAMPI_SECRET_KEY;

    if (!yampiAlias || !yampiToken) {
      console.error("[yampi-checkout] Yampi credentials not configured");
      return NextResponse.json(
        { error: "Payment provider not configured" },
        { status: 500 }
      );
    }

    const userEmail = (userData as any).email;
    const userFullName = (userData as any).full_name;

    // Cria checkout na Yampi
    const checkoutPayload = {
      customer: {
        email: userEmail,
        name: userFullName || userEmail.split("@")[0],
      },
      items: [
        {
          sku_code: product.sku,
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        plan_id: plan_id,
        source: "chefbox_app",
      },
    };

    const yampiResponse = await fetch(
      `https://api.yampi.com.br/v1/catalog/checkout/${yampiAlias}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Token": yampiToken,
          "User-Agent": "ChefBox/1.0",
        },
        body: JSON.stringify(checkoutPayload),
      }
    );

    if (!yampiResponse.ok) {
      const errorData = await yampiResponse.json();
      console.error("[yampi-checkout] Yampi API error:", errorData);
      throw new Error("Failed to create checkout");
    }

    const yampiData = await yampiResponse.json();
    
    console.log("[yampi-checkout] ✅ Checkout created:", {
      user_id: user.id,
      plan: plan_id,
      checkout_url: yampiData.data?.url,
    });

    return NextResponse.json({
      success: true,
      checkout_url: yampiData.data?.url || `https://${yampiAlias}.yampi.io/checkout`,
      order_token: yampiData.data?.token,
      plan: product,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error("[yampi-checkout] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to create checkout",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
