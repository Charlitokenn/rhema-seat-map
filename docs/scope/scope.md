# Scope: Rhema Seat Map

Rhema Seat Map is a phone first church tool: ushers mark who is seated, the service summary goes to Google Sheets, and leaders read attendance analytics. This scope plans the next slice, Service Reports: one report per service that matches the church's Word template, kept in Google Sheets, with a downloadable PDF.

**Build approach:** Tracer Bullet (vertical slices, each built end to end and working).
**Workflow:** GA (after `/develop`: `/check verify`, then `/test`, then a fresh model `/check review`, then `/document`). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (for example `· Beta`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| A | Seat map canvas | Existing | existing |
| B | Service summary and submit | Existing | existing |
| C | Attendance analytics | Existing | existing |
| D | Installable offline shell | Existing | existing |
| 1 | People and sign in | Foundation | in-progress |
| 2 | Service report record and storage | Foundation | planned |
| 3 | First report, end to end | Slice 1 | planned |
| 4 | Full template fields | Slice 2 | planned |
| 5 | Edit and delete reports | Slice 3 | planned |
| 6 | Signature on the sign off | Slice 4 | planned |
| 7 | PDF matches the Word template exactly | Slice 5 | planned |

## Already built

Enrolled for context. `/develop` and `/sync` leave these alone.

### A. Seat map canvas · existing
The hall map where ushers tap seats to mark men, women or children, with wheel and pinch zoom. Seat state is kept on the device. code in `src/components/canvas/`, `src/data/churchLayout.js`, `src/store/churchStore.js`

### B. Service summary and submit · existing
Live counts and the Submit flow that saves one row per service to the `ServiceSummary` tab of the Google Sheet. code in `src/components/ui/ServiceLegend.jsx`, `apps-script/Code.gs`, `src/lib/appsScript.js`

### C. Attendance analytics · existing
The full screen analytics dashboard (trends, demographics, peak days), opened from the header button labelled Reports. code in `src/components/reports/`, `src/hooks/useReportsData.js`, `src/utils/analyticsUtils.js`

### D. Installable offline shell · existing
Install prompt, offline banner and cached app files, so the app opens on a phone with a weak connection. code in `vite.config.js`, `src/components/ui/OfflineBanner.jsx`, `src/components/ui/InstallPrompt.jsx`

## Foundations

### 1. People and sign in · in-progress
Let named people sign in, so only they can open Service Reports and every request is tied to a person. The seat map stays open as it is today. The church admin adds the people who can sign in.
**Done when:** an added person can sign in and out on a phone, a person who was not added cannot open Service Reports or read or change any report through the backend, and the backend can tell who made each report request.
- [x] Design it (spec): `/architect people and sign in`
- [ ] Build it: `/develop people and sign in`
   - [ ] Clerk set up and the backend token check working (AC-3, AC-4, AC-9, AC-11)
   - [ ] Sign in working in the app, with the header logo and avatar (AC-1, AC-4, AC-5, AC-8)
   - [ ] Edge states: not in the organization, session ended, offline and loading (AC-2, AC-10, AC-12)
   - [ ] Admin path and regression pass, and the configuration only switch (AC-6, AC-7, AC-8)
- [ ] Verify it: `/check verify people and sign in`
- [ ] Test it: `/test people and sign in`
- [ ] Review it (fresh model): `/check review people and sign in`
- [ ] Document it: `/document people and sign in`
spec [0001](../specs/0001-people-and-sign-in/index.md)

### 2. Service report record and storage · needs a decision
One report record that holds every field on the Word template, kept in a Google Sheet tab named Service Report, with create, read, update and delete for signed in people only. The lists inside a report (prayers, prophecies) and the drawn signature need a place in that record.
**Done when:** a report with every template field can be written to the Service Report tab and read back without losing data, the tab is separate from `ServiceSummary`, and requests from people who are not signed in are refused.
- [ ] Design it (spec): `/architect service report record and storage`

## Slice 1: First report, end to end

### 3. First report, end to end · needs a decision
The thinnest real thread, and the walking skeleton. A signed in person taps a new Service Reports button next to the analytics button, adds a report with the date, a service type from a fixed list and the attendance table, saves it, sees it as a row (date, service type, actions), and downloads a PDF that follows the template layout for those fields.
**Done when:** on a phone a signed in person can add one report, see it in the table after a refresh, and download its PDF; the header shows two clearly labelled buttons, Analytics and Service Reports.
- [ ] Design it (spec): `/architect first report end to end`

## Slice 2: Full template fields

### 4. Full template fields · needs a decision
Thicken the record, the form and the PDF with the rest of the template: harvested souls, tithes and offerings, the Word section, prayers and declarations, prophecies, other ministration, and remarks.
**Done when:** every template field except the signature can be entered, saved, read back and printed, the totals add up on their own, and the repeating lists can grow without breaking the PDF layout.
- [ ] Design it (spec): `/architect full template fields`

## Slice 3: Edit and delete

### 5. Edit and delete reports · needs a decision
Finish the table actions: open a saved report to change it, and delete one after a clear confirmation.
**Done when:** a signed in person can edit any saved report and see the change in the table and the PDF, and a report is only deleted after the person confirms.
- [ ] Design it (spec): `/architect edit and delete reports`

## Slice 4: Signature

### 6. Signature on the sign off · needs a decision
The Sign Off section has a signature box. The person draws their signature on screen, it is saved with the report, and it prints in the box on the PDF. How a drawn image is stored is decided in the design step.
**Done when:** a signature can be drawn on a phone, cleared and drawn again, saved with the report, shown again when the report is edited, and printed in the Sign Off box.
- [ ] Design it (spec): `/architect signature on the sign off`

## Slice 5: PDF matches the template

### 7. PDF matches the Word template exactly · needs a decision
Make the PDF a faithful copy of the Word template: three Letter pages, the logo, blue headings and table headers, fonts, spacing, page breaks and the address footer on every page.
**Done when:** the PDF of an empty report and the Word template look the same side by side (sections, order, wording, colours, page layout), and filled reports keep that look without cut off tables.
- [ ] Design it (spec): `/architect PDF matches the Word template`

## Deferred
Out of scope for the current build pass, kept so the plan stays honest.
- **Fill attendance from the seat map**: start a report from that day's saved summary (the seat map does not split members and visitors) · needs a decision
- **Roles and permissions**: different rights for viewing, editing and deleting · needs a decision
- **Manage service types in the app**: add and retire types without a code change · needs a decision
- **Search and filter reports**: by date range and service type · needs a decision
- **Change history**: see who changed what and when · needs a decision
- **Protect Submit and analytics with sign in**: today they rely on the shared token that ships in the client · from spec 0001 · needs a decision
- **Move to a Clerk production instance**: after the custom domain is connected, with new keys, a new organization and fresh invitations · from spec 0001

## Legend

**The decision box.** Every feature carries exactly one, the sub task whose label ends with `(spec)`. Its wording is normally `Design it (spec)`, so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves. Each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | `/architect` at spec capture | `Design it` ticked; spec linked; `Build it: /develop <feature>` with 2 to 5 milestones; the tier's closing boxes (`Verify it`, `Test it`, `Review it` and `Document it` at GA); any surfaced follow up enrolled |
| `in-progress` (building) | `/develop` | milestone sub boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` and its milestones ticked; `Verify it` ticked |
| `done` | you, when you decide it is (any skill sets it when you say so); `/sync` reconciles | boxes you ran ticked, skipped ones marked skipped; the tier's last stage is the suggested point to call it done (Prototype after `/develop`, Alpha after `/check verify`, Beta and GA after `/test`); `/sync` captures conventions |

- **Next step** is the first unticked box, always a command or a tracked milestone.
- **needs a decision** means run `/architect` first; otherwise go straight to `/develop` (or `/audit` for standards and tooling). The tag drops once the spec is captured.
- **Atomic build tasks** live in the spec's `## Build plan`, not here. The scope carries only the milestone rollup.
- **Status** goes `planned`, then `in-progress`, then `done`, plus `existing` (built before this workflow) and `dropped` (de scoped, kept for history).
- **Approach tag** beside a heading (for example `· Facade`) overrides the project default for that feature. No tag means it inherits the default.
- **Workflow tier tag** beside a heading (for example `· Beta`) sets that one feature's rigor above or below the project default. No tag means it inherits the default. It decides the feature's check boxes and each skill's next suggestion.
- **Workflow** (header line) is the project default, what runs after `/develop`: Prototype is nothing, Alpha is `/check verify`, Beta is `/check verify` then `/test`, GA adds a fresh model `/check review` then `/document`. A feature built on an unratified decision (an `Assumed` spec) stays flagged, but that never blocks `done`.
- **Pointer line** (`spec <n> · code in <path>`) appears once those exist: the spec link is added by `/architect`, the code path by `/develop`.
