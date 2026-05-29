import React, { useState, useEffect } from 'react'
import { useVenueStore } from '@/store/venueStore.js'
import { useUiStore } from '@/store/uiStore.js'
import { useSync } from '@/hooks/useSync.js'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { id: 'available', label: 'Available', dot: 'bg-green-500' },
  { id: 'occupied',  label: 'Occupied',  dot: 'bg-destructive' },
  { id: 'reserved',  label: 'Reserved',  dot: 'bg-amber-500' },
  { id: 'blocked',   label: 'Blocked',   dot: 'bg-muted-foreground/60' },
]

const TYPE_LABEL = {
  standard:   'Standard',
  vip:        'VIP ★',
  wheelchair: '♿ Accessible',
  staff:      'Staff',
}

export default function SeatInfoPanel() {
  const selectedIds    = useVenueStore(s => s.selectedIds)
  const seats          = useVenueStore(s => s.seats)
  const clearSelection = useVenueStore(s => s.clearSelection)
  const editMode       = useUiStore(s => s.editMode)
  const { mutateSeat, mutateBulk } = useSync()

  const [occupantName, setOccupantName] = useState('')
  const [isDirty, setIsDirty]           = useState(false)

  const isSingle   = selectedIds.length === 1
  const seat       = isSingle ? seats[selectedIds[0]] : null
  const multiCount = selectedIds.length

  useEffect(() => {
    setOccupantName(seat?.occupantName ?? '')
    setIsDirty(false)
  }, [seat?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const isOpen = selectedIds.length > 0

  function handleStatusChange(status) {
    if (isSingle) mutateSeat(selectedIds[0], { status })
    else          mutateBulk(selectedIds, { status })
  }

  function handleSaveOccupant() {
    if (!isSingle) return
    mutateSeat(selectedIds[0], {
      occupantName: occupantName.trim() || null,
      status: occupantName.trim() ? 'occupied' : 'available',
    })
    setIsDirty(false)
  }

  function handleClearOccupant() {
    mutateSeat(selectedIds[0], { occupantName: null, status: 'available' })
    setOccupantName('')
    setIsDirty(false)
  }

  const multiStatus = (() => {
    if (isSingle) return seat?.status
    const statuses = new Set(selectedIds.map(id => seats[id]?.status))
    return statuses.size === 1 ? [...statuses][0] : 'mixed'
  })()

  return (
      <Sheet open={isOpen} onOpenChange={open => !open && clearSelection()}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pt-3 pb-6 max-w-lg mx-auto">
          <SheetHeader className="mb-3 text-left">
            <div className="flex items-start justify-between">
              <SheetTitle className="text-sm font-semibold flex items-center gap-2">
                {isSingle ? (
                    <>
                      Seat {seat?.id}
                      {seat?.type !== 'standard' && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {TYPE_LABEL[seat?.type]}
                          </Badge>
                      )}
                    </>
                ) : (
                    `${multiCount} seats selected`
                )}
              </SheetTitle>
              {isSingle && (
                  <span className="text-xs text-muted-foreground mt-0.5">
                Row {seat?.row} · #{seat?.number}
              </span>
              )}
            </div>
          </SheetHeader>

          {/* Status switcher */}
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
            <div className="grid grid-cols-4 gap-1.5">
              {STATUS_OPTIONS.map(opt => (
                  <button
                      key={opt.id}
                      onClick={() => handleStatusChange(opt.id)}
                      className={cn(
                          'flex flex-col items-center gap-1.5 py-2.5 rounded-xl border-2 transition-all text-[11px] font-medium',
                          multiStatus === opt.id
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:border-muted-foreground/30 text-muted-foreground'
                      )}
                  >
                    <span className={cn('w-3.5 h-3.5 rounded-full', opt.dot)} />
                    {opt.label}
                  </button>
              ))}
            </div>
          </div>

          {/* Occupant name — assign mode, single seat */}
          {isSingle && editMode === 'assign' && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Occupant name</p>
                <div className="flex gap-2">
                  <Input
                      value={occupantName}
                      onChange={e => { setOccupantName(e.target.value); setIsDirty(true) }}
                      onKeyDown={e => e.key === 'Enter' && handleSaveOccupant()}
                      placeholder="Enter name…"
                      className="flex-1 h-9 text-sm"
                  />
                  {isDirty && (
                      <Button size="sm" onClick={handleSaveOccupant}>Save</Button>
                  )}
                  {seat?.occupantName && !isDirty && (
                      <Button size="sm" variant="secondary" onClick={handleClearOccupant}>
                        Clear
                      </Button>
                  )}
                </div>
                {seat?.occupantName && !isDirty && (
                    <p className="text-xs text-green-600 font-medium">✓ Assigned to {seat.occupantName}</p>
                )}
              </div>
          )}

          {/* Occupant display — view mode */}
          {isSingle && editMode === 'view' && seat?.occupantName && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2.5">
                <span className="text-base">👤</span>
                <span className="text-sm text-green-800 font-medium">{seat.occupantName}</span>
              </div>
          )}
        </SheetContent>
      </Sheet>
  )
}