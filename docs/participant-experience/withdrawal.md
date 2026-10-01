# Withdrawal

The iOS app includes a participant withdrawal flow with two data choices.

## Keep existing data

The app records the withdrawal request locally and attempts to send it to the Study Backend. When the backend acknowledges a keep-data request, it records the withdrawal and marks the enrollment withdrawn. Existing participant data remains, while new collection stops. If the participant later rejoins the study, the Study Backend reactivates that same enrollment, so their retained history stays attached. Study Backends set up with older setup files need a one-time update for this; see error [E16](../troubleshooting.md#enrollment-error-codes).

## Delete existing data

When the Study Backend acknowledges a delete-data request, it deletes the participant's enrollment and participant row plus related survey events, HealthKit samples, participant characteristics, and media metadata. The withdrawal record remains as an anonymized audit record with identifying foreign keys cleared. Inoxity does not delete Apple Health data stored on the participant's device.

## Offline and delayed requests

The app saves the withdrawal request locally before attempting backend synchronization. If the device is offline or the backend does not acknowledge the request promptly, the request can remain queued and retry later. Until acknowledgment, the selected Study Backend keep/delete operation may not yet have occurred.

## Media-file deletion is best effort

The backend returns the Storage paths associated with deleted `media_uploads` rows. After the database withdrawal succeeds, the current iOS client asks Supabase Storage to remove those paths. That second step is deliberately best effort: a network or Storage failure is ignored and does not reverse the completed database withdrawal.

!!! warning
    A successful database withdrawal is not proof that every Storage object was removed. Research teams whose protocol promises deletion of uploaded media files need a reviewed verification and cleanup procedure for possible Storage failures.

## Researcher responsibilities

Withdrawal language, retention obligations, backups, external survey data, previously exported datasets, and institutional audit requirements extend beyond the app's database function. Align the participant-facing choice with the approved protocol and document any systems that require separate action.
