# Configuration reference

The dashboard currently authors **configuration schema version {{ schema_version }}**. The iOS app validator accepts configuration formats **2 through {{ schema_version }}** and supplies defaults for some fields introduced in later versions. Version acceptance does not guarantee that every older configuration and Study Backend combination is operationally compatible.

Each study's settings are saved as one JSON document, which the app downloads when a participant enters the study code. You don't write it by hand: the dashboard's study wizard creates it. The examples on this page show what the wizard saves, using a sample sleep study.

!!! info "Generated from the code"
    The JSON examples on this page are generated from Inoxity's current code every time these docs are built, so they always match the format the dashboard saves.

## Top-level sections

| Section | Researcher meaning | Notable rules |
| --- | --- | --- |
| `schemaVersion` | Format version | New dashboard configurations use {{ schema_version }} |
| `identity` | Stable ID, study code, display names, welcome copy | Stable ID is a lowercase slug; code is normalized uppercase |
| `status` | Active, paused, or inactive participant state and message | Activation also requires a confirmed researcher email and a linked backend whose identity matches the study, checked with a live connection test |
| `schedule` | Study dates, time zone, duration, start-date mode | Dates are ISO; fixed mode requires a start date |
| `participantID` | Participant identifier prompt and validation | Length bounds and optional valid regular expression |
| `sleepSchedule` | Whether wake/bed times are collected | Required for wake/bed-relative schedules |
| `onboarding` | Ordered informational pages | Page IDs are nonblank and unique |
| `healthKit` | Read permission rationale, identifiers, characteristics, backfill | Identifiers must be in the supported catalog; configure a positive backfill day count rather than leaving it blank |
| `notifications` | Notification enablement and rationale | Scheduling still depends on participant permission |
| `surveys` | Survey content, URL, timing, availability, callback | IDs unique; URLs use HTTPS; schedules valid |
| `reminders` | Survey or message notifications | Survey reminders reference an enabled survey |
| `features` | Master feature switches and visible app tabs | Enabled features must be configured consistently |
| `media` | Types, limits, categories, dates, instructions/privacy | Category types must be a subset of overall accepted types |
| `support` | Study-specific contact details | Email required; website must be HTTP(S) when present |
| `faqs` | Participant-facing questions and answers | IDs nonblank and unique |
| `completion` | End-of-study screen, redirect, remaining access | Redirect must be HTTP(S) when present |
| `dataBackend` | Study-owned Supabase descriptor | HTTPS URL, UUID, public key, Production environment for researcher studies |

## Examples by section

Click the numbered markers in each example for an explanation of that setting.

### identity

--8<-- "generated/config/identity.md"

1. The study's permanent ID: lowercase letters, numbers and hyphens. Don't change it once participants have enrolled. It's also saved in your Study Backend as `stable_study_id`.
2. The enrollment code participants type into the app. It's always stored in uppercase.

### schedule

--8<-- "generated/config/schedule.md"

1. The time zone for the study's start and end dates, as an IANA name such as `America/Los_Angeles`.
2. How many days each participant takes part, counted from their own enrollment date. `null` means no fixed length: the app shows "Day X in the study" instead of "Day X of N".
3. When each participant's day 1 is: `enrollment` (the day they enroll), `fixed` (the study's start date, for everyone) or `participantSelected` (a date the participant picks).

### participantID

--8<-- "generated/config/participantID.md"

1. What the app calls the identifier, for example "SONA ID". The same label is attached to the `participant_identifier` column in your Study Backend.
2. An optional regular expression the identifier must match. See [Participant identifier rules](#participant-identifier-rules).

### healthKit

--8<-- "generated/config/healthKit.md"

1. The Apple Health data types to request. See [Supported Apple Health data](supported-healthkit-data.md) for every identifier and the table it's stored in.
2. How many days of existing Apple Health history to collect on the first sync, counting back from enrollment. `null` means the full history.

### surveys

--8<-- "generated/config/surveys.md"

1. Must be an HTTPS link. The app adds four values to the end of it; see [Tracking survey completion](../studies/survey-completion-tracking.md).
2. When the survey is scheduled. See [Schedule patterns](#schedule-patterns) for every option.
3. How many minutes before and after the scheduled time the participant can open the survey.
4. **Track completion** in the wizard. When on, the survey tool must redirect back to the app at the end.

### reminders

--8<-- "generated/config/reminders.md"

1. `survey` (tied to a survey's schedule) or `message` (a notification with its own schedule).
2. For a survey reminder, the ID of the survey it's for.
3. How many minutes before the survey's scheduled time to notify; `0` means at that time.

### media

--8<-- "generated/config/media.md"

1. Which kinds of media participants can share: `photo`, `video` or both.
2. The largest file a participant can upload, in megabytes.

### completion

--8<-- "generated/config/completion.md"

1. An optional link shown on the end-of-study screen, for example a debriefing page.
2. Whether participants can keep using the app after their participation ends.

### dataBackend

--8<-- "generated/config/dataBackend.md"

1. Must be the same UUID as `backend_instance_id` in the Study Backend's `study_backend_metadata` table. See [Supabase setup](../administration/supabase-setup.md).
2. The project's public anon (publishable) key. Never put the service-role key here.

??? example "Full example configuration"

    --8<-- "generated/config/full.md"

## Schedule patterns

| Pattern | Researcher inputs |
| --- | --- |
| One time | Date and time |
| Daily | Time each day |
| Selected weekdays | One or more weekdays and a time |
| Random window | 1–10 windows, start hour, and 1–24 hour window length; total span ≤ 24 hours |

Clock-time schedules use hour/minute. Wake- and bed-relative schedules use an offset between −1,440 and +1,440 minutes (positive is after the wake or bed time, negative is before) and require collected sleep-schedule times.

Here's how each pattern is saved. Weekdays are numbered 1 (Sunday) to 7 (Saturday).

--8<-- "generated/config/schedule-patterns.md"

## Participant identifier rules

The configured minimum may be zero, the maximum must be at least one, and the minimum cannot exceed the maximum. An optional allowed pattern must compile as a regular expression. Pattern matching may accept a matching substring; to require the entire participant identifier to match, anchor the expression with `^` and `$`. The app applies the rule before enrollment and before later identifier edits. The wizard's default is 1–64 characters, but those values are defaults rather than schema-wide limits.

## Version compatibility

Older configurations can omit fields introduced later. The app supplies compatibility defaults for fields such as schedule anchors, HealthKit backfill, and start-date mode, while the dashboard migrates stored configurations to its current authoring version when editing. These mechanisms provide format compatibility only. Researchers must still verify the active configuration, app behavior, Study Backend metadata, and database support together.

## Activation checks

Dashboard activation requires a confirmed researcher email, an enabled Study Backend descriptor, an Active configuration, and successful validation. It then connects to the Study Backend the way the app does at enrollment and confirms its backend ID, stable study ID, enrollment code, schema version, and active flag match the study.
