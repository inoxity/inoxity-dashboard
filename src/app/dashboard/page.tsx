import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { ComponentType } from "react";
import { FolderKanban, Activity, FileClock, Archive, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HeroOrbits } from "@/components/dashboard/hero-orbits";
import { StudyListCard, type StudyListCardData } from "@/components/dashboard/study-list-card";
import { ArchivedStudiesSection } from "@/components/dashboard/archived-studies-section";
import { ROLE_LABELS, type CollaboratorRole, type Profile, type Study } from "@/lib/supabase/types";

export const metadata = {
  title: "Dashboard — Inoxity",
};

type StudyListItem = Pick<
  Study,
  | "id"
  | "owner_id"
  | "stable_study_id"
  | "study_code"
  | "is_active"
  | "archived_at"
  | "configuration_json"
  | "created_at"
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
  // Captured as its own binding (rather than reading user.id directly
  // inside toCardData below) — TS's control-flow narrowing from the
  // `!user` check above doesn't persist into a closure, but a plain
  // `string` local does.
  const currentUserId = user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, institution")
    .eq("id", user.id)
    .single<Pick<Profile, "full_name" | "institution">>();

  // No owner_id filter — includes studies the caller collaborates on too,
  // not just owns (see 008_study_collaborators.sql's broadened studies
  // SELECT policy). A separate query below fills in each card's role badge.
  const { data: studies } = await supabase
    .from("studies")
    .select(
      "id, owner_id, stable_study_id, study_code, is_active, archived_at, configuration_json, created_at",
    )
    .order("created_at", { ascending: false })
    .returns<StudyListItem[]>();

  const { data: myCollaborations } = await supabase
    .from("study_collaborators")
    .select("study_id, role")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null);
  const roleByStudyId = new Map((myCollaborations ?? []).map((c) => [c.study_id, c.role as CollaboratorRole]));

  const allStudies = studies ?? [];
  // Total counts everything a researcher has ever created, including
  // archived ones — Active/Draft explicitly exclude archived, since an
  // archived study is always inactive and shouldn't double-count as Draft.
  const activeStudies = allStudies.filter((s) => s.is_active && !s.archived_at);
  const draftStudies = allStudies.filter((s) => !s.is_active && !s.archived_at);
  const archivedStudies = allStudies.filter((s) => s.archived_at);
  const visibleStudies = [...activeStudies, ...draftStudies];

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "Researcher";

  function toCardData(study: StudyListItem): StudyListCardData & { roleLabel: string | null } {
    return {
      id: study.id,
      displayName: study.configuration_json.identity.displayName || study.stable_study_id,
      studyCode: study.study_code,
      createdAt: study.created_at,
      isActive: study.is_active,
      archivedAt: study.archived_at,
      roleLabel: study.owner_id !== currentUserId ? ROLE_LABELS[roleByStudyId.get(study.id) ?? "viewer"] : null,
    };
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12">
      <div className="relative isolate overflow-hidden rounded-2xl py-14">
        <HeroOrbits className="opacity-70" />
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">Welcome to your</p>
          <h1 className="text-4xl font-light sm:text-5xl" style={{ fontFamily: "var(--font-raleway)" }}>
            Researcher Dashboard, <span className="text-primary">{firstName}</span>
          </h1>
          <Image src="/inoxity-brain.png" alt="" width={96} height={96} aria-hidden className="my-1" />
          <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
            Durable by design. Open by nature. Driven by curiosity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FolderKanban} label="Total Studies" value={allStudies.length} caption="All studies you've created" />
        <StatCard icon={Activity} label="Active Studies" value={activeStudies.length} caption="Currently running" />
        <StatCard icon={FileClock} label="Draft Studies" value={draftStudies.length} caption="In progress" />
        <StatCard icon={Archive} label="Archived Studies" value={archivedStudies.length} caption="No longer active" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-light" style={{ fontFamily: "var(--font-raleway)" }}>
            Your Studies
          </h2>
          <Button nativeButton={false} render={<Link href="/dashboard/studies/new" />}>
            Create New Study
          </Button>
        </div>

        {visibleStudies.length === 0 && archivedStudies.length === 0 ? (
          <Card>
            <div className="px-4 py-10 text-center text-muted-foreground">
              No studies yet — create your first one to get started.
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleStudies.map((study) => {
              const data = toCardData(study);
              return <StudyListCard key={study.id} study={data} roleLabel={data.roleLabel} />;
            })}
          </div>
        )}

        <ArchivedStudiesSection studies={archivedStudies.map(toCardData)} />
      </div>

      <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
        <HelpCircle className="size-4" />
        Need help? Check out our{" "}
        <Link href="/dashboard/docs" className="text-primary hover:underline">
          Documentation
        </Link>{" "}
        or reach out to your research team.
      </p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  caption: string;
}) {
  return (
    <Card className="gap-3 px-4">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-2xl font-medium">{value}</span>
        <span className="text-xs text-muted-foreground">{caption}</span>
      </div>
    </Card>
  );
}
