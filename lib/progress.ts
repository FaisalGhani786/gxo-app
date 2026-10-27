import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lesson, Package } from "@/lib/types";

export type CourseProgress = { pkg: Package; total: number; done: number; nextLessonId: string | null };

/** Progress per enrolled course for one user (RLS decides which rows are visible). */
export async function courseProgress(supabase: SupabaseClient, userId: string): Promise<CourseProgress[]> {
  const { data: enrolments } = await supabase
    .from("enrolments")
    .select("package:packages(*)")
    .eq("user_id", userId)
    .returns<{ package: Package }[]>();
  const pkgs = (enrolments ?? []).map((e) => e.package).sort((a, b) => a.sort - b.sort);
  if (pkgs.length === 0) return [];

  const [{ data: lessons }, { data: progress }] = await Promise.all([
    supabase.from("lessons").select("id, package_id, sort").in("package_id", pkgs.map((p) => p.id)).order("sort").returns<Pick<Lesson, "id" | "package_id" | "sort">[]>(),
    supabase.from("lesson_progress").select("lesson_id").eq("user_id", userId),
  ]);
  const done = new Set((progress ?? []).map((p) => p.lesson_id));
  return pkgs.map((pkg) => {
    const ls = (lessons ?? []).filter((l) => l.package_id === pkg.id);
    return {
      pkg,
      total: ls.length,
      done: ls.filter((l) => done.has(l.id)).length,
      nextLessonId: ls.find((l) => !done.has(l.id))?.id ?? null,
    };
  });
}
