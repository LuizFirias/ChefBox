/**
 * Verifica o status premium do usuário iriasnandinho@gmail.com
 * 
 * USO: npx tsx scripts/check-iriasnandinho.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkUser() {
  console.log("\n🔍 Verificando iriasnandinho@gmail.com...\n");

  // 1. Buscar usuário
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error("❌ Erro ao buscar usuários:", userError.message);
    return;
  }

  const user = users.users.find((u) => u.email === "iriasnandinho@gmail.com");

  if (!user) {
    console.log("❌ Usuário não encontrado!");
    return;
  }

  console.log("✅ Usuário encontrado:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Criado em: ${user.created_at}\n`);

  // 2. Verificar assinatura
  const { data: subscriptions, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id);

  if (subError) {
    console.error("❌ Erro ao buscar assinatura:", subError.message);
    return;
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log("⚠️  Nenhuma assinatura encontrada!\n");
    console.log("📝 Execute o script SQL para criar a assinatura:");
    console.log("   psql <connection_string> < make-iriasnandinho-premium.sql\n");
    return;
  }

  console.log("📊 Assinaturas:");
  subscriptions.forEach((sub: any, i: number) => {
    const expiresAt = new Date(sub.current_period_end);
    const isActive = sub.status === "active" && expiresAt > new Date();

    console.log(`\n   ${i + 1}. Assinatura ID: ${sub.id}`);
    console.log(`      Provider: ${sub.provider}`);
    console.log(`      Plan: ${sub.plan}`);
    console.log(`      Status: ${sub.status}`);
    console.log(`      Expira em: ${sub.current_period_end}`);
    console.log(`      Válida: ${isActive ? "✅ SIM" : "❌ NÃO (expirada ou inativa)"}`);
  });

  // 3. Verificar contadores de uso HOJE
  const today = new Date().toISOString().slice(0, 10);

  const { data: usage, error: usageError } = await supabase
    .from("usage_limits")
    .select("*")
    .eq("user_id", user.id)
    .eq("usage_date", today);

  console.log(`\n📈 Uso de hoje (${today}):`);

  if (usageError) {
    console.error("   ❌ Erro:", usageError.message);
  } else if (!usage || usage.length === 0) {
    console.log("   ℹ️  Nenhum uso registrado hoje");
  } else {
    usage.forEach((u: any) => {
      const type = u.subject_key.includes("meal_plan") ? "Meal Planner" : "Receitas";
      console.log(`   ${type}: ${u.used_count}/${u.limit_count}`);
    });
  }

  // 4. Mostrar o subject_key esperado
  console.log(`\n🔑 subject_key esperado: user:${user.id}`);

  // 5. Buscar TODOS os contadores (para debug)
  const { data: allUsage } = await supabase
    .from("usage_limits")
    .select("*")
    .or(`user_id.eq.${user.id},subject_key.like.user:${user.id}%`)
    .order("usage_date", { ascending: false })
    .limit(10);

  if (allUsage && allUsage.length > 0) {
    console.log(`\n📊 Últimos ${allUsage.length} registros de uso:`);
    allUsage.forEach((u: any) => {
      console.log(`   ${u.usage_date} | ${u.subject_key.substring(0, 30)} | ${u.used_count}/${u.limit_count}`);
    });
  }

  console.log("\n");
}

checkUser().catch((err) => {
  console.error("💥 Erro:", err);
  process.exit(1);
});
