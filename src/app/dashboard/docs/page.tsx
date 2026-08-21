import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Documentation — Inoxity",
};

// Fleshed out from the earlier placeholder with real detail, but still no
// editor/backend behind it — just a page to keep expanding over time. The
// full reference docs are served statically from this repo (public/docs.html,
// updated for the current v2 architecture) rather than the old inoxity_v1
// repo's GitHub Pages site, which went private when that repo was archived;
// this page covers dashboard-specific basics and links out to that for
// anything deeper.
export default function DocsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-light" style={{ fontFamily: "var(--font-raleway)" }}>
          Documentation
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The basics for running a study from this dashboard. For the full architecture and troubleshooting
          reference, see the{" "}
          <a
            href="/docs.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            full documentation
          </a>
          .
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>1. Create a study from the Dashboard and work through the wizard&apos;s steps.</p>
          <p>
            2. Add your team&apos;s own Supabase project as the study&apos;s Data Backend before activating — Inoxity
            never stores participant data itself.
          </p>
          <p>3. Set the study&apos;s status to &quot;Active&quot; in the wizard, then Activate it from its detail page.</p>
          <p>4. Share the study code with participants so they can enroll in the iOS app.</p>
          <p>
            5. Build the iOS app with the <span className="font-mono text-xs">Inoxity-Production</span> scheme
            (not the default Development scheme) to test against a real, active study.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Study configuration reference</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Each wizard step maps directly to a section of the study configuration the iOS app reads — Identity,
          Schedule, Onboarding, HealthKit, Notifications, Surveys, Reminders, Support & FAQs, Data Backend. The
          Review step validates everything before saving.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Backend &amp; generated SQL</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            The wizard&apos;s Data Backend step generates the exact SQL setup script for whichever HealthKit types,
            surveys, and media settings that study actually uses — copy it into your own Supabase project&apos;s SQL
            editor to provision it.
          </p>
          <p>
            If you change a study&apos;s configuration later (e.g. add a HealthKit type) after its Supabase project
            already exists, don&apos;t re-run the whole script — its table-creation statements aren&apos;t safe to
            repeat. Re-download the setup SQL and apply only the new pieces.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>FAQ</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Who can see my study&apos;s data?</p>
            <p>Only your own Supabase project — the one you link as the Data Backend — ever holds participant data.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">How do I add a collaborator?</p>
            <p>Use the Research Team page to invite someone by email as an Admin, Editor, or Viewer.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              I added a new HealthKit type to an already-active study — why isn&apos;t data showing up?
            </p>
            <p>
              Its Supabase project needs the new table and RPC changes applied. Re-download the setup SQL from the
              Data Backend step and paste in just the new/changed pieces — see the card above.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              The app says the study&apos;s backend is inactive right after I set it up — what&apos;s wrong?
            </p>
            <p>
              Check that <span className="font-mono text-xs">study_backend_metadata.supported_configuration_schema_version</span>{" "}
              in your Supabase project matches the study&apos;s current schema version — this doesn&apos;t update
              itself when the schema version changes and needs a manual SQL update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
