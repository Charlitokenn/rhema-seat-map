/**
 * ServiceSection.jsx
 * Attendance by service type bar chart + ranking table + averages.
 */
import React from 'react'
import ChartCard from './ChartCard.jsx'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy } from 'lucide-react'

const BAR_CONFIG = {
  men:      { label: 'Men',      color: 'var(--men)' },
  women:    { label: 'Women',    color: 'var(--women)' },
  children: { label: 'Children', color: 'var(--children)' },
}

const RANK_MEDAL = ['🥇', '🥈', '🥉']

export default function ServiceSection({ analytics, isLoading }) {
  const { byServiceType } = analytics
  const maxTotal = byServiceType[0]?.total ?? 1

  return (
    <div className="space-y-6">
      {/* Bar chart — demographic breakdown per service type */}
      <ChartCard
        title="Attendance by Service Type"
        description="Total men, women, and children per service"
        isLoading={isLoading}
        isEmpty={!byServiceType.length}
      >
        <ChartContainer config={BAR_CONFIG} className="h-64 w-full">
          <BarChart data={byServiceType} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="service" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="men"      stackId="a" fill="var(--color-men)"      radius={[0,0,0,0]} />
            <Bar dataKey="women"    stackId="a" fill="var(--color-women)"    radius={[0,0,0,0]} />
            <Bar dataKey="children" stackId="a" fill="var(--color-children)" radius={[4,4,0,0]} />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      {/* Ranking + avg attendance grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Ranking table */}
        <ChartCard
          title="Service Ranking"
          description="Ranked by total cumulative attendance"
          isLoading={isLoading}
          isEmpty={!byServiceType.length}
        >
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs py-2 w-8">#</TableHead>
                  <TableHead className="text-xs py-2">Service</TableHead>
                  <TableHead className="text-xs py-2 text-right">Sessions</TableHead>
                  <TableHead className="text-xs py-2 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byServiceType.map((s, i) => (
                  <TableRow key={s.service} className="text-xs">
                    <TableCell className="py-2 font-medium text-center">
                      {RANK_MEDAL[i] ?? <span className="text-muted-foreground">{i + 1}</span>}
                    </TableCell>
                    <TableCell className="py-2 font-medium">{s.service}</TableCell>
                    <TableCell className="py-2 text-right text-muted-foreground">{s.count}</TableCell>
                    <TableCell className="py-2 text-right font-bold">{s.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ChartCard>

        {/* Average attendance with progress bar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Average Attendance per Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading
              ? Array(3).fill(0).map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)
              : byServiceType.map((s, i) => {
                  const maxAvg = byServiceType[0]?.average ?? 1
                  const pct    = Math.round((s.average / maxAvg) * 100)
                  const colors = ['bg-violet-500','bg-blue-500','bg-pink-500','bg-amber-500','bg-green-500']
                  return (
                    <div key={s.service} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate">{s.service}</span>
                        <span className="font-bold tabular-nums ml-2">{s.average} avg</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${colors[i % colors.length]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
