import { afterEach, describe, expect, it, vi } from "vitest";
import { checkDataBackendConnection } from "./backend-connection-check";
import { migrateStoredConfiguration, type StudyConfiguration } from "./study-schema";
import sleepStudyFixture from "./__fixtures__/sleep-study-sample.json";

const BACKEND_ID = "8f0c7f8e-7a83-4b39-9a3f-1d2c3b4a5e6f";
const config: StudyConfiguration = {
  ...migrateStoredConfiguration(sleepStudyFixture as unknown as StudyConfiguration),
  dataBackend: {
    enabled: true,
    backendId: BACKEND_ID,
    supabaseUrl: "https://example-project.supabase.co",
    supabaseAnonKey: "x".repeat(40),
    environment: "Production",
  },
};

const matchingRow = {
  backend_instance_id: BACKEND_ID,
  stable_study_id: config.identity.id,
  expected_study_code: "SLEEP01",
  supported_configuration_schema_version: config.schemaVersion,
  is_active: true,
};

function base64url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

// A session shaped like the one Supabase Auth returns from an anonymous sign-up.
function anonymousSession() {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const sub = "11111111-2222-3333-4444-555555555555";
  return {
    access_token: `${base64url({ alg: "HS256", typ: "JWT" })}.${base64url({ sub, exp, role: "authenticated", is_anonymous: true })}.sig`,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: exp,
    refresh_token: "refresh",
    user: { id: sub, aud: "authenticated", role: "authenticated", is_anonymous: true, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

// Fakes the two Supabase endpoints the check calls: Auth's anonymous sign-up and the
// get_study_backend_identity RPC (plus sign-out).
function fakeSupabase({ signUp, rpc }: { signUp?: () => Response; rpc?: () => Response }) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input instanceof Request ? input.url : input);
      calls.push(url);
      if (url.includes("/auth/v1/signup")) return signUp ? signUp() : json(anonymousSession());
      if (url.includes("/rest/v1/rpc/get_study_backend_identity")) return rpc ? rpc() : json([matchingRow]);
      if (url.includes("/auth/v1/logout")) return new Response(null, { status: 204 });
      return json({ message: "unexpected" }, 500);
    }),
  );
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("checkDataBackendConnection", () => {
  it("passes when the project's identity row matches the study", async () => {
    const calls = fakeSupabase({});
    expect(await checkDataBackendConnection(config)).toEqual({ status: "ok" });
    expect(calls.some((u) => u.includes("/auth/v1/signup"))).toBe(true);
    expect(calls.some((u) => u.includes("/rest/v1/rpc/get_study_backend_identity"))).toBe(true);
  });

  it("compares against the normalized enrollment code, like the app", async () => {
    fakeSupabase({});
    const typedLowercase = { ...config, identity: { ...config.identity, code: " sleep01 " } };
    expect(await checkDataBackendConnection(typedLowercase)).toEqual({ status: "ok" });
  });

  it("reports each mismatched field with a one-line SQL fix", async () => {
    fakeSupabase({
      rpc: () => json([{ ...matchingRow, expected_study_code: "sleep01", backend_instance_id: "00000000-0000-0000-0000-000000000000" }]),
    });
    const result = await checkDataBackendConnection(config);
    expect(result.status).toBe("problem");
    const text = result.status === "problem" ? result.messages.join("\n") : "";
    expect(text).toContain("Enrollment code doesn't match");
    expect(text).toContain("update public.study_backend_metadata set expected_study_code = 'SLEEP01' where singleton;");
    expect(text).toContain("Backend ID doesn't match");
  });

  it("explains when anonymous sign-ins are turned off", async () => {
    fakeSupabase({
      signUp: () => json({ code: 422, error_code: "anonymous_provider_disabled", msg: "Anonymous sign-ins are disabled" }, 422),
    });
    const result = await checkDataBackendConnection(config);
    expect(result.status).toBe("problem");
    expect(result.status === "problem" && result.messages[0]).toContain("Anonymous sign-ins are turned off");
  });

  it("explains a rejected anon key", async () => {
    fakeSupabase({ signUp: () => json({ message: "Invalid API key" }, 401) });
    const result = await checkDataBackendConnection(config);
    expect(result.status).toBe("problem");
    expect(result.status === "problem" && result.messages[0]).toContain("rejected the anon key");
  });

  it("explains when the setup SQL was never run", async () => {
    fakeSupabase({
      rpc: () => json({ code: "PGRST202", message: "Could not find the function public.get_study_backend_identity without parameters in the schema cache" }, 404),
    });
    const result = await checkDataBackendConnection(config);
    expect(result.status).toBe("problem");
    expect(result.status === "problem" && result.messages[0]).toContain("setup SQL hasn't been run");
  });

  it("explains a missing identity row", async () => {
    fakeSupabase({ rpc: () => json([]) });
    const result = await checkDataBackendConnection(config);
    expect(result.status === "problem" && result.messages[0]).toContain("no study identity row");
  });

  it("doesn't block when the project requires a CAPTCHA (can't be tested from the dashboard)", async () => {
    fakeSupabase({ signUp: () => json({ code: 400, error_code: "captcha_failed", msg: "captcha protection: request disallowed" }, 400) });
    expect((await checkDataBackendConnection(config)).status).toBe("unverified");
  });

  it("never calls out to localhost or an IP address", async () => {
    const calls = fakeSupabase({});
    for (const supabaseUrl of ["https://localhost:54321", "https://127.0.0.1", "http://example-project.supabase.co"]) {
      const result = await checkDataBackendConnection({ ...config, dataBackend: { ...config.dataBackend!, supabaseUrl } });
      expect(result.status).toBe("problem");
    }
    expect(calls).toEqual([]);
  });
});
