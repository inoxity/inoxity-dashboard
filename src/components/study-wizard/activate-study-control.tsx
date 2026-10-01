"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { setStudyActive } from "@/lib/study-actions";
import { activateInitialState } from "@/lib/study-action-state";
import type { ActivationIssue } from "@/lib/activation-check";
import { ActivationChecklist } from "@/components/study-wizard/activation-checklist";
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

// `warnings` come from checkActivationReadiness on the study page, so they're visible before
// confirming. Blockers come back from setStudyActive itself (the server is the authority), which
// also runs the live Data Backend check.
export function ActivateStudyControl({
  studyId,
  isActive,
  warnings = [],
}: {
  studyId: string;
  isActive: boolean;
  warnings?: ActivationIssue[];
}) {
  const [state, formAction, isPending] = useActionState(setStudyActive, activateInitialState);
  const [open, setOpen] = useState(false);
  // The action result whose notice has already been read and dismissed — so reopening the
  // dialog later shows the normal form again rather than a stale notice.
  const [dismissedState, setDismissedState] = useState<typeof state | null>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    // Stay open when there's a notice to read (activated, but the backend couldn't be tested).
    if (wasPending.current && !isPending && !state.error && !state.notice) {
      setOpen(false);
    }
    wasPending.current = isPending;
  }, [isPending, state.error, state.notice]);

  const activated = !state.error && !!state.notice && dismissedState !== state;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && activated) setDismissedState(state);
        setOpen(next);
      }}
    >
      <DialogTrigger render={<Button variant={isActive ? "outline" : "default"} />}>
        {isActive ? "Deactivate" : "Activate"}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isActive && !activated ? "Deactivate this study?" : "Activate this study?"}</DialogTitle>
          <DialogDescription>
            {isActive && !activated
              ? "Participants will no longer be able to fetch this study's configuration."
              : "Before activating, Inoxity checks the study the same way the app does when a participant enrolls, and tests the connection to your Data Backend. The test leaves one empty anonymous user in your Supabase project's Authentication list."}
          </DialogDescription>
        </DialogHeader>
        {activated ? (
          <>
            <Alert className="mb-2">
              <AlertDescription>{state.notice}</AlertDescription>
            </Alert>
            <DialogFooter>
              <DialogClose render={<Button type="button" />}>Done</DialogClose>
            </DialogFooter>
          </>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="studyId" value={studyId} />
            <input type="hidden" name="active" value={(!isActive).toString()} />
            {!isActive && !state.error && warnings.length > 0 && (
              <div className="mb-4">
                <ActivationChecklist blockers={[]} warnings={warnings} />
              </div>
            )}
            {state.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            {state.issues && state.issues.length > 0 && (
              <div className="mb-4">
                <ActivationChecklist blockers={state.issues} warnings={[]} />
              </div>
            )}
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? (isActive ? "Saving…" : "Checking…") : isActive ? "Deactivate" : state.error ? "Check again" : "Activate"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
