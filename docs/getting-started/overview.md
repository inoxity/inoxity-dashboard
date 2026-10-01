# How Inoxity fits together

Inoxity separates study management from participant data storage. This is the key concept to understand before creating a study.

## Researcher side

Researchers use the dashboard to define the study identity, dates, participant identifier rules, onboarding pages, permissions, surveys, reminders, app features, support information, and Study Backend connection. The dashboard validates this configuration and stores it in the Control Backend.

The dashboard also generates two SQL setup files tailored to the study: one for the database structure and one for security. A research team runs both, in order, in a new Supabase project dedicated to that study.

## Participant side

Participants enter a study code in the iOS app. The app asks the Control Backend to resolve the code. A successful response includes the study configuration and the public descriptor for its Study Backend.

The app then authenticates anonymously with that Study Backend and verifies that its identity matches the descriptor. If the backend identity, study, code, schema version, or environment is inconsistent, the app rejects the route rather than sending participant data to it.

After enrollment, participant-facing writes go directly to the Study Backend. They do not pass through the Control Backend.

## Two backends with different responsibilities

| | Control Backend | Study Backend |
| --- | --- | --- |
| Scope | Shared Inoxity routing and researcher infrastructure | Exactly one study |
| Managed by | Inoxity | The research team |
| Stores | Study metadata, configuration, ownership/collaboration, backend routing | Participants, enrollments, survey events, configured HealthKit samples, media, withdrawals |
| Participant access | Resolve an exact study code | Anonymous, study-scoped RPCs and Storage policies |

See [Data overview](../data/overview.md) for a fuller description.

## Important boundaries

- A Study Backend must not be reused across studies.
- Only the public Supabase URL and anon/publishable key belong in the study configuration. Never enter a service-role key.
- The research team remains responsible for its Supabase project, access controls, retention, exports, and governance.
- The iOS app reads the current versioned configuration. Dashboard schema changes and backend metadata must remain compatible.
