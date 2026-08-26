"use client";

import { useActionState } from "react";
import { resendConfirmationEmail } from "@/lib/auth-actions";
import { authInitialState } from "@/lib/auth-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Shown instead of blocking sign-in outright — see setStudyActive() in
// study-actions.ts for the actual enforcement point. Institutional mail
// (.edu especially) can silently hold or drop our confirmation emails for
// reasons outside our control, so a hard login block would strand users
// who did nothing wrong; this keeps the account usable while still
// requiring a confirmed email before anything participant-facing goes live.
export function EmailConfirmationBanner() {
  const [state, formAction, isPending] = useActionState(resendConfirmationEmail, authInitialState);

  return (
    <Alert>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
        <span>
          {state.success
            ? "Confirmation email sent — check your inbox."
            : "Please confirm your email address. You can browse and edit studies, but you won't be able to activate one until it's confirmed."}
        </span>
        {!state.success && (
          <form action={formAction}>
            <Button type="submit" variant="outline" size="sm" disabled={isPending}>
              {isPending ? "Sending…" : "Resend confirmation email"}
            </Button>
          </form>
        )}
        {state.error && <span className="w-full text-destructive text-sm">{state.error}</span>}
      </AlertDescription>
    </Alert>
  );
}
