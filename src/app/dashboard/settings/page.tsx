import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { EmailForm } from "@/components/settings/email-form";
import { PasswordForm } from "@/components/settings/password-form";
import { DeleteAccountControl } from "@/components/settings/delete-account-control";
import type { Profile } from "@/lib/supabase/types";

export const metadata = {
  title: "Settings — Inoxity",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, institution")
    .eq("id", user.id)
    .single<Pick<Profile, "full_name" | "institution">>();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-light" style={{ fontFamily: "var(--font-raleway)" }}>
        Settings
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm fullName={profile?.full_name ?? ""} institution={profile?.institution ?? null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>Current: {user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmailForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <form action={signOut}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>Permanently delete your Inoxity researcher account.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountControl />
        </CardContent>
      </Card>
    </div>
  );
}
