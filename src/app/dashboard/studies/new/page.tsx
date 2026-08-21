import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudyWizard } from "@/components/study-wizard/study-wizard";

export const metadata = {
  title: "Create Study — Inoxity",
};

export default async function NewStudyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <StudyWizard mode="create" />
    </div>
  );
}
