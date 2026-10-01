import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import type { ActivationIssue } from "@/lib/activation-check";

function groupByStep(issues: ActivationIssue[]): [string, string[]][] {
  const groups = new Map<string, string[]>();
  for (const issue of issues) {
    groups.set(issue.step, [...(groups.get(issue.step) ?? []), issue.message]);
  }
  return [...groups.entries()];
}

function IssueGroup({ issues, tone }: { issues: ActivationIssue[]; tone: "blocker" | "warning" }) {
  const Icon = tone === "blocker" ? CircleAlert : TriangleAlert;
  return (
    <div className="flex flex-col gap-3">
      {groupByStep(issues).map(([step, messages]) => (
        <div key={step}>
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">{step}</p>
          <ul className="mt-1 flex flex-col gap-1.5">
            {messages.map((message) => (
              <li key={message} className="flex gap-2 text-sm">
                <Icon
                  className={tone === "blocker" ? "mt-0.5 size-4 shrink-0 text-destructive" : "mt-0.5 size-4 shrink-0 text-accent"}
                  aria-hidden
                />
                <span>{message}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// Blockers ("must fix") and warnings ("check this") from checkActivationReadiness or the live
// Data Backend check, grouped by the wizard step where each one gets fixed.
export function ActivationChecklist({
  blockers,
  warnings,
  readyMessage = "No problems found — participants will be able to enroll once this study is active.",
}: {
  blockers: ActivationIssue[];
  warnings: ActivationIssue[];
  readyMessage?: string;
}) {
  if (blockers.length === 0 && warnings.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm">
        <CircleCheck className="size-4 shrink-0 text-primary" aria-hidden />
        {readyMessage}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {blockers.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Must fix before participants can enroll</p>
          <IssueGroup issues={blockers} tone="blocker" />
        </div>
      )}
      {warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Worth checking</p>
          <IssueGroup issues={warnings} tone="warning" />
        </div>
      )}
    </div>
  );
}
