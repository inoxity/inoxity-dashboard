// lucide-react dropped brand/logo icons (no "Github" export in this
// version) — Code2 stands in as a generic code-repo icon instead.
import { Code2, Mail } from "lucide-react";
import { InoxityMark } from "@/components/inoxity-mark";

// mt-auto relies on the root layout's <body> already being flex flex-col
// (see src/app/layout.tsx) — pushes this to the bottom of the viewport on
// short pages (login, signup, marketing) without needing every individual
// page to opt into its own sticky-footer layout.
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground">
        <InoxityMark />
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/inoxity"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground"
            aria-label="Inoxity on GitHub"
          >
            <Code2 className="size-4" />
            GitHub
          </a>
          {/* Visible address, not just an icon+label, so it's still usable
              (readable/copyable) for anyone without a default mail client
              configured — a plain mailto: click does nothing visible there. */}
          <a href="mailto:inoxity.team@gmail.com" className="flex items-center gap-1.5 hover:text-foreground">
            <Mail className="size-4" />
            inoxity.team@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
