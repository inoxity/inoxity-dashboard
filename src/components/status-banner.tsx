import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Pre-launch notice on the landing page. Remove (or reword) once Inoxity
// is open for general use.
export function StatusBanner() {
  return (
    <Alert className="mx-auto max-w-2xl text-left">
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          <strong className="font-semibold text-foreground">
            Inoxity is in active development and large-scale validation, and will be ready for use soon.
          </strong>{" "}
          Join the mailing list to hear when it launches. Want early access now? Email Rachael at{" "}
          <a href="mailto:rlkee@ucdavis.edu" className="text-primary hover:underline">
            rlkee@ucdavis.edu
          </a>
          .
        </span>
        <Button size="sm" className="shrink-0 self-start no-underline! sm:self-center" nativeButton={false} render={<Link href="/updates" />}>
          Join the mailing list
        </Button>
      </AlertDescription>
    </Alert>
  );
}
