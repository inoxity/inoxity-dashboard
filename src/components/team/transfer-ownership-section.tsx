"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { transferStudyOwnership } from "@/lib/team-actions";
import { teamInitialState } from "@/lib/team-action-state";
import { ROLE_LABELS, type CollaboratorRole, type StudyTeamMember } from "@/lib/supabase/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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

// A dedicated, always-visible entry point — previously the only trigger
// was a tiny inline "Make owner" button per eligible collaborator row,
// which meant an owner with no accepted Admin/Editor yet saw nothing at
// all and no explanation why. This card is always shown to the owner and
// explains the precondition instead of silently omitting a button.
export function TransferOwnershipSection({ studyId, team }: { studyId: string; team: StudyTeamMember[] }) {
  const eligible = team.filter(
    (m) => !m.is_owner && m.accepted_at && (m.role === "admin" || m.role === "editor"),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer ownership</CardTitle>
        <CardDescription>
          Hand this study off to an existing Admin or Editor. You&apos;ll become an Admin instead.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {eligible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            To transfer ownership, first invite someone (or promote an existing collaborator) to Admin or Editor,
            then come back here.
          </p>
        ) : (
          <TransferOwnershipForm studyId={studyId} eligible={eligible} />
        )}
      </CardContent>
    </Card>
  );
}

function TransferOwnershipForm({
  studyId,
  eligible,
}: {
  studyId: string;
  eligible: StudyTeamMember[];
}) {
  const [state, formAction, isPending] = useActionState(transferStudyOwnership, teamInitialState);
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(eligible[0]?.user_id ?? null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      setOpen(false);
    }
    wasPending.current = isPending;
  }, [isPending, state.error]);

  const selected = eligible.find((m) => m.user_id === selectedUserId);
  const selectedName = selected?.full_name || selected?.invited_email || "this person";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        items={eligible.map((m) => ({
          value: m.user_id!,
          label: `${m.full_name || m.invited_email || "—"} (${ROLE_LABELS[m.role as CollaboratorRole]})`,
        }))}
        value={selectedUserId ?? undefined}
        onValueChange={(v) => setSelectedUserId(v)}
      >
        <SelectTrigger className="min-w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {eligible.map((m) => (
            <SelectItem key={m.user_id} value={m.user_id!}>
              {m.full_name || m.invited_email || "—"} ({ROLE_LABELS[m.role as CollaboratorRole]})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" disabled={!selectedUserId} />}>
          Transfer ownership
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make {selectedName} the owner?</DialogTitle>
            <DialogDescription>
              You&apos;ll become an Admin on this study instead. Only the current owner can transfer ownership, and
              this can&apos;t be undone by anyone but the new owner.
            </DialogDescription>
          </DialogHeader>
          <form action={formAction}>
            <input type="hidden" name="studyId" value={studyId} />
            <input type="hidden" name="newOwnerUserId" value={selectedUserId ?? ""} />
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
    </div>
  );
}
