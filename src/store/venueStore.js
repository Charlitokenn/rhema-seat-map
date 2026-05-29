import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

/**
 * venueStore
 * Holds the canonical in-memory state for the current venue.
 * IndexedDB is the persistence layer; this store is loaded from IDB on boot.
 *
 * seats: { [id: string]: Seat }   — flat map for O(1) lookup
 * selectedIds: string[]           — currently selected seat ids
 */
export const useVenueStore = create(
  subscribeWithSelector((set, get) => ({
    // ── State ──────────────────────────────────────────────────────────────
    venue: null,
    seats: {},          // keyed by seat id
    selectedIds: [],    // multi-select support
    isDirty: false,     // true if unsaved changes exist

    // ── Venue actions ───────────────────────────────────────────────────────
    setVenue(venue) {
      set({ venue })
    },

    setSeats(seatsArray) {
      const map = {}
      seatsArray.forEach(s => { map[s.id] = s })
      set({ seats: map, selectedIds: [], isDirty: false })
    },

    // ── Seat mutation ────────────────────────────────────────────────────────
    /**
     * Update a single seat's fields. Marks the store dirty.
     * Does NOT write to IDB — callers must persist via useSync.
     */
    updateSeat(id, patch) {
      const seats = get().seats
      if (!seats[id]) return
      set({
        seats: {
          ...seats,
          [id]: { ...seats[id], ...patch, updatedAt: Date.now() }
        },
        isDirty: true
      })
    },

    /**
     * Bulk-update multiple seats. Used for mass status changes.
     */
    bulkUpdateSeats(ids, patch) {
      const seats = { ...get().seats }
      const now = Date.now()
      ids.forEach(id => {
        if (seats[id]) seats[id] = { ...seats[id], ...patch, updatedAt: now }
      })
      set({ seats, isDirty: true })
    },

    /**
     * Update a seat's canvas position (edit mode drag).
     */
    moveSeat(id, x, y) {
      const seats = get().seats
      if (!seats[id]) return
      set({
        seats: {
          ...seats,
          [id]: { ...seats[id], x, y, updatedAt: Date.now() }
        },
        isDirty: true
      })
    },

    addSeat(seat) {
      const seats = get().seats
      set({
        seats: { ...seats, [seat.id]: seat },
        isDirty: true
      })
    },

    removeSeat(id) {
      const seats = { ...get().seats }
      delete seats[id]
      set({ seats, isDirty: true })
    },

    // ── Selection ────────────────────────────────────────────────────────────
    selectSeat(id, shiftHeld = false) {
      const { selectedIds } = get()
      if (shiftHeld) {
        // Toggle in/out of selection
        if (selectedIds.includes(id)) {
          set({ selectedIds: selectedIds.filter(x => x !== id) })
        } else {
          set({ selectedIds: [...selectedIds, id] })
        }
      } else {
        // Single select (or deselect if already sole selection)
        if (selectedIds.length === 1 && selectedIds[0] === id) {
          set({ selectedIds: [] })
        } else {
          set({ selectedIds: [id] })
        }
      }
    },

    selectAll() {
      set({ selectedIds: Object.keys(get().seats) })
    },

    clearSelection() {
      set({ selectedIds: [] })
    },

    selectByStatus(status) {
      const ids = Object.values(get().seats)
        .filter(s => s.status === status)
        .map(s => s.id)
      set({ selectedIds: ids })
    },

    markClean() {
      set({ isDirty: false })
    },

    // ── Derived helpers (not reactive — call inline) ────────────────────────
    getSelectedSeats() {
      const { seats, selectedIds } = get()
      return selectedIds.map(id => seats[id]).filter(Boolean)
    },

    getSeatsByRow() {
      const rows = {}
      Object.values(get().seats).forEach(seat => {
        if (!rows[seat.row]) rows[seat.row] = []
        rows[seat.row].push(seat)
      })
      // Sort seats within each row by number
      Object.values(rows).forEach(r => r.sort((a, b) => a.number - b.number))
      return rows
    },

    getStats() {
      const seats = Object.values(get().seats)
      return {
        total:     seats.length,
        available: seats.filter(s => s.status === 'available').length,
        occupied:  seats.filter(s => s.status === 'occupied').length,
        reserved:  seats.filter(s => s.status === 'reserved').length,
        blocked:   seats.filter(s => s.status === 'blocked').length,
      }
    }
  }))
)
