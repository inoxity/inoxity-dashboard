# Security architecture

How participant and researcher data is kept apart across the app and the dashboard.

## Key terms

Four terms come up throughout this page.

| Term | What it means |
|---|---|
| **RPC** | "Remote procedure call." Instead of the app reading or writing a table directly, it asks the server to run *one specific, pre-written action*, like asking a bank teller instead of reaching into the vault yourself. |
| **RLS** (row-level security) | A rule Postgres checks on *every row*, every time it's touched: a bouncer checking ID at each row, not just once at the front door. |
| **SECURITY DEFINER** | A function that runs with *its creator's* permissions, not the caller's. It's what lets the "bank teller" (the RPC) into the vault, even though the customer calling it can't get in on their own. |
| **Anon key** | A public key any client can hold. It says *who's asking*, not what they're allowed to do. Holding it grants nothing by itself; RLS and RPC permissions decide the rest. |

## 1. Two backends, one bridge

Think of it as two separate buildings. The **Control Backend** is the front office: one shared Supabase project that knows about studies and researcher accounts, but never holds a participant's data. Each research team also runs its own **Study Backend**: a locked records room, in that team's own Supabase project, holding everything participants submit. The app is the only thing that ever visits both buildings.

<figure class="security-diagram" markdown="0">
<svg viewBox="0 0 790 340" role="img" aria-labelledby="security-diagram-title security-diagram-desc">
  <title id="security-diagram-title">How the dashboard, app, Control Backend and Study Backends connect</title>
  <desc id="security-diagram-desc">The dashboard reads and writes study metadata directly on the Control Backend. The app asks the Control Backend to resolve a study code, which returns that study's own backend URL and anon key; the app then sends all participant data straight to that Study Backend. Study Backends are set up once, out of band, by a researcher pasting a generated SQL script. The platform never connects to them directly.</desc>
  <defs>
    <marker id="sec-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="currentColor"/>
    </marker>
  </defs>

  <!-- Dashboard -->
  <rect class="box" x="10" y="20" width="150" height="58" rx="8"/>
  <text class="name" x="85" y="45" text-anchor="middle">Dashboard</text>
  <text class="sub" x="85" y="64" text-anchor="middle">researchers</text>

  <!-- iOS app -->
  <rect class="box" x="10" y="270" width="150" height="58" rx="8"/>
  <text class="name" x="85" y="295" text-anchor="middle">iOS App</text>
  <text class="sub" x="85" y="314" text-anchor="middle">participants</text>

  <!-- Control Backend -->
  <rect class="box box--control" x="320" y="80" width="210" height="140" rx="8"/>
  <text class="name name--lg" x="425" y="106" text-anchor="middle">Control Backend</text>
  <text class="sub" x="425" y="124" text-anchor="middle">inoxity_backend · one project</text>
  <line class="divider" x1="342" y1="136" x2="508" y2="136"/>
  <text class="mono" x="425" y="156" text-anchor="middle">studies, profiles,</text>
  <text class="mono" x="425" y="172" text-anchor="middle">study_collaborators</text>
  <text class="note" x="425" y="202" text-anchor="middle">no participant data</text>

  <!-- Study Backend stack (one per research team) -->
  <rect class="box box--back" x="616" y="176" width="170" height="92" rx="8" opacity="0.35"/>
  <rect class="box box--back" x="608" y="168" width="170" height="92" rx="8" opacity="0.6"/>
  <rect class="box box--study" x="600" y="160" width="170" height="92" rx="8"/>
  <text class="name" x="685" y="185" text-anchor="middle">Study Backend</text>
  <text class="sub" x="685" y="203" text-anchor="middle">one per research team</text>
  <text class="mono mono--sm" x="685" y="223" text-anchor="middle">participants, surveys,</text>
  <text class="mono mono--sm" x="685" y="238" text-anchor="middle">HealthKit samples</text>

  <!-- Dashboard -> Control Backend -->
  <line class="flow" x1="160" y1="49" x2="316" y2="105" marker-end="url(#sec-arrow)"/>
  <text class="label" x="176" y="42">reads/writes (RLS-scoped)</text>

  <!-- App -> Control Backend, and the credentials it returns -->
  <line class="flow" x1="160" y1="280" x2="316" y2="190" marker-end="url(#sec-arrow)"/>
  <line class="flow flow--return" x1="316" y1="204" x2="164" y2="292" marker-end="url(#sec-arrow)"/>
  <text class="label" x="10" y="232">resolve_study_bootstrap(code) →</text>
  <text class="label label--return" x="10" y="250">← backend url + anon key</text>

  <!-- App -> Study Backend -->
  <line class="flow flow--data" x1="160" y1="314" x2="596" y2="232" marker-end="url(#sec-arrow)"/>
  <text class="label" x="380" y="264" text-anchor="middle" transform="rotate(-10.65 380 264)">submit_* RPCs (participant data)</text>

  <!-- One-time provisioning, no runtime link -->
  <line class="flow flow--setup" x1="534" y1="150" x2="596" y2="190" marker-end="url(#sec-arrow)"/>
  <text class="label label--quiet" x="685" y="132" text-anchor="middle">one-time setup: pasted SQL</text>
  <text class="label label--quiet" x="685" y="147" text-anchor="middle">no runtime link</text>
</svg>
<figcaption>In plain terms: the app checks in at the front office first ("here's the study code I was given"), gets back the address and key for that one records room, and then goes there directly for everything else. Setting up a new records room happens once, by hand, before any participant enrolls, and the platform's own login never touches it.</figcaption>
</figure>

## 2. Row-level security: the direct-read layer

Row-level security is the "every row checks ID" rule from the key terms. It covers the simple case: a person reading or managing their own row and nothing else. It's deliberately not asked to do the harder work of writing sensitive data; that's section 3.

| Backend | Table | Policy | Rule |
|---|---|---|---|
| Control | `profiles` | select / update / insert | Owner only: `auth.uid() = id` |
| Control | `studies` | select | Owner, or any collaborator (viewer role or higher) |
| Control | `studies` | update | Owner, or a collaborator with editor role or higher. `owner_id` is excluded from what editors can update (see section 4). |
| Control | `studies` | delete | Owner only; stricter than update on purpose |
| Control | `study_collaborators` | select / insert / update / delete | Your own row, or admin role or higher on the study. A pending invite is visible to the invited email address. |
| Study | `participants` | select | Own row: `auth_user_id = auth.uid()` |
| Study | `study_enrollments` | select | Own enrollment only |
| Study | `withdrawal_requests` | select | Own request only |
| Study | `storage.objects` | select / insert / delete | `user-uploads` bucket only, and the path must start with `auth.uid()` |

## 3. Everything else: no policy at all

Survey events, every Apple Health sample table, and upload records have **no** client-readable RLS policies at all. The door is simply locked: no bouncer, no exceptions. The only way in is an **RPC**, a specific, pre-written function the app is allowed to call. Each one is marked `security definer`, so it runs with the *function's* permissions rather than the caller's: the teller can open the vault even though the customer at the counter can't.

```sql
-- The shape shared by every write path in the Study Backend
create function submit_survey_event(...)
  language plpgsql security definer set search_path = pg_catalog, public  -- runs as the teller, not the customer
as $$
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;      -- are you signed in at all?
  -- is this really your enrollment, in the study you claim?
  -- then do the one specific thing this function is allowed to do
end; $$;
revoke all on function submit_survey_event from public, anon;              -- nobody gets this by default
grant execute on function submit_survey_event to authenticated;           -- except signed-in users, for this one action
```

??? example "The real `submit_survey_event` function"

    This is the function exactly as your Study Backend's setup files create it, generated from Inoxity's current code when these docs are built. The highlighted lines are the ones described above: it runs with the function's own permissions, rejects anyone not signed in, and only signed-in users may call it. The checks in between confirm the backend, the participant and the enrollment before anything is written.

    --8<-- "generated/sql/submit_survey_event.md"

Roughly twenty of these functions exist across both backends, and every one follows the same shape: check you're signed in, check you own what you're touching, then do exactly one thing. The main ones:

| Function | Backend | What it does |
|---|---|---|
| `resolve_study_bootstrap()` | Control | Study code → the study's settings and its own Study Backend's URL and anon key |
| `accept_study_invite()` | Control | The only way an invite can be marked accepted |
| `transfer_study_ownership()` | Control | Owner only; an admin can never call it |
| `delete_own_account()` | Control | Self-delete, blocked while you still own studies |
| `get_study_team()` | Control | The full team roster, which a plain table policy wouldn't allow |
| `ensure_participant()` | Study | Creates the participant row, safely repeatable |
| `register_study_enrollment()` | Study | Binds an enrollment to the caller and to that Study Backend's identity |
| `submit_healthkit_samples()` | Study | Batched (up to 250), routed to one table per data type |
| `submit_withdrawal_request()` | Study | Deletes the participant's data if they chose deletion, and leaves an anonymized audit row |
| `submit_media_upload()` | Study | Records the metadata for a file already in storage |

## 4. Defense in depth

Four specific decisions beyond "RLS exists".

**Ownership can't be patched in.** *In plain terms: an editor could otherwise slip "make me the owner" into an edit that would technically pass the ID check.* RLS's `with check` alone would let an editor collaborator set `owner_id` to themselves. A separate, independent column-level permission leaves that one column out of what editors can update at all, so no row contents can talk their way around it. Ownership changes only through `transfer_study_ownership()`.

**One role, two identities.** *In plain terms: at the database level, a participant and a researcher look identical.* Both sign in as the same generic "authenticated" role, so every policy that needs to tell them apart checks a flag on the sign-in token itself.

**Sessions are revalidated.** *In plain terms: a login cookie can be copied or faked; checking back with Supabase can't.* The dashboard's middleware always calls `auth.getUser()`, which re-checks with Supabase on every request, rather than `getSession()`, which would trust whatever cookie showed up.

**No service-role key, anywhere.** *In plain terms: there's no master key sitting anywhere that could unlock everything at once.* Nothing in the app or dashboard holds Supabase's all-access "service role" key. Privileged actions, like deleting an account or transferring ownership, are narrow single-purpose RPCs instead, so the row-by-row rules are never bypassed wholesale.
