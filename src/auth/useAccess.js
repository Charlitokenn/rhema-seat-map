import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { authFetch } from './authFetch.js'
import { CLERK_ENABLED } from './config.js'

const DISABLED_ACCESS = { status: 'signed_out', user: null, role: null, isAdmin: false, getToken: null }

/**
 * useAccess — spec 0001's single source of truth for "can this person open
 * Service Reports right now". Feature 3 gates the Service Reports button and
 * opens sign in off this hook's status:
 *
 *   loading    — Clerk hasn't finished loading yet, or the backend `me`
 *                check is in flight. Never block the seat map on this.
 *   signed_out — no session, or Clerk isn't configured at all (no
 *                VITE_CLERK_PUBLISHABLE_KEY) — the seat map works either way.
 *   no_org     — signed in, but not a member of the church organization yet:
 *                either a pending session (Clerk hasn't resolved an
 *                organization) or the backend answered `forbidden`.
 *   ready      — signed in, in the organization, and the backend confirmed
 *                it via the `me` action.
 *   error      — the backend couldn't be reached, or answered `unavailable`.
 *
 * Clerk reports a pending session (signed in, no active organization) as
 * *not* signed in through the default useAuth(); passing
 * `treatPendingAsSignedOut: false` keeps isSignedIn true so `sessionStatus`
 * can tell `no_org` apart from a real `signed_out`.
 */
export function useAccess() {
  if (!CLERK_ENABLED) return DISABLED_ACCESS
  // eslint-disable-next-line react-hooks/rules-of-hooks -- CLERK_ENABLED is a
  // build-time constant that never changes across renders in a given deploy.
  return useAccessWithClerk_()
}

function useAccessWithClerk_() {
  const { isLoaded, isSignedIn, sessionStatus, getToken, has } = useAuth({ treatPendingAsSignedOut: false })
  const isAdmin = typeof has === 'function' ? Boolean(has({ role: 'org:admin' })) : false

  const backendCheckEnabled = Boolean(isLoaded && isSignedIn && sessionStatus === 'active')

  const meQuery = useQuery({
    queryKey: ['clerk-me', isSignedIn, sessionStatus],
    queryFn: () => authFetch(getToken, 'me'),
    enabled: backendCheckEnabled,
    staleTime: 60_000,
    retry: false,
  })

  if (!isLoaded) {
    return { status: 'loading', user: null, role: null, isAdmin: false, getToken }
  }
  if (!isSignedIn) {
    return { status: 'signed_out', user: null, role: null, isAdmin: false, getToken }
  }
  if (sessionStatus === 'pending') {
    return { status: 'no_org', user: null, role: null, isAdmin, getToken }
  }
  if (meQuery.isPending) {
    return { status: 'loading', user: null, role: null, isAdmin, getToken }
  }
  if (meQuery.isError) {
    return { status: 'error', user: null, role: null, isAdmin, getToken }
  }

  const data = meQuery.data
  if (data && data.ok) {
    return { status: 'ready', user: data.user, role: data.user.role, isAdmin, getToken }
  }
  if (data && data.code === 'forbidden') {
    return { status: 'no_org', user: null, role: null, isAdmin, getToken }
  }
  return { status: 'error', user: null, role: null, isAdmin, getToken }
}
