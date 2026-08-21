"use client";

import { Button } from "@/components/ui/button";

export function WizardShell({
  steps,
  currentStep,
  onBack,
  onNext,
  onJumpTo,
  onSaveExit,
  isLastStep,
  isPending,
  saveExitPending,
  submitDisabled,
  submitLabel,
  children,
}: {
  steps: { title: string; description: string }[];
  currentStep: number;
  onBack: () => void;
  onNext?: () => void;
  // Jump directly to any step instead of clicking Next repeatedly — see `goTo` in
  // study-wizard.tsx for the validation rules (backward is unrestricted, forward stops at the
  // first step whose fields don't validate rather than skipping over it).
  onJumpTo?: (index: number) => void;
  onSaveExit?: () => void;
  isLastStep: boolean;
  isPending: boolean;
  saveExitPending?: boolean;
  submitDisabled?: boolean;
  submitLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </p>
        <h2 className="mt-1 text-xl font-light" style={{ fontFamily: "var(--font-raleway)" }}>
          {steps[currentStep].title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{steps[currentStep].description}</p>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        {onJumpTo && (
          <nav aria-label="Wizard steps" className="mt-4 flex flex-wrap gap-2">
            {steps.map((s, i) => {
              const isCurrent = i === currentStep;
              return (
                <button
                  key={s.title}
                  type="button"
                  disabled={isPending}
                  onClick={() => onJumpTo(i)}
                  title={s.title}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-50 ${
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground font-medium"
                      : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                      isCurrent ? "bg-primary-foreground/20" : "bg-muted"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="max-w-32 truncate">{s.title}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">{children}</div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={currentStep === 0 || isPending}>
          Back
        </Button>
        <div className="flex items-center gap-3">
          {onSaveExit && (
            <Button type="button" variant="ghost" onClick={onSaveExit} disabled={isPending || saveExitPending}>
              {saveExitPending ? "Saving…" : "Save & Exit"}
            </Button>
          )}
          {isLastStep ? (
            <Button type="submit" disabled={isPending || submitDisabled}>
              {isPending ? "Saving…" : submitLabel}
            </Button>
          ) : (
            <Button type="button" onClick={onNext} disabled={isPending}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
