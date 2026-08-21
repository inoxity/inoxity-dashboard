import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SignupForm, SignupFormFooter } from "./signup-form";

export const metadata = {
  title: "Sign up — Inoxity",
};

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle
            className="text-2xl font-light"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            Create your researcher account
          </CardTitle>
          <CardDescription>
            Researchers are identified by email. Participants remain
            anonymous.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
          <SignupFormFooter />
        </CardContent>
      </Card>
    </div>
  );
}
