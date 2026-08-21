"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/auth-actions";
import { authInitialState } from "@/lib/auth-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    login,
    authInitialState
  );

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email address</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </Field>

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </FieldGroup>
    </form>
  );
}

// Kept as a sibling export rendered outside <LoginForm>'s own <form>
// (see login/page.tsx) rather than nested inside it — a browser's saved-
// credential autofill can attach submit/keydown handling scoped to the
// nearest ancestor form, and this link previously sat inside the same
// <form> as the password field and submit button, which was the likely
// cause of "Sign up" sometimes logging the user in instead of navigating.
export function LoginFormFooter() {
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Don&apos;t have an account?{" "}
      <Link href="/signup" className="text-primary hover:underline">
        Sign up
      </Link>
    </p>
  );
}
