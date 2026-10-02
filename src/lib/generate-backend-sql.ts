import { HEALTHKIT_IDENTIFIERS, normalizeStudyCode, type StudyConfiguration } from "./study-schema";

/**
 * Generates a ready-to-paste Study Backend setup for one study, so
 * researchers no longer have to hand-copy the manual walkthrough in
 * inoxity_v2/supabase/study_backend_template/README.md.
 *
 * It's delivered as TWO scripts, run in order: `structure` (tables, functions,
 * the Storage bucket, the identity seed row) and then `security` (row level
 * security, policies, and who may call each function — every `enable row
 * level security` / `create policy` / `revoke` / `grant`). Each migration below
 * is kept as a structure constant plus a matching `*_SECURITY` constant whose
 * statements were moved out of it verbatim, so applying structure + security
 * builds exactly the same database the old single script did. Keep it that
 * way: any new access rule goes in a `*_SECURITY` constant, never inline.
 *
 * The boilerplate migrations below (001-004) are copied verbatim from that
 * same file in the separate inoxity_v2 repo — there's no shared import
 * across repos, so if those files change, update the matching constant here
 * too. The HealthKit section (005-006) and, if the study uses media, the
 * media upload section (007-008) are generated dynamically — HealthKit
 * narrowed to this study's configured `healthKit.identifiers` (one table
 * per type, not the full ten-type list); media included only when enabled.
 */

export interface SplitSQL {
  structure: string;
  security: string;
}

// Escapes a value for safe use inside a single-quoted SQL string literal.
// identity.id/code are otherwise unrestricted strings in the Zod schema
// (only case/uppercase, not character set), so this is cheap insurance —
// not a real trust boundary, since this script is only ever generated for
// (and pasted by) the study's own owner.
function sqlLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

const MIGRATION_001_SCHEMA = `-- ================================================================
-- STUDY DATA BACKEND ONLY — apply to one independent Study Backend.
-- Never apply this file to inoxity_backend or a different Study Backend.
-- ================================================================
create extension if not exists pgcrypto;
create table public.study_backend_metadata (
  singleton boolean primary key default true check (singleton),
  backend_instance_id uuid not null unique,
  stable_study_id text not null,
  expected_study_code text not null check (expected_study_code = upper(trim(expected_study_code))),
  supported_configuration_schema_version integer not null check (supported_configuration_schema_version > 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.participants (
  id uuid primary key default gen_random_uuid(), auth_user_id uuid not null unique,
  -- HH:mm local time-of-day strings, mirroring the pre-dashboard app's participants
  -- table — set via the update_sleep_schedule RPC (002) whenever the participant
  -- sets/edits their wake/bed time in the app, so researchers have server-side
  -- visibility into it without needing device access.
  wake_time text check (wake_time is null or wake_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  bed_time text check (bed_time is null or bed_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  created_at timestamptz not null default now()
);
create table public.study_enrollments (
  id uuid primary key default gen_random_uuid(), participant_id uuid not null references public.participants(id),
  participant_identifier text not null, enrollment_attempt_id uuid not null unique, installation_id uuid not null,
  status text not null default 'active' check (status in ('active','withdrawn')),
  configuration_schema_version integer not null, configuration_revision integer not null,
  enrolled_at timestamptz not null default now(), unique(participant_id)
);
create table public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(), client_event_id uuid not null unique,
  participant_id uuid not null references public.participants(id),
  enrollment_id uuid references public.study_enrollments(id),
  withdrawal_choice text not null check (withdrawal_choice in ('keepExistingData','deleteExistingData')),
  requested_at timestamptz not null, created_at timestamptz not null default now(), processed_at timestamptz
);`;

const MIGRATION_002_RPCS = `-- ================================================================
-- STUDY DATA BACKEND ONLY — apply to exactly one Study Backend.
-- All RPCs bind writes to auth.uid() and the immutable backend identity.
-- ================================================================
create or replace function public.get_study_backend_identity()
returns table (backend_instance_id uuid, stable_study_id text, expected_study_code text,
 supported_configuration_schema_version integer, is_active boolean)
language plpgsql security definer set search_path = pg_catalog, public as $$ begin
 if auth.uid() is null then raise exception 'unauthorized' using errcode='42501'; end if;
 return query select m.backend_instance_id,m.stable_study_id,m.expected_study_code,m.supported_configuration_schema_version,m.is_active from public.study_backend_metadata m where m.singleton;
end $$;

create or replace function public.ensure_participant()
returns table (participant_id uuid, created_at timestamptz)
language plpgsql security definer set search_path = pg_catalog, public as $$ declare p public.participants%rowtype; begin
 if auth.uid() is null then raise exception 'unauthorized' using errcode='42501'; end if;
 if not exists(select 1 from public.study_backend_metadata m where m.singleton and m.is_active)
    then raise exception 'study_backend_inactive' using errcode='55000'; end if;
 insert into public.participants(auth_user_id) values(auth.uid()) on conflict(auth_user_id) do nothing;
 select * into p from public.participants where auth_user_id=auth.uid();
 return query select p.id,p.created_at;
end $$;

create or replace function public.register_study_enrollment(expected_backend_id text, expected_stable_study_id text,
 expected_study_code text, participant_identifier text, p_enrollment_attempt_id text, installation_id text,
 configuration_schema_version integer, configuration_revision integer)
-- Output columns are named enrolled_* (not configuration_schema_version/
-- configuration_revision) because plpgsql shares one namespace between IN
-- parameters and \`returns table\` columns — reusing the IN parameter names
-- here throws 42P13 "parameter name used more than once". return query
-- matches by position, not name, so this doesn't change the insert/select
-- logic below, only the two \`EnrollmentRow.CodingKeys\` raw values in
-- SupabaseRepositories.swift that decode this RPC's response.
-- Parameter is p_enrollment_attempt_id (not enrollment_attempt_id) because it
-- also appears in \`on conflict(enrollment_attempt_id)\` below, a position that
-- can't be qualified — any bare occurrence there makes plpgsql treat the
-- whole statement as ambiguous (42702) against the same-named table column.
returns table (enrollment_id uuid, participant_id uuid, status text, enrolled_at timestamptz,
 enrolled_schema_version integer, enrolled_revision integer)
language plpgsql security definer set search_path = pg_catalog, public as $$ declare m public.study_backend_metadata%rowtype; p public.participants%rowtype; e public.study_enrollments%rowtype; begin
 if auth.uid() is null then raise exception 'unauthorized' using errcode='42501'; end if;
 select * into m from public.study_backend_metadata where singleton;
 if not found or not m.is_active then raise exception 'study_backend_inactive' using errcode='55000'; end if;
 if m.backend_instance_id <> expected_backend_id::uuid or m.stable_study_id <> expected_stable_study_id
    or m.expected_study_code <> upper(trim(expected_study_code)) or m.supported_configuration_schema_version <> configuration_schema_version then raise exception 'backend_identity_mismatch'; end if;
 select * into p from public.participants where auth_user_id=auth.uid(); if not found then raise exception 'participant_missing'; end if;
 -- study_enrollments has a separate unique(participant_id) constraint besides
 -- enrollment_attempt_id's, so a participant retrying with a fresh attempt id
 -- (e.g. local app state was reset but the same anonymous session persisted)
 -- would otherwise hit a raw unique-violation instead of succeeding. Make
 -- registration idempotent per participant: return the existing row if it's
 -- active.
 select * into e from public.study_enrollments where study_enrollments.participant_id = p.id;
 if found and e.status = 'active' then
   return query select e.id, e.participant_id, e.status, e.enrolled_at, e.configuration_schema_version, e.configuration_revision;
   return;
 end if;
 -- Withdrawn (a keepExistingData withdrawal): this is a re-enrollment. Returning
 -- the withdrawn row as-is made the app reject it (BackendError.withdrawnEnrollment),
 -- blocking re-enrollment for good. Reactivate the same row in place instead —
 -- participant_id is unique, and keeping the row keeps this enrollment's survey/
 -- HealthKit history attached, as keepExistingData promised. Mirrors the app
 -- repo's study_backend_template migration 010_reenrollment_after_withdrawal.
 if found then
   update public.study_enrollments set status='active', participant_identifier=register_study_enrollment.participant_identifier,
     enrollment_attempt_id=p_enrollment_attempt_id::uuid, installation_id=register_study_enrollment.installation_id::uuid,
     configuration_schema_version=register_study_enrollment.configuration_schema_version,
     configuration_revision=register_study_enrollment.configuration_revision, enrolled_at=now()
     where id = e.id returning * into e;
   return query select e.id, e.participant_id, e.status, e.enrolled_at, e.configuration_schema_version, e.configuration_revision;
   return;
 end if;
 insert into public.study_enrollments(participant_id,participant_identifier,enrollment_attempt_id,installation_id,configuration_schema_version,configuration_revision)
 values(p.id,register_study_enrollment.participant_identifier,p_enrollment_attempt_id::uuid,register_study_enrollment.installation_id::uuid,register_study_enrollment.configuration_schema_version,register_study_enrollment.configuration_revision)
 on conflict(enrollment_attempt_id) do nothing;
 select * into e from public.study_enrollments where study_enrollments.enrollment_attempt_id=p_enrollment_attempt_id::uuid;
 if e.participant_id <> p.id or e.participant_identifier <> register_study_enrollment.participant_identifier
    or e.installation_id <> register_study_enrollment.installation_id::uuid
    or e.configuration_schema_version <> register_study_enrollment.configuration_schema_version
    or e.configuration_revision <> register_study_enrollment.configuration_revision
    then raise exception 'conflicting_idempotency_key' using errcode='23505'; end if;
 return query select e.id,e.participant_id,e.status,e.enrolled_at,e.configuration_schema_version,e.configuration_revision;
end $$;

-- Mirrors the pre-dashboard app's participants.bed_time/wake_time columns —
-- called from the app whenever the participant sets/edits their sleep
-- schedule. IN params are p_-prefixed (not wake_time/bed_time) for the same
-- reason register_study_enrollment above renames its OUT columns: plpgsql
-- would otherwise treat a bare wake_time/bed_time reference as ambiguous
-- against the participants column of the same name.
create or replace function public.update_sleep_schedule(expected_backend_id text, expected_stable_study_id text,
 p_wake_time text, p_bed_time text)
returns table(participant_id uuid, wake_time text, bed_time text)
language plpgsql security definer set search_path = pg_catalog, public as $$ declare m public.study_backend_metadata%rowtype; p public.participants%rowtype; begin
 if auth.uid() is null then raise exception 'unauthorized' using errcode='42501'; end if;
 select * into m from public.study_backend_metadata where singleton;
 if not found or not m.is_active then raise exception 'study_backend_inactive' using errcode='55000'; end if;
 if m.backend_instance_id <> expected_backend_id::uuid or m.stable_study_id <> expected_stable_study_id then raise exception 'backend_identity_mismatch'; end if;
 if p_wake_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or p_bed_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'invalid_time_format' using errcode='22023'; end if;
 update public.participants set wake_time = p_wake_time, bed_time = p_bed_time
   where auth_user_id = auth.uid()
   returning * into p;
 if not found then raise exception 'participant_missing'; end if;
 return query select p.id, p.wake_time, p.bed_time;
end $$;

-- Post-enrollment correction to study_enrollments.participant_identifier (e.g. a
-- SONA ID typo fixed from within the app after enrollment) — mirrors the
-- pre-dashboard app's working call, which this generator had been missing.
-- p_-prefixed for the same reason update_sleep_schedule's p_wake_time/p_bed_time
-- are above: a bare participant_identifier reference would be ambiguous against
-- the study_enrollments column of the same name.
create or replace function public.update_participant_identifier(expected_backend_id text, expected_stable_study_id text,
 p_participant_identifier text)
returns table(enrollment_id uuid, participant_identifier text)
language plpgsql security definer set search_path = pg_catalog, public as $$ declare m public.study_backend_metadata%rowtype; p public.participants%rowtype; e public.study_enrollments%rowtype; begin
 if auth.uid() is null then raise exception 'unauthorized' using errcode='42501'; end if;
 select * into m from public.study_backend_metadata where singleton;
 if not found or not m.is_active then raise exception 'study_backend_inactive' using errcode='55000'; end if;
 if m.backend_instance_id <> expected_backend_id::uuid or m.stable_study_id <> expected_stable_study_id then raise exception 'backend_identity_mismatch'; end if;
 select * into p from public.participants where auth_user_id=auth.uid(); if not found then raise exception 'participant_missing'; end if;
 update public.study_enrollments set participant_identifier = p_participant_identifier
   where study_enrollments.participant_id = p.id
   returning * into e;
 if not found then raise exception 'enrollment_missing'; end if;
 return query select e.id, e.participant_identifier;
end $$;

create or replace function public.submit_withdrawal_request(client_event_id text, expected_backend_id text,
 expected_stable_study_id text, withdrawal_choice text, requested_at text, enrollment_id text default null)
returns table(request_id uuid)
language plpgsql security definer set search_path = pg_catalog, public as $$ declare m public.study_backend_metadata%rowtype; p public.participants%rowtype; r public.withdrawal_requests%rowtype; begin
 if auth.uid() is null then raise exception 'unauthorized' using errcode='42501'; end if;
 select * into m from public.study_backend_metadata where singleton;
 if not found or not m.is_active then raise exception 'study_backend_inactive' using errcode='55000'; end if;
 if m.backend_instance_id <> expected_backend_id::uuid or m.stable_study_id <> expected_stable_study_id then raise exception 'backend_identity_mismatch'; end if;
 select * into p from public.participants where auth_user_id=auth.uid(); if not found then raise exception 'participant_missing'; end if;
 if enrollment_id is null then raise exception 'enrollment_missing' using errcode='22023'; end if;
 if not exists(select 1 from public.study_enrollments e where e.id=enrollment_id::uuid and e.participant_id=p.id)
    then raise exception 'enrollment_ownership_denied' using errcode='42501'; end if;
 insert into public.withdrawal_requests(client_event_id,participant_id,enrollment_id,withdrawal_choice,requested_at)
 values(client_event_id::uuid,p.id,enrollment_id::uuid,withdrawal_choice,requested_at::timestamptz) on conflict(client_event_id) do nothing;
 select * into r from public.withdrawal_requests where withdrawal_requests.client_event_id=submit_withdrawal_request.client_event_id::uuid;
 if r.participant_id <> p.id or r.enrollment_id <> enrollment_id::uuid
    or r.withdrawal_choice <> submit_withdrawal_request.withdrawal_choice
    or r.requested_at <> submit_withdrawal_request.requested_at::timestamptz
    then raise exception 'conflicting_idempotency_key' using errcode='23505'; end if;
 return query select r.id;
end $$;`;

const MIGRATION_002_SECURITY = `alter table public.study_backend_metadata enable row level security;
alter table public.participants enable row level security;
alter table public.study_enrollments enable row level security;
alter table public.withdrawal_requests enable row level security;
revoke all on all tables in schema public from anon, authenticated;
create policy participant_owns_self on public.participants for select to authenticated using (auth_user_id = auth.uid());
create policy participant_owns_enrollment on public.study_enrollments for select to authenticated
 using (participant_id in (select p.id from public.participants p where p.auth_user_id = auth.uid()));
create policy participant_owns_withdrawal on public.withdrawal_requests for select to authenticated
 using (participant_id in (select p.id from public.participants p where p.auth_user_id = auth.uid()));

revoke all on function public.get_study_backend_identity(), public.ensure_participant() from public, anon;
revoke all on function public.register_study_enrollment(text,text,text,text,text,text,integer,integer) from public, anon;
revoke all on function public.update_sleep_schedule(text,text,text,text) from public, anon;
revoke all on function public.update_participant_identifier(text,text,text) from public, anon;
revoke all on function public.submit_withdrawal_request(text,text,text,text,text,text) from public, anon;
grant execute on function public.get_study_backend_identity(), public.ensure_participant() to authenticated;
grant execute on function public.register_study_enrollment(text,text,text,text,text,text,integer,integer) to authenticated;
grant execute on function public.update_sleep_schedule(text,text,text,text) to authenticated;
grant execute on function public.update_participant_identifier(text,text,text) to authenticated;
grant execute on function public.submit_withdrawal_request(text,text,text,text,text,text) to authenticated;`;

const MIGRATION_003_SURVEY_EVENTS = `-- STUDY DATA BACKEND ONLY. Never apply to inoxity_backend (the Control Backend).
create table public.survey_events (
  id uuid primary key default gen_random_uuid(),
  client_event_id text not null unique,
  participant_id uuid not null references public.participants(id),
  enrollment_id uuid not null references public.study_enrollments(id),
  survey_id text not null,
  occurrence_id text not null,
  event_type text not null check (event_type in ('opened','completed')),
  event_timestamp timestamptz not null,
  scheduled_for timestamptz not null,
  opened_at timestamptz,
  completed_at timestamptz,
  -- IANA identifier (e.g. "America/Los_Angeles") for the zone this event was captured in — the
  -- timestamptz columns above are UTC-only and can't be converted back to local wall-clock time
  -- without it. Nullable: older app builds won't send it. Query local time later with
  -- event_timestamp AT TIME ZONE event_time_zone.
  event_time_zone text,
  configuration_schema_version integer not null check (configuration_schema_version > 0),
  configuration_revision integer not null check (configuration_revision > 0),
  event_source text not null check (event_source in ('presentation','completionCallback','restoration')),
  app_version text not null,
  received_at timestamptz not null default now(),
  unique(enrollment_id, occurrence_id, event_type),
  check (client_event_id = 'survey-event.' || occurrence_id || '.' || event_type),
  check (event_type <> 'opened' or opened_at = event_timestamp),
  check (event_type <> 'completed' or (completed_at = event_timestamp and opened_at is not null and opened_at <= completed_at))
);`;

const MIGRATION_003_SECURITY = `alter table public.survey_events enable row level security;
revoke all on public.survey_events from anon, authenticated;`;

const MIGRATION_004_SURVEY_EVENT_RPC = `-- STUDY DATA BACKEND ONLY. The RPC binds every event to auth.uid(), its enrollment,
-- and this backend's immutable identity. Direct table writes remain unavailable.
-- p_event_time_zone is p_-prefixed (unlike this function's other, pre-existing params) to match
-- the app's own param name and avoid any future bare-reference collision with
-- survey_events.event_time_zone, the same defensive pattern as update_sleep_schedule/
-- update_participant_identifier above.
create or replace function public.submit_survey_event(
 client_event_id text, expected_backend_id text, expected_stable_study_id text,
 enrollment_id text, survey_id text, occurrence_id text, event_type text,
 event_timestamp text, scheduled_for text, opened_at text default null,
 completed_at text default null, configuration_schema_version integer default 0,
 configuration_revision integer default 0, event_source text default 'restoration',
 app_version text default 'unknown', p_event_time_zone text default null)
returns table(acknowledgment_id uuid, received_at timestamptz, idempotent_existing boolean)
language plpgsql security definer set search_path = pg_catalog, public as $$
declare m public.study_backend_metadata%rowtype; p public.participants%rowtype;
 e public.study_enrollments%rowtype; existing public.survey_events%rowtype; inserted boolean := false;
begin
 if auth.uid() is null then raise exception 'unauthorized' using errcode='42501'; end if;
 select * into m from public.study_backend_metadata where singleton;
 if not found or not m.is_active then raise exception 'study_backend_inactive' using errcode='55000'; end if;
 if m.backend_instance_id <> expected_backend_id::uuid or m.stable_study_id <> expected_stable_study_id
    then raise exception 'backend_identity_mismatch'; end if;
 select * into p from public.participants where auth_user_id=auth.uid();
 if not found then raise exception 'participant_missing'; end if;
 select * into e from public.study_enrollments where id=enrollment_id::uuid and participant_id=p.id;
 if not found then raise exception 'ownership_denied'; end if;
 if exists(select 1 from public.withdrawal_requests w where w.enrollment_id=e.id and w.requested_at < event_timestamp::timestamptz)
    then raise exception 'event_after_withdrawal'; end if;
 if event_type='completed' and not exists(select 1 from public.survey_events s where s.enrollment_id=e.id and s.occurrence_id=submit_survey_event.occurrence_id and s.event_type='opened')
    then raise exception 'opened_event_required'; end if;
 insert into public.survey_events(client_event_id,participant_id,enrollment_id,survey_id,occurrence_id,event_type,
   event_timestamp,scheduled_for,opened_at,completed_at,event_time_zone,configuration_schema_version,configuration_revision,event_source,app_version)
 values(client_event_id,p.id,e.id,survey_id,occurrence_id,event_type,event_timestamp::timestamptz,scheduled_for::timestamptz,
   opened_at::timestamptz,completed_at::timestamptz,p_event_time_zone,configuration_schema_version,configuration_revision,event_source,app_version)
 on conflict(client_event_id) do nothing returning true into inserted;
 select * into existing from public.survey_events s where s.client_event_id=submit_survey_event.client_event_id;
 if not found or existing.participant_id<>p.id or existing.enrollment_id<>e.id or existing.survey_id<>submit_survey_event.survey_id
    or existing.occurrence_id<>submit_survey_event.occurrence_id or existing.event_type<>submit_survey_event.event_type
    or existing.event_timestamp<>submit_survey_event.event_timestamp::timestamptz then raise exception 'conflicting_idempotency_key'; end if;
 return query select existing.id,existing.received_at,not inserted;
end $$;`;

const MIGRATION_004_SECURITY = `revoke all on function public.submit_survey_event(text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text) from public;
grant execute on function public.submit_survey_event(text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text) to authenticated;`;

// One dedicated table per HealthKit type (mirrors the pre-dashboard app's
// `sleep_samples` table) instead of one generic table with a
// health_type_identifier discriminator column — easier for a researcher to
// query/export a single data type without filtering. Keep in sync with
// inoxity_v2/supabase/study_backend_template/migrations/005_healthkit_samples.sql
// and 006_healthkit_sample_rpc.sql, and with HealthKitTypeRegistry.swift's
// `tableName` per identifier.
//
// "sleepState" is sleepAnalysis specifically — its friendly six-value text column predates
// everything else here and stays byte-identical. "category" is the generic shape every other
// category type (heart-rhythm events, mindfulness, reproductive health, symptoms) uses instead:
// those each have their own, different HealthKit enum, so storing the raw integer rather than
// hand-maintaining ~30 more text mappings is the only shape that scales. "correlation" bundles
// two related quantities into one row (currently just blood pressure's systolic/diastolic).
export type HealthKitTableSpec =
  | { identifier: string; table: string; kind: "sleepState" }
  | { identifier: string; table: string; kind: "category" }
  | { identifier: string; table: string; kind: "quantity"; column: string }
  | { identifier: string; table: string; kind: "workout" }
  | { identifier: string; table: string; kind: "correlation"; column: string; secondaryColumn: string };

export const HEALTHKIT_TABLE_SPECS: Record<(typeof HEALTHKIT_IDENTIFIERS)[number], HealthKitTableSpec> = {
  // Original 10 — table/column names unchanged.
  sleepAnalysis: { identifier: "sleepAnalysis", table: "sleep_samples", kind: "sleepState" },
  stepCount: { identifier: "stepCount", table: "step_count_samples", kind: "quantity", column: "steps" },
  restingHeartRate: { identifier: "restingHeartRate", table: "resting_heart_rate_samples", kind: "quantity", column: "bpm" },
  heartRate: { identifier: "heartRate", table: "heart_rate_samples", kind: "quantity", column: "bpm" },
  heartRateVariabilitySDNN: { identifier: "heartRateVariabilitySDNN", table: "heart_rate_variability_samples", kind: "quantity", column: "sdnn_ms" },
  activeEnergyBurned: { identifier: "activeEnergyBurned", table: "active_energy_samples", kind: "quantity", column: "kcal" },
  appleExerciseTime: { identifier: "appleExerciseTime", table: "exercise_time_samples", kind: "quantity", column: "minutes" },
  respiratoryRate: { identifier: "respiratoryRate", table: "respiratory_rate_samples", kind: "quantity", column: "breaths_per_min" },
  timeInDaylight: { identifier: "timeInDaylight", table: "daylight_samples", kind: "quantity", column: "minutes" },
  workout: { identifier: "workout", table: "workout_samples", kind: "workout" },

  // Activity & fitness
  distanceWalkingRunning: { identifier: "distanceWalkingRunning", table: "distance_walking_running_samples", kind: "quantity", column: "miles" },
  distanceCycling: { identifier: "distanceCycling", table: "distance_cycling_samples", kind: "quantity", column: "miles" },
  distanceSwimming: { identifier: "distanceSwimming", table: "distance_swimming_samples", kind: "quantity", column: "miles" },
  distanceWheelchair: { identifier: "distanceWheelchair", table: "distance_wheelchair_samples", kind: "quantity", column: "miles" },
  flightsClimbed: { identifier: "flightsClimbed", table: "flights_climbed_samples", kind: "quantity", column: "count" },
  pushCount: { identifier: "pushCount", table: "push_count_samples", kind: "quantity", column: "count" },
  swimmingStrokeCount: { identifier: "swimmingStrokeCount", table: "swimming_stroke_count_samples", kind: "quantity", column: "count" },
  basalEnergyBurned: { identifier: "basalEnergyBurned", table: "basal_energy_samples", kind: "quantity", column: "kcal" },
  appleStandTime: { identifier: "appleStandTime", table: "stand_time_samples", kind: "quantity", column: "minutes" },
  walkingSpeed: { identifier: "walkingSpeed", table: "walking_speed_samples", kind: "quantity", column: "meters_per_second" },
  walkingStepLength: { identifier: "walkingStepLength", table: "walking_step_length_samples", kind: "quantity", column: "meters" },
  walkingAsymmetryPercentage: { identifier: "walkingAsymmetryPercentage", table: "walking_asymmetry_samples", kind: "quantity", column: "percent" },
  walkingDoubleSupportPercentage: { identifier: "walkingDoubleSupportPercentage", table: "walking_double_support_samples", kind: "quantity", column: "percent" },
  sixMinuteWalkTestDistance: { identifier: "sixMinuteWalkTestDistance", table: "six_minute_walk_samples", kind: "quantity", column: "meters" },
  stairAscentSpeed: { identifier: "stairAscentSpeed", table: "stair_ascent_speed_samples", kind: "quantity", column: "meters_per_second" },
  stairDescentSpeed: { identifier: "stairDescentSpeed", table: "stair_descent_speed_samples", kind: "quantity", column: "meters_per_second" },

  // Body measurements
  height: { identifier: "height", table: "height_samples", kind: "quantity", column: "meters" },
  bodyMass: { identifier: "bodyMass", table: "body_mass_samples", kind: "quantity", column: "kg" },
  bodyMassIndex: { identifier: "bodyMassIndex", table: "body_mass_index_samples", kind: "quantity", column: "value" },
  leanBodyMass: { identifier: "leanBodyMass", table: "lean_body_mass_samples", kind: "quantity", column: "kg" },
  bodyFatPercentage: { identifier: "bodyFatPercentage", table: "body_fat_percentage_samples", kind: "quantity", column: "percent" },
  waistCircumference: { identifier: "waistCircumference", table: "waist_circumference_samples", kind: "quantity", column: "meters" },
  bodyTemperature: { identifier: "bodyTemperature", table: "body_temperature_samples", kind: "quantity", column: "celsius" },
  basalBodyTemperature: { identifier: "basalBodyTemperature", table: "basal_body_temperature_samples", kind: "quantity", column: "celsius" },
  electrodermalActivity: { identifier: "electrodermalActivity", table: "electrodermal_activity_samples", kind: "quantity", column: "microsiemens" },

  // Vitals
  oxygenSaturation: { identifier: "oxygenSaturation", table: "oxygen_saturation_samples", kind: "quantity", column: "percent" },
  bloodGlucose: { identifier: "bloodGlucose", table: "blood_glucose_samples", kind: "quantity", column: "mg_per_dl" },
  forcedVitalCapacity: { identifier: "forcedVitalCapacity", table: "forced_vital_capacity_samples", kind: "quantity", column: "liters" },
  forcedExpiratoryVolume1: { identifier: "forcedExpiratoryVolume1", table: "forced_expiratory_volume_samples", kind: "quantity", column: "liters" },
  peakExpiratoryFlowRate: { identifier: "peakExpiratoryFlowRate", table: "peak_expiratory_flow_samples", kind: "quantity", column: "liters_per_min" },
  inhalerUsage: { identifier: "inhalerUsage", table: "inhaler_usage_samples", kind: "quantity", column: "count" },
  insulinDelivery: { identifier: "insulinDelivery", table: "insulin_delivery_samples", kind: "quantity", column: "iu" },
  numberOfTimesFallen: { identifier: "numberOfTimesFallen", table: "falls_samples", kind: "quantity", column: "count" },

  // Hearing
  environmentalAudioExposure: { identifier: "environmentalAudioExposure", table: "environmental_audio_exposure_samples", kind: "quantity", column: "dbaspl" },
  headphoneAudioExposure: { identifier: "headphoneAudioExposure", table: "headphone_audio_exposure_samples", kind: "quantity", column: "dbaspl" },

  // Environment
  uvExposure: { identifier: "uvExposure", table: "uv_exposure_samples", kind: "quantity", column: "count" },
  waterTemperature: { identifier: "waterTemperature", table: "water_temperature_samples", kind: "quantity", column: "celsius" },
  underwaterDepth: { identifier: "underwaterDepth", table: "underwater_depth_samples", kind: "quantity", column: "meters" },

  // Nutrition
  dietaryEnergyConsumed: { identifier: "dietaryEnergyConsumed", table: "dietary_energy_samples", kind: "quantity", column: "kcal" },
  dietaryProtein: { identifier: "dietaryProtein", table: "dietary_protein_samples", kind: "quantity", column: "grams" },
  dietaryCarbohydrates: { identifier: "dietaryCarbohydrates", table: "dietary_carbohydrates_samples", kind: "quantity", column: "grams" },
  dietaryFiber: { identifier: "dietaryFiber", table: "dietary_fiber_samples", kind: "quantity", column: "grams" },
  dietarySugar: { identifier: "dietarySugar", table: "dietary_sugar_samples", kind: "quantity", column: "grams" },
  dietaryFatTotal: { identifier: "dietaryFatTotal", table: "dietary_fat_total_samples", kind: "quantity", column: "grams" },
  dietaryFatSaturated: { identifier: "dietaryFatSaturated", table: "dietary_fat_saturated_samples", kind: "quantity", column: "grams" },
  dietaryFatMonounsaturated: { identifier: "dietaryFatMonounsaturated", table: "dietary_fat_monounsaturated_samples", kind: "quantity", column: "grams" },
  dietaryFatPolyunsaturated: { identifier: "dietaryFatPolyunsaturated", table: "dietary_fat_polyunsaturated_samples", kind: "quantity", column: "grams" },
  dietaryCholesterol: { identifier: "dietaryCholesterol", table: "dietary_cholesterol_samples", kind: "quantity", column: "mg" },
  dietarySodium: { identifier: "dietarySodium", table: "dietary_sodium_samples", kind: "quantity", column: "mg" },
  dietaryPotassium: { identifier: "dietaryPotassium", table: "dietary_potassium_samples", kind: "quantity", column: "mg" },
  dietaryCalcium: { identifier: "dietaryCalcium", table: "dietary_calcium_samples", kind: "quantity", column: "mg" },
  dietaryIron: { identifier: "dietaryIron", table: "dietary_iron_samples", kind: "quantity", column: "mg" },
  dietaryMagnesium: { identifier: "dietaryMagnesium", table: "dietary_magnesium_samples", kind: "quantity", column: "mg" },
  dietaryZinc: { identifier: "dietaryZinc", table: "dietary_zinc_samples", kind: "quantity", column: "mg" },
  dietaryVitaminA: { identifier: "dietaryVitaminA", table: "dietary_vitamin_a_samples", kind: "quantity", column: "mcg" },
  dietaryVitaminC: { identifier: "dietaryVitaminC", table: "dietary_vitamin_c_samples", kind: "quantity", column: "mg" },
  dietaryVitaminD: { identifier: "dietaryVitaminD", table: "dietary_vitamin_d_samples", kind: "quantity", column: "mcg" },
  dietaryVitaminE: { identifier: "dietaryVitaminE", table: "dietary_vitamin_e_samples", kind: "quantity", column: "mg" },
  dietaryVitaminK: { identifier: "dietaryVitaminK", table: "dietary_vitamin_k_samples", kind: "quantity", column: "mcg" },
  dietaryVitaminB6: { identifier: "dietaryVitaminB6", table: "dietary_vitamin_b6_samples", kind: "quantity", column: "mg" },
  dietaryVitaminB12: { identifier: "dietaryVitaminB12", table: "dietary_vitamin_b12_samples", kind: "quantity", column: "mcg" },
  dietaryCaffeine: { identifier: "dietaryCaffeine", table: "dietary_caffeine_samples", kind: "quantity", column: "mg" },
  dietaryWater: { identifier: "dietaryWater", table: "dietary_water_samples", kind: "quantity", column: "ml" },

  // Heart rhythm events
  highHeartRateEvent: { identifier: "highHeartRateEvent", table: "high_heart_rate_event_samples", kind: "category" },
  lowHeartRateEvent: { identifier: "lowHeartRateEvent", table: "low_heart_rate_event_samples", kind: "category" },
  irregularHeartRhythmEvent: { identifier: "irregularHeartRhythmEvent", table: "irregular_heart_rhythm_event_samples", kind: "category" },

  // Mindfulness
  mindfulSession: { identifier: "mindfulSession", table: "mindful_session_samples", kind: "category" },

  // Reproductive health
  menstrualFlow: { identifier: "menstrualFlow", table: "menstrual_flow_samples", kind: "category" },
  intermenstrualBleeding: { identifier: "intermenstrualBleeding", table: "intermenstrual_bleeding_samples", kind: "category" },
  sexualActivity: { identifier: "sexualActivity", table: "sexual_activity_samples", kind: "category" },
  ovulationTestResult: { identifier: "ovulationTestResult", table: "ovulation_test_samples", kind: "category" },
  contraceptive: { identifier: "contraceptive", table: "contraceptive_samples", kind: "category" },
  pregnancy: { identifier: "pregnancy", table: "pregnancy_samples", kind: "category" },
  pregnancyTestResult: { identifier: "pregnancyTestResult", table: "pregnancy_test_samples", kind: "category" },
  lactation: { identifier: "lactation", table: "lactation_samples", kind: "category" },
  cervicalMucusQuality: { identifier: "cervicalMucusQuality", table: "cervical_mucus_quality_samples", kind: "category" },

  // Symptoms
  abdominalCramps: { identifier: "abdominalCramps", table: "symptom_abdominal_cramps_samples", kind: "category" },
  bloating: { identifier: "bloating", table: "symptom_bloating_samples", kind: "category" },
  constipation: { identifier: "constipation", table: "symptom_constipation_samples", kind: "category" },
  diarrhea: { identifier: "diarrhea", table: "symptom_diarrhea_samples", kind: "category" },
  dizziness: { identifier: "dizziness", table: "symptom_dizziness_samples", kind: "category" },
  fatigue: { identifier: "fatigue", table: "symptom_fatigue_samples", kind: "category" },
  fever: { identifier: "fever", table: "symptom_fever_samples", kind: "category" },
  generalizedBodyAche: { identifier: "generalizedBodyAche", table: "symptom_body_ache_samples", kind: "category" },
  headache: { identifier: "headache", table: "symptom_headache_samples", kind: "category" },
  heartburn: { identifier: "heartburn", table: "symptom_heartburn_samples", kind: "category" },
  lossOfSmell: { identifier: "lossOfSmell", table: "symptom_loss_of_smell_samples", kind: "category" },
  lossOfTaste: { identifier: "lossOfTaste", table: "symptom_loss_of_taste_samples", kind: "category" },
  nausea: { identifier: "nausea", table: "symptom_nausea_samples", kind: "category" },
  rapidPoundingOrFlutteringHeartbeat: { identifier: "rapidPoundingOrFlutteringHeartbeat", table: "symptom_rapid_heartbeat_samples", kind: "category" },
  runnyNose: { identifier: "runnyNose", table: "symptom_runny_nose_samples", kind: "category" },
  shortnessOfBreath: { identifier: "shortnessOfBreath", table: "symptom_shortness_of_breath_samples", kind: "category" },
  sinusCongestion: { identifier: "sinusCongestion", table: "symptom_sinus_congestion_samples", kind: "category" },
  soreThroat: { identifier: "soreThroat", table: "symptom_sore_throat_samples", kind: "category" },
  vomiting: { identifier: "vomiting", table: "symptom_vomiting_samples", kind: "category" },
  wheezing: { identifier: "wheezing", table: "symptom_wheezing_samples", kind: "category" },
  coughing: { identifier: "coughing", table: "symptom_coughing_samples", kind: "category" },
  chills: { identifier: "chills", table: "symptom_chills_samples", kind: "category" },
  chestTightnessOrPain: { identifier: "chestTightnessOrPain", table: "symptom_chest_tightness_samples", kind: "category" },
  moodChanges: { identifier: "moodChanges", table: "symptom_mood_changes_samples", kind: "category" },
  sleepChanges: { identifier: "sleepChanges", table: "symptom_sleep_changes_samples", kind: "category" },
  memoryLapse: { identifier: "memoryLapse", table: "symptom_memory_lapse_samples", kind: "category" },
  hotFlashes: { identifier: "hotFlashes", table: "symptom_hot_flashes_samples", kind: "category" },
  lowerBackPain: { identifier: "lowerBackPain", table: "symptom_lower_back_pain_samples", kind: "category" },
  appetiteChanges: { identifier: "appetiteChanges", table: "symptom_appetite_changes_samples", kind: "category" },
  bladderIncontinence: { identifier: "bladderIncontinence", table: "symptom_bladder_incontinence_samples", kind: "category" },

  // Correlations
  bloodPressure: { identifier: "bloodPressure", table: "blood_pressure_samples", kind: "correlation", column: "systolic_mmhg", secondaryColumn: "diastolic_mmhg" },
};

const HEALTHKIT_ENVELOPE_COLUMNS = `    id uuid primary key default gen_random_uuid(),
    client_sample_id text not null unique check (char_length(client_sample_id) between 20 and 250),
    participant_id uuid not null references public.participants(id) on delete cascade,
    enrollment_id uuid not null references public.study_enrollments(id) on delete cascade,
    stable_study_id text not null check (char_length(stable_study_id) between 1 and 100),
    sample_uuid uuid not null,
    sample_start timestamptz not null,
    sample_end timestamptz not null check (sample_end >= sample_start),
    sample_time_zone text,`;
const HEALTHKIT_FOOTER_COLUMNS = `    configuration_schema_version integer not null check (configuration_schema_version > 0),
    configuration_revision integer not null check (configuration_revision > 0),
    received_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    unique (enrollment_id, sample_uuid)`;

function healthKitTableSQL(spec: HealthKitTableSpec): string {
  const numericColumn = (column: string) =>
    `    ${column} double precision not null check (${column} = ${column} and ${column} not in ('Infinity'::float8, '-Infinity'::float8) and ${column} >= 0),`;
  let middle: string;
  switch (spec.kind) {
    case "sleepState":
      middle = `    state text not null check (state in ('inBed','asleepUnspecified','awake','asleepCore','asleepDeep','asleepREM')),`;
      break;
    case "category":
      // Apple's raw per-type integer enum value — unlike sleep, most category types (heart
      // events, mindfulness, reproductive health, symptoms) each have their own different enum,
      // so a generic integer column is the only shape that scales to this catalog's size.
      middle = `    category_value integer not null check (category_value >= 0),`;
      break;
    case "quantity":
      middle = numericColumn(spec.column);
      break;
    case "workout":
      middle = `    activity_type bigint not null,
    duration_seconds double precision not null check (duration_seconds = duration_seconds and duration_seconds not in ('Infinity'::float8, '-Infinity'::float8) and duration_seconds >= 0),`;
      break;
    case "correlation":
      middle = `${numericColumn(spec.column)}\n${numericColumn(spec.secondaryColumn)}`;
      break;
  }
  return `create table if not exists public.${spec.table} (
${HEALTHKIT_ENVELOPE_COLUMNS}
${middle}
${HEALTHKIT_FOOTER_COLUMNS}
);`;
}

function healthKitRPCBranch(spec: HealthKitTableSpec, isFirst: boolean): string {
  const keyword = isFirst ? "if" : "elsif";
  let validate: string;
  let compareLine: string;
  let insertColumns: string;
  let insertValues: string;

  switch (spec.kind) {
    case "sleepState":
      validate = `      v_state := case (v_sample->>'category_value')::integer
        when 0 then 'inBed' when 1 then 'asleepUnspecified' when 2 then 'awake'
        when 3 then 'asleepCore' when 4 then 'asleepDeep' when 5 then 'asleepREM' else null end;
      if v_sample->>'sample_kind' <> 'category' or v_state is null then raise exception 'invalid sleep sample' using errcode='22023'; end if;`;
      compareLine = `           or v_existing.state <> v_state`;
      insertColumns = "state";
      insertValues = "v_state";
      break;
    case "category":
      validate = `      if v_sample->>'sample_kind' <> 'category' or v_sample->>'category_value' is null then raise exception 'invalid category sample' using errcode='22023'; end if;`;
      compareLine = `           or v_existing.category_value <> (v_sample->>'category_value')::integer`;
      insertColumns = "category_value";
      insertValues = "(v_sample->>'category_value')::integer";
      break;
    case "quantity":
      validate = `      if v_sample->>'sample_kind' <> 'quantity' or v_sample->>'numeric_value' is null then raise exception 'invalid quantity sample' using errcode='22023'; end if;`;
      compareLine = `           or v_existing.${spec.column} <> (v_sample->>'numeric_value')::double precision`;
      insertColumns = spec.column;
      insertValues = "(v_sample->>'numeric_value')::double precision";
      break;
    case "workout":
      validate = `      if v_sample->>'sample_kind' <> 'workout' or v_sample->>'workout_activity_type' is null or v_sample->>'workout_duration_seconds' is null then raise exception 'invalid workout sample' using errcode='22023'; end if;`;
      compareLine = `           or v_existing.activity_type <> (v_sample->>'workout_activity_type')::bigint
           or v_existing.duration_seconds <> (v_sample->>'workout_duration_seconds')::double precision`;
      insertColumns = "activity_type,duration_seconds";
      insertValues = "(v_sample->>'workout_activity_type')::bigint,(v_sample->>'workout_duration_seconds')::double precision";
      break;
    case "correlation":
      validate = `      if v_sample->>'sample_kind' <> 'correlation' or v_sample->>'numeric_value' is null or v_sample->>'secondary_numeric_value' is null then raise exception 'invalid correlation sample' using errcode='22023'; end if;`;
      compareLine = `           or v_existing.${spec.column} <> (v_sample->>'numeric_value')::double precision
           or v_existing.${spec.secondaryColumn} <> (v_sample->>'secondary_numeric_value')::double precision`;
      insertColumns = `${spec.column},${spec.secondaryColumn}`;
      insertValues = "(v_sample->>'numeric_value')::double precision,(v_sample->>'secondary_numeric_value')::double precision";
      break;
  }

  // configuration_schema_version/configuration_revision are deliberately NOT
  // part of the duplicate-identity check: a config republish makes the app
  // re-send already-uploaded samples under the new revision, and those must be
  // acknowledged as the existing row, not rejected (see the app repo's
  // study_backend_template/migrations/012_healthkit_idempotent_across_revisions.sql).
  return `    ${keyword} v_identifier = '${spec.identifier}' then
${validate}
      select * into v_existing from public.${spec.table} t where t.client_sample_id = v_sample->>'client_sample_id';
      if found then
        if v_existing.participant_id <> v_participant or v_existing.enrollment_id <> enrollment_id
           or v_existing.stable_study_id <> expected_stable_study_id
           or v_existing.sample_uuid <> (v_sample->>'sample_uuid')::uuid
           or v_existing.sample_start <> (v_sample->>'sample_start')::timestamptz
           or v_existing.sample_end <> (v_sample->>'sample_end')::timestamptz
${compareLine}
        then raise exception 'conflicting duplicate identity' using errcode='23505'; end if;
        client_sample_id:=v_existing.client_sample_id; acknowledgment_id:=v_existing.id; received_at:=v_existing.received_at; idempotent_existing:=true; return next; continue;
      end if;
      insert into public.${spec.table}(client_sample_id,participant_id,enrollment_id,stable_study_id,sample_uuid,sample_start,sample_end,sample_time_zone,${insertColumns},configuration_schema_version,configuration_revision)
      values(v_sample->>'client_sample_id',v_participant,enrollment_id,expected_stable_study_id,(v_sample->>'sample_uuid')::uuid,(v_sample->>'sample_start')::timestamptz,(v_sample->>'sample_end')::timestamptz,v_sample->>'sample_time_zone',${insertValues},(v_sample->>'configuration_schema_version')::integer,(v_sample->>'configuration_revision')::integer)
      returning * into v_row;
      client_sample_id:=v_row.client_sample_id; acknowledgment_id:=v_row.id; received_at:=v_row.received_at; idempotent_existing:=false; return next;`;
}

// The one section that's genuinely per-study: one table per configured
// HealthKit identifier (only those the study actually uses), plus a
// submit_healthkit_samples RPC narrowed to matching if/elsif branches — same
// name/params/return shape as the reference template either way, so the
// Swift app's RPC call site never needs to know which types a given study
// picked.
function buildHealthKitSection(identifiers: string[]): SplitSQL {
  const specs = identifiers
    .map((id) => HEALTHKIT_TABLE_SPECS[id as keyof typeof HEALTHKIT_TABLE_SPECS])
    .filter((spec): spec is HealthKitTableSpec => !!spec);
  const tables = specs.map(healthKitTableSQL).join("\n\n");
  const comments = specs
    .map((spec) => `comment on table public.${spec.table} is 'STUDY DATA BACKEND ONLY. Readable HealthKit samples for ${spec.identifier}.';`)
    .join("\n");
  const enableRLS = specs.map((spec) => `alter table public.${spec.table} enable row level security;`).join("\n");
  const revokeList = specs.map((spec) => `public.${spec.table}`).join(", ");
  const branches = specs.map((spec, i) => healthKitRPCBranch(spec, i === 0)).join("\n\n");

  const structure = `-- STUDY DATA BACKEND ONLY
-- Readable HealthKit samples, one table per configured data type
-- (${identifiers.join(", ")}). Never apply to inoxity_backend.
--
-- Every table's sample_time_zone (nullable — older app builds won't send it) is the IANA
-- identifier the sample actually occurred in, from the source's own HKMetadataKeyTimeZone when
-- populated, else the device's zone at query time — see survey_events.event_time_zone in
-- generate-backend-sql.ts for the same rationale. Not part of the conflicting-duplicate-identity
-- check each RPC branch runs below (see healthKitRPCBranch) since it's contextual metadata, not
-- part of a sample's identity the way sample_start/numeric_value are.

${tables}

${comments}

-- Idempotent, ownership-checked batch submission — same name/params/return
-- shape regardless of which types this study uses.
create or replace function public.submit_healthkit_samples(
  expected_backend_id uuid, expected_stable_study_id text, enrollment_id uuid, samples jsonb
) returns table(client_sample_id text, acknowledgment_id uuid, received_at timestamptz, idempotent_existing boolean)
language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_participant uuid; v_identity public.study_backend_metadata%rowtype; v_sample jsonb;
  v_identifier text; v_existing record; v_row record; v_state text;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if jsonb_typeof(samples) <> 'array' or jsonb_array_length(samples) < 1 or jsonb_array_length(samples) > 250 then
    raise exception 'invalid batch size' using errcode = '22023';
  end if;
  select * into v_identity from public.study_backend_metadata limit 1;
  if not found or not v_identity.is_active then
    raise exception 'study_backend_inactive' using errcode = '55000';
  end if;
  if v_identity.backend_instance_id <> expected_backend_id or v_identity.stable_study_id <> expected_stable_study_id then
    raise exception 'backend identity mismatch' using errcode = '42501';
  end if;
  select e.participant_id into v_participant from public.study_enrollments e join public.participants p on p.id=e.participant_id
    where e.id=enrollment_id and p.auth_user_id=auth.uid() and e.status='active';
  if v_participant is null then raise exception 'enrollment ownership denied' using errcode = '42501'; end if;

  for v_sample in select value from jsonb_array_elements(samples) loop
    v_identifier := v_sample->>'health_type_identifier';
    v_existing := null; v_row := null;

${branches}

    else
      raise exception 'unsupported identifier' using errcode='22023';
    end if;
  end loop;
end; $$;`;

  const security = `${enableRLS}
revoke all on ${revokeList} from anon, authenticated;

revoke all on function public.submit_healthkit_samples(uuid,text,uuid,jsonb) from public, anon;
grant execute on function public.submit_healthkit_samples(uuid,text,uuid,jsonb) to authenticated;`;

  return { structure, security };
}

// One-time snapshot (biological sex, blood type, DOB, Fitzpatrick skin type, wheelchair use), not
// a growing time series — a single upserted row per participant, mirroring update_sleep_schedule's
// shape/param-naming conventions above rather than the batched submit_healthkit_samples RPC.
// Included in the generated script independently of buildHealthKitSection — a study can have
// healthKit.includeCharacteristics on with or without any sample identifiers configured.
function buildCharacteristicsSection(): SplitSQL {
  const structure = `-- STUDY DATA BACKEND ONLY
-- One-time HealthKit characteristics snapshot (biological sex, blood type, date of birth,
-- Fitzpatrick skin type, wheelchair use) — a single upserted row per participant, not a time
-- series. Never apply to inoxity_backend.

create table public.participant_characteristics (
  participant_id uuid primary key references public.participants(id) on delete cascade,
  biological_sex text,
  blood_type text,
  fitzpatrick_skin_type text,
  date_of_birth date,
  uses_wheelchair boolean,
  updated_at timestamptz not null default now()
);

comment on table public.participant_characteristics is 'STUDY DATA BACKEND ONLY. One-time HealthKit characteristics snapshot per participant, upserted via submit_participant_characteristics.';

-- Idempotent upsert — a re-sync (e.g. after a network failure, or the participant re-granting
-- access) simply overwrites the same row rather than needing conflict resolution against a
-- history of past values, since this is a snapshot of current facts, not an event log.
-- p_-prefixed value params, same defensive pattern as update_sleep_schedule above.
create or replace function public.submit_participant_characteristics(
 expected_backend_id text, expected_stable_study_id text,
 p_biological_sex text default null, p_blood_type text default null, p_fitzpatrick_skin_type text default null,
 p_date_of_birth date default null, p_uses_wheelchair boolean default null)
returns table(participant_id uuid, updated_at timestamptz)
language plpgsql security definer set search_path = pg_catalog, public as $$ declare m public.study_backend_metadata%rowtype; p public.participants%rowtype; v_row public.participant_characteristics%rowtype; begin
 if auth.uid() is null then raise exception 'unauthorized' using errcode='42501'; end if;
 select * into m from public.study_backend_metadata where singleton;
 if not found or not m.is_active then raise exception 'study_backend_inactive' using errcode='55000'; end if;
 if m.backend_instance_id <> expected_backend_id::uuid or m.stable_study_id <> expected_stable_study_id then raise exception 'backend_identity_mismatch'; end if;
 select * into p from public.participants where auth_user_id=auth.uid(); if not found then raise exception 'participant_missing'; end if;
 insert into public.participant_characteristics(participant_id, biological_sex, blood_type, fitzpatrick_skin_type, date_of_birth, uses_wheelchair, updated_at)
 values(p.id, p_biological_sex, p_blood_type, p_fitzpatrick_skin_type, p_date_of_birth, p_uses_wheelchair, now())
 on conflict(participant_id) do update set
   biological_sex = excluded.biological_sex, blood_type = excluded.blood_type,
   fitzpatrick_skin_type = excluded.fitzpatrick_skin_type, date_of_birth = excluded.date_of_birth,
   uses_wheelchair = excluded.uses_wheelchair, updated_at = excluded.updated_at
 returning * into v_row;
 return query select v_row.participant_id, v_row.updated_at;
end $$;`;

  const security = `alter table public.participant_characteristics enable row level security;
revoke all on public.participant_characteristics from anon, authenticated;

revoke all on function public.submit_participant_characteristics(text,text,text,text,text,date,boolean) from public, anon;
grant execute on function public.submit_participant_characteristics(text,text,text,text,text,date,boolean) to authenticated;`;

  return { structure, security };
}

const MIGRATION_007_MEDIA_UPLOADS = `-- STUDY DATA BACKEND ONLY — apply to exactly one Study Backend.
-- Real remote media upload, matching the pre-dashboard app's working
-- implementation (a \`media_uploads\` table + a \`user-uploads\` Storage
-- bucket).

create table public.media_uploads (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  enrollment_id uuid not null references public.study_enrollments(id) on delete cascade,
  stable_study_id text not null check (char_length(stable_study_id) between 1 and 100),
  storage_path text not null unique check (char_length(storage_path) between 1 and 500),
  mime_type text not null check (char_length(mime_type) between 1 and 100),
  bytes bigint not null check (bytes > 0),
  category_id text not null check (char_length(category_id) between 1 and 100),
  duration_seconds numeric check (duration_seconds is null or duration_seconds >= 0),
  represented_date date,
  configuration_schema_version integer not null check (configuration_schema_version > 0),
  configuration_revision integer not null check (configuration_revision > 0),
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.media_uploads is
'STUDY DATA BACKEND ONLY. Metadata for files uploaded to the user-uploads Storage bucket; the file itself lives in Storage, this only records where and what it is.';

insert into storage.buckets (id, name, public)
values ('user-uploads', 'user-uploads', false)
on conflict (id) do nothing;`;

// Participants may only touch files under their own auth.uid() folder in the private bucket.
const MIGRATION_007_SECURITY = `alter table public.media_uploads enable row level security;
revoke all on public.media_uploads from anon, authenticated;

create policy "Participants can upload their own files"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Participants can read their own files"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Participants can delete their own files"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = auth.uid()::text);`;

const MIGRATION_008_MEDIA_UPLOAD_RPC = `-- STUDY DATA BACKEND ONLY
-- Records the metadata row for a media file the app already uploaded
-- directly to the user-uploads Storage bucket (see 007's RLS policies).

create or replace function public.submit_media_upload(
  expected_backend_id text, expected_stable_study_id text, enrollment_id text,
  storage_path text, mime_type text, category_id text, bytes bigint,
  duration_seconds numeric default null, represented_date date default null,
  configuration_schema_version integer default 0, configuration_revision integer default 0
) returns table(id uuid, received_at timestamptz)
language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  m public.study_backend_metadata%rowtype; p public.participants%rowtype; v_existing public.media_uploads%rowtype; v_row public.media_uploads%rowtype;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode='42501'; end if;
  select * into m from public.study_backend_metadata where singleton;
  if not found or not m.is_active then raise exception 'study_backend_inactive' using errcode='55000'; end if;
  if m.backend_instance_id <> expected_backend_id::uuid or m.stable_study_id <> expected_stable_study_id then raise exception 'backend_identity_mismatch'; end if;
  select * into p from public.participants where auth_user_id=auth.uid(); if not found then raise exception 'participant_missing'; end if;
  if not exists(select 1 from public.study_enrollments e where e.id=enrollment_id::uuid and e.participant_id=p.id)
     then raise exception 'enrollment_ownership_denied' using errcode='42501'; end if;
  if split_part(storage_path, '/', 1) <> auth.uid()::text then raise exception 'ownership_denied' using errcode='42501'; end if;

  select * into v_existing from public.media_uploads t where t.storage_path = submit_media_upload.storage_path;
  if found then
    if v_existing.participant_id <> p.id or v_existing.enrollment_id <> enrollment_id::uuid
       or v_existing.stable_study_id <> expected_stable_study_id
       or v_existing.mime_type <> submit_media_upload.mime_type or v_existing.bytes <> submit_media_upload.bytes
       or v_existing.category_id <> submit_media_upload.category_id
       or v_existing.duration_seconds is distinct from submit_media_upload.duration_seconds
       or v_existing.represented_date is distinct from submit_media_upload.represented_date
       or v_existing.configuration_schema_version <> submit_media_upload.configuration_schema_version
       or v_existing.configuration_revision <> submit_media_upload.configuration_revision
    then raise exception 'conflicting_duplicate_identity' using errcode='23505'; end if;
    return query select v_existing.id, v_existing.received_at; return;
  end if;

  insert into public.media_uploads(participant_id,enrollment_id,stable_study_id,storage_path,mime_type,bytes,category_id,duration_seconds,represented_date,configuration_schema_version,configuration_revision)
  values(p.id,enrollment_id::uuid,expected_stable_study_id,submit_media_upload.storage_path,submit_media_upload.mime_type,submit_media_upload.bytes,submit_media_upload.category_id,submit_media_upload.duration_seconds,submit_media_upload.represented_date,submit_media_upload.configuration_schema_version,submit_media_upload.configuration_revision)
  returning * into v_row;
  return query select v_row.id, v_row.received_at;
end $$;`;

const MIGRATION_008_SECURITY = `revoke all on function public.submit_media_upload(text,text,text,text,text,text,bigint,numeric,date,integer,integer) from public, anon;
grant execute on function public.submit_media_upload(text,text,text,text,text,text,bigint,numeric,date,integer,integer) to authenticated;`;

// Replaces submit_withdrawal_request (defined in MIGRATION_002_RLS_AND_RPCS above) with a
// version that actually deletes the participant's data on withdrawal_choice =
// 'deleteExistingData' — the original only ever recorded the request. Applies unconditionally
// (not gated on healthKit/media config) since every study has withdrawal_requests/participants.
const MIGRATION_009_WITHDRAWAL_DELETION = `-- STUDY DATA BACKEND ONLY — apply after 001-004 (and 005-008 if used).
-- submit_withdrawal_request previously only recorded withdrawal_choice; it never deleted
-- anything. This makes 'deleteExistingData' genuinely delete the participant's data, keeping
-- an anonymized audit row (withdrawal_requests survives with participant_id/enrollment_id
-- nulled and processed_at set) rather than a traceless purge. 'keepExistingData' now also
-- transitions study_enrollments.status to 'withdrawn', which nothing did before either.
--
-- Also returns the exact media_uploads.storage_path values it deleted, so the Swift client can
-- delete the matching Supabase Storage objects too — Postgres can't reach Storage directly.
-- The RETURNS TABLE shape grows one column, so this drops the function first (create or
-- replace function cannot change an existing function's return type in place).
--
-- IN params are p_-prefixed (client_event_id/enrollment_id/withdrawal_choice/requested_at)
-- because each also names a column on withdrawal_requests — same defensive pattern as
-- register_study_enrollment/update_sleep_schedule in 002 (a bare occurrence ambiguous against
-- the column, 42702, once more than one statement in this function has that table in scope).

alter table public.withdrawal_requests alter column participant_id drop not null;
alter table public.withdrawal_requests drop constraint if exists withdrawal_requests_participant_id_fkey;
alter table public.withdrawal_requests add constraint withdrawal_requests_participant_id_fkey
  foreign key (participant_id) references public.participants(id) on delete set null;
alter table public.withdrawal_requests drop constraint if exists withdrawal_requests_enrollment_id_fkey;
alter table public.withdrawal_requests add constraint withdrawal_requests_enrollment_id_fkey
  foreign key (enrollment_id) references public.study_enrollments(id) on delete set null;

drop function if exists public.submit_withdrawal_request(text,text,text,text,text,text);

create function public.submit_withdrawal_request(p_client_event_id text, expected_backend_id text,
 expected_stable_study_id text, p_withdrawal_choice text, p_requested_at text, p_enrollment_id text default null)
returns table(request_id uuid, deleted_storage_paths text[])
language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  m public.study_backend_metadata%rowtype;
  p public.participants%rowtype;
  r public.withdrawal_requests%rowtype;
  existing public.withdrawal_requests%rowtype;
  v_paths text[] := '{}';
begin
 if auth.uid() is null then raise exception 'unauthorized' using errcode='42501'; end if;

 select * into existing from public.withdrawal_requests where client_event_id = p_client_event_id::uuid;
 if found and existing.processed_at is not null then
   return query select existing.id, '{}'::text[]; return;
 end if;

 select * into m from public.study_backend_metadata where singleton;
 if not found or not m.is_active then raise exception 'study_backend_inactive' using errcode='55000'; end if;
 if m.backend_instance_id <> expected_backend_id::uuid or m.stable_study_id <> expected_stable_study_id then raise exception 'backend_identity_mismatch'; end if;
 select * into p from public.participants where auth_user_id=auth.uid(); if not found then raise exception 'participant_missing'; end if;
 if p_enrollment_id is null then raise exception 'enrollment_missing' using errcode='22023'; end if;
 if not exists(select 1 from public.study_enrollments e where e.id=p_enrollment_id::uuid and e.participant_id=p.id)
    then raise exception 'enrollment_ownership_denied' using errcode='42501'; end if;

 insert into public.withdrawal_requests(client_event_id,participant_id,enrollment_id,withdrawal_choice,requested_at)
 values(p_client_event_id::uuid,p.id,p_enrollment_id::uuid,p_withdrawal_choice,p_requested_at::timestamptz) on conflict(client_event_id) do nothing;
 select * into r from public.withdrawal_requests where client_event_id = p_client_event_id::uuid;
 if r.participant_id is distinct from p.id or r.enrollment_id is distinct from p_enrollment_id::uuid
    or r.withdrawal_choice <> p_withdrawal_choice
    or r.requested_at <> p_requested_at::timestamptz
    then raise exception 'conflicting_idempotency_key' using errcode='23505'; end if;

 if r.withdrawal_choice = 'deleteExistingData' then
   select coalesce(array_agg(storage_path), '{}') into v_paths
     from public.media_uploads where enrollment_id = r.enrollment_id;
   delete from public.survey_events where enrollment_id = r.enrollment_id;
   delete from public.study_enrollments where id = r.enrollment_id;
   update public.withdrawal_requests set processed_at = now() where id = r.id;
   delete from public.participants where id = p.id;
 else
   update public.study_enrollments set status = 'withdrawn' where id = r.enrollment_id;
   update public.withdrawal_requests set processed_at = now() where id = r.id;
 end if;

 return query select r.id, v_paths;
end $$;`;

const MIGRATION_009_SECURITY = `revoke all on function public.submit_withdrawal_request(text,text,text,text,text,text) from public, anon;
grant execute on function public.submit_withdrawal_request(text,text,text,text,text,text) to authenticated;`;

const PLACEHOLDER_BACKEND_ID = "00000000-0000-0000-0000-000000000000";

// Optional tail of the security file — additive-only, never touches anything the required
// sections created. Kept separate so it's unambiguous which access rules the app depends on
// versus which are suggestions the research team can edit, replace, or delete entirely without
// breaking enrollment/sync.
function buildSecurityHardeningSection(config: StudyConfiguration): string {
  const pid = config.participantID;
  const constraintParts: string[] = [];
  if (pid.minimumLength > 0) constraintParts.push(`length(participant_identifier) >= ${pid.minimumLength}`);
  if (pid.maximumLength > 0) constraintParts.push(`length(participant_identifier) <= ${pid.maximumLength}`);
  if (pid.allowedPattern) constraintParts.push(`participant_identifier ~ '${sqlLiteral(pid.allowedPattern)}'`);
  const participantIdConstraintSQL =
    constraintParts.length > 0
      ? [
          "-- Optional: enforce this study's configured participant-ID shape server-side too, not just in",
          "-- the app's own onboarding form (defense in depth — the app already validates this client-side,",
          "-- but nothing stops a modified/other client from submitting something else).",
          "alter table public.study_enrollments drop constraint if exists study_enrollments_participant_identifier_shape;",
          `alter table public.study_enrollments add constraint study_enrollments_participant_identifier_shape`,
          `  check (${constraintParts.join(" and ")});`,
        ].join("\n")
      : "-- (This study's Participant ID step has no length/pattern restrictions configured, so there's\n-- nothing to mirror into a server-side constraint here.)";

  return [
    "-- ================================================================",
    "-- OPTIONAL — Extra security hardening suggestions",
    "-- ================================================================",
    "-- Nothing below this line is needed for the Inoxity app to work. These are suggestions for",
    "-- your team to review, edit, extend, or delete, based on your study's data and IRB/consent",
    "-- obligations. As with the rest of this file, Inoxity is not responsible for your project's",
    "-- security configuration.",
    "",
    participantIdConstraintSQL,
    "",
    "-- The rest of these are project-level Supabase Dashboard settings, not SQL — nothing to",
    "-- paste, just worth reviewing for your study:",
    "--   • Authentication > Attack Protection: enable CAPTCHA on anonymous sign-ins to reduce",
    "--     automated fake-participant spam (this backend uses anonymous auth, so there's no",
    "--     password policy to configure — that's not a gap, just not applicable here).",
    "--   • Database > Backups: confirm Point-in-Time Recovery / backup frequency matches how much",
    "--     data loss your study could tolerate if something went wrong.",
    "--   • Settings > API: treat the anon key as sensitive even though it's meant to be public in",
    "--     the app bundle — if it's ever exposed somewhere unintended (a public repo, a leaked",
    "--     build), rotate it and update the dashboard's Data Backend step with the new value.",
    "--   • Logs & Reports: periodically skim auth/database logs for enrollment volume that doesn't",
    "--     match your actual recruitment — a spike is the easiest early signal of abuse.",
  ].join("\n");
}

// Shown at the top of the security file (and, shortened, next to its download button). Adapted
// from the Stanford Screenomics platform's Firebase setup guide, section 2.3.
export const SECURITY_DISCLAIMER_LINES = [
  "IMPORTANT NOTE: The Inoxity team does not provide or take responsibility for the security of",
  "your study's database. Security rules must be developed based on study-specific and",
  "institutional policies, so that they align with your study's requirements, including data",
  "sensitivity, regulatory compliance (e.g., IRB, HIPAA), and ethical guidelines. This file is a",
  "starting template only: it contains the access rules the Inoxity app needs to work with your",
  "database, and your team should review and adapt it. For an overview of how these rules work,",
  "see Supabase's Row Level Security guide:",
  "https://supabase.com/docs/guides/database/postgres/row-level-security",
];

function banner(title: string): string {
  return [
    "-- ================================================================",
    `-- ${title}`,
    "-- ================================================================",
  ].join("\n");
}

/**
 * Builds this study's two Data Backend setup scripts — see the file header for the split.
 * `structure`: the same boilerplate schema every study gets, plus (if HealthKit is enabled) the
 * samples tables narrowed to this study's own configured data types, plus a pre-filled seed row
 * for the project's identity. `security`: the matching access rules, plus (unless opted out) a
 * trailing optional hardening section — see buildSecurityHardeningSection above.
 */
export function generateStudyBackendSQL(
  config: StudyConfiguration,
  options?: { includeHardening?: boolean },
): SplitSQL {
  const includeHardening = options?.includeHardening ?? true;
  const backendId = config.dataBackend?.backendId || PLACEHOLDER_BACKEND_ID;
  // The app compares the seed row against the normalized (trimmed, uppercased) code, and the
  // table itself has a check constraint requiring it — so never seed the raw form value.
  const studyCode = normalizeStudyCode(config.identity.code ?? "");
  const stableStudyId = (config.identity.id ?? "").trim();
  const studyLabel = config.identity.displayName || stableStudyId || "this study";
  const healthKit =
    config.healthKit.enabled && config.healthKit.identifiers.length > 0
      ? buildHealthKitSection(config.healthKit.identifiers)
      : null;
  const characteristics = config.healthKit.includeCharacteristics ? buildCharacteristicsSection() : null;

  const structure: string[] = [
    [
      `-- Inoxity Study Backend setup — FILE 1 OF 2: DATABASE STRUCTURE`,
      `-- Study: "${studyLabel}" (${studyCode || "no code set"})`,
      "-- Generated by the Inoxity Researcher Dashboard from this study's saved configuration.",
      "--",
      "-- Run this file FIRST, in full, in a brand-new Supabase project's SQL Editor — a project",
      "-- dedicated to only this study; never reuse one across studies (\"one project can only ever",
      "-- represent one study\"). It creates the tables and functions the Inoxity app uses.",
      "--",
      "-- Then run FILE 2 OF 2 (the security file) in the same project. Don't skip it: without it,",
      "-- Supabase's defaults leave these tables readable by anyone with the project's anon key,",
      "-- and that key ships inside the app.",
    ].join("\n"),
    banner("1. Boilerplate schema — identical for every research team's study"),
    MIGRATION_001_SCHEMA,
    banner("1b. Document this study's configured participant-ID label"),
    // participant_identifier is a fixed physical column name shared by every
    // study's schema — it can never literally be renamed to match this
    // study's configured label (e.g. "SONA ID"). This comment makes that
    // label visible when a researcher inspects the column in Supabase
    // Studio, without touching data, constraints, or RLS in any way.
    `comment on column public.study_enrollments.participant_identifier is '${sqlLiteral(config.participantID.label || "Participant ID")}';`,
    MIGRATION_002_RPCS,
    MIGRATION_003_SURVEY_EVENTS,
    MIGRATION_004_SURVEY_EVENT_RPC,
  ];
  const security: string[] = [
    [
      `-- Inoxity Study Backend setup — FILE 2 OF 2: SECURITY`,
      `-- Study: "${studyLabel}" (${studyCode || "no code set"})`,
      "-- Generated by the Inoxity Researcher Dashboard from this study's saved configuration.",
      "--",
      ...SECURITY_DISCLAIMER_LINES.map((line) => `-- ${line}`),
      "--",
      "-- Run this AFTER file 1 (the database structure file) has finished, in the same project. It",
      "-- turns on Row Level Security, limits each participant to their own rows and files, and",
      "-- allows signed-in participants to call only the functions the app uses. Don't skip it:",
      "-- without it, Supabase's defaults leave your tables readable by anyone with the project's",
      "-- anon key, and that key ships inside the app.",
    ].join("\n"),
    banner("1. Core tables and enrollment functions"),
    MIGRATION_002_SECURITY,
    banner("1b. Survey events"),
    MIGRATION_003_SECURITY,
    MIGRATION_004_SECURITY,
  ];

  if (healthKit) {
    structure.push(banner("2. HealthKit samples — one table per configured data type"), healthKit.structure);
    security.push(banner("2. HealthKit samples"), healthKit.security);
  } else {
    structure.push(banner("2. HealthKit samples — skipped, this study doesn't use HealthKit"));
  }

  // Independent of the samples section above — a study can request characteristics with or
  // without any sample identifiers configured (they're separate flags on healthKit).
  if (characteristics) {
    structure.push(banner("2b. HealthKit characteristics — one-time snapshot per participant"), characteristics.structure);
    security.push(banner("2b. HealthKit characteristics"), characteristics.security);
  } else {
    structure.push(banner("2b. HealthKit characteristics — skipped, this study doesn't request them"));
  }

  if (config.media.enabled) {
    structure.push(banner("3. Media uploads"), MIGRATION_007_MEDIA_UPLOADS, MIGRATION_008_MEDIA_UPLOAD_RPC);
    security.push(banner("3. Media uploads (table and Storage bucket)"), MIGRATION_007_SECURITY, MIGRATION_008_SECURITY);
  } else {
    structure.push(banner("3. Media uploads — skipped, this study doesn't use media"));
  }

  structure.push(banner("4. Withdrawal and data deletion (applies to every study)"), MIGRATION_009_WITHDRAWAL_DELETION);
  security.push(banner("4. Withdrawal and data deletion"), MIGRATION_009_SECURITY);

  structure.push(
    banner("5. Seed this project's identity"),
    [
      "insert into public.study_backend_metadata (",
      "  singleton, backend_instance_id, stable_study_id, expected_study_code,",
      "  supported_configuration_schema_version, is_active",
      ") values (",
      "  true,",
      config.dataBackend?.backendId
        ? `  '${sqlLiteral(backendId)}',`
        : `  '${PLACEHOLDER_BACKEND_ID}', -- ⚠ REPLACE with a freshly generated UUID (e.g. \`uuidgen\`) before running this — a Backend ID hasn't been set on the dashboard's Data Backend step yet`,
      `  '${sqlLiteral(stableStudyId)}',`,
      `  '${sqlLiteral(studyCode)}',`,
      `  ${config.schemaVersion},`,
      "  true",
      ");",
    ].join("\n"),
    banner("Next: run file 2 of 2 (security) in this same project"),
  );

  security.push(
    banner("5. Next steps"),
    [
      "-- 1. Enable anonymous sign-ins for this project: Authentication > Providers.",
      config.dataBackend?.backendId
        ? "-- 2. This study's Backend ID, URL, and anon key are already saved on the dashboard's Data Backend step — nothing else to enter there."
        : "-- 2. Get this project's URL and anon key from Settings > API, then enter them — along with the Backend ID used in file 1 — into the dashboard's \"Data Backend\" wizard step, and save the study.",
      "-- 3. Use \"Test connection\" on the Data Backend step, then test enrollment from the app using this study's enrollment code before going live.",
    ].join("\n"),
  );

  if (includeHardening) {
    security.push(buildSecurityHardeningSection(config));
  }

  return { structure: structure.join("\n\n"), security: security.join("\n\n") };
}
