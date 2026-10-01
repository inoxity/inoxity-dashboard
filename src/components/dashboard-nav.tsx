"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { InoxityMark } from "@/components/inoxity-mark";
import { signOut } from "@/lib/auth-actions";
import { DOCS_URL } from "@/lib/links";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/team", label: "Research Team" },
  { href: "/dashboard/settings", label: "Settings" },
];

const LINK_CLASS = "shrink-0 rounded-lg px-2.5 py-1.5 text-sm transition-colors";

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-border">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 overflow-x-auto px-4 py-3">
        <Link href="/dashboard" className="shrink-0">
          <InoxityMark />
        </Link>
        <div className="flex items-center justify-center gap-1">
          {LINKS.map((link) => {
            const active = link.href === "/dashboard" ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  LINK_CLASS,
                  active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          {/* Opens Read the Docs in a new tab so the dashboard stays open. */}
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(LINK_CLASS, "flex items-center gap-1 text-muted-foreground hover:bg-muted hover:text-foreground")}
          >
            Documentation
            <ExternalLink className="size-3" aria-hidden />
          </a>
        </div>
        <form action={signOut} className="justify-self-end">
          <Button type="submit" variant="outline" size="sm" className="gap-1.5 rounded-full">
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        </form>
      </div>
    </nav>
  );
}
