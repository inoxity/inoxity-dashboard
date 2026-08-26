"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, resendConfirmationEmail } from "@/lib/auth-actions";
import { authInitialState } from "@/lib/auth-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    login,
    authInitialState
  );
  // Separate action/state from login's own — Supabase blocks
  // signInWithPassword() for an unconfirmed account before any session
  // exists, so this is the only place that flow is reachable pre-login
  // (see EmailConfirmationBanner for the already-signed-in case). A
  // second, sibling <form> rather than nesting inside the login form,
  // both because nested <form> elements are invalid HTML and for the same
  // autofill-scoping reason LoginFormFooter below is kept separate.
  const [resendState, resendAction, resendPending] = useActionState(
    resendConfirmationEmail,
    authInitialState
  );

  return (
    <>
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
            <PasswordInput
              id="password"
              name="password"
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

      {state.unconfirmedEmail && (
        <Alert className="mt-4">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            {resendState.success ? (
              <span>Confirmation email sent — check your inbox.</span>
            ) : (
              <>
                <span>Didn&apos;t get the confirmation email?</span>
                <form action={resendAction}>
                  <input type="hidden" name="email" value={state.unconfirmedEmail} />
                  <Button type="submit" variant="outline" size="sm" disabled={resendPending}>
                    {resendPending ? "Sending…" : "Resend confirmation email"}
                  </Button>
                </form>
              </>
            )}
            {resendState.error && <span className="w-full text-destructive text-sm">{resendState.error}</span>}
          </AlertDescription>
        </Alert>
      )}
    </>
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
