import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext, homePathFor } from "@/lib/auth";
import { safeInternalPath } from "@/lib/validation/auth";

/**
 * Callback de auth: OAuth (?code=) e links de e-mail/convite
 * (?token_hash=&type=). Convite recém-aceito segue para definição de senha.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeInternalPath(url.searchParams.get("next"), "");

  const supabase = await createClient();

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  if (!ok) {
    return NextResponse.redirect(new URL("/login?error=callback", url.origin));
  }

  if (type === "invite" || type === "recovery") {
    return NextResponse.redirect(new URL("/auth/set-password", url.origin));
  }

  const ctx = await getSessionContext();
  if (!ctx) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=sem_vinculo", url.origin));
  }

  return NextResponse.redirect(new URL(next || homePathFor(ctx), url.origin));
}
