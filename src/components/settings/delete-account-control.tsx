"use client";

import { useActionState, useState } from "react";
import { deleteAccount } from "@/lib/settings-actions";
import { authInitialState } from "@/lib/auth-state";
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

export function DeleteAccountControl() {
  const [state, formAction, isPending] = useActionState(deleteAccount, authInitialState);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>Delete account</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            This permanently deletes your Inoxity researcher account and can&apos;t be undone. You can&apos;t
            delete your account while you still own any studies — transfer ownership from Research Team, or delete
            those studies, first.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor="confirmation">
              Type <span className="font-mono">DELETE</span> to confirm
            </FieldLabel>
            <Input id="confirmation" name="confirmation" placeholder="DELETE" autoComplete="off" />
          </Field>
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Deleting…" : "Delete my account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
