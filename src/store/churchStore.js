import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateInitialSeats } from '../data/churchLayout.js'

/**
 * churchStore
 * Manages M / W / C occupancy for every seat in the church hall.
 * Persisted to localStorage — survives page refresh.
 * Call resetAll() to clear between services.
 */
export const useChurchStore = create(
  persist(
    (set, get) => ({
      // seats: { [id]: { id, x, y, section, occupantType: null|'M'|'W'|'C' } }
      seats: generateInitialSeats(),

      /** Assign an occupant type to a seat */
      setSeatOccupant(id, type) {
        set(s => ({
          seats: { ...s.seats, [id]: { ...s.seats[id], occupantType: type } },
        }))
      },

      /** Clear a single seat back to empty */
      clearSeat(id) {
        set(s => ({
          seats: { ...s.seats, [id]: { ...s.seats[id], occupantType: null } },
        }))
      },

      /** Clear all seats — call between services */
      resetAll() {
        set({ seats: generateInitialSeats() })
      },

      /** Returns live M/W/C/total counts (not reactive — call inline) */
      getCounts() {
        const arr = Object.values(get().seats)
        const men      = arr.filter(s => s.occupantType === 'M').length
        const women    = arr.filter(s => s.occupantType === 'W').length
        const children = arr.filter(s => s.occupantType === 'C').length
        return { men, women, children, total: men + women + children }
      },
    }),
    {
      name: 'church-seat-states',
      // Only persist the seat map
      partialize: state => ({ seats: state.seats }),
      // On rehydration: layer persisted states over fresh layout
      // so any new seats added to the layout aren't lost
      merge: (persisted, current) => ({
        ...current,
             seats: {
                   ...current.seats,
                   ...((persisted && typeof persisted === 'object' && persisted.seats) || {}),
       },
      }),
    }
  )
)
