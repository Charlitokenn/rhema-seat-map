# 0001. People and sign in

**Date**: 2026-09-21
**Status**: In Progress

## Summary

Service Reports hold offering amounts and names, so only named people may open them. People sign in with an email code through Clerk (a hosted sign in service), and the church admin invites or removes them in Clerk's organization screen, opened by tapping the header logo. The Apps Script backend checks every report request itself against Clerk's public keys, so no secret is needed and the shared token in the app is not trusted for reports. The seat map, Submit and analytics stay open exactly as they are today.

## Requirements

**User stories**:
- As a church leader who files reports, I want to sign in with a code sent to my email so that only invited people can open and change Service Reports.
- As the church admin, I want to invite and remove people in one screen so that I control who has access.
- As a member who is not an admin, I want a clear message when I try to manage organization settings so that I know it is admin only.
- As the owner of the data, I want the backend to refuse any report request from someone who is not signed in or not in the church organization.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: An invited person can sign in on a phone (Android or iPhone, in the browser or the installed app) using an email code, sees their avatar button in the header, and can sign out from it.
- **AC-2**: A person who signs in but is not in the church organization gets a plain message to ask an admin for an invitation, with a Sign out button, and cannot reach any report data.
- **AC-3**: The backend refuses every report request that has no token, a malformed token, a token with a bad signature, an expired token, a token for another organization, a token from another app address or with no app address, or a session with no active organization. No report data is returned in any of those cases.
- **AC-4**: For a valid token the backend knows the caller's user id, name, email and role for that request only. The auth layer never writes a name or an email to the Sheet, to logs, or to the cache.
- **AC-5**: Tapping the header logo opens Clerk's organization screen for an admin, shows the toast "Only admins can manage organization settings." for a signed in non admin, and opens sign in for a signed out person.
- **AC-6**: An admin can invite a person by email and remove a person in Clerk's organization screen. After removal, a report request made with a fresh token is refused, and a request made with an older token is refused once that token expires (about one minute).
- **AC-7**: The seat map, the Submit flow and the analytics screen work exactly as today for a signed out person.
- **AC-8**: The app runs against a Clerk development instance now and moves to a production instance by changing configuration values only (publishable key, issuer address, organization id, allowed app addresses), with no code change.
- **AC-9**: Refused report requests are logged in the `SyncLog` tab as operation `auth_denied:<reason>`, entity id the user id or `unknown`, and count 1, and never with a name or an email. At most 30 rows are written per hour. Refusals beyond that are counted and written as one summary row per hour with the total in the count column.
- **AC-10**: If the session ends while the app is open (the token cannot refresh, or the person was removed), the person sees a clear message and is asked to sign in again. The seat map keeps working.
- **AC-11**: The token check needs no Clerk secret key. It accepts only `RS256`, and automated tests cover a valid token and these refusals: tampered payload, wrong key, wrong algorithm, expired, not yet valid, wrong organization, wrong app address, a token with no app address, a pending session, and Clerk's key address being unreachable (a cached key is used, otherwise `unavailable`).
- **AC-12**: With no connection, the seat map still opens and works, and tapping the logo shows the toast "Sign in needs a connection." If the phone is online but Clerk has not loaded yet, the tap shows "Sign in is loading. Try again in a moment." The app never waits for Clerk to load before showing the seat map.

## Decision

**Chosen option**: Option 1: Clerk for sign in and people, with Apps Script verifying Clerk tokens itself

Use Clerk (email code sign in, one church organization) in the React app, and have the Apps Script backend verify each Clerk session token with Clerk's public keys before any report action runs.

**Implementation skills**: `clerk-react-patterns` (`clerk/skills`, `.claude/skills/clerk-react-patterns/`) · `clerk-orgs` (`clerk/skills`, `.claude/skills/clerk-orgs/`)

**Calls made inside this option** (your picks are marked; the rest are my calls with the reason and the runner up):

| Call | Pick | Why | Runner up |
|---|---|---|---|
| Sign in method | Email code only (your pick) | Works on iPhone installed apps with no redirect, nothing else to set up | Google plus email code |
| Where tokens are checked | Apps Script itself (your pick) | No new server, public keys only, no secret | A small function in front, using Clerk's official `verifyToken` |
| People list | Clerk organization, managed by the admin from a logo tap (your pick) | No People tab to build, Clerk enforces who may invite | A People tab in the Sheet |
| Who may edit and delete reports | Any member (your pick) | Roles are put off in the scope, and the role travels in the token so admin only rules can be added later | Admins only for delete |
| Clerk instance | Development now, production when the custom domain is ready (your pick) | You can build and test now | Wait for the domain |
| Avatar and sign out | Clerk `UserButton` in the header when signed in (your pick) | Standard, holds account settings and sign out | Inside the Service Reports screen only |
| Filer on each report | User id and name as text (your pick, I had recommended user id only) | Readable in the Sheet | User id only |
| Organization shape | One church organization, personal accounts off so every session needs the organization, sign up limited to invitations | Nobody outside the church can even finish sign up | Open sign up, rely on the backend organization check alone |
| Sign in and account screens | Clerk's ready made components, lightly styled | Fewest moving parts, includes the email code screens | Custom forms with `useSignIn` |
| Invitation acceptance | Clerk's hosted pages (no redirect URL on invitations) | No code to write | Embed `SignIn` at the app address to handle the invitation ticket |
| Token transport | POST with `authToken` in the JSON body, every guarded action is POST | Apps Script cannot read request headers as far as I know, and POST keeps tokens out of URLs and report data out of the service worker cache | Token in the query string on GET |
| Signing key source | Fetch the issuer's keys from `<issuer>/.well-known/jwks.json`, cache up to 6 hours, refetch once (at most once a minute) on an unknown `kid`. If the fetch fails, use a cached key when there is one, otherwise refuse with `unavailable` | Survives key rotation, nothing to paste | Store a PEM key in Script Properties (breaks on rotation) |
| Signature check code | A small BigInt RSA check, strict full length comparison of the padded hash, `RS256` only, in its own Apps Script file, written as pure functions that take the digest, the clock and the key lookup as inputs so Node's built in test runner needs no Apps Script | Proven by a prototype, no library to paste into Apps Script | Paste a crypto library |
| Claims checked | `iss` (equal to `CLERK_ISSUER` after removing any trailing slash from both), `exp`, `nbf` (5 second skew, Apps Script clock), `azp` present and in the allowed list (a token with no `azp` is refused), `o.id` equals the organization id, `sts` is not `pending`, role is `admin` or `member` | Each closes a real gap, see Key invariants | None |
| Identity claims | Add `email` and `name` custom claims in Clerk's session token settings, require first and last name at sign up, and use `Unnamed member` if a name is ever blank | The backend gets identity without a Clerk secret or extra call, and `name` is never null | Look users up through Clerk's Backend API with a secret key |
| Denied request log | Existing `SyncLog` tab and columns, refusals only, at most 30 rows an hour then one summary row an hour | Successes would flood it, bad tokens could otherwise fill the Sheet, and it holds no names or emails | Log everything |
| Logo tap | Signed out opens sign in, admin opens the organization screen, non admin gets the toast | Clerk enforces the real permission, the toast is a courtesy | None |
| Session length | Clerk's defaults | The token itself lives about a minute and refreshes on its own | Custom lifetime |
| `me` action | Included: the app calls it after sign in to confirm the backend accepts the person | Gives one clear place to show the not in the organization state | Infer access from Clerk's client state only |

## Rationale

Reasoning and options: see `rationale.md`.

## Feature design

**Data model sketch** (Clerk owns people; this app stores no copy):

| Thing | Lives in | Fields | Notes |
|---|---|---|---|
| Person | Clerk only | user id, name, email | Never copied into the Sheet or onto the device by this app |
| Organization and membership | Clerk only | org id, role (`admin` or `member`) | One church organization. The admin manages it in Clerk's screen |
| Verified caller | Not stored, built per request | user id, name, email, role, org id, session id | Made from the checked token, gone when the request ends |
| Backend settings | Apps Script Script Properties | issuer address, organization id, allowed app addresses | Public values, no secrets |
| Signing keys | Apps Script cache | key id, public key | Up to 6 hours, refetched on rotation |
| Denied request log | Existing `SyncLog` tab, existing columns | `operation` is `auth_denied:<reason>`, `entityId` is the user id or `unknown`, `count` is 1 (or the suppressed total in an hourly summary row) | No names or emails. At most 30 rows an hour, counted in the script cache |

Relationships: a person can belong to many organizations in Clerk, but this app accepts only the one configured organization. One token identifies one person, one organization and one role. A report record (feature 2) will carry the filer's user id and name as text, decided in that spec. Email is never stored outside Clerk.

**State transitions**:
- Signed out, then email code, then signed in with a pending session (no organization yet), then organization active as `member` or `admin`.
- From any signed in state: sign out, a failed token refresh, or removal from the organization ends the session and returns to signed out.
- Clerk reports a pending session (signed in, no active organization) as not signed in through `useAuth()`. So `useAccess` reads the session status to tell `no_org` apart from `signed_out`, and shows our message instead of a choose or create organization step.

**API surface** (Apps Script web app, POST body sent as `text/plain;charset=utf-8` JSON like the existing calls; errors keep the existing shape `{ ok: false, error, code }` with HTTP 200):

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `action: 'me'` | POST | `authToken`: string (req) | `{ ok: true, user: { id, name, email, role } }` | Clerk session token | `unauthenticated` (missing, malformed, bad signature, expired, not yet valid), `forbidden` (no organization, wrong organization, wrong or missing app address, pending session), `unavailable` (Clerk's keys could not be fetched and none are cached), `bad_request` |
| `requireMember_(authToken)` | internal function | `authToken`: string (req) | caller object | Clerk session token | throws `unauthenticated` or `forbidden`, used by every report action in feature 2 |

Client surface (React app), new folder `src/auth/`:
- `AuthProvider.jsx` wraps the app in Clerk's provider with the publishable key.
- `authFetch.js` gets a fresh token with `getToken()` and calls `gasRequest` as POST with `authToken` in the body.
- `useAccess.js` returns `{ status, user, role }` where status is `loading`, `signed_out`, `no_org`, `ready` or `error`, so feature 3 can gate the Service Reports button and open sign in.
- The header logo becomes a button with an accessible label. `UserButton` shows when signed in.

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| `me` and every guarded action | Caller user id | Token claim `sub` |
| | Caller name | Custom claim `name`, added in Clerk's session token settings. If it is missing or blank, the text `Unnamed member` |
| | Caller email | Custom claim `email`, same place |
| | Caller role | Token claim `o.rol` (`admin` or `member`, no `org:` prefix in version 2 tokens) |
| | Organization to accept | Script Property `CLERK_ORG_ID`, compared with `o.id` |
| | Issuer to accept and JWKS address | Script Property `CLERK_ISSUER`, compared with `iss`, key address is that value plus `/.well-known/jwks.json` |
| | App addresses to accept | Script Property `CLERK_AUTHORIZED_PARTIES`, compared with `azp` |
| | Current time for expiry | Apps Script server clock, never the phone |
| | Signing key | Key with the token header's `kid`, from the cache or the JWKS address |
| Client | Token to send | `getToken()` at request time |
| Client | Is admin | `useAuth().has({ role: 'org:admin' })`, a courtesy check only |
| Client | Logo button label | Fixed text decided here: "Organization settings" |
| Client | Toast wording | Fixed text decided here: "Only admins can manage organization settings." |
| Client | Not in the organization message | Fixed text decided here: "You are signed in but not part of the church team yet. Ask an admin to invite you." |
| Client | Offline toast wording | Fixed text decided here: "Sign in needs a connection." (logo tap while offline) |
| Client | Loading toast wording | Fixed text decided here: "Sign in is loading. Try again in a moment." (logo tap while online but Clerk is not ready yet) |
| Client | Sign in busy toast | Fixed text decided here: "Sign in is busy. Try again in a moment." (shown when the backend answers `unavailable`) |
| Client | Session ended message | Fixed text decided here: "Your session ended. Please sign in again." |
| Denied log | Row values | `operation` = `auth_denied:` plus the reason code, `entityId` = user id, `count` = 1 or the suppressed total, all written through the existing `appendLog` shape |
| Denied log | User id | `sub`, only from a token whose signature verified, otherwise `unknown` |
| Denied log | Reason | One of a fixed set of codes: `missing`, `malformed`, `bad_signature`, `expired`, `not_yet_valid`, `wrong_issuer`, `wrong_party`, `no_org`, `wrong_org`, `pending`, `unknown_key`, `keys_unavailable` |

**Key invariants**:
- Report data is never returned unless the token is verified and `o.id` equals `CLERK_ORG_ID`.
- Only `RS256` is accepted, the signature check compares the whole padded hash, and the token `kid` must match a key from the issuer's key set.
- Expiry and start times use the Apps Script clock.
- A token is never put in a URL and never logged. Names and emails are never written by the auth layer.
- No Clerk secret key exists in the client or in Apps Script.
- The client toast and hidden buttons are never the only guard. The backend and Clerk enforce.
- Guarded actions skip the old shared token check, and the existing actions keep it exactly as it is.
- Clerk's browser script may load from the network (as far as I know), so nothing that shows the seat map waits for Clerk. A key refetch is throttled to once a minute so bad tokens cannot flood Google's fetch quota.

**Security model**: Guarded report actions may be used by any member or admin of the one church organization. Managing the organization (invite, remove, roles) is enforced by Clerk, which lets only admins do it. The toast for non admins is a courtesy. Financial figures in reports sit behind this sign in. Names and emails belong to Clerk, a third party processor. The engineer stated no data residency rule, and the filer's name is copied onto reports by choice (see Consequences). The seat map, Submit and analytics stay on the shared token, which ships inside the client bundle and protects nothing by itself.

**Configuration required**:
- `VITE_CLERK_PUBLISHABLE_KEY`: the Clerk instance's public key, in `.env.local` and in the Cloudflare build settings (a development key starts with `pk_test_`).
- Script Property `CLERK_ISSUER`: the instance's Frontend API URL, the value of `iss` in tokens.
- Script Property `CLERK_ORG_ID`: the church organization's id.
- Script Property `CLERK_AUTHORIZED_PARTIES`: comma separated app addresses (the workers.dev address, `http://localhost:5173`, later the custom domain).
- Prerequisite in Clerk's dashboard, done by you before coding: confirm the Apps Script project uses the V8 runtime (needed for BigInt), create the development application, allow email code only, require first and last name, turn on Organizations, create the church organization, turn personal accounts off, turn off members creating their own organizations, restrict sign up to invitations, add the `email` and `name` custom claims to the session token (check the current shortcode names in Clerk's docs when you do this), make the first admin a person who will manage people, and set Clerk's home and redirect addresses to the app address so invited people land back in the app.
- Existing `VITE_GAS_URL` and `VITE_GAS_TOKEN` are unchanged.

**Critical test scenarios** (each maps to an acceptance criterion):
- Happy path: an invited person signs in with an email code on a phone, the avatar appears, and `me` returns their id, name, email and role, verifies **AC-1**, **AC-4**.
- Failure case: tampered payload, wrong key, `alg` set to `none`, expired, not yet valid, other organization, other app address, pending session, a token with no app address, an unknown `kid` (one refetch, then refuse), and an unreachable key address (cached key used, otherwise `unavailable`) are each handled with the right code, verifies **AC-3**, **AC-11**.
- Auth/permission: a signed in person with no organization sees the ask an admin message and the backend answers `forbidden`, verifies **AC-2**.
- Admin and non admin logo taps behave as specified, and a signed out tap opens sign in, verifies **AC-5**.
- After an admin removes a person, a fresh token is refused, verifies **AC-6**.
- The seat map, Submit and analytics work with no sign in, verifies **AC-7**.
- Changing only the configuration values points the app at another Clerk instance, verifies **AC-8**.
- The refusal log holds reason codes and user ids only, stops at 30 rows an hour and then writes one summary row, verifies **AC-9**.
- Removing the person while the app is open ends the session with a clear message, verifies **AC-10**.
- Opening the app with no connection shows the seat map, a logo tap shows the offline toast, and a logo tap before Clerk is ready while online shows the loading toast, verifies **AC-12**.
- A token with a blank name gives the caller the name `Unnamed member`, verifies **AC-4**.

## Build plan

Ordered for the Tracer Bullet approach: first one thin real thread (Clerk configuration, backend check, client sign in, header), then the edge states around it.

1. [ ] Do the Clerk dashboard prerequisites and record the publishable key, issuer address and organization id, satisfies **AC-1**, **AC-2**, **AC-8**. _Not done — this is a manual step in Clerk's dashboard, outside what `/develop` can do; see the report below._
2. [x] Backend verifier in its own Apps Script file: token parsing, key fetch and cache, BigInt `RS256` check, claim checks and reason codes. Node tests for every case in AC-11, satisfies **AC-3**, **AC-11**. Built in `apps-script/ClerkAuth.gs`; all 24 cases pass under `node --test apps-script/ClerkAuth.test.js`.
3. [x] Wire the `me` action and `requireMember_` into `Code.gs` (guarded actions skip the shared token check, existing actions keep it), add the three Script Properties, and log refusals to `SyncLog` in the existing columns with codes and user ids only, capped at 30 rows an hour with one summary row, satisfies **AC-3**, **AC-4**, **AC-9**.
4. [x] Client thin thread: install `@clerk/react`, add `AuthProvider`, `authFetch` and `useAccess`, and create `../../../../../Downloads/files (2)/.env.example` with the new variable, satisfies **AC-1**, **AC-4**, **AC-8**.
5. [x] Header: logo as a button with the three tap rules, `UserButton` when signed in, sign in modal for a signed out tap, satisfies **AC-1**, **AC-5**.
6. [x] Access states: the not in the organization message with Sign out, the session ended message when the token cannot refresh, and the offline and loading toasts when Clerk is not ready. Built against `useAuth({ treatPendingAsSignedOut: false })` and `sessionStatus`, confirmed against Clerk's current public docs since `clerk-orgs`/`clerk-react-patterns` are not installed in this repo — worth a quick human check once real sign-in is live, satisfies **AC-2**, **AC-10**, **AC-12**.
7. [ ] Walk the admin path in Clerk's screen: invite a person, accept, remove, and confirm the cutoff, satisfies **AC-6**. _Needs a live Clerk organization and a phone — not done._
8. [ ] Regression pass with no sign in: seat map, Submit and analytics, satisfies **AC-7**. _`npm run build` succeeds with the new code in place; a live-device pass is still worth doing._
9. [ ] Prove the configuration only move to another Clerk instance by changing values, and write the switch steps down, satisfies **AC-8**. _Needs a second live Clerk instance — not done._

## Consequences

**Positive**:
- Only named, invited people can reach report data, and each request is tied to a person.
- No People tab, password or sign in code to build or secure. Clerk handles email codes, invitations and the admin screen.
- No secret to leak: the backend needs only public keys. Removal from the organization takes effect within about a minute.

**Negative / tradeoffs**:
- The signature check is code we own and must keep correct. It is small, tested, and proven in a prototype, but it is security code in Apps Script.
- A development Clerk instance is meant for development, with limits and a visible development mode. Moving to production means a separate Clerk instance, so you recreate the organization and invite everyone again.
- The filer's name is copied onto each report by your choice. It stays as it was when filed, and it is not removed when a person leaves Clerk.
- Only reports are protected. Submit and analytics still rely on the shared token that ships inside the client bundle.
- Reports need a connection and Clerk being reachable. If Clerk is down, nobody new can sign in and tokens stop refreshing after about a minute.
- The logo has no visible hint that it opens organization settings, so an admin may not discover it.
- The first Apps Script call after idle time is slower, and the first call also fetches keys.

**Neutral**:
- New dependency `@clerk/react`, new folder `src/auth/`, new Apps Script file, and three new Script Properties.
- The repo's `.gitignore` ignores `.claude`, so the new skill folders need `git add -f`.

## Follow-up

- [ ] `clerk-react-patterns` and `clerk-orgs` conventions are not yet captured. The auth area's `AGENTS.md` (for example `src/auth/AGENTS.md`) should contain them once that folder exists (auth conventions are only needed when working in that area, so they do not belong in root)
- [ ] Root `AGENTS.md` says the app deploys to Netlify, but it runs on a Cloudflare Worker address. Correct that line
- [ ] The Clerk MCP server was skipped for now. It only returns SDK code snippets, so add it later only if you want that
- [ ] When the custom domain is connected, move to a Clerk production instance: new keys, new organization, invite everyone again, and update `VITE_CLERK_PUBLISHABLE_KEY` and the three Script Properties
- [ ] Feature 2 must record the filer on each report as user id plus name as text, as you chose, and never the email
- [ ] Roles for reports (admin only delete or edit) are put off in the scope. The role is already in the verified token
- [ ] Decide later whether Submit and analytics should also require sign in
- [ ] Consider a visible hint on the logo so admins find organization settings
- [ ] At build time, confirm how Clerk's current SDK reports a pending session and turn off member created organizations in the dashboard
- [ ] At build time, confirm Clerk's current shortcode names for the `name` and `email` claims in its docs
