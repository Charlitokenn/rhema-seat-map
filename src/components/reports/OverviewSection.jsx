/**
 * OverviewSection.jsx
 * Four KPI cards + a recent services table.
 *
 * Mobile changes:
 *  - Demographic KPI grid: grid-cols-3 → grid-cols-1 sm:grid-cols-3
 *    (98px/card in 3-col is too narrow for text-3xl numbers)
 *  - Recent services table: hide Men / Women / Children columns on mobile,
 *    show Date + Service + Total only (3 readable columns)
 */
import React from 'react'
import KpiCard from './KpiCard.jsx'
import ChartCard from './ChartCard.jsx'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Users, UserCheck, CalendarDays, TrendingUp,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function OverviewSection({ analytics, records, isLoading }) {
  const { kpi } = analytics

  const recent = [...records]
    .sort((a, b) => (b.isoDate || '').localeCompare(a.isoDate || ''))
    .slice(0, 8)

  return (
    <div className="space-y-6">

      {/* Main KPI Grid — 2 cols on mobile, 4 on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Attendance"
          value={kpi.totalAttendance}
          icon={Users}
          accent="violet"
          isLoading={isLoading}
          subtitle="all recorded services"
        />
        <KpiCard
          title="Avg per Service"
          value={kpi.avgAttendance}
          icon={UserCheck}
          accent="blue"
          isLoading={isLoading}
          subtitle="mean attendance"
        />
        <KpiCard
          title="Total Services"
          value={kpi.totalServices}
          icon={CalendarDays}
          accent="amber"
          isLoading={isLoading}
          subtitle="recorded sessions"
        />
        <KpiCard
          title="Growth Rate"
          value={`${kpi.growthPct > 0 ? '+' : ''}${kpi.growthPct}%`}
          icon={TrendingUp}
          accent={kpi.growthPct >= 0 ? 'green' : 'red'}
          isLoading={isLoading}
          trend={kpi.growthPct}
          trendLabel="vs prev 4 weeks"
        />
      </div>

      {/*
       * Demographic KPI Grid
       * Was grid-cols-3 always — each card only ~98px wide on a 375px phone,
       * not enough room for text-3xl numbers. Now stacks on mobile.
       */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <KpiCard
          title="Total Men"
          value={kpi.totalMen}
          accent="blue"
          isLoading={isLoading}
          subtitle={`${kpi.totalAttendance ? Math.round((kpi.totalMen / kpi.totalAttendance) * 100) : 0}% of attendance`}
        />
        <KpiCard
          title="Total Women"
          value={kpi.totalWomen}
          accent="pink"
          isLoading={isLoading}
          subtitle={`${kpi.totalAttendance ? Math.round((kpi.totalWomen / kpi.totalAttendance) * 100) : 0}% of attendance`}
        />
        <KpiCard
          title="Total Children"
          value={kpi.totalChildren}
          accent="amber"
          isLoading={isLoading}
          subtitle={`${kpi.totalAttendance ? Math.round((kpi.totalChildren / kpi.totalAttendance) * 100) : 0}% of attendance`}
        />
      </div>

      {/* Recent Services Table */}
      <ChartCard
        title="Recent Services"
        description="Latest recorded attendance entries"
        isLoading={isLoading}
        isEmpty={!records.length}
      >
        {/*
         * overflow-x-auto on the wrapper ensures the table scrolls horizontally
         * on narrow screens even if content exceeds the container width.
         * Men / Women / Children columns are hidden below sm to give Date,
         * Service, and Total room to breathe.
         */}
        <div className="rounded-lg border overflow-x-auto">
          <Table className="min-w-[320px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs py-2">Date</TableHead>
                <TableHead className="text-xs py-2">Service</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-2 text-right">Men</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-2 text-right">Women</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-2 text-right">Children</TableHead>
                <TableHead className="text-xs py-2 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((r, i) => (
                <TableRow key={i} className="text-xs">
                  <TableCell className="py-2 font-medium text-muted-foreground whitespace-nowrap">
                    {formatDate(r.date)}
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline" className="text-[10px] font-normal whitespace-nowrap">
                      {r.service}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-2 text-right text-blue-600 font-medium">
                    {r.men}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-2 text-right text-pink-600 font-medium">
                    {r.women}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-2 text-right text-amber-600 font-medium">
                    {r.children}
                  </TableCell>
                  <TableCell className="py-2 text-right font-bold text-foreground">
                    {r.total}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartCard>
    </div>
  )
}
