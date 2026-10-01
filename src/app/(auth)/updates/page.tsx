import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MailingListForm } from "@/components/updates/mailing-list-form";

export const metadata = {
  title: "Join the mailing list — Inoxity",
};

export default function UpdatesPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-light" style={{ fontFamily: "var(--font-raleway)" }}>
            Stay in the loop
          </CardTitle>
          <CardDescription>
            Inoxity is still in development and large-scale validation. Join the mailing list and we&apos;ll
            let you know when it&apos;s ready for use, plus occasional project updates. You can unsubscribe
            anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MailingListForm />
        </CardContent>
      </Card>
    </div>
  );
}
