import type { StudyConfiguration } from "@/lib/study-schema";

export interface Profile {
  id: string;
  full_name: string;
  institution: string | null;
  created_at: string;
}

export interface Study {
  id: string;
  owner_id: string;
  stable_study_id: string;
  study_code: string;
  configuration_schema_version: number;
  configuration_revision: number;
  configuration_json: StudyConfiguration;
  // A study's own Supabase project (Data Backend) lives inside
  // configuration_json.dataBackend, not a separate column/table — see
  // control_backend/migrations/007_data_backend_in_json.sql. Null there
  // until the researcher links it — required before the study can be
  // activated (see setStudyActive).
  is_active: boolean;
  enrollment_opens_at: string | null;
  enrollment_closes_at: string | null;
  created_at: string;
  updated_at: string;
}

export const COLLABORATOR_ROLES = ["admin", "editor", "viewer"] as const;
export type CollaboratorRole = (typeof COLLABORATOR_ROLES)[number];

export const ROLE_LABELS: Record<CollaboratorRole, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

// Row shape of public.study_collaborators — see
// control_backend/migrations/008_study_collaborators.sql. A pending
// invite has user_id/accepted_at both null.
export interface StudyCollaborator {
  id: string;
  study_id: string;
  user_id: string | null;
  invited_email: string;
  role: CollaboratorRole;
  invited_by: string | null;
  invite_token: string;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Shape returned by the get_study_team(study_id) RPC — Owner + every
// collaborator, joined to profiles for display names.
export interface StudyTeamMember {
  collaborator_id: string | null; // null for the owner row
  user_id: string | null;
  full_name: string | null;
  institution: string | null;
  invited_email: string | null; // null for the owner row
  role: "owner" | CollaboratorRole;
  invited_at: string | null;
  accepted_at: string | null;
  is_owner: boolean;
}
