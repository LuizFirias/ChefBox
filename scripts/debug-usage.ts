/**
 * Script de debug para verificar o status premium e contadores de uso
 * 
 * USO:
 * npx tsx scripts/debug-usage.ts <user_id>
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function debugUsage(userId: string) {
  console.log(`\n🔍 Verificando status do usuário: ${userId}\n`);

  // 1. Verificar assinatura premium
  console.log("📊 Verificando assinatura premium...");
  const { data: subscriptions, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .order("current_period_end", { ascending: false });

  if (subError) {
    console.error("❌ Erro ao buscar subscriptions:", subError.message);
  } else if (!subscriptions || subscriptions.length === 0) {
    console.log("⚠️  Nenhuma assinatura ativa encontrada");
  } else {
    console.log("✅ Assinaturas ativas:");
    subscriptions.forEach((sub: any, i: number) => {
      const isValid = sub.current_period_end && new Date(sub.current_period_end) > new Date();
      console.log(`   ${i + 1}. Status: ${sub.status} | Expira: ${sub.current_period_end} | Válida: ${isValid ? "✅ SIM" : "❌ NÃO"}`);
    });
  }

  // 2. Verificar limites de uso
  console.log("\n📈 Verificando contadores de uso...");
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data: usageLimits, error: usageError } = await supabase
    .from("usage_limits")
    .select("*")
    .eq("user_id", userId)
    .or(`usage_date.eq.${today},usage_date.eq.${month}`)
    .order("usage_date", { ascending: false });

  if (usageError) {
    console.error("❌ Erro ao buscar usage_limits:", usageError.message);
  } else if (!usageLimits || usageLimits.length === 0) {
    console.log("ℹ️  Nenhum contador de uso encontrado (primeira geração?)");
  } else {
    console.log("✅ Contadores de uso:");
    usageLimits.forEach((limit: any) => {
      const isMealPlan = limit.subject_key.includes("meal_plan");
      const type = isMealPlan ? "Meal Plan" : "Receitas";
      console.log(`   ${type} | Data: ${limit.usage_date} | Usado: ${limit.used_count}/${limit.limit_count}`);
    });
  }

  // 3. Verificar todos os registros de usage_limits desse usuário (incluindo anon keys)
  console.log("\n🔎 Buscando TODOS os contadores (incluindo chaves anônimas)...");
  const { data: allUsage, error: allError } = await supabase
    .from("usage_limits")
    .select("*")
    .or(`user_id.eq.${userId},subject_key.like.user:${userId}%`)
    .order("usage_date", { ascending: false })
    .limit(20);

  if (allError) {
    console.error("❌ Erro:", allError.message);
  } else if (!allUsage || allUsage.length === 0) {
    console.log("ℹ️  Nenhum registro encontrado");
  } else {
    console.log(`✅ Total de ${allUsage.length} registros:`);
    allUsage.forEach((limit: any, i: number) => {
      console.log(`   ${i + 1}. ${limit.subject_key} | ${limit.usage_date} | ${limit.used_count}/${limit.limit_count}`);
    });
  }

  // 4. Resumo final
  const isPremium = subscriptions && subscriptions.length > 0 && 
    subscriptions[0].current_period_end && 
    new Date(subscriptions[0].current_period_end) > new Date();

  const todayRecipes = usageLimits?.find((l: any) => 
    l.usage_date === today && !l.subject_key.includes("meal_plan")
  );

  console.log("\n" + "=".repeat(60));
  console.log("📋 RESUMO");
  console.log("=".repeat(60));
  console.log(`Status: ${isPremium ? "✅ PREMIUM" : "⚠️  FREE"}`);
  console.log(`Receitas hoje: ${todayRecipes?.used_count || 0}/${isPremium ? 50 : 3}`);
  console.log(`Pode gerar: ${isPremium ? "✅ SIM (ilimitado)" : todayRecipes?.used_count >= 3 ? "❌ NÃO (limite atingido)" : "✅ SIM"}`);
  console.log("=".repeat(60) + "\n");
}

// Run
const userId = process.argv[2];

if (!userId) {
  console.error("\n❌ Uso: npx tsx scripts/debug-usage.ts <user_id>\n");
  console.log("📝 Para encontrar seu user_id:");
  console.log("   1. Faça login no app");
  console.log("   2. Abra DevTools → Console");
  console.log("   3. Execute: await (await fetch('/api/access-status')).json()");
  console.log("   4. Ou acesse o banco de dados Supabase diretamente\n");
  process.exit(1);
}

debugUsage(userId).catch((err) => {
  console.error("💥 Erro:", err);
  process.exit(1);
});
