import React from 'react'
import { useUiStore } from '@/store/uiStore.js'
import { useVenueStore } from '@/store/venueStore.js'
import { useOnlineStatus } from '@/hooks/useOnlineStatus.js'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { Eye, PencilLine, Ban, ZoomIn, ZoomOut, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const MODES = [
  { id: 'view',   label: 'View',   Icon: Eye },
  { id: 'assign', label: 'Assign', Icon: PencilLine },
  { id: 'block',  label: 'Block',  Icon: Ban },
]

const VIEWS = ['map', 'editor', 'config']

export default function Toolbar({ pendingCount, isSyncing, onSync }) {
  const view        = useUiStore(s => s.view)
  const setView     = useUiStore(s => s.setView)
  const editMode    = useUiStore(s => s.editMode)
  const setEditMode = useUiStore(s => s.setEditMode)
  const zoomIn      = useUiStore(s => s.zoomIn)
  const zoomOut     = useUiStore(s => s.zoomOut)
  const resetView   = useUiStore(s => s.resetView)
  const scale       = useUiStore(s => s.scale)
  const venue       = useVenueStore(s => s.venue)
  const stats       = useVenueStore(s => s.getStats())
  const isOnline    = useOnlineStatus()

  const syncDisabled = !isOnline || pendingCount === 0 || isSyncing
  const syncTitle    = !isOnline        ? 'Offline'
      : pendingCount === 0 ? 'All synced'
          : `Sync ${pendingCount} pending change${pendingCount !== 1 ? 's' : ''}`

  return (
      <TooltipProvider delayDuration={400}>
        <header className="flex-shrink-0 bg-background border-b">
          {/* Row 1 — venue name + view tabs + sync */}
          <div className="flex items-center gap-2 px-3 py-2">
          <span className="font-semibold text-sm text-foreground truncate flex-shrink-0 max-w-[160px]">
            {venue?.name ?? 'Venue Map'}
          </span>

            <Separator orientation="vertical" className="h-4 mx-1" />

            {/* View tabs */}
            <div className="flex-1 flex items-center justify-center gap-1">
              {VIEWS.map(v => (
                  <Button
                      key={v}
                      variant={view === v ? 'default' : 'ghost'}
                      size="sm"
                      className={cn('h-7 px-3 text-xs capitalize', view !== v && 'text-muted-foreground')}
                      onClick={() => setView(v)}
                  >
                    {v}
                  </Button>
              ))}
            </div>

            {/* Sync */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant={pendingCount > 0 && isOnline ? 'default' : 'outline'}
                    size="sm"
                    className="relative h-7 gap-1.5 px-3 text-xs"
                    onClick={onSync}
                    disabled={syncDisabled}
                >
                  {isSyncing
                      ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : <ArrowUpDown className="h-3 w-3" />
                  }
                  Sync
                  {pendingCount > 0 && (
                      <Badge
                          variant="destructive"
                          className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-[10px] rounded-full"
                      >
                        {pendingCount > 9 ? '9+' : pendingCount}
                      </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">{syncTitle}</TooltipContent>
            </Tooltip>
          </div>

          {/* Row 2 — mode picker + zoom + stats (map view only) */}
          {view === 'map' && (
              <div className="flex items-center gap-2 px-3 pb-2">
                {/* Mode toggle group */}
                <ToggleGroup
                    type="single"
                    value={editMode}
                    onValueChange={v => v && setEditMode(v)}
                    className="bg-muted rounded-lg p-0.5 gap-0"
                >
                  {MODES.map(({ id, label, Icon }) => (
                      <ToggleGroupItem
                          key={id}
                          value={id}
                          size="sm"
                          className="h-7 px-2.5 text-xs gap-1.5 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm rounded-md"
                      >
                        <Icon className="h-3 w-3" />
                        {label}
                      </ToggleGroupItem>
                  ))}
                </ToggleGroup>

                {/* Zoom controls */}
                <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 ml-auto">
                  <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md text-sm font-bold hover:bg-background hover:shadow-sm"
                      onClick={zoomOut}
                      aria-label="Zoom out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs font-mono hover:bg-background rounded-md"
                      onClick={resetView}
                      aria-label="Reset zoom"
                  >
                    {Math.round(scale * 100)}%
                  </Button>
                  <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md hover:bg-background hover:shadow-sm"
                      onClick={zoomIn}
                      aria-label="Zoom in"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Seat stat chips */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {[
                    { label: 'Free',  count: stats.available, className: 'bg-green-50 text-green-700 border-green-200'   },
                    { label: 'Taken', count: stats.occupied,  className: 'bg-red-50 text-destructive border-red-200'      },
                    { label: 'Res.',  count: stats.reserved,  className: 'bg-amber-50 text-amber-700 border-amber-200'   },
                  ].map(s => (
                      <Badge key={s.label} variant="outline" className={cn('text-[11px] h-5 px-1.5', s.className)}>
                        {s.label} {s.count}
                      </Badge>
                  ))}
                </div>
              </div>
          )}
        </header>
      </TooltipProvider>
  )
}