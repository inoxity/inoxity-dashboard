"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/site-origin";
import type { AuthActionState } from "@/lib/auth-state";

function mapAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "Incorrect email or password.";
  }
  if (message.includes("Email not confirmed")) {
    return "Please confirm your email first — check your inbox for the confirmation link.";
  }
  if (message.toLowerCase().includes("rate limit")) {
    return "Too many attempts right now — please wait a bit and try again.";
  }
  return "Something went wrong. Please try again.";
}

export async function signup(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const institution = String(formData.get("institution") ?? "").trim();

  if (!email || !password || !fullName) {
    return { error: "Email, password, and full name are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const origin = await getSiteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        institution: institution || null,
      },
      // Without this, Supabase falls back to the project's global Site URL as the
      // confirmation link's redirect target, which may not point at /auth/callback — the only
      // route that knows how to exchange the emailed code for a session. That left "Confirm
      // email" landing on the plain homepage with an unconsumed ?code=, never signing the user
      // in. Mirrors the same fix already applied to requestPasswordReset below.
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    console.error("[signup]", error.status, error.message);
    if (error.message.toLowerCase().includes("already registered")) {
      return {
        error:
          "An account with this email already exists. Try signing in instead.",
      };
    }
    return { error: mapAuthError(error.message) };
  }

  // Supabase returns a user with an empty identities array when the email
  // is already registered but confirmed — signUp() doesn't error in that case.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return {
      error:
        "An account with this email already exists. Try signing in instead.",
    };
  }

  return { error: null, success: true };
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[login]", error.status, error.message);
    return { error: mapAuthError(error.message) };
  }

  redirect("/dashboard");
}

export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Enter your email address." };
  }

  const supabase = await createClient();
  const origin = await getSiteOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("[requestPasswordReset]", error.status, error.message);
    if (error.message.toLowerCase().includes("rate limit")) {
      return {
        error: "Too many attempts right now — please wait a bit and try again.",
      };
    }
  }

  // Report success whether or not the email exists — otherwise this becomes
  // a way to check which addresses have an account.
  return { error: null, success: true };
}

export async function resetPassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || !confirmPassword) {
    return { error: "Enter and confirm your new password." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("[resetPassword]", error.status, error.message);
    return { error: mapAuthError(error.message) };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resendConfirmationEmail(
  // Signature is fixed by useActionState — this action needs neither arg,
  // it just re-sends to the signed-in user's own address.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: AuthActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "You need to be signed in to resend a confirmation email." };
  }
  if (user.email_confirmed_at) {
    return { error: "This email is already confirmed." };
  }

  const origin = await getSiteOrigin();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: user.email,
    // Same reasoning as signup()'s emailRedirectTo above — without this the
    // link falls back to the Site URL instead of /auth/callback.
    options: { emailRedirectTo: `${origin}/auth/callback?next=/dashboard` },
  });

  if (error) {
    console.error("[resendConfirmationEmail]", error.status, error.message);
    if (error.message.toLowerCase().includes("rate limit")) {
      return { error: "Too many attempts right now — please wait a bit and try again." };
    }
    return { error: "Something went wrong sending the email. Please try again." };
  }

  return { error: null, success: true };
}
