/**
 * ChartCard.jsx
 * Reusable chart wrapper with title, description, and optional action.
 */
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ChartCard({
  title,
  description,
  action,
  isLoading = false,
  isEmpty   = false,
  emptyMessage = 'No data available for the selected period.',
  children,
  className,
}) {
  return (
    <Card className={className}>
      {(title || description || action) && (
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              {title       && <CardTitle className="text-sm font-semibold">{title}</CardTitle>}
              {description && <CardDescription className="text-xs">{description}</CardDescription>}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent className="pb-4">
        {isLoading ? (
          <Skeleton className="w-full h-56 rounded-lg" />
        ) : isEmpty ? (
          <div className="flex items-center justify-center h-56 rounded-lg bg-muted/30 border-2 border-dashed border-muted">
            <div className="text-center space-y-1.5">
              <p className="text-2xl">📊</p>
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
          </div>
        ) : children}
      </CardContent>
    </Card>
  )
}
