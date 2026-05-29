/**
 * useReportsData.js
 * Fetches attendance summaries from the GAS endpoint and applies
 * local filtering. Returns both raw and processed data.
 */
import { useState, useCallback, useMemo } from 'react'
import { gasRequest } from '@/lib/appsScript.js'

import {
  normalise,
  filterByRange,
  filterByServiceType,
  uniqueServiceTypes,
  kpiSummary,
  weeklySeriesData,
  monthlySeriesData,
  serviceTypeData,
  demographicPieData,
  peakRecords,
  generateInsights,
} from '@/utils/analyticsUtils.js'

export function useReportsData() {
  const [rawRecords, setRawRecords] = useState([])
  const [isLoading,  setIsLoading]  = useState(false)
  const [error,      setError]      = useState(null)
  const [lastFetched, setLastFetched] = useState(null)

  // Filters
  const [dateRange,    setDateRange]    = useState('all')  // all | 30d | 90d | 6m | 1y
  const [serviceType,  setServiceType]  = useState('all')

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await gasRequest('GET', { action: 'getSummaries' })
      const normalised = normalise(res.summaries ?? [])
      // Sort oldest → newest
      normalised.sort((a, b) => (a.isoDate || '').localeCompare(b.isoDate || ''))
      setRawRecords(normalised)
      setLastFetched(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Derived filtered records ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = filterByRange(rawRecords, dateRange)
    r     = filterByServiceType(r, serviceType)
    return r
  }, [rawRecords, dateRange, serviceType])

  // ── Processed analytics ────────────────────────────────────────────────────
  const analytics = useMemo(() => ({
    kpi:          kpiSummary(filtered),
    weekly:       weeklySeriesData(filtered),
    monthly:      monthlySeriesData(filtered),
    byServiceType: serviceTypeData(filtered),
    demographic:  demographicPieData(filtered),
    peaks:        peakRecords(filtered),
    insights:     generateInsights(filtered),
    serviceTypes: uniqueServiceTypes(rawRecords),
  }), [filtered, rawRecords])

  return {
    // state
    isLoading,
    error,
    lastFetched,
    records: filtered,
    rawCount: rawRecords.length,
    // filters
    dateRange,    setDateRange,
    serviceType,  setServiceType,
    // analytics
    analytics,
    // actions
    fetchData,
    refresh: fetchData,
  }
}
