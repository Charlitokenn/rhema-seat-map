/**
 * DemographicsSection.jsx
 * Stacked bar + donut + gender trend line.
 */
import React from 'react'
import ChartCard from './ChartCard.jsx'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
} from '@/components/ui/chart'
import {
  BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
} from 'recharts'

const DEMO_CONFIG = {
  men:      { label: 'Men',      color: 'hsl(var(--chart-2))' },
  women:    { label: 'Women',    color: 'hsl(var(--chart-3))' },
  children: { label: 'Children', color: 'hsl(var(--chart-4))' },
}

// Custom donut label
function DonutLabel({ viewBox, data }) {
  const { cx, cy } = viewBox || {}
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!cx || !cy) return null
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground" fontSize={22} fontWeight={700}>
        {total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground" fontSize={11}>
        total
      </text>
    </g>
  )
}

export default function DemographicsSection({ analytics, isLoading }) {
  const { demographic, weekly, monthly } = analytics

  const totalValue = demographic.reduce((s, d) => s + d.value, 0)

  return (
    <div className="space-y-6">
      {/* Stacked bar - per month */}
      <ChartCard
        title="Monthly Demographic Breakdown"
        description="Men, women, and children per calendar month"
        isLoading={isLoading}
        isEmpty={monthly.length < 2}
      >
        <ChartContainer config={DEMO_CONFIG} className="h-64 w-full">
          <BarChart data={monthly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="men"      stackId="a" fill="var(--color-men)"      radius={[0,0,0,0]} />
            <Bar dataKey="women"    stackId="a" fill="var(--color-women)"    radius={[0,0,0,0]} />
            <Bar dataKey="children" stackId="a" fill="var(--color-children)" radius={[4,4,0,0]} />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut */}
        <ChartCard
          title="Attendance Composition"
          description="Overall demographic split"
          isLoading={isLoading}
          isEmpty={totalValue === 0}
        >
          <div className="flex flex-col items-center gap-4">
            <ChartContainer config={DEMO_CONFIG} className="h-52 w-full max-w-xs mx-auto">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={demographic}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {demographic.map((d, i) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                  <DonutLabel data={demographic} />
                </Pie>
              </PieChart>
            </ChartContainer>
            {/* Legend pills */}
            <div className="flex flex-wrap justify-center gap-3">
              {demographic.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: d.fill }}
                  />
                  <span className="font-medium text-foreground">{d.name}</span>
                  <span className="text-muted-foreground">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* Gender trend line */}
        <ChartCard
          title="Demographic Trend Over Time"
          description="Weekly gender and children trends"
          isLoading={isLoading}
          isEmpty={weekly.length < 2}
        >
          <ChartContainer config={DEMO_CONFIG} className="h-52 w-full">
            <LineChart data={weekly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="men"      stroke="var(--color-men)"      strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="women"    stroke="var(--color-women)"    strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="children" stroke="var(--color-children)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </ChartCard>
      </div>
    </div>
  )
}
