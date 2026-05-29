import React, { useState, useMemo } from 'react'
import { useChurchStore } from '../../store/churchStore.js'
import { useUiStore } from '../../store/uiStore.js'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import { gasRequest } from '../../lib/appsScript.js'
import { TOTAL_SEATS } from '../../data/churchLayout.js'
import { Button } from './button'
import { Progress } from './progress'
import { Separator } from './separator'
import { Card, CardContent } from './card'
import {Save, RotateCcw, Loader2, CheckCircle2, WifiOff, Trash2} from 'lucide-react'
import { Popover , PopoverTrigger} from "./popover";
import {PopoverContent} from "./popover.jsx";

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function getServiceInfo() {
  const now = new Date()
  return {
    serviceName: `${DAY_NAMES[now.getDay()]} Service`,
    dateStr:  now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    isoDate:  now.toISOString(),
  }
}

// ── Single count row ──────────────────────────────────────────────────────────
function CountRow({ icon, label, count, valueClass, barClass }) {
  const pct = TOTAL_SEATS > 0 ? Math.min(100, Math.round((count / TOTAL_SEATS) * 100)) : 0
  return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={icon} alt={icon} width={44} height={44} />
            {/*<span className="text-lg leading-none">{icon}</span>*/}
            <span className="text-sm font-medium text-foreground">{label}</span>
          </div>
          <span className={`text-2xl font-bold tabular-nums ${valueClass}`}>{count}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
              className={`h-full rounded-full transition-all duration-500 ${barClass}`}
              style={{ width: `${pct}%` }}
          />
        </div>
      </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ServiceLegend({ compact = false }) {
  const seats    = useChurchStore(s => s.seats)
  const resetAll = useChurchStore(s => s.resetAll)
  const toast    = useUiStore(s => s.toast)
  const isOnline = useOnlineStatus()

  const [saving,    setSaving]    = useState(false)
  const [savedOk,   setSavedOk]   = useState(false)
  const [showReset, setShowReset] = useState(false)

  const { serviceName, dateStr, isoDate } = useMemo(() => getServiceInfo(), [])

  const counts = useMemo(() => {
    const arr      = Object.values(seats)
    const men      = arr.filter(s => s.occupantType === 'M').length
    const women    = arr.filter(s => s.occupantType === 'W').length
    const children = arr.filter(s => s.occupantType === 'C').length
    return { men, women, children, total: men + women + children }
  }, [seats])

  async function handleSave() {
    if (!isOnline) { toast('You are offline — connect to save to Google Sheets.', 'error'); return }
    setSaving(true)
    try {
      await gasRequest('POST', {
        action: 'saveServiceSummary',
        date: dateStr, isoDate, service: serviceName,
        men: counts.men, women: counts.women,
        children: counts.children, total: counts.total,
      })
      setSavedOk(true)
      resetAll()
      toast(`${serviceName} saved ✓`, 'success')
      setTimeout(() => setSavedOk(false), 5000)
    } catch (err) {
      toast(`Save failed: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    resetAll()
    setShowReset(false)
    toast('All seats cleared', 'info', 2000)
  }

  // ── COMPACT — mobile bottom bar ───────────────────────────────────────────
  if (compact) {
    return (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-background border-t">
        <span className="text-xs font-semibold text-foreground truncate flex-shrink-0">
          {serviceName}
        </span>
          <div className="flex items-center gap-2 text-xs font-bold flex-1 flex-wrap">
            <div className="flex items-center">
              <img src="/man.png" alt="man" width={28} height={28} />
              <span className="flex flex-col text-blue-600">{counts.men}</span>
            </div>
            <div className="flex items-center">
              <img src="/woman.png" alt="woman" width={28} height={28} />
              <span className="text-pink-600">{counts.women}</span>
            </div>
            <div className="flex items-center">
              <img src="/child.png" alt="child" width={24} height={24} />
              <span className="text-yellow-600">{counts.children}</span>
            </div>
            <div className="text-muted-foreground font-normal">
            = <strong className="text-foreground">{counts.total}</strong>
          </div>
          </div>
            <Popover>
                <PopoverTrigger>
                  <Button
                      variant="ghost"
                      className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Clear filled seats
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <p className="text-xs font-semibold text-center mb-2.5">
                    Clear all {counts.total} seat assignments?
                  </p>
                  <Button
                      variant="default"
                      size="sm"
                      className="flex-1 text-xs py-1 bg-destructive"
                      onClick={handleReset}
                  >
                    <Trash2/>Yes, clear all
                  </Button>
                </PopoverContent>
              </Popover>
            <Popover>
              <PopoverTrigger>
              <Button
                  size="sm"
                  className="flex-shrink-0 h-7 px-3 text-xs"
                  variant={savedOk ? 'secondary' : 'default'}
                  disabled={saving || counts.total === 0 || !isOnline}
              >
               Submit
              </Button>
            </PopoverTrigger>
              <PopoverContent className="flex flex-col gap-2 items-center justify-center">
              <p className="text-lg font-bold">Please Confirm</p>
              <span className="text-md text-muted-foreground">
                Are you sure about this submission?
              </span>
              <Button
                  size="sm"
                  className="flex-shrink-0 h-7 px-3 text-xs"
                  variant={savedOk ? 'secondary' : 'default'}
                  disabled={saving || counts.total === 0 || !isOnline}
                  onClick={handleSave}
              >
                {saving   ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    : savedOk ? <><CheckCircle2 className="h-4 w-4" /> Service records saved</>
                        :          "Yes, Submit" }
              </Button>
            </PopoverContent>
          </Popover>
        </div>
    )
  }

  // ── FULL sidebar ──────────────────────────────────────────────────────────
  const capacityPct = TOTAL_SEATS > 0
      ? Math.min(100, Math.round((counts.total / TOTAL_SEATS) * 100))
      : 0

  return (
      <div className="flex flex-col h-full p-4 gap-5 overflow-y-auto">

        {/* Service heading */}
        <div>
          <h2 className="font-bold text-lg text-foreground leading-snug">{serviceName}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
        </div>

        <Separator />

        {/* Count rows */}
        <div className="space-y-4">
          <CountRow icon="/man.png" label="Men"      count={counts.men}
                    valueClass="text-blue-600"   barClass="bg-blue-500"   />
          <CountRow icon="/woman.png" label="Women"    count={counts.women}
                    valueClass="text-pink-600"   barClass="bg-pink-500"   />
          <CountRow icon="/child.png" label="Children" count={counts.children}
                    valueClass="text-yellow-500" barClass="bg-yellow-400" />
        </div>

        <Separator />

        {/* Total card */}
        <Card className="bg-muted/40 border-muted">
          <CardContent className="p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Total Seated</span>
              <span className="text-4xl font-black text-foreground tabular-nums">{counts.total}</span>
            </div>
            <Progress value={capacityPct} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{TOTAL_SEATS - counts.total} remaining</span>
              <span>{capacityPct}% capacity</span>
            </div>
          </CardContent>
        </Card>

        {/* Colour legend */}
        {/*<div>*/}
        {/*  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">*/}
        {/*    Seat colours*/}
        {/*  </p>*/}
        {/*  <div className="grid grid-cols-2 gap-1.5">*/}
        {/*    {[*/}
        {/*      { swatch: 'bg-blue-200   border-blue-400',   label: 'M — Man'   },*/}
        {/*      { swatch: 'bg-pink-200   border-pink-400',   label: 'W — Woman' },*/}
        {/*      { swatch: 'bg-yellow-200 border-yellow-400', label: 'C — Child' },*/}
        {/*      { swatch: 'bg-white      border-border',     label: 'Empty'     },*/}
        {/*    ].map(({ swatch, label }) => (*/}
        {/*        <div key={label} className="flex items-center gap-1.5">*/}
        {/*          <span className={`w-5 h-5 rounded border flex-shrink-0 ${swatch}`} />*/}
        {/*          <span className="text-xs text-muted-foreground">{label}</span>*/}
        {/*        </div>*/}
        {/*    ))}*/}
        {/*  </div>*/}
        {/*</div>*/}

        {/*/!* Spacer *!/*/}
        {/*<div className="flex-1" />*/}

        {/* Actions */}
        <div className="space-y-2">
          <Popover>
            <PopoverTrigger className="w-full">
              <Button
                  className="w-full gap-2"
                  variant={savedOk ? 'secondary' : 'default'}
                  disabled={saving || counts.total === 0}
              >
                Submit Report
              </Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col gap-2 items-center justify-center">
              <p className="text-lg font-bold">Please Confirm</p>
              <span className="text-md text-muted-foreground">
                Are you sure about this submission?
              </span>
              <Button
                  className="w-full gap-2"
                  variant={savedOk ? 'secondary' : 'default'}
                  disabled={saving || counts.total === 0}
                  onClick={handleSave}
              >
                {saving   ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    : savedOk ? <><CheckCircle2 className="h-4 w-4" /> Service records saved</>
                        :           <><Save className="h-4 w-4" /> Yes, Submit</>}
              </Button>
            </PopoverContent>
          </Popover>

          {!isOnline && counts.total > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-600 font-medium">
                <WifiOff className="h-3 w-3" />
                Offline — connect to save
              </div>
          )}

          {!showReset ? (
              <Button
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
                  onClick={() => setShowReset(true)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset all seats
              </Button>
          ) : (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-3">
                  <p className="text-xs text-destructive font-semibold text-center mb-2.5">
                    Clear all {counts.total} seat assignments?
                  </p>
                  <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setShowReset(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={handleReset}
                    >
                      Yes, clear all
                    </Button>
                  </div>
                </CardContent>
              </Card>
          )}
        </div>
      </div>
  )
}