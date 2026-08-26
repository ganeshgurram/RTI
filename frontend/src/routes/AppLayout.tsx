import { Outlet } from "react-router-dom"

import { StitchFooter, StitchTopNav } from "@/routes/stitch-shell"

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background font-body-md text-on-background">
      <StitchTopNav />
      <main className="flex-grow">
        <Outlet />
      </main>
      <StitchFooter />
    </div>
  )
}
