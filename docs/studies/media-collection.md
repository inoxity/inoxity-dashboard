# Media collection

Inoxity can accept participant photos and videos when both the app feature and media configuration are enabled.

## Researcher configuration

Researchers define:

- participant instructions and privacy text;
- accepted media types: photo, video, or both;
- maximum total items and maximum file size;
- an optional maximum video duration;
- optional active dates;
- one or more categories, each with a display name, description, allowed subset of media types, item limit, and optional represented-date requirement.

Categories let a study separate requests such as “sleep environment” and “meal photo.”

## Participant experience

The participant chooses an allowed photo or video, assigns a category, and—when required—enters the date the media represents. The app validates type, size, duration, category limits, and the study's active dates before upload.

Accepted files upload directly to the Study Backend's `user-uploads` Supabase Storage bucket. Metadata is then recorded in `media_uploads`. Storage paths are scoped to the authenticated participant by policy.

## Limitations and governance

- Media can contain faces, locations, documents, or other identifying information. Instructions and consent language should address those risks.
- Media must be enabled consistently in feature flags, visible tabs, configuration, and backend setup.
- The generated setup SQL includes media tables, RPCs, bucket, and Storage policies only when media is enabled.
- Withdrawal with deletion returns the affected Storage paths to the app, which then attempts to remove the underlying files. That Storage operation is best effort; its failure does not fail or roll back the completed database withdrawal.
