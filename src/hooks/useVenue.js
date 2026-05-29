/**
 * useVenue.js — Church app version
 *
 * The church app stores all seat state in Zustand + localStorage
 * via churchStore (no IDB needed for seat assignments).
 *
 * This hook is kept as a harmless no-op so App.jsx doesn't need
 * to change, and it future-proofs the codebase for venue-config
 * loading if needed later.
 */
export function useVenue() {
  return { isLoading: false, error: null }
}
