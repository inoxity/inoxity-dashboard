# Configuration reference

The dashboard currently authors **configuration schema version 8**. The iOS app validator accepts configuration formats **2 through 8** and supplies defaults for some fields introduced in later versions. Version acceptance does not guarantee that every older configuration and Study Backend combination is operationally compatible.

## Top-level sections

| Section | Researcher meaning | Notable rules |
| --- | --- | --- |
| `schemaVersion` | Format version | New dashboard configurations use 8 |
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

## Schedule patterns

| Pattern | Researcher inputs |
| --- | --- |
| One time | Date and time |
| Daily | Time each day |
| Selected weekdays | One or more weekdays and a time |
| Random window | 1–10 windows, start hour, and 1–24 hour window length; total span ≤ 24 hours |

Clock-time schedules use hour/minute. Wake- and bed-relative schedules use an offset between −1,440 and +1,440 minutes and require collected sleep-schedule times.

## Participant identifier rules

The configured minimum may be zero, the maximum must be at least one, and the minimum cannot exceed the maximum. An optional allowed pattern must compile as a regular expression. Pattern matching may accept a matching substring; to require the entire participant identifier to match, anchor the expression with `^` and `$`. The app applies the rule before enrollment and before later identifier edits. The wizard's default is 1–64 characters, but those values are defaults rather than schema-wide limits.

## Version compatibility

Older configurations can omit fields introduced later. The app supplies compatibility defaults for fields such as schedule anchors, HealthKit backfill, and start-date mode, while the dashboard migrates stored configurations to its current authoring version when editing. These mechanisms provide format compatibility only. Researchers must still verify the active configuration, app behavior, Study Backend metadata, and database support together.

## Activation checks

Dashboard activation requires a confirmed researcher email, an enabled Study Backend descriptor, an Active configuration, and successful validation. It then connects to the Study Backend the way the app does at enrollment and confirms its backend ID, stable study ID, enrollment code, schema version, and active flag match the study.
