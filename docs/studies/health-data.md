# Apple Health data

Researchers can select supported Apple Health data types for read-only collection. The app never writes to Apple Health.

## Researcher choices

The dashboard exposes supported identifiers grouped by research-friendly categories such as sleep, activity and fitness, heart and vitals, body measurements, hearing, environment, nutrition, mindfulness, reproductive health, and symptoms.

Researchers configure:

- whether HealthKit collection is enabled;
- participant-facing rationale text;
- the exact identifiers requested;
- whether one-time participant characteristics are requested;
- the initial backfill period, entered as a positive number of days. Researchers should configure an explicit value rather than leave it blank, because a blank value currently permits a much larger historical query.

Request only data required by the approved protocol. Some categories can reveal highly sensitive health or reproductive information.

## Participant experience

During onboarding, the participant sees the study rationale and Apple's permission interface. Apple Health permission is granular and participant controlled. Inoxity cannot determine from a declined read request whether data is absent or permission was denied in every case.

## Collection and upload

The app uses an anchored query per configured type. Initial collection reaches back the configured number of days, including before enrollment and before the study start date when applicable. Later foreground syncs query changes after the saved anchor. Study start and end dates are intended for study timing, access, and UI behavior; they do not shorten the configured historical backfill. The current implementation should not be treated as a guarantee that collection stops exactly at the configured end date. Uploads go directly to the verified Study Backend in bounded batches and are designed to retry idempotently.

Each configured type has a dedicated table generated for that study. Samples include normalized values appropriate to their type plus timestamps and captured time-zone information.

## Important limitations

- Collection is currently foreground-driven; documentation in the app repository does not claim continuous background synchronization.
- Apple Health deletions or later corrections are not mirrored to the Study Backend, so it is not a perfect replica of Apple Health.
- Clinical Records, Health Documents, ECG, and audiograms are excluded from the supported catalog.
- The local **See My Data** summaries are a separate feature and are not themselves uploaded.
- Blood pressure is collectable as a correlation but is not currently surfaced in See My Data.

See [Supported HealthKit data](../reference/supported-healthkit-data.md) for the complete current list.
