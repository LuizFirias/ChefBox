/**
 * Script para verificar status de assinatura premium de um usuário
 * 
 * Uso:
 * npx tsx scripts/check-premium-status.ts user@example.com
 */

/// <reference types="node" />

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPremiumStatus(email: string) {
  console.log(`\n🔍 Verificando status premium de: ${email}\n`);

  // 1. Buscar usuário
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (userError || !user) {
    console.error("❌ Usuário não encontrado");
    return;
  }

  console.log("✅ Usuário encontrado:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Nome: ${user.full_name || "N/A"}`);
  console.log(`   Criado em: ${new Date(user.created_at).toLocaleString("pt-BR")}`);

  // 2. Buscar subscription
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (subError || !subscription) {
    console.log("\n❌ Nenhuma assinatura encontrada");
    console.log("   Status: FREE");
    return;
  }

  console.log("\n📋 Assinatura encontrada:");
  console.log(`   Provider: ${subscription.provider}`);
  console.log(`   Plano: ${subscription.plan}`);
  console.log(`   Status: ${subscription.status}`);
  
  if (subscription.current_period_end) {
    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    const isActive = endDate > now;
    
    console.log(`   Válido até: ${endDate.toLocaleString("pt-BR")}`);
    console.log(`   Dias restantes: ${Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))}`);
    console.log(`\n   ✨ Premium ativo: ${isActive ? "SIM ✅" : "NÃO ❌"}`);
  }

  // 3. Buscar transações Yampi
  const { data: transactions, error: txError } = await supabase
    .from("yampi_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!txError && transactions && transactions.length > 0) {
    console.log("\n💳 Últimas transações Yampi:");
    transactions.forEach((tx, i) => {
      console.log(`\n   ${i + 1}. ${tx.yampi_transaction_id}`);
      console.log(`      Plano: ${tx.plan_name}`);
      console.log(`      Valor: R$ ${tx.amount}`);
      console.log(`      Status: ${tx.status}`);
      console.log(`      Data: ${new Date(tx.created_at).toLocaleString("pt-BR")}`);
    });
  }

  console.log("\n");
}

const email = process.argv[2];

if (!email) {
  console.error("❌ Uso: npx tsx scripts/check-premium-status.ts user@example.com");
  process.exit(1);
}

checkPremiumStatus(email).catch(console.error);
