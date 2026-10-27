"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import type { ActionState } from "@/lib/types";

async function origin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  });
  if (error) return { error: error.message === "Invalid login credentials" ? "Wrong email or password." : error.message };
  redirect(safeNext(form.get("next")));
}

export async function signup(_: ActionState, form: FormData): Promise<ActionState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const fullName = String(form.get("full_name") ?? "").trim();
  if (!fullName) return { error: "Please enter your name." };
  if (password.length < 8) return { error: "Use at least 8 characters for your password." };
  const next = safeNext(form.get("next"));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone: String(form.get("phone") ?? "").trim() },
      emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: error.message };
  // Email confirmation off → we already have a session.
  if (data.session) redirect(next);
  return { ok: `Nearly there — we've emailed a confirmation link to ${email}.` };
}

export async function forgotPassword(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const email = String(form.get("email") ?? "").trim();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/callback?next=/reset`,
  });
  if (error) return { error: error.message };
  return { ok: "If that email has an account, a reset link is on its way." };
}

export async function resetPassword(_: ActionState, form: FormData): Promise<ActionState> {
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters for your password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}
