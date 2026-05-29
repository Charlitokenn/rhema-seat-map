/**
 * KpiCard.jsx
 * Reusable KPI metric card.
 */
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,          // number (positive = up, negative = down, undefined = neutral)
  trendLabel,
  accent = 'violet',
  isLoading = false,
  className,
}) {
  const ACCENT = {
    violet: { bg: 'bg-violet-50',  icon: 'bg-violet-100 text-violet-600',  text: 'text-violet-600' },
    blue:   { bg: 'bg-blue-50',    icon: 'bg-blue-100   text-blue-600',    text: 'text-blue-600'   },
    pink:   { bg: 'bg-pink-50',    icon: 'bg-pink-100   text-pink-600',    text: 'text-pink-600'   },
    amber:  { bg: 'bg-amber-50',   icon: 'bg-amber-100  text-amber-600',   text: 'text-amber-600'  },
    green:  { bg: 'bg-green-50',   icon: 'bg-green-100  text-green-600',   text: 'text-green-600'  },
    red:    { bg: 'bg-red-50',     icon: 'bg-red-100    text-red-600',     text: 'text-red-600'    },
  }
  const a = ACCENT[accent] ?? ACCENT.violet

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-muted-foreground'

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Accent stripe */}
      <div className={cn('absolute inset-x-0 top-0 h-0.5', a.bg.replace('bg-', 'bg-').replace('-50', '-400'))} />

      <CardContent className="p-5">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                {title}
              </p>
              <p className="text-3xl font-black text-foreground tabular-nums leading-none">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
              {trend !== undefined && (
                <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{Math.abs(trend)}% {trendLabel ?? 'vs prev period'}</span>
                </div>
              )}
            </div>
            {Icon && (
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3', a.icon)}>
                <Icon className="h-5 w-5" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
