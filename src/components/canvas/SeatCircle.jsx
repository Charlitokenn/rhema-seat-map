import React, { memo, useRef, useCallback } from 'react'
import { Group, Circle, Text } from 'react-konva'
import { STATUS_COLOR, TYPE_STROKE, SEAT_RADIUS } from '@/data/sampleVenue.js'

const SELECTED_COLOR  = '#6d28d9'
const SELECTED_STROKE = '#4c1d95'

/**
 * SeatCircle
 * Renders one seat as a Konva Circle + Text label.
 * Color encodes:
 *   fill   → seat status (available/occupied/reserved/blocked)
 *   stroke → seat type  (standard/vip/wheelchair/staff) or selection
 *
 * Handles:
 *   onClick / onTap — selection (shift for multi-select)
 *   drag            — repositioning in editor mode
 */
const SeatCircle = memo(function SeatCircle({
  seat,
  isSelected,
  isDraggable,
  onSeatClick,
  onSeatDragEnd,
}) {
  const shiftRef = useRef(false)

  // Track shift key state at pointer down so it's reliable on touch
  const handlePointerDown = useCallback(e => {
    shiftRef.current = e.evt?.shiftKey ?? false
  }, [])

  const handleClick = useCallback(() => {
    if (isDraggable) return  // don't select while dragging in edit mode
    onSeatClick(seat.id, shiftRef.current)
  }, [seat.id, isDraggable, onSeatClick])

  const handleDragEnd = useCallback(e => {
    const node = e.target
    onSeatDragEnd(seat.id, node.x(), node.y())
  }, [seat.id, onSeatDragEnd])

  const fill   = isSelected ? SELECTED_COLOR  : (STATUS_COLOR[seat.status] ?? '#22c55e')
  const stroke = isSelected ? SELECTED_STROKE : (TYPE_STROKE[seat.type]   ?? '#15803d')
  const strokeWidth = isSelected ? 2.5 : 1.5

  // Shrink blocked seats slightly for visual distinction
  const radius = seat.status === 'blocked' ? SEAT_RADIUS * 0.8 : SEAT_RADIUS

  return (
    <Group
      x={seat.x}
      y={seat.y}
      draggable={isDraggable}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={isDraggable ? handleDragEnd : undefined}
      perfectDrawEnabled={false}
      shadowForStrokeEnabled={false}
    >
      <Circle
        radius={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={seat.status === 'blocked' ? 0.5 : 1}
      />
      {/* Seat number label — shown below the circle */}
      <Text
        text={String(seat.number)}
        fontSize={8}
        fontFamily="Inter, monospace"
        fill={isSelected ? '#ede9fe' : '#fff'}
        x={-SEAT_RADIUS}
        y={-4}
        width={SEAT_RADIUS * 2}
        align="center"
        listening={false}
        perfectDrawEnabled={false}
      />
      {/* Type indicator for VIP / wheelchair */}
      {(seat.type === 'vip') && (
        <Text
          text="★"
          fontSize={7}
          fill="#fff"
          x={-SEAT_RADIUS}
          y={SEAT_RADIUS - 8}
          width={SEAT_RADIUS * 2}
          align="center"
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      {seat.type === 'wheelchair' && (
        <Text
          text="♿"
          fontSize={9}
          fill="#fff"
          x={-SEAT_RADIUS}
          y={-5}
          width={SEAT_RADIUS * 2}
          align="center"
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
    </Group>
  )
})

export default SeatCircle
