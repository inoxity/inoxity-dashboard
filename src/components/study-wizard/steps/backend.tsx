"use client";

import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { StudyConfiguration } from "@/lib/study-schema";
import { generateStudyBackendSQL } from "@/lib/generate-backend-sql";
import { TextField } from "../field-primitives";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

function downloadSetupSQL(config: StudyConfiguration) {
  const sql = generateStudyBackendSQL(config);
  const blob = new Blob([sql], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${config.identity.id || "study"}-backend-setup.sql`;
  link.click();
  URL.revokeObjectURL(url);
}

// dataBackend lives inside configuration_json itself
// (studies.configuration_json.dataBackend, see
// control_backend/migrations/007_data_backend_in_json.sql) — not a
// separate study_backends table. Each research team provisions and owns
// its own Supabase project; the dashboard only ever holds its public URL +
// anon key, never admin access.
export function StepBackend() {
  const { control, getValues, setValue } = useFormContext<StudyConfiguration>();
  const hasBackend = useWatch({ control, name: "dataBackend.enabled" }) === true;
  // Turning the switch off is the one action on this step that risks a researcher's own mistake
  // during a live demo/session breaking their study's connection to real participant data — see
  // the toggle-data-loss incident this guards against. Confirm before it takes effect; turning it
  // back on is always immediate, no confirmation needed.
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Your team must have its own Supabase project for collecting participant data (enrollments, survey
        responses, health data) — Inoxity never provides a shared one, so no one but your team can ever see
        your participants&apos; data. Turn this on once that project exists, or leave it off and save as a
        draft — you can add it later by editing the study, but activation is blocked until a backend is
        linked.
      </p>
      <div>
        <Button type="button" variant="outline" onClick={() => downloadSetupSQL(getValues())}>
          Download setup SQL
        </Button>
        <FieldDescription>
          Generates the full Supabase setup script for this study (schema, RLS, RPCs, and — if HealthKit is
          enabled — a samples table narrowed to the data types configured earlier) so you don&apos;t have to
          copy it by hand. Paste the whole thing into a brand-new Supabase project&apos;s SQL Editor. The
          script is clearly split into a REQUIRED section (apply as-is — the app depends on it) and an
          OPTIONAL security-hardening section your team owns and can edit or remove; Inoxity isn&apos;t
          responsible for your project&apos;s security configuration beyond what&apos;s required for the
          app to function.
        </FieldDescription>
      </div>
      <Controller
        control={control}
        name="dataBackend"
        render={({ field }) => (
          <>
            <Field orientation="horizontal">
              <Switch
                id="dataBackend.enabled"
                checked={hasBackend}
                onCheckedChange={(checked) => {
                  if (!checked) {
                    // Don't touch form state yet — only the dialog's own Confirm button does
                    // that, so a Cancel (or dismissing the dialog) leaves everything exactly as
                    // it was.
                    setConfirmDisableOpen(true);
                    return;
                  }
                  field.onChange({
                    enabled: true,
                    backendId: field.value?.backendId ?? "",
                    supabaseUrl: field.value?.supabaseUrl ?? "",
                    supabaseAnonKey: field.value?.supabaseAnonKey ?? "",
                    // Always Production — Development/Staging only ever matter for the
                    // Inoxity team's own internal test builds, never a real study, and
                    // picking the wrong one here silently breaks enrollment for real
                    // participants (see BackendDomain.swift's crossEnvironmentDescriptor
                    // check in the iOS app). Not worth exposing as a researcher choice.
                    environment: field.value?.environment ?? "Production",
                  });
                }}
              />
              <div className="flex flex-col gap-0.5">
                <FieldLabel htmlFor="dataBackend.enabled" className="border-0 p-0">
                  This study has a Data Backend
                </FieldLabel>
                <FieldDescription>
                  A dedicated Supabase project for this study&apos;s participant data.
                </FieldDescription>
              </div>
            </Field>
            <Dialog open={confirmDisableOpen} onOpenChange={setConfirmDisableOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Disable Data Backend?</DialogTitle>
                  <DialogDescription>
                    This study won&apos;t be activatable until you turn it back on. Your saved backend ID,
                    project URL, and anon key are kept as-is — not deleted — so you won&apos;t have to
                    re-enter them if you turn this back on later.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      field.onChange({
                        enabled: false,
                        backendId: field.value?.backendId ?? "",
                        supabaseUrl: field.value?.supabaseUrl ?? "",
                        supabaseAnonKey: field.value?.supabaseAnonKey ?? "",
                        environment: field.value?.environment ?? "Production",
                      });
                      setConfirmDisableOpen(false);
                    }}
                  >
                    Disable
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      />
      {hasBackend && (
        <>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <TextField
                name="dataBackend.backendId"
                label="Backend ID (UUID)"
                description="The same UUID you seed into that project's study_backend_metadata.backend_instance_id — generate one here, or paste your own."
                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setValue("dataBackend.backendId", crypto.randomUUID(), { shouldValidate: true, shouldDirty: true })
              }
            >
              Generate
            </Button>
          </div>
          <TextField
            name="dataBackend.supabaseUrl"
            label="Supabase Project URL"
            placeholder="https://your-project.supabase.co"
          />
          <TextField
            name="dataBackend.supabaseAnonKey"
            label="Supabase Anon Key"
            type="password"
            description="The public anon/publishable key from your project's Settings → API — never the service_role key."
            placeholder="eyJhbGciOi..."
          />
        </>
      )}
    </div>
  );
}
