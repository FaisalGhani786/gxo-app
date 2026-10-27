import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

// Handles the links in Supabase emails (sign-up confirmation, password reset).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));
  const supabase = await createClient();

  let error: string | null = null;
  if (code) {
    error = (await supabase.auth.exchangeCodeForSession(code)).error?.message ?? null;
  } else if (tokenHash && type) {
    error = (await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error?.message ?? null;
  } else {
    error = "Invalid link.";
  }

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("That link didn't work: " + error)}`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
