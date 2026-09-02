import { type ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, Navigate, useLocation } from "react-router-dom"

import { IconTooltip } from "@/components/IconTooltip"
import { Button } from "@/components/ui/button"
import { useRequests } from "@/requests/RequestContext"
import { MaterialIcon } from "@/routes/stitch-shell"

/** What a registration receipt shows, whether it acknowledges a request or a first appeal. */
type RegistrationDetails = {
  registrationNumber: string
  name: string
  date: string
  authority: string
  phone: string
  email: string
  /** Appeals only: the registration number of the request being appealed against. */
  againstRequestId?: string
}

/** Only the shape this file needs from i18next, so the helper stays callable outside a component. */
type Translate = (key: string, options?: Record<string, unknown>) => string

function downloadRegistration(details: RegistrationDetails, type: "request" | "appeal", t: Translate) {
  const body = [
    t(type === "request" ? "success.receiptRequest" : "success.receiptAppeal"),
    "",
    `${t("success.registrationNumber")}: ${details.registrationNumber}`,
    `${t("success.name")}: ${details.name}`,
    `${t("success.dateOfFiling")}: ${details.date}`,
    `${t("success.filedWith")}: ${details.authority}`,
    `${t("success.phone")}: ${details.phone}`,
    `${t("success.email")}: ${details.email}`,
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
  const { t } = useTranslation()
  const location = useLocation()
  const { requests } = useRequests()
  const [isRegistrationCopied, setIsRegistrationCopied] = useState(false)
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
    let didCopy = false

    try {
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(requestDetails.registrationNumber)
        didCopy = true
      }
    } catch {
      // Clipboard access can be denied even on HTTPS. Fall back to the browser's legacy copy
      // command below, which also supports local HTTP preview environments.
    }

    if (!didCopy) {
      const copyTarget = document.createElement("textarea")
      copyTarget.value = requestDetails.registrationNumber
      copyTarget.setAttribute("readonly", "")
      copyTarget.style.position = "fixed"
      copyTarget.style.opacity = "0"
      document.body.appendChild(copyTarget)
      copyTarget.select()
      didCopy = document.execCommand("copy")
      copyTarget.remove()
    }

    if (didCopy) {
      setIsRegistrationCopied(true)
      window.setTimeout(() => setIsRegistrationCopied(false), 2_000)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-container-max flex-1 items-center justify-center px-margin-mobile py-12 md:px-margin-desktop">
      <div className="w-full max-w-4xl space-y-8">
        <section className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-sm">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-primary/5 opacity-50 [background-image:radial-gradient(var(--primary)_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative flex flex-col items-center gap-4"><SuccessIcon /><div><h1 className="mb-2 font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">{t("success.requestTitle")}</h1><p className="mx-auto max-w-2xl text-body-lg text-on-surface-variant">{t("success.requestSubtitle")}</p></div></div>
        </section>

        <section className="print-submission-details overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex items-center gap-3 border-b border-outline-variant bg-surface-container-low px-6 py-4"><MaterialIcon className="text-primary">description</MaterialIcon><h2 className="font-headline-md text-xl text-primary">{t("success.registrationDetails")}</h2></div>
          <div className="grid grid-cols-1 divide-y divide-outline-variant md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="flex flex-col gap-6 p-6">
              <div className="flex flex-col gap-1"><DetailLabel>{t("success.registrationNumber")}</DetailLabel><div className="flex items-center justify-between rounded-md border border-outline-variant/50 bg-surface-container px-4 py-3"><span className="font-mono text-body-lg font-bold tracking-wide text-on-surface">{requestDetails.registrationNumber}</span><IconTooltip label={isRegistrationCopied ? t("success.copied") : t("success.copy")} render={<Button aria-label={isRegistrationCopied ? t("success.copied") : t("success.copy")} className={isRegistrationCopied ? "w-auto px-2 text-state-success" : "text-surface-tint"} onClick={copyRegistrationNumber} size="icon" type="button" variant="outline" />}><MaterialIcon className="text-lg">{isRegistrationCopied ? "check" : "content_copy"}</MaterialIcon>{isRegistrationCopied ? <span className="text-xs font-semibold">{t("success.copiedShort")}</span> : null}<span className="sr-only" aria-live="polite">{isRegistrationCopied ? t("success.copied") : ""}</span></IconTooltip></div></div>
              <div className="grid grid-cols-2 gap-6"><div className="flex flex-col gap-1"><DetailLabel>{t("success.name")}</DetailLabel><span className="text-body-md font-medium text-on-surface">{requestDetails.name}</span></div><div className="flex flex-col gap-1"><DetailLabel>{t("success.dateOfFiling")}</DetailLabel><span className="flex items-center gap-2 text-body-md font-medium text-on-surface"><MaterialIcon className="text-sm text-outline">calendar_today</MaterialIcon>{requestDetails.date}</span></div></div>
              <div className="flex flex-col gap-1"><DetailLabel>{t("success.filedWith")}</DetailLabel><span className="text-body-md font-medium text-on-surface">{requestDetails.authority}</span></div>
            </div>
            <div className="flex flex-col bg-surface/50 p-6"><div className="mb-6 flex items-center gap-2"><MaterialIcon className="text-primary/70">contact_mail</MaterialIcon><h3 className="font-headline-md text-lg text-primary/80">{t("success.contactDetails")}</h3></div><div className="flex flex-col gap-6"><ContactDetail icon="phone" label={t("success.phone")} value={requestDetails.phone} /><ContactDetail icon="mail" label={t("success.email")} value={requestDetails.email} /></div><div className="mt-auto flex items-center gap-3 border-t border-outline-variant/50 pt-6"><span className="size-3 rounded-full bg-state-warning" /><span className="text-sm font-semibold tracking-wide text-state-warning">{t("success.statusLabel", { status: request.status })}</span></div></div>
          </div>
        </section>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-primary bg-surface-container-lowest px-8 py-3 text-sm font-bold uppercase tracking-wider text-primary shadow-sm transition-colors hover:bg-primary hover:text-on-primary sm:w-auto" onClick={() => downloadRegistration(requestDetails, "request", t)} type="button"><MaterialIcon className="text-lg">save</MaterialIcon>{t("success.save")}</button>
          <button className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-bold uppercase tracking-wider text-on-primary shadow-md transition-colors hover:bg-primary-container sm:w-auto" onClick={() => window.print()} type="button"><MaterialIcon className="text-lg">print</MaterialIcon>{t("success.printRequest")}</button>
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
  const { t } = useTranslation()
  const location = useLocation()
  const appealDetails = (location.state as { appeal?: RegistrationDetails } | null)?.appeal

  // Nothing was filed, so there is no receipt to show. Send them to the start of the appeal.
  if (!appealDetails) {
    return <Navigate replace to="/submit-first-appeal" />
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-3xl rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm md:p-12">
        <header className="mb-10 flex flex-col items-center text-center"><div className="mb-6"><SuccessIcon /></div><h1 className="mb-2 font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">{t("success.appealTitle")}</h1><p className="text-body-lg text-on-surface-variant">{t("success.appealSubtitle")}</p></header>
        <section className="print-submission-details mb-8 overflow-hidden rounded-lg border border-outline-variant">
          <div className="border-b border-outline-variant bg-surface-container-low px-6 py-4"><h2 className="font-headline-md text-xl text-primary">{t("success.registrationDetails")}</h2></div>
          <div className="divide-y divide-outline-variant"><AppealTableRow label={t("success.registrationNumber")} value={appealDetails.registrationNumber} /><AppealTableRow label={t("success.name")} value={appealDetails.name} /><AppealTableRow label={t("success.dateOfFiling")} value={appealDetails.date} /><AppealTableRow label={t("success.filedWith")} value={appealDetails.authority} />{appealDetails.againstRequestId ? <AppealTableRow label={t("success.appealAgainst")} value={appealDetails.againstRequestId} /> : null}</div>
          <div className="flex items-center gap-2 border-y border-outline-variant bg-surface-container-low px-6 py-4"><MaterialIcon className="text-xl text-primary">contact_page</MaterialIcon><h3 className="font-headline-md text-label-lg uppercase tracking-wider text-primary">{t("success.contactDetails")}</h3></div>
          <div className="divide-y divide-outline-variant"><AppealTableRow label={t("success.phone")} value={appealDetails.phone} /><AppealTableRow label={t("success.email")} value={appealDetails.email} /></div>
        </section>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4"><button className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-headline text-label-lg font-bold text-on-primary shadow-sm transition-colors hover:bg-primary-container" onClick={() => downloadRegistration(appealDetails, "appeal", t)} type="button"><MaterialIcon className="text-lg">save</MaterialIcon>{t("success.save")}</button><button className="flex items-center gap-2 rounded-full border border-outline px-8 py-3 font-headline text-label-lg font-bold text-primary transition-colors hover:bg-surface-container-low" onClick={() => window.print()} type="button"><MaterialIcon className="text-lg">print</MaterialIcon>{t("success.printAppeal")}</button></div>
        <div className="mt-10 text-center"><Link className="inline-flex items-center gap-2 font-label-lg text-label-lg font-medium text-primary hover:underline" to="/"><MaterialIcon className="text-sm">arrow_back</MaterialIcon>{t("success.returnDashboard")}</Link></div>
      </div>
    </main>
  )
}
