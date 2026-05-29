/**
 * ReportsSheet.jsx
 * Full-screen analytics dashboard rendered in a Sheet.
 * Triggered by the Reports button in App.jsx header.
 *
 * Internal layout:
 *   ┌─────────────┬────────────────────────────────────┐
 *   │  Sidebar    │   Section content (scrollable)      │
 *   │  nav        │                                      │
 *   └─────────────┴────────────────────────────────────┘
 * On mobile: sidebar collapses to a horizontal tab strip.
 */
import React, { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription, SheetTrigger,
} from '@/components/ui/sheet'
import { Button }    from '@/components/ui/button'
import { Badge }     from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn }        from '@/lib/utils'
import {
  LayoutDashboard, TrendingUp, CalendarRange,
  Users2, BarChart3, Lightbulb,
  AlertCircle, X,
} from 'lucide-react'
import { useReportsData }      from '@/hooks/useReportsData.js'
import FilterControls          from '@/components/reports/FilterControls.jsx'
import OverviewSection         from '@/components/reports/OverviewSection.jsx'
import TrendsSection           from '@/components/reports/TrendsSection.jsx'
import ServiceSection          from '@/components/reports/ServiceSection.jsx'
import DemographicsSection     from '@/components/reports/DemographicsSection.jsx'
import PeakSection             from '@/components/reports/PeakSection.jsx'
import InsightsSection         from '@/components/reports/InsightsSection.jsx'

// ── Sidebar navigation items ─────────────────────────────────────────────────
const NAV = [
  { id: 'overview',     label: 'Overview',     Icon: LayoutDashboard, description: 'KPIs & recent data'      },
  { id: 'trends',       label: 'Trends',       Icon: TrendingUp,      description: 'Weekly & monthly charts'  },
  { id: 'services',     label: 'Services',     Icon: CalendarRange,   description: 'By service type'          },
  { id: 'demographics', label: 'Demographics', Icon: Users2,          description: 'M / W / C breakdown'      },
  { id: 'peaks',        label: 'Peak Days',    Icon: BarChart3,       description: 'Highs & lows'             },
  { id: 'insights',     label: 'Insights',     Icon: Lightbulb,       description: 'Auto analysis'            },
]

// ── Desktop sidebar ───────────────────────────────────────────────────────────
function Sidebar({ activeId, onSelect }) {
  return (
      <nav className="h-full flex flex-col bg-muted/30 border-r w-52 xl:w-60 flex-shrink-0">
        <div className="px-4 py-4 border-b">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Analytics
          </p>
        </div>

        <ScrollArea className="flex-1 py-2">
          <ul className="space-y-0.5 px-2">
            {NAV.map(({ id, label, Icon, description }) => (
                <li key={id}>
                  <button
                      onClick={() => onSelect(id)}
                      className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group',
                          activeId === id
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                  >
                    <Icon className={cn(
                        'h-4 w-4 flex-shrink-0',
                        activeId === id
                            ? 'text-primary-foreground'
                            : 'text-muted-foreground group-hover:text-foreground'
                    )} />
                    <div className="min-w-0">
                      <p className={cn(
                          'text-xs font-semibold leading-none',
                          activeId === id ? 'text-primary-foreground' : 'text-foreground'
                      )}>
                        {label}
                      </p>
                      <p className={cn(
                          'text-[10px] mt-0.5 truncate leading-none',
                          activeId === id
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                      )}>
                        {description}
                      </p>
                    </div>
                  </button>
                </li>
            ))}
          </ul>
        </ScrollArea>
      </nav>
  )
}

// ── Mobile horizontal tab strip ───────────────────────────────────────────────
function MobileTabs({ activeId, onSelect }) {
  return (
      <div className="flex overflow-x-auto gap-1 px-3 py-2 border-b bg-background">
        {NAV.map(({ id, label, Icon }) => (
            <button
                key={id}
                onClick={() => onSelect(id)}
                className={cn(
                    'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                    'text-xs font-medium transition-colors whitespace-nowrap',
                    activeId === id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
        ))}
      </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReportsSheet({ open, onOpenChange }) {
  const [activeSection, setActiveSection] = useState('overview')

  const {
    isLoading, error, lastFetched, records, rawCount,
    dateRange,   setDateRange,
    serviceType, setServiceType,
    analytics,
    fetchData,
  } = useReportsData()

  // Fetch on first open
  useEffect(() => {
    if (open && rawCount === 0 && !isLoading) fetchData()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const SECTIONS = {
    overview:     <OverviewSection     analytics={analytics} records={records} isLoading={isLoading} />,
    trends:       <TrendsSection       analytics={analytics} isLoading={isLoading} />,
    services:     <ServiceSection      analytics={analytics} isLoading={isLoading} />,
    demographics: <DemographicsSection analytics={analytics} isLoading={isLoading} />,
    peaks:        <PeakSection         analytics={analytics} isLoading={isLoading} />,
    insights:     <InsightsSection     analytics={analytics} records={records} isLoading={isLoading} />,
  }

  const activeNav = NAV.find(n => n.id === activeSection)

  return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger>
        </SheetTrigger>
        {/*
       * SheetContent slides in from the right by default.
       * The overrides below stretch it to cover the full viewport width:
       *   - w-screen / max-w-none  → full width
       *   - h-screen               → full height
       *   - inset-y-0 right-0      → pin to right edge, full vertical span
       *   - rounded-none           → no rounded corners
       * The default SheetContent close button is hidden in favour of our own.
       */}
        <SheetContent
            side="right"
            // `style` beats the cva variant classes (w-3/4 sm:max-w-sm) that
            // shadcn bakes into SheetContent and which className alone can't override.
            style={{ width: '100vw', maxWidth: '100vw' }}
            className={cn(
                'flex flex-col p-0',
                'h-screen',
                'rounded-none border-0',
                // Hide the default close button rendered by SheetContent
                '[&>button:first-of-type]:hidden'
            )}
        >
          {/* ── Top header bar ──────────────────────────────────────────────── */}
          <SheetHeader className="flex-shrink-0 border-b px-4 py-3 space-y-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-base font-bold flex items-center gap-2 flex-wrap">
                  Church Attendance Analytics
                  {lastFetched && (
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        Updated {lastFetched.toLocaleTimeString()}
                      </Badge>
                  )}
                </SheetTitle>
                <SheetDescription className="text-xs mt-0.5">
                  {activeNav?.label} — {activeNav?.description}
                </SheetDescription>
              </div>

              {/* Close button */}
              <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close reports"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters row */}
            <div className="mt-3">
              <FilterControls
                  dateRange={dateRange}     onDateRange={setDateRange}
                  serviceType={serviceType} onServiceType={setServiceType}
                  serviceTypes={analytics.serviceTypes}
                  recordCount={records.length}
                  isLoading={isLoading}
                  onRefresh={fetchData}
              />
            </div>
          </SheetHeader>

          {/* ── Error banner ──────────────────────────────────────────────────── */}
          {error && (
              <Alert
                  variant="destructive"
                  className="flex-shrink-0 rounded-none border-x-0 border-t-0"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {error} —{' '}
                  <button onClick={fetchData} className="underline font-medium">
                    retry
                  </button>
                </AlertDescription>
              </Alert>
          )}

          {/* ── Mobile tab strip ─────────────────────────────────────────────── */}
          <div className="lg:hidden flex-shrink-0">
            <MobileTabs activeId={activeSection} onSelect={setActiveSection} />
          </div>

          {/* ── Body: sidebar + scrollable content ───────────────────────────── */}
          <div className="flex flex-1 overflow-hidden min-h-0">

            {/* Sidebar — desktop only */}
            <aside className="hidden lg:flex overflow-hidden">
              <Sidebar activeId={activeSection} onSelect={setActiveSection} />
            </aside>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 lg:p-6 max-w-6xl">

                {/* Section heading */}
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    {activeNav && <activeNav.Icon className="h-5 w-5 text-primary" />}
                    {activeNav?.label}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeNav?.description}
                  </p>
                </div>

                {/* Active section */}
                {SECTIONS[activeSection]}

                {/* Bottom padding */}
                <div className="h-8" />
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
  )
}