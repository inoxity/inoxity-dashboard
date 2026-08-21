"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/study-actions";
import { getSiteOrigin } from "@/lib/site-origin";
import { sendStudyInviteEmail } from "@/lib/email";
import type { TeamActionState } from "@/lib/team-action-state";
import { COLLABORATOR_ROLES, type CollaboratorRole } from "@/lib/supabase/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Translates the plain `raise exception '<code>'` strings the RPCs in
// 008_study_collaborators.sql throw (no errcode set on most of them, so
// they surface here as an ordinary PostgrestError.message) into copy a
// researcher can actually read.
function mapTeamError(error: PostgrestError): string {
  const message = error.message;
  if (error.code === "23505") {
    return "This person has already been invited to this study.";
  }
  if (message.includes("invite_email_mismatch")) {
    return "This invite was sent to a different email address than the one you're signed in with.";
  }
  if (message.includes("invite_already_accepted")) {
    return "This invite has already been accepted.";
  }
  if (message.includes("invite_not_found")) {
    return "That invite link isn't valid.";
  }
  if (message.includes("new_owner_must_be_existing_admin_or_editor")) {
    return "You can only transfer ownership to an existing Admin or Editor on this study.";
  }
  if (message.includes("already_owner")) {
    return "That person already owns this study.";
  }
  if (message.includes("only_the_owner_can_transfer_ownership") || message.includes("forbidden")) {
    return "You don't have permission to do that.";
  }
  if (message.includes("study_not_found")) {
    return "Study not found.";
  }
  return "Something went wrong. Please try again.";
}

export async function inviteCollaborator(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const studyId = String(formData.get("studyId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");

  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (!COLLABORATOR_ROLES.includes(role as CollaboratorRole)) {
    return { error: "Choose a role." };
  }

  const { supabase, user } = await requireUser();

  // Pre-link to an existing account if one exists for this email — purely
  // informational at this point (find_profile_id_by_email doesn't grant
  // access on its own; accepted_at staying null is what keeps this
  // pending until the invite is actually accepted).
  const { data: existingProfileId } = await supabase.rpc("find_profile_id_by_email", { p_email: email });

  const { data: inserted, error: insertError } = await supabase
    .from("study_collaborators")
    .insert({
      study_id: studyId,
      invited_email: email,
      role,
      invited_by: user.id,
      user_id: existingProfileId ?? null,
    })
    .select("invite_token")
    .single();

  if (insertError || !inserted) {
    return { error: insertError ? mapTeamError(insertError) : "Something went wrong sending the invite." };
  }

  const [{ data: study }, { data: inviterProfile }] = await Promise.all([
    supabase.from("studies").select("configuration_json, stable_study_id").eq("id", studyId).single(),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);

  const studyDisplayName =
    (study?.configuration_json as { identity?: { displayName?: string } } | null)?.identity?.displayName ||
    study?.stable_study_id ||
    "a study";
  const origin = await getSiteOrigin();
  const acceptUrl = `${origin}/invite/${inserted.invite_token}`;

  const { error: emailError } = await sendStudyInviteEmail({
    to: email,
    studyDisplayName,
    inviterName: inviterProfile?.full_name || "A researcher",
    role: role as CollaboratorRole,
    acceptUrl,
  });

  revalidatePath("/dashboard/team");

  if (emailError) {
    return { error: null, success: true, fallbackAcceptUrl: acceptUrl };
  }
  return { error: null, success: true };
}

export async function updateCollaboratorRole(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const collaboratorId = String(formData.get("collaboratorId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!COLLABORATOR_ROLES.includes(role as CollaboratorRole)) {
    return { error: "Choose a role." };
  }

  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("study_collaborators")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", collaboratorId);

  if (error) {
    return { error: mapTeamError(error) };
  }

  revalidatePath("/dashboard/team");
  return { error: null, success: true };
}

export async function removeCollaborator(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const collaboratorId = String(formData.get("collaboratorId") ?? "");
  const { supabase } = await requireUser();

  const { error } = await supabase.from("study_collaborators").delete().eq("id", collaboratorId);

  if (error) {
    return { error: mapTeamError(error) };
  }

  revalidatePath("/dashboard/team");
  return { error: null, success: true };
}

export async function transferStudyOwnership(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const studyId = String(formData.get("studyId") ?? "");
  const newOwnerUserId = String(formData.get("newOwnerUserId") ?? "");
  const { supabase } = await requireUser();

  const { error } = await supabase.rpc("transfer_study_ownership", {
    p_study_id: studyId,
    p_new_owner_id: newOwnerUserId,
  });

  if (error) {
    return { error: mapTeamError(error) };
  }

  revalidatePath("/dashboard/team");
  revalidatePath(`/dashboard/studies/${studyId}`);
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function acceptStudyInvite(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const token = String(formData.get("token") ?? "");
  const supabase = await createClient();

  const { data: studyId, error } = await supabase.rpc("accept_study_invite", { p_token: token });

  if (error || !studyId) {
    return { error: error ? mapTeamError(error) : "That invite link isn't valid." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/team");
  redirect(`/dashboard/studies/${studyId}`);
}
