import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/";
  const supabase = await createSupabaseServerClient();

  // Exchange code for session first
  if (code) {
    await supabase?.auth.exchangeCodeForSession(code);
  }

  // Verify OTP if present
  if (tokenHash && type) {
    await supabase?.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "recovery" | "invite" | "email_change",
    });
  }

  // Check if this is a password recovery flow
  // The type parameter comes from the email link or from our redirect
  if (type === "recovery" || requestUrl.searchParams.has("recovery")) {
    return NextResponse.redirect(new URL("/reset-password", requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}