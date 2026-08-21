"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateCollaboratorRole, removeCollaborator, transferStudyOwnership } from "@/lib/team-actions";
import { teamInitialState } from "@/lib/team-action-state";
import { COLLABORATOR_ROLES, ROLE_LABELS, type CollaboratorRole, type StudyTeamMember } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function TeamRoster({
  studyId,
  team,
  currentUserId,
  isOwner,
  canManage,
}: {
  studyId: string;
  team: StudyTeamMember[];
  currentUserId: string;
  isOwner: boolean;
  canManage: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {team.map((member) => {
        const isSelf = member.user_id === currentUserId;
        const pending = !member.is_owner && !member.accepted_at;
        return (
          <div
            key={member.collaborator_id ?? member.user_id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
          >
            <div className="flex flex-col">
              <span className="text-sm">
                {member.full_name || member.invited_email || "—"}
                {isSelf && <span className="text-muted-foreground"> (you)</span>}
              </span>
              {pending && <span className="text-xs text-muted-foreground">Invited — hasn&apos;t accepted yet</span>}
            </div>

            <div className="flex items-center gap-2">
              {member.is_owner ? (
                <Badge>Owner</Badge>
              ) : canManage ? (
                <RoleControl collaboratorId={member.collaborator_id!} role={member.role as CollaboratorRole} />
              ) : (
                <Badge variant="secondary">{ROLE_LABELS[member.role as CollaboratorRole]}</Badge>
              )}

              {!member.is_owner && isOwner && member.accepted_at && member.role !== "viewer" && (
                <TransferOwnershipControl
                  studyId={studyId}
                  newOwnerUserId={member.user_id!}
                  name={member.full_name || member.invited_email || "this person"}
                />
              )}

              {!member.is_owner && (canManage || isSelf) && (
                <RemoveControl
                  collaboratorId={member.collaborator_id!}
                  name={member.full_name || member.invited_email || "this person"}
                  isSelf={isSelf}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RoleControl({ collaboratorId, role }: { collaboratorId: string; role: CollaboratorRole }) {
  const [state, formAction, isPending] = useActionState(updateCollaboratorRole, teamInitialState);

  function handleChange(next: CollaboratorRole | null) {
    if (!next) return;
    const formData = new FormData();
    formData.set("collaboratorId", collaboratorId);
    formData.set("role", next);
    formAction(formData);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Select
        items={COLLABORATOR_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
        value={role}
        onValueChange={handleChange}
        disabled={isPending}
      >
        <SelectTrigger size="sm">
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
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
    </div>
  );
}

function RemoveControl({ collaboratorId, name, isSelf }: { collaboratorId: string; name: string; isSelf: boolean }) {
  const [state, formAction, isPending] = useActionState(removeCollaborator, teamInitialState);
  const [open, setOpen] = useState(false);
  const wasPending = useRef(false);

  // Only close on an actual successful completion — closing eagerly on
  // submit (before the result comes back) would hide a real error from
  // the researcher, same reasoning as ActivateStudyControl.
  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      setOpen(false);
    }
    wasPending.current = isPending;
  }, [isPending, state.error]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>{isSelf ? "Leave" : "Remove"}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isSelf ? "Leave this study?" : `Remove ${name}?`}</DialogTitle>
          <DialogDescription>
            {isSelf
              ? "You'll lose access to this study's configuration. An admin can re-invite you later."
              : `${name} will lose access to this study immediately.`}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="collaboratorId" value={collaboratorId} />
          {state.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Removing…" : isSelf ? "Leave" : "Remove"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TransferOwnershipControl({
  studyId,
  newOwnerUserId,
  name,
}: {
  studyId: string;
  newOwnerUserId: string;
  name: string;
}) {
  const [state, formAction, isPending] = useActionState(transferStudyOwnership, teamInitialState);
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
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Make owner</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make {name} the owner?</DialogTitle>
          <DialogDescription>
            You&apos;ll become an Admin on this study instead. Only the current owner can transfer ownership, and
            this can&apos;t be undone by anyone but the new owner.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="studyId" value={studyId} />
          <input type="hidden" name="newOwnerUserId" value={newOwnerUserId} />
          {state.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Transferring…" : "Transfer ownership"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
