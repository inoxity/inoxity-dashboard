# Troubleshooting

## Enrollment error codes

When a participant can't join a study, the app shows a short message with a code like **E10**, and a **Copy error details** button. Ask the participant for the code, or better, for the copied details. Those also include the step that failed, the time, the app version and environment, the study code, and the server's own error text. They never include keys or participant data.

When you run the app from Xcode, the same details are printed to the Xcode console.

| Code | What happened | Where to look |
|---|---|---|
| **E01** | The phone is offline. | The participant's Wi-Fi or cellular connection. Nothing to fix on your side. |
| **E02** | The Inoxity server (Control Backend) couldn't be reached. | The Control Backend Supabase project: is it paused or down? If it keeps happening for everyone, check its API logs. |
| **E03** | The study code wasn't found. | The code the participant typed, and that the study exists in the dashboard. |
| **E04** | The study isn't accepting participants: it's paused, inactive, or has ended. | The study's status in the dashboard. If you set a status message, the participant sees it instead of the default. |
| **E05** | Enrollment hasn't opened yet, or the study hasn't started. | The study's enrollment window and start date in the dashboard. |
| **E06** | Enrollment has closed. | The study's enrollment window in the dashboard. |
| **E07** | The Inoxity server refused the request (permissions). | Control Backend permissions for `resolve_study_bootstrap`, and that anonymous sign-ins are enabled on the Control Backend. |
| **E10** | The study's own database isn't responding. | The **study's** Supabase project. The most common cause is that **the project is paused**: open it in Supabase and click **Restore project**. Also check the project URL in the dashboard's Data Backend step. |
| **E11** | Anonymous sign-in is turned off in the study's database. | Study Supabase project → **Authentication → Sign In / Providers → Allow anonymous sign-ins**. |
| **E12** | The study's database setup is incomplete: a required table or function is missing, or the identity row was never inserted. | Rerun the missing parts of the study's setup SQL (the Data Backend step's two downloads, or migrations 001–012) and the identity insert from the Study Backend README. The copied details name what's missing. |
| **E13** | The study's database doesn't match the dashboard. | Compare the dashboard's Data Backend step with the `study_backend_metadata` row: backend UUID, stable study ID, expected study code, and supported configuration schema version must all agree. The schema version doesn't update itself after a dashboard schema change. |
| **E14** | The app's environment doesn't match the study's Data Backend environment. | TestFlight and App Store builds are always **Production**. If you're running from Xcode, pick the scheme that matches the study (e.g. **Inoxity-Production**). |
| **E15** | The study's database is marked inactive. | `is_active` on the `study_backend_metadata` row. |
| **E16** | The participant withdrew earlier and the study's database can't reactivate them. | Apply migration `010_reenrollment_after_withdrawal.sql` to the study's database. |
| **E20** | The study needs a newer version of the app. | The participant should update Inoxity. If they're already on the latest version, the study's configuration schema is newer than the app supports. |
| **E21** | The study's settings failed the app's checks. | Review the study in the dashboard wizard for invalid or incomplete settings, then save it again. |
| **E22** | The study has no working Data Backend. | The dashboard's Data Backend step: it must be filled in and enabled. |
| **E23** | The Data Backend's URL or key is malformed. | The project URL (must be `https://…supabase.co`) and anon key in the dashboard's Data Backend step. |
| **E24** | The app build is missing the Inoxity server settings. | Only affects builds made from source: check `Config/Secrets.local.xcconfig`. |
| **E99** | Something else went wrong. | Read the copied details: they contain the server's own error text. |

## A study code does not resolve

Check that the code is correct, the configuration status is Active, the study has been activated in the dashboard, and an enabled Data Backend is linked. Confirm the app is using the Production environment for a real study.

## The app reports an inactive or mismatched backend

Compare the dashboard Data Backend descriptor with the singleton `study_backend_metadata` row. The backend UUID, stable study ID, expected code, environment, active flag, and supported configuration schema version must agree.

The metadata schema version does not update itself after a dashboard schema bump.

## A new HealthKit type does not upload

Confirm that the participant granted access, the type exists on the device, and the current configuration enables it. If the type was added after backend provisioning, generate the current SQL and apply only the missing table/function changes after review. Do not blindly rerun the whole script.

## Notifications do not appear

Check the study and item active dates, survey/reminder schedule, study time zone, participant sleep schedule for anchored timing, survey availability, and iOS notification authorization/settings. Test on a physical device. Local notifications are affected by device settings and are not guaranteed evidence of participant engagement.

## A survey opens but does not complete

Confirm the survey's completion callback is enabled only when the external survey returns the expected Inoxity callback. The app requires the corresponding opened event before uploading completion. See [Tracking survey completion](studies/survey-completion-tracking.md) for the Qualtrics setup and a browser test.

## Media upload fails

Check accepted file type, per-category type, file-size and video-duration limits, total/category item limits, active dates, backend media migrations, Storage bucket, and participant-scoped Storage policies.

## Withdrawal did not remove a media file

The database returns deleted media paths and the iOS client attempts to remove those objects from Supabase Storage. The Storage call is best effort and failures are ignored after the authoritative database withdrawal succeeds. Use the team's reviewed verification and cleanup procedure to check for orphaned objects.

## Where to find backend errors

Use the research team's Study Backend Supabase logs for Auth, Postgres, API, and Storage failures. Logs may appear after a short delay. Never paste live keys, participant data, or sensitive log contents into public issue reports.
