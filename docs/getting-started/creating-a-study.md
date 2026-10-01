# Creating a study

Use the dashboard's study wizard to create the versioned configuration consumed by the participant app.

## Before you begin

Have approved study materials available, including participant-facing names and messages, requested data types, survey URLs, scheduling rules, support contacts, and the intended participant identifier format. You will also need a dedicated Supabase project before activation.

## Create and save a draft

Select **New study** from the Dashboard. The wizard is divided into sections for basics, participant onboarding, permissions, surveys, reminders, features/media, support/FAQs/completion, Data Backend, and review.

Drafts may omit a Data Backend. Activation is blocked until a backend is enabled and the configuration passes validation.

## Study code and identity

The stable study ID is an internal lowercase slug used in configuration and backend identity. The study code is the participant-facing routing and enrollment value; it is not a password or security boundary. Treat both as durable identifiers: changing identifiers after external systems or participants depend on them can break routing or data continuity.

## Active status versus activation

The configuration contains a status such as Active, Paused, or Inactive. The dashboard also has an activation action on the study detail page. Activation requires a confirmed researcher email, then runs the same checks the iOS app runs when a participant enrolls: the configuration must be valid, the status must be Active, a Data Backend must be linked, dates must be real calendar dates, and the study end date must not have passed. It then connects to the Study Backend the way the app does and confirms its backend ID, stable study ID, enrollment code, schema version, and active flag match the study. Every problem is listed by wizard step. A start date in the future is allowed, with a warning that participants can't enroll until then. Set the configuration status to Active, save it, and activate the study before real participants can resolve it.

## After saving

Before sharing the code:

- provision and verify the Study Backend;
- review participant-facing copy and requested permissions;
- check the intended research-team access;
- test with the production-configured iOS app on a physical iPhone;
- confirm that participant data appears only in the intended Study Backend.
