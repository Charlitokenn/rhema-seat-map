/**
 * InsightCard.jsx
 * Displays a single auto-generated insight.
 */
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const STYLES = {
  success: {
    border: 'border-green-200',
    bg:     'bg-green-50',
    icon:   'text-green-600 bg-green-100',
    title:  'text-green-900',
    body:   'text-green-800',
    Icon:   TrendingUp,
  },
  warning: {
    border: 'border-amber-200',
    bg:     'bg-amber-50',
    icon:   'text-amber-600 bg-amber-100',
    title:  'text-amber-900',
    body:   'text-amber-800',
    Icon:   AlertTriangle,
  },
  info: {
    border: 'border-blue-200',
    bg:     'bg-blue-50',
    icon:   'text-blue-600 bg-blue-100',
    title:  'text-blue-900',
    body:   'text-blue-800',
    Icon:   Info,
  },
  error: {
    border: 'border-red-200',
    bg:     'bg-red-50',
    icon:   'text-red-600 bg-red-100',
    title:  'text-red-900',
    body:   'text-red-800',
    Icon:   TrendingDown,
  },
}

export default function InsightCard({ title, body, type = 'info', className }) {
  const s = STYLES[type] ?? STYLES.info
  const { Icon } = s

  return (
    <Card className={cn('border', s.border, s.bg, className)}>
      <CardContent className="p-4 flex gap-3">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', s.icon)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className={cn('text-sm font-semibold leading-snug', s.title)}>{title}</p>
          <p className={cn('text-xs leading-relaxed', s.body)}>{body}</p>
        </div>
      </CardContent>
    </Card>
  )
}
