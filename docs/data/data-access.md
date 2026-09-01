# Accessing study data

Researchers access, query, download, and manage participant data strictly through their own Supabase Study Backend project. Inoxity does not read, view, query, or export participant study data, and the current dashboard provides no participant-data browser or export workflow.

## Where to look

Use the Supabase project associated with the study. Depending on enabled features, relevant resources include enrollments, survey events, per-type HealthKit sample tables, participant characteristics, media metadata, the media Storage bucket, and withdrawal audit records.

## Interpret records carefully

- `survey_events` records survey openings and completions, not answers collected by an external survey platform.
- HealthKit records are normalized samples received by the app; later Apple Health deletions and corrections are not synchronized.
- See My Data summaries are calculated locally and are not uploaded as summary records.
- Participant identifiers follow the study-defined format and may not be globally unique outside that study.
- A withdrawal deletion audit can remain after participant rows are anonymized/deleted.

## Access control

Dashboard collaborator roles and Supabase project access are separate. The research team is responsible for granting Supabase access, exports and downstream storage, credential rotation, activity monitoring, auditing, retention, and removing access when staff leave the project.

Survey response data is managed through the research team's chosen survey provider, such as Qualtrics. Inoxity records survey opened/completed events when configured; it does not retrieve or export the provider's survey responses.

## Service credentials

The participant configuration uses only the public anon/publishable key. Service-role keys, database passwords, and other administrative secrets must never be placed in dashboard configuration, app configuration, documentation, or source control.
