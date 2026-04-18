/**
 * Script para cancelar assinaturas de teste do Mercado Pago
 * Uso: npx tsx scripts/cancel-test-subscriptions.ts
 */

import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const MP_ACCESS_TOKEN = 'APP_USR-1269114691632418-041815-0dc0772f2a195ff134d0af3d7cb5015d-379528177';
const SUPABASE_URL = 'https://xsevdtxigjxdtqfhfbth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzZXZkdHhpZ2p4ZHRxZmhmYnRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY0NTk3OSwiZXhwIjoyMDkwMjIxOTc5fQ.85W0cQpvrM5Ts8CMXPQcQL_DmV4RFl3WeXE6eoZEZu0';

async function cancelTestSubscriptions() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const mp = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
  const preapproval = new PreApproval(mp);

  console.log('🔍 Buscando assinaturas de teste...\n');

  // Buscar todas as assinaturas com plan_type = 'test'
  const { data: testSubs, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('plan_type', 'test')
    .eq('status', 'active');

  if (error) {
    console.error('❌ Erro ao buscar assinaturas:', error);
    return;
  }

  if (!testSubs || testSubs.length === 0) {
    console.log('✅ Nenhuma assinatura de teste ativa encontrada.');
    return;
  }

  console.log(`📋 Encontradas ${testSubs.length} assinatura(s) de teste:\n`);

  for (const sub of testSubs) {
    console.log(`   - ID: ${sub.id}`);
    console.log(`   - MP ID: ${sub.mp_subscription_id}`);
    console.log(`   - Usuário: ${sub.user_id}`);
    console.log(`   - Preço: R$ ${sub.price}`);
    console.log(`   - Período: ${sub.start_date} → ${sub.end_date}\n`);

    try {
      // Cancelar no Mercado Pago
      if (sub.mp_subscription_id) {
        console.log(`   🔄 Cancelando no Mercado Pago...`);
        await preapproval.update({
          id: sub.mp_subscription_id,
          body: { status: 'cancelled' },
        });
        console.log(`   ✅ Cancelado no MP\n`);
      }

      // Atualizar status no Supabase
      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', sub.id);

      // Atualizar usuário
      await supabase
        .from('users')
        .update({
          active_plan: null,
          plan_status: 'cancelled',
          recipe_generations_limit: 0,
        })
        .eq('id', sub.user_id);

      console.log(`   ✅ Atualizado no Supabase\n`);
    } catch (err: any) {
      console.error(`   ❌ Erro ao cancelar:`, err.message, '\n');
    }
  }

  console.log('🎉 Processo concluído!\n');
}

cancelTestSubscriptions();
