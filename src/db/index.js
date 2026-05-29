import { openDB } from 'idb'

const DB_NAME    = 'venue-map-db'
const DB_VERSION = 1

/**
 * Opens (or upgrades) the IndexedDB database.
 * Three object stores:
 *   venues    — venue metadata, keyed by id
 *   seats     — individual seats, keyed by id, indexed by venueId
 *   syncQueue — pending mutations awaiting server sync, keyed by auto-increment id
 */
let dbPromise = null

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Venues store
        if (!db.objectStoreNames.contains('venues')) {
          db.createObjectStore('venues', { keyPath: 'id' })
        }

        // Seats store
        if (!db.objectStoreNames.contains('seats')) {
          const seatStore = db.createObjectStore('seats', { keyPath: 'id' })
          seatStore.createIndex('byVenueId', 'venueId', { unique: false })
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const qStore = db.createObjectStore('syncQueue', {
            keyPath: 'queueId',
            autoIncrement: true
          })
          qStore.createIndex('byCreatedAt', 'createdAt', { unique: false })
        }
      }
    })
  }
  return dbPromise
}

// ── Venue CRUD ───────────────────────────────────────────────────────────────

export async function dbGetAllVenues() {
  const db = await getDb()
  return db.getAll('venues')
}

export async function dbGetVenue(id) {
  const db = await getDb()
  return db.get('venues', id)
}

export async function dbSaveVenue(venue) {
  const db = await getDb()
  return db.put('venues', { ...venue, updatedAt: Date.now() })
}

export async function dbDeleteVenue(id) {
  const db = await getDb()
  const tx = db.transaction(['venues', 'seats'], 'readwrite')
  // Delete all seats for this venue
  const index = tx.objectStore('seats').index('byVenueId')
  let cursor = await index.openCursor(IDBKeyRange.only(id))
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }
  await tx.objectStore('venues').delete(id)
  await tx.done
}

// ── Seat CRUD ────────────────────────────────────────────────────────────────

export async function dbGetSeats(venueId) {
  const db = await getDb()
  return db.getAllFromIndex('seats', 'byVenueId', venueId)
}

export async function dbSaveSeat(seat) {
  const db = await getDb()
  return db.put('seats', seat)
}

export async function dbSaveSeats(seats) {
  const db = await getDb()
  const tx = db.transaction('seats', 'readwrite')
  await Promise.all(seats.map(s => tx.store.put(s)))
  await tx.done
}

export async function dbDeleteSeat(id) {
  const db = await getDb()
  return db.delete('seats', id)
}

// ── Sync queue ───────────────────────────────────────────────────────────────

/**
 * Enqueue a sync operation.
 * @param {'batchUpdateSeats'|'upsertVenue'|'deleteSeat'} operation
 * @param {object} payload — data to send to the server
 */
export async function dbEnqueueSync(operation, payload) {
  const db = await getDb()
  return db.add('syncQueue', {
    operation,
    payload,
    createdAt: Date.now(),
    retries: 0,
  })
}

export async function dbGetSyncQueue() {
  const db = await getDb()
  return db.getAllFromIndex('syncQueue', 'byCreatedAt')
}

export async function dbDeleteSyncEntry(queueId) {
  const db = await getDb()
  return db.delete('syncQueue', queueId)
}

export async function dbClearSyncQueue() {
  const db = await getDb()
  return db.clear('syncQueue')
}

export async function dbIncrementRetries(queueId) {
  const db = await getDb()
  const entry = await db.get('syncQueue', queueId)
  if (!entry) return
  return db.put('syncQueue', { ...entry, retries: (entry.retries || 0) + 1 })
}
