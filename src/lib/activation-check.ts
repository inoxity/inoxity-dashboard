import { isRealCalendarDate, studyConfigurationSchema, type StudyConfiguration } from "@/lib/study-schema";

// Everything the dashboard can check, without touching the network, about whether participants
// will actually be able to enroll in a study once it's activated. Mirrors the iOS app's own
// enrollment-time checks (StudyConfigurationValidator.swift) so a typo is caught here, with a
// clear message, instead of as an enrollment error on a participant's phone. The live Data
// Backend check (backend-connection-check.ts) runs on top of this, only on Activate.
//
// Pure (no server-only imports) so the wizard's Review step can run it on unsaved form values too.

export interface ActivationIssue {
  // The wizard step to fix it on, e.g. "Study Basics" — matches the STEPS titles in study-wizard.tsx.
  step: string;
  message: string;
}

export interface ActivationReadiness {
  // Enrollment will fail (or activation is refused) until these are fixed.
  blockers: ActivationIssue[];
  // Activation is allowed, but something probably isn't what the researcher intends.
  warnings: ActivationIssue[];
}

const STEP_FOR_SECTION: Record<string, string> = {
  schemaVersion: "Study Basics",
  identity: "Study Basics",
  status: "Study Basics",
  schedule: "Study Basics",
  sleepSchedule: "Study Basics",
  participantID: "Participant Setup",
  onboarding: "Participant Setup",
  healthKit: "Data & Notification Permissions",
  notifications: "Data & Notification Permissions",
  features: "Features & Media",
  media: "Features & Media",
  surveys: "Surveys",
  reminders: "Reminders",
  support: "Support, FAQs & Completion",
  faqs: "Support, FAQs & Completion",
  completion: "Support, FAQs & Completion",
  dataBackend: "Data Backend",
};

// Prefix for a plain field directly under a section, e.g. ["media", "activeStartDate"] →
// "Media › active start date" (array items are named by itemName instead).
const SECTION_LABEL: Record<string, string> = {
  identity: "Study",
  status: "Status",
  schedule: "Schedule",
  sleepSchedule: "Sleep schedule",
  participantID: "Participant ID",
  healthKit: "Apple Health",
  notifications: "Notifications",
  features: "Features",
  media: "Media",
  support: "Support",
  completion: "Completion",
  dataBackend: "Data Backend",
};

// Field names that read badly when just split into words.
const FIELD_LABEL: Record<string, string> = {
  "identity.id": "study ID",
  "identity.code": "enrollment code",
  "dataBackend.backendId": "backend ID",
  "dataBackend.supabaseUrl": "project URL",
  "dataBackend.supabaseAnonKey": "anon key",
};

// The date the app compares against: it uses a UTC calendar (StudyConfigurationValidator.calendar).
export function todayUTC(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function words(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\bid\b/g, "ID")
    .replace(/\burl\b/g, "URL");
}

function itemName(config: StudyConfiguration, section: string, index: number): string {
  const named = (label: string, name: string | undefined) => (name?.trim() ? `${label} "${name.trim()}"` : `${label} ${index + 1}`);
  switch (section) {
    case "surveys":
      return named("Survey", config.surveys?.[index]?.name);
    case "reminders":
      return named("Reminder", config.reminders?.[index]?.title);
    case "faqs":
      return named("FAQ", config.faqs?.[index]?.question);
    case "pages":
      return named("Onboarding page", config.onboarding?.pages?.[index]?.title);
    case "categories":
      return named("Media category", config.media?.categories?.[index]?.displayName);
    default:
      return `${words(section)} ${index + 1}`;
  }
}

// ["surveys", 0, "schedule", "date"] → `Survey "Morning check-in" › schedule › date`
function describePath(config: StudyConfiguration, path: PropertyKey[]): string {
  const parts: string[] = [];
  const section = String(path[0] ?? "");
  if (SECTION_LABEL[section] && typeof path[1] === "string" && typeof path[2] !== "number") {
    parts.push(SECTION_LABEL[section]);
  }
  for (let i = 1; i < path.length; i++) {
    const key = path[i];
    if (typeof key === "number") {
      parts.pop();
      parts.push(itemName(config, String(path[i - 1]), key));
    } else {
      parts.push(FIELD_LABEL[`${section}.${String(key)}`] ?? words(String(key)));
    }
  }
  return parts.join(" › ");
}

export function checkActivationReadiness(config: StudyConfiguration, today: string = todayUTC()): ActivationReadiness {
  const blockers: ActivationIssue[] = [];
  const warnings: ActivationIssue[] = [];

  if (!config.dataBackend?.enabled) {
    blockers.push({ step: "Data Backend", message: "No Data Backend is linked yet — add your team's Supabase project details." });
  }
  if (config.status?.state !== "active") {
    blockers.push({
      step: "Study Basics",
      message: 'Study status is not "Active" — the app turns every participant away until it is.',
    });
  }

  const parsed = studyConfigurationSchema.safeParse(config);
  if (!parsed.success) {
    const seen = new Set<string>();
    for (const issue of parsed.error.issues) {
      const section = String(issue.path[0] ?? "");
      const where = describePath(config, issue.path);
      const message = where ? `${where[0].toUpperCase()}${where.slice(1)}: ${issue.message}` : issue.message;
      const key = `${section}|${message}`;
      if (seen.has(key)) continue;
      seen.add(key);
      blockers.push({ step: STEP_FOR_SECTION[section] ?? "Study Basics", message });
    }
  }

  // Date checks against today only make sense on well-formed dates; malformed ones are already
  // reported above.
  const isDate = (value: string | null | undefined): value is string =>
    !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && isRealCalendarDate(value);
  const start = config.schedule?.startDate;
  const end = config.schedule?.endDate;

  if (isDate(end) && end < today) {
    blockers.push({
      step: "Study Basics",
      message: `The study end date (${end}) has already passed — the app will tell participants "This study has ended." Update the end date if that's a typo.`,
    });
  }
  if (isDate(start) && start > today) {
    warnings.push({
      step: "Study Basics",
      message: `The study starts on ${start}. You can activate now, but participants can't enroll until then — the app will say "This study has not started yet."`,
    });
  }

  for (const survey of config.surveys ?? []) {
    if (!survey.enabled) continue;
    const name = survey.name?.trim() ? `"${survey.name.trim()}"` : "A survey";
    if (isDate(survey.activeEndDate) && survey.activeEndDate < today) {
      warnings.push({ step: "Surveys", message: `Survey ${name} stopped on ${survey.activeEndDate}, so participants won't see it.` });
    }
    const oneTime = survey.schedule?.pattern === "oneTime" ? survey.schedule.date : null;
    if (isDate(oneTime)) {
      if (oneTime < today) {
        warnings.push({ step: "Surveys", message: `Survey ${name} is scheduled once, on ${oneTime}, which has already passed.` });
      } else if ((isDate(start) && oneTime < start) || (isDate(end) && oneTime > end)) {
        warnings.push({ step: "Surveys", message: `Survey ${name} is scheduled once, on ${oneTime}, outside the study's dates.` });
      }
    }
  }

  for (const reminder of config.reminders ?? []) {
    if (!reminder.enabled) continue;
    const name = reminder.title?.trim() ? `"${reminder.title.trim()}"` : "A reminder";
    if (isDate(reminder.activeEndDate) && reminder.activeEndDate < today) {
      warnings.push({ step: "Reminders", message: `Reminder ${name} stopped on ${reminder.activeEndDate}, so it won't be sent.` });
    }
    const oneTime = reminder.schedule?.pattern === "oneTime" ? reminder.schedule.date : null;
    if (isDate(oneTime) && oneTime < today) {
      warnings.push({ step: "Reminders", message: `Reminder ${name} is scheduled once, on ${oneTime}, which has already passed.` });
    }
  }

  return { blockers, warnings };
}
