# Surveys and reminders

Inoxity can make web-based surveys available in the participant app and schedule local notifications for surveys or general study messages.

## Surveys

For each survey, researchers configure:

- a unique ID, name, description, and participant-accessible `https` URL;
- whether it is enabled;
- external-browser or in-app presentation;
- a one-time, daily, selected-weekday, or random-window schedule;
- how long before and after its scheduled occurrence it is available;
- optional participant instructions and privacy text;
- optional active start/end dates;
- whether to track completion (the survey redirects back to the app when it ends).

The app records opened and completed **events**, not survey answers. Survey responses remain with the external survey provider unless that provider is separately integrated with the research team's systems.

### Completion callbacks

Inoxity is platform-neutral: any survey provider can support basic launching when it supplies a participant-accessible HTTPS URL. Qualtrics is known to work well, but Inoxity does not guarantee a platform-specific integration.

When enabled, completion tracking depends on the external survey platform being able to redirect to the Inoxity callback URL. The survey system must be configured to return to that callback correctly. An opened event must exist before the matching completion can be uploaded.

See [Tracking survey completion](survey-completion-tracking.md) for step-by-step Qualtrics setup and a browser test you can run without the app.

## Reminder types

- A **survey reminder** points to an enabled survey and can notify at or before that survey's occurrence.
- A **message reminder** is an independent notification with a configured destination such as Home, Surveys, Settings, or About.

Reminder timing can be one-time, daily, selected weekdays, or random windows. Researchers can also limit a reminder to a phase using active start and end dates.

## Random-window scheduling

For EMA-style timing, the researcher chooses the number of daily windows, the starting hour, and each window's length. The windows must fit within one day. The app selects a deterministic pseudo-random time for each participant/day/window so reconciliation does not continually change an already calculated schedule.

## Wake- and bed-relative timing

Clock-time schedules use a fixed hour and minute. Wake- or bed-relative schedules use the participant's saved sleep schedule plus a positive or negative minute offset. These anchors are only valid when sleep-schedule collection is enabled.

## Participant and platform constraints

- Notifications require participant permission and may be affected by iOS notification settings or Focus modes.
- The app reconciles pending notifications when active/foregrounded; notifications are local, not a guarantee of participant response.
- A survey's availability window determines whether an occurrence can be opened even if a notification was delivered.
- Researchers should test survey callbacks and timing on a physical iPhone before launch.
