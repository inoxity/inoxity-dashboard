# Supabase setup

Each real study needs a new Supabase project used only as that study's Study Backend.

## Before activation

1. Create a new Supabase project in the research team's organization.
2. Enable anonymous sign-ins for that project.
3. In the dashboard wizard, configure the study features first.
4. Open the Data Backend step and download the generated SQL.
5. Review the script, then run it in the new project's SQL Editor—not in the Inoxity Control Backend.
6. Generate one backend UUID and use the same value in `study_backend_metadata.backend_instance_id` and the dashboard's Backend ID.
7. Enter the project's public URL and anon/publishable key in the dashboard. Never enter the service-role key.
8. Ensure the metadata's stable study ID, expected code, schema version, and active state match the study.
9. Run verification with disposable test participants before production use.

The generated script is tailored to the study's enabled HealthKit identifiers and media setting. It contains a required application section and a clearly separated optional security-hardening section for the research team to assess.

## Schema-version check

The dashboard currently creates schema version 8 configurations, and the app accepts versions 2 through 8. A new backend should declare support for the actual active configuration version. The metadata does not update automatically when the dashboard schema version changes.

## Testing

Test the production-configured app on a physical iPhone. Confirm:

- the code resolves only the intended study;
- backend identity verification succeeds;
- enrollment and enabled feature data reach only this Study Backend;
- another anonymous user cannot access the first user's data;
- expected retries are idempotent;
- no participant enrollment records, participant identifiers, or collected study data appear in the Control Backend. Its authentication service may contain an anonymous technical account used for study-code resolution.

## Updating an existing backend

Do not paste a full newly generated setup script over an existing project without review. Table-creation statements are not universally idempotent. Compare the scripts and apply only required additions or changes, with a backup and database review appropriate to the study.
