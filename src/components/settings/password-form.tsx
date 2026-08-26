"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword } from "@/lib/settings-actions";
import { authInitialState } from "@/lib/auth-state";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, authInitialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <PasswordInput id="password" name="password" autoComplete="new-password" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
          <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required />
        </Field>

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state.success && (
          <Alert>
            <AlertDescription>Password updated.</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Updating…" : "Update password"}
        </Button>
      </FieldGroup>
    </form>
  );
}
