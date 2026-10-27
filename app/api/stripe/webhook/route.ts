import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyStripeSignature } from "@/lib/stripe";

// Stripe → "checkout.session.completed" marks the order paid and unlocks it.
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });

  const payload = await request.text();
  if (!verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  const event = JSON.parse(payload) as {
    type: string;
    data: { object: { id: string; payment_status?: string; payment_intent?: string | null; metadata?: { order_id?: string } } };
  };
  const session = event.data.object;
  const paidEvent =
    (event.type === "checkout.session.completed" && session.payment_status === "paid") ||
    event.type === "checkout.session.async_payment_succeeded";

  if (paidEvent && session.metadata?.order_id) {
    const { error } = await createAdminClient().rpc("fulfil_order", {
      p_order: session.metadata.order_id,
      p_provider: "stripe",
      p_ref: session.payment_intent ?? session.id,
    });
    // A 500 makes Stripe retry later.
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
