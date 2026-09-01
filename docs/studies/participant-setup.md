# Participant setup and identifiers

Participant setup determines how someone is recognized within a study and which study-specific information appears during onboarding.

## Participant identifiers

Researchers configure:

- the field label, prompt, placeholder, and help text;
- whether an identifier is required;
- minimum and maximum lengths;
- an optional regular-expression pattern for allowed values.

The participant enters the identifier during onboarding. The app validates it locally using the study's rules before enrollment. A participant can later correct the identifier from Settings; the Study Backend RPC restricts that update to the participant's own active enrollment.

Participant identifiers are study data. Choose a format consistent with the approved protocol and avoid unnecessary directly identifying information.

## Onboarding pages

Researchers can define study-specific onboarding pages with titles and body text. The app builds its onboarding sequence from the configuration rather than using one universal fixed sequence.

Configured system steps may also include:

- participant identifier entry;
- participant-selected start date;
- sleep schedule entry when enabled;
- Apple Health authorization when enabled;
- notification permission when enabled.

The exact iOS permission dialog is controlled by Apple. Inoxity can provide rationale before requesting permission, but it cannot grant permission or force a participant to accept.

## Sleep schedule

When enabled, the app collects participant wake and bed times. These can anchor surveys or reminders relative to the participant's routine. The device remains the source of truth for on-device scheduling; syncing the times to the Study Backend is best effort.

## Start date

Make the study's start-date mode clear in recruitment and onboarding materials. Enrollment, fixed-date, and participant-selected modes produce different interpretations of study day and completion timing.
