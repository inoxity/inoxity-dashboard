# Study Backend

A Study Backend is one independent Supabase project dedicated to exactly one study. The research team creates, owns, and administers it.

## Identity verification

The project contains one `study_backend_metadata` row. Its backend UUID, stable study ID, expected study code, supported configuration schema version, and active state must agree with the Control Backend descriptor and study configuration.

The iOS app verifies this identity after anonymous authentication. A mismatch is rejected to reduce the risk of routing participant data to the wrong project.

## Access design

Participant operations use restricted Postgres functions and participant-scoped Storage policies. Functions derive ownership from the authenticated anonymous user and validate the enrollment and backend identity. Broad direct client table writes are revoked.

## One project per study

Do not point multiple studies at one Study Backend, even for temporary testing. The singleton metadata and identity checks are intentionally designed to prevent that arrangement.

## Configuration changes

The backend declares the configuration schema version it supports. This value does not automatically change when the dashboard schema changes. Update it only after verifying the backend schema and app compatibility for the new configuration.

If a study begins collecting additional data types, the existing Supabase project may need new tables or functions. Review the newly generated SQL and apply only the necessary changes.
