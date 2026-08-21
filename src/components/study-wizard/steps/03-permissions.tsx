"use client";

import { useFormContext } from "react-hook-form";
import { HEALTHKIT_LABELS, HEALTHKIT_CATEGORIES, type StudyConfiguration } from "@/lib/study-schema";
import { SwitchField, TextareaField, GroupedCheckboxGroupField, NullableNumberField } from "../field-primitives";
import { FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field";

const HEALTHKIT_GROUPS = HEALTHKIT_CATEGORIES.map((category) => ({
  label: category.label,
  options: category.identifiers.map((id) => ({ value: id, label: HEALTHKIT_LABELS[id] })),
}));

export function StepPermissions() {
  const { watch } = useFormContext<StudyConfiguration>();
  const healthKitEnabled = watch("healthKit.enabled");
  const notificationsEnabled = watch("notifications.enabled");

  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend variant="label">Apple Health</FieldLegend>
        <SwitchField name="healthKit.enabled" label="Read Apple Health data" />
        {healthKitEnabled && (
          <>
            <TextareaField
              name="healthKit.rationale"
              label="Rationale shown to participants"
              rows={2}
              placeholder="With your permission, this study reads sleep analysis and resting heart rate from Apple Health…"
            />
            <GroupedCheckboxGroupField
              name="healthKit.identifiers"
              label="Data types to request"
              description="Only checked types are requested from participants — everything else in Apple Health stays untouched. IRB/consent approval for whichever types you pick is your team's responsibility, not something this dashboard enforces."
              groups={HEALTHKIT_GROUPS}
            />
            <SwitchField
              name="healthKit.includeCharacteristics"
              label="Also request biological sex, blood type, date of birth, skin type, and wheelchair use"
              description="These are one-time facts (not an ongoing data stream), read once and synced to this study's own Data Backend as a single record per participant — not a growing time series like the data types above. Off by default; only turn this on if your study's consent materials specifically disclose collecting these."
            />
            <NullableNumberField
              name="healthKit.backfillDays"
              label="Historical backfill window (days)"
              description="How far back to collect existing Apple Health data on first sync, counting back from enrollment. Leave blank for full history (as far back as data exists, or your study's start date)."
              min={1}
            />
          </>
        )}
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Notifications</FieldLegend>
        <SwitchField name="notifications.enabled" label="Allow notifications" />
        {notificationsEnabled && (
          <TextareaField
            name="notifications.rationale"
            label="Rationale shown to participants"
            rows={2}
            placeholder="Optional reminders can let you know when an Inoxity activity is available."
          />
        )}
      </FieldSet>
    </FieldGroup>
  );
}
