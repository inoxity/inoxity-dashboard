export interface TeamActionState {
  error: string | null;
  success?: boolean;
  // Shown when an invite is created but the email failed to send — the
  // link still works, so this lets the inviter copy/paste it manually
  // instead of the invite being silently stranded.
  fallbackAcceptUrl?: string;
}

export const teamInitialState: TeamActionState = { error: null };
