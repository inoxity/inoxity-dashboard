# Study configuration

The study configuration is the contract between the researcher dashboard and participant app. Researchers edit it through the wizard; the dashboard stores it as versioned JSON, and the iOS app decodes and validates it before use.

## What researchers configure

| Area | Purpose |
| --- | --- |
| Identity and status | Stable ID, participant study code, names, welcome copy, and Active/Paused/Inactive state |
| Schedule | Study dates, time zone, duration, and how participant day 1 is determined |
| Participant setup | Identifier prompt and validation, onboarding pages, optional sleep schedule |
| Permissions | Apple Health and notification switches and participant-facing rationale |
| Surveys | Link, presentation mode, schedule, availability, completion callback, and active dates |
| Reminders | Message or survey reminder, timing, destination, and active dates |
| App features | Visible tabs and master feature switches |
| Media | Accepted file types, limits, categories, dates, and participant instructions/privacy text |
| Support and completion | Contact details, FAQs, end-of-study message, redirect, and post-completion access |
| Data Backend | Dedicated Supabase backend UUID, URL, public key, and environment |

## Study timing

A study can be open-ended or use a participant duration. For fixed-duration studies, the app calculates progress and can show the configured completion screen after the duration elapses.

Schema version 8 supports three start-date modes:

- **Enrollment:** each participant's day 1 begins when they enroll.
- **Fixed:** every participant uses the configured calendar start date.
- **Participant selected:** onboarding asks each participant to confirm or choose their own start date.

Schedules use the configured IANA time zone. Survey and reminder times can use a clock time or, when sleep-schedule collection is enabled, an offset from the participant's wake time or bedtime.

## Validation matters

The dashboard and iOS app both validate configuration. Common constraints include:

- stable IDs and survey/media category IDs use lowercase letters, numbers, and hyphens;
- IDs must be unique within their list;
- study codes and required text cannot be blank;
- dates use `YYYY-MM-DD`, and date ranges must be ordered;
- referenced surveys must exist and be enabled;
- media categories can only accept types allowed by the overall media configuration;
- wake/bed-relative schedules require sleep-schedule collection;
- random windows must fit within a 24-hour day;
- activation requires a confirmed researcher email, an Active configuration, an enabled Study Backend descriptor, and successful dashboard schema validation. Activation does not test backend connectivity or provisioning.

## Editing an active study

Changing participant-facing copy or schedules changes the configuration revision the app receives. Changing collected data types or backend-dependent features may also require database changes.

!!! warning
    The generated SQL contains table-creation statements that are not designed to be rerun wholesale against an existing backend. When adding a feature such as a new HealthKit type, review and apply only the new or changed pieces with appropriate database oversight.
