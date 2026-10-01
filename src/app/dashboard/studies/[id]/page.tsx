import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ActivateStudyControl } from "@/components/study-wizard/activate-study-control";
import { ArchiveStudyControl } from "@/components/study-wizard/archive-study-control";
import { DeleteStudyControl } from "@/components/study-wizard/delete-study-control";
import { ActivationChecklist } from "@/components/study-wizard/activation-checklist";
import { checkActivationReadiness } from "@/lib/activation-check";
import type { CollaboratorRole, Study } from "@/lib/supabase/types";

export const metadata = {
  title: "Study — Inoxity",
};

export default async function StudyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // No owner_id filter — RLS now also allows accepted collaborators to
  // view this row (see 008_study_collaborators.sql). canEdit below governs
  // which controls actually render.
  const { data: study } = await supabase.from("studies").select("*").eq("id", id).single<Study>();

  if (!study) {
    notFound();
  }

  const isOwner = study.owner_id === user.id;
  let role: "owner" | CollaboratorRole = "owner";
  if (!isOwner) {
    const { data: membership } = await supabase
      .from("study_collaborators")
      .select("role")
      .eq("study_id", id)
      .eq("user_id", user.id)
      .not("accepted_at", "is", null)
      .maybeSingle();
    role = (membership?.role as CollaboratorRole | undefined) ?? "viewer";
  }
  const canEdit = role === "owner" || role === "admin" || role === "editor";
  // Tighter than canEdit — archiving removes a study from the whole
  // team's default dashboard view, not just a personal edit.
  const canArchive = role === "owner" || role === "admin";

  const config = study.configuration_json;
  // Offline checks only (no live Data Backend test on page load — that runs on Activate).
  const readiness = checkActivationReadiness(config);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
            {study.study_code}
          </p>
          <h1 className="mt-1 text-2xl font-light" style={{ fontFamily: "var(--font-raleway)" }}>
            {config.identity.displayName || study.stable_study_id}
          </h1>
        </div>
        <Badge variant={study.archived_at ? "outline" : study.is_active ? "default" : "secondary"}>
          {study.archived_at ? "Archived" : study.is_active ? "Active" : "Draft"}
        </Badge>
      </div>

      {!config.dataBackend?.enabled && (
        <Alert variant="destructive">
          <AlertDescription>
            No Data Backend linked yet — this study can&apos;t be activated until your team&apos;s
            Supabase project details are added. Edit the study and fill in the Data Backend step.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 py-4 text-sm">
          <Row label="Study status (wizard)" value={config.status.state} />
          <Row label="Data Backend" value={config.dataBackend?.enabled ? "Linked" : "Not linked yet"} />
          <Row
            label="Schedule"
            value={
              config.schedule.openEnded
                ? "Open-ended"
                : `${config.schedule.startDate ?? "—"} → ${config.schedule.endDate ?? "—"}`
            }
          />
          <Row label="Surveys" value={`${config.surveys.length} survey(s)`} />
          <Row label="Reminders" value={`${config.reminders.length} reminder(s)`} />
          <Row label="Configuration revision" value={String(study.configuration_revision)} />
          <Row label="Enrollment opens" value={study.enrollment_opens_at ?? "—"} />
          <Row label="Enrollment closes" value={study.enrollment_closes_at ?? "—"} />
        </CardContent>
      </Card>

      {!study.archived_at && (
        <Card>
          <CardHeader>
            <CardTitle>{study.is_active ? "Enrollment check" : "Ready to activate?"}</CardTitle>
            <CardDescription>
              Checked against the same rules the Inoxity app uses when a participant enrolls. Your Data
              Backend connection is also tested when you click Activate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivationChecklist
              blockers={readiness.blockers}
              warnings={readiness.warnings}
              readyMessage={
                study.is_active
                  ? "No problems found — participants can enroll."
                  : "No problems found — participants will be able to enroll once this study is active."
              }
            />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {canEdit && (
          <>
            <ActivateStudyControl studyId={study.id} isActive={study.is_active} warnings={readiness.warnings} />
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/dashboard/studies/${study.id}/edit`} />}
            >
              Edit draft
            </Button>
          </>
        )}
        {canArchive && (
          <ArchiveStudyControl
            studyId={study.id}
            isArchived={!!study.archived_at}
            isActive={study.is_active}
          />
        )}
        <Button variant="outline" nativeButton={false} render={<Link href={`/dashboard/team?study=${study.id}`} />}>
          Manage team
        </Button>
        <Button variant="ghost" nativeButton={false} render={<Link href="/dashboard" />}>
          Back to dashboard
        </Button>
      </div>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>Permanently delete this study and its team roster.</CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteStudyControl studyId={study.id} isActive={study.is_active} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
