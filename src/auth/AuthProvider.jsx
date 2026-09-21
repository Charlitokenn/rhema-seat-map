import React from 'react'
import { ClerkProvider } from '@clerk/react'
import { CLERK_ENABLED, CLERK_PUBLISHABLE_KEY } from './config.js'

/**
 * AuthProvider — wraps the app in Clerk's provider (spec 0001, Build plan
 * task 4). The seat map, Submit and analytics must keep working with no
 * sign in configured at all (AC-7), so with no publishable key this simply
 * renders children unwrapped: useAccess() then reports status 'signed_out'
 * for good, and the seat map is none the wiser.
 */
export default function AuthProvider({ children }) {
    if (!CLERK_ENABLED) {
        if (import.meta.env.DEV) {
            console.warn('VITE_CLERK_PUBLISHABLE_KEY is not set — Service Reports sign in is disabled.')
        }
        return children
    }

    return (
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
            {children}
        </ClerkProvider>
    )
}
