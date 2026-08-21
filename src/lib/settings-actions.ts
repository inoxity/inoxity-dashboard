"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/study-actions";
import type { AuthActionState } from "@/lib/auth-state";

export async function updateProfile(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const institution = String(formData.get("institution") ?? "").trim();

  if (!fullName) {
    return { error: "Full name is required." };
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, institution: institution || null })
    .eq("id", user.id);

  if (error) {
    console.error("[updateProfile]", error.code, error.message);
    return { error: "Something went wrong saving your profile. Please try again." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function changePassword(
  _prevState: AuthActionState,
  formData: FormData,
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
    console.error("[changePassword]", error.status, error.message);
    return { error: "Something went wrong changing your password. Please try again." };
  }

  return { error: null, success: true };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function changeEmail(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email });

  if (error) {
    console.error("[changeEmail]", error.status, error.message);
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "That email is already in use by another account." };
    }
    return { error: "Something went wrong changing your email. Please try again." };
  }

  // Supabase's "Secure email change" (on by default) sends a confirmation
  // link to both the old and new address — nothing actually changes until
  // one is clicked, so this isn't a false "success" even though the write
  // itself succeeded here.
  return { error: null, success: true };
}

export async function deleteAccount(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== "DELETE") {
    return { error: 'Type "DELETE" to confirm.' };
  }

  const { supabase } = await requireUser();
  // See control_backend/migrations/009_self_delete_account.sql — a
  // security definer RPC, not a direct table delete, since deleting an
  // auth.users row needs privileges this app's anon-key client doesn't
  // have (and deliberately never gets — no service_role key anywhere).
  const { error } = await supabase.rpc("delete_own_account");

  if (error) {
    console.error("[deleteAccount]", error.code, error.message);
    if (error.message.includes("owns_studies")) {
      return {
        error:
          "You still own one or more studies — transfer ownership (from Research Team) or delete them first.",
      };
    }
    if (/delete_own_account|does not exist|could not find/i.test(error.message)) {
      return {
        error:
          "Account deletion isn't set up yet — apply control_backend/migrations/009_self_delete_account.sql to this Supabase project first.",
      };
    }
    return { error: "Something went wrong deleting your account. Please try again." };
  }

  // The account (and its session) is already gone at this point — best
  // effort only, mainly to clear the local session cookie.
  await supabase.auth.signOut();
  redirect("/");
}
