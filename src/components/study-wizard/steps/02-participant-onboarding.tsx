"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import type { StudyConfiguration } from "@/lib/study-schema";
import {
  TextField,
  TextareaField,
  NumberField,
  SwitchField,
  NullableTextField,
} from "../field-primitives";
import { SymbolPickerField } from "../symbol-picker-field";
import { FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function StepParticipantOnboarding() {
  const { control } = useFormContext<StudyConfiguration>();
  const { fields, append, remove } = useFieldArray({ control, name: "onboarding.pages" });

  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend variant="label">Participant ID</FieldLegend>
        <TextField name="participantID.label" label="Label" placeholder="SONA ID" />
        <TextField name="participantID.prompt" label="Prompt" placeholder="Enter your SONA ID" />
        <TextField name="participantID.placeholder" label="Input placeholder" placeholder="e.g. 123456" />
        <TextareaField name="participantID.helpText" label="Help text" rows={2} />
        <SwitchField name="participantID.required" label="Required" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField name="participantID.minimumLength" label="Minimum length" min={0} />
          <NumberField name="participantID.maximumLength" label="Maximum length" min={1} />
        </div>
        <NullableTextField
          name="participantID.allowedPattern"
          label="Allowed pattern (optional regex)"
          description="A regular expression the ID must fully match, on top of the length rules above — not instead of them. Example: ^[0-9]{4,6}$ requires a 4-6 digit numeric ID. Leave blank to skip this extra check."
          placeholder="^[0-9]{1,6}$"
        />
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Onboarding pages</FieldLegend>
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Page {index + 1}</p>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)}>
                <Trash2 className="text-destructive" />
              </Button>
            </div>
            <div className="flex flex-col gap-4">
              <TextField name={`onboarding.pages.${index}.id`} label="Page ID" placeholder="sleep-purpose" />
              <TextField name={`onboarding.pages.${index}.title`} label="Title" />
              <TextareaField name={`onboarding.pages.${index}.body`} label="Body" rows={2} />
              <SymbolPickerField name={`onboarding.pages.${index}.symbol`} label="Symbol" />
              <SwitchField name={`onboarding.pages.${index}.enabled`} label="Enabled" />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({ id: "", title: "", body: "", symbol: "", enabled: true })
          }
        >
          Add onboarding page
        </Button>
      </FieldSet>
    </FieldGroup>
  );
}
