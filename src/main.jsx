import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import { queryClient } from './lib/queryClient.js'
import './globals.css'
import { TooltipProvider } from "@/components/ui/tooltip"

// Register service worker (vite-plugin-pwa generates virtual:pwa-register at build time)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    import('virtual:pwa-register')
      .then(({ registerSW }) => registerSW({ immediate: true }))
      .catch(() => { /* not available in dev mode — safe to ignore */ })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
        <App />
        </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
