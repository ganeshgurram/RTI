import { Outlet } from "react-router-dom"

import { RtiSahayak } from "@/components/RtiSahayak"
import { RequestGuidelinesDialogProvider } from "@/request-guidelines/RequestGuidelinesDialog"
import { StitchFooter, StitchTopNav } from "@/routes/stitch-shell"

export function AppLayout() {
  return (
    <RequestGuidelinesDialogProvider>
      <div className="flex min-h-svh flex-col bg-background font-body-md text-on-background">
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
