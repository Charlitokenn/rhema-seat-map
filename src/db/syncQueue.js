import {
  dbGetSyncQueue,
  dbDeleteSyncEntry,
  dbIncrementRetries,
} from './index.js'
import { gasRequest } from '../lib/appsScript.js'

const MAX_RETRIES = 3

/**
 * drainSyncQueue
 * Iterates the sync queue in creation-time order and submits each
 * entry to the Apps Script endpoint. On success the entry is deleted.
 * On failure (up to MAX_RETRIES) the retry counter increments.
 *
 * Coalesces multiple 'batchUpdateSeats' ops for the same venueId
 * into a single network request before sending.
 *
 * @returns {{ sent: number, failed: number }}
 */
export async function drainSyncQueue() {
  if (import.meta.env.VITE_OFFLINE_MODE === 'true') {
    return { sent: 0, failed: 0 }
  }

  const queue = await dbGetSyncQueue()
  if (queue.length === 0) return { sent: 0, failed: 0 }

  // Coalesce seat updates by venueId
  const seatUpdateMap = {}  // venueId → { queueIds[], seats[] }
  const otherOps = []

  queue.forEach(entry => {
    if (entry.operation === 'batchUpdateSeats') {
      const vid = entry.payload.venueId
      if (!seatUpdateMap[vid]) seatUpdateMap[vid] = { queueIds: [], seats: [] }
      seatUpdateMap[vid].queueIds.push(entry.queueId)
      seatUpdateMap[vid].seats.push(...entry.payload.seats)
    } else {
      otherOps.push(entry)
    }
  })

  let sent = 0
  let failed = 0

  // Send coalesced seat updates
  for (const [venueId, batch] of Object.entries(seatUpdateMap)) {
    try {
      await gasRequest('POST', {
        action: 'batchUpdateSeats',
        venueId,
        seats: batch.seats,
      })
      // Remove all coalesced entries
      await Promise.all(batch.queueIds.map(id => dbDeleteSyncEntry(id)))
      sent++
    } catch (err) {
      console.warn('[SyncQueue] batchUpdateSeats failed:', err.message)
      // Increment retry counts; drop entries that exceeded MAX_RETRIES
      for (const qid of batch.queueIds) {
        const entry = queue.find(e => e.queueId === qid)
        if (entry && (entry.retries || 0) >= MAX_RETRIES) {
          await dbDeleteSyncEntry(qid)
        } else {
          await dbIncrementRetries(qid)
        }
      }
      failed++
    }
  }

  // Send other operations sequentially
  for (const entry of otherOps) {
    try {
      await gasRequest('POST', entry.payload)
      await dbDeleteSyncEntry(entry.queueId)
      sent++
    } catch (err) {
      console.warn(`[SyncQueue] ${entry.operation} failed:`, err.message)
      if ((entry.retries || 0) >= MAX_RETRIES) {
        await dbDeleteSyncEntry(entry.queueId)
      } else {
        await dbIncrementRetries(entry.queueId)
      }
      failed++
    }
  }

  return { sent, failed }
}
