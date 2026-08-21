"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, FormProvider, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studyConfigurationSchema, blankStudyDraft, type StudyConfiguration } from "@/lib/study-schema";
import { createDraftStudy, updateDraftStudy, saveDraftProgress } from "@/lib/study-actions";
import { WizardShell } from "./wizard-shell";
import { StepBasics } from "./steps/01-basics";
import { StepParticipantOnboarding } from "./steps/02-participant-onboarding";
import { StepPermissions } from "./steps/03-permissions";
import { StepSurveys } from "./steps/04-surveys";
import { StepReminders } from "./steps/05-reminders";
import { StepFeaturesMedia } from "./steps/06-features-media";
import { StepSupportFaqsCompletion } from "./steps/07-support-faqs-completion";
import { StepBackend } from "./steps/backend";
import { StepReview } from "./steps/08-review";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WizardStep {
  title: string;
  description: string;
  Component: () => React.JSX.Element;
  validate: () => Promise<boolean>;
}

export function StudyWizard({
  mode,
  studyId,
  defaultValues,
}: {
  mode: "create" | "edit";
  studyId?: string;
  defaultValues?: StudyConfiguration;
}) {
  const form = useForm<StudyConfiguration>({
    resolver: zodResolver(studyConfigurationSchema),
    defaultValues: defaultValues ?? blankStudyDraft(),
    mode: "onBlur",
  });
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const rhfStep = (
    title: string,
    description: string,
    Component: () => React.JSX.Element,
    fields: FieldPath<StudyConfiguration>[],
  ): WizardStep => ({
    title,
    description,
    Component,
    validate: () => form.trigger(fields),
  });

  const STEPS: WizardStep[] = useMemo(
    () => [
      rhfStep(
        "Study Basics",
        "Set up your study's identity, enrollment code, schedule, and optional sleep-schedule collection.",
        StepBasics,
        ["identity", "status", "schedule"],
      ),
      rhfStep(
        "Participant Setup",
        "Configure how participants identify themselves and the onboarding pages they'll see first.",
        StepParticipantOnboarding,
        ["participantID", "onboarding"],
      ),
      rhfStep(
        "Data & Notification Permissions",
        "Choose what Apple Health data (if any) and notification permissions this study requests.",
        StepPermissions,
        ["healthKit", "notifications"],
      ),
      // Features & Media moved ahead of Surveys/Reminders: a reminder or
      // survey-reminder targeting the Surveys tab is only valid once
      // features.surveysEnabled + visibleTabs already include "surveys" —
      // validating that on the Reminders step while Features hadn't been
      // visited yet made it impossible to ever get past Reminders.
      rhfStep(
        "Features & Media",
        "Turn on the tabs and features this study uses, and configure photo/video collection if needed.",
        StepFeaturesMedia,
        ["features", "media"],
      ),
      rhfStep(
        "Surveys",
        "Add and schedule the surveys participants will complete.",
        StepSurveys,
        ["surveys"],
      ),
      rhfStep(
        "Reminders",
        "Add extra reminders beyond each survey's own notifications — plain messages or survey nudges.",
        StepReminders,
        ["reminders"],
      ),
      rhfStep(
        "Support, FAQs & Completion",
        "Give participants a way to reach your team, answer common questions, and describe what happens when they're done.",
        StepSupportFaqsCompletion,
        ["support", "faqs", "completion"],
      ),
      rhfStep(
        "Data Backend",
        "Link your team's own Supabase project where this study's participant data will actually be stored.",
        StepBackend,
        ["dataBackend"],
      ),
      {
        title: "Review & Create Draft",
        description: "Check everything over, then save this as a draft study.",
        Component: StepReview,
        validate: () => Promise.resolve(true),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const isLastStep = step === STEPS.length - 1;
  const { Component } = STEPS[step];

  // Landing on the last step swaps the "Next" button in place for a
  // type="submit" "Create Study"/"Save Changes" button, in the exact same
  // on-screen spot — a click that has any trailing motion (a quick
  // double-tap, a trackpad registering one gesture as two events, etc.)
  // can land its second half on the newly-swapped submit button before the
  // user has even seen the Review step, submitting the draft without any
  // deliberate interaction with it. Keep the submit button disabled for a
  // brief moment after arriving so that can't happen.
  const [submitArmed, setSubmitArmed] = useState(false);
  useEffect(() => {
    if (!isLastStep) return;
    const timer = setTimeout(() => setSubmitArmed(true), 500);
    return () => {
      clearTimeout(timer);
      setSubmitArmed(false);
    };
  }, [isLastStep]);

  async function goNext() {
    const valid = await STEPS[step].validate();
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  // Jump directly to any step instead of clicking Next repeatedly. Backward jumps (to an
  // already-visited step) are unrestricted, matching goBack's existing philosophy. Forward jumps
  // validate every intermediate step in sequence and land on the first invalid one rather than
  // skipping straight to the target — later steps' validation can depend on earlier ones already
  // being filled in (see the Features & Media / Surveys / Reminders step-ordering comment above),
  // so jumping past an invalid step could land the researcher somewhere its own fields look fine
  // in isolation but the study as a whole isn't actually valid yet.
  async function goTo(target: number) {
    const clamped = Math.min(Math.max(target, 0), STEPS.length - 1);
    if (clamped === step) return;
    if (clamped < step) {
      setStep(clamped);
      return;
    }
    for (let i = step; i < clamped; i++) {
      const valid = await STEPS[i].validate();
      if (!valid) {
        setStep(i);
        return;
      }
    }
    setStep(clamped);
  }

  function onSubmit(values: StudyConfiguration) {
    setSubmitError(null);
    startTransition(async () => {
      const result =
        mode === "create" ? await createDraftStudy(values) : await updateDraftStudy(studyId!, values);
      if (result?.error) setSubmitError(result.error);
    });
  }

  // "Save & Exit" — lets a researcher leave mid-wizard without losing
  // progress, unlike onSubmit above which only ever runs from the final
  // Review step and requires the full config to pass strict validation.
  // saveDraftProgress() deliberately skips that (a mid-wizard draft is
  // expected to be structurally incomplete) — see study-actions.ts.
  const [saveExitPending, startSaveExitTransition] = useTransition();
  const [saveExitError, setSaveExitError] = useState<string | null>(null);

  function onSaveExit() {
    setSaveExitError(null);
    const values = form.getValues();
    startSaveExitTransition(async () => {
      const result = await saveDraftProgress(mode === "edit" ? studyId! : null, values);
      if (result?.error) setSaveExitError(result.error);
    });
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <WizardShell
          steps={STEPS.map((s) => ({ title: s.title, description: s.description }))}
          currentStep={step}
          onBack={goBack}
          onNext={isLastStep ? undefined : goNext}
          onJumpTo={goTo}
          onSaveExit={isLastStep ? undefined : onSaveExit}
          isLastStep={isLastStep}
          isPending={isPending}
          saveExitPending={saveExitPending}
          submitDisabled={!submitArmed}
          submitLabel={mode === "create" ? "Create Study" : "Save Changes"}
        >
          <Component />
        </WizardShell>
        {submitError && (
          <div className="mx-auto mt-4 w-full max-w-3xl">
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          </div>
        )}
        {saveExitError && (
          <div className="mx-auto mt-4 w-full max-w-3xl">
            <Alert variant="destructive">
              <AlertDescription>{saveExitError}</AlertDescription>
            </Alert>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
