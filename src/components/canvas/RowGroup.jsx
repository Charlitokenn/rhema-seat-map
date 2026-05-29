import React, { memo } from 'react'
import { Group } from 'react-konva'
import SeatCircle from './SeatCircle.jsx'

/**
 * RowGroup
 * Wraps a row's seats in a Konva <Group> so Konva can batch-draw them.
 * Memoized — only re-renders when its own seats or selection state changes.
 */
const RowGroup = memo(function RowGroup({
  rowId,
  seats,
  selectedSet,
  editMode,
  onSeatClick,
  onSeatDragEnd,
}) {
  return (
    <Group id={`row-${rowId}`} perfectDrawEnabled={false}>
      {seats.map(seat => (
        <SeatCircle
          key={seat.id}
          seat={seat}
          isSelected={selectedSet.has(seat.id)}
          isDraggable={editMode === 'edit'}
          onSeatClick={onSeatClick}
          onSeatDragEnd={onSeatDragEnd}
        />
      ))}
    </Group>
  )
})

export default RowGroup
