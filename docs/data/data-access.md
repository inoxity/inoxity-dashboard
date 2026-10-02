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

## What's in each table

These are the tables your Study Backend uses to store participant data. Find them under **Table Editor** in your Supabase project, or query them in the **SQL Editor**. All times are stored in UTC.

Participants can't write to any of these tables directly: the app saves data only through a few specific database functions, which check who is calling first. Most tables can't be read from the app at all, and the few that can show a participant only their own row. [Security architecture](security.md#2-row-level-security-the-direct-read-layer) explains how each table is protected.

!!! info "Generated from the code"
    The column lists and SQL definitions below are generated from Inoxity's current code every time these docs are built, so they match what the dashboard's setup files create.

### participants

One row per person who has started enrolling, identified by their anonymous sign-in. Most analyses use `study_enrollments` instead, which has the participant identifier.

--8<-- "generated/tables/participants.md"

??? note "SQL definition"

    --8<-- "generated/sql/participants.md"

### study_enrollments

One row per enrolled participant. Join other tables to this one on `enrollment_id` to get the participant identifier.

--8<-- "generated/tables/study_enrollments.md"

??? note "SQL definition"

    --8<-- "generated/sql/study_enrollments.md"

### survey_events

One row each time a participant opens a survey, and one when they complete it (if [completion tracking](../studies/survey-completion-tracking.md) is set up). The survey answers themselves stay in your survey tool.

--8<-- "generated/tables/survey_events.md"

??? note "SQL definition"

    --8<-- "generated/sql/survey_events.md"

### Apple Health sample tables

Each Apple Health data type has its own table, such as `heart_rate_samples` or `sleep_samples`. They all share the same columns, except for the value column, which is named for what it measures (`bpm` for heart rate, `steps` for step count and so on). [Supported Apple Health data](../reference/supported-healthkit-data.md) lists every type's table and value column. Here is `heart_rate_samples` as an example:

--8<-- "generated/tables/heart_rate_samples.md"

??? note "SQL definition"

    --8<-- "generated/sql/heart_rate_samples.md"

### participant_characteristics

Only present if the study collects Apple Health characteristics. One row per participant.

--8<-- "generated/tables/participant_characteristics.md"

### media_uploads

Only present if the study collects media. One row per uploaded file; the file itself is in the `user-uploads` Storage bucket at `storage_path`.

--8<-- "generated/tables/media_uploads.md"

??? note "SQL definition"

    --8<-- "generated/sql/media_uploads.md"

### withdrawal_requests

One row per withdrawal. If the participant asked for their data to be deleted, their other rows are removed and this row stays as an anonymized record, with `participant_id` and `enrollment_id` cleared.

--8<-- "generated/tables/withdrawal_requests.md"

## Example queries

Paste these into your Supabase project's **SQL Editor**. Every Inoxity column they use is checked against the current tables when these docs are built.

=== "Survey completion"

    --8<-- "generated/queries/survey-completion.md"

=== "Local time"

    --8<-- "generated/queries/local-time.md"

=== "Daily heart rate"

    --8<-- "generated/queries/daily-heart-rate.md"

=== "Match survey answers"

    --8<-- "generated/queries/join-survey-answers.md"

    Every response in your survey tool carries `inoxity_occurrence_id`, so once you import its export into your Study Backend (or any database), you can join it to `survey_events` on `occurrence_id`. Change `survey_answers` to the name of your imported table.

## Access control

Dashboard collaborator roles and Supabase project access are separate. The research team is responsible for granting Supabase access, exports and downstream storage, credential rotation, activity monitoring, auditing, retention, and removing access when staff leave the project.

Survey response data is managed through the research team's chosen survey provider, such as Qualtrics. Inoxity records survey opened/completed events when configured; it does not retrieve or export the provider's survey responses.

## Service credentials

The participant configuration uses only the public anon/publishable key. Service-role keys, database passwords, and other administrative secrets must never be placed in dashboard configuration, app configuration, documentation, or source control.
