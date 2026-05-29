/**
 * FilterControls.jsx
 * Date-range + service-type filters and export button.
 *
 * Mobile layout (< sm):   2-column grid
 *   Row 1: [Date range]  [Service type]
 *   Row 2: [badge  Refresh  Export →]   (col-span-2)
 *
 * Desktop layout (sm+):  single flex row
 *   [Date range] [Service type] [badge] [Refresh] [Export →]
 *   The action-div uses `sm:contents` so its children join the flex row
 *   directly, making Export's ml-auto push it to the far right.
 */
import React from 'react'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, RefreshCw, Loader2 } from 'lucide-react'

const DATE_RANGES = [
  { value: 'all', label: 'All time'      },
  { value: '30d', label: 'Last 30 days'  },
  { value: '90d', label: 'Last 90 days'  },
  { value: '6m',  label: 'Last 6 months' },
  { value: '1y',  label: 'Last year'     },
]

export default function FilterControls({
  dateRange,    onDateRange,
  serviceType,  onServiceType,
  serviceTypes = [],
  recordCount  = 0,
  isLoading    = false,
  onRefresh,
  onExport,
}) {
  function handleExport() {
    if (onExport) { onExport(); return }
    alert('Export feature: wire onExport prop to your CSV download handler.')
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">

      {/* Date range — full column on mobile, fixed width on desktop */}
      <Select value={dateRange} onValueChange={onDateRange}>
        <SelectTrigger className="h-8 w-full sm:w-36 text-xs">
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent>
          {DATE_RANGES.map(r => (
            <SelectItem key={r.value} value={r.value} className="text-xs">
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Service type — full column on mobile, fixed width on desktop */}
      <Select value={serviceType} onValueChange={onServiceType}>
        <SelectTrigger className="h-8 w-full sm:w-44 text-xs">
          <SelectValue placeholder="All service types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All service types</SelectItem>
          {serviceTypes.map(t => (
            <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/*
       * On mobile:   a full-width (col-span-2) flex row for the action controls.
       * On desktop:  sm:contents makes this div layout-transparent — badge,
       *              Refresh, and Export become direct flex children of the
       *              parent, keeping everything on one line.
       */}
      <div className="col-span-2 flex items-center gap-2 sm:contents">
        <Badge variant="secondary" className="text-xs shrink-0">
          {recordCount} {recordCount === 1 ? 'record' : 'records'}
        </Badge>

        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <RefreshCw className="h-3 w-3" />
          }
          {isLoading ? 'Loading…' : 'Refresh'}
        </Button>

        {/* ml-auto pushes Export to the right on both mobile row and desktop flex row */}
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs ml-auto"
          onClick={handleExport}
        >
          <Download className="h-3 w-3" />
          Export
        </Button>
      </div>
    </div>
  )
}
