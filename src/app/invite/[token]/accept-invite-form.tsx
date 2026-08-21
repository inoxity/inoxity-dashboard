"use client";

import { useActionState } from "react";
import { acceptStudyInvite } from "@/lib/team-actions";
import { teamInitialState } from "@/lib/team-action-state";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(acceptStudyInvite, teamInitialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Accepting…" : "Accept invite"}
      </Button>
    </form>
  );
}
