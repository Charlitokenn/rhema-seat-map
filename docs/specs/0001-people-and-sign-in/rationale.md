# 0001. People and sign in: rationale

The build spec is in [index.md](index.md). This file holds the reasoning behind it.

## Context

> ⚠️ Premise note: Signing in protects Service Reports only. The seat map, Submit and analytics still rely on a shared token that ships inside the client bundle, so anyone who can open the site can call them. That is acceptable for this feature, but "sign in" should not be read as "the app is locked". Also, a Clerk development instance is not meant for real traffic. Plan the move to production before people file real reports, because it is a separate copy of Clerk and everyone must be invited again.

Service Reports will hold offering amounts, names, prophecies and remarks. Today the backend has no idea who is calling. It is an Apps Script web app open to anyone with the link, and its only protection is one shared token that the app sends in the query string and that is baked into the client JavaScript. That was fine for attendance counts. It is not enough for financial figures and names.

The people who file reports use a mix of Android and iPhone, usually as an installed web app (a PWA), and all of them have Google accounts. One church admin decides who has access. You want sign in and people management handled by Clerk, so the app does not grow its own account code, and you want the admin to manage people from the header logo.

The backend is Google Apps Script talking to Google Sheets, and it has hard edges. It cannot read request headers as far as I know, it has no built in check for RSA signatures, and browser calls to it must be sent as `text/plain` to avoid a CORS preflight. The app itself runs on a Cloudflare Worker address today and will move to a custom domain later. The team is one developer, so anything that adds a server to run or a secret to guard has to earn its place. Clerk session tokens are signed with the instance's private key and live for about a minute, so a checker only needs Clerk's public keys.

If nothing is decided, reports either stay open to anyone with the link, or each report feature invents its own gate.

## Options considered

### Option 1: Clerk for sign in and people, Apps Script verifies tokens itself

The app uses Clerk's components for email code sign in and the organization screen. Every guarded backend call carries the Clerk session token in the request body. Apps Script fetches Clerk's public keys, checks the signature and the claims, and only then reads or writes reports.

**Pros**:
- No new server and no secret. The check uses public keys only.
- One place to reason about access: the backend refuses everything that is not a verified member.
- Removal from the organization takes effect within about a minute.

**Cons**:
- The signature check is code you own and must keep correct, in an environment with no crypto library.
- The first call after idle time is slower, and the first call also fetches keys.

### Option 2: Clerk, with a small function in front that verifies and forwards

A function on your Cloudflare Worker verifies the token with Clerk's official SDK, then calls Apps Script with a server side secret. The app calls the function, not Apps Script.

**Pros**:
- Official, maintained verification code.
- The shared token stops shipping in the client for report calls, because the secret lives on the server.

**Cons**:
- A new moving part to build, deploy and keep in step with Apps Script.
- One more hop on every report call, and a new secret to store.
- Two places to reason about access instead of one.

### Option 3: Google sign in and a People tab, no Clerk

People sign in with Google, Apps Script checks Google's token, and the admin edits a People tab in the Sheet.

**Pros**:
- Reuses the Google stack you already run. No third party account service.
- No new vendor to pay or depend on.

**Cons**:
- The admin edits a Sheet to invite or remove people, and there is no invitation email or admin screen.
- Google sign in on iPhone installed apps can be unreliable because of the redirect.
- You said Clerk should handle people, so this drops a stated requirement.

### Option 4: Gate the screens in the app only

Clerk protects the screens, and the backend keeps trusting the shared token.

**Pros**:
- The least work and the fewest moving parts.

**Cons**:
- Anyone with the shared token, which is in the client bundle, can still read and change reports directly. The gate would be for show.

## Rationale

Option 1 fits the forces best. The data is sensitive enough that the backend must refuse unverified callers, which rules out Option 4. Your requirement that Clerk handles people rules out Option 3. That leaves Options 1 and 2. Both verify the same token. Option 1 does it inside the system you already run, with public keys only, so there is no server to add and no secret to leak. Option 2 gives you official code at the price of a new tier and a secret. For one developer, one fewer moving part matters more than owning one small function, and the function is contained: a strict RS256 check, a handful of claim checks, and tests for each refusal. Because you already run a Worker, Option 2 stays a small step later if the check ever becomes a burden.

Three of your picks differ from my recommendation, and each is fine. You chose email code only, where I recommended Google plus email code. That gives up one tap sign in and makes sign in depend on email delivery, but it avoids Google's redirect on iPhone installed apps and is one thing less to set up. You chose to keep the filer's name as text on each report, where I recommended the user id only. That makes the Sheet easier to read, but it copies a name outside Clerk, it will not follow a rename, and it is not removed when a person leaves. The email is still never stored. You chose any member for report edits and deletes, which matches what I recommended, and the role travels in the token so admin only rules can be added without a redesign.

Building against a development instance now is the right call because the custom domain does not exist yet, and the design keeps the move to production to configuration values only. The people, though, do not move: a production instance is a separate copy of Clerk, so the organization and invitations are recreated.

## Evidence: signature check prototype

Before recommending Option 1, I ran a throwaway prototype (not repo code) of the check: a plain BigInt RSA calculation with a strict comparison of the whole padded SHA 256 hash, using a key given as a JSON Web Key (modulus and exponent). Against a locally generated token it accepted the valid token and refused a tampered payload, a wrong key, the algorithm `none`, and a truncated signature. Apps Script has no `crypto` module, so the build uses its digest helper instead, and it must mask the signed bytes it returns with `& 0xff`. Apps Script also needs the V8 runtime for BigInt, which is the default for new projects as far as I know.
