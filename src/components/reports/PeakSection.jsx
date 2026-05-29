/**
 * PeakSection.jsx
 * Highest + lowest attendance dates, best service types.
 */
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { Flame, Snowflake, Award } from 'lucide-react'
import {formatDate} from "@/lib/utils.js";

const PEAK_CONFIG = { total: { label: 'Total', color: 'hsl(var(--chart-1))' } }

function PeakTable({ rows, variant }) {
  const isHigh = variant === 'high'
  const colors = isHigh
    ? ['bg-green-500','bg-green-400','bg-green-300','bg-green-200','bg-green-100']
    : ['bg-red-500','bg-red-400','bg-red-300','bg-red-200','bg-red-100']

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs py-2">#</TableHead>
            <TableHead className="text-xs py-2">Date</TableHead>
            <TableHead className="text-xs py-2">Service</TableHead>
            <TableHead className="text-xs py-2 text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i} className="text-xs">
              <TableCell className="py-2">
                <span className={`inline-flex w-5 h-5 rounded-full items-center justify-center text-white text-[10px] font-bold ${colors[i]}`}>
                  {i + 1}
                </span>
              </TableCell>
              <TableCell className="py-2 text-muted-foreground">{formatDate(r.date)}</TableCell>
              <TableCell className="py-2">
                <Badge variant="outline" className="text-[10px] font-normal">{r.service}</Badge>
              </TableCell>
              <TableCell className="py-2 text-right font-bold">
                {r.total}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default function PeakSection({ analytics, isLoading }) {
  const { peaks, byServiceType } = analytics
  const { highest = [], lowest = [] } = peaks

  // Bar chart: top 5 by service type
  const topServices = byServiceType.slice(0, 6)

  return (
    <div className="space-y-6">

      {/* Highest/lowest grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Highest Attendance Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading
              ? <Skeleton className="h-40 w-full" />
              : highest.length
                ? <PeakTable rows={highest} variant="high" />
                : <p className="text-sm text-muted-foreground text-center py-8">No data available.</p>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-blue-400" />
              Lowest Attendance Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading
              ? <Skeleton className="h-40 w-full" />
              : lowest.length
                ? <PeakTable rows={lowest} variant="low" />
                : <p className="text-sm text-muted-foreground text-center py-8">No data available.</p>
            }
          </CardContent>
        </Card>
      </div>

      {/* Service type performance bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            Best Performing Service Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading
            ? <Skeleton className="h-56 w-full" />
            : topServices.length < 1
              ? <p className="text-sm text-muted-foreground text-center py-8">No data available.</p>
              : (
                <ChartContainer config={PEAK_CONFIG} className="h-56 w-full">
                  <BarChart
                    data={topServices}
                    layout="vertical"
                    margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="service" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={110} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={28}>
                      {topServices.map((_, i) => {
                        const opacity = 1 - (i / topServices.length) * 0.5
                        return <Cell key={i} fill={`hsl(262 80% ${40 + i * 6}%)`} fillOpacity={opacity} />
                      })}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )
          }
        </CardContent>
      </Card>
    </div>
  )
}
