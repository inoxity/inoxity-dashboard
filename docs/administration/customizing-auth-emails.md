# Customizing researcher authentication emails

This page is for administrators of the Inoxity Control Backend. It does not apply to participant enrollment, which uses study codes and anonymous authentication.

## Where templates live

Supabase authentication templates are configured in the active Control Backend project's Supabase Dashboard. They are not deployed from a `supabase/config.toml` in this repository.

The repository retains a version-controlled operational copy of the current subjects and HTML in [`docs/customizing-auth-emails.md`](https://github.com/inoxity/inoxity-dashboard/blob/main/docs/customizing-auth-emails.md). Administrators should compare that source with the active Supabase project before making changes.

## Current flows

The dashboard code supports:

- account confirmation;
- password reset;
- researcher email changes;
- dashboard-managed research-team invitations sent through the application's email service.

Magic-link wording is retained in the operational template file, but the current researcher interface uses email and password rather than a passwordless sign-in flow.

## Confirmation-link routing

The operational templates route token hashes through the dashboard's `/auth/confirm` endpoint, where the server verifies the one-time token and redirects to the appropriate page. An older `/auth/callback` code-exchange route remains as a fallback for already-issued links using the previous format.

## Administration cautions

- Treat the operational template file as a reference, not proof of the live Supabase setting.
- Test confirmation, recovery, invitation, and email-change flows after any domain or template change.
- Keep SMTP credentials and service-role credentials out of source control.
- Confirm institution-specific mail filtering and sender-domain requirements with the Inoxity administrators.
