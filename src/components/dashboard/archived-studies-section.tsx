"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudyListCard, type StudyListCardData } from "@/components/dashboard/study-list-card";

export function ArchivedStudiesSection({
  studies,
}: {
  studies: (StudyListCardData & { roleLabel: string | null })[];
}) {
  const [open, setOpen] = useState(false);

  if (studies.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        {studies.length} archived {studies.length === 1 ? "study" : "studies"}
      </button>
      {open && (
        <div className="flex flex-col gap-3">
          {studies.map((study) => (
            <StudyListCard key={study.id} study={study} roleLabel={study.roleLabel} muted />
          ))}
        </div>
      )}
    </div>
  );
}
