import { Resend } from "resend";

// Server-only — RESEND_API_KEY must never carry a NEXT_PUBLIC_ prefix, or
// it'd ship to the browser bundle. See .env.example.
const FROM = process.env.EMAIL_FROM ?? "Inoxity <noreply@inoxity.app>";

export interface SendEmailResult {
  error: string | null;
}

// Lazily constructed — `new Resend(undefined)` throws immediately, and
// this module is imported at build time by every route that touches it
// (team-actions.ts, /api/contact), so an eager `new Resend(...)` at module
// scope would break `next build`/every request until RESEND_API_KEY is
// actually set. Building it inside sendEmail() instead means "not
// configured yet" surfaces as an ordinary { error } result.
let resend: Resend | null = null;
function client(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

// The reusable primitive — team-actions.ts's invite email and the
// participant-facing /api/contact route both build on this rather than
// calling the Resend client directly, so there's exactly one place that
// knows how to send mail.
export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendEmailResult> {
  const resend = client();
  if (!resend) {
    console.error("[sendEmail] RESEND_API_KEY is not set — email not sent");
    return { error: "Email sending isn't set up yet." };
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    replyTo: args.replyTo,
  });

  if (error) {
    // Never log email bodies/addresses beyond what's already in scope —
    // matches the no-payload-logging discipline in auth-actions.ts.
    console.error("[sendEmail]", error.name, error.message);
    return { error: "Something went wrong sending the email." };
  }
  return { error: null };
}

const ROLE_LABELS: Record<"admin" | "editor" | "viewer", string> = {
  admin: "an Admin",
  editor: "an Editor",
  viewer: "a Viewer",
};

export async function sendStudyInviteEmail(args: {
  to: string;
  studyDisplayName: string;
  inviterName: string;
  role: "admin" | "editor" | "viewer";
  acceptUrl: string;
}): Promise<SendEmailResult> {
  const roleLabel = ROLE_LABELS[args.role];
  return sendEmail({
    to: args.to,
    subject: `${args.inviterName} invited you to ${args.studyDisplayName} on Inoxity`,
    html: `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h1 style="font-size: 18px; font-weight: 500;">You've been invited to a study on Inoxity</h1>
        <p style="font-size: 14px; line-height: 1.6;">
          <strong>${escapeHtml(args.inviterName)}</strong> invited you to join
          <strong>${escapeHtml(args.studyDisplayName)}</strong> as ${roleLabel}.
        </p>
        <p style="margin: 24px 0;">
          <a href="${args.acceptUrl}" style="background: #1a1a1a; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px;">
            View invite
          </a>
        </p>
        <p style="font-size: 12px; color: #666;">
          If you weren't expecting this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!)
  );
}
