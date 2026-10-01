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
<svg viewBox="0 0 900 410" role="img" aria-labelledby="security-diagram-title security-diagram-desc">
  <title id="security-diagram-title">How the dashboard, app, Control Backend and Study Backends connect</title>
  <desc id="security-diagram-desc">1: The dashboard reads and writes study settings on the Control Backend, checked by row-level security. 2: The app sends a study code to the Control Backend. 3: The Control Backend returns that study's backend URL and anon key. 4: The app sends all participant data directly to that study's own Study Backend through RPCs. 5: Each Study Backend is set up once, by a researcher pasting generated SQL into it; the platform has no runtime connection to it.</desc>
  <defs>
    <marker id="sec-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="currentColor"/>
    </marker>
  </defs>

  <!-- Dashboard -->
  <rect class="box" x="20" y="70" width="170" height="64" rx="8"/>
  <text class="name" x="105" y="98" text-anchor="middle">Dashboard</text>
  <text class="sub" x="105" y="118" text-anchor="middle">researchers</text>

  <!-- iOS app -->
  <rect class="box" x="20" y="290" width="170" height="64" rx="8"/>
  <text class="name" x="105" y="318" text-anchor="middle">iOS app</text>
  <text class="sub" x="105" y="338" text-anchor="middle">participants</text>

  <!-- Control Backend -->
  <rect class="box box--control" x="340" y="36" width="220" height="150" rx="8"/>
  <text class="name" x="450" y="64" text-anchor="middle">Control Backend</text>
  <text class="sub" x="450" y="82" text-anchor="middle">inoxity_backend · one project</text>
  <line class="divider" x1="362" y1="96" x2="538" y2="96"/>
  <text class="mono" x="450" y="118" text-anchor="middle">studies, profiles,</text>
  <text class="mono" x="450" y="136" text-anchor="middle">study_collaborators</text>
  <text class="note" x="450" y="166" text-anchor="middle">no participant data</text>

  <!-- Study Backend (one per research team) -->
  <rect class="box box--back" x="696" y="306" width="186" height="84" rx="8"/>
  <rect class="box box--back" x="688" y="298" width="186" height="84" rx="8"/>
  <rect class="box box--study" x="680" y="290" width="186" height="84" rx="8"/>
  <text class="name" x="773" y="314" text-anchor="middle">Study Backend</text>
  <text class="sub" x="773" y="331" text-anchor="middle">one per research team</text>
  <text class="mono" x="773" y="350" text-anchor="middle">participants, surveys,</text>
  <text class="mono" x="773" y="365" text-anchor="middle">HealthKit samples</text>

  <!-- 1: Dashboard -> Control Backend -->
  <line class="flow" x1="190" y1="102" x2="336" y2="102" marker-end="url(#sec-arrow)"/>
  <text class="label" x="263" y="86" text-anchor="middle">study settings</text>
  <text class="label label--quiet" x="263" y="126" text-anchor="middle">RLS-checked</text>

  <!-- 2: app -> Control Backend (study code) -->
  <line class="flow" x1="130" y1="288" x2="358" y2="191" marker-end="url(#sec-arrow)"/>
  <text class="label" x="212" y="230" text-anchor="end">study code</text>

  <!-- 3: Control Backend -> app (credentials returned) -->
  <line class="flow flow--return" x1="412" y1="190" x2="184" y2="287" marker-end="url(#sec-arrow)"/>
  <text class="label" x="334" y="256">backend URL + anon key</text>

  <!-- 4: app -> Study Backend (participant data) -->
  <line class="flow flow--data" x1="190" y1="322" x2="676" y2="322" marker-end="url(#sec-arrow)"/>
  <text class="label" x="433" y="306" text-anchor="middle">participant data (submit_* RPCs)</text>

  <!-- 5: one-time setup, no runtime link -->
  <line class="flow flow--setup" x1="520" y1="186" x2="728" y2="286" marker-end="url(#sec-arrow)"/>
  <text class="label label--quiet" x="652" y="218">one-time setup</text>
  <text class="label label--quiet" x="652" y="233">no runtime link</text>

  <!-- Step badges, drawn last so they sit on top of the lines -->
  <g class="badge"><circle cx="263" cy="102" r="11"/><text x="263" y="106" text-anchor="middle">1</text></g>
  <g class="badge"><circle cx="226" cy="247" r="11"/><text x="226" y="251" text-anchor="middle">2</text></g>
  <g class="badge"><circle cx="318" cy="230" r="11"/><text x="318" y="234" text-anchor="middle">3</text></g>
  <g class="badge"><circle cx="433" cy="322" r="11"/><text x="433" y="326" text-anchor="middle">4</text></g>
  <g class="badge"><circle cx="624" cy="236" r="11"/><text x="624" y="240" text-anchor="middle">5</text></g>
</svg>
<figcaption>
<ol class="security-steps">
  <li><strong>Dashboard → Control Backend.</strong> Researchers read and write study settings. Row-level security limits each researcher to their own studies and the ones they collaborate on.</li>
  <li><strong>App → Control Backend.</strong> The app sends the study code the participant entered, through the <code>resolve_study_bootstrap</code> RPC.</li>
  <li><strong>Control Backend → app.</strong> It returns that study's settings plus the URL and anon key of that study's own Study Backend. That's the only thing the Control Backend hands to the app.</li>
  <li><strong>App → Study Backend.</strong> Everything a participant submits (enrollment, survey events, Apple Health data, media) goes straight to that study's own Study Backend, through its <code>submit_*</code> RPCs. It never passes through the Control Backend.</li>
  <li><strong>One-time setup.</strong> A researcher creates each Study Backend once, by pasting generated SQL into their own Supabase project, before anyone enrolls. The platform never connects to it at runtime; the Control Backend only stores its URL and anon key.</li>
</ol>
<p class="security-key"><span class="key key--solid"></span> request at runtime <span class="key key--dashed"></span> response <span class="key key--dotted"></span> one-time setup, no connection</p>
</figcaption>
</figure>

In plain terms: the app checks in at the front office first ("here's the study code I was given"), gets back the address and key for that one records room, and then goes there directly for everything else. Setting up a new records room happens once, by hand, before any participant enrolls, and the platform's own login never touches it.

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
