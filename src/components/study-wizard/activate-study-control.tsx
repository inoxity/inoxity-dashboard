"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { setStudyActive } from "@/lib/study-actions";
import { activateInitialState } from "@/lib/study-action-state";
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

export function ActivateStudyControl({ studyId, isActive }: { studyId: string; isActive: boolean }) {
  const [state, formAction, isPending] = useActionState(setStudyActive, activateInitialState);
  const [open, setOpen] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      setOpen(false);
    }
    wasPending.current = isPending;
  }, [isPending, state.error]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={isActive ? "outline" : "default"} />}>
        {isActive ? "Deactivate" : "Activate"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isActive ? "Deactivate this study?" : "Activate this study?"}</DialogTitle>
          <DialogDescription>
            {isActive
              ? "Participants will no longer be able to fetch this study's configuration."
              : 'Make sure the study status is set to "Active" in the wizard first — otherwise the app will reject every participant even though this flag is on.'}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="studyId" value={studyId} />
          <input type="hidden" name="active" value={(!isActive).toString()} />
          {state.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isActive ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
