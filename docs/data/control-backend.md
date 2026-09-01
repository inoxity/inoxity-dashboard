# Control Backend

The Control Backend is the shared Inoxity Supabase project used by the dashboard and the participant app's initial study-code lookup.

## What it stores

- researcher profiles and authentication accounts;
- study metadata and versioned configuration JSON;
- study ownership, collaborators, and invitations;
- the public descriptor needed to route the app to a study-owned backend.

The Data Backend descriptor is stored inside the study's configuration and includes a backend UUID, public Supabase URL, anon/publishable key, and environment.

## Participant-facing access

The participant role is restricted to resolving an exact study code through a dedicated function. It cannot list studies or modify configuration. A valid bootstrap response gives the app enough public information to connect to the Study Backend.

## Participant-data boundary

The Control Backend stores no participant enrollment records, participant identifiers, or collected study data. Its authentication service may create an anonymous technical account used for study-code resolution; this is not stored as a study enrollment. Enrollments, withdrawals, survey events, HealthKit samples, media metadata, and uploaded files belong in the Study Backend.

!!! warning
    Never apply Study Backend migrations or generated participant-data SQL to the Control Backend.
