# Creating a researcher account

The researcher dashboard uses email-and-password accounts managed by its Control Backend Supabase project.

## Sign up

1. Open the dashboard's **Sign up** page.
2. Enter your email address and password.
3. Submit the form.
4. Open the confirmation message and follow its confirmation link.
5. Sign in and open the Dashboard.

The dashboard can display an email-confirmation reminder until the address is confirmed. Password-reset and email-change flows are also available from the authentication and Settings pages.

## Researcher versus participant identity

Researcher accounts are not participant accounts. Participants do not sign into the iOS app with a researcher email or password. The participant app uses a study code and anonymous backend authentication, plus any study-specific participant identifier configured by the research team.

## Administrative dependency

Confirmation, reset, invitation, and change-email messages depend on the Control Backend's Supabase email configuration. Inoxity administrators can review [Customizing authentication emails](../administration/customizing-auth-emails.md).
