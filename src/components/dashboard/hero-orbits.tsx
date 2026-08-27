import { cn } from "@/lib/utils";

// Purely decorative — no brand asset for this exists (the branding folder
// only has abstract gradient wave PNGs, not orbit/dot line art), so this
// is hand-built rather than sourced. aria-hidden + no interactivity.
export function HeroOrbits({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 400"
      preserveAspectRatio="xMidYMid slice"
      className={cn("absolute inset-0 h-full w-full", className)}
    >
      <ellipse
        cx="180"
        cy="120"
        rx="150"
        ry="90"
        fill="none"
        stroke="var(--primary)"
        strokeOpacity="0.18"
        strokeWidth="1"
      />
      <ellipse
        cx="150"
        cy="150"
        rx="90"
        ry="90"
        fill="none"
        stroke="var(--primary)"
        strokeOpacity="0.14"
        strokeWidth="1"
        strokeDasharray="4 6"
      />
      <ellipse
        cx="1040"
        cy="260"
        rx="180"
        ry="110"
        fill="none"
        stroke="var(--accent)"
        strokeOpacity="0.16"
        strokeWidth="1"
      />
      <ellipse
        cx="1060"
        cy="230"
        rx="100"
        ry="100"
        fill="none"
        stroke="var(--primary)"
        strokeOpacity="0.12"
        strokeWidth="1"
        strokeDasharray="3 7"
      />

      <circle cx="90" cy="40" r="3" fill="var(--accent)" fillOpacity="0.5" />
      <circle cx="260" cy="70" r="2" fill="var(--primary)" fillOpacity="0.5" />
      <circle cx="60" cy="220" r="2.5" fill="var(--primary)" fillOpacity="0.4" />
      <circle cx="300" cy="230" r="2" fill="var(--accent)" fillOpacity="0.45" />
      <circle cx="1150" cy="90" r="3" fill="var(--primary)" fillOpacity="0.45" />
      <circle cx="960" cy="60" r="2" fill="var(--accent)" fillOpacity="0.5" />
      <circle cx="1180" cy="330" r="2.5" fill="var(--accent)" fillOpacity="0.4" />
      <circle cx="900" cy="340" r="2" fill="var(--primary)" fillOpacity="0.45" />
    </svg>
  );
}
