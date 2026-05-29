/**
 * TrendsSection.jsx
 * Weekly line chart + Monthly area chart.
 */
import React from 'react'
import ChartCard from './ChartCard.jsx'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
} from '@/components/ui/chart'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, ReferenceLine,
} from 'recharts'

const WEEKLY_CONFIG = {
  total:    { label: 'Total',    color: 'hsl(var(--chart-1))' },
  men:      { label: 'Men',      color: 'hsl(var(--chart-2))' },
  women:    { label: 'Women',    color: 'hsl(var(--chart-3))' },
  children: { label: 'Children', color: 'hsl(var(--chart-4))' },
}

const MONTHLY_CONFIG = {
  men:      { label: 'Men',      color: 'hsl(var(--chart-2))' },
  women:    { label: 'Women',    color: 'hsl(var(--chart-3))' },
  children: { label: 'Children', color: 'hsl(var(--chart-4))' },
}

export default function TrendsSection({ analytics, isLoading }) {
  const { weekly, monthly, kpi } = analytics
  const avg = kpi.avgAttendance

  return (
    <div className="space-y-6">
      {/* Weekly line */}
      <ChartCard
        title="Weekly Attendance Trend"
        description="Total and demographic breakdown per week"
        isLoading={isLoading}
        isEmpty={weekly.length < 2}
      >
        <ChartContainer config={WEEKLY_CONFIG} className="h-64 w-full">
          <LineChart data={weekly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {avg > 0 && (
              <ReferenceLine
                y={avg}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                label={{ value: `Avg ${avg}`, fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              />
            )}
            <Line type="monotone" dataKey="total"    stroke="var(--color-total)"    strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="men"      stroke="var(--color-men)"      strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="women"    stroke="var(--color-women)"    strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="children" stroke="var(--color-children)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ChartContainer>
      </ChartCard>

      {/* Monthly stacked area */}
      <ChartCard
        title="Monthly Attendance (Stacked)"
        description="Demographic composition per calendar month"
        isLoading={isLoading}
        isEmpty={monthly.length < 2}
      >
        <ChartContainer config={MONTHLY_CONFIG} className="h-64 w-full">
          <AreaChart data={monthly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              {['men','women','children'].map(k => (
                <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={`var(--color-${k})`} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={`var(--color-${k})`} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area type="monotone" dataKey="men"      stackId="1" stroke="var(--color-men)"      fill="url(#grad-men)"      strokeWidth={2} />
            <Area type="monotone" dataKey="women"    stackId="1" stroke="var(--color-women)"    fill="url(#grad-women)"    strokeWidth={2} />
            <Area type="monotone" dataKey="children" stackId="1" stroke="var(--color-children)" fill="url(#grad-children)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </ChartCard>
    </div>
  )
}
