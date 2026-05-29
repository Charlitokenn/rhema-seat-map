import { useState, useCallback } from 'react'

/**
 * useSync — Church app version
 *
 * For the church use case, saving to Google Sheets is handled directly
 * by ServiceLegend via gasRequest (one-shot POST per service session).
 *
 * This hook is kept so App.jsx can show a sync-pending indicator if
 * any future background operations are queued. Currently returns safe
 * zero-state defaults.
 */
export function useSync() {
  const [isSyncing] = useState(false)

  const drainQueue = useCallback(async () => {
    // No-op for church app — saving is explicit via ServiceLegend "Save" button
  }, [])

  return {
    pendingCount:       0,
    isSyncing,
    drainQueue,
    mutateSeat:         () => {},
    mutateBulk:         () => {},
    mutateSeatPosition: () => {},
  }
}
