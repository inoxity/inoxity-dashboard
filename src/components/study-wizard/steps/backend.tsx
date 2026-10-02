"use client";

import { useState, useTransition } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { StudyConfiguration } from "@/lib/study-schema";
import { generateStudyBackendSQL } from "@/lib/generate-backend-sql";
import { testDataBackendConnection } from "@/lib/study-actions";
import type { BackendCheckResult } from "@/lib/backend-connection-check";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

function downloadSetupSQL(config: StudyConfiguration, part: "structure" | "security") {
  const sql = generateStudyBackendSQL(config)[part];
  const blob = new Blob([sql], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const studyId = config.identity.id?.trim() || "study";
  link.download = part === "structure" ? `${studyId}-1-structure.sql` : `${studyId}-2-security.sql`;
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
  const [connection, setConnection] = useState<BackendCheckResult | null>(null);
  const [isTesting, startTesting] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Your team must have its own Supabase project for collecting participant data (enrollments, survey
        responses, health data) — Inoxity never provides a shared one, so no one but your team can ever see
        your participants&apos; data. Turn this on once that project exists, or leave it off and save as a
        draft — you can add it later by editing the study, but activation is blocked until a backend is
        linked.
      </p>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Set up your Supabase project</p>
        <FieldDescription>
          Generated for this study (including only the Apple Health data types and features it uses). In a
          brand-new Supabase project&apos;s SQL Editor, run file 1 first, then file 2.
        </FieldDescription>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => downloadSetupSQL(getValues(), "structure")}>
            1. Download database structure SQL
          </Button>
          <Button type="button" variant="outline" onClick={() => downloadSetupSQL(getValues(), "security")}>
            2. Download security SQL
          </Button>
        </div>
        <FieldDescription>
          <strong>File 1, database structure:</strong> the tables and functions the Inoxity app needs to store
          and sync your study&apos;s data. <strong>File 2, security:</strong> a starting template of the access
          rules the app needs. Don&apos;t skip it: without it, your tables are readable by anyone with the
          project&apos;s anon key.
        </FieldDescription>
        <FieldDescription>
          <strong>Important note:</strong> The Inoxity team does not provide or take responsibility for the
          security of your study&apos;s database. Security rules must be developed based on study-specific and
          institutional policies, so that they align with your study&apos;s requirements, including data
          sensitivity, regulatory compliance (e.g., IRB, HIPAA), and ethical guidelines. The security file is a
          template to get you started; your team should review and adapt it. For an overview, see
          Supabase&apos;s{" "}
          <a
            href="https://supabase.com/docs/guides/database/postgres/row-level-security"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Row Level Security guide
          </a>
          .
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
            description="Just the project address, ending in .supabase.co, with nothing after it (no /rest/v1/)."
            placeholder="https://your-project.supabase.co"
          />
          <TextField
            name="dataBackend.supabaseAnonKey"
            label="Supabase Anon Key"
            type="password"
            description="The public anon/publishable key from your project's Settings → API — never the service_role key."
            placeholder="eyJhbGciOi..."
          />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="self-start"
              disabled={isTesting}
              onClick={() =>
                startTesting(async () => {
                  setConnection(null);
                  setConnection(await testDataBackendConnection(getValues()));
                })
              }
            >
              {isTesting ? "Testing…" : "Test connection"}
            </Button>
            <FieldDescription>
              Connects to your project the way the app does when a participant enrolls, and checks that its
              Backend ID, study ID, and enrollment code match this study. Each test leaves one empty anonymous
              user in your project&apos;s Authentication list.
            </FieldDescription>
            {connection?.status === "ok" && (
              <Alert>
                <AlertDescription>Connected. Your Supabase project matches this study.</AlertDescription>
              </Alert>
            )}
            {connection?.status === "problem" && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="flex list-disc flex-col gap-1 pl-4">
                    {connection.messages.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {connection?.status === "unverified" && (
              <Alert>
                <AlertDescription>{connection.message}</AlertDescription>
              </Alert>
            )}
          </div>
        </>
      )}
    </div>
  );
}
