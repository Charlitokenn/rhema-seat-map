import { useEffect, useState, useCallback } from 'react'

const BASE_HEALTH_URL = import.meta.env.VITE_GAS_URL
const HEALTH_URL = BASE_HEALTH_URL ? new URL(BASE_HEALTH_URL, window.location.origin)
    : null

if (HEALTH_URL) HEALTH_URL.searchParams.set('health', '1')

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  const checkConnection = useCallback(async () => {
    // Immediate browser offline detection
    if (!navigator.onLine) {
      setIsOnline(false)
      return
    }

    try {
      const controller = new AbortController()

      const timeout = setTimeout(() => {
        controller.abort()
      }, 5000)

      if (!HEALTH_URL) {
        setIsOnline(navigator.onLine)
        return
      }

      const response = await fetch(HEALTH_URL.toString(), {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeout)

      setIsOnline(response.ok)
    } catch {
      setIsOnline(false)
    }
  }, [])

  useEffect(() => {
    checkConnection()

    window.addEventListener('online', checkConnection)
    window.addEventListener('offline', checkConnection)

    const interval = setInterval(checkConnection, 30000)

    return () => {
      window.removeEventListener('online', checkConnection)
      window.removeEventListener('offline', checkConnection)
      clearInterval(interval)
    }
  }, [checkConnection])

  return isOnline
}