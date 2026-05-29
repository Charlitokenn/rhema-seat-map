import { useState, useEffect } from 'react'

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable,  setIsInstallable]  = useState(false)
  const [isInstalled,    setIsInstalled]    = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }
    const onBefore  = e => { e.preventDefault(); setDeferredPrompt(e); setIsInstallable(true) }
    const onInstall = () => { setIsInstalled(true); setIsInstallable(false); setDeferredPrompt(null) }
    window.addEventListener('beforeinstallprompt', onBefore)
    window.addEventListener('appinstalled', onInstall)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore)
      window.removeEventListener('appinstalled', onInstall)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null); setIsInstallable(false)
    return outcome === 'accepted'
  }

  return { isInstallable, promptInstall, isInstalled }
}
