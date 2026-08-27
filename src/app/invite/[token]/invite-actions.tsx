"use client";

import Link from "next/link";
import { useState } from "react";
import { AcceptInviteForm } from "./accept-invite-form";
import { DeclineInviteControl } from "./decline-invite-control";
import { Button } from "@/components/ui/button";

export function InviteActions({ token, studyDisplayName }: { token: string; studyDisplayName: string }) {
  const [declined, setDeclined] = useState(false);

  if (declined) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          You&apos;ve declined this invite. You can head back to your dashboard, or ask them to send a new invite if
          you change your mind.
        </p>
        <Button nativeButton={false} render={<Link href="/dashboard" />}>
          Go to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <AcceptInviteForm token={token} />
      <DeclineInviteControl token={token} studyDisplayName={studyDisplayName} onDeclined={() => setDeclined(true)} />
    </div>
  );
}
