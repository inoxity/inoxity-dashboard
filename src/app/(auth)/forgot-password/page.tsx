import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = {
  title: "Reset your password — Inoxity",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle
            className="text-2xl font-light"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            Reset your password
          </CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a link to reset it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
