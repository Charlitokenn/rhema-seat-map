import React from 'react'
import { useVenueStore } from '../../store/venueStore.js'
import { Badge } from '@/components/ui/badge'

export default function StatsBar() {
    const stats = useVenueStore(s => s.getStats())
    const { total, available, occupied, reserved, blocked } = stats

    const pct = v => (total > 0 ? Math.round((v / total) * 100) : 0)

    return (
        <div className="flex-shrink-0 bg-background border-b px-4 py-2 space-y-2">
            {/* Segmented progress bar */}
            <div className="flex h-2 rounded-full overflow-hidden bg-muted gap-px">
                {occupied  > 0 && <div className="bg-destructive  transition-all" style={{ width: `${pct(occupied)}%`  }} title={`Occupied ${occupied}`}  />}
                {reserved  > 0 && <div className="bg-amber-400    transition-all" style={{ width: `${pct(reserved)}%`  }} title={`Reserved ${reserved}`}  />}
                {blocked   > 0 && <div className="bg-muted-foreground/50 transition-all" style={{ width: `${pct(blocked)}%` }} title={`Blocked ${blocked}`} />}
                {available > 0 && <div className="bg-green-500    transition-all" style={{ width: `${pct(available)}%` }} title={`Available ${available}`} />}
            </div>

            {/* Stat chips */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium">{total} seats</span>
                <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 text-[11px] h-5 px-1.5">
                    {available} free
                </Badge>
                <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5 text-[11px] h-5 px-1.5">
                    {occupied} taken
                </Badge>
                {reserved > 0 && (
                    <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 text-[11px] h-5 px-1.5">
                        {reserved} reserved
                    </Badge>
                )}
                {blocked > 0 && (
                    <Badge variant="outline" className="text-muted-foreground text-[11px] h-5 px-1.5">
                        {blocked} blocked
                    </Badge>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
          {pct(occupied)}% capacity
        </span>
            </div>
        </div>
    )
}