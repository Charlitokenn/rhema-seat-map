import React, { useState } from 'react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Smartphone, Share, PlusSquare } from 'lucide-react'
import {DialogTrigger} from "./dialog";

export default function InstallPrompt() {
  const { isInstallable, promptInstall, isInstalled } = useInstallPrompt()
  const [dismissed,   setDismissed]   = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)

  const isIosSafari =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      /safari/i.test(navigator.userAgent) &&
      !/chrome|crios|fxios/i.test(navigator.userAgent)

  if (isInstalled || dismissed) return null

  // iOS — manual share-sheet instructions
  if (isIosSafari && !isInstallable) {
    return (
        <>
          <Button
              size="sm"
              className="fixed bottom-20 left-4 z-40 gap-1.5 shadow-lg"
              onClick={() => setShowIosHelp(true)}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Install App
          </Button>

          <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
            <DialogTrigger></DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Install Venue Map</DialogTitle>
                <DialogDescription>
                  Add to Home Screen for the best experience.
                </DialogDescription>
              </DialogHeader>
              <ol className="space-y-3 mt-2">
                {[
                  { icon: Share,      text: <>Tap the <strong>Share</strong> button at the bottom of Safari</> },
                  { icon: PlusSquare, text: <>Scroll down and tap <strong>"Add to Home Screen"</strong></> },
                  { icon: Smartphone, text: <>Tap <strong>Add</strong> in the top-right corner</> },
                ].map(({ icon: Icon, text }, i) => (
                    <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                      <span className="text-sm text-muted-foreground leading-snug">{text}</span>
                    </li>
                ))}
              </ol>
              <Button className="w-full mt-2" onClick={() => setShowIosHelp(false)}>
                Got it
              </Button>
            </DialogContent>
          </Dialog>
        </>
    )
  }

  if (!isInstallable) return null

  return (
      <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-sm">
        <Card className="shadow-2xl border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
              🗺️
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">Install Venue Map</p>
              <p className="text-xs text-muted-foreground">Works offline · Fast · No app store</p>
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <Button size="sm" className="h-7 text-xs px-3" onClick={() => promptInstall()}>
                Install
              </Button>
              <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs px-2 text-muted-foreground"
                  onClick={() => setDismissed(true)}
              >
                Not now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}