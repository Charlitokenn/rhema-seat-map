/**
 * InsightsSection.jsx
 * Auto-generated insights panel.
 */
import React from 'react'
import InsightCard from './InsightCard.jsx'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Lightbulb } from 'lucide-react'

export default function InsightsSection({ analytics, isLoading }) {
  const { insights, byServiceType, kpi } = analytics
  const total = kpi.totalAttendance || 1

  return (
    <div className="space-y-6">
      {/* Insights grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Auto-Generated Insights
            <Badge variant="secondary" className="ml-auto text-xs">{insights.length} insights</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm">Not enough data to generate insights yet.</p>
              <p className="text-xs mt-1">Save a few services and refresh.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {insights.map(insight => (
                <InsightCard key={insight.id} {...insight} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Percentage composition table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Service Contribution Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading
            ? <Skeleton className="h-40 w-full" />
            : !byServiceType.length
              ? <p className="text-sm text-muted-foreground text-center py-6">No data.</p>
              : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs py-2">Service</TableHead>
                        <TableHead className="text-xs py-2 text-right">Sessions</TableHead>
                        <TableHead className="text-xs py-2 text-right">Total</TableHead>
                        <TableHead className="text-xs py-2 text-right">Avg</TableHead>
                        <TableHead className="text-xs py-2 text-right">% of All</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byServiceType.map(s => {
                        const pct = Math.round((s.total / total) * 100)
                        return (
                          <TableRow key={s.service} className="text-xs">
                            <TableCell className="py-2 font-medium">{s.service}</TableCell>
                            <TableCell className="py-2 text-right text-muted-foreground">{s.count}</TableCell>
                            <TableCell className="py-2 text-right font-semibold">{s.total.toLocaleString()}</TableCell>
                            <TableCell className="py-2 text-right">{s.average}</TableCell>
                            <TableCell className="py-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-violet-500 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="w-8 tabular-nums">{pct}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )
          }
        </CardContent>
      </Card>
    </div>
  )
}
