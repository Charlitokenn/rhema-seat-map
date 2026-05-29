import { useEffect, useState, useCallback } from 'react'

const URL = import.meta.env.VITE_HEALTH_URL
const HEALTH_URL = URL+`?health=1`

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

      const response = await fetch(HEALTH_URL, {
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