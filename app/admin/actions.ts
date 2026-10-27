"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

// Every action re-checks admin rights here; RLS enforces the same rules in the database.

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => (str(f, k) === "" ? null : Number(str(f, k)));
const bool = (f: FormData, k: string) => f.get(k) === "on";
class UserError extends Error {}
const fail = (msg: string): never => {
  throw new UserError(msg);
};

/** Runs an admin mutation, turning expected failures into a message for the form. */
async function guard(fn: () => Promise<void>, ok = "Saved."): Promise<ActionState> {
  try {
    await fn();
    return { ok };
  } catch (e) {
    if (e instanceof UserError) return { error: e.message };
    throw e; // redirect() and genuine crashes
  }
}

function poundsToPence(v: string) {
  const n = Number(v.replace(/[£,\s]/g, ""));
  if (!Number.isFinite(n) || n < 0) fail("Enter a valid price.");
  return Math.round(n * 100);
}

// ── orders ──
export async function markOrderPaid(orderId: string): Promise<ActionState> {
  return guard(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.rpc("fulfil_order", { p_order: orderId, p_provider: "manual", p_ref: "admin" });
    if (error) fail(error.message);
    revalidatePath("/admin", "layout");
  });
}

export async function cancelOrder(orderId: string): Promise<ActionState> {
  return guard(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId).eq("status", "pending");
    if (error) fail(error.message);
    revalidatePath("/admin", "layout");
  });
}

// ── bookings ──
export async function updateBooking(bookingId: string, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const { supabase } = await requireAdmin();
    const status = str(form, "status");
    const { error } = await supabase
      .from("bookings")
      .update({ status, meeting_link: str(form, "meeting_link") || null })
      .eq("id", bookingId);
    if (error) fail(error.message);
    if (status === "cancelled") {
      await supabase.from("orders").update({ status: "cancelled" }).eq("booking_id", bookingId).eq("status", "pending");
    }
    revalidatePath("/admin", "layout");
  });
}

// ── clients ──
export async function grantCourse(userId: string, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const { supabase } = await requireAdmin();
    const packageId = str(form, "package_id");
    if (!packageId) fail("Choose a course.");
    const { error } = await supabase.from("enrolments").upsert({ user_id: userId, package_id: packageId }, { ignoreDuplicates: true });
    if (error) fail(error.message);
    revalidatePath(`/admin/clients/${userId}`);
  });
}

export async function revokeCourse(userId: string, packageId: string): Promise<ActionState> {
  return guard(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("enrolments").delete().eq("user_id", userId).eq("package_id", packageId);
    if (error) fail(error.message);
    revalidatePath(`/admin/clients/${userId}`);
  });
}

export async function setAdmin(userId: string, isAdmin: boolean): Promise<ActionState> {
  return guard(async () => {
    const { supabase, user } = await requireAdmin();
    if (userId === user.id && !isAdmin) fail("You can't remove your own admin rights.");
    const { error } = await supabase.from("profiles").update({ is_admin: isAdmin }).eq("id", userId);
    if (error) fail(error.message);
    revalidatePath(`/admin/clients/${userId}`);
  });
}

// ── applications ──
export async function reviewApplication(id: string, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const { supabase } = await requireAdmin();
    const status = str(form, "decision");
    if (status !== "approved" && status !== "rejected" && status !== "pending") fail("Unknown decision.");
    const { error } = await supabase
      .from("applications")
      .update({ status, admin_note: str(form, "admin_note") || null, reviewed_at: status === "pending" ? null : new Date().toISOString() })
      .eq("id", id);
    if (error) fail(error.message);
    revalidatePath("/admin", "layout");
  });
}

// ── packages & lessons ──
function packageFields(form: FormData) {
  const kind = str(form, "kind");
  if (kind !== "course" && kind !== "mentoring") fail("Choose course or mentoring.");
  const slug = str(form, "slug").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) fail("Add a URL slug.");
  if (!str(form, "title")) fail("Add a title.");
  return {
    kind,
    slug,
    title: str(form, "title"),
    tagline: str(form, "tagline"),
    description: str(form, "description"),
    price_pence: poundsToPence(str(form, "price")),
    features: str(form, "features").split("\n").map((s) => s.trim()).filter(Boolean),
    bundles: str(form, "bundles").split(",").map((s) => s.trim()).filter(Boolean),
    duration_minutes: num(form, "duration_minutes"),
    sessions: num(form, "sessions") ?? 1,
    sort: num(form, "sort") ?? 0,
    includes_discord: bool(form, "includes_discord"),
    highlight: bool(form, "highlight"),
    active: bool(form, "active"),
  };
}

export async function savePackage(id: string | null, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const { supabase } = await requireAdmin();
    const fields = packageFields(form);
    const { data, error } = id
      ? await supabase.from("packages").update(fields).eq("id", id).select("id").single()
      : await supabase.from("packages").insert(fields).select("id").single();
    if (error) fail(error.code === "23505" ? "That slug is already used." : error.message);
    revalidatePath("/", "layout");
    if (!id) redirect(`/admin/packages/${data!.id}`);
  });
}

export async function saveLesson(packageId: string, lessonId: string | null, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const { supabase } = await requireAdmin();
    if (!str(form, "title")) fail("Add a lesson title.");
    const fields = {
      package_id: packageId,
      section: str(form, "section") || "Lessons",
      title: str(form, "title"),
      summary: str(form, "summary"),
      video_url: str(form, "video_url") || null,
      duration_minutes: num(form, "duration_minutes"),
      sort: num(form, "sort") ?? 0,
      is_preview: bool(form, "is_preview"),
    };
    const { error } = lessonId
      ? await supabase.from("lessons").update(fields).eq("id", lessonId)
      : await supabase.from("lessons").insert(fields);
    if (error) fail(error.message);
    revalidatePath(`/admin/packages/${packageId}`);
  });
}

export async function deleteLesson(packageId: string, lessonId: string): Promise<ActionState> {
  return guard(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
    if (error) fail(error.message);
    revalidatePath(`/admin/packages/${packageId}`);
  });
}

// ── showcase ──
export async function addShowcase(form: FormData): Promise<ActionState> {
  return guard(async () => {
    const { supabase } = await requireAdmin();
    const url = str(form, "url");
    if (!/^https?:\/\//.test(url)) fail("Paste the full link to the short (https://…).");
    const { error } = await supabase.from("showcase").insert({ url, title: str(form, "title"), sort: num(form, "sort") ?? 0 });
    if (error) fail(error.message);
    revalidatePath("/", "layout");
  });
}

export async function updateShowcase(id: string, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("showcase")
      .update({ title: str(form, "title"), sort: num(form, "sort") ?? 0, active: bool(form, "active") })
      .eq("id", id);
    if (error) fail(error.message);
    revalidatePath("/", "layout");
  });
}

export async function deleteShowcase(id: string): Promise<ActionState> {
  return guard(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("showcase").delete().eq("id", id);
    if (error) fail(error.message);
    revalidatePath("/", "layout");
  });
}

// ── settings ──
export async function saveSettings(form: FormData): Promise<ActionState> {
  return guard(async () => {
    const { supabase } = await requireAdmin();
    const first = num(form, "first_slot_hour") ?? 10;
    const last = num(form, "last_slot_hour") ?? 20;
    if (first > last) fail("The first slot must be before the last slot.");
    const { error } = await supabase
      .from("site_settings")
      .update({
        editor_email: str(form, "editor_email"),
        whatsapp_number: str(form, "whatsapp_number"),
        youtube_url: str(form, "youtube_url"),
        tiktok_url: str(form, "tiktok_url"),
        instagram_url: str(form, "instagram_url"),
        first_slot_hour: first,
        last_slot_hour: last,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) fail(error.message);
    const { error: e2 } = await supabase.from("private_settings").update({ discord_invite: str(form, "discord_invite") }).eq("id", 1);
    if (e2) fail(e2.message);
    revalidatePath("/", "layout");
  });
}
