import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PaymentRequestDraft, PaymentTransaction } from "@/data/mock-transactions"
import { usePayments } from "@/payments/PaymentContext"
import { useRequests } from "@/requests/RequestContext"
import { MaterialIcon } from "@/routes/stitch-shell"

const outcomes: Array<PaymentTransaction["outcome"]> = ["confirmed", "awaitingBank", "refunded"]

export function MockPaymentPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { createPaymentAttempt, markPaymentConfirmed } = usePayments()
  const { createRequest } = useRequests()
  const [outcome, setOutcome] = useState<PaymentTransaction["outcome"]>("confirmed")
  const draft = (location.state as { draft?: PaymentRequestDraft } | null)?.draft

  if (!draft) {
    return <Navigate replace to="/submit-request" />
  }

  const completeMockPayment = () => {
    const payment = createPaymentAttempt({ draft, outcome })

    if (outcome === "confirmed") {
      const request = createRequest(draft)
      markPaymentConfirmed(payment.transactionId, request.id)
      navigate("/request-submission-success", { state: { requestId: request.id } })
      return
    }

    navigate("/transaction-status", { state: { transactionId: payment.transactionId } })
  }

  return (
    <main className="mx-auto flex w-full max-w-container-max flex-1 items-center justify-center px-margin-mobile py-8 md:px-margin-desktop md:py-12">
      <Card className="w-full max-w-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <CardHeader className="border-b border-outline-variant/50">
          <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-primary-fixed text-primary"><MaterialIcon>payments</MaterialIcon></div>
          <CardTitle className="text-primary">{t("mockPayment.title")}</CardTitle>
          <CardDescription>{t("mockPayment.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid gap-4 rounded-lg border border-outline-variant bg-surface-container-low p-4 text-sm sm:grid-cols-2">
            <div><dt className="text-xs font-semibold uppercase tracking-[0.06em] text-on-surface-variant">{t("mockPayment.amount")}</dt><dd className="mt-1 font-semibold text-on-surface">₹ 10.00</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-[0.06em] text-on-surface-variant">{t("mockPayment.authority")}</dt><dd className="mt-1 font-medium text-on-surface">{draft.authority}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-[0.06em] text-on-surface-variant">{t("mockPayment.applicant")}</dt><dd className="mt-1 font-medium text-on-surface">{draft.applicantName} · {draft.applicantEmail}</dd></div>
          </dl>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-on-surface">{t("mockPayment.outcomeLegend")}</legend>
            <div className="space-y-3">
              {outcomes.map((option) => (
                <label className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors ${outcome === option ? "border-primary bg-primary-fixed/30" : "border-outline-variant hover:bg-surface-container-low"}`} key={option}>
                  <input checked={outcome === option} className="mt-0.5 size-4 accent-primary" name="mock-payment-outcome" onChange={() => setOutcome(option)} type="radio" value={option} />
                  <span><span className="block text-sm font-semibold text-on-surface">{t(`mockPayment.outcomes.${option}.label`)}</span><span className="mt-1 block text-sm leading-5 text-on-surface-variant">{t(`mockPayment.outcomes.${option}.description`)}</span></span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap justify-end gap-3 border-t border-outline-variant/50 pt-6">
            <Button onClick={() => navigate(-1)} size="lg" type="button" variant="outline">{t("mockPayment.back")}</Button>
            <Button onClick={completeMockPayment} size="lg" type="button"><MaterialIcon>lock</MaterialIcon>{t("mockPayment.complete")}</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
