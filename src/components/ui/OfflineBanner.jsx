import React from 'react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus.js'
import { WifiOff } from 'lucide-react'
import {Alert, AlertDescription} from "./alert.jsx";

export default function OfflineBanner() {
    const isOnline = useOnlineStatus()
    if (isOnline) return null
    return (
        <Alert
            role="alert"
            className="flex-shrink-0 rounded-none border-x-0 border-t-0 border-amber-400 bg-amber-50 text-amber-800 py-2 px-4"
        >
            <WifiOff className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm font-medium text-amber-800">
                Offline — changes save on your device. Reconnect to sync to Database
            </AlertDescription>
        </Alert>
    )
}