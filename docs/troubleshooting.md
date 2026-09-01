# Troubleshooting

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

Confirm the survey's completion callback is enabled only when the external survey returns the expected Inoxity callback. The app requires the corresponding opened event before uploading completion.

## Media upload fails

Check accepted file type, per-category type, file-size and video-duration limits, total/category item limits, active dates, backend media migrations, Storage bucket, and participant-scoped Storage policies.

## Withdrawal did not remove a media file

The database returns deleted media paths and the iOS client attempts to remove those objects from Supabase Storage. The Storage call is best effort and failures are ignored after the authoritative database withdrawal succeeds. Use the team's reviewed verification and cleanup procedure to check for orphaned objects.

## Where to find backend errors

Use the research team's Study Backend Supabase logs for Auth, Postgres, API, and Storage failures. Logs may appear after a short delay. Never paste live keys, participant data, or sensitive log contents into public issue reports.
