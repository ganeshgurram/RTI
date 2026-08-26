import { Button } from "@/components/ui/button"
import { RequestHistoryTable } from "@/components/RequestHistoryTable"
import { mockProfile, mockProfileMetrics, mockRequests } from "@/data/mock-profile"
import { MaterialIcon } from "@/routes/stitch-shell"

export function RequestHistoryPage() {
  return (
    <div className="mx-auto flex w-full max-w-container-max flex-col gap-6 px-margin-mobile py-8 md:px-margin-desktop md:py-10">
      <header className="flex flex-col justify-between gap-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm sm:flex-row sm:items-center md:p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-on-primary">{mockProfile.initials}</div>
          <div>
            <h1 className="font-headline-lg text-2xl text-primary">RTI Request History</h1>
            <p className="mt-1 text-sm text-on-surface-variant">View and track every RTI application filed by {mockProfile.fullName}.</p>
            <p className="mt-2 text-xs text-on-surface-variant">Citizen ID: {mockProfile.id} · {mockRequests.length} total requests</p>
          </div>
        </div>
        <Button size="lg" type="button" variant="outline"><MaterialIcon>download</MaterialIcon>Download Report</Button>
      </header>

      <section aria-label="RTI activity overview" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {mockProfileMetrics.map((metric) => (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm" key={metric.label}>
            <div className="flex items-center justify-between"><span className="text-sm text-on-surface-variant">{metric.label}</span><MaterialIcon className="text-primary">{metric.icon}</MaterialIcon></div>
            <p className="mt-3 text-3xl font-bold text-primary">{metric.value}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="font-headline-lg text-xl text-primary">All Requests</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Search by request, then filter by the latest application status.</p>
        </div>
        <RequestHistoryTable />
      </section>
    </div>
  )
}
