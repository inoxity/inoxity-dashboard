export interface AuthActionState {
  error: string | null;
  success?: boolean;
}

export const authInitialState: AuthActionState = { error: null };
