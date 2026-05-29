import React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChevronDown } from 'lucide-react'

const STATUS_ITEMS = [
  { color: 'bg-green-500',     label: 'Available'     },
  { color: 'bg-destructive',   label: 'Occupied'      },
  { color: 'bg-amber-500',     label: 'Reserved'      },
  { color: 'bg-muted-foreground/60', label: 'Blocked' },
]

const TYPE_ITEMS = [
  { dot: 'bg-green-500',  ring: 'ring-green-700',  label: 'Standard'      },
  { dot: 'bg-pink-500',   ring: 'ring-pink-700',   label: 'VIP ★'         },
  { dot: 'bg-blue-500',   ring: 'ring-blue-700',   label: '♿ Accessible'  },
  { dot: 'bg-teal-500',   ring: 'ring-teal-700',   label: 'Staff'         },
]

export default function Legend() {
  return (
      <div className="absolute top-3 left-3 z-20">
        <Popover>
          <PopoverTrigger asChild>
            <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs font-medium bg-background/90 backdrop-blur-sm gap-2"
            >
            <span className="flex gap-0.5 items-center">
              {STATUS_ITEMS.map(s => (
                  <span key={s.label} className={`w-2 h-2 rounded-full ${s.color}`} />
              ))}
            </span>
              Legend
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-3" align="start" sideOffset={4}>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Status
            </p>
            <ul className="space-y-1.5 mb-3">
              {STATUS_ITEMS.map(item => (
                  <li key={item.label} className="flex items-center gap-2 text-xs text-foreground">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.color}`} />
                    {item.label}
                  </li>
              ))}
            </ul>

            <Separator className="mb-3" />

            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Seat type
            </p>
            <ul className="space-y-1.5">
              {TYPE_ITEMS.map(item => (
                  <li key={item.label} className="flex items-center gap-2 text-xs text-foreground">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ${item.dot} ${item.ring}`} />
                    {item.label}
                  </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
  )
}