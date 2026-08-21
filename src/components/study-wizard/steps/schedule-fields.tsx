"use client";

import { useEffect } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { StudyConfiguration } from "@/lib/study-schema";
import { SCHEDULE_ANCHOR_LABELS, SCHEDULE_ANCHORS } from "@/lib/study-schema";
import { SelectField, NumberField, NullableNumberField, DateField, asPath } from "../field-primitives";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";

const WEEKDAYS = [
  { value: 1, label: "Sun" },
  { value: 2, label: "Mon" },
  { value: 3, label: "Tue" },
  { value: 4, label: "Wed" },
  { value: 5, label: "Thu" },
  { value: 6, label: "Fri" },
  { value: 7, label: "Sat" },
];

// Shared by surveys[].schedule and message-kind reminders[].schedule — both
// are the same ReminderScheduleConfiguration shape in the Zod/Swift schema.
// `sleepScheduleEnabled` gates the wake/bed anchor picker: the schema only
// allows a non-clockTime anchor when the study's sleepSchedule is enabled
// (see `checkScheduleAnchor` in study-schema.ts), so the picker stays hidden
// (and the schedule stays plain clock time) until that's turned on.
// `allowRandomWindow`: the EMA-style "randomWindow" pattern is available for both a survey's own
// schedule and a message reminder's schedule — both 04-surveys.tsx and 05-reminders.tsx pass this
// true. Defaults to false only so any future caller of ScheduleFields that shouldn't offer it
// (there's none today) doesn't have to opt out explicitly. Mirrored server-side by the top-level
// superRefine in study-schema.ts and by StudyConfigurationValidator.swift's `allowsRandomWindow`
// parameter, both of which allow it for surveys and message reminders alike.
export function ScheduleFields({
  basePath,
  sleepScheduleEnabled,
  allowRandomWindow = false,
}: {
  basePath: string;
  sleepScheduleEnabled: boolean;
  allowRandomWindow?: boolean;
}) {
  const { control, setValue, getValues } = useFormContext<StudyConfiguration>();
  const pattern = useWatch({ control, name: asPath(`${basePath}.pattern`) }) as
    | "oneTime"
    | "daily"
    | "selectedWeekdays"
    | "randomWindow"
    | undefined;
  const anchor = useWatch({ control, name: asPath(`${basePath}.anchor`) }) as
    | (typeof SCHEDULE_ANCHORS)[number]
    | undefined;
  const usesAnchor = sleepScheduleEnabled && anchor && anchor !== "clockTime";
  const isRandomWindow = pattern === "randomWindow";

  useEffect(() => {
    if (pattern === "daily") {
      setValue(asPath(`${basePath}.date`), null);
      setValue(asPath(`${basePath}.weekdays`), []);
    } else if (pattern === "oneTime") {
      setValue(asPath(`${basePath}.weekdays`), []);
    } else if (pattern === "selectedWeekdays") {
      setValue(asPath(`${basePath}.date`), null);
    } else if (pattern === "randomWindow") {
      // hour/minute/anchor/offsetMinutes are meaningless for this pattern (kept only for
      // structural parity with Swift's ReminderScheduleConfiguration, which still requires the
      // keys) — pin them to the same "plain clock time, unused" shape every time this pattern is
      // selected, and seed the window fields with DOSE-style example defaults if they're not
      // already set (e.g. re-opening an existing randomWindow schedule for editing).
      setValue(asPath(`${basePath}.date`), null);
      setValue(asPath(`${basePath}.weekdays`), []);
      setValue(asPath(`${basePath}.anchor`), "clockTime");
      setValue(asPath(`${basePath}.offsetMinutes`), null);
      setValue(asPath(`${basePath}.hour`), 0);
      setValue(asPath(`${basePath}.minute`), 0);
      const current = getValues(asPath(basePath)) as { windowCount?: number; windowStartHour?: number; windowLengthHours?: number };
      if (current.windowCount == null) setValue(asPath(`${basePath}.windowCount`), 3);
      if (current.windowStartHour == null) setValue(asPath(`${basePath}.windowStartHour`), 8);
      if (current.windowLengthHours == null) setValue(asPath(`${basePath}.windowLengthHours`), 4);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern]);

  useEffect(() => {
    if (!sleepScheduleEnabled && anchor && anchor !== "clockTime") {
      setValue(asPath(`${basePath}.anchor`), "clockTime");
      setValue(asPath(`${basePath}.offsetMinutes`), null);
    } else if (anchor === "clockTime") {
      setValue(asPath(`${basePath}.offsetMinutes`), null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleepScheduleEnabled, anchor]);

  return (
    <div className="flex flex-col gap-4">
      <SelectField
        name={`${basePath}.pattern`}
        label="Repeats"
        options={[
          { value: "oneTime", label: "One time" },
          { value: "daily", label: "Daily" },
          { value: "selectedWeekdays", label: "Selected weekdays" },
          ...(allowRandomWindow ? [{ value: "randomWindow", label: "Random time within daily windows (EMA)" }] : []),
        ]}
      />
      {pattern === "oneTime" && <DateField name={`${basePath}.date`} label="Date" />}
      {isRandomWindow ? (
        <>
          <p className="text-sm text-muted-foreground">
            Every day, split into this many equal-length windows starting at the hour below — one
            notification fires at a random time inside each window. The same day always randomizes
            to the same times (it won&apos;t reshuffle itself later), but different days differ.
            Commonly used for Ecological Momentary Assessment (EMA) prompting.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <NumberField name={`${basePath}.windowCount`} label="Number of windows per day" min={1} max={10} />
            <NumberField name={`${basePath}.windowStartHour`} label="First window starts (hour, 0-23)" min={0} max={23} />
            <NumberField name={`${basePath}.windowLengthHours`} label="Window length (hours)" min={1} max={24} />
          </div>
          <p className="text-xs text-muted-foreground">
            Window count × window length can&apos;t exceed 24. Keep the total across all of this
            study&apos;s enabled random-window reminders modest — each one adds up to one
            notification per window per day against iOS&apos;s limit on how many can be scheduled
            at once.
          </p>
        </>
      ) : (
        <>
          {sleepScheduleEnabled && (
            <SelectField
              name={`${basePath}.anchor`}
              label="Time is relative to"
              options={SCHEDULE_ANCHORS.map((value) => ({ value, label: SCHEDULE_ANCHOR_LABELS[value] }))}
            />
          )}
          {usesAnchor ? (
            <NullableNumberField
              name={`${basePath}.offsetMinutes`}
              label="Offset (minutes)"
              description="Positive = after the anchor time, negative = before. E.g. 480 = 8 hours after wake time; -90 = 90 minutes before bedtime."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <NumberField name={`${basePath}.hour`} label="Hour (0-23)" min={0} max={23} />
              <NumberField name={`${basePath}.minute`} label="Minute (0-59)" min={0} max={59} />
            </div>
          )}
        </>
      )}
      {pattern === "selectedWeekdays" && (
        <Controller
          control={control}
          name={asPath(`${basePath}.weekdays`)}
          render={({ field }) => {
            const values: number[] = Array.isArray(field.value) ? (field.value as number[]) : [];
            return (
              <Field>
                <FieldLabel>Weekdays</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => (
                    <label
                      key={day.value}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-sm"
                    >
                      <Checkbox
                        checked={values.includes(day.value)}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? [...values, day.value] : values.filter((v) => v !== day.value))
                        }
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </Field>
            );
          }}
        />
      )}
    </div>
  );
}
