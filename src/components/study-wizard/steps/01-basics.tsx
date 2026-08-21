"use client";

import { Controller, useFormContext } from "react-hook-form";
import type { StudyConfiguration } from "@/lib/study-schema";
import { START_DATE_MODES, START_DATE_MODE_LABELS } from "@/lib/study-schema";
import { TextField, TextareaField, SelectField, SwitchField, DateField, NullableNumberField } from "../field-primitives";
import { FieldGroup, FieldSet, FieldLegend, FieldLabel, FieldDescription, Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

export function StepBasics() {
  const { watch, control } = useFormContext<StudyConfiguration>();
  const openEnded = watch("schedule.openEnded");
  const startDateMode = watch("schedule.startDateMode");
  const sleepScheduleEnabled = watch("sleepSchedule.enabled") === true;

  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend variant="label">Identity</FieldLegend>
        <TextField
          name="identity.id"
          label="Study ID"
          description="Lowercase letters, numbers, hyphens — this is a permanent internal identifier (e.g. sleep-cognition-v2)."
          placeholder="sleep-cognition-v2"
        />
        <TextField
          name="identity.code"
          label="Enrollment code"
          description="The code participants type into the app to enroll (normalized to uppercase)."
          placeholder="SLEEP01"
        />
        <TextField name="identity.displayName" label="Display name" placeholder="Sleep & Cognitive Performance Study" />
        <TextField name="identity.shortName" label="Short name" placeholder="Sleep Study" />
        <TextField name="identity.welcomeTitle" label="Welcome title" placeholder="Rest, reflect, and learn" />
        <TextareaField
          name="identity.welcomeMessage"
          label="Welcome message"
          placeholder="Help us understand how everyday sleep relates to attention and wellbeing."
        />
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Status</FieldLegend>
        <SelectField
          name="status.state"
          label="Study status"
          description={'The app rejects every participant unless this is "Active" — regardless of the Activate toggle on the study page.'}
          options={[
            { value: "active", label: "Active" },
            { value: "paused", label: "Paused" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
        <TextField name="status.message" label="Status message (optional)" placeholder="Shown to participants when paused" />
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Schedule</FieldLegend>
        <SwitchField
          name="schedule.openEnded"
          label="Open-ended"
          description="If off, both a start and end date are required."
        />
        {(!openEnded || startDateMode === "fixed") && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateField name="schedule.startDate" label="Start date" />
            {!openEnded && <DateField name="schedule.endDate" label="End date" />}
          </div>
        )}
        <SelectField
          name="schedule.startDateMode"
          label={'"Day 1" is measured from'}
          description="How each participant's day-in-study count is anchored — see the option descriptions. Editing this does not change any participant's data retroactively, only how new day numbers are computed going forward."
          options={START_DATE_MODES.map((value) => ({ value, label: START_DATE_MODE_LABELS[value] }))}
        />
        <NullableNumberField
          name="schedule.participantDurationDays"
          label="Participant duration (days)"
          description={
            'How many days each participant is in the study, counting from their own enrollment date — not this study\'s start/end dates above, which don\'t apply per participant under rolling enrollment. Leave blank for an open-ended/rolling study with no fixed length: the app shows "Day X in the study" instead of "Day X of N" and never fabricates a completion percentage.'
          }
          min={1}
        />
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Sleep schedule</FieldLegend>
        <Controller
          control={control}
          name="sleepSchedule"
          render={({ field }) => (
            <Field orientation="horizontal">
              <Switch
                id="sleepSchedule.enabled"
                checked={field.value?.enabled === true}
                // Always keeps the object (and whatever labels were already typed) around,
                // regardless of which way `enabled` flips — turning this off no longer nulls out
                // the whole field, which used to silently discard any custom prompt/wake/bed text
                // the moment it was saved while off. See the schema comment on `sleepSchedule`.
                onCheckedChange={(checked) =>
                  field.onChange({
                    enabled: checked,
                    promptTitle: field.value?.promptTitle || "Set your sleep schedule",
                    wakeLabel: field.value?.wakeLabel || "What time do you usually wake up?",
                    bedLabel: field.value?.bedLabel || "What time do you usually go to bed?",
                  })
                }
              />
              <div className="flex flex-col gap-0.5">
                <FieldLabel htmlFor="sleepSchedule.enabled" className="border-0 p-0">
                  Collect a sleep schedule
                </FieldLabel>
                <FieldDescription>
                  Ask participants for their wake/bed time during onboarding, so survey and reminder
                  schedules can be anchored to it (e.g. &quot;8 hours after wake time&quot;) instead of a
                  fixed clock time. Editable later from Settings.
                </FieldDescription>
              </div>
            </Field>
          )}
        />
        {sleepScheduleEnabled && (
          <>
            <TextField name="sleepSchedule.promptTitle" label="Onboarding screen title" placeholder="Set your sleep schedule" />
            <TextField name="sleepSchedule.wakeLabel" label="Wake time question" placeholder="What time do you usually wake up?" />
            <TextField name="sleepSchedule.bedLabel" label="Bed time question" placeholder="What time do you usually go to bed?" />
          </>
        )}
      </FieldSet>
    </FieldGroup>
  );
}
