import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

const PRIVATE_PREFIXES = ["/dashboard", "/learn", "/orders", "/checkout", "/admin"];
const AUTH_PAGES = ["/login", "/signup"];

const matches = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));

/** Refreshes the Supabase session cookie and bounces visitors off private pages. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Do not put code between createServerClient and getUser(): getUser()
  // validates the session with Supabase Auth and refreshes it if needed.
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const redirect = (to: string, next?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = next ? `?next=${encodeURIComponent(next)}` : "";
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user && matches(pathname, PRIVATE_PREFIXES)) {
    return redirect("/login", pathname + request.nextUrl.search);
  }
  if (user && matches(pathname, AUTH_PAGES)) return redirect("/dashboard");
  return response;
}
