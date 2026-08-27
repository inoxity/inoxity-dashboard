"use client";

import { useActionState, useState } from "react";
import { deleteStudy } from "@/lib/study-actions";
import { activateInitialState } from "@/lib/study-action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
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

// Typed-confirmation pattern matches DeleteAccountControl — same
// irreversible-destructive trust level as deleting your whole account.
export function DeleteStudyControl({ studyId, isActive }: { studyId: string; isActive: boolean }) {
  const [state, formAction, isPending] = useActionState(deleteStudy, activateInitialState);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>Delete study</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this study?</DialogTitle>
          <DialogDescription>
            {isActive
              ? "Deactivate this study first — an active study can't be deleted."
              : "This permanently deletes the study and its team roster. It can't be undone. Participant data in your team's own Data Backend is not affected."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="studyId" value={studyId} />
          {!isActive && (
            <Field>
              <FieldLabel htmlFor="confirmation">
                Type <span className="font-mono">DELETE</span> to confirm
              </FieldLabel>
              <Input id="confirmation" name="confirmation" placeholder="DELETE" autoComplete="off" />
            </Field>
          )}
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
            <Button type="submit" variant="destructive" disabled={isPending || isActive}>
              {isPending ? "Deleting…" : "Delete study"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
