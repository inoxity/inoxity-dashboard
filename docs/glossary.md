# Glossary

**Activation**
The dashboard action that makes a valid Active study available for participant resolution. It is separate from merely choosing Active in the configuration.

**Anon/publishable key**
A Supabase public client key. It is protected by row-level security and function permissions and is not equivalent to a service-role key.

**Configuration revision**
An immutable saved version of a study's configuration.

**Configuration schema version**
The format version shared between dashboard-authored configuration, the iOS decoder/validator, and Study Backend metadata. The dashboard currently authors version {{ schema_version }}.

**Control Backend**
The Inoxity-operated Supabase project for researcher accounts, study configuration, collaboration, and study-code routing. It stores no participant enrollments, participant identifiers, or collected study data. Its authentication service may create an anonymous technical account for study-code resolution; this is not a study enrollment.

**EMA**
Ecological momentary assessment: repeated questions delivered in or near participants' everyday contexts. Inoxity supports fixed and random-window survey scheduling.

**HealthKit**
Apple's framework and on-device store for health and fitness data. Inoxity requests read access only for configured types.

**Participant identifier**
A study-defined value such as a coded research ID. It is distinct from the anonymous backend authentication user ID.

**Random window**
A schedule divided into daily windows with one deterministic pseudo-random occurrence per window and participant/day.

**See My Data**
An optional participant-facing view of local Apple Health summaries. Those summary cards are not uploaded as summary records.

**Study Backend**
A research-team-owned Supabase project dedicated to exactly one study and holding that study's participant data.

**Study code**
The code participants enter in the iOS app to resolve and join a study.

**Supabase RPC**
A restricted Postgres function exposed through Supabase. Inoxity uses participant-scoped RPCs for backend operations instead of broad direct table writes.
