"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

export async function cancelBooking(bookingId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_my_booking", { p_booking: bookingId });
  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: "Booking cancelled." };
}

export async function setLessonDone(lessonId: string, done: boolean, slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  if (done) {
    await supabase.from("lesson_progress").upsert({ user_id: user.id, lesson_id: lessonId }, { ignoreDuplicates: true });
  } else {
    await supabase.from("lesson_progress").delete().eq("user_id", user.id).eq("lesson_id", lessonId);
  }
  revalidatePath(`/learn/${slug}`);
}

export async function updateProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };
  const clean = (k: string) => String(form.get(k) ?? "").trim() || null;
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: clean("full_name"), phone: clean("phone"), discord_username: clean("discord_username") })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: "Saved." };
}
