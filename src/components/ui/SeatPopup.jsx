import React, { useEffect } from 'react'
import { useChurchStore } from '../../store/churchStore.js'
import { Button } from './button'
import { Separator } from './separator'
import { cn } from '../../lib/utils'
import { X } from 'lucide-react'

/**
 * SeatPopup
 * Fixed-position popup that appears above a tapped seat.
 * Shows M / W / C buttons; allows re-assign or clear.
 *
 * Props:
 *   seatId  — id of the seat being assigned
 *   anchorX — viewport X of seat centre
 *   anchorY — viewport Y of seat top edge
 *   onClose — dismiss callback
 */
export default function SeatPopup({ seatId, anchorX, anchorY, onClose }) {
  const seat            = useChurchStore(s => s.seats[seatId])
  const setSeatOccupant = useChurchStore(s => s.setSeatOccupant)
  const clearSeat       = useChurchStore(s => s.clearSeat)

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  if (!seat) return null

  const POPUP_W = 232
  const POPUP_H = seat.occupantType ? 164 : 130
  const GAP     = 12

  let left = anchorX - POPUP_W / 2
  let top  = anchorY - POPUP_H - GAP
  left = Math.max(8, Math.min(left, window.innerWidth  - POPUP_W - 8))
  top  = Math.max(8, Math.min(top,  window.innerHeight - POPUP_H - 8))

  const OPTIONS = [
    {
      type:   'M',
      label:  'Man',
      icon:   <img src="/man.png" alt="Man" width={32} height={32} />,
      active: 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700',
      idle:   'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    },
    {
      type:   'W',
      label:  'Woman',
      icon:   <img src="/woman.png" alt="woman" width={32} height={32} />,
      active: 'bg-pink-600 text-white border-pink-600 hover:bg-pink-700',
      idle:   'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
    },
    {
      type:   'C',
      label:  'Child',
      icon:   <img src="/child.png" alt="Child" width={28} height={28} />,
      active: 'bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600',
      idle:   'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
    },
  ]

  function select(type) { setSeatOccupant(seatId, type); onClose() }
  function clear()       { clearSeat(seatId); onClose() }

  return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />

        {/* Popup card */}
        <div
            role="dialog"
            aria-label="Assign seat"
            className="fixed z-50 bg-background rounded-2xl shadow-2xl border border-border p-3"
            style={{ left, top, width: POPUP_W }}
            onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Seat filled by
            </p>
            <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground"
                onClick={onClose}
                aria-label="Close"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* M / W / C buttons */}
          <div className="flex gap-1.5">
            {OPTIONS.map(opt => {
              const isActive = seat.occupantType === opt.type
              return (
                  <button
                      key={opt.type}
                      onClick={() => select(opt.type)}
                      className={cn(
                          'flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border-2',
                          'text-xs font-bold transition-all active:scale-95',
                          isActive ? opt.active : opt.idle
                      )}
                  >
                    <span className="text-xl leading-none">{opt.icon}</span>
                    <span>{opt.label}</span>
                    {isActive && (
                        <span className="text-[9px] font-normal opacity-75 -mt-0.5">✓ marked</span>
                    )}
                  </button>
              )
            })}
          </div>

          {/* Clear */}
          {seat.occupantType && (
              <>
                <Separator className="my-2" />
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={clear}
                >
                  Clear seat
                </Button>
              </>
          )}

          {/* Caret */}
          <div
              className="absolute w-3 h-3 bg-background border-r border-b border-border"
              style={{ bottom: -6, left: '50%', transform: 'translateX(-50%) rotate(45deg)' }}
          />
        </div>
      </>
  )
}