import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-5">
          <span className="h-px w-10 bg-primary/40" />
          <Image
            src="/inoxity-logo.png"
            alt="Inoxity"
            width={80}
            height={80}
            priority
          />
          <span className="h-px w-10 bg-primary/40" />
        </div>
        <div
          className="mt-2 pl-[0.45em] text-3xl leading-none font-extralight tracking-[0.45em] uppercase sm:text-5xl"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          IN<span className="text-primary">O</span>XITY
        </div>
      </div>

      <h1
        className="mt-12 text-2xl font-light sm:text-3xl"
        style={{ fontFamily: "var(--font-raleway)" }}
      >
        Real-world research, at scale.
      </h1>

      <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
        The research companion for high-throughput studies combining iPhone
        and Apple Watch sensing, EMA, and beyond.
      </p>

      <div className="mt-8 flex gap-3">
        <Button variant="outline" nativeButton={false} render={<Link href="/login" />}>
          Sign in
        </Button>
        <Button nativeButton={false} render={<Link href="/signup" />}>
          Sign up
        </Button>
      </div>
    </div>
  );
}
