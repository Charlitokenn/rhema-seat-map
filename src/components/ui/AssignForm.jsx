import React, { useState, useEffect, useRef } from 'react'
import { useVenueStore } from '@/store/venueStore.js'
import { useUiStore } from '@/store/uiStore.js'
import { useSync } from '@/hooks/useSync.js'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {DialogTrigger} from "@base-ui/react";

/**
 * AssignForm
 * Modal for assigning an occupant name to the currently selected seat.
 */
export default function AssignForm() {
  const isOpen      = useUiStore(s => s.assignFormOpen)
  const closeForm   = useUiStore(s => s.closeAssignForm)
  const selectedIds = useVenueStore(s => s.selectedIds)
  const seats       = useVenueStore(s => s.seats)
  const { mutateSeat } = useSync()

  const inputRef = useRef(null)
  const [name, setName]   = useState('')
  const [error, setError] = useState('')

  const seatId = selectedIds[0]
  const seat   = seatId ? seats[seatId] : null

  useEffect(() => {
    if (isOpen) {
      setName(seat?.occupantName ?? '')
      setError('')
      setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [isOpen, seat?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a name or use "Clear" to unassign.')
      return
    }
    mutateSeat(seatId, { occupantName: trimmed, status: 'occupied' })
    closeForm()
  }

  function handleClear() {
    mutateSeat(seatId, { occupantName: null, status: 'available' })
    closeForm()
  }

  if (!seat) return null

  return (
      <Dialog open={isOpen} onOpenChange={open => !open && closeForm()}>
        <DialogTrigger/>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Assign Seat
              <Badge variant="secondary" className="font-mono text-xs">{seat.id}</Badge>
            </DialogTitle>
            <DialogDescription>
              Row {seat.row} · Position {seat.number}
              {seat.type !== 'standard' && (
                  <> · <span className="text-primary font-medium">{seat.type.toUpperCase()}</span></>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="occupant-name">Occupant name</Label>
              <Input
                  id="occupant-name"
                  ref={inputRef}
                  value={name}
                  onChange={e => { setName(e.target.value); setError('') }}
                  placeholder="Full name…"
                  autoComplete="name"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>
                Cancel
              </Button>
              {seat.occupantName && (
                  <Button type="button" variant="secondary" className="flex-1" onClick={handleClear}>
                    Clear
                  </Button>
              )}
              <Button type="submit" className="flex-1">
                Assign
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
  )
}