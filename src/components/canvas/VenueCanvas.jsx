import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { Stage, Layer, Rect, Text } from 'react-konva'
import { useVenueStore } from '@/store/venueStore.js'
import { useUiStore } from '@/store/uiStore.js'
import { useSync } from '@/hooks/useSync.js'
import RowGroup from './RowGroup.jsx'

const MIN_SCALE = 0.25
const MAX_SCALE = 5
const ZOOM_SENSITIVITY = 0.001

export default function VenueCanvas() {
  const containerRef = useRef(null)
  const stageRef     = useRef(null)
  const [size, setSize] = useState({ width: 800, height: 600 })

  const venue     = useVenueStore(s => s.venue)
  const seats     = useVenueStore(s => s.seats)
  const selectedIds = useVenueStore(s => s.selectedIds)
  const selectSeat  = useVenueStore(s => s.selectSeat)
  const clearSelection = useVenueStore(s => s.clearSelection)
  const getSeatsByRow  = useVenueStore(s => s.getSeatsByRow)

  const scale     = useUiStore(s => s.scale)
  const stagePos  = useUiStore(s => s.stagePos)
  const editMode  = useUiStore(s => s.editMode)
  const setScale  = useUiStore(s => s.setScale)
  const setStagePos = useUiStore(s => s.setStagePos)

  const { mutateSeatPosition } = useSync()

  // Observe container size
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setSize({ width, height })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Center venue on first load
  useEffect(() => {
    if (!venue || !size.width) return
    const initialScale = Math.min(
      (size.width  * 0.9) / venue.width,
      (size.height * 0.9) / venue.height,
      1
    )
    setScale(initialScale)
    setStagePos({
      x: (size.width  - venue.width  * initialScale) / 2,
      y: (size.height - venue.height * initialScale) / 2,
    })
  }, [venue, size.width]) // eslint-disable-line react-hooks/exhaustive-deps

  // Group seats by row
  const rowMap = useMemo(() => getSeatsByRow(), [seats]) // eslint-disable-line react-hooks/exhaustive-deps

  // Wheel zoom around pointer
  const handleWheel = useCallback(e => {
    e.evt.preventDefault()
    const stage   = stageRef.current
    if (!stage) return
    const oldScale  = scale
    const pointer   = stage.getPointerPosition()
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    }
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale  = Math.max(MIN_SCALE, Math.min(MAX_SCALE,
      oldScale * (1 + direction * ZOOM_SENSITIVITY * Math.abs(e.evt.deltaY))
    ))
    setScale(newScale)
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  }, [scale, stagePos, setScale, setStagePos])

  // Click on empty canvas → clear selection
  const handleStageClick = useCallback(e => {
    if (e.target === e.currentTarget || e.target.getClassName() === 'Stage') {
      clearSelection()
    }
  }, [clearSelection])

  // Drag stage end → update position in store
  const handleDragEnd = useCallback(e => {
    setStagePos({ x: e.target.x(), y: e.target.y() })
  }, [setStagePos])

  if (!venue) return null

  const selectedSet = new Set(selectedIds)

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden touch-none"
      style={{ background: 'var(--canvas-bg)' }}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={editMode !== 'edit'}  // disable stage drag in seat-edit mode
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onDragEnd={handleDragEnd}
      >
        {/* ── Background layer ── */}
        <Layer listening={false}>
          {/* Floor */}
          <Rect
            x={0} y={0}
            width={venue.width}
            height={venue.height}
            fill="#f9fafb"
            cornerRadius={8}
          />

          {/* Stage / altar block */}
          {venue.stageRect && (
            <>
              <Rect
                {...venue.stageRect}
                fill="#e5e7eb"
                stroke="#d1d5db"
                strokeWidth={1}
                cornerRadius={6}
              />
              <Text
                x={venue.stageRect.x}
                y={venue.stageRect.y + venue.stageRect.height / 2 - 8}
                width={venue.stageRect.width}
                text={venue.stageLabel || 'STAGE'}
                fontSize={14}
                fontFamily="Inter, sans-serif"
                fontStyle="600"
                fill="#9ca3af"
                align="center"
              />
            </>
          )}

          {/* Section labels */}
          {[
            { label: 'LEFT',   x: 40  },
            { label: 'CENTER', x: 270 },
            { label: 'RIGHT',  x: 590 },
          ].map(({ label, x }) => (
            <Text
              key={label}
              x={x}
              y={venue.stageRect ? venue.stageRect.y + venue.stageRect.height + 4 : 80}
              width={180}
              text={label}
              fontSize={10}
              fontFamily="Inter, sans-serif"
              fill="#9ca3af"
              align="center"
            />
          ))}
        </Layer>

        {/* ── Seat layer ── */}
        <Layer>
          {Object.entries(rowMap).map(([rowId, rowSeats]) => (
            <RowGroup
              key={rowId}
              rowId={rowId}
              seats={rowSeats}
              selectedSet={selectedSet}
              editMode={editMode}
              onSeatClick={(id, shiftHeld) => selectSeat(id, shiftHeld)}
              onSeatDragEnd={(id, x, y) => mutateSeatPosition(id, x, y)}
            />
          ))}
        </Layer>
      </Stage>

      {/* Zoom level indicator */}
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-gray-500 font-mono select-none pointer-events-none">
        {Math.round(scale * 100)}%
      </div>
    </div>
  )
}
