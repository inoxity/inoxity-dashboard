import { createClient } from "@supabase/supabase-js";
import { normalizeStudyCode, type StudyConfiguration } from "@/lib/study-schema";

// Server-only — called from server actions in study-actions.ts, never imported by a client
// component (it makes outbound requests on the server's behalf).
//
// Live check of a study's own Data Backend (the research team's Supabase project), doing the
// same steps the iOS app does when a participant enrolls — anonymous sign-in, then
// get_study_backend_identity(), compared field-for-field the way validateIdentity() in the app's
// SupabaseRepositories.swift compares it. Catches the typos that otherwise only surface as an
// enrollment error on a participant's phone.
//
// Side effect, by design and disclosed in the UI: each check leaves one empty anonymous user in
// the team's Authentication list. No participant row is ever created (ensure_participant() is
// never called), so nothing appears in their study data.

export type BackendCheckResult =
  | { status: "ok" }
  // Something is definitely misconfigured — enrollment will fail. Blocks activation.
  | { status: "problem"; messages: string[] }
  // The dashboard couldn't complete the check (network, CAPTCHA, rate limit). Doesn't block.
  | { status: "unverified"; message: string };

const TIMEOUT_MS = 10_000;

type IdentityRow = {
  backend_instance_id: string;
  stable_study_id: string;
  expected_study_code: string;
  supported_configuration_schema_version: number;
  is_active: boolean;
};

// Researchers paste this URL themselves; only ever let the server call out to a public https
// host, never localhost/an IP literal/an internal name.
function isAllowedBackendUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return false;
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (/^[\d.]+$/.test(host) || host.includes(":") || host.startsWith("[")) return false;
    return host.includes(".");
  } catch {
    return false;
  }
}

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
}

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

export async function checkDataBackendConnection(config: StudyConfiguration): Promise<BackendCheckResult> {
  const backend = config.dataBackend;
  if (!backend?.enabled) {
    return { status: "problem", messages: ["No Data Backend is linked yet."] };
  }
  const supabaseUrl = backend.supabaseUrl.trim();
  if (!isAllowedBackendUrl(supabaseUrl)) {
    return { status: "problem", messages: ["The Supabase Project URL must be a public https:// address (for example https://your-project.supabase.co)."] };
  }

  const supabase = createClient(supabaseUrl, backend.supabaseAnonKey.trim(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: fetchWithTimeout },
  });

  try {
    const { error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) {
      if (signInError.code === "anonymous_provider_disabled") {
        return {
          status: "problem",
          messages: ["Anonymous sign-ins are turned off in your Supabase project. Turn them on in Authentication → Sign In / Providers — the app signs participants in anonymously."],
        };
      }
      if (signInError.status === 401 || /invalid api key/i.test(signInError.message)) {
        return {
          status: "problem",
          messages: ["Supabase rejected the anon key. Copy the anon/publishable key again from your project's Settings → API (not the service_role key)."],
        };
      }
      if (signInError.code === "captcha_failed") {
        return {
          status: "unverified",
          message: "Your project requires a CAPTCHA for anonymous sign-ins, so the dashboard can't test the connection. Test enrollment from the app instead.",
        };
      }
      if (signInError.code === "over_request_rate_limit" || signInError.status === 429) {
        return { status: "unverified", message: "Supabase is rate-limiting sign-ins right now, so the connection couldn't be tested. Try again in a minute." };
      }
      // Wrong URL, project paused, or network trouble all land here.
      return {
        status: "unverified",
        message: `Couldn't reach your Supabase project (${signInError.message}). Check the Project URL, and that the project isn't paused.`,
      };
    }

    const { data, error: rpcError } = await supabase.rpc("get_study_backend_identity");
    if (rpcError) {
      if (rpcError.code === "PGRST202" || /could not find the function/i.test(rpcError.message)) {
        return {
          status: "problem",
          messages: ["Your Supabase project is reachable, but the Inoxity setup SQL hasn't been run there yet. Run both downloaded files (structure, then security) in its SQL Editor."],
        };
      }
      return { status: "unverified", message: `Your Supabase project answered with an error (${rpcError.message}).` };
    }

    const row = (data as IdentityRow[] | null)?.[0];
    if (!row) {
      return {
        status: "problem",
        messages: ["Your project has the Inoxity tables but no study identity row. Re-run section 5 (\"Seed this project's identity\") of the structure file."],
      };
    }

    const expectedCode = normalizeStudyCode(config.identity.code);
    const expectedId = config.identity.id.trim();
    const messages: string[] = [];
    if (!row.is_active) {
      messages.push("The study identity row in your Supabase project is turned off (is_active = false). Fix: update public.study_backend_metadata set is_active = true where singleton;");
    }
    if (row.backend_instance_id.toLowerCase() !== backend.backendId.trim().toLowerCase()) {
      messages.push(
        `Backend ID doesn't match: your Supabase project has ${row.backend_instance_id}, but this study's Data Backend step has ${backend.backendId.trim() || "(blank)"}. Paste the project's value into the Data Backend step, or fix it in Supabase: update public.study_backend_metadata set backend_instance_id = ${sqlString(backend.backendId.trim())} where singleton;`,
      );
    }
    if (row.stable_study_id !== expectedId) {
      messages.push(
        `Study ID doesn't match: your Supabase project has "${row.stable_study_id}", but this study's ID is "${expectedId}". Fix: update public.study_backend_metadata set stable_study_id = ${sqlString(expectedId)} where singleton;`,
      );
    }
    if (row.expected_study_code !== expectedCode) {
      messages.push(
        `Enrollment code doesn't match: your Supabase project has "${row.expected_study_code}", but this study's code is "${expectedCode}". Fix: update public.study_backend_metadata set expected_study_code = ${sqlString(expectedCode)} where singleton;`,
      );
    }
    if (row.supported_configuration_schema_version !== config.schemaVersion) {
      messages.push(
        `Configuration version doesn't match: your Supabase project has ${row.supported_configuration_schema_version}, but this study uses ${config.schemaVersion}. Fix: update public.study_backend_metadata set supported_configuration_schema_version = ${config.schemaVersion} where singleton;`,
      );
    }
    return messages.length > 0 ? { status: "problem", messages } : { status: "ok" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "unverified",
      message: `Couldn't reach your Supabase project (${message}). Check the Project URL, and that the project isn't paused.`,
    };
  } finally {
    await supabase.auth.signOut().catch(() => {});
  }
}
