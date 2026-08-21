import { headers } from "next/headers";

// Extracted out of auth-actions.ts (which originally had its own private
// copy) so team-actions.ts can build invite-accept links without
// duplicating this logic.
export async function getSiteOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
