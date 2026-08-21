import Image from "next/image";
import { cn } from "@/lib/utils";

// Small brand lockup (icon mark + tracked-out wordmark) reused wherever the app needs an
// identity but not the marketing page's full hero-scale treatment (src/app/page.tsx, which stays
// as its own larger inline markup rather than this component — it uses the same full icon at
// 80px with flanking rule lines, a different composition this component isn't trying to match).
// The icon itself is a tight crop of Inoxity-08.png's top half (chat bubble + brain + moon +
// tool bar + sparkle) — that source file pairs the icon with its own "INOXITY" wordmark below,
// cropped out here since this component renders the wordmark as live text instead.
export function InoxityMark({ size = "sm", className }: { size?: "sm" | "md"; className?: string }) {
  const imagePx = size === "sm" ? 40 : 48;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image src="/inoxity-mark.png" alt="" width={imagePx} height={imagePx} aria-hidden />
      <span
        className={cn(
          "pl-[0.35em] leading-none font-extralight tracking-[0.35em] uppercase",
          size === "sm" ? "text-sm" : "text-lg",
        )}
        style={{ fontFamily: "var(--font-raleway)" }}
      >
        IN<span className="text-primary">O</span>XITY
      </span>
    </span>
  );
}
