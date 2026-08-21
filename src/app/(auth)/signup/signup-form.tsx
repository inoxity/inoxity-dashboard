"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/lib/auth-actions";
import { authInitialState } from "@/lib/auth-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(
    signup,
    authInitialState
  );

  if (state.success) {
    return (
      <Alert>
        <AlertDescription>
          Check your email to confirm your account, then come back and sign
          in.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email address *</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password *</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <FieldDescription>At least 8 characters.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="fullName">Full name *</FieldLabel>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            required
            autoComplete="name"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="institution">
            Research lab or institution
          </FieldLabel>
          <Input
            id="institution"
            name="institution"
            type="text"
            autoComplete="organization"
          />
        </Field>

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </FieldGroup>
    </form>
  );
}

// Sibling export, rendered outside <SignupForm>'s own <form> — same
// autofill-safety reasoning as LoginFormFooter in login-form.tsx.
export function SignupFormFooter() {
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Already have an account?{" "}
      <Link href="/login" className="text-primary hover:underline">
        Sign in
      </Link>
    </p>
  );
}
