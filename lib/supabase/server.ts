import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";
import type { Profile } from "@/lib/types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // proxy.ts refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/** The signed-in user and their profile, or nulls for visitors. */
export async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  return { supabase, user, profile };
}

/** Server-side gate for client pages; proxy.ts redirects first. */
export async function requireUser(next = "/dashboard") {
  const session = await getSession();
  if (!session.user || !session.profile) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session as { supabase: typeof session.supabase; user: NonNullable<typeof session.user>; profile: Profile };
}

export async function requireAdmin() {
  const session = await requireUser("/admin");
  if (!session.profile.is_admin) redirect("/dashboard");
  return session;
}
