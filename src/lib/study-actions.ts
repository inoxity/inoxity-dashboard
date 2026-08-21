"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  studyConfigurationSchema,
  normalizeStudyCode,
  type StudyConfiguration,
} from "@/lib/study-schema";
import type { ActivateActionState } from "@/lib/study-action-state";

export interface StudyActionResult {
  error: string | null;
  studyId?: string;
}

// studies live in inoxity_backend — the same Supabase project used for
// researcher auth (the companion iOS app's Control backend, unified with
// the dashboard's auth so Postgres RLS's auth.uid() can actually enforce
// access; see the migrations in inoxity_v2/supabase/control_backend/).
// Access is enforced entirely by RLS — no service_role key anywhere in
// this app. updateDraftStudy/setStudyActive below deliberately do NOT
// also filter on owner_id: since 008_study_collaborators.sql, Editor/Admin
// collaborators (not just the owner) are allowed to write these rows, and
// an app-level owner_id filter would silently block them even though RLS
// allows it. createDraftStudy still sets owner_id on insert — a study is
// always created by, and owned by, whoever makes it.
//
// A study's own Data Backend (its dedicated Supabase project for
// participant data) is part of `configuration_json.dataBackend` — collected
// by the wizard's Data Backend step like any other config field, not a
// separate table/param here (see
// control_backend/migrations/007_data_backend_in_json.sql). Deliberately no
// shared/default backend: each research team must provision and own its
// own Supabase project. A platform-wide default would mean the platform
// operator has visibility into every team's data by default, contradicting
// the "no participant data in Control" design. If dataBackend is left null,
// the study is saved as a draft — setStudyActive() below refuses to
// activate a study until a real backend is linked.

// Exported so team-actions.ts can reuse it rather than duplicating the
// same "get the signed-in user or bounce to /login" check.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

function friendlyWriteError(error: PostgrestError): string {
  if (error.code === "23505") {
    if (error.message.includes("stable_study_id")) {
      return "That study ID is already taken — choose another.";
    }
    if (error.message.includes("study_code")) {
      return "That study code is already taken — choose another.";
    }
    return "That value is already taken — choose another.";
  }
  return "Something went wrong saving the study. Please try again.";
}

export async function createDraftStudy(config: StudyConfiguration): Promise<StudyActionResult> {
  const { supabase, user } = await requireUser();

  const parsed = studyConfigurationSchema.safeParse(config);
  if (!parsed.success) {
    return { error: "The study configuration is invalid — check the highlighted fields." };
  }
  const validated = parsed.data;

  const { data: inserted, error: insertError } = await supabase
    .from("studies")
    .insert({
      owner_id: user.id,
      stable_study_id: validated.identity.id,
      study_code: normalizeStudyCode(validated.identity.code),
      configuration_schema_version: validated.schemaVersion,
      configuration_revision: 1,
      configuration_json: validated,
      is_active: false,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return { error: friendlyWriteError(insertError!) };
  }

  redirect(`/dashboard/studies/${inserted.id}`);
}

export async function updateDraftStudy(studyId: string, config: StudyConfiguration): Promise<StudyActionResult> {
  // Not destructuring `user` — RLS alone decides who can write this row now
  // that Editor/Admin collaborators (not just the owner) are allowed to
  // (see control_backend/migrations/008_study_collaborators.sql). requireUser()
  // is still called for the signed-in-or-redirect guard.
  const { supabase } = await requireUser();

  const parsed = studyConfigurationSchema.safeParse(config);
  if (!parsed.success) {
    return { error: "The study configuration is invalid — check the highlighted fields." };
  }
  const validated = parsed.data;

  const { data: existing, error: fetchError } = await supabase
    .from("studies")
    .select("configuration_revision")
    .eq("id", studyId)
    .single();

  if (fetchError || !existing) {
    return { error: "Study not found." };
  }

  const { error: updateError } = await supabase
    .from("studies")
    .update({
      stable_study_id: validated.identity.id,
      study_code: normalizeStudyCode(validated.identity.code),
      configuration_schema_version: validated.schemaVersion,
      configuration_revision: existing.configuration_revision + 1,
      configuration_json: validated,
    })
    .eq("id", studyId);

  if (updateError) {
    return { error: friendlyWriteError(updateError) };
  }

  redirect(`/dashboard/studies/${studyId}`);
}

// "Save & Exit" from any wizard step before reaching the strict-validated
// final Review-step submit (createDraftStudy/updateDraftStudy above).
// Deliberately skips studyConfigurationSchema.safeParse — a mid-wizard
// draft is expected to be structurally incomplete (e.g. required text
// fields still blank) — and only requires enough to know which row to
// touch. Because this bypasses full validation, setStudyActive() below
// independently re-validates the full config before allowing activation,
// so a study saved only through this relaxed path can never go live
// half-finished.
export async function saveDraftProgress(studyId: string | null, config: unknown): Promise<StudyActionResult> {
  const { supabase, user } = await requireUser();

  const draft = config as StudyConfiguration;
  const id = draft.identity?.id?.trim();
  const code = draft.identity?.code?.trim();
  if (!id || !code) {
    return { error: "Add a Study ID and Enrollment Code (on the Study Basics step) before saving." };
  }

  if (studyId) {
    const { data: existing, error: fetchError } = await supabase
      .from("studies")
      .select("configuration_revision")
      .eq("id", studyId)
      .single();

    if (fetchError || !existing) {
      return { error: "Study not found." };
    }

    const { error: updateError } = await supabase
      .from("studies")
      .update({
        stable_study_id: id,
        study_code: normalizeStudyCode(code),
        configuration_schema_version: draft.schemaVersion,
        configuration_revision: existing.configuration_revision + 1,
        configuration_json: draft,
      })
      .eq("id", studyId);

    if (updateError) {
      return { error: friendlyWriteError(updateError) };
    }
  } else {
    const { error: insertError } = await supabase.from("studies").insert({
      owner_id: user.id,
      stable_study_id: id,
      study_code: normalizeStudyCode(code),
      configuration_schema_version: draft.schemaVersion,
      configuration_revision: 1,
      configuration_json: draft,
      is_active: false,
    });

    if (insertError) {
      return { error: friendlyWriteError(insertError) };
    }
  }

  redirect("/dashboard");
}

// Deliberately kept in the plain useActionState + FormData idiom (unlike the
// wizard) since its inputs are flat. Guards against two real footguns:
// (1) the iOS validator rejects any config whose status.state isn't
// "active" regardless of is_active, so flipping is_active alone can
// silently produce a study no participant can ever fetch; (2) a study with
// no dataBackend set (saved as a draft before the researcher had their own
// Supabase project ready) has nowhere for participant data to go —
// activation must be blocked until a real backend is linked.
export async function setStudyActive(
  _prevState: ActivateActionState,
  formData: FormData,
): Promise<ActivateActionState> {
  const studyId = String(formData.get("studyId") ?? "");
  const active = formData.get("active") === "true";
  const enrollmentOpensAt = formData.get("enrollmentOpensAt");
  const enrollmentClosesAt = formData.get("enrollmentClosesAt");

  // Not destructuring `user` — see the same note in updateDraftStudy above.
  const { supabase } = await requireUser();

  const { data: study, error: fetchError } = await supabase
    .from("studies")
    .select("configuration_json")
    .eq("id", studyId)
    .single();

  if (fetchError || !study) {
    return { error: "Study not found." };
  }

  if (active) {
    const config = study.configuration_json as StudyConfiguration;
    if (!config.dataBackend?.enabled) {
      return {
        error:
          "This study has no Data Backend linked yet — edit the study and add your team's Supabase project details before activating.",
      };
    }
    if (config.status.state !== "active") {
      return {
        error:
          'Set the study\'s status to "Active" in the wizard before activating — otherwise the app will reject every participant even though is_active is on.',
      };
    }
    // Studies can now be saved mid-wizard via saveDraftProgress() without
    // ever passing full schema validation — re-validate the whole config
    // here so an incomplete draft can never be activated for real
    // participants just because it happened to have a dataBackend and
    // status.state === "active" set.
    if (!studyConfigurationSchema.safeParse(config).success) {
      return {
        error:
          "This study's configuration isn't fully valid yet — open the wizard, go through every step to the Review step, and save it there before activating.",
      };
    }
  }

  const { error: updateError } = await supabase
    .from("studies")
    .update({
      is_active: active,
      enrollment_opens_at: enrollmentOpensAt ? new Date(String(enrollmentOpensAt)).toISOString() : null,
      enrollment_closes_at: enrollmentClosesAt ? new Date(String(enrollmentClosesAt)).toISOString() : null,
    })
    .eq("id", studyId);

  if (updateError) {
    return { error: "Something went wrong updating the study. Please try again." };
  }

  revalidatePath(`/dashboard/studies/${studyId}`);
  revalidatePath("/dashboard");
  return { error: null };
}
