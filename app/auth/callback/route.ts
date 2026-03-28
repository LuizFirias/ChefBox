import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const supabase = await createSupabaseServerClient();

  if (code) {
    await supabase?.auth.exchangeCodeForSession(code);
  }

  if (tokenHash && type) {
    await supabase?.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "recovery" | "invite" | "email_change",
    });
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}