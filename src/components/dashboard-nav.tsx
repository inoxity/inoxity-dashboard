"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { InoxityMark } from "@/components/inoxity-mark";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/team", label: "Research Team" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/docs", label: "Documentation" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex w-full max-w-4xl items-center gap-6 overflow-x-auto px-4 py-3">
        <Link href="/dashboard" className="shrink-0">
          <InoxityMark />
        </Link>
        <div className="flex items-center gap-1">
          {LINKS.map((link) => {
            // /dashboard itself needs an exact match — every other route
            // under /dashboard would otherwise also match its prefix.
            const active = link.href === "/dashboard" ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                  active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
