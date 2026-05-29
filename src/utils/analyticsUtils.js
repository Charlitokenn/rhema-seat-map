/**
 * analyticsUtils.js
 * Pure calculation helpers for the reports dashboard.
 * All functions are stateless and side-effect free.
 *
 * Expected record shape (from GAS getSummaries):
 *   { date, isoDate, service, men, women, children, total, savedAt }
 */

import {
  format, parseISO, startOfWeek, subWeeks, subMonths,
} from 'date-fns'

// ── Normalise ─────────────────────────────────────────────────────────────────
/** Coerce string numbers from Sheets into real numbers */
export function normalise(records) {
  return records.map(r => ({
    ...r,
    men:      Number(r.men)      || 0,
    women:    Number(r.women)    || 0,
    children: Number(r.children) || 0,
    total:    Number(r.total)    || 0,
    date:     r.date     || '',
    isoDate:  r.isoDate  || r.savedAt || '',
    service:  r.service  || 'Unknown',
  }))
}

// ── KPI summary ───────────────────────────────────────────────────────────────
export function kpiSummary(records) {
  if (!records.length) return {
    totalAttendance: 0, avgAttendance: 0, totalServices: 0,
    growthPct: 0, totalMen: 0, totalWomen: 0, totalChildren: 0,
  }

  const totalAttendance = records.reduce((s, r) => s + r.total, 0)
  const avgAttendance   = Math.round(totalAttendance / records.length)
  const totalServices   = records.length
  const totalMen        = records.reduce((s, r) => s + r.men, 0)
  const totalWomen      = records.reduce((s, r) => s + r.women, 0)
  const totalChildren   = records.reduce((s, r) => s + r.children, 0)

  // Growth: last 4 weeks vs prior 4 weeks
  const now    = new Date()
  const cut    = subWeeks(now, 4)
  const prior  = subWeeks(now, 8)
  const recent = records.filter(r => r.isoDate && new Date(r.isoDate) >= cut)
  const prev   = records.filter(r => r.isoDate && new Date(r.isoDate) >= prior && new Date(r.isoDate) < cut)
  const recentTotal = recent.reduce((s, r) => s + r.total, 0)
  const prevTotal   = prev.reduce((s, r) => s + r.total, 0)
  const growthPct   = prevTotal === 0
    ? (recentTotal > 0 ? 100 : 0)
    : Math.round(((recentTotal - prevTotal) / prevTotal) * 100)

  return { totalAttendance, avgAttendance, totalServices, growthPct, totalMen, totalWomen, totalChildren }
}

// ── Weekly series ─────────────────────────────────────────────────────────────
export function weeklySeriesData(records) {
  const map = {}
  records.forEach(r => {
    if (!r.isoDate) return
    const d      = parseISO(r.isoDate)
    const weekStart = format(startOfWeek(d, { weekStartsOn: 0 }), 'yyyy-MM-dd')
    if (!map[weekStart]) map[weekStart] = { week: weekStart, label: format(d, 'MMM d'), men: 0, women: 0, children: 0, total: 0 }
    map[weekStart].men      += r.men
    map[weekStart].women    += r.women
    map[weekStart].children += r.children
    map[weekStart].total    += r.total
  })
  return Object.values(map).sort((a, b) => a.week.localeCompare(b.week))
}

// ── Monthly series ────────────────────────────────────────────────────────────
export function monthlySeriesData(records) {
  const map = {}
  records.forEach(r => {
    if (!r.isoDate) return
    const d    = parseISO(r.isoDate)
    const key  = format(d, 'yyyy-MM')
    const label = format(d, 'MMM yyyy')
    if (!map[key]) map[key] = { month: key, label, men: 0, women: 0, children: 0, total: 0, services: 0 }
    map[key].men      += r.men
    map[key].women    += r.women
    map[key].children += r.children
    map[key].total    += r.total
    map[key].services++
  })
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
}

// ── Service type breakdown ────────────────────────────────────────────────────
export function serviceTypeData(records) {
  const map = {}
  records.forEach(r => {
    const key = r.service || 'Unknown'
    if (!map[key]) map[key] = { service: key, total: 0, men: 0, women: 0, children: 0, count: 0 }
    map[key].total    += r.total
    map[key].men      += r.men
    map[key].women    += r.women
    map[key].children += r.children
    map[key].count++
  })
  return Object.values(map)
    .map(s => ({ ...s, average: Math.round(s.total / s.count) }))
    .sort((a, b) => b.total - a.total)
}

// ── Demographic donut ─────────────────────────────────────────────────────────
export function demographicPieData(records) {
  const totalMen      = records.reduce((s, r) => s + r.men, 0)
  const totalWomen    = records.reduce((s, r) => s + r.women, 0)
  const totalChildren = records.reduce((s, r) => s + r.children, 0)
  const total         = totalMen + totalWomen + totalChildren || 1
  return [
    { name: 'Men',      value: totalMen,      pct: Math.round((totalMen / total) * 100),      fill: 'var(--color-men)' },
    { name: 'Women',    value: totalWomen,     pct: Math.round((totalWomen / total) * 100),    fill: 'var(--color-women)' },
    { name: 'Children', value: totalChildren,  pct: Math.round((totalChildren / total) * 100), fill: 'var(--color-children)' },
  ]
}

// ── Peak / low records ────────────────────────────────────────────────────────
export function peakRecords(records, n = 5) {
  const sorted = [...records].sort((a, b) => b.total - a.total)
  return {
    highest: sorted.slice(0, n),
    lowest:  sorted.slice(-n).reverse(),
  }
}

// ── Auto insights ─────────────────────────────────────────────────────────────
export function generateInsights(records) {
  if (!records.length) return []

  const kpi     = kpiSummary(records)
  const byType  = serviceTypeData(records)
  const monthly = monthlySeriesData(records)
  const insights = []

  // Best service type
  if (byType[0]) {
    insights.push({
      id: 'best-service',
      type: 'success',
      title: 'Top Performing Service',
      body: `"${byType[0].service}" leads with an average of ${byType[0].average} attendees across ${byType[0].count} services.`,
    })
  }

  // Growth trend
  insights.push({
    id: 'growth',
    type: kpi.growthPct >= 0 ? 'success' : 'warning',
    title: kpi.growthPct >= 0 ? 'Positive Growth' : 'Attendance Decline',
    body: `Attendance ${kpi.growthPct >= 0 ? 'grew' : 'dropped'} by ${Math.abs(kpi.growthPct)}% compared to the previous 4-week period.`,
  })

  // Demographic composition
  const total = kpi.totalMen + kpi.totalWomen + kpi.totalChildren || 1
  const menPct = Math.round((kpi.totalMen / total) * 100)
  const womPct = Math.round((kpi.totalWomen / total) * 100)
  const chiPct = Math.round((kpi.totalChildren / total) * 100)
  insights.push({
    id: 'demographics',
    type: 'info',
    title: 'Congregation Composition',
    body: `Men ${menPct}% · Women ${womPct}% · Children ${chiPct}% across all recorded services.`,
  })

  // Best month
  if (monthly.length) {
    const best = [...monthly].sort((a, b) => b.total - a.total)[0]
    insights.push({
      id: 'best-month',
      type: 'info',
      title: 'Best Month',
      body: `${best.label} recorded the highest monthly attendance of ${best.total.toLocaleString()} across ${best.services} services.`,
    })
  }

  // Consistency
  const totals = records.map(r => r.total)
  const avg  = kpi.avgAttendance
  const over = totals.filter(t => t >= avg).length
  const pct  = Math.round((over / totals.length) * 100)
  insights.push({
    id: 'consistency',
    type: pct >= 60 ? 'success' : 'warning',
    title: 'Attendance Consistency',
    body: `${pct}% of services met or exceeded the average attendance of ${avg}. ${pct >= 60 ? 'Congregation attendance is reliable.' : 'Attendance varies significantly between services.'}`,
  })

  return insights
}

// ── Date range filter ─────────────────────────────────────────────────────────
export function filterByRange(records, rangeKey) {
  if (rangeKey === 'all') return records
  const now = new Date()
  const from = {
    '30d':  subMonths(now, 1),
    '90d':  subMonths(now, 3),
    '6m':   subMonths(now, 6),
    '1y':   subMonths(now, 12),
  }[rangeKey]
  if (!from) return records
  return records.filter(r => r.isoDate && new Date(r.isoDate) >= from)
}

export function filterByServiceType(records, type) {
  if (!type || type === 'all') return records
  return records.filter(r => r.service === type)
}

export function uniqueServiceTypes(records) {
  return [...new Set(records.map(r => r.service).filter(Boolean))].sort()
}
