import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS, type CollaboratorRole, type Profile, type Study } from "@/lib/supabase/types";

export const metadata = {
  title: "Dashboard — Inoxity",
};

type StudyListItem = Pick<
  Study,
  "id" | "owner_id" | "stable_study_id" | "study_code" | "is_active" | "configuration_json" | "created_at"
>;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this route, but Server Components can be
  // reached via paths middleware didn't run on, so re-check here too.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, institution")
    .eq("id", user.id)
    .single<Pick<Profile, "full_name" | "institution">>();

  // No owner_id filter — now includes studies the caller collaborates on
  // too, not just owns (see 008_study_collaborators.sql's broadened
  // studies SELECT policy). A separate query below fills in each card's
  // role badge.
  const { data: studies } = await supabase
    .from("studies")
    .select("id, owner_id, stable_study_id, study_code, is_active, configuration_json, created_at")
    .order("created_at", { ascending: false })
    .returns<StudyListItem[]>();

  const { data: myCollaborations } = await supabase
    .from("study_collaborators")
    .select("study_id, role")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null);
  const roleByStudyId = new Map((myCollaborations ?? []).map((c) => [c.study_id, c.role as CollaboratorRole]));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1
          className="text-2xl font-light sm:text-3xl"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          Researcher Dashboard
        </h1>

        <p className="text-muted-foreground">
          Signed in as{" "}
          <span className="text-foreground">
            {profile?.full_name || "Researcher"}
          </span>{" "}
          · {user.email}
          {profile?.institution ? ` · ${profile.institution}` : ""}
        </p>

        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-light" style={{ fontFamily: "var(--font-raleway)" }}>
          Studies
        </h2>
        <Button nativeButton={false} render={<Link href="/dashboard/studies/new" />}>
          Create Study
        </Button>
      </div>

      {!studies || studies.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No studies yet — create your first one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {studies.map((study) => (
            <Link key={study.id} href={`/dashboard/studies/${study.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base font-medium">
                    {study.configuration_json.identity.displayName || study.stable_study_id}
                  </CardTitle>
                  <div className="flex items-center gap-1.5">
                    {study.owner_id !== user.id && (
                      <Badge variant="outline">
                        {ROLE_LABELS[roleByStudyId.get(study.id) ?? "viewer"]}
                      </Badge>
                    )}
                    <Badge variant={study.is_active ? "default" : "secondary"}>
                      {study.is_active ? "Active" : "Draft"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Code: {study.study_code}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
