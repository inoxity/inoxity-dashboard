"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { inviteCollaborator } from "@/lib/team-actions";
import { teamInitialState } from "@/lib/team-action-state";
import { COLLABORATOR_ROLES, ROLE_LABELS, type CollaboratorRole } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function InviteForm({ studyId }: { studyId: string }) {
  const [state, formAction, isPending] = useActionState(inviteCollaborator, teamInitialState);
  const [role, setRole] = useState<CollaboratorRole>("editor");
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && state.success && !state.fallbackAcceptUrl) {
      formRef.current?.reset();
    }
    wasPending.current = isPending;
  }, [isPending, state.success, state.fallbackAcceptUrl]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="studyId" value={studyId} />
      <input type="hidden" name="role" value={role} />

      <Field className="flex-1">
        <FieldLabel htmlFor="invite-email">Invite by email</FieldLabel>
        <Input id="invite-email" name="email" type="email" placeholder="name@example.com" required />
      </Field>

      <Field className="sm:w-40">
        <FieldLabel htmlFor="invite-role">Role</FieldLabel>
        <Select
          items={COLLABORATOR_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
          value={role}
          onValueChange={(next) => next && setRole(next as CollaboratorRole)}
        >
          <SelectTrigger id="invite-role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLLABORATOR_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending…" : "Send invite"}
      </Button>

      {state.error && (
        <Alert variant="destructive" className="sm:basis-full">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && state.fallbackAcceptUrl && (
        <Alert className="sm:basis-full">
          <AlertDescription>
            Invite created, but the email couldn&apos;t be sent — share this link directly instead:{" "}
            <span className="break-all font-mono text-xs">{state.fallbackAcceptUrl}</span>
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
