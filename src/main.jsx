import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import { queryClient } from './lib/queryClient.js'
import './globals.css'
import { TooltipProvider } from "@/components/ui/tooltip"
import AuthProvider from './auth/AuthProvider.jsx'

// Register service worker (vite-plugin-pwa generates virtual:pwa-register at build time)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        import('virtual:pwa-register')
            .then(({ registerSW }) => registerSW({ immediate: true }))
            .catch(() => { /* not available in dev mode — safe to ignore */ })
    })
}

ReactDOM.createRoot(document.getElementById('root')).render(
    // AuthProvider (ClerkProvider) is deliberately OUTSIDE StrictMode: React 18's
    // dev-mode double-invoke of effects causes @clerk/react's script loader to
    // poll a stale <script data-clerk-js-script> tag and time out after 15s
    // with a ClerkRuntimeError (code: failed_to_load_clerk_js). Everything else
    // still gets StrictMode's checks.
    <AuthProvider>
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <App />
                </TooltipProvider>
            </QueryClientProvider>
        </React.StrictMode>
    </AuthProvider>
)