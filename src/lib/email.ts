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
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;">
        <p style="font-size:13px;font-weight:700;letter-spacing:0.15em;color:#6b8683;margin:0 0 32px;text-transform:uppercase;">
          Inoxity
        </p>
        <h1 style="font-size:28px;font-weight:700;color:#111;margin:0 0 20px;">You've been invited to a study</h1>
        <p style="font-size:16px;line-height:1.5;color:#333;margin:0 0 28px;">
          <strong>${escapeHtml(args.inviterName)}</strong> invited you to join
          <strong>${escapeHtml(args.studyDisplayName)}</strong> as ${roleLabel}.
        </p>
        <p style="margin:0 0 28px;">
          <a href="${args.acceptUrl}" style="display:inline-block;padding:14px 28px;background:#211129;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
            View invite
          </a>
        </p>
        <p style="font-size:13px;color:#8a8a8a;margin:0;">
          If you weren't expecting this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendRoleChangedEmail(args: {
  to: string;
  studyDisplayName: string;
  role: "admin" | "editor" | "viewer";
  teamUrl: string;
}): Promise<SendEmailResult> {
  const roleLabel = ROLE_LABELS[args.role];
  return sendEmail({
    to: args.to,
    subject: `Your role on ${args.studyDisplayName} was changed`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;">
        <p style="font-size:13px;font-weight:700;letter-spacing:0.15em;color:#6b8683;margin:0 0 32px;text-transform:uppercase;">
          Inoxity
        </p>
        <h1 style="font-size:28px;font-weight:700;color:#111;margin:0 0 20px;">Your role was changed</h1>
        <p style="font-size:16px;line-height:1.5;color:#333;margin:0 0 28px;">
          Your role on <strong>${escapeHtml(args.studyDisplayName)}</strong> is now ${roleLabel}.
        </p>
        <p style="margin:0 0 28px;">
          <a href="${args.teamUrl}" style="display:inline-block;padding:14px 28px;background:#211129;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
            View team
          </a>
        </p>
        <p style="font-size:13px;color:#8a8a8a;margin:0;">
          If you weren't expecting this, reach out to the study's owner or admin.
        </p>
      </div>
    `,
  });
}

// The public "Inoxity updates" mailing list (/updates). Contacts live in
// Resend, in the segment RESEND_SEGMENT_ID names, and announcements go out
// from Resend's Broadcasts page — which adds the unsubscribe link itself —
// so nothing about subscribers is ever stored in inoxity_backend.
// Note: contact creation needs a Full access API key; a "Sending access"
// key can still send email but will fail here.
export async function addMailingListContact(args: {
  email: string;
  firstName?: string;
}): Promise<SendEmailResult> {
  const resend = client();
  const segmentId = process.env.RESEND_SEGMENT_ID;
  if (!resend || !segmentId) {
    console.error("[addMailingListContact] RESEND_API_KEY or RESEND_SEGMENT_ID is not set — contact not added");
    return { error: "The mailing list isn't set up yet." };
  }

  const { error: createError } = await resend.contacts.create({
    email: args.email,
    firstName: args.firstName || undefined,
    segments: [{ id: segmentId }],
  });

  if (createError) {
    // Most likely the address is already a contact (e.g. signed up twice).
    // Make sure it's in the segment and report success either way, so the
    // form never reveals whether an address was already on the list — and
    // skip the welcome email, since they've already had one.
    const { error: addError } = await resend.contacts.segments.add({ email: args.email, segmentId });
    if (addError) {
      console.error("[addMailingListContact]", createError.name, createError.message, "/", addError.name, addError.message);
      return { error: "Something went wrong adding you to the list." };
    }
    return { error: null };
  }

  // The contact is already saved, so a failed welcome email is logged
  // (inside sendEmail) but doesn't turn the signup itself into an error.
  await sendMailingListWelcomeEmail({ to: args.email, firstName: args.firstName });
  return { error: null };
}

async function sendMailingListWelcomeEmail(args: { to: string; firstName?: string }): Promise<SendEmailResult> {
  const greeting = args.firstName ? `Hi ${escapeHtml(args.firstName)},` : "Hi there,";
  return sendEmail({
    to: args.to,
    subject: "You're on the Inoxity mailing list",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;">
        <p style="font-size:13px;font-weight:700;letter-spacing:0.15em;color:#6b8683;margin:0 0 32px;text-transform:uppercase;">
          Inoxity
        </p>
        <h1 style="font-size:28px;font-weight:700;color:#111;margin:0 0 20px;">You're on the list</h1>
        <p style="font-size:16px;line-height:1.5;color:#333;margin:0 0 16px;">${greeting}</p>
        <p style="font-size:16px;line-height:1.5;color:#333;margin:0 0 16px;">
          Thanks for your interest in Inoxity. It's undergoing active development and large-scale
          validation. We'll email you when it's ready for use, along with occasional project updates.
        </p>
        <p style="font-size:16px;line-height:1.5;color:#333;margin:0 0 28px;">
          Want early access in the meantime? Email Rachael at
          <a href="mailto:rlkee@ucdavis.edu" style="color:#211129;">rlkee@ucdavis.edu</a>.
        </p>
        <p style="font-size:13px;color:#8a8a8a;margin:0;">
          If you didn't sign up for this, you can safely ignore this email.
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
