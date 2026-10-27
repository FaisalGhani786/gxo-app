"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createCheckoutSession, stripeEnabled } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, Order, Package } from "@/lib/types";

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

/** Sends the buyer to Stripe for a pending order, or to the order page for manual payment. */
async function goPay(orderId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: order } = await supabase
    .from("orders")
    .select("*, package:packages(*)")
    .eq("id", orderId)
    .single<Order & { package: Package }>();
  if (!user || !order) redirect("/dashboard");
  if (order.status !== "pending" || !stripeEnabled()) redirect(`/orders/${order.id}`);

  const base = await siteUrl();
  let url: string;
  try {
    url = await createCheckoutSession({
      orderId: order.id,
      title: `gxoeditz — ${order.package.title}`,
      amountPence: order.amount_pence,
      currency: order.currency,
      email: user.email!,
      successUrl: `${base}/orders/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}/orders/${order.id}?cancelled=1`,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start checkout" };
  }
  redirect(url);
}

export async function startCourseCheckout(slug: string): Promise<ActionState> {
  const supabase = await createClient();
  const { data: orderId, error } = await supabase.rpc("create_order", { p_package_slug: slug });
  if (error) return { error: error.message };
  return goPay(orderId as string);
}

export async function payOrder(orderId: string): Promise<ActionState> {
  return goPay(orderId);
}

export async function requestBooking(_: ActionState, form: FormData): Promise<ActionState> {
  const slug = String(form.get("type") ?? "");
  const day = String(form.get("date") ?? "");
  const hourRaw = String(form.get("hour") ?? "");
  const hour = Number(hourRaw);
  if (!slug) return { error: "Choose a session type." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || hourRaw === "" || !Number.isInteger(hour)) {
    return { error: "Choose a day and time." };
  }

  const supabase = await createClient();
  const { data: bookingId, error } = await supabase.rpc("request_booking", {
    p_package_slug: slug,
    p_date: day,
    p_hour: hour,
    p_notes: String(form.get("notes") ?? ""),
  });
  if (error) return { error: error.message };
  const { data: order } = await supabase.from("orders").select("id").eq("booking_id", bookingId).single();
  redirect(`/orders/${order!.id}?booked=1`);
}

export async function applyToTeam(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in first." };

  const portfolio = String(form.get("portfolio_url") ?? "").trim();
  const discord = String(form.get("discord_username") ?? "").trim();
  const premiere = form.get("uses_premiere") === "on";
  const capcut = form.get("uses_capcut") === "on";
  if (!premiere || !capcut) return { error: "The team edits in both Adobe Premiere Pro and CapCut — both are required." };
  if (!/^https?:\/\/\S+\.\S+/.test(portfolio)) return { error: "Add a link to your portfolio or best edits." };
  if (!discord) return { error: "Add your Discord username so we can let you in." };

  const { error } = await supabase.from("applications").insert({
    user_id: user.id,
    portfolio_url: portfolio,
    discord_username: discord,
    uses_premiere: premiere,
    uses_capcut: capcut,
    experience: String(form.get("experience") ?? "").slice(0, 3000),
  });
  if (error) return { error: error.code === "23505" ? "You've already applied — check your dashboard for the status." : error.message };
  await supabase.from("profiles").update({ discord_username: discord }).eq("id", user.id);
  redirect("/dashboard?applied=1");
}
