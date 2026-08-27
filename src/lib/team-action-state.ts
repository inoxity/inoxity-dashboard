export interface TeamActionState {
  error: string | null;
  success?: boolean;
}

export const teamInitialState: TeamActionState = { error: null };
