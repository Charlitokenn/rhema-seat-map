import React, { useState } from 'react'
import { Stage, Layer, Rect, Text, Circle, Group } from 'react-konva'
import { useVenueStore } from '../../store/venueStore.js'
import { useUiStore } from '../../store/uiStore.js'
import { useSync } from '../../hooks/useSync.js'
import { dbSaveVenue, dbSaveSeat, dbDeleteSeat } from '../../db/index.js'
import { STATUS_COLOR, TYPE_STROKE, SEAT_RADIUS } from '../../data/sampleVenue.js'
import AddSeatPanel from './AddSeatPanel.jsx'

/**
 * VenueEditor
 * Full-page admin editor.
 * - Drag seats to reposition them (saved to IDB + sync queue).
 * - Click a seat to select it; delete selected seat.
 * - Click empty canvas to place a new seat (when drawingMode === true).
 * - Save venue dimensions/name.
 */
export default function VenueEditor() {
  const venue        = useVenueStore(s => s.venue)
  const seats        = useVenueStore(s => s.seats)
  const setVenue     = useVenueStore(s => s.setVenue)
  const addSeat      = useVenueStore(s => s.addSeat)
  const removeSeat   = useVenueStore(s => s.removeSeat)
  const toast        = useUiStore(s => s.toast)
  const drawingMode  = useUiStore(s => s.drawingMode)
  const newSeatType  = useUiStore(s => s.newSeatType)
  const setDrawing   = useUiStore(s => s.setDrawingMode)

  const { mutateSeatPosition } = useSync()

  const [selectedId, setSelectedId] = useState(null)
  const [venueName, setVenueName]   = useState(venue?.name ?? '')
  const [saving, setSaving]         = useState(false)

  const seatsArr = Object.values(seats)

  // ── Place new seat on canvas click ────────────────────────────────────────
  function handleStageClick(e) {
    if (!drawingMode) {
      // Deselect when clicking empty space
      if (e.target === e.currentTarget) setSelectedId(null)
      return
    }

    const stage   = e.target.getStage()
    const pointer = stage.getPointerPosition()
    const scale   = stage.scaleX()
    const pos     = { x: stage.x(), y: stage.y() }

    // Convert screen coords to canvas coords
    const x = (pointer.x - pos.x) / scale
    const y = (pointer.y - pos.y) / scale

    // Generate a unique seat id
    const id = `NEW-${Date.now()}`
    const newSeat = {
      id,
      row:         'X',
      number:      seatsArr.length + 1,
      section:     'N',
      x,
      y,
      status:      'available',
      type:        newSeatType,
      occupantName: null,
      venueId:     venue.id,
      updatedAt:   Date.now(),
    }

    addSeat(newSeat)
    dbSaveSeat(newSeat).catch(console.error)
    toast(`Seat placed at (${Math.round(x)}, ${Math.round(y)})`, 'info', 1500)
    setDrawing(false)
  }

  // ── Delete selected seat ───────────────────────────────────────────────────
  async function handleDeleteSelected() {
    if (!selectedId) return
    removeSeat(selectedId)
    await dbDeleteSeat(selectedId)
    setSelectedId(null)
    toast('Seat removed', 'info', 1500)
  }

  // ── Save venue name ────────────────────────────────────────────────────────
  async function handleSaveVenue() {
    if (!venue) return
    setSaving(true)
    try {
      const updated = { ...venue, name: venueName.trim() || venue.name, updatedAt: Date.now() }
      setVenue(updated)
      await dbSaveVenue(updated)
      toast('Venue saved', 'success')
    } catch (err) {
      toast(`Save failed: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!venue) return (
    <div className="h-full flex items-center justify-center text-gray-400">
      No venue loaded
    </div>
  )

  const EDIT_SCALE = 0.9

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Editor toolbar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3">
        <input
          type="text"
          value={venueName}
          onChange={e => setVenueName(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1 max-w-xs focus:outline-none focus:ring-2 focus:ring-violet-400"
          placeholder="Venue name"
        />
        <button
          onClick={handleSaveVenue}
          disabled={saving}
          className="px-3 py-1.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {selectedId && (
          <button
            onClick={handleDeleteSelected}
            className="px-3 py-1.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 border border-red-200"
          >
            Delete seat
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {seatsArr.length} seats · drag to reposition
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className={`flex-1 overflow-hidden relative ${drawingMode ? 'cursor-crosshair' : ''}`}>
          <Stage
            width={window.innerWidth - 260}
            height={window.innerHeight - 120}
            scaleX={EDIT_SCALE}
            scaleY={EDIT_SCALE}
            x={20} y={20}
            onClick={handleStageClick}
            onTap={handleStageClick}
          >
            <Layer>
              {/* Floor */}
              <Rect x={0} y={0} width={venue.width} height={venue.height}
                fill="#f9fafb" stroke="#e5e7eb" strokeWidth={1} cornerRadius={8} />

              {/* Stage block */}
              {venue.stageRect && (
                <>
                  <Rect {...venue.stageRect} fill="#e5e7eb" stroke="#d1d5db"
                    strokeWidth={1} cornerRadius={6} />
                  <Text x={venue.stageRect.x} y={venue.stageRect.y + venue.stageRect.height / 2 - 8}
                    width={venue.stageRect.width} text={venue.stageLabel || 'STAGE'}
                    fontSize={14} fill="#9ca3af" align="center" />
                </>
              )}

              {/* Grid dots */}
              {Array.from({ length: Math.floor(venue.width / 40) }, (_, i) =>
                Array.from({ length: Math.floor(venue.height / 40) }, (_, j) => (
                  <Circle key={`g${i}-${j}`} x={(i + 1) * 40} y={(j + 1) * 40}
                    radius={1} fill="#d1d5db" listening={false} />
                ))
              )}

              {/* Seats */}
              {seatsArr.map(seat => {
                const isSelected = seat.id === selectedId
                return (
                  <Group
                    key={seat.id}
                    x={seat.x} y={seat.y}
                    draggable
                    onClick={() => setSelectedId(seat.id)}
                    onTap={() => setSelectedId(seat.id)}
                    onDragEnd={e => {
                      mutateSeatPosition(seat.id, e.target.x(), e.target.y())
                    }}
                    perfectDrawEnabled={false}
                  >
                    <Circle
                      radius={SEAT_RADIUS}
                      fill={isSelected ? '#6d28d9' : (STATUS_COLOR[seat.status] ?? '#22c55e')}
                      stroke={isSelected ? '#4c1d95' : (TYPE_STROKE[seat.type] ?? '#15803d')}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <Text
                      text={String(seat.number)}
                      fontSize={8} fill="#fff"
                      x={-SEAT_RADIUS} y={-4}
                      width={SEAT_RADIUS * 2}
                      align="center" listening={false}
                    />
                  </Group>
                )
              })}
            </Layer>
          </Stage>

          {/* Drawing mode overlay hint */}
          {drawingMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
              Click anywhere on the canvas to place a new seat
            </div>
          )}
        </div>

        {/* Side panel */}
        <AddSeatPanel />
      </div>
    </div>
  )
}
