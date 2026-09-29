import { describe, it, expect } from "vitest";
import {
  buildCompletionTestLink,
  COMPLETION_EMBEDDED_DATA_FIELDS,
  QUALTRICS_REDIRECT_VALUE,
  TEST_REDIRECT_URL,
} from "./survey-completion-setup";

describe("buildCompletionTestLink", () => {
  it("adds the four Inoxity fields, with a visible web page in place of the app's return link", () => {
    const link = buildCompletionTestLink("https://ucdavis.co1.qualtrics.com/jfe/form/SV_3lyi79274NwvyqW");
    expect(link).not.toBeNull();
    const params = new URL(link!).searchParams;
    expect(params.get("inoxity_study_id")).toBe("test-study");
    expect(params.get("inoxity_survey_id")).toBe("test-survey");
    expect(params.get("inoxity_occurrence_id")).toBe("test-occurrence-1");
    expect(params.get("inoxity_callback_url")).toBe(TEST_REDIRECT_URL);
  });

  it("keeps the survey's own query parameters", () => {
    const link = buildCompletionTestLink("https://example.qualtrics.com/jfe/form/SV_x?Q_Language=EN");
    expect(new URL(link!).searchParams.get("Q_Language")).toBe("EN");
  });

  it("returns null until a valid HTTPS survey URL is entered", () => {
    expect(buildCompletionTestLink("")).toBeNull();
    expect(buildCompletionTestLink(null)).toBeNull();
    expect(buildCompletionTestLink("not a url")).toBeNull();
    expect(buildCompletionTestLink("http://example.com/survey")).toBeNull();
  });
});

describe("Qualtrics setup values", () => {
  it("match the parameter names the app adds to survey links", () => {
    expect(COMPLETION_EMBEDDED_DATA_FIELDS).toEqual([
      "inoxity_callback_url",
      "inoxity_occurrence_id",
      "inoxity_survey_id",
      "inoxity_study_id",
    ]);
    expect(QUALTRICS_REDIRECT_VALUE).toBe("${e://Field/inoxity_callback_url}");
  });
});
