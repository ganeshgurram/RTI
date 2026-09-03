import { useMemo, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { useAuth } from "@/auth/AuthContext"
import { DeadlineNotice } from "@/components/DeadlineTracker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { RtiRequest } from "@/requests/RequestContext"
import { getRequestDeadline } from "@/services/statutory-deadlines"

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-on-surface-variant">{label}</dt>
      <dd className="mt-1 text-sm text-on-surface">{children}</dd>
    </div>
  )
}

/**
 * Everything the portal holds about one request, on top of the history list.
 *
 * The list can only afford a line per request, so the request itself - the part that took the
 * applicant the longest to write - was the one thing it could never show. This is where it goes,
 * alongside the statutory clock, so a row is readable without leaving the page.
 */
function RequestDetailDialog({ onClose, request }: { onClose: () => void; request: RtiRequest | null }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [hasCopied, setHasCopied] = useState(false)
  const today = useMemo(() => new Date(), [])

  if (!request) return null

  const deadline = getRequestDeadline({ request, today })
  // The same pair the lookup matches on. Checked here rather than assumed from where this dialog
  // happens to be mounted, so reusing it somewhere public cannot quietly skip the lookup.
  const isOwnRequest = Boolean(user && user.email.trim().toLowerCase() === request.applicantEmail.trim().toLowerCase())

  const copyRegistrationNumber = () => {
    void navigator.clipboard?.writeText(request.id).then(
      () => setHasCopied(true),
      () => setHasCopied(false),
    )
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setHasCopied(false)
      onClose()
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open>
      <DialogContent className="grid max-h-[calc(100svh/var(--app-scale)_-_2rem)] w-[calc(100%_-_2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-outline-variant px-5 py-4 pr-12 sm:px-6">
          <DialogTitle className="font-headline-md text-lg font-bold text-primary">{request.id}</DialogTitle>
          <DialogDescription className="text-on-surface-variant">{request.subject}</DialogDescription>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className={request.statusClass} variant="outline">{request.status}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {deadline ? (
            <DeadlineNotice
              appealFor={{
                email: request.applicantEmail,
                registrationNumber: request.id,
                requestId: isOwnRequest ? request.id : undefined,
              }}
              deadline={deadline}
            />
          ) : null}

          <section>
            <h3 className="text-sm font-semibold text-primary">{t("status.informationRequested")}</h3>
            {request.requestText ? (
              <p className="mt-2 whitespace-pre-wrap rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-sm leading-6 text-on-surface">
                {request.requestText}
              </p>
            ) : (
              // Requests filed before the portal kept the body have only their subject left.
              <p className="mt-2 rounded-lg border border-outline-variant bg-surface-container-low p-4 text-sm leading-6 text-on-surface-variant">
                {t("requestDetail.noText")}
              </p>
            )}
          </section>

          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Field label={t("status.publicAuthority")}>{request.authority}</Field>
            <Field label={t("status.currentStatus")}>{request.nextAction}</Field>
            <Field label={t("status.dateSubmitted")}>{request.submittedOn}</Field>
            <Field label={t("requestDetail.lastUpdated")}>{request.lastUpdated}</Field>
            <Field label={t("status.applicant")}>{request.applicantName}</Field>
            <Field label={t("requestForm.mobile")}>{request.applicantPhone}</Field>
            <div className="sm:col-span-2">
              <Field label={t("status.emailAddress")}>{request.applicantEmail}</Field>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3 border-t border-outline-variant pt-4">
            <Button onClick={copyRegistrationNumber} size="sm" type="button" variant="outline">
              <span aria-hidden="true" className="material-symbols-outlined text-base">{hasCopied ? "check" : "content_copy"}</span>
              {hasCopied ? t("requestDetail.copied") : t("requestDetail.copyId")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { RequestDetailDialog }
