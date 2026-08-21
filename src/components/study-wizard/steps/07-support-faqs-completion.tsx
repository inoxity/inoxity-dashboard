"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import type { StudyConfiguration } from "@/lib/study-schema";
import { TextField, TextareaField, NullableTextField, SwitchField } from "../field-primitives";
import { FieldGroup, FieldSet, FieldLegend, FieldDescription } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function StepSupportFaqsCompletion() {
  const { control } = useFormContext<StudyConfiguration>();
  const { fields, append, remove } = useFieldArray({ control, name: "faqs" });

  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend variant="label">Support</FieldLegend>
        <TextField name="support.name" label="Support team name" />
        <TextField name="support.email" label="Support email" type="email" />
        <NullableTextField name="support.phone" label="Phone (optional)" />
        <NullableTextField
          name="support.website"
          label="Website (optional)"
          placeholder="https://example.edu/study"
        />
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">FAQs</FieldLegend>
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">FAQ {index + 1}</p>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)}>
                <Trash2 className="text-destructive" />
              </Button>
            </div>
            <div className="flex flex-col gap-4">
              <TextField name={`faqs.${index}.id`} label="FAQ ID" />
              <TextField name={`faqs.${index}.question`} label="Question" />
              <TextareaField name={`faqs.${index}.answer`} label="Answer" rows={2} />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => append({ id: "", question: "", answer: "" })}>
          Add FAQ
        </Button>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Completion</FieldLegend>
        <FieldDescription>
          Shown once, as a full-screen takeover, the first time a participant opens the app after their
          participant duration (set on the Basics step) has elapsed. Only applies to studies with a fixed
          duration — open-ended studies never show this. If &quot;App access remains available&quot; is off, the
          participant is locked to Settings and About after they continue past this screen.
        </FieldDescription>
        <TextField name="completion.title" label="Title" />
        <TextareaField name="completion.message" label="Message" rows={2} />
        <NullableTextField
          name="completion.redirectURL"
          label="Redirect URL (optional)"
          placeholder="https://example.edu/thank-you"
        />
        <FieldDescription>
          If set, opened in the participant&apos;s browser right after they tap Continue on the completion screen
          (e.g. an external survey-credit or debrief page). Leave blank to just dismiss the screen.
        </FieldDescription>
        <SwitchField name="completion.appAccessRemainsAvailable" label="App access remains available after completion" />
        <FieldDescription>
          Off means the participant can still open the app afterward, but only to reach Settings and About —
          useful if they might still need to contact your team or withdraw. On leaves every tab available as
          normal.
        </FieldDescription>
      </FieldSet>
    </FieldGroup>
  );
}
