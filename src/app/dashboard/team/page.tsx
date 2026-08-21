import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StudyPicker } from "@/components/team/study-picker";
import { TeamRoster } from "@/components/team/team-roster";
import { InviteForm } from "@/components/team/invite-form";
import type { Study, StudyTeamMember } from "@/lib/supabase/types";

export const metadata = {
  title: "Research Team — Inoxity",
};

type StudyListItem = Pick<Study, "id" | "owner_id" | "stable_study_id" | "configuration_json">;

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ study?: string }> }) {
  const { study: studyIdParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Now includes studies the caller collaborates on, not just owns — see
  // 008_study_collaborators.sql's broadened studies SELECT policy.
  const { data: studies } = await supabase
    .from("studies")
    .select("id, owner_id, stable_study_id, configuration_json")
    .order("created_at", { ascending: false })
    .returns<StudyListItem[]>();

  if (!studies || studies.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-16">
        <h1 className="text-2xl font-light" style={{ fontFamily: "var(--font-raleway)" }}>
          Research Team
        </h1>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Create a study first — then you can invite collaborators to it.
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedStudy = studies.find((s) => s.id === studyIdParam) ?? studies[0];

  const { data, error: teamError } = await supabase.rpc("get_study_team", { p_study_id: selectedStudy.id });
  const team = data as StudyTeamMember[] | null;

  // Falls back to the plain owner_id check when the RPC itself failed (most
  // likely because 008_study_collaborators.sql hasn't been applied to this
  // Supabase project yet — see the migrationNotApplied banner below) so an
  // owner still sees an accurate "you own this" message even though the
  // roster/invite UI can't actually work yet.
  const migrationNotApplied = !!teamError && /get_study_team|does not exist|could not find/i.test(teamError.message);
  const myMembership = team?.find((m) => m.user_id === user.id);
  const isOwner = myMembership?.is_owner ?? selectedStudy.owner_id === user.id;
  const canManage = isOwner || myMembership?.role === "admin";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-light" style={{ fontFamily: "var(--font-raleway)" }}>
          Research Team
        </h1>
        <StudyPicker
          selectedStudyId={selectedStudy.id}
          studies={studies.map((s) => ({
            id: s.id,
            label: s.configuration_json.identity.displayName || s.stable_study_id,
          }))}
        />
      </div>

      {migrationNotApplied && (
        <Alert variant="destructive">
          <AlertDescription>
            Research Team isn&apos;t set up yet — apply{" "}
            <code className="font-mono text-xs">
              supabase/control_backend/migrations/008_study_collaborators.sql
            </code>{" "}
            to your Supabase project to enable inviting and managing collaborators.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedStudy.configuration_json.identity.displayName || selectedStudy.stable_study_id}
          </CardTitle>
          <CardDescription>
            {canManage
              ? "Invite collaborators and manage their access to this study."
              : "You can view this study's team. Only its owner and admins can manage access."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!team ? (
            <p className="text-sm text-muted-foreground">
              {migrationNotApplied
                ? "The team roster needs the migration above applied before it can load."
                : "Couldn't load the team for this study."}
            </p>
          ) : (
            <TeamRoster
              studyId={selectedStudy.id}
              team={team}
              currentUserId={user.id}
              isOwner={isOwner}
              canManage={canManage}
            />
          )}
        </CardContent>
      </Card>

      {canManage && team && (
        <Card>
          <CardHeader>
            <CardTitle>Invite someone</CardTitle>
            <CardDescription>
              They&apos;ll get an email with a link to accept. If they don&apos;t have an Inoxity account yet,
              they&apos;ll be prompted to create one first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteForm studyId={selectedStudy.id} />
          </CardContent>
        </Card>
      )}

      <Button variant="ghost" nativeButton={false} render={<Link href="/dashboard" />} className="self-start">
        Back to dashboard
      </Button>
    </div>
  );
}
