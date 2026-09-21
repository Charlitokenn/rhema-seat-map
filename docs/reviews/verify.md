# Verify — 0001 People and sign in

Run this once the Clerk dashboard prerequisites are done (spec 0001, Build
plan task 1) and the Script Properties + `VITE_CLERK_PUBLISHABLE_KEY` are
set. Checks the acceptance criteria in `docs/specs/0001-people-and-sign-in/index.md`.

## Setup
- [ ] `CLERK_ISSUER`, `CLERK_ORG_ID`, `CLERK_AUTHORIZED_PARTIES` set as Apps Script Script Properties
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` set in `.env.local`, dev server restarted
- [ ] At least one admin and one ordinary member invited into the Clerk organization

## AC-1 / AC-4 / AC-8 — sign in as an admin
- [ ] Tap the header logo while signed out → Clerk's sign in modal opens
- [ ] Complete sign in → avatar (`UserButton`) appears in the header
- [ ] Reload the page → still signed in, avatar still shows
- [ ] Tap the logo again → Clerk's organization screen opens (not a toast)

## AC-2 — sign in as someone not in the organization
- [ ] Sign in with an account that has never been invited
- [ ] See the "not part of the church team yet" banner with a Sign out button
- [ ] Confirm no report data is reachable from this state
- [ ] Sign out from the banner → back to signed out cleanly

## AC-5 — header logo tap rules
- [ ] Signed out + online → opens sign in
- [ ] Signed in, non-admin → toast "Only admins can manage organization settings."
- [ ] Signed in, admin → opens Clerk's organization screen

## AC-6 — admin path in Clerk's own screen
- [ ] Invite a new person from the organization screen, they can accept and sign in
- [ ] Remove a person from the organization, their next `me` check reports `forbidden`/`no_org`

## AC-9 / AC-11 — backend verifier
- [ ] `node --test apps-script/ClerkAuth.test.js` — all cases still pass
- [ ] Send a tampered/expired token by hand (e.g. edit a captured JWT's payload) → `me` returns `{ok:false, code:"unauthenticated"}`
- [ ] Check `SyncLog` — denial rows show `auth_denied:<reason>` and a user id or `unknown`, never a name or email
- [ ] Trigger 30+ denials in an hour → confirm only one extra `rate_limited` summary row appears, its count climbing

## AC-10 — session ends mid-use
- [ ] While signed in, revoke the session from another device/Clerk dashboard
- [ ] Confirm the app shows "Your session ended. Please sign in again." rather than silently reverting

## AC-12 — offline / loading
- [ ] Go offline, tap the logo → toast "Sign in needs a connection."
- [ ] Throttle the network so Clerk is slow to load, tap the logo immediately → toast "Sign in is loading. Try again in a moment."

## AC-7 — regression, signed out
- [ ] With no one signed in: seat map loads, tapping seats works, Submit works, analytics/reports open — identical to before this feature
- [ ] `npm run build` succeeds

## AC-8 — configuration-only portability
- [ ] Point `VITE_CLERK_PUBLISHABLE_KEY` and the three Script Properties at a second Clerk instance
- [ ] Confirm sign in works against the new instance with no code changes
- [ ] Record the switch steps here once proven
