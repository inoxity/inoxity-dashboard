export interface AuthActionState {
  error: string | null;
  success?: boolean;
  // Set by login() specifically on an "Email not confirmed" rejection, so
  // the login form can offer to resend without making the user retype the
  // address — Supabase blocks signInWithPassword() for unconfirmed
  // accounts before a session exists, so this is the only place that flow
  // is reachable pre-login (see EmailConfirmationBanner for the
  // already-signed-in case).
  unconfirmedEmail?: string;
}

export const authInitialState: AuthActionState = { error: null };
