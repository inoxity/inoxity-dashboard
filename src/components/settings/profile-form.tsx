"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/settings-actions";
import { authInitialState } from "@/lib/auth-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ProfileForm({ fullName, institution }: { fullName: string; institution: string | null }) {
  const [state, formAction, isPending] = useActionState(updateProfile, authInitialState);

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="fullName">Full name</FieldLabel>
          <Input id="fullName" name="fullName" defaultValue={fullName} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="institution">Institution (optional)</FieldLabel>
          <Input id="institution" name="institution" defaultValue={institution ?? ""} />
        </Field>

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state.success && (
          <Alert>
            <AlertDescription>Saved.</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </FieldGroup>
    </form>
  );
}
