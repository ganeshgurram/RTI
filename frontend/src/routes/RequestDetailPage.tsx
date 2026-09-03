import { useMemo, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"

import { DeadlineNotice } from "@/components/DeadlineTracker"
import { RequestTimeline } from "@/components/RequestTimeline"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useAccountRequests } from "@/requests/RequestContext"
import { getRequestDeadline } from "@/services/statutory-deadlines"
import { MaterialIcon } from "@/routes/stitch-shell"

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-on-surface-variant">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-on-surface">{children}</dd>
    </div>
  )
}

export function RequestDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { requestId } = useParams()
  const requests = useAccountRequests()
  const [hasCopied, setHasCopied] = useState(false)
  const today = useMemo(() => new Date(), [])
  const request = requests.find((item) => item.id === requestId)

  if (!request) return <Navigate replace to="/request-history" />

  const deadline = getRequestDeadline({ request, today })
  const paymentState = request.id.startsWith("RTI-A-")
    ? t("requestDetail.notApplicable")
    : request.status === "Pending Verification"
      ? t("requestDetail.paymentPending")
      : request.isBplApplicant
        ? t("requestDetail.bplExempt")
        : t("requestDetail.paymentVerified")

  const copyRegistrationNumber = () => {
    void navigator.clipboard?.writeText(request.id).then(
      () => {
        setHasCopied(true)
        window.setTimeout(() => setHasCopied(false), 2000)
      },
      () => setHasCopied(false),
    )
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-5 px-margin-mobile py-stack-lg md:px-margin-desktop md:py-8">
      <Link className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "-ml-2")} to="/request-history">
        <MaterialIcon className="text-lg">arrow_back</MaterialIcon>{t("requestDetail.backToHistory")}
      </Link>

      <header className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-start sm:p-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-on-surface-variant">{t("requestDetail.title")}</p>
          <h1 className="mt-1 break-all font-headline-lg text-2xl text-primary sm:text-3xl">{request.id}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">{request.subject}</p>
          <div className="mt-3"><Badge className={request.statusClass} variant="outline">{request.status}</Badge></div>
        </div>
        <Button onClick={copyRegistrationNumber} type="button" variant="outline">
          <MaterialIcon className="text-[18px]">{hasCopied ? "check" : "content_copy"}</MaterialIcon>
          {hasCopied ? t("requestDetail.copied") : t("requestDetail.copyId")}
        </Button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card className="border border-border bg-card shadow-sm">
            <CardContent>
              <RequestTimeline request={request} />
            </CardContent>
          </Card>

          <Card className="border border-border bg-card shadow-sm">
            <CardContent>
              <h2 className="font-headline-md text-lg text-primary">{t("requestDetail.application")}</h2>
              <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <Field label={t("requestDetail.authority")}>{request.authority}</Field>
                <Field label={t("requestDetail.submitted")}>{request.submittedOn}</Field>
                <Field label={t("requestDetail.lastUpdated")}>{request.lastUpdated}</Field>
                <Field label={t("requestDetail.currentStatus")}>{request.status}</Field>
                <div className="sm:col-span-2"><Field label={t("requestDetail.requestText")}>{request.requestText || t("requestDetail.noText")}</Field></div>
              </dl>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card shadow-sm">
            <CardContent>
              <h2 className="font-headline-md text-lg text-primary">{t("requestDetail.paymentAndDocuments")}</h2>
              <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <Field label={t("requestDetail.paymentStatus")}>{paymentState}</Field>
                <Field label={t("requestDetail.document")}>{request.supportingDocumentName || t("requestDetail.noDocument")}</Field>
              </dl>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="border border-border bg-card shadow-sm">
            <CardContent>
              <h2 className="font-headline-md text-lg text-primary">{t("requestDetail.nextSteps")}</h2>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">{request.nextAction}</p>
              <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-outline">{t("requestDetail.applicantOnly")}</p>
            </CardContent>
          </Card>
          {deadline ? <DeadlineNotice appealFor={{ email: request.applicantEmail, registrationNumber: request.id, requestId: request.id }} deadline={deadline} /> : null}
          <Button className="w-full" onClick={() => navigate("/submit-request")} type="button" variant="outline">
            <MaterialIcon className="text-[18px]">add</MaterialIcon>{t("requestDetail.newRequest")}
          </Button>
        </aside>
      </div>
    </main>
  )
}
