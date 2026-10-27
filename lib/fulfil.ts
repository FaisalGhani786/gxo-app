import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCheckoutSession, stripeEnabled } from "@/lib/stripe";

/**
 * Confirms a Stripe Checkout Session with Stripe itself and, if it is paid,
 * fulfils the order it belongs to. Safe to call more than once.
 */
export async function fulfilFromCheckoutSession(sessionId: string, expectedOrderId?: string) {
  if (!stripeEnabled()) return false;
  const session = await getCheckoutSession(sessionId);
  const orderId = session?.metadata.order_id;
  if (!session || !orderId || session.payment_status !== "paid") return false;
  if (expectedOrderId && orderId !== expectedOrderId) return false;
  const admin = createAdminClient();
  const { error } = await admin.rpc("fulfil_order", {
    p_order: orderId,
    p_provider: "stripe",
    p_ref: session.payment_intent ?? session.id,
  });
  if (error) throw new Error(error.message);
  return true;
}
