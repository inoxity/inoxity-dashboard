"use client";

import { Controller, useFormContext, type FieldPath } from "react-hook-form";
import type { StudyConfiguration } from "@/lib/study-schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";

// Field names are accepted as plain strings rather than the strict
// `FieldPath<StudyConfiguration>` union: array-index paths built at render
// time (e.g. `surveys.${index}.id`) widen to `string`, and re-deriving a
// precise literal type for every call site across ~15 nested schema
// sections isn't worth the ceremony. `asPath` below is safe as long as
// callers only pass paths that actually exist on the schema.
type Path = string;
type TypedPath = FieldPath<StudyConfiguration>;
function asPath(name: Path): TypedPath {
  return name as TypedPath;
}

function errorAt(errors: unknown, path: string): { message?: string } | undefined {
  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = errors;
  for (const part of parts) {
    if (!node) return undefined;
    node = node[part];
  }
  return node;
}

export function TextField({
  name,
  label,
  description,
  placeholder,
  type = "text",
}: {
  name: Path;
  label: string;
  description?: string;
  placeholder?: string;
  type?: string;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<StudyConfiguration>();
  const error = errorAt(errors, name);

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input id={name} type={type} placeholder={placeholder} {...register(asPath(name))} />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={error ? [error] : undefined} />
    </Field>
  );
}

export function NumberField({
  name,
  label,
  description,
  min,
  max,
}: {
  name: Path;
  label: string;
  description?: string;
  min?: number;
  max?: number;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<StudyConfiguration>();
  const error = errorAt(errors, name);

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        id={name}
        type="number"
        min={min}
        max={max}
        {...register(asPath(name), { valueAsNumber: true })}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={error ? [error] : undefined} />
    </Field>
  );
}

export function TextareaField({
  name,
  label,
  description,
  placeholder,
  rows = 3,
}: {
  name: Path;
  label: string;
  description?: string;
  placeholder?: string;
  rows?: number;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<StudyConfiguration>();
  const error = errorAt(errors, name);

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Textarea id={name} rows={rows} placeholder={placeholder} {...register(asPath(name))} />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={error ? [error] : undefined} />
    </Field>
  );
}

export function SwitchField({
  name,
  label,
  description,
}: {
  name: Path;
  label: string;
  description?: string;
}) {
  const { control } = useFormContext<StudyConfiguration>();

  return (
    <Controller
      control={control}
      name={asPath(name)}
      render={({ field }) => (
        <Field orientation="horizontal">
          <Switch id={name} checked={!!field.value} onCheckedChange={field.onChange} />
          <div className="flex flex-col gap-0.5">
            <FieldLabel htmlFor={name} className="border-0 p-0">
              {label}
            </FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
          </div>
        </Field>
      )}
    />
  );
}

export function CheckboxField({ name, label }: { name: Path; label: string }) {
  const { control } = useFormContext<StudyConfiguration>();

  return (
    <Controller
      control={control}
      name={asPath(name)}
      render={({ field }) => (
        <Field orientation="horizontal">
          <Checkbox id={name} checked={!!field.value} onCheckedChange={field.onChange} />
          <FieldLabel htmlFor={name} className="border-0 p-0">
            {label}
          </FieldLabel>
        </Field>
      )}
    />
  );
}

export function SelectField({
  name,
  label,
  description,
  options,
  placeholder,
}: {
  name: Path;
  label: string;
  description?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext<StudyConfiguration>();
  const error = errorAt(errors, name);

  return (
    <Controller
      control={control}
      name={asPath(name)}
      render={({ field }) => (
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          {/* `items` is what lets <Select.Value> show the matched option's label in
              the trigger for a value that came from state (e.g. editing an existing
              reminder) rather than a fresh click — without it, it falls back to
              displaying the raw stored value until the popup has been opened once. */}
          <Select
            items={options}
            value={(field.value as string) ?? null}
            onValueChange={(value) => field.onChange(value)}
          >
            <SelectTrigger id={name} className="w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={error ? [error] : undefined} />
        </Field>
      )}
    />
  );
}

// For fields typed `string | null` in the schema where a blank input should
// serialize as null rather than "" (dates, optional URLs/patterns) — plain
// register() can't do that conversion, so these go through Controller.
export function NullableTextField({
  name,
  label,
  description,
  placeholder,
  type = "text",
}: {
  name: Path;
  label: string;
  description?: string;
  placeholder?: string;
  type?: string;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext<StudyConfiguration>();
  const error = errorAt(errors, name);

  return (
    <Controller
      control={control}
      name={asPath(name)}
      render={({ field }) => (
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input
            id={name}
            type={type}
            placeholder={placeholder}
            value={(field.value as string) ?? ""}
            onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
            onBlur={field.onBlur}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={error ? [error] : undefined} />
        </Field>
      )}
    />
  );
}

export function NullableTextareaField({
  name,
  label,
  description,
  placeholder,
  rows = 3,
}: {
  name: Path;
  label: string;
  description?: string;
  placeholder?: string;
  rows?: number;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext<StudyConfiguration>();
  const error = errorAt(errors, name);

  return (
    <Controller
      control={control}
      name={asPath(name)}
      render={({ field }) => (
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Textarea
            id={name}
            rows={rows}
            placeholder={placeholder}
            value={(field.value as string) ?? ""}
            onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
            onBlur={field.onBlur}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={error ? [error] : undefined} />
        </Field>
      )}
    />
  );
}

export function NullableNumberField({
  name,
  label,
  description,
  min,
}: {
  name: Path;
  label: string;
  description?: string;
  min?: number;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext<StudyConfiguration>();
  const error = errorAt(errors, name);

  return (
    <Controller
      control={control}
      name={asPath(name)}
      render={({ field }) => (
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input
            id={name}
            type="number"
            min={min}
            value={field.value === null || field.value === undefined ? "" : String(field.value)}
            onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
            onBlur={field.onBlur}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={error ? [error] : undefined} />
        </Field>
      )}
    />
  );
}

// schedule.startDate/endDate etc. — `yyyy-MM-dd` string or null.
export function DateField({
  name,
  label,
  description,
}: {
  name: Path;
  label: string;
  description?: string;
}) {
  return <NullableTextField name={name} label={label} description={description} type="date" />;
}

export function CheckboxGroupField({
  name,
  label,
  description,
  options,
}: {
  name: Path;
  label: string;
  description?: string;
  options: { value: string; label: string }[];
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext<StudyConfiguration>();
  const error = errorAt(errors, name);

  return (
    <Controller
      control={control}
      name={asPath(name)}
      render={({ field }) => {
        const values: string[] = Array.isArray(field.value) ? (field.value as string[]) : [];
        function toggle(value: string, checked: boolean) {
          field.onChange(checked ? [...values, value] : values.filter((v) => v !== value));
        }
        return (
          <Field data-invalid={!!error}>
            <FieldLabel>{label}</FieldLabel>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {options.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-sm"
                >
                  <Checkbox
                    checked={values.includes(option.value)}
                    onCheckedChange={(checked) => toggle(option.value, !!checked)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError errors={error ? [error] : undefined} />
          </Field>
        );
      }}
    />
  );
}

// Same value shape/toggle logic as CheckboxGroupField, but options are split into collapsible
// `<details>` sections instead of one flat grid — for the HealthKit step's ~117 options, a flat
// grid is too long to scan. Each section starts open only if it already has a selection in it
// (computed fresh each render from `values`, not tracked as separate component state) — since
// that computed boolean only changes the moment a group's selection count crosses zero, a
// researcher's own manual open/close via the native <summary> toggle isn't fought by re-renders
// from checking boxes elsewhere. Plain `groups`/CheckboxGroupField's flat `options` are kept as
// two separate components rather than one with an optional `groups` prop — the three other
// (short, flat) callers of CheckboxGroupField don't need this complexity.
export function GroupedCheckboxGroupField({
  name,
  label,
  description,
  groups,
}: {
  name: Path;
  label: string;
  description?: string;
  groups: { label: string; options: { value: string; label: string }[] }[];
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext<StudyConfiguration>();
  const error = errorAt(errors, name);

  return (
    <Controller
      control={control}
      name={asPath(name)}
      render={({ field }) => {
        const values: string[] = Array.isArray(field.value) ? (field.value as string[]) : [];
        function toggle(value: string, checked: boolean) {
          field.onChange(checked ? [...values, value] : values.filter((v) => v !== value));
        }
        return (
          <Field data-invalid={!!error}>
            <FieldLabel>{label}</FieldLabel>
            <div className="space-y-2">
              {groups.map((group) => {
                const selectedCount = group.options.filter((option) => values.includes(option.value)).length;
                return (
                  <details key={group.label} open={selectedCount > 0} className="rounded-lg border border-border">
                    <summary className="flex cursor-pointer select-none items-center justify-between px-3 py-2 text-sm font-medium">
                      <span>{group.label}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {selectedCount > 0 ? `${selectedCount} of ${group.options.length} selected` : `${group.options.length} types`}
                      </span>
                    </summary>
                    <div className="grid grid-cols-1 gap-2 border-t border-border p-3 sm:grid-cols-2">
                      {group.options.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-sm"
                        >
                          <Checkbox
                            checked={values.includes(option.value)}
                            onCheckedChange={(checked) => toggle(option.value, !!checked)}
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </details>
                );
              })}
            </div>
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError errors={error ? [error] : undefined} />
          </Field>
        );
      }}
    />
  );
}

export { errorAt, asPath };
