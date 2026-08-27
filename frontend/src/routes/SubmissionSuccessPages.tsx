import { type ReactNode } from "react"
import { Link, Navigate, useLocation } from "react-router-dom"

import { useRequests } from "@/requests/RequestContext"
import { MaterialIcon } from "@/routes/stitch-shell"

const requestDetails = {
  registrationNumber: "DOP&T/R/E/21/00001",
  name: "rahul",
  date: "05-01-2021",
  authority: "Department of Personnel & Training",
  phone: "23040247",
  email: "amitjoshi@localhost.com",
}

const appealDetails = {
  registrationNumber: "DOP&T/A/E/21/00001",
  name: "rahul",
  date: "05-01-2021",
  authority: "Department of Personnel & Training",
  phone: "23040247",
  email: "amitjoshi@localhost.com",
}

function downloadRegistration(details: typeof requestDetails, type: "request" | "appeal") {
  const body = [
    `RTI ${type === "request" ? "Request" : "First Appeal"} Registration Details`,
    "",
    `Registration Number: ${details.registrationNumber}`,
    `Name: ${details.name}`,
    `Date of Filing: ${details.date}`,
    `Filed with: ${details.authority}`,
    `Telephone Number: ${details.phone}`,
    `Email Id: ${details.email}`,
  ].join("\n")
  const link = document.createElement("a")
  link.href = URL.createObjectURL(new Blob([body], { type: "text/plain" }))
  link.download = `rti-${type}-registration.txt`
  link.click()
  URL.revokeObjectURL(link.href)
}

function SuccessIcon() {
  return <div className="flex size-16 items-center justify-center rounded-full border border-green-200 bg-green-100 text-green-700 shadow-sm"><MaterialIcon className="text-4xl">check_circle</MaterialIcon></div>
}

function DetailLabel({ children }: { children: ReactNode }) {
  return <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">{children}</span>
}

export function RequestSubmissionSuccessPage() {
  const location = useLocation()
  const { requests } = useRequests()
  const requestId = (location.state as { requestId?: string } | null)?.requestId
  const request = requests.find((item) => item.id === requestId)

  if (!request) {
    return <Navigate replace to="/request-history" />
  }

  const requestDetails = {
    registrationNumber: request.id,
    name: request.applicantName,
    date: request.submittedOn,
    authority: request.authority,
    phone: request.applicantPhone,
    email: request.applicantEmail,
  }

  const copyRegistrationNumber = async () => {
    await navigator.clipboard?.writeText(requestDetails.registrationNumber)
  }

  return (
    <main className="mx-auto flex w-full max-w-container-max flex-1 items-center justify-center px-margin-mobile py-12 md:px-margin-desktop">
      <div className="w-full max-w-4xl space-y-8">
        <section className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-sm">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-primary/5 opacity-50 [background-image:radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative flex flex-col items-center gap-4"><SuccessIcon /><div><h1 className="mb-2 font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">Your RTI Request filed successfully.</h1><p className="mx-auto max-w-2xl text-body-lg text-on-surface-variant">Please note down the details of registration for future reference. A confirmation email has been sent to your registered address.</p></div></div>
        </section>

        <section className="print-submission-details overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex items-center gap-3 border-b border-outline-variant bg-surface-container-low px-6 py-4"><MaterialIcon className="text-primary">description</MaterialIcon><h2 className="font-headline-md text-xl text-primary">Registration Details</h2></div>
          <div className="grid grid-cols-1 divide-y divide-outline-variant md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="flex flex-col gap-6 p-6">
              <div className="flex flex-col gap-1"><DetailLabel>Registration Number</DetailLabel><div className="flex items-center justify-between rounded-md border border-outline-variant/50 bg-surface-container px-4 py-3"><span className="font-mono text-body-lg font-bold tracking-wide text-on-surface">{requestDetails.registrationNumber}</span><button aria-label="Copy registration number" className="text-surface-tint transition-colors hover:text-primary" onClick={copyRegistrationNumber} title="Copy Registration Number" type="button"><MaterialIcon className="text-xl">content_copy</MaterialIcon></button></div></div>
              <div className="grid grid-cols-2 gap-6"><div className="flex flex-col gap-1"><DetailLabel>Name</DetailLabel><span className="text-body-md font-medium text-on-surface">{requestDetails.name}</span></div><div className="flex flex-col gap-1"><DetailLabel>Date of Filing</DetailLabel><span className="flex items-center gap-2 text-body-md font-medium text-on-surface"><MaterialIcon className="text-sm text-outline">calendar_today</MaterialIcon>{requestDetails.date}</span></div></div>
              <div className="flex flex-col gap-1"><DetailLabel>Request filed with</DetailLabel><span className="text-body-md font-medium text-on-surface">{requestDetails.authority}</span></div>
            </div>
            <div className="flex flex-col bg-surface/50 p-6"><div className="mb-6 flex items-center gap-2"><MaterialIcon className="text-primary/70">contact_mail</MaterialIcon><h3 className="font-headline-md text-lg text-primary/80">Contact Details</h3></div><div className="flex flex-col gap-6"><ContactDetail icon="phone" label="Telephone Number" value={requestDetails.phone} /><ContactDetail icon="mail" label="Email Id" value={requestDetails.email} /></div><div className="mt-auto flex items-center gap-3 border-t border-outline-variant/50 pt-6"><span className="size-3 rounded-full bg-secondary" /><span className="text-sm font-semibold tracking-wide text-secondary">Status: {request.status}</span></div></div>
          </div>
        </section>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-primary bg-surface-container-lowest px-8 py-3 text-sm font-bold uppercase tracking-wider text-primary shadow-sm transition-colors hover:bg-primary hover:text-on-primary sm:w-auto" onClick={() => downloadRegistration(requestDetails, "request")} type="button"><MaterialIcon className="text-lg">save</MaterialIcon>Save</button>
          <button className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-secondary bg-surface-container-lowest px-8 py-3 text-sm font-bold uppercase tracking-wider text-secondary shadow-sm transition-colors hover:bg-secondary hover:text-on-secondary sm:w-auto" onClick={() => window.print()} type="button"><MaterialIcon className="text-lg">print</MaterialIcon>Print</button>
          <button className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-bold uppercase tracking-wider text-on-primary shadow-md transition-colors hover:bg-primary-container sm:w-auto" onClick={() => window.print()} type="button"><MaterialIcon className="text-lg">article</MaterialIcon>Print Application</button>
        </div>
      </div>
    </main>
  )
}

function ContactDetail({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="flex items-start gap-4"><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-outline"><MaterialIcon>{icon}</MaterialIcon></div><div className="flex flex-col pt-1"><DetailLabel>{label}</DetailLabel><span className="text-body-md font-medium text-on-surface">{value}</span></div></div>
}

function AppealTableRow({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col bg-surface-container-lowest px-6 py-4 sm:flex-row"><span className="mb-1 w-full text-label-lg font-semibold text-on-surface-variant sm:mb-0 sm:w-1/3">{label}</span><span className="w-full text-body-md text-on-surface sm:w-2/3">{value}</span></div>
}

export function AppealSubmissionSuccessPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-3xl rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm md:p-12">
        <header className="mb-10 flex flex-col items-center text-center"><div className="mb-6"><MaterialIcon className="text-6xl text-primary">check_circle</MaterialIcon></div><h1 className="mb-2 font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">Your RTI Appeal filed successfully.</h1><p className="text-body-lg text-on-surface-variant">Please note down the details of registration for future reference.</p></header>
        <section className="print-submission-details mb-8 overflow-hidden rounded-lg border border-outline-variant">
          <div className="border-b border-outline-variant bg-surface-container-low px-6 py-4"><h2 className="font-headline-md text-title-md text-primary">Registration Details</h2></div>
          <div className="divide-y divide-outline-variant"><AppealTableRow label="Registration Number" value={appealDetails.registrationNumber} /><AppealTableRow label="Name" value={appealDetails.name} /><AppealTableRow label="Date of Filing" value={appealDetails.date} /><AppealTableRow label="Request filed with" value={appealDetails.authority} /></div>
          <div className="flex items-center gap-2 border-y border-outline-variant bg-surface-container-low px-6 py-4"><MaterialIcon className="text-xl text-primary">contact_page</MaterialIcon><h3 className="font-headline-md text-label-lg uppercase tracking-wider text-primary">Contact Details</h3></div>
          <div className="divide-y divide-outline-variant"><AppealTableRow label="Telephone Number" value={appealDetails.phone} /><AppealTableRow label="Email Id" value={appealDetails.email} /></div>
        </section>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4"><button className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-headline text-label-lg font-bold text-on-primary shadow-sm transition-colors hover:bg-primary-container" onClick={() => downloadRegistration(appealDetails, "appeal")} type="button"><MaterialIcon className="text-lg">save</MaterialIcon>Save</button><button className="flex items-center gap-2 rounded-full border border-outline px-8 py-3 font-headline text-label-lg font-bold text-primary transition-colors hover:bg-surface-container-low" onClick={() => window.print()} type="button"><MaterialIcon className="text-lg">print</MaterialIcon>Print</button><button className="flex items-center gap-2 rounded-full px-6 py-3 font-headline text-label-lg font-bold text-primary transition-colors hover:bg-surface-container-low" onClick={() => window.print()} type="button"><MaterialIcon className="text-lg">description</MaterialIcon>Print Application</button></div>
        <div className="mt-10 text-center"><Link className="inline-flex items-center gap-2 font-label-lg text-label-lg font-medium text-primary hover:underline" to="/"><MaterialIcon className="text-sm">arrow_back</MaterialIcon>Return to Dashboard</Link></div>
      </div>
    </main>
  )
}
