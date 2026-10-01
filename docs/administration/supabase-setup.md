# Supabase setup

Each real study needs a new Supabase project used only as that study's Study Backend.

## Before activation

1. Create a new Supabase project in the research team's organization.
2. Enable anonymous sign-ins for that project.
3. In the dashboard wizard, configure the study features first.
4. Open the Data Backend step and download both generated files: **1. database structure** and **2. security**.
5. Review them, then run file 1 and then file 2 in the new project's SQL Editor—not in the Inoxity Control Backend.
6. Generate one backend UUID and use the same value in `study_backend_metadata.backend_instance_id` and the dashboard's Backend ID.
7. Enter the project's public URL and anon/publishable key in the dashboard. Never enter the service-role key.
8. Ensure the metadata's stable study ID, expected code, schema version, and active state match the study.
9. Use **Test connection** on the Data Backend step to confirm the project matches the study.
10. Run verification with disposable test participants before production use.

The generated files are tailored to the study's enabled HealthKit identifiers and media setting:

- **File 1, database structure:** the tables, functions, Storage bucket, and identity row the Inoxity app needs to store and sync the study's data.
- **File 2, security:** row level security, policies, and which functions signed-in participants may call, followed by optional hardening suggestions. Run it after file 1. Don't skip it: without it, Supabase's defaults leave the tables readable by anyone with the project's anon key, which ships inside the app.

Applied together, the two files create exactly the same database as the earlier single setup script.

!!! warning "Important note on security"
    The Inoxity team does not provide or take responsibility for the security of your study's database. Security rules must be developed based on study-specific and institutional policies, so that they align with your study's requirements, including data sensitivity, regulatory compliance (e.g., IRB, HIPAA), and ethical guidelines. The security file is a starting template only: it contains the access rules the Inoxity app needs to work with your database, and your team should review and adapt it. For an overview of how these rules work, see Supabase's [Row Level Security guide](https://supabase.com/docs/guides/database/postgres/row-level-security).

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

Do not paste newly generated setup files over an existing project without review. Table-creation statements are not universally idempotent. Compare the scripts and apply only required additions or changes, with a backup and database review appropriate to the study.
