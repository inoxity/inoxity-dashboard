# Data overview

Inoxity uses a split-backend design so participant data can remain in infrastructure controlled by the research team.

## Data flow

1. The participant submits a study code to the Control Backend.
2. The Control Backend returns the versioned study configuration and public Study Backend descriptor.
3. The app authenticates anonymously with the Study Backend and verifies its identity.
4. Enrollment and configured study data flow directly between the app and that Study Backend.

The Control Backend stores routing and researcher-management information, not participant enrollments, participant identifiers, or collected HealthKit, survey, or media data. Its authentication service may create an anonymous technical account for study-code resolution; this is not a study enrollment.

## Study Backend resources

Depending on configuration, generated SQL creates:

| Resource | Purpose |
| --- | --- |
| `study_backend_metadata` | Singleton identity and supported configuration schema version |
| `participants` | Backend-authenticated participant records |
| `study_enrollments` | Study enrollment and participant identifier |
| `survey_events` | Survey-opened and survey-completed events |
| Per-type HealthKit tables | Configured normalized HealthKit samples |
| `participant_characteristics` | Optional one-time Apple Health characteristics |
| `media_uploads` | Metadata for uploaded participant media |
| `withdrawal_requests` | Withdrawal choice and anonymized deletion audit |
| `user-uploads` | Supabase Storage bucket for media files |

## Research-team responsibility

The research team owns the Study Backend and is responsible for:

- project administration and account security;
- approving direct researcher access;
- backups, exports, retention, and deletion procedures;
- institutional compliance and data-use controls;
- monitoring storage and database usage;
- reviewing generated SQL and any later schema changes.
