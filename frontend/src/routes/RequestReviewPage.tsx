import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { RequestFormFocusSection, RequestReviewLocationState } from "@/data/request-review"
import { useRequests } from "@/requests/RequestContext"
import { MaterialIcon } from "@/routes/stitch-shell"

function ReviewSection({
  children,
  icon,
  onEdit,
  title,
}: {
  children: ReactNode
  icon: string
  onEdit: () => void
  title: string
}) {
  const { t } = useTranslation()

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border bg-muted/45">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><MaterialIcon className="text-xl">{icon}</MaterialIcon></span>
          <CardTitle className="text-primary">{title}</CardTitle>
        </div>
        <CardAction>
          <Button className="h-9" onClick={onEdit} type="button" variant="outline">
            <MaterialIcon className="text-[18px]">edit</MaterialIcon>{t("requestReview.edit")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-on-surface-variant">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium leading-5 text-on-surface">{value || "—"}</dd>
    </div>
  )
}

export function RequestReviewPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { createRequest } = useRequests()
  const draft = (location.state as RequestReviewLocationState | null)?.draft

  if (!draft) return <Navigate replace to="/submit-request" />

  const edit = (section: RequestFormFocusSection) => {
    navigate("/submit-request", {
      state: {
        authority: { ministryName: draft.ministry, name: draft.authority },
        focusSection: section,
        guidelinesAccepted: true,
        reviewDraft: draft,
      },
    })
  }

  const continueSubmission = async () => {
    if (!draft.isBplApplicant) {
      navigate("/mock-payment", { state: { draft } })
      return
    }

    const request = await createRequest({
      ...draft,
      isBplApplicant: draft.isBplApplicant,
      supportingDocumentName: draft.bpl?.supportingDocumentName,
    })
    navigate("/request-submission-success", { state: { requestId: request.id } })
  }

  const address = [draft.applicant.addressLine1, draft.applicant.addressLine2, draft.applicant.addressLine3]
    .filter(Boolean)
    .join(", ")

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-5 px-margin-mobile py-stack-lg md:px-margin-desktop md:py-8">
      <header>
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><MaterialIcon>fact_check</MaterialIcon></div>
        <h1 className="font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">{t("requestReview.title")}</h1>
        <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
          {t("requestReview.subtitle", { nextStep: draft.isBplApplicant ? t("requestReview.submitRequest") : t("requestReview.continueToPayment") })}
        </p>
      </header>

      <ReviewSection icon="account_balance" onEdit={() => edit("authority")} title={t("requestReview.authority")}>
        <dl className="grid gap-5 sm:grid-cols-2">
          <Detail label={t("requestReview.ministry")} value={draft.ministry} />
          <Detail label={t("requestReview.publicAuthority")} value={draft.authority} />
        </dl>
      </ReviewSection>

      <ReviewSection icon="person" onEdit={() => edit("personal")} title={t("requestReview.applicant")}>
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label={t("requestReview.fullName")} value={draft.applicantName} />
          <Detail label={t("requestReview.email")} value={draft.applicantEmail} />
          <Detail label={t("requestReview.mobile")} value={draft.applicantPhone} />
          <Detail label={t("requestReview.gender")} value={draft.applicant.gender} />
          <Detail label={t("requestReview.address")} value={address} />
          <Detail label={t("requestReview.location")} value={[draft.applicant.state, draft.applicant.pincode, draft.applicant.country].filter(Boolean).join(", ")} />
          <Detail label={t("requestReview.areaType")} value={draft.applicant.areaType} />
          <Detail label={t("requestReview.educationalStatus")} value={draft.applicant.educationalStatus} />
        </dl>
      </ReviewSection>

      <ReviewSection icon="description" onEdit={() => edit("request")} title={t("requestReview.request")}>
        <dl className="grid gap-5 sm:grid-cols-2">
          <Detail label={t("requestReview.citizenship")} value={draft.citizenship} />
          <Detail label={t("requestReview.bplStatus")} value={draft.isBplApplicant ? t("requestReview.bplApplicant") : t("requestReview.notBplApplicant")} />
          <Detail label={t("requestReview.fee")} value={draft.isBplApplicant ? t("requestReview.noFee") : t("requestReview.feeRequired")} />
          {draft.isBplApplicant ? <Detail label={t("requestReview.bplCard")} value={draft.bpl?.cardNumber} /> : null}
          {draft.isBplApplicant ? <Detail label={t("requestReview.bplDocument")} value={draft.bpl?.supportingDocumentName} /> : null}
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-on-surface-variant">{t("requestReview.subject")}</dt>
            <dd className="mt-1 text-sm font-medium leading-5 text-on-surface">{draft.subject}</dd>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-on-surface-variant">{t("requestReview.requestText")}</dt>
            <dd className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-muted/45 p-4 text-sm leading-6 text-on-surface">{draft.requestText}</dd>
          </div>
        </dl>
      </ReviewSection>

      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-5 text-on-surface-variant">
            {draft.isBplApplicant ? t("requestReview.submitNote") : t("requestReview.paymentNote")}
          </div>
          <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
            <Button onClick={() => edit("request")} type="button" variant="outline">{t("requestReview.backToForm")}</Button>
            <Button onClick={() => void continueSubmission()} type="button">
              <MaterialIcon className="text-[18px]">{draft.isBplApplicant ? "send" : "payments"}</MaterialIcon>
              {draft.isBplApplicant ? t("requestReview.submitRequest") : t("requestReview.continueToPayment")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
