import Link from "next/link";
import { InoxityMark } from "@/components/inoxity-mark";

// A route group — "(auth)" is stripped from the URL, so /login, /signup, /forgot-password, and
// /reset-password are unaffected; this only gives them a shared header. flex-1/flex-col mirrors
// DashboardLayout's own wrapper (src/app/dashboard/layout.tsx) so each page's own centered-card
// markup (e.g. login/page.tsx's `flex flex-1 items-center justify-center`) still has a proper
// flex ancestor chain to fill the remaining height below this header.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex justify-center px-4 py-8">
        <Link href="/">
          <InoxityMark size="md" />
        </Link>
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
