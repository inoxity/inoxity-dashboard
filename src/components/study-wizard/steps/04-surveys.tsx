"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import type { StudyConfiguration } from "@/lib/study-schema";
import {
  TextField,
  TextareaField,
  SwitchField,
  SelectField,
  NumberField,
  NullableNumberField,
  NullableTextField,
  NullableTextareaField,
  DateField,
} from "../field-primitives";
import { ScheduleFields } from "./schedule-fields";
import { FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

// A separate component (not inlined in StepSurveys' .map()) so its useWatch is safely scoped to
// one survey row — calling hooks directly inside a .map() callback in the parent would violate
// the Rules of Hooks once append()/remove() change the array length between renders. Mirrors how
// ScheduleFields is already split out for the same reason.
function SurveyNotificationFields({ index }: { index: number }) {
  const { control } = useFormContext<StudyConfiguration>();
  const sendNotificationOnOpen = useWatch({ control, name: `surveys.${index}.sendNotificationOnOpen` }) === true;

  return (
    <>
      <SwitchField
        name={`surveys.${index}.sendNotificationOnOpen`}
        label="Send notification when survey opens"
        description="Schedules a local notification automatically at this survey's own schedule above — no separate Reminder needed. If a Reminder below is already linked to this survey, that Reminder takes priority and this is skipped to avoid double-notifying."
      />
      {sendNotificationOnOpen && (
        <>
          <NullableTextField
            name={`surveys.${index}.notificationTitle`}
            label="Notification title (optional)"
            placeholder="e.g. Morning check-in is available"
            description="Leave blank to use a default derived from the survey's name."
          />
          <NullableTextField
            name={`surveys.${index}.notificationBody`}
            label="Notification message (optional)"
            placeholder="e.g. Tap to open it now."
          />
        </>
      )}
    </>
  );
}

export function StepSurveys() {
  const { control } = useFormContext<StudyConfiguration>();
  const { fields, append, remove } = useFieldArray({ control, name: "surveys" });
  const sleepScheduleEnabled = useWatch({ control, name: "sleepSchedule.enabled" }) === true;

  return (
    <FieldGroup>
      {fields.map((field, index) => (
        <FieldSet key={field.id} className="rounded-lg border border-border p-4">
          <div className="mb-1 flex items-center justify-between">
            <FieldLegend variant="label">Survey {index + 1}</FieldLegend>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)}>
              <Trash2 className="text-destructive" />
            </Button>
          </div>
          <TextField name={`surveys.${index}.id`} label="Survey ID" placeholder="morning-checkin" />
          <SwitchField name={`surveys.${index}.enabled`} label="Enabled" />
          <TextField name={`surveys.${index}.name`} label="Name" placeholder="Morning check-in" />
          <TextareaField name={`surveys.${index}.description`} label="Description" rows={2} />
          <TextField
            name={`surveys.${index}.url`}
            label="Survey URL (HTTPS only)"
            placeholder="https://example.edu/surveys/morning"
          />
          <SelectField
            name={`surveys.${index}.presentationMode`}
            label="Presentation"
            options={[
              { value: "externalBrowser", label: "External browser" },
              { value: "inAppBrowser", label: "In-app browser" },
            ]}
          />
          <ScheduleFields basePath={`surveys.${index}.schedule`} sleepScheduleEnabled={sleepScheduleEnabled} allowRandomWindow />
          <div className="grid grid-cols-2 gap-4">
            <NumberField
              name={`surveys.${index}.availabilityWindow.opensMinutesBefore`}
              label="Opens N minutes before"
              min={0}
              max={1440}
            />
            <NumberField
              name={`surveys.${index}.availabilityWindow.closesMinutesAfter`}
              label="Closes N minutes after"
              min={0}
              max={1440}
            />
          </div>
          <NullableNumberField
            name={`surveys.${index}.promptExpirationMinutes`}
            label="Mark missed if not opened within N minutes (optional)"
            description="A softer, adherence-tracking deadline — can be shorter than “Closes N minutes after” above, which still governs whether the survey can actually be opened/completed. Leave blank to rely on that closing time alone. Counts from whichever moment the survey opens, whether the participant taps a notification or opens it from the Surveys tab directly."
            min={1}
          />
          <SwitchField
            name={`surveys.${index}.completionCallback.enabled`}
            label="Enable completion callback"
            description="Lets the survey redirect back into the app when the participant finishes, so Inoxity knows it's complete. Turn off only if your survey tool can't call back into the app — the app will never learn it's done otherwise, and participants would need to return manually."
          />
          <NullableTextareaField name={`surveys.${index}.instructions`} label="Instructions (optional)" rows={2} />
          <NullableTextareaField name={`surveys.${index}.privacyText`} label="Privacy text (optional)" rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <DateField
              name={`surveys.${index}.activeStartDate`}
              label="Active from (optional)"
              description="Leave both blank to run for this survey's full enrollment window. Set both to restrict it to a phase of your study (e.g. only weeks 3–5)."
            />
            <DateField name={`surveys.${index}.activeEndDate`} label="Active until (optional)" />
          </div>
          <SurveyNotificationFields index={index} />
        </FieldSet>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            id: "",
            enabled: true,
            name: "",
            description: "",
            url: "",
            presentationMode: "externalBrowser",
            schedule: { pattern: "daily", date: null, hour: 9, minute: 0, weekdays: [], anchor: "clockTime", offsetMinutes: null },
            availabilityWindow: { opensMinutesBefore: 180, closesMinutesAfter: 180 },
            completionCallback: { enabled: true },
            instructions: null,
            privacyText: null,
            activeStartDate: null,
            activeEndDate: null,
            sendNotificationOnOpen: false,
            notificationTitle: null,
            notificationBody: null,
            promptExpirationMinutes: null,
          })
        }
      >
        Add survey
      </Button>
    </FieldGroup>
  );
}
