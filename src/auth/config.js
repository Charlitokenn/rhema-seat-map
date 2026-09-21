/**
 * src/auth/config.js
 * The one place that reads the Clerk publishable key, so AuthProvider and
 * useAccess agree on whether Clerk is configured at all. This is a build
 * time constant (from .env.local), never changes while the app is running,
 * so components can branch on it without breaking the rules of hooks.
 */
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''
export const CLERK_ENABLED = Boolean(CLERK_PUBLISHABLE_KEY)
