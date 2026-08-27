import Link from "next/link";
import { ChevronRight, FlaskConical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface StudyListCardData {
  id: string;
  displayName: string;
  studyCode: string;
  createdAt: string;
  isActive: boolean;
  archivedAt: string | null;
}

// No per-study icon/emoji field exists in the study schema (only
// onboarding.pages[].symbol, which is participant-facing per-page, not a
// study-level identity field) — every card gets the same generic icon.
export function StudyListCard({
  study,
  roleLabel,
  muted,
}: {
  study: StudyListCardData;
  roleLabel: string | null; // null when the current user owns this study
  muted?: boolean;
}) {
  const statusLabel = study.archivedAt ? "Archived" : study.isActive ? "Active" : "Draft";
  const statusVariant = study.archivedAt ? "outline" : study.isActive ? "default" : "secondary";

  return (
    <Link href={`/dashboard/studies/${study.id}`}>
      <Card
        className={cn(
          "flex-row items-center justify-between gap-4 px-4 transition-colors hover:border-primary/40",
          muted && "opacity-70 grayscale-[.3]",
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FlaskConical className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-medium">{study.displayName}</span>
              {roleLabel && <Badge variant="outline">{roleLabel}</Badge>}
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              Code: {study.studyCode} · Created {new Date(study.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Card>
    </Link>
  );
}
