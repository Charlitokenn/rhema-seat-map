import React, {useEffect, useRef, useState} from 'react'
import ChurchCanvas   from './components/canvas/ChurchCanvas.jsx'
import ServiceLegend  from './components/ui/ServiceLegend.jsx'
import OfflineBanner  from './components/ui/OfflineBanner.jsx'
import Toast          from './components/ui/Toast.jsx'
import InstallPrompt  from './components/ui/InstallPrompt.jsx'
import ReportsSheet   from './components/reports/ReportsSheet.jsx'
import { Button }     from '@/components/ui/button'
import { BarChart2 }  from 'lucide-react'
import {AppConfig} from "@/lib/constants.js";
import { UserButton } from '@clerk/react'
import { useAccess } from '@/auth/useAccess.js'
import { useOptionalClerk } from '@/auth/useOptionalClerk.js'
import AccessBanner from '@/auth/AccessBanner.jsx'
import { useOnlineStatus } from '@/hooks/useOnlineStatus.js'
import { useUiStore } from '@/store/uiStore.js'

/**
 * App — root layout
 *
 * Desktop (lg+):
 *   ┌──────────────────────────────────┬──────────────┐
 *   │  Header bar                      │              │
 *   ├──────────────────────────────────┤  ServiceLe-  │
 *   │                                  │  gend        │
 *   │   ChurchCanvas (Konva)           │  sidebar     │
 *   │                                  │              │
 *   └──────────────────────────────────┴──────────────┘
 *
 * Mobile (< lg):
 *   ┌──────────────────────────────────┐
 *   │  Header bar                      │
 *   ├──────────────────────────────────┤
 *   │   ChurchCanvas (Konva)           │
 *   ├──────────────────────────────────┤
 *   │  ServiceLegend compact bar       │
 *   └──────────────────────────────────┘
 */
export default function App() {
        useEffect(() => {
        document.title = AppConfig.name;
    }, []);
    const [reportsOpen, setReportsOpen] = useState(false)

    // ── Sign in (spec 0001: people and sign in) ─────────────────────────────
    const access    = useAccess()
    console.log('access status', access.status)
    const clerk     = useOptionalClerk()
    const isOnline  = useOnlineStatus()
    const toast     = useUiStore(s => s.toast)
    const isSignedIn = access.status === 'ready' || access.status === 'no_org'

    // AC-10: a session that ends while the app is open (token stopped
    // refreshing, or the person was removed) gets a clear message, not a
    // silent drop back to signed out.
    const prevStatusRef = useRef(access.status)
    useEffect(() => {
        var wasSignedIn = prevStatusRef.current === 'ready' || prevStatusRef.current === 'no_org'
        if (wasSignedIn && access.status === 'signed_out') {
            toast('Your session ended. Please sign in again.', 'info', 5000)
        }
        prevStatusRef.current = access.status
    }, [access.status, toast])

    // AC-5 + AC-12: the header logo's three tap rules, plus the offline and
    // loading edge states. The seat map never waits on any of this.
    function handleLogoTap() {
        if (!isOnline) {
            toast('Sign in needs a connection.', 'info')
            return
        }
        if (access.status === 'loading') {
            toast('Sign in is loading. Try again in a moment.', 'info')
            return
        }
        if (access.status === 'error') {
            toast('Sign in is busy. Try again in a moment.', 'info')
            return
        }
        if (access.status === 'signed_out') {
            clerk?.openSignIn({})
            return
        }
        // Signed in (ready or no_org): Clerk enforces who may manage the
        // organization, the toast for a non admin is only a courtesy.
        if (access.isAdmin) {
            clerk?.openOrganizationProfile()
        } else {
            toast('Only admins can manage organization settings.', 'info')
        }
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-muted">

            {/* Offline banner */}
            <OfflineBanner />

            {/* Not part of the organization yet (AC-2) */}
            {access.status === 'no_org' && <AccessBanner />}

            {/* Header */}
            <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-1 flex items-center gap-3 shadow-sm z-10">
                <button
                    type="button"
                    onClick={handleLogoTap}
                    aria-label="Organization settings"
                    className="flex-shrink-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                >
                    <img src={AppConfig.logo} alt={AppConfig.name} className="size-12" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="font-bold text-gray-900 text-sm leading-tight">{AppConfig.name}</h1>
                    <p className="text-[11px] text-gray-400 leading-tight">{AppConfig.howTo}</p>
                </div>
                {isSignedIn && (
                    <UserButton afterSignOutUrl={window.location.href} />
                )}
                {/* Reports button — far right */}
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-8 flex-shrink-0"
                    onClick={() => setReportsOpen(true)}
                >
                    <BarChart2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Reports</span>
                </Button>
            </header>

            {/* Main content area */}
            <div className="flex-1 flex overflow-hidden min-h-0">

                {/* Canvas */}
                <main className="flex-1 relative overflow-hidden min-w-0">
                    <ChurchCanvas />
                </main>

                {/* Sidebar legend — lg+ */}
                <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 bg-background border-l overflow-hidden">
                    <ServiceLegend />
                </aside>
            </div>

            {/* Compact bottom bar — mobile only */}
            <div className="lg:hidden flex-shrink-0">
                <ServiceLegend compact />
            </div>

            {/* Global overlays */}
            <Toast />
            <InstallPrompt />

            {/* Reports full-screen sheet */}
            <ReportsSheet open={reportsOpen} onOpenChange={setReportsOpen} />
        </div>
    )
}
