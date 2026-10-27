import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Minimal Stripe Checkout over its REST API (no SDK). Optional: without
// STRIPE_SECRET_KEY orders stay "pending" and are marked paid from /admin.

export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;

export async function createCheckoutSession(input: {
  orderId: string;
  title: string;
  amountPence: number;
  currency: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const body = new URLSearchParams({
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.email,
    client_reference_id: input.orderId,
    "metadata[order_id]": input.orderId,
    "payment_intent_data[metadata][order_id]": input.orderId,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": input.currency,
    "line_items[0][price_data][unit_amount]": String(input.amountPence),
    "line_items[0][price_data][product_data][name]": input.title,
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `checkout-${input.orderId}-${input.amountPence}`,
    },
    body,
  });
  const json = (await res.json()) as { url?: string; error?: { message?: string } };
  if (!res.ok || !json.url) throw new Error(json.error?.message ?? "Could not start checkout");
  return json.url;
}

/** Verifies a Stripe-Signature header (v1 HMAC-SHA256) within a 5-minute window. */
export function verifyStripeSignature(payload: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i), kv.slice(i + 1)];
    }),
  );
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  const signatures = header
    .split(",")
    .filter((kv) => kv.startsWith("v1="))
    .map((kv) => kv.slice(3));
  return signatures.some((sig) => {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

/** Looks up a Checkout Session; used to confirm payment when the buyer returns. */
export async function getCheckoutSession(id: string) {
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    id: string;
    payment_status: string;
    payment_intent: string | null;
    metadata: { order_id?: string };
  };
}
