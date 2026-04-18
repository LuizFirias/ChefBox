import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { YAMPI_PRODUCT_MAP } from "@/lib/types";
import { 
  resolveDoublePlan, 
  upsertSubscription, 
  findOrCreateUser,
  recalculateUserActivePlan 
} from "@/lib/plan-management";
import crypto from "crypto";

/**
 * Yampi Webhook Handler
 * Recebe notificações de eventos de pagamento da Yampi
 * Documentação: https://docs.yampi.com.br/docs/webhooks
 */

type YampiWebhookEvent = {
  event: string; // order.paid, order.cancelled, subscription.renewed, etc
  data: {
    id: number;
    status: {
      code: string; // paid, cancelled, refunded
      name: string;
    };
    number: string;
    customer: {
      id: number;
      email: string;
      name: string;
    };
    value: {
      items: number;
      total: number;
    };
    payment: {
      method: string;
    };
    metadata?: Record<string, any>;
    items?: Array<{
      id: number;
      sku_code: string;
      name: string;
      quantity: number;
      value: number;
    }>;
    subscription?: {
      id: string;
      status: string;
    };
  };
};

function verifyYampiSignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;
  
  const secret = process.env.YAMPI_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[yampi-webhook] YAMPI_WEBHOOK_SECRET not configured");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-yampi-signature");

    // Verifica assinatura do webhook
    if (process.env.NODE_ENV === "production" && !verifyYampiSignature(rawBody, signature)) {
      console.error("[yampi-webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event: YampiWebhookEvent = JSON.parse(rawBody);
    console.log(`[yampi-webhook] 📨 Received event: ${event.event}`);

    const admin = createSupabaseAdminClient();
    if (!admin) {
      throw new Error("Supabase admin client not available");
    }

    // ─────────────────────────────────────────────────────────────
    // EVENT: order.paid
    // ─────────────────────────────────────────────────────────────
    if (event.event === "order.paid") {
      const order = event.data;
      
      console.log(`[yampi-webhook] Processing order ${order.number} for ${order.customer.email}`);
      
      // Buscar ou criar usuário
      const userId = await findOrCreateUser(
        order.customer.email,
        order.customer.name,
        order.customer.id.toString()
      );

      if (!userId) {
        console.error("[yampi-webhook] Failed to find/create user");
        return NextResponse.json(
          { success: false, error: "User creation failed" },
          { status: 500 }
        );
      }

      // Processar cada item do pedido
      for (const item of order.items || []) {
        const sku = item.sku_code?.toLowerCase().trim();
        const productInfo = YAMPI_PRODUCT_MAP[sku];

        if (!productInfo) {
          console.warn(`[yampi-webhook] ⚠️ Unknown SKU: ${sku}`);
          continue;
        }

        console.log(`[yampi-webhook] Processing SKU: ${sku} -> ${productInfo.planType} (${productInfo.planPeriod})`);

        // Registrar transação
        await admin.from("yampi_transactions").insert({
          user_id: userId,
          yampi_transaction_id: order.number,
          yampi_order_id: order.id.toString(),
          yampi_customer_id: order.customer.id.toString(),
          plan_id: sku,
          plan_name: item.name,
          plan_type: productInfo.planType,
          plan_period: productInfo.planPeriod,
          amount: item.value,
          currency: "BRL",
          status: "paid",
          payment_method: order.payment.method,
          paid_at: new Date().toISOString(),
          metadata: {
            customer_name: order.customer.name,
            order_metadata: order.metadata,
          } as any,
        } as any);

        // Criar subscription
        await upsertSubscription({
          userId,
          planType: productInfo.planType,
          planPeriod: productInfo.planPeriod,
          price: productInfo.price,
          yampiOrderId: order.id.toString(),
        });
      }

      // Resolver planos duplos se houver
      await resolveDoublePlan(userId);

      console.log(`[yampi-webhook] ✅ Order ${order.number} processed successfully`);

      return NextResponse.json(
        { 
          success: true, 
          message: "Payment processed",
          user_id: userId 
        },
        { status: 200 }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // EVENT: subscription.renewed
    // ─────────────────────────────────────────────────────────────
    if (event.event === "subscription.renewed") {
      const subscription = event.data.subscription;
      
      if (!subscription) {
        return NextResponse.json({ success: false, error: "No subscription data" }, { status: 400 });
      }

      // Buscar subscription no banco pelo yampi_subscription_id
      const { data: sub } = await admin
        .from("subscriptions")
        .select("*")
        .eq("yampi_subscription_id", subscription.id)
        .single();

      if (!sub) {
        console.warn(`[yampi-webhook] Subscription ${subscription.id} not found`);
        return NextResponse.json({ success: true, message: "Subscription not found" }, { status: 200 });
      }

      // Resetar contador de gerações mensais
      const { resetMonthlyGenerations } = await import("@/lib/access-control");
      await resetMonthlyGenerations((sub as any).user_id);

      console.log(`[yampi-webhook] ✅ Subscription ${subscription.id} renewed`);

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ─────────────────────────────────────────────────────────────
    // EVENT: order.cancelled / order.refunded
    // ─────────────────────────────────────────────────────────────
    if (event.event === "order.cancelled" || event.event === "order.refunded") {
      const orderId = event.data.id.toString();

      // Buscar subscriptions relacionadas a esse pedido
      const { data: subs } = await admin
        .from("subscriptions")
        .select("*")
        .eq("yampi_subscription_id", orderId);

      if (subs && subs.length > 0) {
        for (const sub of subs) {
          await admin
            .from("subscriptions")
            .update({
              status: "cancelled",
              cancelled_at: new Date().toISOString(),
            } as any)
            .eq("id", (sub as any).id);

          await recalculateUserActivePlan((sub as any).user_id);
        }

        console.log(`[yampi-webhook] ✅ Order ${orderId} cancelled/refunded`);
      }

      // Atualizar transaction
      // @ts-ignore - status and updated_at already in schema
      await admin
        .from("yampi_transactions")
        .update({
          status: event.event === "order.cancelled" ? "cancelled" : "refunded",
          updated_at: new Date().toISOString(),
        })
        .eq("yampi_order_id", orderId);

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ─────────────────────────────────────────────────────────────
    // EVENT: subscription.cancelled
    // ─────────────────────────────────────────────────────────────
    if (event.event === "subscription.cancelled") {
      const subscription = event.data.subscription;
      
      if (!subscription) {
        return NextResponse.json({ success: false, error: "No subscription data" }, { status: 400 });
      }

      const { data: sub } = await admin
        .from("subscriptions")
        .select("*")
        .eq("yampi_subscription_id", subscription.id)
        .single();

      if (sub) {
        // @ts-ignore - cancelled_at added in migration 006
        await admin
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
          })
          .eq("id", (sub as any).id);

        await recalculateUserActivePlan((sub as any).user_id);

        console.log(`[yampi-webhook] ✅ Subscription ${subscription.id} cancelled`);
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Outros eventos - apenas registrar log
    console.log(`[yampi-webhook] Unhandled event: ${event.event}`);
    return NextResponse.json({ success: true, event: event.event }, { status: 200 });

  } catch (error) {
    console.error("[yampi-webhook] ❌ Error processing webhook:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Endpoint de saúde para verificar se o webhook está ativo
export async function GET() {
  return NextResponse.json({
    status: "active",
    webhook: "yampi",
    timestamp: new Date().toISOString(),
  });
}

