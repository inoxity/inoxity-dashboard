import { describe, it, expect } from "vitest";
import { checkActivationReadiness, todayUTC } from "./activation-check";
import { migrateStoredConfiguration, type StudyConfiguration } from "./study-schema";
import sleepStudyFixture from "./__fixtures__/sleep-study-sample.json";

const TODAY = "2026-10-01";

// The fixture is a known-good study running 2025-01-01 → 2035-12-31; give it a linked backend so
// it's fully ready to activate.
const ready: StudyConfiguration = {
  ...migrateStoredConfiguration(sleepStudyFixture as unknown as StudyConfiguration),
  dataBackend: {
    enabled: true,
    backendId: "8f0c7f8e-7a83-4b39-9a3f-1d2c3b4a5e6f",
    supabaseUrl: "https://example-project.supabase.co",
    supabaseAnonKey: "x".repeat(40),
    environment: "Production",
  },
};

function withSchedule(schedule: Partial<StudyConfiguration["schedule"]>): StudyConfiguration {
  return { ...ready, schedule: { ...ready.schedule, ...schedule } };
}

const messages = (issues: { message: string }[]) => issues.map((i) => i.message).join("\n");

describe("checkActivationReadiness", () => {
  it("finds nothing wrong with a complete, in-window study", () => {
    expect(checkActivationReadiness(ready, TODAY)).toEqual({ blockers: [], warnings: [] });
  });

  it("blocks an end date that has already passed, under Study Basics", () => {
    const { blockers } = checkActivationReadiness(withSchedule({ startDate: "2025-01-01", endDate: "2026-09-30" }), TODAY);
    expect(blockers).toContainEqual(expect.objectContaining({ step: "Study Basics" }));
    expect(messages(blockers)).toContain("has already passed");
  });

  it("allows a future start date, with a warning", () => {
    // The fixture starts 2025-01-01, so check it as of a day before that.
    const { blockers, warnings } = checkActivationReadiness(ready, "2024-12-01");
    expect(blockers).toEqual([]);
    expect(messages(warnings)).toContain("participants can't enroll until then");
  });

  it("blocks impossible calendar dates the app would reject", () => {
    const { blockers } = checkActivationReadiness(withSchedule({ endDate: "2035-02-31" }), TODAY);
    expect(messages(blockers)).toContain("Not a real date");
    expect(blockers[0].step).toBe("Study Basics");
  });

  it("blocks a one-time message reminder outside the study window, naming the reminder", () => {
    const config: StudyConfiguration = {
      ...ready,
      reminders: [
        ...ready.reminders,
        {
          id: "wrap-up",
          title: "Thanks for taking part",
          body: "Last day!",
          enabled: true,
          kind: "message",
          surveyID: null,
          schedule: { pattern: "oneTime", date: "2036-01-15", weekdays: [], hour: 9, minute: 0, anchor: "clockTime", offsetMinutes: null },
          notifyMinutesBefore: null,
          destination: "home",
          activeStartDate: null,
          activeEndDate: null,
        },
      ],
    };
    const { blockers } = checkActivationReadiness(config, TODAY);
    expect(blockers).toContainEqual(expect.objectContaining({ step: "Reminders" }));
    expect(messages(blockers)).toContain('Reminder "Thanks for taking part"');
    expect(messages(blockers)).toContain("after the study's own end date");
  });

  it("blocks a media category with no accepted types", () => {
    const config: StudyConfiguration = {
      ...ready,
      media: { ...ready.media, categories: ready.media.categories.map((c) => ({ ...c, acceptedTypes: [] })) },
    };
    const { blockers } = checkActivationReadiness(config, TODAY);
    expect(blockers).toContainEqual(expect.objectContaining({ step: "Features & Media" }));
    expect(messages(blockers)).toContain("Pick at least one accepted type");
  });

  it("blocks a study with no Data Backend or a non-Active status", () => {
    const { blockers } = checkActivationReadiness({ ...ready, dataBackend: null, status: { state: "paused", message: null } }, TODAY);
    expect(blockers.map((b) => b.step)).toEqual(expect.arrayContaining(["Data Backend", "Study Basics"]));
  });

  it("warns about a survey that has already stopped", () => {
    const config: StudyConfiguration = {
      ...ready,
      surveys: ready.surveys.map((s) => ({ ...s, activeEndDate: "2026-06-30" })),
    };
    const { blockers, warnings } = checkActivationReadiness(config, TODAY);
    expect(blockers).toEqual([]);
    expect(warnings).toContainEqual(expect.objectContaining({ step: "Surveys" }));
  });

  it("uses the UTC date, like the app", () => {
    expect(todayUTC(new Date("2026-10-01T23:30:00-07:00"))).toBe("2026-10-02");
  });
});
