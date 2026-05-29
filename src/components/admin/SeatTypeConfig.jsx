import React, { useState, useMemo } from 'react'
import { useVenueStore } from '../../store/venueStore.js'
import { useSync } from '../../hooks/useSync.js'

const SEAT_TYPES = ['standard', 'vip', 'wheelchair', 'staff']

const TYPE_COLORS = {
  standard:   'bg-green-100 text-green-800 border-green-200',
  vip:        'bg-pink-100  text-pink-800  border-pink-200',
  wheelchair: 'bg-blue-100  text-blue-800  border-blue-200',
  staff:      'bg-teal-100  text-teal-800  border-teal-200',
}

const TYPE_DOT = {
  standard:   'bg-green-500',
  vip:        'bg-pink-500',
  wheelchair: 'bg-blue-500',
  staff:      'bg-teal-500',
}

/**
 * SeatTypeConfig
 * Table view of all seats grouped by row, with inline type editing.
 * Supports bulk type-change by section.
 */
export default function SeatTypeConfig() {
  const seats       = useVenueStore(s => s.seats)
  const getSeatsByRow = useVenueStore(s => s.getSeatsByRow)
  const { mutateSeat, mutateBulk } = useSync()

  const [bulkSection, setBulkSection] = useState('C')
  const [bulkType, setBulkType]       = useState('vip')
  const [search, setSearch]           = useState('')

  const rowMap = useMemo(() => getSeatsByRow(), [seats]) // eslint-disable-line react-hooks/exhaustive-deps

  const sections = useMemo(() => {
    const set = new Set(Object.values(seats).map(s => s.section))
    return [...set].sort()
  }, [seats])

  function handleBulkApply() {
    const ids = Object.values(seats)
      .filter(s => s.section === bulkSection)
      .map(s => s.id)
    if (ids.length === 0) return
    mutateBulk(ids, { type: bulkType })
  }

  const filteredRows = Object.entries(rowMap).filter(([rowId]) =>
    !search || rowId.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <h2 className="font-semibold text-gray-900 text-sm mb-0.5">Seat Type Configuration</h2>
        <p className="text-xs text-gray-400">Assign types to individual seats or apply bulk changes by section.</p>
      </div>

      {/* Bulk action bar */}
      <div className="flex-shrink-0 bg-violet-50 border-b border-violet-100 px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Bulk change</span>

        <select
          value={bulkSection}
          onChange={e => setBulkSection(e.target.value)}
          className="border border-violet-200 bg-white rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          {sections.map(s => (
            <option key={s} value={s}>Section {s}</option>
          ))}
        </select>

        <span className="text-xs text-violet-500">→</span>

        <select
          value={bulkType}
          onChange={e => setBulkType(e.target.value)}
          className="border border-violet-200 bg-white rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 capitalize"
        >
          {SEAT_TYPES.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>

        <button
          onClick={handleBulkApply}
          className="px-3 py-1.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700"
        >
          Apply to section
        </button>

        {/* Search */}
        <div className="ml-auto">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter rows…"
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>
      </div>

      {/* Seat table */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredRows.map(([rowId, rowSeats]) => (
          <div key={rowId} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Row {rowId}</span>
              <span className="text-xs text-gray-400">{rowSeats.length} seats</span>
            </div>

            <div className="p-3 flex flex-wrap gap-2">
              {rowSeats.map(seat => (
                <div key={seat.id} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400 font-mono">{seat.number}</span>
                  <select
                    value={seat.type}
                    onChange={e => mutateSeat(seat.id, { type: e.target.value })}
                    className={`text-[10px] font-medium border rounded-lg px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-400 cursor-pointer ${TYPE_COLORS[seat.type]}`}
                  >
                    {SEAT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredRows.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-16">
            No rows match "{search}"
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-2 flex items-center gap-4">
        {SEAT_TYPES.map(t => (
          <span key={t} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className={`w-2.5 h-2.5 rounded-full ${TYPE_DOT[t]}`} />
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </span>
        ))}
      </div>
    </div>
  )
}
