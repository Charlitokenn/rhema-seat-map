/**
 * sampleVenue.js
 * Pre-built church hall (Gereja Surya) layout.
 * Canvas: 860 × 640 px.
 * Stage block at top. Three sections (Left / Center / Right).
 * Rows A–J (10 rows). Seat types mixed in.
 */

const SEAT_R = 13       // circle radius
const COL_GAP = 32      // horizontal spacing between seats
const ROW_GAP = 36      // vertical spacing between rows
const STAGE_H = 70      // height of stage block
const TOP_PAD = 100     // gap below stage before first row

// Section column starts and widths
const SECTIONS = [
  { id: 'L', label: 'Left',   cols: 6, xStart: 40  },
  { id: 'C', label: 'Center', cols: 8, xStart: 270 },
  { id: 'R', label: 'Right',  cols: 6, xStart: 590 },
]

const ROWS = ['A','B','C','D','E','F','G','H','I','J']

// A few VIP rows in the center section
const VIP_ROWS = new Set(['A','B'])

// Wheelchair seats — aisle positions at end of each side section
function isWheelchair(sectionId, row, col, totalCols) {
  return sectionId !== 'C' && (col === 0 || col === totalCols - 1) && row === 'J'
}

function generateSeats() {
  const seats = []

  SECTIONS.forEach(section => {
    ROWS.forEach((row, rowIdx) => {
      for (let col = 0; col < section.cols; col++) {
        const id = `${section.id}${row}${col + 1}`
        const x  = section.xStart + col * COL_GAP + SEAT_R
        const y  = TOP_PAD + rowIdx * ROW_GAP + SEAT_R

        let type = 'standard'
        if (section.id === 'C' && VIP_ROWS.has(row))           type = 'vip'
        if (isWheelchair(section.id, row, col, section.cols))  type = 'wheelchair'

        // Pre-fill a few occupied seats so the demo looks realistic
        const demoOccupied = Math.random() < 0.18
        const demoReserved = !demoOccupied && Math.random() < 0.08

        seats.push({
          id,
          row:    `${section.id}${row}`,
          number: col + 1,
          section: section.id,
          x,
          y,
          status:      demoOccupied ? 'occupied' : demoReserved ? 'reserved' : 'available',
          type,
          occupantName: demoOccupied ? null : null,
          updatedAt: Date.now(),
        })
      }
    })
  })

  return seats
}

export const SAMPLE_VENUE = {
  id:        'venue-gereja-surya',
  name:      'Gereja Surya — Main Hall',
  width:     860,
  height:    480,
  stageLabel:'STAGE / ALTAR',
  stageRect: { x: 150, y: 10, width: 560, height: STAGE_H - 10 },
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

export const SAMPLE_SEATS = generateSeats()

/**
 * Seat status → fill color mapping (mirrors CSS custom properties).
 * Used by Konva canvas shapes — not Tailwind classes.
 */
export const STATUS_COLOR = {
  available:  '#22c55e',
  occupied:   '#ef4444',
  reserved:   '#f59e0b',
  blocked:    '#6b7280',
}

export const TYPE_STROKE = {
  standard:   '#15803d',  // darker green border
  vip:        '#be185d',  // pink border
  wheelchair: '#1d4ed8',  // blue border
  staff:      '#0f766e',  // teal border
}

export const SEAT_RADIUS = SEAT_R
