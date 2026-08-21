import { describe, it, expect } from "vitest";
import { generateStudyBackendSQL } from "./generate-backend-sql";
import { migrateStoredConfiguration, type StudyConfiguration } from "./study-schema";
import sleepStudyFixture from "./__fixtures__/sleep-study-sample.json";

// migrateStoredConfiguration just backfills newly-added fields — the fixture is otherwise a
// known-good, current-schema study already (see study-schema.test.ts).
const config = migrateStoredConfiguration(sleepStudyFixture as unknown as StudyConfiguration);

describe("generateStudyBackendSQL", () => {
  it("includes both the REQUIRED and OPTIONAL security-hardening banners by default", () => {
    const sql = generateStudyBackendSQL(config);
    expect(sql).toContain("REQUIRED");
    expect(sql).toContain("OPTIONAL — Security hardening");
    expect(sql).toContain("Inoxity is not");
    expect(sql).toContain("responsible for the security configuration");
  });

  it("omits the hardening section when includeHardening is false", () => {
    const sql = generateStudyBackendSQL(config, { includeHardening: false });
    expect(sql).not.toContain("OPTIONAL — Security hardening");
    // The required sections are untouched either way.
    expect(sql).toContain("create table public.study_backend_metadata");
  });

  it("generates a server-side participant-ID constraint that mirrors this study's configured pattern", () => {
    const sql = generateStudyBackendSQL(config);
    expect(sql).toContain("study_enrollments_participant_identifier_shape");
    // sleep-study-sample.json's participantID.allowedPattern is "^[0-9]{1,6}$"
    expect(sql).toContain(config.participantID.allowedPattern!);
  });

  it("skips the participant-ID constraint suggestion when no pattern/length limits are configured", () => {
    const unrestricted: StudyConfiguration = {
      ...config,
      participantID: { ...config.participantID, minimumLength: 0, maximumLength: 0, allowedPattern: null },
    };
    const sql = generateStudyBackendSQL(unrestricted);
    expect(sql).toContain("nothing to mirror into a server-side constraint");
    expect(sql).not.toContain("study_enrollments_participant_identifier_shape");
  });

  it("always includes the update_participant_identifier RPC the app calls for post-enrollment corrections", () => {
    const sql = generateStudyBackendSQL(config);
    expect(sql).toContain("create or replace function public.update_participant_identifier");
    expect(sql).toContain("grant execute on function public.update_participant_identifier(text,text,text) to authenticated");
  });

  it("required sections never change based on includeHardening — only section 7 is appended/omitted", () => {
    const withHardening = generateStudyBackendSQL(config, { includeHardening: true });
    const withoutHardening = generateStudyBackendSQL(config, { includeHardening: false });
    expect(withHardening.startsWith(withoutHardening)).toBe(true);
  });

  it("omits the characteristics section when includeCharacteristics is off", () => {
    expect(config.healthKit.includeCharacteristics).toBe(false); // sanity on the fixture itself
    const sql = generateStudyBackendSQL(config);
    expect(sql).not.toContain("participant_characteristics");
    expect(sql).toContain("HealthKit characteristics — skipped");
  });

  it("includes the characteristics table and upsert RPC when includeCharacteristics is on", () => {
    const withCharacteristics: StudyConfiguration = {
      ...config,
      healthKit: { ...config.healthKit, includeCharacteristics: true },
    };
    const sql = generateStudyBackendSQL(withCharacteristics);
    expect(sql).toContain("create table public.participant_characteristics");
    expect(sql).toContain("create or replace function public.submit_participant_characteristics");
    expect(sql).toContain("on conflict(participant_id) do update set");
  });

  it("always captures a per-event IANA time zone on survey_events, backward-compatibly", () => {
    const sql = generateStudyBackendSQL(config);
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
    const sql = generateStudyBackendSQL(config);
    expect(sql).toContain("sample_time_zone text,");
    expect(sql).toContain("v_sample->>'sample_time_zone'");
    // submit_healthkit_samples' own signature is untouched — the field travels inside the
    // existing `samples jsonb` payload, not as a new top-level RPC parameter.
    expect(sql).toContain("grant execute on function public.submit_healthkit_samples(uuid,text,uuid,jsonb) to authenticated");
  });
});
