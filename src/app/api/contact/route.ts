import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, escapeHtml } from "@/lib/email";

// Public, unauthenticated — called by the iOS app directly (a participant
// has no dashboard/researcher session), so there's no requireUser() guard
// here. Deliberately writes NOTHING to inoxity_backend: the message is
// relayed to the study's support email via Resend and then discarded. Only
// study code + success/failure are ever logged — never the message body —
// so it isn't incidentally retained in Vercel's function logs either.
const MAX_MESSAGE_LENGTH = 4000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

// Best-effort, in-memory only — resets on every serverless cold start.
// Not backed by a database table on purpose: the whole point of this route
// is to avoid persisting anything beyond what's strictly needed to deter
// abuse, and even this map holds nothing about message content.
const recentRequestsByIP = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (recentRequestsByIP.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  recentRequestsByIP.set(key, recent);
  return recent.length > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  // Not real security (the secret ships inside the app binary and can be
  // extracted) — just a deterrent against random internet traffic hitting
  // this endpoint and sending mail through the Resend account. See
  // .env.example / CONTACT_SHARED_SECRET.
  const expectedSecret = process.env.CONTACT_SHARED_SECRET;
  if (!expectedSecret || request.headers.get("x-contact-secret") !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests — please try again later." }, { status: 429 });
  }

  let body: { studyCode?: unknown; message?: unknown; replyToEmail?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const studyCode = String(body.studyCode ?? "").trim();
  const message = String(body.message ?? "").trim();
  const replyToEmail = body.replyToEmail ? String(body.replyToEmail).trim() : undefined;

  if (!studyCode || !message) {
    return NextResponse.json({ error: "Missing studyCode or message." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error: lookupError } = await supabase.rpc("get_study_support_contact", {
    requested_code: studyCode,
  });
  const contact = (data as { support_name: string | null; support_email: string | null }[] | null)?.[0];

  if (lookupError || !contact?.support_email) {
    console.error("[api/contact] no support contact for study code", lookupError?.message ?? "not found");
    return NextResponse.json({ error: "Couldn't find this study's contact info." }, { status: 404 });
  }

  const { error: sendError } = await sendEmail({
    to: contact.support_email,
    subject: `New message from a participant — ${studyCode}`,
    html: `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>${
      replyToEmail ? `<p style="color:#666">Reply to: ${escapeHtml(replyToEmail)}</p>` : ""
    }`,
    replyTo: replyToEmail,
  });

  if (sendError) {
    return NextResponse.json({ error: "Something went wrong sending your message." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
