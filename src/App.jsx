import React, {useEffect, useState} from 'react'
import ChurchCanvas   from './components/canvas/ChurchCanvas.jsx'
import ServiceLegend  from './components/ui/ServiceLegend.jsx'
import OfflineBanner  from './components/ui/OfflineBanner.jsx'
import Toast          from './components/ui/Toast.jsx'
import InstallPrompt  from './components/ui/InstallPrompt.jsx'
import ReportsSheet   from './components/reports/ReportsSheet.jsx'
import { Button }     from '@/components/ui/button'
import { BarChart2 }  from 'lucide-react'
import {AppConfig} from "@/lib/constants.js";

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

    return (
        <div className="h-full flex flex-col overflow-hidden bg-muted">

            {/* Offline banner */}
            <OfflineBanner />

            {/* Header */}
            <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-1 flex items-center gap-3 shadow-sm z-10">
                <img src={AppConfig.logo} alt={AppConfig.name} className="size-12" />
                <div className="flex-1 min-w-0">
                    <h1 className="font-bold text-gray-900 text-sm leading-tight">{AppConfig.name}</h1>
                    <p className="text-[11px] text-gray-400 leading-tight">{AppConfig.howTo}</p>
                </div>
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
