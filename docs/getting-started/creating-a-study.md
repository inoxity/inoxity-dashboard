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

The configuration contains a status such as Active, Paused, or Inactive. The dashboard also has an activation action on the study detail page. Activation requires a confirmed researcher email, an enabled Study Backend descriptor, an Active configuration, and successful dashboard schema validation. It does not test whether the Study Backend is reachable or fully provisioned. Set the configuration status to Active, save it, verify the backend separately, and activate the study before real participants can resolve it.

## After saving

Before sharing the code:

- provision and verify the Study Backend;
- review participant-facing copy and requested permissions;
- check the intended research-team access;
- test with the production-configured iOS app on a physical iPhone;
- confirm that participant data appears only in the intended Study Backend.
