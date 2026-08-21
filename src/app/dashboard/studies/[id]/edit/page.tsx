import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudyWizard } from "@/components/study-wizard/study-wizard";
import { migrateStoredConfiguration } from "@/lib/study-schema";
import type { CollaboratorRole, Study } from "@/lib/supabase/types";

export const metadata = {
  title: "Edit Study — Inoxity",
};

export default async function EditStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // No owner_id filter — RLS allows Editor/Admin collaborators to SELECT
  // (and update) too, see 008_study_collaborators.sql. But it also allows
  // Viewers to SELECT, and a Viewer landing in the edit wizard with no way
  // to save would be a confusing dead end — so that case is explicitly
  // gated below rather than left to RLS alone.
  const { data: study } = await supabase.from("studies").select("*").eq("id", id).single<Study>();

  if (!study) {
    notFound();
  }

  if (study.owner_id !== user.id) {
    const { data: membership } = await supabase
      .from("study_collaborators")
      .select("role")
      .eq("study_id", id)
      .eq("user_id", user.id)
      .not("accepted_at", "is", null)
      .maybeSingle();
    const role = membership?.role as CollaboratorRole | undefined;
    if (role !== "admin" && role !== "editor") {
      notFound();
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <StudyWizard mode="edit" studyId={study.id} defaultValues={migrateStoredConfiguration(study.configuration_json)} />
    </div>
  );
}
