"use server";

import { headers } from "next/headers";
import { addMailingListContact } from "@/lib/email";
import type { AuthActionState } from "@/lib/auth-state";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 100;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

// Best-effort, in-memory only — same deterrent as /api/contact's limiter,
// resets on every serverless cold start.
const recentRequestsByIP = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (recentRequestsByIP.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  recentRequestsByIP.set(key, recent);
  return recent.length > RATE_LIMIT_MAX;
}

// Public, unauthenticated — anyone on /updates can call this.
export async function joinMailingList(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  // Honeypot: the "website" field is visually hidden, so only bots fill it
  // in. Pretend it worked so they don't learn to skip it.
  if (String(formData.get("website") ?? "")) {
    return { error: null, success: true };
  }

  const email = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim().slice(0, MAX_NAME_LENGTH);

  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return { error: "Too many attempts right now — please wait a minute and try again." };
  }

  const { error } = await addMailingListContact({ email, firstName });
  if (error) {
    return { error: `${error} Please try again later, or email rlkee@ucdavis.edu.` };
  }
  return { error: null, success: true };
}
