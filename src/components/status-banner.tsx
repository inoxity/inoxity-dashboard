import Link from "next/link";
import { Button } from "@/components/ui/button";

// Pre-launch notice across the top of the landing page. Remove (or
// reword) once Inoxity is open for general use. Uses the theme's pink
// accent (globals.css --accent) so it stands out against the dark page.
export function StatusBanner() {
  return (
    <div className="w-full bg-accent text-accent-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          <strong className="font-semibold">
            Inoxity is undergoing active development and large-scale validation, and will be ready for use soon.
          </strong>{" "}
          Join the mailing list to hear when it launches. Want early access now? Email Rachael at{" "}
          <a href="mailto:rlkee@ucdavis.edu" className="font-medium underline underline-offset-3">
            rlkee@ucdavis.edu
          </a>
          .
        </p>
        <Button
          size="sm"
          className="shrink-0 bg-background text-foreground hover:bg-background/85"
          nativeButton={false}
          render={<Link href="/updates" />}
        >
          Join the mailing list
        </Button>
      </div>
    </div>
  );
}
