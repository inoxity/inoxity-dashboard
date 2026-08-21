import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS, type CollaboratorRole } from "@/lib/supabase/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AcceptInviteForm } from "./accept-invite-form";

export const metadata = {
  title: "Study Invite — Inoxity",
};

interface InvitePreview {
  study_id: string;
  study_display_name: string;
  role: CollaboratorRole;
  invited_email: string;
  invited_by_name: string | null;
  already_accepted: boolean;
}

// Deliberately outside /dashboard — this page needs to work for a visitor
// with no session at all (get_invite_preview is granted to `anon`, see
// 008_study_collaborators.sql), so it isn't wrapped by DashboardLayout's
// nav or its "middleware requires a session" guard.
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_invite_preview", { p_token: token });
  const invite = (data as InvitePreview[] | null)?.[0];

  if (!invite) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-24">
      <Card>
        <CardHeader>
          <CardTitle>{invite.already_accepted ? "Invite already accepted" : "You're invited"}</CardTitle>
          <CardDescription>
            {invite.invited_by_name ?? "A researcher"} invited {invite.invited_email} to join{" "}
            <strong>{invite.study_display_name}</strong> as {ROLE_LABELS[invite.role]}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {invite.already_accepted ? (
            <Button nativeButton={false} render={<Link href="/dashboard" />}>
              Go to dashboard
            </Button>
          ) : !user ? (
            <>
              <p className="text-sm text-muted-foreground">
                Sign in or create an Inoxity account with {invite.invited_email}, then come back to this link to
                accept.
              </p>
              <div className="flex gap-2">
                <Button nativeButton={false} render={<Link href="/login" />}>
                  Sign in
                </Button>
                <Button variant="outline" nativeButton={false} render={<Link href="/signup" />}>
                  Sign up
                </Button>
              </div>
            </>
          ) : (
            <AcceptInviteForm token={token} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
