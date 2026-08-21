"use client";

import { useFormContext } from "react-hook-form";
import type { StudyConfiguration } from "@/lib/study-schema";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2 last:border-0">
      <p className="text-xs uppercase tracking-[0.06em] text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export function StepReview() {
  const { getValues } = useFormContext<StudyConfiguration>();
  const values = getValues();

  return (
    <Tabs defaultValue="summary">
      <TabsList>
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="json">Raw JSON</TabsTrigger>
      </TabsList>
      <TabsContent value="summary">
        <div className="flex flex-col gap-2">
          <Row label="Display name" value={values.identity.displayName || "—"} />
          <Row label="Study ID / Code" value={`${values.identity.id || "—"} / ${values.identity.code || "—"}`} />
          <Row label="Status" value={<Badge>{values.status.state}</Badge>} />
          <Row
            label="Schedule"
            value={
              values.schedule.openEnded
                ? "Open-ended"
                : `${values.schedule.startDate ?? "—"} → ${values.schedule.endDate ?? "—"}`
            }
          />
          <Row
            label="Participant duration"
            value={
              values.schedule.participantDurationDays
                ? `${values.schedule.participantDurationDays} day(s) per participant`
                : "Open-ended (no fixed length per participant)"
            }
          />
          <Row label="Onboarding pages" value={`${values.onboarding.pages.length} page(s)`} />
          <Row
            label="HealthKit"
            value={values.healthKit.enabled ? `${values.healthKit.identifiers.length} data type(s)` : "Disabled"}
          />
          <Row
            label="Surveys"
            value={`${values.surveys.length} survey(s), ${values.surveys.filter((s) => s.sendNotificationOnOpen).length} auto-notify on open`}
          />
          <Row label="Reminders" value={`${values.reminders.length} reminder(s)`} />
          <Row
            label="Media"
            value={values.media.enabled ? `${values.media.categories.length} categor(y/ies)` : "Disabled"}
          />
          <Row label="FAQs" value={`${values.faqs.length} item(s)`} />
          <Row label="Support email" value={values.support.email || "—"} />
        </div>
      </TabsContent>
      <TabsContent value="json">
        <pre className="max-h-[32rem] overflow-auto rounded-lg bg-muted p-4 text-xs">
          {JSON.stringify(values, null, 2)}
        </pre>
      </TabsContent>
    </Tabs>
  );
}
