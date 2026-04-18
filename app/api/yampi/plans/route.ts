import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Retorna os planos disponíveis para assinatura
 */

export type YampiPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: "month" | "quarter" | "year";
  features: string[];
  popular?: boolean;
  yampi_sku: string;
};

const PLANS: YampiPlan[] = [
  {
    id: "mensal",
    name: "ChefBox Premium Mensal",
    description: "Acesso completo por 1 mês",
    price: 29.90,
    interval: "month",
    yampi_sku: "chefbox-premium-mensal",
    features: [
      "Receitas ilimitadas",
      "Planejamento semanal de refeições",
      "Lista de compras automatizada",
      "Análise de macros e calorias",
      "Suporte prioritário",
      "Sem anúncios",
    ],
  },
  {
    id: "trimestral",
    name: "ChefBox Premium Trimestral",
    description: "3 meses com desconto",
    price: 74.90,
    interval: "quarter",
    yampi_sku: "chefbox-premium-trimestral",
    popular: true,
    features: [
      "✨ Economize 16% vs mensal",
      "Receitas ilimitadas",
      "Planejamento semanal de refeições",
      "Lista de compras automatizada",
      "Análise de macros e calorias",
      "Suporte prioritário",
      "Sem anúncios",
    ],
  },
  {
    id: "anual",
    name: "ChefBox Premium Anual",
    description: "12 meses com melhor custo-benefício",
    price: 239.90,
    interval: "year",
    yampi_sku: "chefbox-premium-anual",
    features: [
      "✨ Economize 33% vs mensal",
      "🎁 2 meses grátis",
      "Receitas ilimitadas",
      "Planejamento semanal de refeições",
      "Lista de compras automatizada",
      "Análise de macros e calorias",
      "Suporte prioritário",
      "Sem anúncios",
    ],
  },
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    if (!supabase) {
      throw new Error("Supabase not available");
    }
    
    // Verifica se usuário está autenticado (opcional)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Se usuário autenticado, verifica subscription atual
    let currentPlan = null;
    if (user) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("provider", "yampi")
        .eq("status", "active")
        .single();

      if (subscription && (subscription as any).current_period_end) {
        const isActive = new Date((subscription as any).current_period_end) > new Date();
        if (isActive) {
          currentPlan = (subscription as any).plan;
        }
      }
    }

    return NextResponse.json({
      plans: PLANS,
      current_plan: currentPlan,
      currency: "BRL",
    });

  } catch (error) {
    console.error("[yampi-plans] Error fetching plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
