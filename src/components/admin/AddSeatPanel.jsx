import React from 'react'
import { useUiStore } from '../../store/uiStore.js'
import { useVenueStore } from '../../store/venueStore.js'

const SEAT_TYPES = [
  { id: 'standard',   label: 'Standard',      icon: '⬤', color: 'text-green-600' },
  { id: 'vip',        label: 'VIP',           icon: '★', color: 'text-pink-600'  },
  { id: 'wheelchair', label: 'Accessible ♿', icon: '⬤', color: 'text-blue-600'  },
  { id: 'staff',      label: 'Staff',         icon: '⬤', color: 'text-teal-600'  },
]

/**
 * AddSeatPanel
 * Right-hand panel in the venue editor.
 * Lets the admin choose seat type then click "Place" to activate drawing mode.
 * Also shows aggregate seat type counts.
 */
export default function AddSeatPanel() {
  const drawingMode = useUiStore(s => s.drawingMode)
  const newSeatType = useUiStore(s => s.newSeatType)
  const setDrawing  = useUiStore(s => s.setDrawingMode)
  const setType     = useUiStore(s => s.setNewSeatType)
  const seats       = useVenueStore(s => s.seats)

  const seatsArr = Object.values(seats)
  const typeCounts = SEAT_TYPES.reduce((acc, t) => {
    acc[t.id] = seatsArr.filter(s => s.type === t.id).length
    return acc
  }, {})

  return (
    <div className="w-64 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 text-sm mb-0.5">Add Seat</h3>
        <p className="text-xs text-gray-400">Choose type then click on the canvas</p>
      </div>

      {/* Seat type picker */}
      <div className="p-3 space-y-1.5">
        {SEAT_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
              newSeatType === t.id
                ? 'bg-violet-50 border border-violet-200 text-violet-800'
                : 'hover:bg-gray-50 border border-transparent text-gray-700'
            }`}
          >
            <span className={`text-base ${t.color}`}>{t.icon}</span>
            <span className="flex-1 font-medium">{t.label}</span>
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5">
              {typeCounts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Place button */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => setDrawing(!drawingMode)}
          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
            drawingMode
              ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
              : 'bg-violet-600 text-white hover:bg-violet-700'
          }`}
        >
          {drawingMode ? '✕ Cancel placement' : '+ Place seat'}
        </button>
      </div>

      {/* Seat type counts summary */}
      <div className="p-3 mt-auto border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Seat inventory</p>
        <ul className="space-y-1">
          {SEAT_TYPES.map(t => (
            <li key={t.id} className="flex items-center justify-between text-xs text-gray-600">
              <span className={`${t.color} font-medium`}>{t.label}</span>
              <span className="font-mono text-gray-500">{typeCounts[t.id]}</span>
            </li>
          ))}
          <li className="flex items-center justify-between text-xs font-semibold text-gray-800 border-t border-gray-100 pt-1 mt-1">
            <span>Total</span>
            <span className="font-mono">{seatsArr.length}</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
