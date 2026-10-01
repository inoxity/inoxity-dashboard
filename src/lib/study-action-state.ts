import type { ActivationIssue } from "@/lib/activation-check";

export interface ActivateActionState {
  error: string | null;
  // What's stopping activation, grouped by wizard step in the dialog.
  issues?: ActivationIssue[];
  // Activation went through, but the live Data Backend check couldn't be completed — shown in
  // the dialog instead of closing it, so the researcher knows to test enrollment from the app.
  notice?: string;
}

export const activateInitialState: ActivateActionState = { error: null };
