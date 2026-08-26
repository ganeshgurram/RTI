import { MaterialIcon } from "@/routes/stitch-shell"

const rows = [
  ["RTI-2023-8942", "Urban Development Budget Alloc...", "Urban Development Budget Allocation 2022", "12 Nov 2023", "Satisfied", "bg-secondary text-secondary-foreground border-border"],
  ["RTI-2024-0105", "Public Works Department Road...", "Public Works Department Road Tender Details", "05 Jan 2024", "Processing", "bg-muted text-muted-foreground border-border"],
  ["RTI-2023-5521", "Municipal Water Supply Qualit...", "Municipal Water Supply Quality Report Q3", "22 Aug 2023", "Not Satisfied", "bg-destructive/10 text-destructive border-destructive/20"],
  ["RTI-2023-6710", "Healthcare Facility Staffing Re...", "Healthcare Facility Staffing Records", "14 Sep 2023", "First Appeal", "bg-secondary text-secondary-foreground border-border"],
  ["RTI-2023-3398", "Environmental Clearance for S...", "Environmental Clearance for Sector 9 Project", "10 May 2023", "Second Appeal", "bg-primary text-primary-foreground border-primary"],
]

export function ProfilePage() {
  return (
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-6 py-10">
        <h1 className="text-[32px] font-bold leading-[40px] text-primary-container">My Profile</h1>
        <div className="flex w-full flex-col gap-6 lg:flex-row">
          <div className="lg:w-3/4">
            <div className="relative h-full overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <div className="absolute left-0 top-0 h-1 w-full bg-primary-container" />
              <h2 className="mb-4 border-b border-outline-variant/50 pb-2 text-[18px] font-semibold text-primary-container">Personal Details</h2>
              <div className="space-y-4">
                <div><p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">Email Address</p><p className="text-[16px] text-on-surface">rajesh.kumar@example.in</p></div>
                <div><p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">Mobile Number</p><p className="text-[16px] text-on-surface">+91 98765 43210</p></div>
              </div>
              <div className="mt-8 border-t border-outline-variant/50 pt-4"><button className="w-full rounded-md border border-outline-variant px-4 py-2 text-[14px] font-semibold text-primary-container transition-colors hover:bg-surface-container-low">Edit Details</button></div>
            </div>
          </div>
          <div className="lg:w-1/4">
            <div className="h-full rounded-lg border border-outline-variant bg-surface-container-low p-6 shadow-sm">
              <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">Activity Overview</h3>
              <div className="flex flex-col gap-4">
                <div className="rounded-md border border-outline-variant/50 bg-surface-container-lowest p-4 text-center shadow-sm"><span className="block text-[28px] font-bold text-primary-container">12</span><span className="text-[12px] font-medium text-on-surface-variant">Total Requests</span></div>
                <div className="rounded-md border border-outline-variant/50 bg-surface-container-lowest p-4 text-center shadow-sm"><span className="block text-[28px] font-bold text-foreground">3</span><span className="text-[12px] font-medium text-on-surface-variant">Pending</span></div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[24px] font-semibold text-primary-container">RTI Requests History</h2>
            <div className="flex gap-2"><button className="flex items-center justify-center rounded-md border border-outline-variant p-2 text-on-surface-variant shadow-sm transition-colors hover:bg-surface-container"><MaterialIcon className="text-sm">filter_list</MaterialIcon></button><button className="rounded-md bg-primary-container px-4 py-2 text-[14px] font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container/90">Download Report</button></div>
          </div>
          <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead><tr className="border-b border-outline-variant bg-surface-container-low text-[12px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant"><th className="px-6 py-4 font-semibold">Request ID</th><th className="px-6 py-4 font-semibold">Subject</th><th className="px-6 py-4 font-semibold">Date Submitted</th><th className="px-6 py-4 font-semibold">Status</th><th className="px-6 py-4 text-right font-semibold">Action</th></tr></thead>
                <tbody className="divide-y divide-outline-variant/50 text-[14px] text-on-surface">
                  {rows.map(([id, subject, title, date, status, statusClass]) => (
                    <tr className="transition-colors hover:bg-surface-container/30" key={id}>
                      <td className="px-6 py-4 font-semibold text-primary-container">{id}</td>
                      <td className="max-w-[200px] truncate px-6 py-4" title={title}>{subject}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{date}</td>
                      <td className="px-6 py-4"><span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${statusClass}`}>{status}</span></td>
                      <td className="px-6 py-4 text-right"><button className="text-[14px] font-semibold text-surface-tint underline-offset-2 hover:text-primary-container hover:underline">View Details</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-lowest px-6 py-4">
              <span className="text-[14px] text-on-surface-variant">Showing 1 to 5 of 12 requests</span>
              <div className="flex gap-1"><button className="flex size-8 items-center justify-center rounded-md border border-outline-variant text-[14px] text-outline opacity-50"><MaterialIcon className="text-[18px]">chevron_left</MaterialIcon></button><button className="flex size-8 items-center justify-center rounded-md bg-primary-container text-[14px] font-medium text-on-primary">1</button><button className="flex size-8 items-center justify-center rounded-md border border-outline-variant text-[14px] font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low">2</button><button className="flex size-8 items-center justify-center rounded-md border border-outline-variant text-[14px] font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low">3</button><button className="flex size-8 items-center justify-center rounded-md border border-outline-variant text-[14px] text-primary-container transition-colors hover:bg-surface-container-low"><MaterialIcon className="text-[18px]">chevron_right</MaterialIcon></button></div>
            </div>
          </div>
        </div>
      </div>
  )
}
