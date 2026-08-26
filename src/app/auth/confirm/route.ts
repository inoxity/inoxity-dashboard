import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Handles the {{ .TokenHash }}-based link format used by the Auth email
// templates (Confirm signup / Reset Password / Change Email Address).
// Deliberately separate from /auth/callback (which still handles
// {{ .ConfirmationURL }}'s code-exchange flow as a fallback for anything
// still using the old template format): the whole point of this route is
// that the link in the email points here — our own domain — instead of at
// <project-ref>.supabase.co, which is what was tripping institutional mail
// filters that flag a mismatch between the sending domain and the link
// destination as a phishing signal.
//
// NOTE: this project's tokens carry a "pkce_" prefix (visible in
// token_hash), meaning verifyOtp() here may still be subject to the same
// same-browser/device code_verifier requirement as exchangeCodeForSession()
// in /auth/callback — unconfirmed as of the last time this comment was
// touched (see github.com/supabase/supabase/issues/20961 for the same
// symptom elsewhere). If that turns out to be the actual cause, the fix
// belongs in the Supabase project's auth flow-type config, not here.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (tokenHash && type) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error("[auth/confirm]", error.status, error.message);
    } catch (err) {
      // verifyOtp is documented to return { error } rather than throw, but
      // this is new/unverified against this project's actual PKCE-flow
      // token format — catch defensively so a genuinely unexpected failure
      // still lands the user on a readable page instead of a raw crash.
      console.error("[auth/confirm] unexpected exception", err);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation-failed`);
}
