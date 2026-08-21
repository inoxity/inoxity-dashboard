# Customizing the Supabase auth emails

Right now, signup confirmation / invite / password reset emails come straight from Supabase's default templates — generic subject lines, no Inoxity branding. These templates aren't stored in this repo (there's no `supabase/config.toml` in either the dashboard or `inoxity_v2` — Supabase Auth email templates only live in the Supabase Dashboard for this project), so customizing them is a copy-paste job in Supabase's UI, not a code change.

**Where:** Supabase Dashboard → your project → **Authentication → Email Templates**.

For each of the four templates below, paste the subject into the "Subject heading" field and the HTML into the "Message body" field, then Save. Supabase's `{{ .ConfirmationURL }}` placeholder gets swapped in automatically at send time — leave it exactly as written.

**Reminder for later:** these live only in Supabase's dashboard, not in git — if this project is ever recreated (new Supabase project), this page has to be redone from scratch there.

---

## 1. Confirm signup

**Subject:** `Confirm your Inoxity researcher account`

```html
<div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #211129;">
  <p style="font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #82a3a3; margin: 0 0 24px;">Inoxity</p>
  <h1 style="font-size: 20px; font-weight: 500; margin: 0 0 16px;">Confirm your account</h1>
  <p style="font-size: 14px; line-height: 1.6; color: #4a3d52;">
    You're setting up a researcher account on the Inoxity Dashboard. Confirm your email to finish creating it.
  </p>
  <p style="margin: 28px 0;">
    <a href="{{ .ConfirmationURL }}" style="background: #211129; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
      Confirm email
    </a>
  </p>
  <p style="font-size: 12px; color: #999;">
    If you didn't create this account, you can safely ignore this email.
  </p>
</div>
```

## 2. Invite user

Used when Supabase's own `auth.admin.inviteUserByEmail` is triggered (not the same as the Research Team feature's own invite emails, which go through Resend — see [`src/lib/email.ts`](../src/lib/email.ts) — this template only applies if that Supabase-native invite path is ever used directly).

**Subject:** `You've been invited to Inoxity`

```html
<div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #211129;">
  <p style="font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #82a3a3; margin: 0 0 24px;">Inoxity</p>
  <h1 style="font-size: 20px; font-weight: 500; margin: 0 0 16px;">You've been invited</h1>
  <p style="font-size: 14px; line-height: 1.6; color: #4a3d52;">
    You've been invited to join the Inoxity Researcher Dashboard. Accept the invite to set up your account.
  </p>
  <p style="margin: 28px 0;">
    <a href="{{ .ConfirmationURL }}" style="background: #211129; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
      Accept invite
    </a>
  </p>
</div>
```

## 3. Reset password

**Subject:** `Reset your Inoxity password`

```html
<div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #211129;">
  <p style="font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #82a3a3; margin: 0 0 24px;">Inoxity</p>
  <h1 style="font-size: 20px; font-weight: 500; margin: 0 0 16px;">Reset your password</h1>
  <p style="font-size: 14px; line-height: 1.6; color: #4a3d52;">
    We got a request to reset the password on your Inoxity researcher account. This link expires shortly.
  </p>
  <p style="margin: 28px 0;">
    <a href="{{ .ConfirmationURL }}" style="background: #211129; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
      Reset password
    </a>
  </p>
  <p style="font-size: 12px; color: #999;">
    If you didn't request this, you can safely ignore this email — your password won't change.
  </p>
</div>
```

## 4. Magic link

Only relevant if passwordless sign-in is ever enabled — the dashboard currently only uses email+password, so this template is unused today but worth branding for consistency.

**Subject:** `Your Inoxity sign-in link`

```html
<div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #211129;">
  <p style="font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #82a3a3; margin: 0 0 24px;">Inoxity</p>
  <h1 style="font-size: 20px; font-weight: 500; margin: 0 0 16px;">Your sign-in link</h1>
  <p style="font-size: 14px; line-height: 1.6; color: #4a3d52;">Use the link below to sign in to the Inoxity Dashboard.</p>
  <p style="margin: 28px 0;">
    <a href="{{ .ConfirmationURL }}" style="background: #211129; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
      Sign in
    </a>
  </p>
</div>
```

## 5. Change email address

Fires when `supabase.auth.updateUser({ email })` is called — not wired up in the dashboard yet (planned for a future Settings addition), but the template is ready for whenever that ships. With Supabase's "Secure email change" setting on (the default), this same template is sent to *both* the old and new address — `{{ .NewEmail }}` works fine either way since it just states what the new address would be.

**Subject:** `Confirm your new Inoxity email address`

```html
<div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #211129;">
  <p style="font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #82a3a3; margin: 0 0 24px;">Inoxity</p>
  <h1 style="font-size: 20px; font-weight: 500; margin: 0 0 16px;">Confirm your new email address</h1>
  <p style="font-size: 14px; line-height: 1.6; color: #4a3d52;">
    You asked to change the email on your Inoxity researcher account to <strong>{{ .NewEmail }}</strong>. Confirm this address to finish the change.
  </p>
  <p style="margin: 28px 0;">
    <a href="{{ .ConfirmationURL }}" style="background: #211129; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
      Confirm new email
    </a>
  </p>
  <p style="font-size: 12px; color: #999;">
    If you didn't request this change, you can safely ignore this email — your account email won't change until confirmed.
  </p>
</div>
```

---

## Security notifications (separate section — corrects an earlier mistake)

Supabase also has a **Security** section (separate tab from Email Templates above) with its own per-event toggles and editable templates: Password changed, Email address changed, Phone number changed, Sign-in method linked/removed, MFA method added/removed. Each has an "Enable notification" toggle plus its own Subject/Body — I initially told the user these didn't exist and would need custom Resend code, which was wrong; Supabase added this natively at some point. Only Password changed and Email address changed are branded so far (both already enabled).

**Password changed** — Subject: `Your Inoxity password was changed`

```html
<div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #211129;">
  <p style="font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #82a3a3; margin: 0 0 24px;">Inoxity</p>
  <h1 style="font-size: 20px; font-weight: 500; margin: 0 0 16px;">Your password was changed</h1>
  <p style="font-size: 14px; line-height: 1.6; color: #4a3d52;">
    The password on your Inoxity researcher account was just changed. If this was you, no action is needed.
  </p>
  <p style="margin: 28px 0;">
    <a href="https://www.inoxity.org/forgot-password" style="background: #211129; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
      Wasn't you? Reset your password
    </a>
  </p>
  <p style="font-size: 12px; color: #999;">
    This is an automatic security notification — you don't need to do anything if you made this change yourself.
  </p>
</div>
```

**Email address changed** — Subject: `Your Inoxity account email was changed`. Available variables (shown in this template's own editor, different set from the Email Templates tab above): `{{ .Email }}` (the new/current address), `{{ .OldEmail }}`, `{{ .Data }}`, `{{ .SiteURL }}`.

```html
<div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #211129;">
  <p style="font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #82a3a3; margin: 0 0 24px;">Inoxity</p>
  <h1 style="font-size: 20px; font-weight: 500; margin: 0 0 16px;">Your account email was changed</h1>
  <p style="font-size: 14px; line-height: 1.6; color: #4a3d52;">
    The email on your Inoxity researcher account was changed from <strong>{{ .OldEmail }}</strong> to <strong>{{ .Email }}</strong>. If this was you, no action is needed.
  </p>
  <p style="font-size: 14px; line-height: 1.6; color: #4a3d52;">
    If you didn't make this change, please contact us immediately — someone else may have access to your account.
  </p>
  <p style="font-size: 12px; color: #999;">
    This is an automatic security notification.
  </p>
</div>
```

## Optional follow-up: sending these through your own domain

By default these still send from Supabase's shared mail infrastructure (`noreply@mail.app.supabase.io`-style address), which is fine functionally but doesn't look fully "from Inoxity" in a recipient's inbox. If that matters later, Supabase supports plugging in custom SMTP (Authentication → Settings → SMTP Settings) — you could point it at the same Resend account set up for [Research Team invites](../src/lib/email.ts) and participant contact messages, so every Inoxity email (auth + product) comes from one consistent sender. Not required for the branded templates above to work — just a nicer-to-have once Resend is already set up.
