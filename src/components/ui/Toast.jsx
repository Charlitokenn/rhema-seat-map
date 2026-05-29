import React from 'react'
import { useUiStore } from '../../store/uiStore.js'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const VARIANTS = {
  success: {
    container: 'bg-green-600 text-white border-green-500',
    icon: CheckCircle,
  },
  error: {
    container: 'bg-destructive text-destructive-foreground border-destructive/80',
    icon: XCircle,
  },
  info: {
    container: 'bg-zinc-800 text-zinc-50 border-zinc-700',
    icon: Info,
  },
}

export default function Toast() {
  const toasts       = useUiStore(s => s.toasts)
  const dismissToast = useUiStore(s => s.dismissToast)

  if (!toasts.length) return null

  return (
      <div
          aria-live="polite"
          className="fixed bottom-24 left-0 right-0 z-[60] flex flex-col items-center gap-2 pointer-events-none px-4"
      >
        {toasts.map(t => {
          const variant = VARIANTS[t.type] ?? VARIANTS.info
          const Icon    = variant.icon
          return (
              <div
                  key={t.id}
                  className={cn(
                      'pointer-events-auto flex items-center gap-3 px-4 py-3',
                      'rounded-xl shadow-2xl border text-sm font-medium max-w-sm w-full',
                      'animate-in slide-in-from-bottom-4 duration-200',
                      variant.container
                  )}
              >
                <Icon className="h-4 w-4 flex-shrink-0 opacity-90" />
                <span className="flex-1 leading-snug">{t.message}</span>
                <button
                    onClick={() => dismissToast(t.id)}
                    className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity rounded-sm"
                    aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
          )
        })}
      </div>
  )
}