"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { declineStudyInvite } from "@/lib/team-actions";
import { teamInitialState } from "@/lib/team-action-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DeclineInviteControl({
  token,
  studyDisplayName,
  onDeclined,
}: {
  token: string;
  studyDisplayName: string;
  onDeclined: () => void;
}) {
  const [state, formAction, isPending] = useActionState(declineStudyInvite, teamInitialState);
  const [open, setOpen] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      setOpen(false);
      if (state.success) {
        onDeclined();
      }
    }
    wasPending.current = isPending;
  }, [isPending, state.error, state.success, onDeclined]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" />}>Decline</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decline this invite?</DialogTitle>
          <DialogDescription>
            You&apos;ll no longer be invited to {studyDisplayName}. Whoever invited you can send a new invite later
            if this was a mistake.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="token" value={token} />
          {state.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Declining…" : "Decline invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
