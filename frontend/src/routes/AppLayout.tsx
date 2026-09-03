import { useLayoutEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { RtiSahayak } from "@/components/RtiSahayak"
import { RequestGuidelinesDialogProvider } from "@/request-guidelines/RequestGuidelinesDialog"
import { StitchFooter, StitchTopNav } from "@/routes/stitch-shell"

export function AppLayout() {
  const location = useLocation()

  // React Router keeps this single-page app mounted between routes. Reset before paint so a
  // newly opened page never inherits the previous page's scroll position.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [location.key])

  return (
    <RequestGuidelinesDialogProvider>
      <div className="flex min-h-[calc(100svh/var(--app-scale))] flex-col bg-background font-body-md text-on-background">
        <StitchTopNav />
        <main className="flex-grow">
          <Outlet />
        </main>
        <StitchFooter />
        <RtiSahayak />
      </div>
    </RequestGuidelinesDialogProvider>
  )
}
