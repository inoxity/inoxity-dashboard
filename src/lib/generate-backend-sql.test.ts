import { describe, it, expect } from "vitest";
import { generateStudyBackendSQL, SECURITY_DISCLAIMER_LINES } from "./generate-backend-sql";
import { migrateStoredConfiguration, type StudyConfiguration } from "./study-schema";
import sleepStudyFixture from "./__fixtures__/sleep-study-sample.json";

// migrateStoredConfiguration just backfills newly-added fields — the fixture is otherwise a
// known-good, current-schema study already (see study-schema.test.ts).
const config = migrateStoredConfiguration(sleepStudyFixture as unknown as StudyConfiguration);

// Both files together, for checks that only care that something is generated at all.
function generateBoth(c: StudyConfiguration, options?: { includeHardening?: boolean }): string {
  const { structure, security } = generateStudyBackendSQL(c, options);
  return `${structure}\n\n${security}`;
}

// Every statement that grants or restricts access. These must all live in the security file.
const ACCESS_RULE = /^\s*(alter table [^;]* enable row level security|create policy|revoke |grant )/im;

describe("generateStudyBackendSQL — structure/security split", () => {
  const everythingOn: StudyConfiguration = {
    ...config,
    healthKit: { ...config.healthKit, enabled: true, includeCharacteristics: true },
    media: { ...config.media, enabled: true },
  };

  it("keeps every access rule out of the structure file", () => {
    for (const c of [config, everythingOn]) {
      const { structure } = generateStudyBackendSQL(c);
      expect(structure).not.toMatch(ACCESS_RULE);
    }
  });

  it("puts row level security, policies, revokes and grants in the security file", () => {
    const { security } = generateStudyBackendSQL(everythingOn);
    expect(security).toContain("alter table public.participants enable row level security;");
    expect(security).toContain("revoke all on all tables in schema public from anon, authenticated;");
    expect(security).toContain("create policy participant_owns_self");
    expect(security).toContain('create policy "Participants can upload their own files"');
    expect(security).toContain("alter table public.participant_characteristics enable row level security;");
    expect(security).toContain("grant execute on function public.register_study_enrollment(text,text,text,text,text,text,integer,integer) to authenticated;");
    expect(security).not.toContain("create table");
    expect(security).not.toContain("create or replace function");
  });

  it("labels the run order and carries the security disclaimer", () => {
    const { structure, security } = generateStudyBackendSQL(config);
    expect(structure).toContain("FILE 1 OF 2: DATABASE STRUCTURE");
    expect(structure).toContain("Then run FILE 2 OF 2");
    expect(security).toContain("FILE 2 OF 2: SECURITY");
    expect(security).toContain("Run this AFTER file 1");
    for (const line of SECURITY_DISCLAIMER_LINES) {
      expect(security).toContain(`-- ${line}`);
    }
    expect(security).toContain("does not provide or take responsibility for the security");
  });

  it("seeds the normalized (trimmed, uppercase) enrollment code and study ID, whatever was typed", () => {
    const typed: StudyConfiguration = { ...config, identity: { ...config.identity, code: "  sleep01 ", id: " sleep-cognition-v2 " } };
    const { structure } = generateStudyBackendSQL(typed);
    expect(structure).toContain("  'SLEEP01',");
    expect(structure).toContain("  'sleep-cognition-v2',");
    expect(structure).not.toContain("'  sleep01 '");
  });
});

describe("generateStudyBackendSQL", () => {
  it("ends the security file with the optional hardening suggestions by default", () => {
    const { security } = generateStudyBackendSQL(config);
    expect(security).toContain("OPTIONAL — Extra security hardening suggestions");
    expect(security).toContain("Inoxity is not responsible for your project's");
  });

  it("omits the hardening section when includeHardening is false", () => {
    const { structure, security } = generateStudyBackendSQL(config, { includeHardening: false });
    expect(security).not.toContain("OPTIONAL — Extra security hardening");
    // The required sections are untouched either way.
    expect(structure).toContain("create table public.study_backend_metadata");
  });

  it("generates a server-side participant-ID constraint that mirrors this study's configured pattern", () => {
    const sql = generateBoth(config);
    expect(sql).toContain("study_enrollments_participant_identifier_shape");
    // sleep-study-sample.json's participantID.allowedPattern is "^[0-9]{1,6}$"
    expect(sql).toContain(config.participantID.allowedPattern!);
  });

  it("skips the participant-ID constraint suggestion when no pattern/length limits are configured", () => {
    const unrestricted: StudyConfiguration = {
      ...config,
      participantID: { ...config.participantID, minimumLength: 0, maximumLength: 0, allowedPattern: null },
    };
    const sql = generateBoth(unrestricted);
    expect(sql).toContain("nothing to mirror into a server-side constraint");
    expect(sql).not.toContain("study_enrollments_participant_identifier_shape");
  });

  it("always includes the update_participant_identifier RPC the app calls for post-enrollment corrections", () => {
    const sql = generateBoth(config);
    expect(sql).toContain("create or replace function public.update_participant_identifier");
    expect(sql).toContain("grant execute on function public.update_participant_identifier(text,text,text) to authenticated");
  });

  it("required sections never change based on includeHardening — only the security file's tail is appended/omitted", () => {
    const withHardening = generateStudyBackendSQL(config, { includeHardening: true });
    const withoutHardening = generateStudyBackendSQL(config, { includeHardening: false });
    expect(withHardening.structure).toBe(withoutHardening.structure);
    expect(withHardening.security.startsWith(withoutHardening.security)).toBe(true);
  });

  it("omits the characteristics section when includeCharacteristics is off", () => {
    expect(config.healthKit.includeCharacteristics).toBe(false); // sanity on the fixture itself
    const sql = generateBoth(config);
    expect(sql).not.toContain("participant_characteristics");
    expect(sql).toContain("HealthKit characteristics — skipped");
  });

  it("includes the characteristics table and upsert RPC when includeCharacteristics is on", () => {
    const withCharacteristics: StudyConfiguration = {
      ...config,
      healthKit: { ...config.healthKit, includeCharacteristics: true },
    };
    const sql = generateBoth(withCharacteristics);
    expect(sql).toContain("create table public.participant_characteristics");
    expect(sql).toContain("create or replace function public.submit_participant_characteristics");
    expect(sql).toContain("on conflict(participant_id) do update set");
  });

  it("always captures a per-event IANA time zone on survey_events, backward-compatibly", () => {
    const sql = generateBoth(config);
    expect(sql).toContain("event_time_zone text,");
    expect(sql).toContain("p_event_time_zone text default null");
    expect(sql).toContain(
      "grant execute on function public.submit_survey_event(text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text) to authenticated",
    );
  });

  it("always captures a per-sample IANA time zone on every generated HealthKit table, backward-compatibly", () => {
    // sleep-study-sample.json's healthKit.identifiers includes at least sleepAnalysis.
    expect(config.healthKit.enabled).toBe(true);
    expect(config.healthKit.identifiers.length).toBeGreaterThan(0);
    const sql = generateBoth(config);
    expect(sql).toContain("sample_time_zone text,");
    expect(sql).toContain("v_sample->>'sample_time_zone'");
    // submit_healthkit_samples' own signature is untouched — the field travels inside the
    // existing `samples jsonb` payload, not as a new top-level RPC parameter.
    expect(sql).toContain("grant execute on function public.submit_healthkit_samples(uuid,text,uuid,jsonb) to authenticated");
  });

  it("treats a HealthKit re-send under a newer configuration revision as idempotent, not a conflict", () => {
    const sql = generateBoth(config);
    expect(sql).toContain("then raise exception 'conflicting duplicate identity'");
    // A config republish makes the app re-send already-uploaded samples under the new revision.
    expect(sql).not.toContain("v_existing.configuration_revision <> (v_sample->>'configuration_revision')");
    expect(sql).not.toContain("v_existing.configuration_schema_version <> (v_sample->>'configuration_schema_version')");
  });
});
