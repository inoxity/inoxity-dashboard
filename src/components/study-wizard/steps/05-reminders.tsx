"use client";

import { useEffect, useRef } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import type { StudyConfiguration } from "@/lib/study-schema";
import { TextField, SwitchField, SelectField, NumberField, DateField, asPath } from "../field-primitives";
import { ScheduleFields } from "./schedule-fields";
import { FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

function ReminderRow({ index, remove }: { index: number; remove: (index: number) => void }) {
  const { control, setValue } = useFormContext<StudyConfiguration>();
  const kind = useWatch({ control, name: asPath(`reminders.${index}.kind`) }) as "survey" | "message" | undefined;
  const surveys = useWatch({ control, name: "surveys" });
  const sleepScheduleEnabled = useWatch({ control, name: "sleepSchedule.enabled" }) === true;

  // Only reset schedule/destination when `kind` actually *changes* — not on
  // initial mount. useEffect always fires once on mount regardless of its
  // dependency array, so without this guard, opening the Edit wizard on an
  // existing reminder would silently wipe a saved bedtime-relative schedule
  // (anchor: "bedTime", offsetMinutes: -N) back to the hardcoded 9am default
  // before the researcher had touched anything.
  const previousKind = useRef(kind);
  useEffect(() => {
    if (previousKind.current === kind) return;
    previousKind.current = kind;
    if (kind === "survey") {
      setValue(asPath(`reminders.${index}.schedule`), null);
      setValue(asPath(`reminders.${index}.destination`), "surveys");
    } else if (kind === "message") {
      setValue(asPath(`reminders.${index}.notifyMinutesBefore`), null);
      setValue(asPath(`reminders.${index}.schedule`), {
        pattern: "daily",
        date: null,
        hour: 9,
        minute: 0,
        weekdays: [],
        anchor: "clockTime",
        offsetMinutes: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  return (
    <FieldSet className="rounded-lg border border-border p-4">
      <div className="mb-1 flex items-center justify-between">
        <FieldLegend variant="label">Reminder {index + 1}</FieldLegend>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)}>
          <Trash2 className="text-destructive" />
        </Button>
      </div>
      <TextField name={`reminders.${index}.id`} label="Reminder ID" />
      <TextField name={`reminders.${index}.title`} label="Title" />
      <TextField name={`reminders.${index}.body`} label="Body" />
      <SwitchField name={`reminders.${index}.enabled`} label="Enabled" />
      <SelectField
        name={`reminders.${index}.kind`}
        label="Kind"
        options={[
          { value: "survey", label: "Survey reminder" },
          { value: "message", label: "Plain message" },
        ]}
      />
      {kind === "survey" ? (
        <>
          <SelectField
            name={`reminders.${index}.surveyID`}
            label="Target survey"
            placeholder="Choose a survey"
            options={(surveys ?? [])
              .filter((s) => s.enabled)
              .map((s) => ({ value: s.id, label: s.name || s.id }))}
          />
          <NumberField
            name={`reminders.${index}.notifyMinutesBefore`}
            label="Notify N minutes before survey opens"
            description={'Must be ≤ that survey\'s own "opens minutes before" value.'}
            min={0}
            max={1440}
          />
          <SelectField
            name={`reminders.${index}.destination`}
            label="Destination tab"
            options={[{ value: "surveys", label: "Surveys" }]}
          />
        </>
      ) : (
        <>
          <SelectField
            name={`reminders.${index}.destination`}
            label="Destination tab"
            options={[
              { value: "home", label: "Home" },
              { value: "surveys", label: "Surveys" },
              { value: "settings", label: "Settings" },
              { value: "aboutStudy", label: "About" },
            ]}
          />
          <ScheduleFields
            basePath={`reminders.${index}.schedule`}
            sleepScheduleEnabled={sleepScheduleEnabled}
            allowRandomWindow
          />
        </>
      )}
      <div className="grid grid-cols-2 gap-4">
        <DateField
          name={`reminders.${index}.activeStartDate`}
          label="Active from (optional)"
          description="Leave both blank to run for this reminder's full enrollment window. Set both to restrict it to a phase of your study (e.g. only weeks 3–5)."
        />
        <DateField name={`reminders.${index}.activeEndDate`} label="Active until (optional)" />
      </div>
    </FieldSet>
  );
}

export function StepReminders() {
  const { control } = useFormContext<StudyConfiguration>();
  const { fields, append, remove } = useFieldArray({ control, name: "reminders" });

  return (
    <FieldGroup>
      {fields.map((field, index) => (
        <ReminderRow key={field.id} index={index} remove={remove} />
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            id: "",
            title: "",
            body: "",
            enabled: true,
            kind: "message",
            surveyID: null,
            schedule: { pattern: "daily", date: null, hour: 9, minute: 0, weekdays: [], anchor: "clockTime", offsetMinutes: null },
            notifyMinutesBefore: null,
            destination: "home",
            activeStartDate: null,
            activeEndDate: null,
          })
        }
      >
        Add reminder
      </Button>
    </FieldGroup>
  );
}
