import React from 'react'
import { ShieldAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertAction } from '@/components/ui/alert.jsx'
import { Button } from '@/components/ui/button'
import { useOptionalClerk } from './useOptionalClerk.js'

/**
 * AccessBanner — shown when a signed in person is not (yet) a member of the
 * church organization (spec 0001, AC-2). The seat map, Submit and analytics
 * keep working underneath exactly as they do for a signed out person; this
 * only explains why Service Reports isn't reachable yet and offers a way out.
 */
export default function AccessBanner() {
    const clerk = useOptionalClerk()

    return (
        <Alert
            role="alert"
            className="flex-shrink-0 rounded-none border-x-0 border-t-0 border-blue-300 bg-blue-50 text-blue-900 py-2 px-4"
        >
            <ShieldAlert className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm font-medium text-blue-900">
                You are signed in but not part of the church team yet. Ask an admin to invite you.
            </AlertDescription>
            <AlertAction>
                <Button size="sm" variant="outline" onClick={() => clerk?.signOut()}>
                    Sign out
                </Button>
            </AlertAction>
        </Alert>
    )
}
