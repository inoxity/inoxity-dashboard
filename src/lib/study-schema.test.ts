import { describe, it, expect } from "vitest";
import {
  studyConfigurationSchema,
  migrateStoredConfiguration,
  HEALTHKIT_IDENTIFIERS,
  HEALTHKIT_CATEGORIES,
  type StudyConfiguration,
} from "./study-schema";
import sleepStudyFixture from "./__fixtures__/sleep-study-sample.json";

describe("HEALTHKIT_CATEGORIES", () => {
  it("covers every HEALTHKIT_IDENTIFIERS entry exactly once", () => {
    const grouped = HEALTHKIT_CATEGORIES.flatMap((group) => group.identifiers);
    expect(new Set(grouped).size).toBe(grouped.length); // no identifier listed twice
    expect([...grouped].sort()).toEqual([...HEALTHKIT_IDENTIFIERS].sort());
  });
});

// sleep-study-sample.json is a literal copy of the iOS app's
// Inoxity/Configuration/Resources/SleepStudy.json — a known-good real study.
// If this stops parsing, the Zod schema has drifted from what the app
// actually accepts.
describe("studyConfigurationSchema", () => {
  it("accepts a known-good real study", () => {
    const result = studyConfigurationSchema.safeParse(sleepStudyFixture);
    if (!result.success) {
      console.error(result.error.issues);
    }
    expect(result.success).toBe(true);
  });

  it("rejects a non-HTTPS survey URL", () => {
    const broken = structuredClone(sleepStudyFixture) as Record<string, unknown>;
    (broken.surveys as Array<Record<string, unknown>>)[0].url = "http://example.edu/insecure";
    const result = studyConfigurationSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "surveys.0.url")).toBe(true);
    }
  });

  it("rejects an unsupported HealthKit identifier", () => {
    const broken = structuredClone(sleepStudyFixture) as Record<string, unknown>;
    // Not "bodyTemperature" — that became a real, supported identifier as part of the 10→117
    // HealthKit expansion, so it no longer demonstrates this rejection. Any string outside
    // HEALTHKIT_IDENTIFIERS works here.
    (broken.healthKit as Record<string, unknown>).identifiers = ["notARealHealthKitIdentifier"];
    const result = studyConfigurationSchema.safeParse(broken);
    expect(result.success).toBe(false);
  });

  it("rejects duplicate survey IDs", () => {
    const broken = structuredClone(sleepStudyFixture) as Record<string, unknown>;
    const surveys = broken.surveys as Array<Record<string, unknown>>;
    surveys.push(structuredClone(surveys[0]));
    const result = studyConfigurationSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("Duplicate ID"))).toBe(true);
    }
  });

  it("rejects a survey reminder pointing at a disabled survey", () => {
    const broken = structuredClone(sleepStudyFixture) as Record<string, unknown>;
    (broken.surveys as Array<Record<string, unknown>>)[0].enabled = false;
    const result = studyConfigurationSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "reminders.0.surveyID")).toBe(true);
    }
  });

  it("rejects a daily schedule pattern with non-empty weekdays", () => {
    const broken = structuredClone(sleepStudyFixture) as Record<string, unknown>;
    const survey = (broken.surveys as Array<Record<string, unknown>>)[0];
    (survey.schedule as Record<string, unknown>).weekdays = [1, 2];
    const result = studyConfigurationSchema.safeParse(broken);
    expect(result.success).toBe(false);
  });

  it("rejects a non-open-ended schedule missing an end date", () => {
    const broken = structuredClone(sleepStudyFixture) as Record<string, unknown>;
    (broken.schedule as Record<string, unknown>).endDate = null;
    const result = studyConfigurationSchema.safeParse(broken);
    expect(result.success).toBe(false);
  });
});

// Regression coverage for the toggle-data-loss bug: a Data Backend/Sleep Schedule switch used to
// null out the ENTIRE field on toggle-off, so re-enabling before saving (or saving while off)
// silently discarded previously-entered credentials/labels. The fix moves `enabled` onto the
// object itself as the only thing the switch touches — these tests assert the schema actually
// tolerates (and requires) that shape, i.e. that a populated-but-disabled object is valid and
// round-trips its values unchanged, which is what makes the non-destructive toggle possible.
describe("dataBackend non-destructive toggle", () => {
  const populatedBackend = {
    enabled: true,
    backendId: "123e4567-e89b-12d3-a456-426614174000",
    supabaseUrl: "https://example-study.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    environment: "Production" as const,
  };

  it("accepts a fully-populated, enabled backend", () => {
    const config = { ...structuredClone(sleepStudyFixture), dataBackend: populatedBackend } as unknown;
    expect(studyConfigurationSchema.safeParse(config).success).toBe(true);
  });

  it("accepts the same credentials with enabled:false — toggling off must not require clearing them", () => {
    const config = {
      ...structuredClone(sleepStudyFixture),
      dataBackend: { ...populatedBackend, enabled: false },
    } as unknown;
    const result = studyConfigurationSchema.safeParse(config);
    if (!result.success) console.error(result.error.issues);
    expect(result.success).toBe(true);
    if (!result.success) return;
    // The exact regression: values survive being saved while disabled, unchanged.
    expect(result.data.dataBackend?.backendId).toBe(populatedBackend.backendId);
    expect(result.data.dataBackend?.supabaseUrl).toBe(populatedBackend.supabaseUrl);
    expect(result.data.dataBackend?.supabaseAnonKey).toBe(populatedBackend.supabaseAnonKey);
  });

  it("rejects enabled:true with a blank/invalid backendId, url, or anon key", () => {
    const config = {
      ...structuredClone(sleepStudyFixture),
      dataBackend: { enabled: true, backendId: "", supabaseUrl: "", supabaseAnonKey: "", environment: "Production" },
    } as unknown;
    const result = studyConfigurationSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("dataBackend.backendId");
      expect(paths).toContain("dataBackend.supabaseUrl");
      expect(paths).toContain("dataBackend.supabaseAnonKey");
    }
  });

  it("accepts enabled:false with entirely blank credentials — a never-configured-but-touched draft", () => {
    const config = {
      ...structuredClone(sleepStudyFixture),
      dataBackend: { enabled: false, backendId: "", supabaseUrl: "", supabaseAnonKey: "", environment: "Production" },
    } as unknown;
    expect(studyConfigurationSchema.safeParse(config).success).toBe(true);
  });

  it("migrateStoredConfiguration backfills enabled:true onto a pre-migration populated object", () => {
    const legacyBackend = {
      backendId: populatedBackend.backendId,
      supabaseUrl: populatedBackend.supabaseUrl,
      supabaseAnonKey: populatedBackend.supabaseAnonKey,
      environment: "Production",
      // no `enabled` key at all — the pre-fix shape, where presence alone meant "on"
    };
    const stored = { ...structuredClone(sleepStudyFixture), dataBackend: legacyBackend } as unknown as StudyConfiguration;
    const migrated = migrateStoredConfiguration(stored);
    expect(migrated.dataBackend?.enabled).toBe(true);
    expect(migrated.dataBackend?.backendId).toBe(populatedBackend.backendId);
  });

  it("migrateStoredConfiguration leaves a never-configured (null) backend as null", () => {
    const stored = { ...structuredClone(sleepStudyFixture), dataBackend: null } as unknown as StudyConfiguration;
    expect(migrateStoredConfiguration(stored).dataBackend).toBeNull();
  });
});

describe("sleepSchedule non-destructive toggle", () => {
  const populatedSleep = {
    enabled: true,
    promptTitle: "Set your sleep schedule",
    wakeLabel: "What time do you usually wake up?",
    bedLabel: "What time do you usually go to bed?",
  };

  it("accepts the same labels with enabled:false — toggling off must not require clearing them", () => {
    const config = {
      ...structuredClone(sleepStudyFixture),
      sleepSchedule: { ...populatedSleep, enabled: false },
    } as unknown;
    const result = studyConfigurationSchema.safeParse(config);
    if (!result.success) console.error(result.error.issues);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.sleepSchedule?.promptTitle).toBe(populatedSleep.promptTitle);
  });

  it("rejects enabled:true with blank labels", () => {
    const config = {
      ...structuredClone(sleepStudyFixture),
      sleepSchedule: { enabled: true, promptTitle: "", wakeLabel: "", bedLabel: "" },
    } as unknown;
    const result = studyConfigurationSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});

describe("schedule.startDateMode", () => {
  it("accepts the default 'enrollment' mode without a startDate on an open-ended study", () => {
    const config = structuredClone(sleepStudyFixture) as Record<string, unknown>;
    (config.schedule as Record<string, unknown>) = {
      ...(config.schedule as Record<string, unknown>),
      openEnded: true,
      startDate: null,
      endDate: null,
      startDateMode: "enrollment",
    };
    expect(studyConfigurationSchema.safeParse(config).success).toBe(true);
  });

  it("rejects 'fixed' mode without a startDate, even on an open-ended study", () => {
    const config = structuredClone(sleepStudyFixture) as Record<string, unknown>;
    (config.schedule as Record<string, unknown>) = {
      ...(config.schedule as Record<string, unknown>),
      openEnded: true,
      startDate: null,
      endDate: null,
      startDateMode: "fixed",
    };
    const result = studyConfigurationSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "schedule.startDate")).toBe(true);
    }
  });

  it("accepts 'fixed' mode with a startDate on an open-ended study", () => {
    const config = structuredClone(sleepStudyFixture) as Record<string, unknown>;
    (config.schedule as Record<string, unknown>) = {
      ...(config.schedule as Record<string, unknown>),
      openEnded: true,
      // On or before the fixture's own survey/media activeStartDate (2025-01-01) — a later date
      // would separately fail their "can't start before the study's own start date" checks,
      // which isn't what this test is about.
      startDate: "2020-01-01",
      endDate: null,
      startDateMode: "fixed",
    };
    const result = studyConfigurationSchema.safeParse(config);
    if (!result.success) console.error(result.error.issues);
    expect(result.success).toBe(true);
  });

  it("accepts 'participantSelected' mode without a startDate", () => {
    const config = structuredClone(sleepStudyFixture) as Record<string, unknown>;
    (config.schedule as Record<string, unknown>) = {
      ...(config.schedule as Record<string, unknown>),
      openEnded: true,
      startDate: null,
      endDate: null,
      startDateMode: "participantSelected",
    };
    expect(studyConfigurationSchema.safeParse(config).success).toBe(true);
  });

  it("migrateStoredConfiguration backfills startDateMode to 'enrollment' when absent", () => {
    const config = structuredClone(sleepStudyFixture) as Record<string, unknown>;
    const schedule = { ...(config.schedule as Record<string, unknown>) };
    delete schedule.startDateMode;
    config.schedule = schedule;
    const migrated = migrateStoredConfiguration(config as unknown as StudyConfiguration);
    expect(migrated.schedule.startDateMode).toBe("enrollment");
  });
});

describe("randomWindow EMA scheduling", () => {
  const randomWindowSchedule = {
    pattern: "randomWindow" as const,
    date: null,
    weekdays: [],
    hour: 0,
    minute: 0,
    anchor: "clockTime" as const,
    offsetMinutes: null,
    windowCount: 3,
    windowStartHour: 8,
    windowLengthHours: 4,
  };

  function withReminderSchedule(schedule: unknown, extra: Record<string, unknown> = {}) {
    const config = structuredClone(sleepStudyFixture) as Record<string, unknown>;
    config.reminders = [
      {
        id: "ema-prompt",
        title: "Quick check-in",
        body: "Tap to answer a few questions.",
        enabled: true,
        kind: "message",
        surveyID: null,
        schedule,
        notifyMinutesBefore: null,
        destination: "home",
        activeStartDate: null,
        activeEndDate: null,
        ...extra,
      },
    ];
    return config;
  }

  it("accepts a valid randomWindow schedule", () => {
    const config = withReminderSchedule(randomWindowSchedule);
    const result = studyConfigurationSchema.safeParse(config);
    if (!result.success) console.error(result.error.issues);
    expect(result.success).toBe(true);
  });

  it("rejects windowCount × windowLengthHours exceeding 24", () => {
    const config = withReminderSchedule({ ...randomWindowSchedule, windowCount: 10, windowLengthHours: 6 });
    const result = studyConfigurationSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "reminders.0.schedule.windowLengthHours")).toBe(
        true,
      );
    }
  });

  it("rejects a randomWindow schedule missing window fields", () => {
    const { windowCount: _windowCount, ...withoutWindowCount } = randomWindowSchedule;
    const config = withReminderSchedule(withoutWindowCount);
    const result = studyConfigurationSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("accepts and preserves promptExpirationMinutes on a survey", () => {
    const config = structuredClone(sleepStudyFixture) as Record<string, unknown>;
    const surveys = config.surveys as Record<string, unknown>[];
    surveys[0] = { ...surveys[0], promptExpirationMinutes: 30 };
    const result = studyConfigurationSchema.safeParse(config);
    if (!result.success) console.error(result.error.issues);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.surveys[0].promptExpirationMinutes).toBe(30);
  });

  it("accepts a randomWindow schedule on a survey's own schedule", () => {
    const config = structuredClone(sleepStudyFixture) as Record<string, unknown>;
    const surveys = config.surveys as Record<string, unknown>[];
    surveys[0] = { ...surveys[0], schedule: randomWindowSchedule };
    const result = studyConfigurationSchema.safeParse(config);
    if (!result.success) console.error(result.error.issues);
    expect(result.success).toBe(true);
  });

  it("rejects a survey's randomWindow schedule with windowCount × windowLengthHours over 24", () => {
    const config = structuredClone(sleepStudyFixture) as Record<string, unknown>;
    const surveys = config.surveys as Record<string, unknown>[];
    surveys[0] = { ...surveys[0], schedule: { ...randomWindowSchedule, windowCount: 10, windowLengthHours: 6 } };
    const result = studyConfigurationSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "surveys.0.schedule.windowLengthHours")).toBe(
        true,
      );
    }
  });

  it("migrateStoredConfiguration backfills promptExpirationMinutes to null when absent", () => {
    const config = structuredClone(sleepStudyFixture) as Record<string, unknown>;
    const surveys = config.surveys as Record<string, unknown>[];
    const survey = { ...surveys[0] } as Record<string, unknown>;
    delete survey.promptExpirationMinutes;
    config.surveys = [survey, ...surveys.slice(1)];
    const migrated = migrateStoredConfiguration(config as unknown as StudyConfiguration);
    expect(migrated.surveys[0].promptExpirationMinutes).toBeNull();
  });
});
