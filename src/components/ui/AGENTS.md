# UI components

## Overview

Two kinds of file share this folder. The lowercase files (`button.jsx`, `popover.jsx`, `sheet.jsx` and so on) are shadcn primitives. The capitalised files (`ServiceLegend.jsx`, `SeatPopup.jsx`, `Toast.jsx` and so on) are the app's own components. The shadcn style is `base-mira`, built on Base UI (`@base-ui/react`), not Radix.

## Key files

| File | Owns |
|---|---|
| `button.jsx`, `popover.jsx`, `sheet.jsx`, `tooltip.jsx`, `chart.jsx` and other lowercase files | shadcn primitives, configured by `components.json` |
| `ServiceLegend.jsx` | Live M, W, C counts, the Submit flow (`saveServiceSummary`) and Reset. Has a full sidebar form and a `compact` mobile bar |
| `SeatPopup.jsx` | The M, W, C chooser shown above a tapped seat |
| `Toast.jsx` | Toast list, driven by `useUiStore().toast(message, type, duration)` |
| `OfflineBanner.jsx`, `InstallPrompt.jsx` | Offline warning and PWA install prompt (`useOnlineStatus`, `useInstallPrompt`) |

## Commands

Add new primitives with the shadcn CLI so they match `components.json`: `npx shadcn@latest add <component>`.

## Conventions

- Compose Base UI parts with the `render` prop, for example `<PopoverTrigger render={<Button />}>`. `asChild` is a Radix prop, not a Base UI one.
- Merge class names with `cn()` from `@/lib/utils`. Icons come from `lucide-react`.
- Show messages with `useUiStore().toast(...)`. The `<Toast />` component is mounted once in `App.jsx`.
- Keep the naming split: lowercase file names for shadcn primitives, capitalised names for app components.
- The installed `shadcn` skill holds the full Base versus Radix rules in `.claude/skills/shadcn/rules/base-vs-radix.md`.

## Gotchas

- `ServiceLegend.jsx` and `ChurchCanvas.jsx` still use `asChild` on `PopoverTrigger` and `TooltipTrigger`. Base UI documents `render` for this, so check that a trigger renders and behaves correctly before copying that pattern.
- `ServiceLegend` is mounted twice in `App.jsx` (the sidebar and the `compact` bar), and CSS hides one of them. Any logic or hook you add to it runs in both.
- Service name and date are computed once when it mounts, so a tab left open past midnight keeps the old day.
- A successful Submit calls `resetAll()` and clears every seat.
- These primitives are not imported by the live app: `drawer`, `input`, `label`, `sonner`, `tabs`, `toggle`, `toggle-group`. The `sonner` primitive is not the toast system in use.
- `AssignForm.jsx`, `Legend.jsx`, `SeatInfoPanel.jsx`, `StatsBar.jsx` and `Toolbar.jsx` belong to the old generic venue editor and nothing imports them.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
