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

// Spread across the whole 800x460 canvas, deliberately including the band
// between the two orbit clusters (roughly x 250-620) so they read as one
// shared sky rather than two disconnected patches of stars.
const STARS: { x: number; y: number; r: number; color: string; opacity: number }[] = [
  { x: 90, y: 60, r: 1.5, color: "var(--primary)", opacity: 0.4 },
  { x: 180, y: 120, r: 1, color: "var(--accent)", opacity: 0.4 },
  { x: 700, y: 90, r: 1.5, color: "var(--accent)", opacity: 0.4 },
  { x: 650, y: 410, r: 1, color: "var(--primary)", opacity: 0.4 },
  { x: 100, y: 400, r: 1.5, color: "var(--primary)", opacity: 0.35 },
  { x: 770, y: 230, r: 1, color: "var(--accent)", opacity: 0.35 },
  { x: 40, y: 250, r: 1, color: "var(--primary)", opacity: 0.3 },
  { x: 480, y: 40, r: 1.5, color: "var(--accent)", opacity: 0.35 },
  { x: 330, y: 430, r: 1, color: "var(--primary)", opacity: 0.3 },
  { x: 520, y: 180, r: 1, color: "var(--accent)", opacity: 0.3 },
  { x: 760, y: 380, r: 1.5, color: "var(--primary)", opacity: 0.3 },
  // Fill the connecting band between the two clusters
  { x: 260, y: 90, r: 1, color: "var(--primary)", opacity: 0.3 },
  { x: 310, y: 260, r: 1.5, color: "var(--accent)", opacity: 0.3 },
  { x: 370, y: 130, r: 1, color: "var(--primary)", opacity: 0.35 },
  { x: 420, y: 300, r: 1, color: "var(--accent)", opacity: 0.3 },
  { x: 460, y: 220, r: 1.5, color: "var(--primary)", opacity: 0.3 },
  { x: 380, y: 380, r: 1, color: "var(--primary)", opacity: 0.25 },
  { x: 550, y: 100, r: 1, color: "var(--accent)", opacity: 0.3 },
  { x: 600, y: 260, r: 1, color: "var(--primary)", opacity: 0.3 },
  { x: 290, y: 340, r: 1, color: "var(--primary)", opacity: 0.25 },
  { x: 430, y: 60, r: 1, color: "var(--accent)", opacity: 0.25 },
  { x: 220, y: 400, r: 1.5, color: "var(--accent)", opacity: 0.3 },
  { x: 630, y: 60, r: 1, color: "var(--primary)", opacity: 0.3 },
  { x: 130, y: 340, r: 1, color: "var(--accent)", opacity: 0.25 },
  { x: 210, y: 30, r: 1, color: "var(--primary)", opacity: 0.25 },
  { x: 500, y: 400, r: 1, color: "var(--accent)", opacity: 0.25 },
  { x: 350, y: 20, r: 1, color: "var(--accent)", opacity: 0.25 },
  { x: 660, y: 150, r: 1, color: "var(--primary)", opacity: 0.25 },
  { x: 160, y: 200, r: 1, color: "var(--primary)", opacity: 0.2 },
  { x: 590, y: 400, r: 1, color: "var(--primary)", opacity: 0.25 },
];

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
    cx: 30,
    cy: 170,
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
    cx: 780,
    cy: 290,
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

      {/* Scattered background stars, spread across the whole canvas
          (including the gap between the two clusters) so both orbit
          systems read as part of one shared sky rather than two
          disconnected patches. */}
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.color} fillOpacity={s.opacity} />
      ))}
    </svg>
  );
}
