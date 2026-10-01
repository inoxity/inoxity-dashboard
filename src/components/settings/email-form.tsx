"use client";

import { useActionState } from "react";
import { changeEmail } from "@/lib/settings-actions";
import { authInitialState } from "@/lib/auth-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function EmailForm() {
  const [state, formAction, isPending] = useActionState(changeEmail, authInitialState);

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">New email address</FieldLabel>
          <Input id="email" name="email" type="email" placeholder="you@example.edu" required />
          <FieldDescription>
            We&apos;ll send confirmation links to both your current and new address — nothing changes until you
            click the one in the new address&apos;s inbox.
          </FieldDescription>
        </Field>

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state.success && (
          <Alert>
            <AlertDescription>
              Check both your current and new email for a confirmation link to finish the change.
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Sending…" : "Change email"}
        </Button>
      </FieldGroup>
    </form>
  );
}
