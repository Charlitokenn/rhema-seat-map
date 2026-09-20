# Apps Script backend

## Overview

A Google Apps Script web app that stores one row per saved service in a Google Sheet and returns those rows to the Reports screen. It is pasted into Google's editor and deployed by hand, separate from the Vite build. The PWA reaches it through `gasRequest`.

## Key files

| File | Owns |
|---|---|
| `apps-script/Code.gs` | The whole backend: `doGet`, `doPost`, token check, sheet helpers, `saveServiceSummary`, `getSummaries`, audit log |
| `src/lib/appsScript.js` | Client fetch wrapper: adds the token, 15 second timeout, sends POST as `text/plain` |
| `src/components/ui/ServiceLegend.jsx` | Calls `saveServiceSummary` when a service is submitted |
| `src/hooks/useReportsData.js` | Calls `getSummaries` for the Reports screen |
| `src/utils/analyticsUtils.js` | `normalise()` turns sheet rows into numbers and defaults |
| `src/hooks/useOnlineStatus.js` | Pings the Apps Script URL to decide online or offline |

## Commands

There is nothing to run locally. To deploy:

1. Create a Google Sheet and copy its ID from the URL.
2. In Extensions, Apps Script, paste `Code.gs`.
3. Under Project Settings, Script Properties, add `SHEET_ID` and `AUTH_TOKEN`.
4. Deploy as a Web app: execute as Me, access Anyone.
5. Put the web app URL in `VITE_GAS_URL` and the token in `VITE_GAS_TOKEN` (in `.env.local`, and in the host's environment settings).

After every edit to `Code.gs`, publish a new version of the deployment, or the live URL keeps running the old code.

## Conventions

- GET actions take `action` and `token` in the query string: `healthCheck`, `getSummaries`. POST actions send JSON as the body with `token` in the query string: `saveServiceSummary`. A new action needs a `case` in `doGet` or `doPost` and a matching call from the client.
- Errors come back as `{ ok: false, error }` with HTTP 200. `gasRequest` throws when `data.error` is set. Successful `getSummaries` replies have `summaries` and `count`, not `ok`.
- The `ServiceSummary` column order is fixed by `SUMMARY_COLUMNS`: date, isoDate, service, men, women, children, total, savedAt. Reports read rows by those names. Changing a column means updating both sides and fixing old rows by hand.
- `ServiceSummary` and `SyncLog` are created with a header row on first use. A failed log write never blocks a save.
- `getSummaries` returns newest first, and `useReportsData` sorts it again oldest first by `isoDate`.
- `Code.gs` is written in plain ES5 style (`var`, `function`). Follow that in this file.

## Gotchas

- POST must be sent as `text/plain;charset=utf-8`. A JSON content type triggers a CORS preflight that Apps Script cannot answer.
- The web app is open to Anyone, and `VITE_GAS_TOKEN` is baked into the client JavaScript, so anyone with the site can read it. Treat the token as a shared key. If `AUTH_TOKEN` is not set in Script Properties, every request is let through with a console warning.
- The online check calls the URL with `?health=1`, not `action=healthCheck`, and sends no token. The script answers with a JSON error and HTTP 200, so the check only proves the endpoint is reachable.
- `date` is the phone's local date text, and `isoDate` is the UTC timestamp used for sorting and charts.
- The service worker caches Apps Script GET responses (network first, 8 second timeout, 5 minute cache), so a slow or failed Reports or health request can return a slightly old reply.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
