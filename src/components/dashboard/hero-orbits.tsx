import { cn } from "@/lib/utils";

interface OrbitDot {
  angle: number;
  rx: number;
  ry: number;
  r: number;
  color: string;
  rotate?: number;
}

interface OrbitCluster {
  cx: number;
  cy: number;
  glowR: number;
  rings: { rx: number; ry: number; rotate: number; color: string; opacity: number; dashed?: boolean }[];
  dots: OrbitDot[];
}

function renderCluster(cluster: OrbitCluster, key: string) {
  const { cx, cy, glowR, rings, dots } = cluster;
  return (
    <g key={key}>
      <circle cx={cx} cy={cy} r={glowR} fill={`url(#hero-glow-${key})`} />
      {rings.map((ring, i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={ring.rx}
          ry={ring.ry}
          fill="none"
          stroke={ring.color}
          strokeOpacity={ring.opacity}
          strokeWidth="1"
          strokeDasharray={ring.dashed ? "2 6" : undefined}
          transform={ring.rotate ? `rotate(${ring.rotate} ${cx} ${cy})` : undefined}
        />
      ))}
      {dots.map((p, i) => {
        const rot = ((p.rotate ?? 0) * Math.PI) / 180;
        const t = (p.angle * Math.PI) / 180;
        const ex = p.rx * Math.cos(t);
        const ey = p.ry * Math.sin(t);
        const x = cx + ex * Math.cos(rot) - ey * Math.sin(rot);
        const y = cy + ex * Math.sin(rot) + ey * Math.cos(rot);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={p.r * 2.5} fill={p.color} fillOpacity="0.35" filter="url(#hero-dot-glow)" />
            <circle cx={x} cy={y} r={p.r} fill={p.color} fillOpacity="0.9" />
          </g>
        );
      })}
    </g>
  );
}

// Purely decorative — no brand asset for this exists (the branding folder
// only has abstract gradient wave PNGs, not orbit/dot line art), so this
// is hand-built rather than sourced. aria-hidden + no interactivity.
//
// Two independent orbit systems (not mirrored — different angles/sizes so
// they read as distinct) plus a scattered starfield. Each ring cluster
// shares one center so it reads as an actual orbit system rather than
// disconnected shapes.
export function HeroOrbits({ className }: { className?: string }) {
  const primary: OrbitCluster = {
    cx: 260,
    cy: 210,
    glowR: 160,
    rings: [
      { rx: 230, ry: 120, rotate: -18, color: "var(--primary)", opacity: 0.35 },
      { rx: 230, ry: 120, rotate: 22, color: "var(--accent)", opacity: 0.3 },
      { rx: 130, ry: 130, rotate: 0, color: "var(--primary)", opacity: 0.22, dashed: true },
    ],
    dots: [
      { angle: -18, rx: 230, ry: 120, r: 5, color: "var(--primary)" },
      { angle: 162, rx: 230, ry: 120, r: 3.5, color: "var(--primary)" },
      { angle: 60, rx: 230, ry: 120, r: 4, color: "var(--accent)", rotate: 22 },
      { angle: 250, rx: 230, ry: 120, r: 3, color: "var(--accent)", rotate: 22 },
      { angle: 300, rx: 130, ry: 130, r: 3.5, color: "var(--primary)" },
    ],
  };

  // Smaller, lower, different angles entirely (not a mirror of primary) so
  // the two don't read as a single symmetric shape.
  const secondary: OrbitCluster = {
    cx: 610,
    cy: 330,
    glowR: 90,
    rings: [
      { rx: 140, ry: 70, rotate: -42, color: "var(--accent)", opacity: 0.3 },
      { rx: 90, ry: 90, rotate: 0, color: "var(--primary)", opacity: 0.2, dashed: true },
    ],
    dots: [
      { angle: -42, rx: 140, ry: 70, r: 3, color: "var(--accent)" },
      { angle: 138, rx: 140, ry: 70, r: 2.5, color: "var(--accent)" },
      { angle: 200, rx: 90, ry: 90, r: 2.5, color: "var(--primary)" },
    ],
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 800 460"
      preserveAspectRatio="xMidYMid meet"
      className={cn("absolute inset-0 h-full w-full", className)}
    >
      <defs>
        <radialGradient id="hero-glow-primary" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hero-glow-secondary" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <filter id="hero-dot-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {renderCluster(primary, "primary")}
      {renderCluster(secondary, "secondary")}

      {/* Scattered background stars */}
      <circle cx="90" cy="60" r="1.5" fill="var(--primary)" fillOpacity="0.4" />
      <circle cx="180" cy="120" r="1" fill="var(--accent)" fillOpacity="0.4" />
      <circle cx="700" cy="90" r="1.5" fill="var(--accent)" fillOpacity="0.4" />
      <circle cx="650" cy="410" r="1" fill="var(--primary)" fillOpacity="0.4" />
      <circle cx="100" cy="400" r="1.5" fill="var(--primary)" fillOpacity="0.35" />
      <circle cx="770" cy="230" r="1" fill="var(--accent)" fillOpacity="0.35" />
      <circle cx="40" cy="250" r="1" fill="var(--primary)" fillOpacity="0.3" />
      <circle cx="480" cy="40" r="1.5" fill="var(--accent)" fillOpacity="0.35" />
      <circle cx="330" cy="430" r="1" fill="var(--primary)" fillOpacity="0.3" />
      <circle cx="520" cy="180" r="1" fill="var(--accent)" fillOpacity="0.3" />
      <circle cx="760" cy="380" r="1.5" fill="var(--primary)" fillOpacity="0.3" />
    </svg>
  );
}
