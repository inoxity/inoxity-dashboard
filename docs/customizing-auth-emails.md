# Customizing the Supabase auth emails

Supabase Auth email templates aren't stored in this repo — there's no
`supabase/config.toml` with a `[auth.email.template.*]` section, so these
templates only live in the Supabase Dashboard for whichever project is
currently active. This doc is the version-controlled copy of what should
be pasted there, so the branding/link-format work doesn't have to be
redone from scratch if the project is ever recreated (as happened once
already during the Control Backend migration — see
[[control-backend-supabase-migration]] equivalent notes in memory, or just
search the git history of this file).

**Where:** Supabase Dashboard → your project → **Authentication → Email
Templates** for the first 5 below, **Authentication → Security** for the
last 2. Paste the subject into "Subject heading" and the HTML into
"Message body" for each, then Save.

**Why the link is `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=...`
instead of Supabase's default `{{ .ConfirmationURL }}`:** the default link
points at `<project-ref>.supabase.co` before redirecting back here —
sender domain (`send.inoxity.org`) not matching the link's domain is a
common phishing heuristic, and is the most likely reason UC Davis's mail
filter was flagging our confirmation emails. Routing the link through our
own domain via [`/auth/confirm/route.ts`](../src/app/auth/confirm/route.ts)
(which calls `verifyOtp()` server-side) means the only domain that ever
appears in the email is ours. `/auth/callback/route.ts` (the old
code-exchange route) is kept around as a fallback for any already-sent
emails still using the old `{{ .ConfirmationURL }}` format.

**Custom SMTP is already live**, not an optional follow-up — Authentication
→ Settings → SMTP Settings is configured to send through the existing
Resend account, from `send.inoxity.org`.

---

## 1. Confirm signup

**Subject:** `Confirm your Inoxity researcher account`

```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;">
  <p style="font-size:13px;font-weight:700;letter-spacing:0.15em;color:#6b8683;margin:0 0 32px;text-transform:uppercase;">
    Inoxity
  </p>
  <h1 style="font-size:28px;font-weight:700;color:#111;margin:0 0 20px;">Confirm your account</h1>
  <p style="font-size:16px;line-height:1.5;color:#333;margin:0 0 28px;">
    You're setting up a researcher account on the Inoxity Dashboard. Confirm your email to finish creating it.
  </p>
  <p style="margin:0 0 28px;">
    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard"
       style="display:inline-block;padding:14px 28px;background:#211129;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
      Confirm email
    </a>
  </p>
  <p style="font-size:13px;color:#8a8a8a;margin:0;">If you didn't create this account, you can safely ignore this email.</p>
</div>
```

## 2. Invite user

Used when Supabase's own `auth.admin.inviteUserByEmail` is triggered — not
the same as the Research Team feature's own invite emails, which go
through Resend directly (see [`src/lib/email.ts`](../src/lib/email.ts)).
This template only applies if the Supabase-native invite path is ever used
directly (e.g. from the Supabase dashboard), which nothing in this app's
code currently does.

**Subject:** `You've been invited to Inoxity`

```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;">
  <p style="font-size:13px;font-weight:700;letter-spacing:0.15em;color:#6b8683;margin:0 0 32px;text-transform:uppercase;">
    Inoxity
  </p>
  <h1 style="font-size:28px;font-weight:700;color:#111;margin:0 0 20px;">You're invited</h1>
  <p style="font-size:16px;line-height:1.5;color:#333;margin:0 0 28px;">
    You've been invited to join Inoxity as a researcher. Click below to accept and set up your account.
  </p>
  <p style="margin:0 0 28px;">
    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/reset-password"
       style="display:inline-block;padding:14px 28px;background:#211129;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
      Accept invite
    </a>
  </p>
  <p style="font-size:13px;color:#8a8a8a;margin:0;">If you weren't expecting this invitation, you can safely ignore this email.</p>
</div>
```

## 3. Reset password

**Subject:** `Reset your Inoxity researcher account password`

```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;">
  <p style="font-size:13px;font-weight:700;letter-spacing:0.15em;color:#6b8683;margin:0 0 32px;text-transform:uppercase;">
    Inoxity
  </p>
  <h1 style="font-size:28px;font-weight:700;color:#111;margin:0 0 20px;">Reset your password</h1>
  <p style="font-size:16px;line-height:1.5;color:#333;margin:0 0 28px;">
    You requested a password reset for your Inoxity researcher account. Click below to choose a new password.
  </p>
  <p style="margin:0 0 28px;">
    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password"
       style="display:inline-block;padding:14px 28px;background:#211129;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
      Reset password
    </a>
  </p>
  <p style="font-size:13px;color:#8a8a8a;margin:0;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
</div>
```

## 4. Magic link

Only relevant if passwordless sign-in is ever enabled — the dashboard
currently only uses email+password, so this template is unused today but
worth keeping branded/functional for whenever that changes.

**Subject:** `Your Inoxity sign-in link`

```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;">
  <p style="font-size:13px;font-weight:700;letter-spacing:0.15em;color:#6b8683;margin:0 0 32px;text-transform:uppercase;">
    Inoxity
  </p>
  <h1 style="font-size:28px;font-weight:700;color:#111;margin:0 0 20px;">Sign in to Inoxity</h1>
  <p style="font-size:16px;line-height:1.5;color:#333;margin:0 0 28px;">
    Click below to sign in to your Inoxity researcher account.
  </p>
  <p style="margin:0 0 28px;">
    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard"
       style="display:inline-block;padding:14px 28px;background:#211129;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
      Sign in
    </a>
  </p>
  <p style="font-size:13px;color:#8a8a8a;margin:0;">If you didn't request this, you can safely ignore this email.</p>
</div>
```

## 5. Change email address

Fires when `supabase.auth.updateUser({ email })` is called — wired up via
`changeEmail()` in [`src/lib/settings-actions.ts`](../src/lib/settings-actions.ts).
With Supabase's "Secure email change" setting on (the default), this same
template is sent to *both* the old and new address; `{{ .NewEmail }}` is
what the address is changing *to*, regardless of which of the two inboxes
received this particular copy.

**Subject:** `Confirm your new Inoxity email address`

```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;">
  <p style="font-size:13px;font-weight:700;letter-spacing:0.15em;color:#6b8683;margin:0 0 32px;text-transform:uppercase;">
    Inoxity
  </p>
  <h1 style="font-size:28px;font-weight:700;color:#111;margin:0 0 20px;">Confirm your new email</h1>
  <p style="font-size:16px;line-height:1.5;color:#333;margin:0 0 28px;">
    You're updating the email address for your Inoxity researcher account. Confirm this new address to finish the change.
  </p>
  <p style="margin:0 0 28px;">
    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/dashboard/settings"
       style="display:inline-block;padding:14px 28px;background:#211129;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
      Confirm new email
    </a>
  </p>
  <p style="font-size:13px;color:#8a8a8a;margin:0;">If you didn't request this change, please secure your account.</p>
</div>
```

---

## Security notifications (separate tab from Email Templates above)

Supabase's **Security** tab has its own per-event toggles and templates:
Password changed, Email address changed, Phone number changed, Sign-in
method linked/removed, MFA method added/removed — each with its own
"Enable notification" toggle plus Subject/Body. Only Password changed and
Email address changed are branded so far (both enabled).

These are plain notices, not part of the OTP-verification flow — no
`{{ .TokenHash }}`/`/auth/confirm` involved, so nothing about the phishing-link
issue above applies to them.

**Password changed** — Subject: `Your Inoxity password was changed`

```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;">
  <p style="font-size:13px;font-weight:700;letter-spacing:0.15em;color:#6b8683;margin:0 0 32px;text-transform:uppercase;">
    Inoxity
  </p>
  <h1 style="font-size:28px;font-weight:700;color:#111;margin:0 0 20px;">Your password was changed</h1>
  <p style="font-size:16px;line-height:1.5;color:#333;margin:0 0 28px;">
    The password on your Inoxity researcher account was just changed. If this was you, no action is needed.
  </p>
  <p style="margin:0 0 28px;">
    <a href="{{ .SiteURL }}/forgot-password"
       style="display:inline-block;padding:14px 28px;background:#211129;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
      Wasn't you? Reset your password
    </a>
  </p>
  <p style="font-size:13px;color:#8a8a8a;margin:0;">This is an automatic security notification — you don't need to do anything if you made this change yourself.</p>
</div>
```

**Email address changed** — Subject: `Your Inoxity account email was changed`.
Available variables (shown in this template's own editor, different set
from the Email Templates tab above): `{{ .Email }}` (the new/current
address), `{{ .OldEmail }}`, `{{ .Data }}`, `{{ .SiteURL }}`.

```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;">
  <p style="font-size:13px;font-weight:700;letter-spacing:0.15em;color:#6b8683;margin:0 0 32px;text-transform:uppercase;">
    Inoxity
  </p>
  <h1 style="font-size:28px;font-weight:700;color:#111;margin:0 0 20px;">Your account email was changed</h1>
  <p style="font-size:16px;line-height:1.5;color:#333;margin:0 0 20px;">
    The email on your Inoxity researcher account was changed from <strong>{{ .OldEmail }}</strong> to <strong>{{ .Email }}</strong>. If this was you, no action is needed.
  </p>
  <p style="font-size:16px;line-height:1.5;color:#333;margin:0 0 28px;">
    If you didn't make this change, please contact us immediately — someone else may have access to your account.
  </p>
  <p style="font-size:13px;color:#8a8a8a;margin:0;">This is an automatic security notification.</p>
</div>
```

No button/link on this one, deliberately — it's purely informational, so
there's nothing that can break regardless of domain changes.
