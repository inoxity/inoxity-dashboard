"use client";

import { useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import type { StudyConfiguration } from "@/lib/study-schema";
import {
  TextField,
  TextareaField,
  SwitchField,
  SelectField,
  NumberField,
  NullableTextField,
  NullableTextareaField,
  DateField,
} from "../field-primitives";
import { ScheduleFields } from "./schedule-fields";
import { FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Check, Copy, Trash2 } from "lucide-react";
import {
  buildCompletionTestLink,
  COMPLETION_EMBEDDED_DATA_FIELDS,
  QUALTRICS_REDIRECT_VALUE,
  TEST_REDIRECT_URL,
} from "@/lib/survey-completion-setup";

const COMPLETION_TRACKING_DOCS_URL = "https://inoxity.readthedocs.io/en/latest/studies/survey-completion-tracking/";

// A value an RA pastes into their survey tool. Copying it avoids typos in names that must match
// exactly (e.g. inoxity_callback_url).
function CopyableValue({ value, wrap = false }: { value: string; wrap?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be refused (e.g. an insecure context); the value is still selectable.
    }
  }
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <code className={`min-w-0 flex-1 rounded bg-muted px-2 py-1 font-mono text-xs ${wrap ? "break-all" : "truncate"}`}>
        {value}
      </code>
      <Button type="button" variant="outline" size="xs" onClick={copy}>
        {copied ? <Check /> : <Copy />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

// Split out for the same Rules-of-Hooks reason as SurveyNotificationFields below.
function SurveyCompletionTrackingFields({ index }: { index: number }) {
  const { control } = useFormContext<StudyConfiguration>();
  const enabled = useWatch({ control, name: `surveys.${index}.completionCallback.enabled` }) === true;
  const surveyURL = useWatch({ control, name: `surveys.${index}.url` }) as string | undefined;
  const testLink = buildCompletionTestLink(surveyURL);

  return (
    <>
      <SwitchField
        name={`surveys.${index}.completionCallback.enabled`}
        label="Track completion (survey redirects back to Inoxity)"
        description="When a participant finishes, the survey redirects back to the app, which records it as completed. Needs a one-time setup in your survey tool (see below). Turn off only if your survey tool can't redirect to a URL at the end. The app then only records when each survey was started, and shows a started survey as “Done” (not “Expired”) once its window closes."
      />
      {enabled && (
        <details className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <summary className="cursor-pointer font-medium">How to set this up in Qualtrics</summary>
          <ol className="mt-3 list-decimal space-y-4 pl-5">
            <li>
              In <strong>Survey flow</strong>, add an <strong>Embedded Data</strong> element at the very top (above
              all questions) with these four fields. Leave their values blank; Qualtrics fills them in from the
              survey link.
              {COMPLETION_EMBEDDED_DATA_FIELDS.map((field) => (
                <CopyableValue key={field} value={field} />
              ))}
            </li>
            <li>
              In <strong>Survey options → End of survey</strong>, choose <strong>Redirect to a URL</strong> and enter:
              <CopyableValue value={QUALTRICS_REDIRECT_VALUE} />
            </li>
            <li>
              <strong>Publish</strong> the survey. Qualtrics only uses published changes.
            </li>
            <li>
              <strong>Test it:</strong> open this link in a browser and finish the survey. You should end up on{" "}
              <code className="font-mono text-xs">{TEST_REDIRECT_URL.replace("https://", "")}</code>, and the
              response in Qualtrics should show <code className="font-mono text-xs">inoxity_occurrence_id</code> ={" "}
              <code className="font-mono text-xs">test-occurrence-1</code>. Delete the test response afterwards.
              {testLink ? (
                <CopyableValue value={testLink} wrap />
              ) : (
                <p className="mt-1.5 text-muted-foreground">Enter the survey URL above to get a test link.</p>
              )}
            </li>
          </ol>
          <p className="mt-4 text-muted-foreground">
            Other survey tools work too if they can save link parameters and redirect to a URL at the end.{" "}
            <a href={COMPLETION_TRACKING_DOCS_URL} target="_blank" rel="noreferrer" className="underline">
              Full guide
            </a>
          </p>
        </details>
      )}
    </>
  );
}

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
          <SurveyCompletionTrackingFields index={index} />
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
