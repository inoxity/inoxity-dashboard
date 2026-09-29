// What a survey tool needs in order to report completion back to the Inoxity app. The app adds
// these four query parameters to every survey link it opens; the names must match
// `SurveyURLBuilder` in the app repo (Inoxity/Surveys/SurveyURLBuilder.swift). At the end of the
// survey, the tool redirects to the value of `inoxity_callback_url`, which reopens the app and
// marks that occurrence completed.

export const CALLBACK_URL_FIELD = "inoxity_callback_url";

/** Qualtrics Embedded Data fields to declare at the top of the survey flow, in this order. */
export const COMPLETION_EMBEDDED_DATA_FIELDS = [
  CALLBACK_URL_FIELD,
  "inoxity_occurrence_id",
  "inoxity_survey_id",
  "inoxity_study_id",
] as const;

/** The Qualtrics end-of-survey "Redirect to a URL" value. */
export const QUALTRICS_REDIRECT_VALUE = `\${e://Field/${CALLBACK_URL_FIELD}}`;

/** Where the test link redirects instead of the app, so the redirect is visible in any browser. */
export const TEST_REDIRECT_URL = "https://example.com/survey-done";

/**
 * The survey link with placeholder values for the four fields, and a normal web page in place of
 * the app's return link. Opening it and finishing the survey should land on `TEST_REDIRECT_URL`,
 * and the response in the survey tool should show `test-occurrence-1`. Returns null when `surveyURL`
 * isn't a valid HTTPS URL yet.
 */
export function buildCompletionTestLink(surveyURL: string | null | undefined): string | null {
  let url: URL;
  try {
    url = new URL((surveyURL ?? "").trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  url.searchParams.set("inoxity_study_id", "test-study");
  url.searchParams.set("inoxity_survey_id", "test-survey");
  url.searchParams.set("inoxity_occurrence_id", "test-occurrence-1");
  url.searchParams.set(CALLBACK_URL_FIELD, TEST_REDIRECT_URL);
  return url.toString();
}
