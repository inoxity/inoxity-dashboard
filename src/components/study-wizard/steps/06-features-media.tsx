"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { APP_TABS, APP_TAB_LABELS, type StudyConfiguration } from "@/lib/study-schema";
import {
  SwitchField,
  CheckboxGroupField,
  TextareaField,
  NumberField,
  NullableNumberField,
  TextField,
  DateField,
} from "../field-primitives";
import { FieldGroup, FieldSet, FieldLegend, FieldDescription } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const TAB_OPTIONS = APP_TABS.map((tab) => ({ value: tab, label: APP_TAB_LABELS[tab] }));
const MEDIA_TYPE_OPTIONS = [
  { value: "photo", label: "Photo" },
  { value: "video", label: "Video" },
];

export function StepFeaturesMedia() {
  const { control, watch, getValues } = useFormContext<StudyConfiguration>();
  const { fields, append, remove } = useFieldArray({ control, name: "media.categories" });
  const mediaUploadsEnabled = watch("features.mediaUploadsEnabled");
  const mediaEnabled = watch("media.enabled");

  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend variant="label">Features</FieldLegend>
        <SwitchField
          name="features.surveysEnabled"
          label="Surveys enabled"
          description="Master switch for the whole Surveys tab — turn this off to hide surveys from participants entirely, even if individual surveys below are still marked enabled."
        />
        <SwitchField
          name="features.mediaUploadsEnabled"
          label="Media uploads enabled"
          description='Requires "Enable media" below plus at least one accepted type.'
        />
        <CheckboxGroupField name="features.visibleTabs" label="Visible tabs" options={TAB_OPTIONS} />
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Media</FieldLegend>
        {mediaUploadsEnabled && !mediaEnabled && (
          <p className="text-sm text-destructive">
            Media uploads is on in Features — enable media below and pick at least one accepted type.
          </p>
        )}
        <SwitchField
          name="media.enabled"
          label="Enable media"
          description="Turns on media collection itself. The Media tab's visibility is controlled separately by 'Media uploads enabled' above."
        />
        {mediaEnabled && (
          <>
            <TextareaField name="media.instructions" label="Instructions" rows={2} />
            <TextareaField name="media.privacyText" label="Privacy text" rows={2} />
            <CheckboxGroupField name="media.acceptedTypes" label="Accepted types" options={MEDIA_TYPE_OPTIONS} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberField name="media.maximumTotalItems" label="Maximum total items" min={1} />
              <NumberField name="media.maximumFileSizeMB" label="Maximum file size (MB)" min={1} />
            </div>
            <NullableNumberField
              name="media.maximumVideoLengthSeconds"
              label="Maximum video length (seconds, optional)"
              min={1}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateField
                name="media.activeStartDate"
                label="Active from (optional)"
                description="Leave both blank to accept media for this study's full enrollment window. Set both to restrict it to a phase of your study (e.g. only weeks 3–5)."
              />
              <DateField name="media.activeEndDate" label="Active until (optional)" />
            </div>

            <FieldLegend variant="label">Categories</FieldLegend>
            <FieldDescription>
              Categories let you ask for different kinds of photos/videos separately — e.g. &quot;Sleep
              environment,&quot; &quot;Screen time,&quot; &quot;Meal photos.&quot; Each one shows up as its own
              option when the participant picks what to submit.
            </FieldDescription>
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">Category {index + 1}</p>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)}>
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
                <div className="flex flex-col gap-4">
                  <TextField name={`media.categories.${index}.id`} label="Category ID" placeholder="sleep-environment" />
                  <TextField name={`media.categories.${index}.displayName`} label="Display name" />
                  <TextareaField name={`media.categories.${index}.description`} label="Description" rows={2} />
                  <CheckboxGroupField
                    name={`media.categories.${index}.acceptedTypes`}
                    label="Accepted types"
                    description="Must be a subset of the study's accepted media types above."
                    options={MEDIA_TYPE_OPTIONS}
                  />
                  <NumberField name={`media.categories.${index}.maximumItems`} label="Maximum items" min={1} />
                  <SwitchField
                    name={`media.categories.${index}.representedDateRequired`}
                    label="Ask what date this represents"
                    description="Participants must specify what date this photo/video represents (e.g. 'this is my sleep environment as of Aug 3') before they can submit it."
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  id: "",
                  displayName: "",
                  description: "",
                  // Start from the study's own accepted types — the app rejects a category with none.
                  acceptedTypes: [...getValues("media.acceptedTypes")],
                  required: false,
                  maximumItems: 1,
                  representedDateRequired: false,
                })
              }
            >
              Add category
            </Button>
          </>
        )}
      </FieldSet>
    </FieldGroup>
  );
}
