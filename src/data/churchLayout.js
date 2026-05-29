export const SEAT_W = 24
export const SEAT_H = 24

// ======================================================
// SPACING CONFIGURATION
// ======================================================

// Internal seat spacing
const GAP_X = 38
const GAP_Y = 38

// Smaller blocks spacing
const SMALL_GAP_X = 35
const SMALL_GAP_Y = 35

// Bottom row spacing
const BOTTOM_GAP = 38

// Space between major sections
const SECTION_GAP = 35

// Center block configuration
const CENTER_COLS = 9
const CENTER_ROWS = 4
const CENTER_LAST_ROW_SEATS = 5 // 👈 configurable (default)

// ======================================================
// BASE POSITIONS
// ======================================================

const TOP_Y = 110
const MAIN_Y = 430
const SIDE_Y = 480
const BOTTOM_Y = 630
const MEDIA_Y = 690

// ======================================================
// SECTION X POSITIONS
// ======================================================

// Worshipers
const WORSHIPERS_X = 180

// Left small block
const LEFT_SMALL_X = 120

// Main left block
const LEFT_BLOCK_X = 340

// Center block positioned relative to left block
const CENTER_BLOCK_X =
    LEFT_BLOCK_X + (5 * GAP_X) + SECTION_GAP

// Right block positioned relative to center block
const RIGHT_BLOCK_X =
    CENTER_BLOCK_X + (9 * GAP_X) + SECTION_GAP

// Far right small block
const FAR_RIGHT_X =
    RIGHT_BLOCK_X + (6 * GAP_X) + SECTION_GAP

// ======================================================
// TABLE POSITIONS
// ======================================================

export const TABLES = [
  {
    id: 'tbl-left-1',
    x: LEFT_BLOCK_X + 125,
    y: 400,
  },

  {
    id: 'tbl-center-1',
    x: CENTER_BLOCK_X + 125,
    y: 400,
  },

  {
    id: 'tbl-center-2',
    x: CENTER_BLOCK_X + 240,
    y: 400,
  },

  {
    id: 'tbl-right-1',
    x: RIGHT_BLOCK_X + 50,
    y: 400,
  },

  {
    id: 'tbl-right-2',
    x: RIGHT_BLOCK_X + 163,
    y: 400,
  },
  {
    id: 'tbl-right-3',
    x: RIGHT_BLOCK_X + 272,
    y: 450,
  },
  {
    id: 'tbl-right-4',
    x: RIGHT_BLOCK_X + 378,
    y: 450,
  },
]

// ======================================================
// SEAT FACTORY
// ======================================================

function makeSeat(id, x, y, section) {
  return {
    id,
    x,
    y,
    section,
    occupantType: null,
  }
}

// ======================================================
// GENERATE SEATS
// ======================================================

export function generateInitialSeats() {
  const seats = {}

  const add = (id, x, y, section) => {
    seats[id] = makeSeat(id, x, y, section)
  }

  // ======================================================
  // WORSHIPERS
  // 5 rows × 4 cols
  // ======================================================

  const WORSHIPERS_ROWS = 5
  const WORSHIPERS_COLS = 4
  const WORSHIPERS_LAST_ROW_SEATS = 3

  for (let r = 0; r < WORSHIPERS_ROWS; r++) {

    // Last row becomes one seat shorter
    const cols =
        r === WORSHIPERS_ROWS - 1
            ? WORSHIPERS_LAST_ROW_SEATS
            : WORSHIPERS_COLS

    for (let c = 0; c < cols; c++) {
      add(
          `WS-${r}-${c}`,
          WORSHIPERS_X + c * SMALL_GAP_X,
          TOP_Y + r * SMALL_GAP_Y,
          'worshipers'
      )
    }
  }

  // Keyboardist's seat
  add(
      'WS-SINGLE-0',
      WORSHIPERS_X + 1110, // opposite side (left side))
      TOP_Y , // vertically centered
      'worshipers'
  )

  // ======================================================
  // LEFT SMALL
  // 3 rows × 4 cols
  // ======================================================

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      add(
          `LS-${r}-${c}`,
          LEFT_SMALL_X + c * SMALL_GAP_X,
          SIDE_Y + r * SMALL_GAP_Y,
          'left-small'
      )
    }
  }

  // ======================================================
  // LEFT BLOCK
  // 5 rows × 5 cols
  // ======================================================

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      add(
          `LB-${r}-${c}`,
          LEFT_BLOCK_X + c * GAP_X,
          MAIN_Y + r * GAP_Y,
          'left-block'
      )
    }
  }

  // Top row around left table
  add('LTR-0', LEFT_BLOCK_X + 38, 390, 'left-block')
  add('LTR-1', LEFT_BLOCK_X + 75, 390, 'left-block')
  add('LTR-2', LEFT_BLOCK_X + 152, 390, 'left-block')

  // ======================================================
  // CENTER BLOCK
  // 4 rows × 9 cols
  // ======================================================
  // First 3 rows → full 9 columns
  for (let r = 0; r < CENTER_ROWS - 1; r++) {
    for (let c = 0; c < CENTER_COLS; c++) {
      add(
          `CB-${r}-${c}`,
          CENTER_BLOCK_X + c * GAP_X,
          MAIN_Y + r * GAP_Y,
          'center'
      )
    }
  }

// Last row → configurable number of seats
  const lastRowIndex = CENTER_ROWS - 1

  for (let c = 0; c < CENTER_LAST_ROW_SEATS; c++) {
    add(
        `CB-${lastRowIndex}-${c}`,
        CENTER_BLOCK_X + c * GAP_X,
        MAIN_Y + lastRowIndex * GAP_Y,
        'center'
    )
  }

  // Center table row
  add('CTR-0', CENTER_BLOCK_X + 75, 390, 'center')
  add('CTR-1', CENTER_BLOCK_X + 152, 390, 'center')
  add('CTR-2', CENTER_BLOCK_X + 189, 390, 'center')
  add('CTR-3', CENTER_BLOCK_X + 265, 390, 'center')

  // ======================================================
  // RIGHT BLOCK
  // 5 rows × 6 cols
  // ======================================================

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      add(
          `RB-${r}-${c}`,
          RIGHT_BLOCK_X + c * GAP_X,
          MAIN_Y + r * GAP_Y,
          'right'
      )
    }
  }

  // Right table row
  add('RTR-0', RIGHT_BLOCK_X + 75, 390, 'right')
  add('RTR-1', RIGHT_BLOCK_X + 112, 390, 'right')
  add('RTR-2', RIGHT_BLOCK_X + 188, 390, 'right')

  // ======================================================
  // FAR RIGHT SMALL
  // 2 rows × 6 cols
  // ======================================================

  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 6; c++) {
      add(
          `FR-${r}-${c}`,
          FAR_RIGHT_X + c * SMALL_GAP_X,
          SIDE_Y + r * SMALL_GAP_Y,
          'far-right'
      )
    }
  }

  add('PT-0', RIGHT_BLOCK_X + 297, 440, 'right')
  add('PT-1', RIGHT_BLOCK_X + 332, 440, 'right')
  add('PT-2', RIGHT_BLOCK_X + 402, 440, 'right')
  add('PT-3', RIGHT_BLOCK_X + 438, 440, 'right')
  // ======================================================
  // BOTTOM LEFT
  // ======================================================

  for (let i = 0; i < 9; i++) {
    add(
        `BL-${i}`,
        180 + i * BOTTOM_GAP,
        BOTTOM_Y,
        'bottom-left'
    )
  }

  // ======================================================
  // BOTTOM RIGHT
  // ======================================================

  for (let i = 0; i < 6; i++) {
    add(
        `BR-${i}`,
        RIGHT_BLOCK_X + i * BOTTOM_GAP,
        BOTTOM_Y,
        'bottom-right'
    )
  }

  // ======================================================
  // MEDIA SEATS
  // ======================================================

  for (let i = 0; i < 5; i++) {
    add(
        `MS-${i}`,
        CENTER_BLOCK_X + 190 + i * SMALL_GAP_X,
        MEDIA_Y,
        'media'
    )
  }

  // ======================================================
  // ENTRANCE DOOR USHER'S SEATS
  // ======================================================
  add(
      'US-SINGLE-0',
      CENTER_BLOCK_X + 120, // opposite side (left side))
      BOTTOM_Y + 30 , // vertically centered
      'worshipers'
  )

  return seats
}

// ======================================================
// INITIAL STATE
// ======================================================

export const INITIAL_SEATS = generateInitialSeats()

// ======================================================
// TOTAL CAPACITY
// ======================================================

export const TOTAL_SEATS =
    Object.keys(INITIAL_SEATS).length