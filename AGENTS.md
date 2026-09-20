# Rhema Seat Map

A phone first church attendance tracker. Ushers tap seats to mark M (man), W (woman) or C (child), then Submit saves one row per service to Google Sheets. The Reports screen reads those rows back.

## Stack

- **Language / Runtime**: JavaScript (ES modules, JSX, no TypeScript) in the browser, Node for tooling
- **Framework**: React 18, Vite 8, installable PWA (`vite-plugin-pwa`, Workbox)
- **Key dependencies**: `react-konva` (seat canvas), Zustand 4 (state), TanStack Query 5, Tailwind CSS 3 with shadcn/ui on Base UI, Recharts 3
- **Backend**: Google Apps Script web app writing to a Google Sheet (`apps-script/Code.gs`)
- **Package manager**: npm

## Build approach

<TBD, set by /scope>

## Commands

```bash
# Install
npm install
# Dev server (http://localhost:5173)
npm run dev
# Build to dist/ (static files, Netlify per git history)
npm run build
# Preview the production build
npm run preview
# Test: none configured (no linter or formatter either). Check with a build and by hand.
```

Settings go in `.env.local`: `VITE_GAS_URL` and `VITE_GAS_TOKEN`.

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`. None exist yet.

## Rules

- Live code path: `src/main.jsx` renders `App.jsx`, which mounts `ChurchCanvas`, `ServiceLegend` and `ReportsSheet`. Seat state lives only in `src/store/churchStore.js` (Zustand, saved to localStorage as `church-seat-states`). An occupant is `'M'`, `'W'`, `'C'` or `null`.
- Import from `src` with the `@/` alias. Use function components and Zustand selectors, for example `useChurchStore(s => s.seats)`.
- Every server call goes through `gasRequest` in `src/lib/appsScript.js`. The backend contract, deploy steps and traps are in `apps-script/AGENTS.md`.
- `VITE_GAS_TOKEN` ships inside the client bundle, so treat it as a shared key, not a secret. Without `VITE_GAS_URL` the app runs but Submit and Reports fail. The README mentions `.env.example`, which does not exist.
- Submit needs a connection, posts one row, then clears every seat. Service name and date come from the device clock when the page loads.
- The seat layout is code (`src/data/churchLayout.js`). Saved seats override the layout on load, positions included, so after a layout change a phone keeps its old seats until it Submits or Resets. Read `TOTAL_SEATS` for the count.
- shadcn style `base-mira` runs on Base UI, not Radix: use the `render` prop, not `asChild`. See `src/components/ui/AGENTS.md`.
- Dead code: the old generic venue editor is still in the tree but nothing imports it (`src/components/admin/`, `VenueCanvas`, `RowGroup`, `SeatCircle`, `AssignForm`, `Legend`, `SeatInfoPanel`, `StatsBar`, `Toolbar`, `src/store/venueStore.js`, `src/db/`, `src/hooks/useSync.js`, `src/hooks/useVenue.js`, `src/data/sampleVenue.js`). Do not build on it, and ask before deleting.
- The PWA manifest and caching rules live in `vite.config.js` (`public/manifest.json` and `public/site.webmanifest` are not linked from `index.html`). The README is out of date (Vite 5, old folder layout, wrong seat count), so trust `package.json` and the code.

## Agent skills

- [shadcn](.claude/skills/shadcn/): `shadcn/ui`, shadcn CLI, `components.json`, Base UI versus Radix rules, Tailwind 3 theming
- [vite](.claude/skills/vite/): `antfu/skills`, Vite config, plugin API and Vite 8 Rolldown notes

## Context files

- [apps-script/AGENTS.md](apps-script/AGENTS.md): Google Apps Script backend, actions, sheet columns and deploy steps
- [src/components/canvas/AGENTS.md](src/components/canvas/AGENTS.md): Konva seat canvas, zoom and pinch, coordinate space
- [src/components/ui/AGENTS.md](src/components/ui/AGENTS.md): shadcn on Base UI, plus the app's own UI components

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
