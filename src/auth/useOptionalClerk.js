import { useClerk } from '@clerk/react'
import { CLERK_ENABLED } from './config.js'

/**
 * useOptionalClerk — useClerk() throws outside a <ClerkProvider>, and
 * AuthProvider only mounts one when CLERK_ENABLED. Everything that wants
 * to call openSignIn/openOrganizationProfile/signOut goes through this
 * instead of useClerk() directly, so it degrades to a no-op when Clerk
 * isn't configured rather than crashing the seat map (AC-7).
 */
export function useOptionalClerk() {
  if (!CLERK_ENABLED) return null
  // eslint-disable-next-line react-hooks/rules-of-hooks -- CLERK_ENABLED is a
  // build-time constant that never changes across renders in a given deploy.
  return useClerk()
}
