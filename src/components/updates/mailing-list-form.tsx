"use client";

import { useActionState } from "react";
import { joinMailingList } from "@/lib/mailing-list-actions";
import { authInitialState } from "@/lib/auth-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function MailingListForm() {
  const [state, formAction, isPending] = useActionState(joinMailingList, authInitialState);

  if (state.success) {
    return (
      <Alert>
        <AlertDescription>
          You&apos;re on the list! We&apos;ll email you when Inoxity is ready, along with occasional updates.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="firstName">First name (optional)</FieldLabel>
          <Input id="firstName" name="firstName" autoComplete="given-name" maxLength={100} />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.edu" required />
        </Field>

        {/* Honeypot — hidden from people and screen readers; see joinMailingList(). */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Joining…" : "Join the mailing list"}
        </Button>
      </FieldGroup>
    </form>
  );
}
