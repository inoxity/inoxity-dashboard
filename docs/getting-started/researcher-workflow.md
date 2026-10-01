# Researcher workflow

This page follows a study from initial setup through participant use.

## 1. Create and confirm your researcher account

Create an account with an email address and password, then use the confirmation email to verify the address. The dashboard currently uses email-and-password authentication; it does not expose passwordless sign-in in its interface.

## 2. Create a study draft

From the Dashboard, create a study. Work through the study wizard and save incomplete work as a draft when needed. The study cannot be activated until its required configuration is valid and a Data Backend is linked.

## 3. Configure the study

Define:

- the study's identity, code, status, dates, and participant duration;
- how participants identify themselves and when their study day 1 begins;
- onboarding pages and optional sleep-schedule collection;
- requested Apple Health data and notification rationale;
- surveys, schedules, availability windows, and reminders;
- visible app tabs, optional media collection, support, FAQs, and completion behavior.

Configuration controls what the participant app displays and does. It does not substitute for consent language or protocol approval.

## 4. Provision a dedicated Study Backend

Create a new Supabase project for this study and enable anonymous authentication. In the dashboard's Data Backend step:

1. download both generated setup files (database structure, then security);
2. run file 1 and then file 2 in the new project's SQL Editor;
3. use the same generated backend UUID in the dashboard and the backend metadata;
4. enter the project's public URL and anon/publishable key;
5. click **Test connection** to confirm the project matches the study.

See [Supabase setup](../administration/supabase-setup.md) before activating the study.

## 5. Add the research team

Use **Research Team** to invite collaborators and assign an Admin, Editor, or Viewer role. Ownership transfer and role changes are separate privileged actions. Confirm the intended access level before inviting staff.

## 6. Review and activate

The wizard's Review step and the study detail page both show a **Ready to activate?** checklist. Activation requires a confirmed researcher email, then runs the same checks the iOS app runs when a participant enrolls: the configuration must be valid, the status must be Active, a Data Backend must be linked, dates must be real calendar dates, and the study end date must not have passed. It then connects to the Study Backend the way the app does and confirms its backend ID, stable study ID, enrollment code, schema version, and active flag match the study. Every problem is listed by wizard step. A start date in the future is allowed, with a warning that participants can't enroll until then. Set the configuration status to Active, save it, and then use the study detail page's activation control.

## 7. Share the study code

Provide participants with the exact study code through approved recruitment or study materials. Codes are normalized to uppercase by the system, but researchers should distribute the displayed code exactly as approved. A study code is a routing and enrollment value, not a password or security boundary.

## 8. Participant enrollment and permissions

The participant enters the code, the app verifies the Study Backend, and configured onboarding begins. The app may ask for a participant identifier, a participant-selected start date, sleep schedule, Apple Health access, and notifications. Permission prompts are controlled by iOS; declining a permission limits the related feature.

## 9. Data collection and study management

The app schedules configured activities and syncs supported data directly to the Study Backend. Researchers manage study configuration and collaborators in the dashboard, but access, query, download, and manage participant data strictly through their own Supabase project. Inoxity does not read, view, query, or export participant study data.

!!! warning "Changing an active study"
    A configuration change can also require a backend schema change. For example, adding a HealthKit type may require applying the corresponding new generated SQL pieces. Do not blindly rerun an entire setup script against an existing backend.
