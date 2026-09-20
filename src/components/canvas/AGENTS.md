# Seat canvas

## Overview

`ChurchCanvas.jsx` draws the hall with Konva (`react-konva`) inside one fixed 1500 by 800 coordinate space. Ushers tap a seat to open a popup and mark it M, W or C. The seat layout and the seat state live outside the component.

## Key files

| File | Owns |
|---|---|
| `src/components/canvas/ChurchCanvas.jsx` | Stage, static room layer, interactive seat layer, wheel zoom, pinch zoom, zoom buttons, popup placement |
| `src/data/churchLayout.js` | `generateInitialSeats()` (seat ids and positions), `TABLES`, `SEAT_W`, `SEAT_H`, `TOTAL_SEATS` |
| `src/store/churchStore.js` | Seat occupancy, saved to localStorage as `church-seat-states` |
| `src/store/uiStore.js` | `scale`, `stagePos`, zoom helpers, toasts |
| `src/components/ui/SeatPopup.jsx` | The M, W, C chooser, placed in screen coordinates |

## Conventions

- Room shapes (altar, door, tables, media desk, entrance) are drawn in the static layer (`listening={false}`) with hard coded coordinates. Only seats go in the interactive layer.
- Seats are 24 by 24 (`SEAT_W`, `SEAT_H`). Add or move seats in `churchLayout.js`, never in the component. Section names are labels only.
- `SeatShape` is wrapped in `memo`. Pass stable callbacks (`useCallback`) or every seat redraws on each tap.
- The stage size follows a `ResizeObserver`. The first render fits the 1500 by 800 space to the screen, and `handleResetZoom` does the same on demand.
- The popup is a normal DOM element. Its position is worked out from `scale` and `stagePos` in `handleSeatClick`, and it closes on any zoom change.
- Occupant colours exist as separate copies: `SEAT_FILL` and `SEAT_TEXT` in `ChurchCanvas.jsx`, `seat.*` in `tailwind.config.js`, the button classes in `SeatPopup.jsx`, and the variables in `src/globals.css`. Change them together.

## Gotchas

- `Konva.hitOnDragEnabled = true` is set at module level. Two finger pinch needs it while the stage is draggable, so keep it.
- The pinch code follows the Konva multi touch sandbox. It tracks both the last distance and the last centre, calls `e.evt.preventDefault()` inside the Konva handler, calls `stage.stopDrag()` at two fingers and `stage.startDrag()` when one finger is left. `isPinchingRef` stops the tap that fires as fingers lift (60 ms). Change it as a whole and test on a real touch device.
- `scaleRef` and `stagePosRef` mirror the store values for the event handlers. Keep them in step if you add a new gesture.
- Two zoom limits exist: the canvas clamps wheel and pinch to 0.12 to 4, while `uiStore` clamps to 0.1 to 5 and drives the zoom buttons.
- Saved seats override the layout. The rehydrate `merge` in `churchStore.js` lays saved seats (x, y and section included) over a fresh layout and keeps ids that no longer exist. After moving, renaming or removing seats, a phone with old data shows the old seats until Submit or Reset, both of which call `resetAll()`. Seat ids double as storage keys, so rename them only on purpose.
- Some comments in `churchLayout.js` no longer match the loops (for example the left block comment says 5 rows, the loop runs 4). Trust the code.
- `VenueCanvas.jsx`, `RowGroup.jsx` and `SeatCircle.jsx` in this folder belong to the old generic venue editor. The app does not import them.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
