import { z } from "zod";

/**
 * Mirrors /Inoxity/Configuration/Models/StudyConfiguration.swift and
 * /Inoxity/Configuration/Validation/StudyConfigurationValidator.swift from
 * the companion iOS app (separate repo). Field names, casing, and every
 * validation rule below are load-bearing: this JSON is decoded verbatim by
 * that app's Swift `Codable` types. Do not rename keys or relax a rule
 * without re-checking the Swift source first.
 */

export const SCHEMA_VERSION = 8 as const;

// StartDateMode: what "day 1" of the study is measured from for a given participant. Mirrors
// `StudySchedule.startDateMode` in StudyConfiguration.swift. "enrollment" (the default, and the
// only option prior to schemaVersion 8) is today's existing behavior — day 1 is whenever that
// participant enters their participant ID during onboarding, which can be well after they
// actually started the study if onboarding happens ahead of time. "fixed" instead anchors every
// participant in the study to the same `schedule.startDate` above, regardless of when they each
// onboard. "participantSelected" asks each participant to confirm/pick their own real start date
// during onboarding (which may be in the future — see `ParticipantStartDateResolver` on iOS).
export const START_DATE_MODES = ["enrollment", "fixed", "participantSelected"] as const;
export const START_DATE_MODE_LABELS: Record<(typeof START_DATE_MODES)[number], string> = {
  enrollment: "When each participant enrolls (default)",
  fixed: "One fixed date for every participant",
  participantSelected: "Each participant picks their own start date",
};

// ScheduleAnchor: what a schedule's time-of-day is computed relative to.
// "clockTime" (the default, and the only option prior to schemaVersion 6)
// uses hour/minute directly. "wakeTime"/"bedTime" instead derive the day's
// base time from the participant's own sleep schedule (see `sleepSchedule`
// below) plus `offsetMinutes` (positive = after the anchor, negative =
// before). Mirrors `ScheduleAnchor` in StudyConfiguration.swift.
export const SCHEDULE_ANCHORS = ["clockTime", "wakeTime", "bedTime"] as const;
export const SCHEDULE_ANCHOR_LABELS: Record<(typeof SCHEDULE_ANCHORS)[number], string> = {
  clockTime: "Clock time",
  wakeTime: "After wake time",
  bedTime: "Relative to bedtime",
};

// Mirrors HealthKitTypeRegistry.swift's identifier set exactly (string-for-string) — that
// registry, not this file, is the source of truth. Grouped by the same categories as the Swift
// side purely for readability here; order doesn't affect anything at runtime.
export const HEALTHKIT_IDENTIFIERS = [
  // Original 10
  "sleepAnalysis", "stepCount", "restingHeartRate", "heartRate", "heartRateVariabilitySDNN",
  "activeEnergyBurned", "appleExerciseTime", "respiratoryRate", "timeInDaylight", "workout",
  // Activity & fitness
  "distanceWalkingRunning", "distanceCycling", "distanceSwimming", "distanceWheelchair",
  "flightsClimbed", "pushCount", "swimmingStrokeCount", "basalEnergyBurned", "appleStandTime",
  "walkingSpeed", "walkingStepLength", "walkingAsymmetryPercentage", "walkingDoubleSupportPercentage",
  "sixMinuteWalkTestDistance", "stairAscentSpeed", "stairDescentSpeed",
  // Body measurements
  "height", "bodyMass", "bodyMassIndex", "leanBodyMass", "bodyFatPercentage", "waistCircumference",
  "bodyTemperature", "basalBodyTemperature", "electrodermalActivity",
  // Vitals
  "oxygenSaturation", "bloodGlucose", "forcedVitalCapacity", "forcedExpiratoryVolume1",
  "peakExpiratoryFlowRate", "inhalerUsage", "insulinDelivery", "numberOfTimesFallen",
  // Hearing
  "environmentalAudioExposure", "headphoneAudioExposure",
  // Environment
  "uvExposure", "waterTemperature", "underwaterDepth",
  // Nutrition
  "dietaryEnergyConsumed", "dietaryProtein", "dietaryCarbohydrates", "dietaryFiber", "dietarySugar",
  "dietaryFatTotal", "dietaryFatSaturated", "dietaryFatMonounsaturated", "dietaryFatPolyunsaturated",
  "dietaryCholesterol", "dietarySodium", "dietaryPotassium", "dietaryCalcium", "dietaryIron",
  "dietaryMagnesium", "dietaryZinc", "dietaryVitaminA", "dietaryVitaminC", "dietaryVitaminD",
  "dietaryVitaminE", "dietaryVitaminK", "dietaryVitaminB6", "dietaryVitaminB12", "dietaryCaffeine",
  "dietaryWater",
  // Heart rhythm events
  "highHeartRateEvent", "lowHeartRateEvent", "irregularHeartRhythmEvent",
  // Mindfulness
  "mindfulSession",
  // Reproductive health
  "menstrualFlow", "intermenstrualBleeding", "sexualActivity", "ovulationTestResult",
  "contraceptive", "pregnancy", "pregnancyTestResult", "lactation", "cervicalMucusQuality",
  // Symptoms
  "abdominalCramps", "bloating", "constipation", "diarrhea", "dizziness", "fatigue", "fever",
  "generalizedBodyAche", "headache", "heartburn", "lossOfSmell", "lossOfTaste", "nausea",
  "rapidPoundingOrFlutteringHeartbeat", "runnyNose", "shortnessOfBreath", "sinusCongestion",
  "soreThroat", "vomiting", "wheezing", "coughing", "chills", "chestTightnessOrPain",
  "moodChanges", "sleepChanges", "memoryLapse", "hotFlashes", "lowerBackPain", "appetiteChanges",
  "bladderIncontinence",
  // Correlations
  "bloodPressure",
] as const;

export const HEALTHKIT_LABELS: Record<(typeof HEALTHKIT_IDENTIFIERS)[number], string> = {
  sleepAnalysis: "Sleep",
  stepCount: "Steps",
  restingHeartRate: "Resting heart rate",
  heartRate: "Heart rate",
  heartRateVariabilitySDNN: "Heart rate variability",
  activeEnergyBurned: "Active energy",
  appleExerciseTime: "Exercise time",
  respiratoryRate: "Respiratory rate",
  timeInDaylight: "Time in daylight",
  workout: "Workouts",
  distanceWalkingRunning: "Walking + running distance",
  distanceCycling: "Cycling distance",
  distanceSwimming: "Swimming distance",
  distanceWheelchair: "Wheelchair distance",
  flightsClimbed: "Flights climbed",
  pushCount: "Push count",
  swimmingStrokeCount: "Swimming strokes",
  basalEnergyBurned: "Resting energy",
  appleStandTime: "Stand time",
  walkingSpeed: "Walking speed",
  walkingStepLength: "Walking step length",
  walkingAsymmetryPercentage: "Walking asymmetry",
  walkingDoubleSupportPercentage: "Walking double support",
  sixMinuteWalkTestDistance: "Six-minute walk distance",
  stairAscentSpeed: "Stair ascent speed",
  stairDescentSpeed: "Stair descent speed",
  height: "Height",
  bodyMass: "Body mass",
  bodyMassIndex: "Body mass index",
  leanBodyMass: "Lean body mass",
  bodyFatPercentage: "Body fat percentage",
  waistCircumference: "Waist circumference",
  bodyTemperature: "Body temperature",
  basalBodyTemperature: "Basal body temperature",
  electrodermalActivity: "Electrodermal activity",
  oxygenSaturation: "Blood oxygen",
  bloodGlucose: "Blood glucose",
  forcedVitalCapacity: "Forced vital capacity",
  forcedExpiratoryVolume1: "Forced expiratory volume",
  peakExpiratoryFlowRate: "Peak expiratory flow",
  inhalerUsage: "Inhaler usage",
  insulinDelivery: "Insulin delivery",
  numberOfTimesFallen: "Falls",
  environmentalAudioExposure: "Environmental sound",
  headphoneAudioExposure: "Headphone audio",
  uvExposure: "UV exposure",
  waterTemperature: "Water temperature",
  underwaterDepth: "Underwater depth",
  dietaryEnergyConsumed: "Dietary energy",
  dietaryProtein: "Protein",
  dietaryCarbohydrates: "Carbohydrates",
  dietaryFiber: "Fiber",
  dietarySugar: "Sugar",
  dietaryFatTotal: "Total fat",
  dietaryFatSaturated: "Saturated fat",
  dietaryFatMonounsaturated: "Monounsaturated fat",
  dietaryFatPolyunsaturated: "Polyunsaturated fat",
  dietaryCholesterol: "Cholesterol",
  dietarySodium: "Sodium",
  dietaryPotassium: "Potassium",
  dietaryCalcium: "Calcium",
  dietaryIron: "Iron",
  dietaryMagnesium: "Magnesium",
  dietaryZinc: "Zinc",
  dietaryVitaminA: "Vitamin A",
  dietaryVitaminC: "Vitamin C",
  dietaryVitaminD: "Vitamin D",
  dietaryVitaminE: "Vitamin E",
  dietaryVitaminK: "Vitamin K",
  dietaryVitaminB6: "Vitamin B6",
  dietaryVitaminB12: "Vitamin B12",
  dietaryCaffeine: "Caffeine",
  dietaryWater: "Water",
  highHeartRateEvent: "High heart rate events",
  lowHeartRateEvent: "Low heart rate events",
  irregularHeartRhythmEvent: "Irregular rhythm events",
  mindfulSession: "Mindful minutes",
  menstrualFlow: "Menstrual flow",
  intermenstrualBleeding: "Intermenstrual bleeding",
  sexualActivity: "Sexual activity",
  ovulationTestResult: "Ovulation test results",
  contraceptive: "Contraceptive use",
  pregnancy: "Pregnancy",
  pregnancyTestResult: "Pregnancy test results",
  lactation: "Lactation",
  cervicalMucusQuality: "Cervical mucus quality",
  abdominalCramps: "Abdominal cramps",
  bloating: "Bloating",
  constipation: "Constipation",
  diarrhea: "Diarrhea",
  dizziness: "Dizziness",
  fatigue: "Fatigue",
  fever: "Fever",
  generalizedBodyAche: "Body ache",
  headache: "Headache",
  heartburn: "Heartburn",
  lossOfSmell: "Loss of smell",
  lossOfTaste: "Loss of taste",
  nausea: "Nausea",
  rapidPoundingOrFlutteringHeartbeat: "Rapid or fluttering heartbeat",
  runnyNose: "Runny nose",
  shortnessOfBreath: "Shortness of breath",
  sinusCongestion: "Sinus congestion",
  soreThroat: "Sore throat",
  vomiting: "Vomiting",
  wheezing: "Wheezing",
  coughing: "Coughing",
  chills: "Chills",
  chestTightnessOrPain: "Chest tightness or pain",
  moodChanges: "Mood changes",
  sleepChanges: "Sleep changes",
  memoryLapse: "Memory lapse",
  hotFlashes: "Hot flashes",
  lowerBackPain: "Lower back pain",
  appetiteChanges: "Appetite changes",
  bladderIncontinence: "Bladder incontinence",
  bloodPressure: "Blood pressure",
};

// Purely a UI grouping for the study wizard's HealthKit checkbox list (see
// GroupedCheckboxGroupField in 03-permissions.tsx) — has no effect on validation, storage, or
// the generated SQL. Reorganizes the original ten (which spanned several of these groups) into
// wherever they fit best alongside the rest of the catalog, rather than keeping them as their
// own bucket. `study-schema.test.ts` asserts every HEALTHKIT_IDENTIFIERS entry appears in
// exactly one group here — keep the two in sync when adding a new identifier.
export const HEALTHKIT_CATEGORIES: { label: string; identifiers: (typeof HEALTHKIT_IDENTIFIERS)[number][] }[] = [
  {
    label: "Sleep",
    identifiers: ["sleepAnalysis"],
  },
  {
    label: "Activity & fitness",
    identifiers: [
      "stepCount", "activeEnergyBurned", "appleExerciseTime", "workout",
      "distanceWalkingRunning", "distanceCycling", "distanceSwimming", "distanceWheelchair",
      "flightsClimbed", "pushCount", "swimmingStrokeCount", "basalEnergyBurned", "appleStandTime",
      "walkingSpeed", "walkingStepLength", "walkingAsymmetryPercentage", "walkingDoubleSupportPercentage",
      "sixMinuteWalkTestDistance", "stairAscentSpeed", "stairDescentSpeed",
    ],
  },
  {
    label: "Heart & vitals",
    identifiers: [
      "restingHeartRate", "heartRate", "heartRateVariabilitySDNN", "respiratoryRate",
      "oxygenSaturation", "bloodGlucose", "bloodPressure",
      "forcedVitalCapacity", "forcedExpiratoryVolume1", "peakExpiratoryFlowRate",
      "inhalerUsage", "insulinDelivery", "numberOfTimesFallen",
      "highHeartRateEvent", "lowHeartRateEvent", "irregularHeartRhythmEvent",
    ],
  },
  {
    label: "Body measurements",
    identifiers: [
      "height", "bodyMass", "bodyMassIndex", "leanBodyMass", "bodyFatPercentage",
      "waistCircumference", "bodyTemperature", "basalBodyTemperature", "electrodermalActivity",
    ],
  },
  {
    label: "Hearing",
    identifiers: ["environmentalAudioExposure", "headphoneAudioExposure"],
  },
  {
    label: "Environment",
    identifiers: ["timeInDaylight", "uvExposure", "waterTemperature", "underwaterDepth"],
  },
  {
    label: "Nutrition",
    identifiers: [
      "dietaryEnergyConsumed", "dietaryProtein", "dietaryCarbohydrates", "dietaryFiber", "dietarySugar",
      "dietaryFatTotal", "dietaryFatSaturated", "dietaryFatMonounsaturated", "dietaryFatPolyunsaturated",
      "dietaryCholesterol", "dietarySodium", "dietaryPotassium", "dietaryCalcium", "dietaryIron",
      "dietaryMagnesium", "dietaryZinc", "dietaryVitaminA", "dietaryVitaminC", "dietaryVitaminD",
      "dietaryVitaminE", "dietaryVitaminK", "dietaryVitaminB6", "dietaryVitaminB12", "dietaryCaffeine",
      "dietaryWater",
    ],
  },
  {
    label: "Mindfulness",
    identifiers: ["mindfulSession"],
  },
  {
    label: "Reproductive health",
    identifiers: [
      "menstrualFlow", "intermenstrualBleeding", "sexualActivity", "ovulationTestResult",
      "contraceptive", "pregnancy", "pregnancyTestResult", "lactation", "cervicalMucusQuality",
    ],
  },
  {
    label: "Symptoms",
    identifiers: [
      "abdominalCramps", "bloating", "constipation", "diarrhea", "dizziness", "fatigue", "fever",
      "generalizedBodyAche", "headache", "heartburn", "lossOfSmell", "lossOfTaste", "nausea",
      "rapidPoundingOrFlutteringHeartbeat", "runnyNose", "shortnessOfBreath", "sinusCongestion",
      "soreThroat", "vomiting", "wheezing", "coughing", "chills", "chestTightnessOrPain",
      "moodChanges", "sleepChanges", "memoryLapse", "hotFlashes", "lowerBackPain", "appetiteChanges",
      "bladderIncontinence",
    ],
  },
];

export const APP_TABS = ["home", "surveys", "sleep", "media", "about", "settings"] as const;

export const APP_TAB_LABELS: Record<(typeof APP_TABS)[number], string> = {
  home: "Home",
  surveys: "Surveys",
  sleep: "See My Data",
  media: "Media",
  about: "About",
  settings: "Settings",
};

const MAX_MINUTES = 1440;

// Swift's `TimeZone(identifier:)` accepts "UTC"/"GMT" in addition to the
// full IANA geographic zone list, but `Intl.supportedValuesOf("timeZone")`
// does NOT include them — without this union, "UTC" (this file's own
// blankStudyDraft() default) would fail validation.
const IANA_TIME_ZONES: Set<string> =
  typeof Intl !== "undefined" && "supportedValuesOf" in Intl
    ? new Set([...Intl.supportedValuesOf("timeZone"), "UTC", "GMT"])
    : new Set(["UTC", "GMT"]);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

function tryCompileRegex(value: string): boolean {
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}

function findDuplicates(values: string[]): Set<string> {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }
  return dupes;
}

// Mirrors StudyConfigurationValidator's anchor rule: a wake/bed-relative
// schedule only makes sense if the study actually collects a sleep schedule
// from the participant.
function checkScheduleAnchor(
  schedule: { anchor: (typeof SCHEDULE_ANCHORS)[number]; offsetMinutes: number | null },
  sleepScheduleEnabled: boolean,
  path: (string | number)[],
  ctx: z.RefinementCtx,
) {
  if (schedule.anchor === "clockTime") return;
  if (!sleepScheduleEnabled) {
    ctx.addIssue({
      code: "custom",
      path: [...path, "anchor"],
      message: 'Turn on "Collect a sleep schedule" above before anchoring a schedule to wake/bed time',
    });
  }
  if (schedule.offsetMinutes === null) {
    ctx.addIssue({
      code: "custom",
      path: [...path, "offsetMinutes"],
      message: "Required when anchored to wake/bed time",
    });
  }
}

function requireUnique(
  items: { id: string }[],
  basePath: (string | number)[],
  ctx: z.RefinementCtx,
) {
  const dupes = findDuplicates(items.map((item) => item.id));
  if (dupes.size === 0) return;
  items.forEach((item, index) => {
    if (dupes.has(item.id)) {
      ctx.addIssue({
        code: "custom",
        path: [...basePath, index, "id"],
        message: `Duplicate ID "${item.id}" — IDs must be unique`,
      });
    }
  });
}

// identity.id / survey.id / media category.id: Swift validates these with
// SurveyOccurrenceIdentifierFactory.isValidComponent.
const strictSlug = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Lowercase letters, numbers, and hyphens only; must start with a letter or number");

// onboarding page id / reminder id: Swift only checks non-blank + uniqueness,
// no slug pattern — do not tighten this to strictSlug.
const looseId = z.string().trim().min(1, "Required");

const httpOrHttpsUrl = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Must be a valid http:// or https:// URL");

const httpsUrl = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.host.length > 0;
    } catch {
      return false;
    }
  }, "Must be a valid https:// URL");

const scheduleBase = {
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  // No `.default()` here on purpose: zod's input/output types would then
  // diverge (anchor optional on input, required on output), which breaks
  // zodResolver's inference against useForm<StudyConfiguration>() below.
  // Every place that constructs a schedule object (blankStudyDraft, the
  // wizard's "Add survey"/"Add reminder" buttons) supplies both explicitly —
  // "clockTime" / null is the plain-clock-time default in practice.
  anchor: z.enum(SCHEDULE_ANCHORS),
  offsetMinutes: z.number().int().min(-MAX_MINUTES).max(MAX_MINUTES).nullable(),
};

// ReminderScheduleConfiguration: shared by surveys and message-kind reminders.
export const reminderScheduleSchema = z.discriminatedUnion("pattern", [
  z.object({
    pattern: z.literal("oneTime"),
    date: isoDate,
    weekdays: z.array(z.number().int().min(1).max(7)).length(0),
    ...scheduleBase,
  }),
  z.object({
    pattern: z.literal("daily"),
    date: z.null(),
    weekdays: z.array(z.number().int().min(1).max(7)).length(0),
    ...scheduleBase,
  }),
  z.object({
    pattern: z.literal("selectedWeekdays"),
    date: z.null(),
    weekdays: z.array(z.number().int().min(1).max(7)).min(1),
    ...scheduleBase,
  }),
  // EMA-style pseudo-random scheduling (the DOSE-inspired feature): every day, the day is split
  // into `windowCount` equal-length windows of `windowLengthHours` starting at `windowStartHour`,
  // and one fire time is picked at random within each window — see NotificationScheduleBuilder.swift
  // on iOS for the actual algorithm (seeded deterministically per participant/day so it doesn't
  // re-randomize on every reconciliation). hour/minute/anchor/offsetMinutes are kept (via
  // ...scheduleBase) purely for structural parity with Swift's `ReminderScheduleConfiguration`,
  // which still requires those keys — they're meaningless for this pattern and always pinned to
  // 0/0/clockTime/null by the wizard UI (see ScheduleFields). Always every-day, like "daily" —
  // no per-weekday random scheduling.
  z.object({
    pattern: z.literal("randomWindow"),
    date: z.null(),
    weekdays: z.array(z.number().int().min(1).max(7)).length(0),
    ...scheduleBase,
    windowCount: z.number().int().min(1).max(10),
    windowStartHour: z.number().int().min(0).max(23),
    windowLengthHours: z.number().int().min(1).max(24),
  }),
]);

// windowCount × windowLengthHours must fit within a day — called from the same superRefine loops
// that already call checkScheduleAnchor for each survey/reminder schedule.
function checkRandomWindow(
  schedule: { pattern: string; windowCount?: number; windowLengthHours?: number },
  path: (string | number)[],
  ctx: z.RefinementCtx,
) {
  if (schedule.pattern !== "randomWindow") return;
  const count = schedule.windowCount ?? 0;
  const length = schedule.windowLengthHours ?? 0;
  if (count * length > 24) {
    ctx.addIssue({
      code: "custom",
      path: [...path, "windowLengthHours"],
      message: "Window count × window length can't exceed 24 hours in a day",
    });
  }
}

const surveySchema = z.object({
  id: strictSlug,
  enabled: z.boolean(),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  url: httpsUrl,
  presentationMode: z.enum(["externalBrowser", "inAppBrowser"]),
  schedule: reminderScheduleSchema,
  availabilityWindow: z
    .object({
      opensMinutesBefore: z.number().int().min(0).max(MAX_MINUTES),
      closesMinutesAfter: z.number().int().min(0).max(MAX_MINUTES),
    })
    .refine((w) => w.opensMinutesBefore + w.closesMinutesAfter > 0, {
      message: "Window can't be zero-length — increase one of the two values",
    }),
  completionCallback: z.object({ enabled: z.boolean() }),
  instructions: z.string().nullable(),
  privacyText: z.string().nullable(),
  activeStartDate: isoDate.nullable(),
  activeEndDate: isoDate.nullable(),
  // When true, a local notification is scheduled automatically at this survey's own `schedule`
  // times — no separate reminders[] entry needs to reference it via surveyID. Defaults to false
  // (opt-in). notificationTitle/notificationBody override the app's name-derived default copy;
  // null means "use the default". If a reminders[] entry with kind "survey" already targets this
  // survey, that explicit reminder wins and this auto-notification is skipped app-side, to avoid
  // double-notifying the same occurrence — see NotificationScheduleBuilder.swift.
  sendNotificationOnOpen: z.boolean(),
  notificationTitle: z.string().trim().min(1).nullable(),
  notificationBody: z.string().trim().min(1).nullable(),
  // If set, this occurrence is marked "late" (adherence-tracking status, not a hard lock —
  // availabilityWindow.closesMinutesAfter above still governs whether it can actually still be
  // opened/completed) once this many minutes pass after the participant is first prompted
  // without them opening it. "Prompted" is the first notification for the occurrence (a linked
  // survey reminder's notifyMinutesBefore, or sendNotificationOnOpen at the scheduled time), or
  // `opens` when nothing notifies. Counting from `opens` instead made a short deadline pass before
  // the notification arrived. null = only closesMinutesAfter governs "missed". Mirrors
  // `SurveyConfiguration.promptExpirationMinutes` in StudyConfiguration.swift. Absent on
  // schemaVersion < 8 configs — see migrateStoredConfiguration. (Lived on reminders before this
  // schema version; moved here since it's fundamentally about a survey occurrence's own
  // adherence deadline, not any particular reminder announcing it.)
  promptExpirationMinutes: z.number().int().min(1).nullable(),
});

// Cross-field checks against surveys/features live in the top-level
// superRefine below — a reminder can't see its siblings on its own.
const reminderSchema = z.object({
  id: looseId,
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  enabled: z.boolean(),
  kind: z.enum(["survey", "message"]),
  surveyID: z.string().nullable(),
  // Swift's decoder uses decodeIfPresent for this key on survey-kind
  // reminders (schemaVersion >= 4), so it may be entirely absent from JSON,
  // not just explicitly null — .nullish() accepts both.
  schedule: reminderScheduleSchema.nullish(),
  notifyMinutesBefore: z.number().int().min(0).max(MAX_MINUTES).nullable(),
  destination: z.enum(["home", "surveys", "settings", "aboutStudy"]),
  activeStartDate: isoDate.nullable(),
  activeEndDate: isoDate.nullable(),
});

const mediaCategorySchema = z.object({
  id: strictSlug,
  displayName: z.string().trim().min(1),
  description: z.string(),
  acceptedTypes: z.array(z.enum(["photo", "video"])),
  // Deprecated: not exposed anywhere in the wizard (06-features-media.tsx only lets a researcher
  // set representedDateRequired below) and never enforced by the Swift app either — no blocking
  // UI or completion gate reads it. Kept in the schema, still defaulting false, purely so
  // already-saved study JSON containing this key keeps validating/round-tripping. Don't confuse
  // with the unrelated (and functional) participantID.required above.
  required: z.boolean(),
  maximumItems: z.number().int().min(1),
  representedDateRequired: z.boolean(),
});

export const studyConfigurationSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    identity: z.object({
      id: strictSlug,
      code: z
        .string()
        .trim()
        .min(1, "Required")
        .transform((v) => v.trim().toUpperCase()),
      displayName: z.string().trim().min(1),
      shortName: z.string().trim().min(1),
      welcomeTitle: z.string().trim().min(1),
      welcomeMessage: z.string().trim().min(1),
    }),
    status: z.object({
      state: z.enum(["active", "paused", "inactive"]),
      message: z.string().nullable(),
    }),
    schedule: z.object({
      startDate: isoDate.nullable(),
      endDate: isoDate.nullable(),
      timeZone: z.string().refine((v) => IANA_TIME_ZONES.has(v), "Not a recognized IANA time zone"),
      openEnded: z.boolean(),
      // Participant-relative duration in days, counted from that participant's own enrollment
      // date — NOT from startDate/endDate above, which are the study-wide calendar window and
      // may not align with any individual participant's enrollment under rolling enrollment.
      // null = no fixed per-participant duration (the app shows "Day X in the study" instead of
      // "Day X of N"). Mirrors `StudySchedule.participantDurationDays` in StudyConfiguration.swift.
      participantDurationDays: z.number().int().min(1).nullable(),
      // See START_DATE_MODES above. Absent on schemaVersion < 8 configs, which only ever
      // supported "enrollment" — see migrateStoredConfiguration.
      startDateMode: z.enum(START_DATE_MODES),
    }),
    participantID: z
      .object({
        label: z.string().trim().min(1),
        prompt: z.string().trim().min(1),
        placeholder: z.string(),
        helpText: z.string(),
        required: z.boolean(),
        minimumLength: z.number().int().min(0),
        maximumLength: z.number().int().min(1),
        allowedPattern: z
          .string()
          .nullable()
          .refine((v) => v === null || tryCompileRegex(v), "Not a valid regular expression"),
      })
      .refine((p) => p.minimumLength <= p.maximumLength, {
        message: "Minimum length must be ≤ maximum length",
        path: ["maximumLength"],
      }),
    onboarding: z.object({
      pages: z.array(
        z.object({
          id: looseId,
          title: z.string().trim().min(1),
          body: z.string().trim().min(1),
          symbol: z.string().trim().min(1),
          enabled: z.boolean(),
        }),
      ),
    }),
    healthKit: z.object({
      enabled: z.boolean(),
      rationale: z.string(),
      identifiers: z.array(z.enum(HEALTHKIT_IDENTIFIERS)),
      // How many days of EXISTING Apple Health data to collect on first sync,
      // counting back from enrollment. null = full history (as far back as
      // HealthKit has data, bounded by schedule.startDate when set). Absent
      // on schemaVersion < 7 configs, which keep the legacy fixed 30-day
      // backfill. Mirrors `HealthKitConfiguration.backfillDays` in
      // StudyConfiguration.swift.
      backfillDays: z.number().int().min(1).nullable(),
      // Whether this study also requests HealthKit's five static characteristic types
      // (biological sex, blood type, date of birth, Fitzpatrick skin type, wheelchair use).
      // Previously these were requested unconditionally for every HealthKit-enabled study
      // regardless of what identifiers were actually selected here, prompting participants for
      // data types the study never disclosed wanting. Mirrors
      // `HealthKitConfiguration.includeCharacteristics` in StudyConfiguration.swift. A plain
      // required boolean, matching backfillDays above's `.nullable()` (not `.default()` —
      // `z.boolean().default()` makes the resolver's input/output types diverge in a way
      // react-hook-form's zodResolver rejects at the type level). Same tradeoff as backfillDays:
      // a study saved before this field existed won't satisfy this schema until it's re-saved
      // through the wizard (which runs it through migrateStoredConfiguration first).
      includeCharacteristics: z.boolean(),
    }),
    notifications: z.object({
      enabled: z.boolean(),
      rationale: z.string(),
    }),
    // Governs whether onboarding collects a wake/bed time from the
    // participant, which schedules using anchor "wakeTime"/"bedTime" are
    // resolved against. Mirrors `SleepScheduleConfiguration?` in Swift —
    // null means this study has never collected a sleep schedule at all
    // (the "never touched" state from blankStudyDraft()); a non-null object
    // with `enabled: false` means the researcher configured one and then
    // turned it off — the prompt/wake/bed label text stays here, untouched,
    // so re-enabling doesn't lose what was typed. The label fields are only
    // required (via the top-level superRefine below) while `enabled` is
    // true — the base object here just allows an empty string so an
    // enabled:false object with blank labels (never filled in) is still
    // structurally valid.
    sleepSchedule: z
      .object({
        enabled: z.boolean(),
        promptTitle: z.string(),
        wakeLabel: z.string(),
        bedLabel: z.string(),
      })
      .nullable(),
    surveys: z.array(surveySchema),
    reminders: z.array(reminderSchema),
    features: z.object({
      surveysEnabled: z.boolean(),
      // Deprecated: no longer surfaced in the wizard UI (removed from
      // steps/06-features-media.tsx) — this flag was never read anywhere in
      // the Swift app; real sleep-tab visibility is gated by
      // healthKit.enabled && !healthKit.identifiers.isEmpty (MainTabView.swift:7).
      // Kept in the schema, still defaulting false, purely so already-saved
      // study JSON containing this key keeps validating/round-tripping.
      sleepSummaryEnabled: z.boolean(),
      mediaUploadsEnabled: z.boolean(),
      // Deprecated, same situation as sleepSummaryEnabled above: no streaks feature exists
      // anywhere in the Swift app (no view, service, or gate references it), and it was never
      // surfaced in the wizard UI to begin with. Kept in the schema, still defaulting false,
      // purely so already-saved study JSON containing this key keeps validating/round-tripping.
      streaksEnabled: z.boolean(),
      visibleTabs: z.array(z.enum(APP_TABS)),
    }),
    media: z.object({
      enabled: z.boolean(),
      instructions: z.string(),
      privacyText: z.string(),
      acceptedTypes: z.array(z.enum(["photo", "video"])),
      maximumTotalItems: z.number().int().min(1),
      maximumFileSizeMB: z.number().int().min(1),
      maximumVideoLengthSeconds: z.number().int().min(1).nullable(),
      // Deprecated, same situation as mediaCategorySchema.required above: not exposed in the
      // wizard, not enforced by the Swift app. Kept in the schema purely for round-tripping.
      required: z.boolean(),
      activeStartDate: isoDate.nullable(),
      activeEndDate: isoDate.nullable(),
      categories: z.array(mediaCategorySchema),
    }),
    support: z.object({
      name: z.string().trim().min(1),
      email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Not a valid email address"),
      phone: z.string().nullable(),
      website: httpOrHttpsUrl.nullable(),
    }),
    faqs: z.array(
      z.object({
        id: looseId,
        question: z.string().trim().min(1),
        answer: z.string().trim().min(1),
      }),
    ),
    completion: z.object({
      title: z.string().trim().min(1),
      message: z.string().trim().min(1),
      redirectURL: httpOrHttpsUrl.nullable(),
      appAccessRemainsAvailable: z.boolean(),
    }),
    // Not part of StudyConfiguration.swift — the iOS app never decodes this
    // key (it reads the equivalent values from resolve_study_bootstrap's
    // flat RPC columns, sourced server-side from this same object). Stored
    // here instead of a separate `study_backends` table
    // (control_backend/migrations/007_data_backend_in_json.sql) so a
    // study's own Supabase project URL/anon key are nested inside its JSON
    // config rather than living in a dedicated, more casually-browsable
    // table/columns. `backendId` must match the value seeded into that
    // project's own `study_backend_metadata.backend_instance_id`.
    // `enabled` is the ONLY thing the Data Backend step's switch touches (see StepBackend) — the
    // credential fields below stay in the form/stored config whether enabled is true or false, so
    // toggling this off and back on can never silently discard a previously-entered backend ID,
    // URL, or anon key the way an outer `dataBackend: null` used to. Base field types here are
    // deliberately loose (plain strings, no format checks) so an enabled:false object with blank
    // or partial credentials is still structurally valid; the "must look like a real
    // UUID/URL/key" checks only apply while enabled is true, via the top-level superRefine below.
    // `null` itself is still a valid value — it's the "never touched" state from blankStudyDraft().
    dataBackend: z
      .object({
        enabled: z.boolean(),
        backendId: z.string(),
        supabaseUrl: z.string(),
        supabaseAnonKey: z.string(),
        environment: z.enum(["Development", "Staging", "Production"]),
      })
      .nullable(),
  })
  .superRefine((cfg, ctx) => {
    const start = cfg.schedule.startDate;
    const end = cfg.schedule.endDate;

    if (!cfg.schedule.openEnded && (!start || !end)) {
      ctx.addIssue({
        code: "custom",
        path: ["schedule", "openEnded"],
        message: "Start and end dates are required unless the study is open-ended",
      });
    }
    // "fixed" start-date mode anchors every participant's day 1 to schedule.startDate, so it
    // needs one even for an open-ended study (which otherwise doesn't require startDate at all).
    if (cfg.schedule.startDateMode === "fixed" && !start) {
      ctx.addIssue({
        code: "custom",
        path: ["schedule", "startDate"],
        message: 'Required when "One fixed date for every participant" is selected above',
      });
    }
    if (start && end && start > end) {
      ctx.addIssue({
        code: "custom",
        path: ["schedule", "endDate"],
        message: "End date must be on or after the start date",
      });
    }

    // dataBackend/sleepSchedule: format/required-ness of their sub-fields is gated on `enabled`
    // rather than baked into the base object type above, so toggling `enabled` off never has to
    // null out (and thereby destroy) the fields themselves — see the comments on those two
    // properties for why. This is the only place those sub-fields are actually required to look
    // like real values.
    if (cfg.dataBackend?.enabled) {
      const backend = cfg.dataBackend;
      const backendIdCheck = z.uuid().safeParse(backend.backendId);
      if (!backendIdCheck.success) {
        ctx.addIssue({
          code: "custom",
          path: ["dataBackend", "backendId"],
          message: "Must be a valid UUID — the same one seeded into study_backend_metadata",
        });
      }
      const urlCheck = httpsUrl.safeParse(backend.supabaseUrl);
      if (!urlCheck.success) {
        ctx.addIssue({ code: "custom", path: ["dataBackend", "supabaseUrl"], message: "Must be a valid https:// URL" });
      }
      if (backend.supabaseAnonKey.trim().length < 20) {
        ctx.addIssue({
          code: "custom",
          path: ["dataBackend", "supabaseAnonKey"],
          message: "That doesn't look like a full anon key",
        });
      }
    }
    if (cfg.sleepSchedule?.enabled) {
      const sleep = cfg.sleepSchedule;
      for (const [key, label] of [
        ["promptTitle", "Onboarding screen title"],
        ["wakeLabel", "Wake time question"],
        ["bedLabel", "Bed time question"],
      ] as const) {
        if (sleep[key].trim().length === 0) {
          ctx.addIssue({ code: "custom", path: ["sleepSchedule", key], message: `${label} is required` });
        }
      }
    }

    requireUnique(cfg.onboarding.pages, ["onboarding", "pages"], ctx);
    requireUnique(cfg.surveys, ["surveys"], ctx);
    requireUnique(cfg.reminders, ["reminders"], ctx);
    requireUnique(cfg.faqs, ["faqs"], ctx); // extra safety net; Swift doesn't require this
    requireUnique(cfg.media.categories, ["media", "categories"], ctx);

    cfg.surveys.forEach((survey, i) => {
      const path = ["surveys", i] as const;
      if (survey.activeStartDate && survey.activeEndDate && survey.activeStartDate > survey.activeEndDate) {
        ctx.addIssue({ code: "custom", path: [...path, "activeEndDate"], message: "Must be on or after the active start date" });
      }
      if (start && survey.activeStartDate && survey.activeStartDate < start) {
        ctx.addIssue({ code: "custom", path: [...path, "activeStartDate"], message: "Can't start before the study's own start date" });
      }
      if (end && survey.activeEndDate && survey.activeEndDate > end) {
        ctx.addIssue({ code: "custom", path: [...path, "activeEndDate"], message: "Can't end after the study's own end date" });
      }
      checkScheduleAnchor(survey.schedule, cfg.sleepSchedule?.enabled === true, [...path, "schedule"], ctx);
      checkRandomWindow(survey.schedule, [...path, "schedule"], ctx);
    });

    cfg.reminders.forEach((reminder, i) => {
      const path = ["reminders", i] as const;

      if (reminder.activeStartDate && reminder.activeEndDate && reminder.activeStartDate > reminder.activeEndDate) {
        ctx.addIssue({ code: "custom", path: [...path, "activeEndDate"], message: "Must be on or after the active start date" });
      }
      if (start && reminder.activeStartDate && reminder.activeStartDate < start) {
        ctx.addIssue({ code: "custom", path: [...path, "activeStartDate"], message: "Can't start before the study's own start date" });
      }
      if (end && reminder.activeEndDate && reminder.activeEndDate > end) {
        ctx.addIssue({ code: "custom", path: [...path, "activeEndDate"], message: "Can't end after the study's own end date" });
      }

      if (reminder.kind === "survey") {
        const target = cfg.surveys.find((s) => s.id === reminder.surveyID);
        if (!target || !target.enabled) {
          ctx.addIssue({ code: "custom", path: [...path, "surveyID"], message: "Must reference an enabled survey" });
        }
        if (reminder.destination !== "surveys") {
          ctx.addIssue({ code: "custom", path: [...path, "destination"], message: "Survey reminders must target the Surveys tab" });
        }
        if (!cfg.features.surveysEnabled || !cfg.features.visibleTabs.includes("surveys")) {
          ctx.addIssue({
            code: "custom",
            path: [...path, "surveyID"],
            message: "Enable the Surveys feature and add it to visible tabs first",
          });
        }
        if (reminder.schedule != null) {
          ctx.addIssue({ code: "custom", path: [...path, "schedule"], message: "Survey reminders use notifyMinutesBefore, not a schedule" });
        }
        if (reminder.notifyMinutesBefore === null) {
          ctx.addIssue({ code: "custom", path: [...path, "notifyMinutesBefore"], message: "Required for survey reminders" });
        } else if (target && reminder.notifyMinutesBefore > target.availabilityWindow.opensMinutesBefore) {
          ctx.addIssue({
            code: "custom",
            path: [...path, "notifyMinutesBefore"],
            message: "Must be ≤ the survey's \"opens minutes before\" value",
          });
        }
      } else {
        if (reminder.schedule == null) {
          ctx.addIssue({ code: "custom", path: [...path, "schedule"], message: "Required for message reminders" });
        } else {
          checkScheduleAnchor(reminder.schedule, cfg.sleepSchedule?.enabled === true, [...path, "schedule"], ctx);
          checkRandomWindow(reminder.schedule, [...path, "schedule"], ctx);
        }
        if (reminder.notifyMinutesBefore !== null) {
          ctx.addIssue({ code: "custom", path: [...path, "notifyMinutesBefore"], message: "Only used by survey reminders" });
        }
        if (reminder.destination === "surveys" && (!cfg.features.surveysEnabled || !cfg.features.visibleTabs.includes("surveys"))) {
          ctx.addIssue({ code: "custom", path: [...path, "destination"], message: "Surveys tab isn't enabled/visible" });
        }
      }
    });

    if (cfg.features.mediaUploadsEnabled && (!cfg.media.enabled || cfg.media.acceptedTypes.length === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["media", "acceptedTypes"],
        message: "Enable media and pick at least one accepted type when media uploads are turned on",
      });
    }

    cfg.media.categories.forEach((category, i) => {
      if (!category.acceptedTypes.every((t) => cfg.media.acceptedTypes.includes(t))) {
        ctx.addIssue({
          code: "custom",
          path: ["media", "categories", i, "acceptedTypes"],
          message: "Must be a subset of the study's accepted media types",
        });
      }
    });

    if (cfg.media.activeStartDate && cfg.media.activeEndDate && cfg.media.activeStartDate > cfg.media.activeEndDate) {
      ctx.addIssue({ code: "custom", path: ["media", "activeEndDate"], message: "Must be on or after the active start date" });
    }
    if (start && cfg.media.activeStartDate && cfg.media.activeStartDate < start) {
      ctx.addIssue({ code: "custom", path: ["media", "activeStartDate"], message: "Can't start before the study's own start date" });
    }
    if (end && cfg.media.activeEndDate && cfg.media.activeEndDate > end) {
      ctx.addIssue({ code: "custom", path: ["media", "activeEndDate"], message: "Can't end after the study's own end date" });
    }

    for (const required of [
      { path: ["identity", "displayName"], value: cfg.identity.displayName },
      { path: ["identity", "welcomeTitle"], value: cfg.identity.welcomeTitle },
      { path: ["identity", "welcomeMessage"], value: cfg.identity.welcomeMessage },
      { path: ["participantID", "label"], value: cfg.participantID.label },
      { path: ["participantID", "prompt"], value: cfg.participantID.prompt },
    ]) {
      if (required.value.trim().length === 0) {
        ctx.addIssue({ code: "custom", path: required.path, message: "Required" });
      }
    }
  });

export type StudyConfiguration = z.infer<typeof studyConfigurationSchema>;
export type ReminderSchedule = z.infer<typeof reminderScheduleSchema>;

export function blankStudyDraft(): StudyConfiguration {
  return {
    schemaVersion: SCHEMA_VERSION,
    identity: {
      id: "",
      code: "",
      displayName: "",
      shortName: "",
      welcomeTitle: "",
      welcomeMessage: "",
    },
    status: { state: "inactive", message: null },
    schedule: {
      startDate: null,
      endDate: null,
      timeZone: "UTC",
      openEnded: true,
      participantDurationDays: null,
      startDateMode: "enrollment",
    },
    participantID: {
      label: "Participant ID",
      prompt: "Enter your participant ID",
      placeholder: "",
      helpText: "",
      required: true,
      minimumLength: 1,
      maximumLength: 64,
      allowedPattern: null,
    },
    onboarding: { pages: [] },
    healthKit: { enabled: false, rationale: "", identifiers: [], backfillDays: 30, includeCharacteristics: false },
    notifications: { enabled: false, rationale: "" },
    sleepSchedule: null,
    surveys: [],
    reminders: [],
    features: {
      surveysEnabled: false,
      sleepSummaryEnabled: false,
      mediaUploadsEnabled: false,
      streaksEnabled: false,
      visibleTabs: ["home", "about", "settings"],
    },
    media: {
      enabled: false,
      instructions: "",
      privacyText: "",
      acceptedTypes: [],
      maximumTotalItems: 1,
      maximumFileSizeMB: 25,
      maximumVideoLengthSeconds: null,
      required: false,
      activeStartDate: null,
      activeEndDate: null,
      categories: [],
    },
    support: { name: "", email: "", phone: null, website: null },
    faqs: [],
    completion: {
      title: "Thank you for taking part",
      message: "",
      redirectURL: null,
      appAccessRemainsAvailable: true,
    },
    dataBackend: null,
  };
}

/**
 * A study saved before a `SCHEMA_VERSION` bump can be missing fields that later became
 * required (or still carry an older literal `schemaVersion`) — `configuration_json` is stored
 * and loaded back as-is with no migration step, so handing one straight to the wizard's
 * `defaultValues` fails validation the instant the researcher tries to save again, even if
 * they change nothing. This patches a stored config forward to the current schema version
 * before it reaches the wizard, filling each newly-required field with the value that
 * reproduces its old, fixed (un-configurable) behavior — so migrating never silently changes
 * what a study actually does.
 */
type LooseRecord = Record<string, unknown>;

function migrateSchedule(schedule: unknown): unknown {
  if (!schedule || typeof schedule !== "object") return schedule;
  const value = schedule as LooseRecord;
  return {
    ...value,
    // Absent on schemaVersion < 6 configs, which only ever supported clock-time scheduling.
    anchor: value.anchor ?? "clockTime",
    offsetMinutes: value.offsetMinutes ?? null,
  };
}

export function migrateStoredConfiguration(stored: StudyConfiguration): StudyConfiguration {
  const value = stored as unknown as LooseRecord;
  const healthKit = (value.healthKit ?? {}) as LooseRecord;
  const schedule = (value.schedule ?? {}) as LooseRecord;
  const dataBackend = value.dataBackend as LooseRecord | null | undefined;
  const surveys = Array.isArray(value.surveys) ? (value.surveys as LooseRecord[]) : [];
  const reminders = Array.isArray(value.reminders) ? (value.reminders as LooseRecord[]) : [];
  return {
    ...value,
    // Absent on configs saved before `dataBackend` had its own `enabled` flag (see the schema
    // comment on that field) — back then, a non-null dataBackend object always meant "on" (the
    // only way to null it out was the old destructive toggle-off), so a stored object with no
    // `enabled` key backfills to true, preserving exactly what that study was already doing.
    // `null` (never configured) stays null.
    dataBackend: dataBackend ? { ...dataBackend, enabled: dataBackend.enabled ?? true } : null,
    // Absent (key missing entirely, not just null) on configs saved before schemaVersion 6, which
    // predates sleepSchedule existing at all — null is the same "doesn't collect one" state those
    // studies already had, so this just makes it explicit rather than relying on the key's
    // (schema-invalid) total absence.
    sleepSchedule: value.sleepSchedule ?? null,
    schemaVersion: SCHEMA_VERSION,
    healthKit: {
      ...healthKit,
      // Absent on schemaVersion < 7 configs, which used a fixed, unconfigurable 30-day
      // backfill (HealthKitUploadPolicy.phase3D.initialHistoryDays in the iOS app) — carry
      // that same value forward explicitly rather than silently switching to "full history".
      backfillDays: healthKit.backfillDays ?? 30,
      // Absent on configs saved before this field existed. Unlike the other migrations here,
      // this deliberately does NOT preserve old behavior: pre-fix, characteristics were
      // requested unconditionally (a bug, not an intentional default) whenever HealthKit was
      // enabled at all, so migrating existing studies to `false` actually stops the
      // unintended prompts instead of carrying them forward.
      includeCharacteristics: healthKit.includeCharacteristics ?? false,
    },
    schedule: {
      ...schedule,
      // Absent on configs saved before this field existed — null is itself a valid, permanent
      // "no fixed participant duration" state (not just a migration placeholder), so this simply
      // carries that same "unset" state forward rather than fabricating a duration.
      participantDurationDays: schedule.participantDurationDays ?? null,
      // Absent on schemaVersion < 8 configs, which only ever supported today's default behavior
      // (day 1 = when the participant enrolls) — carry that forward explicitly.
      startDateMode: schedule.startDateMode ?? "enrollment",
    },
    surveys: surveys.map((survey) => ({
      ...survey,
      schedule: migrateSchedule(survey.schedule),
      // Absent on configs saved before this feature existed — false/null is the same "not
      // configured" behavior those surveys always had, so this just carries that forward
      // explicitly rather than the field being missing outright.
      sendNotificationOnOpen: survey.sendNotificationOnOpen ?? false,
      notificationTitle: survey.notificationTitle ?? null,
      notificationBody: survey.notificationBody ?? null,
      // Absent on configs saved before this field existed (whether it never existed at all, or
      // existed on the old reminders[] location pre-relocation) — null (only closesMinutesAfter
      // governs "missed") is exactly today's existing, only-ever-possible behavior, so this just
      // carries it forward explicitly.
      promptExpirationMinutes: survey.promptExpirationMinutes ?? null,
    })),
    reminders: reminders.map((reminder) => ({
      ...reminder,
      schedule: migrateSchedule(reminder.schedule),
    })),
  } as StudyConfiguration;
}

export function normalizeStudyCode(code: string): string {
  return code.trim().toUpperCase();
}
