import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard-nav";
import { EmailConfirmationBanner } from "@/components/dashboard/email-confirmation-banner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards /dashboard/*, but Server Components can be
  // reached via paths middleware didn't run on — same defense-in-depth
  // re-check every page under here already does individually.
  if (!user) {
    redirect("/login");
  }

  // Explicit invited_email filter is required here, not just relying on
  // RLS: study_collaborators' SELECT policies are OR'd together, and the
  // "Owner or admin can view a study's collaborators" policy (also in
  // 008_study_collaborators.sql) independently grants a study's owner/
  // admins visibility into its *entire* roster — including pending
  // invites they sent to someone else. Without this filter, an inviter
  // would see their own "you have a pending invite" banner for invites
  // they created, not just ones actually addressed to them.
  const { data: pendingInvites } = await supabase
    .from("study_collaborators")
    .select("invite_token")
    .is("accepted_at", null)
    .eq("invited_email", (user.email ?? "").toLowerCase());

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />
      {!user.email_confirmed_at && (
        <div className="mx-auto w-full max-w-6xl px-4 pt-6">
          <EmailConfirmationBanner />
        </div>
      )}
      {pendingInvites && pendingInvites.length > 0 && (
        <div className="mx-auto w-full max-w-6xl px-4 pt-6">
          <Alert>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>
                You have {pendingInvites.length === 1 ? "a pending study invite" : `${pendingInvites.length} pending study invites`}.
              </span>
              <Link href={`/invite/${pendingInvites[0].invite_token}`} className="text-primary hover:underline">
                View invite{pendingInvites.length > 1 ? "s" : ""}
              </Link>
            </AlertDescription>
          </Alert>
        </div>
      )}
      <main className="flex-1">{children}</main>
    </div>
  );
}
