// Writes the Read the Docs site's code blocks from the dashboard's own source, so they change
// when the code does instead of being hand-copied. Read the Docs runs this before every build
// (see .readthedocs.yaml); run it yourself before `mkdocs serve`:
//
//   npx vite-node scripts/generate-docs-snippets.ts
//
// Output goes to docs/snippets/generated/ (gitignored) and is pulled into pages with
// pymdownx.snippets (`--8<-- "generated/…"`). Anything the docs depend on that has disappeared
// from the code (a config key, a table, a column, a function) throws here, so the docs build
// fails loudly rather than publishing something stale.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import fixture from "../src/lib/__fixtures__/sleep-study-sample.json";
import { HEALTHKIT_TABLE_SPECS, generateStudyBackendSQL } from "../src/lib/generate-backend-sql";
import {
  HEALTHKIT_CATEGORIES,
  HEALTHKIT_IDENTIFIERS,
  HEALTHKIT_LABELS,
  SCHEMA_VERSION,
  reminderScheduleSchema,
  studyConfigurationSchema,
  type StudyConfiguration,
} from "../src/lib/study-schema";
import {
  COMPLETION_EMBEDDED_DATA_FIELDS,
  QUALTRICS_REDIRECT_VALUE,
  buildCompletionTestLink,
} from "../src/lib/survey-completion-setup";

const OUT = join(__dirname, "..", "docs", "snippets", "generated");
rmSync(OUT, { recursive: true, force: true });

function write(path: string, content: string) {
  const file = join(OUT, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content.endsWith("\n") ? content : `${content}\n`);
}

function fence(lang: string, code: string, attrs = ""): string {
  return `\`\`\`${lang}${attrs ? ` ${attrs}` : ""}\n${code.trimEnd()}\n\`\`\`\n`;
}

// ---------------------------------------------------------------------------------------------
// Example study configuration
// ---------------------------------------------------------------------------------------------

// The sample sleep study the tests already validate, with the prototype-era wording and the
// empty Study Backend replaced by values a researcher would actually see. Parsed with the real
// schema, so an example that no longer matches the format fails here.
const example: StudyConfiguration = studyConfigurationSchema.parse({
  ...fixture,
  schemaVersion: SCHEMA_VERSION,
  onboarding: {
    pages: [
      { ...fixture.onboarding.pages[0], body: "Daily check-ins and Apple Health data help the team study sleep patterns over time." },
      { ...fixture.onboarding.pages[1], body: "You choose what to share, and you can withdraw at any time from Settings." },
    ],
  },
  healthKit: {
    ...fixture.healthKit,
    rationale: "With your permission, this study reads sleep analysis and resting heart rate from Apple Health.",
  },
  media: {
    ...fixture.media,
    instructions: "When asked, share a photo of your sleep environment.",
    privacyText: "Photos are uploaded only to the study team's own database.",
  },
  dataBackend: {
    enabled: true,
    backendId: "2f6c1d3e-8a4b-4c7d-9e0f-1a2b3c4d5e6f",
    supabaseUrl: "https://your-project-ref.supabase.co",
    supabaseAnonKey: "your-projects-anon-or-publishable-key",
    environment: "Production",
  },
});

// Keys that get a numbered (1) annotation in the docs, in order. The page lists the matching
// explanations right after each block, so keep the order in sync with the page text.
const CONFIG_SECTIONS: { name: string; value: unknown; annotate: string[] }[] = [
  { name: "identity", value: example.identity, annotate: ["id", "code"] },
  { name: "schedule", value: example.schedule, annotate: ["timeZone", "participantDurationDays", "startDateMode"] },
  { name: "participantID", value: example.participantID, annotate: ["label", "allowedPattern"] },
  { name: "healthKit", value: example.healthKit, annotate: ["identifiers", "backfillDays"] },
  { name: "surveys", value: [example.surveys[0]], annotate: ["url", "schedule", "availabilityWindow", "completionCallback"] },
  { name: "reminders", value: example.reminders, annotate: ["kind", "surveyID", "notifyMinutesBefore"] },
  { name: "media", value: example.media, annotate: ["acceptedTypes", "maximumFileSizeMB"] },
  { name: "completion", value: example.completion, annotate: ["redirectURL", "appAccessRemainsAvailable"] },
  { name: "dataBackend", value: example.dataBackend, annotate: ["backendId", "supabaseAnonKey"] },
];

function annotatedJSON(name: string, value: unknown, annotate: string[]): string {
  const lines = JSON.stringify({ [name]: value }, null, 2).split("\n");
  annotate.forEach((key, i) => {
    const index = lines.findIndex((line) => line.trimStart().startsWith(`"${key}":`));
    if (index === -1) throw new Error(`Config example "${name}" has no "${key}" key to annotate`);
    lines[index] += ` // (${i + 1})!`;
  });
  return lines.join("\n");
}

for (const section of CONFIG_SECTIONS) {
  write(`config/${section.name}.md`, fence("json", annotatedJSON(section.name, section.value, section.annotate)));
}
write("config/full.md", fence("json", JSON.stringify(example, null, 2)));

// One example per schedule pattern, each checked against the real schedule schema.
const SCHEDULE_EXAMPLES: { tab: string; schedule: unknown }[] = [
  { tab: "One time", schedule: { pattern: "oneTime", date: "2026-03-02", weekdays: [], hour: 10, minute: 0, anchor: "clockTime", offsetMinutes: null } },
  { tab: "Daily", schedule: { pattern: "daily", date: null, weekdays: [], hour: 9, minute: 0, anchor: "clockTime", offsetMinutes: null } },
  { tab: "Selected weekdays", schedule: { pattern: "selectedWeekdays", date: null, weekdays: [2, 4, 6], hour: 18, minute: 30, anchor: "clockTime", offsetMinutes: null } },
  {
    tab: "Random window",
    schedule: { pattern: "randomWindow", date: null, weekdays: [], hour: 0, minute: 0, anchor: "clockTime", offsetMinutes: null, windowCount: 4, windowStartHour: 9, windowLengthHours: 3 },
  },
  { tab: "After waking", schedule: { pattern: "daily", date: null, weekdays: [], hour: 0, minute: 0, anchor: "wakeTime", offsetMinutes: 30 } },
];
write(
  "config/schedule-patterns.md",
  SCHEDULE_EXAMPLES.map(({ tab, schedule }) => {
    const parsed = reminderScheduleSchema.parse(schedule);
    return `=== "${tab}"\n\n${fence("json", JSON.stringify({ schedule: parsed }, null, 2))
      .split("\n")
      .map((line) => (line ? `    ${line}` : line))
      .join("\n")}`;
  }).join("\n"),
);

// ---------------------------------------------------------------------------------------------
// Study Backend tables
// ---------------------------------------------------------------------------------------------

// Every feature on and every HealthKit type selected, so every table the dashboard can generate
// is present to describe.
const allFeatures: StudyConfiguration = {
  ...example,
  healthKit: { ...example.healthKit, enabled: true, identifiers: [...HEALTHKIT_IDENTIFIERS], includeCharacteristics: true },
  media: { ...example.media, enabled: true },
};
const sql = generateStudyBackendSQL(allFeatures, { includeHardening: false });

function createTableSQL(table: string): string {
  const start = sql.structure.search(new RegExp(`create table (if not exists )?public\\.${table} \\(`));
  if (start === -1) throw new Error(`The generated Study Backend SQL no longer creates public.${table}`);
  let depth = 0;
  for (let i = sql.structure.indexOf("(", start); i < sql.structure.length; i++) {
    if (sql.structure[i] === "(") depth++;
    if (sql.structure[i] === ")" && --depth === 0) return `${sql.structure.slice(start, i + 1)};`;
  }
  throw new Error(`Unbalanced create table for public.${table}`);
}

// Splits on commas that aren't inside parentheses or quotes.
function splitTopLevel(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quoted = false;
  let current = "";
  for (const ch of body) {
    if (ch === "'") quoted = !quoted;
    if (!quoted && ch === "(") depth++;
    if (!quoted && ch === ")") depth--;
    if (!quoted && depth === 0 && ch === ",") {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts;
}

interface Column {
  name: string;
  type: string;
  required: boolean;
}

function columns(table: string): Column[] {
  const statement = createTableSQL(table);
  const body = statement
    .slice(statement.indexOf("(") + 1, statement.lastIndexOf(")"))
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  // Later migrations in the same script can relax a column after the table is created.
  const relaxed = new Set(
    [...sql.structure.matchAll(new RegExp(`alter table public\\.${table} alter column (\\w+) drop not null`, "g"))].map((m) => m[1]),
  );
  return splitTopLevel(body)
    .map((part) => part.trim().replace(/\s+/g, " "))
    .filter((part) => part && !/^(unique|check|primary key|foreign key|constraint)\b/.test(part))
    .map((part) => {
      const [name, ...rest] = part.split(" ");
      const type = rest[0] === "double" ? "double precision" : rest[0];
      const required = /\bnot null\b|\bprimary key\b/.test(part) && !relaxed.has(name);
      return { name, type, required };
    });
}

// What each column holds, in researcher terms. A column the code adds without an entry here
// fails the build, so new data never shows up undocumented.
const COMMON: Record<string, string> = {
  id: "Row ID, generated by the database.",
  participant_id: "The participant (`participants.id`).",
  enrollment_id: "The participant's enrollment (`study_enrollments.id`).",
  stable_study_id: "The study's stable ID from the dashboard.",
  configuration_schema_version: "Configuration format version the app was running.",
  configuration_revision: "Which saved revision of the study configuration the app was running.",
  received_at: "When the Study Backend received the row (UTC).",
  created_at: "When the row was created (UTC).",
};
const COLUMN_DESCRIPTIONS: Record<string, Record<string, string>> = {
  study_backend_metadata: {
    singleton: "Always `true`; keeps this table to exactly one row.",
    backend_instance_id: "This backend's UUID. Must equal the Backend ID entered in the dashboard.",
    stable_study_id: "The study's stable ID. Must match the dashboard.",
    expected_study_code: "The enrollment code, in uppercase. Must match the dashboard.",
    supported_configuration_schema_version: "The configuration version this backend supports.",
    is_active: "Whether the backend accepts enrollments and data.",
    updated_at: "When the row was last changed (UTC).",
  },
  participants: {
    auth_user_id: "The participant's anonymous Supabase sign-in ID.",
    wake_time: "Usual wake time (`HH:mm`), if the study collects it.",
    bed_time: "Usual bed time (`HH:mm`), if the study collects it.",
  },
  study_enrollments: {
    participant_identifier: "The ID the participant entered (for example a SONA ID), in your study's format.",
    enrollment_attempt_id: "Unique ID for the enrollment attempt; makes retries safe.",
    installation_id: "ID of the app installation that enrolled.",
    status: "`active` or `withdrawn`.",
    enrolled_at: "When the participant enrolled (UTC).",
  },
  withdrawal_requests: {
    client_event_id: "Unique ID the app gives the request; makes retries safe.",
    participant_id: "The participant. Cleared if they asked for their data to be deleted.",
    enrollment_id: "The enrollment. Cleared if they asked for their data to be deleted.",
    withdrawal_choice: "`keepExistingData` or `deleteExistingData`.",
    requested_at: "When the participant withdrew (UTC).",
    processed_at: "When a deletion request was carried out.",
  },
  survey_events: {
    client_event_id: "Unique ID the app gives the event; makes retries safe.",
    survey_id: "The survey's ID from the dashboard.",
    occurrence_id: "This specific scheduled survey. Matches `inoxity_occurrence_id` in your survey tool.",
    event_type: "`opened` or `completed`.",
    event_timestamp: "When it happened (UTC).",
    scheduled_for: "When this occurrence was scheduled (UTC).",
    opened_at: "When the survey was opened (UTC).",
    completed_at: "When the survey was completed (UTC); empty for `opened` events.",
    event_time_zone: "The phone's time zone, e.g. `America/Los_Angeles`. Use it to get local time.",
    event_source: "How the app recorded it: `presentation`, `completionCallback` or `restoration`.",
    app_version: "The Inoxity app version.",
  },
  heart_rate_samples: {
    client_sample_id: "Unique ID the app gives the sample; makes retries safe.",
    sample_uuid: "Apple Health's ID for the sample.",
    sample_start: "Start of the measurement (UTC).",
    sample_end: "End of the measurement (UTC).",
    sample_time_zone: "The phone's time zone when the sample was recorded.",
    bpm: "The value: beats per minute. Each data type has its own value column (see Supported Apple Health data).",
  },
  media_uploads: {
    storage_path: "Where the file is in the `user-uploads` Storage bucket.",
    mime_type: "File type, e.g. `image/jpeg`.",
    bytes: "File size in bytes.",
    category_id: "The media category's ID from the dashboard.",
    duration_seconds: "Video length, if it's a video.",
    represented_date: "The study date the participant chose for the item, if any.",
  },
  participant_characteristics: {
    participant_id: "The participant (`participants.id`). One row per participant.",
    biological_sex: "From Apple Health, if shared.",
    blood_type: "From Apple Health, if shared.",
    fitzpatrick_skin_type: "From Apple Health, if shared.",
    date_of_birth: "From Apple Health, if shared.",
    uses_wheelchair: "From Apple Health, if shared.",
    updated_at: "When the app last sent these values (UTC).",
  },
};

const tableColumns: Record<string, Column[]> = {};
for (const [table, descriptions] of Object.entries(COLUMN_DESCRIPTIONS)) {
  const cols = columns(table);
  tableColumns[table] = cols;
  const rows = cols.map((col) => {
    const description = descriptions[col.name] ?? COMMON[col.name];
    if (!description) throw new Error(`public.${table}.${col.name} has no description in generate-docs-snippets.ts`);
    return `| \`${col.name}\` | ${col.type} | ${col.required ? "Yes" : ""} | ${description} |`;
  });
  write(`tables/${table}.md`, ["| Column | Type | Always set | What it holds |", "|---|---|---|---|", ...rows].join("\n"));
  write(`sql/${table}.md`, fence("sql", createTableSQL(table)));
}

// The real survey-event function, with the lines the security page talks about highlighted.
const fnStart = sql.structure.indexOf("create or replace function public.submit_survey_event(");
const fnEnd = sql.structure.indexOf("end $$;", fnStart);
if (fnStart === -1 || fnEnd === -1) throw new Error("submit_survey_event is missing from the generated SQL");
const permissionLines = sql.security.split("\n").filter((line) => line.includes("function public.submit_survey_event("));
if (permissionLines.length === 0) throw new Error("submit_survey_event has no revoke/grant lines in the security SQL");
const fnLines = [...sql.structure.slice(fnStart, fnEnd + "end $$;".length).split("\n"), "", ...permissionLines];
const highlight = fnLines
  .map((line, i) => (/security definer|auth\.uid\(\) is null|^(revoke|grant) /.test(line) ? i + 1 : 0))
  .filter(Boolean);
write("sql/submit_survey_event.md", fence("sql", fnLines.join("\n"), `hl_lines="${highlight.join(" ")}"`));

// ---------------------------------------------------------------------------------------------
// Example queries. Hand-written, but every column they use is checked against the tables above.
// ---------------------------------------------------------------------------------------------

const QUERIES: { name: string; uses: Record<string, string[]>; sql: string }[] = [
  {
    name: "survey-completion",
    uses: { survey_events: ["event_type", "enrollment_id"], study_enrollments: ["id", "participant_identifier"] },
    sql: `-- Surveys opened and completed, per participant
select e.participant_identifier,
       count(*) filter (where s.event_type = 'opened')    as opened,
       count(*) filter (where s.event_type = 'completed') as completed
from public.survey_events s
join public.study_enrollments e on e.id = s.enrollment_id
group by e.participant_identifier
order by e.participant_identifier;`,
  },
  {
    name: "local-time",
    uses: { survey_events: ["occurrence_id", "event_type", "event_timestamp", "event_time_zone"] },
    sql: `-- Timestamps are stored in UTC; convert to the participant's local time
select occurrence_id,
       event_type,
       event_timestamp at time zone event_time_zone as local_time
from public.survey_events
where event_time_zone is not null;`,
  },
  {
    name: "daily-heart-rate",
    uses: { heart_rate_samples: ["enrollment_id", "sample_start", "sample_time_zone", "bpm"], study_enrollments: ["id", "participant_identifier"] },
    sql: `-- Average heart rate per participant per local day
select e.participant_identifier,
       (h.sample_start at time zone coalesce(h.sample_time_zone, 'UTC'))::date as day,
       round(avg(h.bpm)::numeric, 1) as mean_bpm,
       count(*) as samples
from public.heart_rate_samples h
join public.study_enrollments e on e.id = h.enrollment_id
group by 1, 2
order by 1, 2;`,
  },
  {
    name: "join-survey-answers",
    uses: { survey_events: ["occurrence_id", "event_type", "completed_at", "enrollment_id"], study_enrollments: ["id", "participant_identifier"] },
    sql: `-- After importing your survey tool's export as a table (here: survey_answers),
-- match each response to its scheduled survey and participant
select e.participant_identifier,
       s.occurrence_id,
       s.completed_at,
       a.*
from public.survey_answers a
join public.survey_events s
  on s.occurrence_id = a.inoxity_occurrence_id and s.event_type = 'completed'
join public.study_enrollments e on e.id = s.enrollment_id;`,
  },
  {
    name: "check-backend-identity",
    uses: {
      study_backend_metadata: ["backend_instance_id", "stable_study_id", "expected_study_code", "supported_configuration_schema_version", "is_active"],
    },
    sql: `-- Compare these with the study's settings in the dashboard
select backend_instance_id,
       stable_study_id,
       expected_study_code,
       supported_configuration_schema_version,
       is_active
from public.study_backend_metadata;`,
  },
];
for (const query of QUERIES) {
  for (const [table, used] of Object.entries(query.uses)) {
    const known = tableColumns[table]?.map((c) => c.name);
    if (!known) throw new Error(`Example query "${query.name}" uses public.${table}, which isn't described`);
    for (const column of used) {
      if (!known.includes(column)) throw new Error(`Example query "${query.name}" uses ${table}.${column}, which no longer exists`);
    }
  }
  write(`queries/${query.name}.md`, fence("sql", query.sql));
}

// ---------------------------------------------------------------------------------------------
// Survey completion (Qualtrics) values
// ---------------------------------------------------------------------------------------------

write("surveys/embedded-data-fields.md", fence("text", COMPLETION_EMBEDDED_DATA_FIELDS.join("\n")));
write("surveys/redirect-value.md", fence("text", QUALTRICS_REDIRECT_VALUE));
const testLink = buildCompletionTestLink("https://example.qualtrics.com/jfe/form/SV_example");
if (!testLink) throw new Error("buildCompletionTestLink returned null for a valid HTTPS URL");
write("surveys/test-link-query.md", fence("text", testLink.slice(testLink.indexOf("?"))));

// ---------------------------------------------------------------------------------------------
// Supported Apple Health data, one table per category
// ---------------------------------------------------------------------------------------------

function valueColumns(identifier: keyof typeof HEALTHKIT_TABLE_SPECS): string {
  const spec = HEALTHKIT_TABLE_SPECS[identifier];
  switch (spec.kind) {
    case "sleepState":
      return "`state`";
    case "category":
      return "`category_value`";
    case "quantity":
      return `\`${spec.column}\``;
    case "workout":
      return "`activity_type`, `duration_seconds`";
    case "correlation":
      return `\`${spec.column}\`, \`${spec.secondaryColumn}\``;
  }
}

const categorized = new Set(HEALTHKIT_CATEGORIES.flatMap((c) => c.identifiers));
const uncategorized = HEALTHKIT_IDENTIFIERS.filter((id) => !categorized.has(id));
if (uncategorized.length > 0) throw new Error(`HealthKit types missing from HEALTHKIT_CATEGORIES: ${uncategorized.join(", ")}`);

write(
  "healthkit/categories.md",
  HEALTHKIT_CATEGORIES.map(({ label, identifiers }) =>
    [
      `### ${label}`,
      "",
      "| Data type | Apple Health identifier | Table | Value column |",
      "|---|---|---|---|",
      ...identifiers.map(
        (id) => `| ${HEALTHKIT_LABELS[id]} | \`${id}\` | \`${HEALTHKIT_TABLE_SPECS[id].table}\` | ${valueColumns(id)} |`,
      ),
      "",
    ].join("\n"),
  ).join("\n"),
);

// ---------------------------------------------------------------------------------------------
// Values used inside prose ({{ name }} in the Markdown; see hooks/inoxity_values.py)
// ---------------------------------------------------------------------------------------------

write(
  "values.json",
  JSON.stringify({ schema_version: SCHEMA_VERSION, healthkit_type_count: HEALTHKIT_IDENTIFIERS.length }, null, 2),
);

console.log(`Docs snippets written to ${OUT}`);
