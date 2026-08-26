import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoginForm, LoginFormFooter } from "./login-form";

export const metadata = {
  title: "Sign in — Inoxity",
};

// Confirmation links use Supabase's PKCE flow, which needs the emailed link opened in the same
// browser that started signup (a verifier is stashed in a cookie there) — clicking it from a
// Mail app or a different browser/device fails that exchange. /auth/callback/route.ts already
// redirects here with ?error=auth-callback-failed when that happens; without this, the page just
// showed a blank sign-in form with no explanation, even though the account itself is fine.
const ERROR_MESSAGES: Record<string, string> = {
  "auth-callback-failed":
    "Your account is confirmed, but that link couldn't automatically sign you in — sign in below to continue.",
  "confirmation-failed":
    "That link is invalid or has expired. Sign in below — if your account still needs confirming, you'll be able to resend the email from there.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle
            className="text-2xl font-light"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            Sign in
          </CardTitle>
          <CardDescription>
            Welcome back to your researcher dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-6">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          <LoginForm />
          <LoginFormFooter />
        </CardContent>
      </Card>
    </div>
  );
}
