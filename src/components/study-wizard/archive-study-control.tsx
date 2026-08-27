"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { setStudyArchived } from "@/lib/study-actions";
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

export function ArchiveStudyControl({
  studyId,
  isArchived,
  isActive,
}: {
  studyId: string;
  isArchived: boolean;
  isActive: boolean;
}) {
  const [state, formAction, isPending] = useActionState(setStudyArchived, activateInitialState);
  const [open, setOpen] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      setOpen(false);
    }
    wasPending.current = isPending;
  }, [isPending, state.error]);

  // Same blocking rule setStudyArchived() enforces server-side — disabled
  // here too so the button doesn't invite a submit that's just going to
  // come back with an error.
  const blocked = !isArchived && isActive;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        {isArchived ? "Unarchive" : "Archive"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isArchived ? "Unarchive this study?" : "Archive this study?"}</DialogTitle>
          <DialogDescription>
            {isArchived
              ? "It'll move back into your main studies list. It stays inactive until you separately reactivate it."
              : blocked
                ? "Deactivate this study first — an archived study can't stay active for participants."
                : "It'll move out of your main studies list into Archived. You can unarchive it any time."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="studyId" value={studyId} />
          <input type="hidden" name="archived" value={(!isArchived).toString()} />
          {state.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
            <Button type="submit" disabled={isPending || blocked}>
              {isPending ? "Saving…" : isArchived ? "Unarchive" : "Archive"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
