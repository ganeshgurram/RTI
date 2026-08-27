import { useState, type FormEvent } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { findTransaction, type PaymentTransaction } from "@/data/mock-transactions"
import { cn } from "@/lib/utils"
import { MaterialIcon } from "@/routes/stitch-shell"

const captchaCodes = ["C8T9P", "M4K7Q", "R2V6N"]

type LookupErrors = {
  email?: string
  mobile?: string
  captcha?: string
  lookup?: string
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-on-surface-variant">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-on-surface">{value}</dd>
    </div>
  )
}

export function PaymentReconciliationPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [captcha, setCaptcha] = useState("")
  const [captchaIndex, setCaptchaIndex] = useState(0)
  const [errors, setErrors] = useState<LookupErrors>({})

  const activeCaptcha = captchaCodes[captchaIndex]

  const clearErrors = () => setErrors({})

  const refreshCaptcha = () => {
    setCaptchaIndex((current) => (current + 1) % captchaCodes.length)
    setCaptcha("")
    setErrors((current) => ({ ...current, captcha: undefined }))
  }

  const resetForm = () => {
    setEmail("")
    setMobile("")
    setCaptcha("")
    clearErrors()
  }

  const locateTransaction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: LookupErrors = {}

    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Enter the email address used for this payment."
    if (captcha.trim().toUpperCase() !== activeCaptcha) nextErrors.captcha = "Captcha does not match. Please try again."

    const { mobileMismatch, transaction } = findTransaction(email, mobile)

    if (!nextErrors.email && !nextErrors.captcha) {
      if (mobileMismatch) {
        nextErrors.mobile = "This does not match the mobile number used for the payment. Leave it blank if you are unsure."
      } else if (!transaction) {
        nextErrors.lookup = "No unsuccessful payment matches those details. Check the email address, or contact the helpdesk if the amount was debited."
      }
    }

    setErrors(nextErrors)

    if (!Object.keys(nextErrors).length && transaction) {
      navigate("/transaction-status", { state: { transaction } })
    }
  }

  return (
    <div className="mx-auto w-full max-w-container-max px-margin-mobile py-8 md:px-margin-desktop md:py-12">
      <header className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <MaterialIcon className="text-2xl">receipt_long</MaterialIcon>
        </div>
        <h1 className="font-headline-lg text-3xl text-primary md:text-headline-lg">Payment Reconciliation</h1>
        <p className="mt-3 text-base leading-7 text-on-surface-variant">Reconciliation of unsuccessful RTI request payments. Trace a fee that was debited but did not return a registration number.</p>
      </header>

      <div className="mx-auto max-w-3xl">
        <Card className="border border-outline-variant bg-surface-container-lowest shadow-sm">
          <CardHeader className="border-b border-outline-variant/50">
            <CardTitle className="text-primary">Locate Your Payment</CardTitle>
            <CardDescription>Enter the email id and mobile number that were used earlier to file the RTI request or appeal.</CardDescription>
            <p className="mt-2 text-xs text-on-surface-variant">Fields marked with <span className="font-semibold text-destructive">*</span> are mandatory.</p>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-5 md:grid-cols-2" noValidate onSubmit={locateTransaction}>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="reconciliation-email">Email Address <span className="text-destructive">*</span></label>
                <Input aria-invalid={Boolean(errors.email)} id="reconciliation-email" onChange={(event) => { setEmail(event.target.value); clearErrors() }} placeholder="user@domain.com" type="email" value={email} />
                {errors.email ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors.email}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="reconciliation-mobile">Mobile Number <span className="text-on-surface-variant">(optional)</span></label>
                <Input aria-invalid={Boolean(errors.mobile)} id="reconciliation-mobile" maxLength={10} onChange={(event) => { setMobile(event.target.value); clearErrors() }} placeholder="98765 43210" type="tel" value={mobile} />
                {errors.mobile ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors.mobile}</p> : null}
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="reconciliation-captcha">Captcha <span className="text-destructive">*</span></label>
                <div className="flex max-w-md gap-2">
                  <Input aria-invalid={Boolean(errors.captcha)} id="reconciliation-captcha" onChange={(event) => { setCaptcha(event.target.value); clearErrors() }} placeholder="Enter captcha" value={captcha} />
                  <span aria-label="Captcha code" className="flex h-8 min-w-24 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low px-3 font-mono text-sm font-bold tracking-[0.2em] text-primary">{activeCaptcha}</span>
                  <Button aria-label="Refresh captcha" onClick={refreshCaptcha} size="icon" type="button" variant="outline"><MaterialIcon>refresh</MaterialIcon></Button>
                </div>
                <p className="mt-1.5 text-xs text-on-surface-variant">All characters are case insensitive.</p>
                {errors.captcha ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors.captcha}</p> : null}
              </div>
              {errors.lookup ? <p className="text-sm font-medium text-destructive md:col-span-2" role="alert">{errors.lookup}</p> : null}
              <div className="mt-2 flex flex-wrap justify-end gap-3 border-t border-outline-variant/50 pb-2 pt-6 md:col-span-2">
                <Button onClick={resetForm} size="lg" type="button" variant="outline">Reset</Button>
                <Button size="lg" type="submit"><MaterialIcon>search</MaterialIcon>Locate Payment</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

type OutcomeView = {
  icon: string
  heading: string
  summary: string
  badge: string
  /** Mirrors the statusClass strings on mock requests, so a payment reads like any other status. */
  badgeClass: string
  iconClass: string
  explanation: string
}

/** "located" is what the applicant sees before asking the bank; the rest are the bank's answers. */
const outcomeViews: Record<"located" | PaymentTransaction["outcome"], OutcomeView> = {
  located: {
    icon: "hourglass_top",
    heading: "Transaction Located",
    summary: "A recent payment attempt matches your details.",
    badge: "Processing with bank",
    badgeClass: "bg-primary-fixed text-primary border-primary/20",
    iconClass: "bg-primary-fixed text-primary",
    explanation: "The payment was initiated but the bank has not sent final confirmation yet. Check the latest status below. Please do not pay again while this is processing.",
  },
  confirmed: {
    icon: "check_circle",
    heading: "Payment Confirmed",
    summary: "The bank has confirmed this payment and a registration number has been generated.",
    badge: "Payment confirmed",
    badgeClass: "bg-state-success/10 text-state-success border-state-success/25",
    iconClass: "bg-state-success/10 text-state-success",
    explanation: "The fee has been received and the request is registered. Quote the registration number below when you check its status or file an appeal.",
  },
  refunded: {
    icon: "undo",
    heading: "Payment Reversed",
    summary: "The payment did not go through and the bank has reversed the amount.",
    badge: "Refund initiated",
    badgeClass: "bg-state-error/10 text-state-error border-state-error/25",
    iconClass: "bg-state-error/10 text-state-error",
    explanation: "No registration number was generated, so nothing was filed. The amount returns to the source account within 5 to 7 working days against the refund reference below. You can safely file the request again.",
  },
  awaitingBank: {
    icon: "schedule",
    heading: "Still With The Bank",
    summary: "The bank has not settled this transaction yet.",
    badge: "Awaiting bank confirmation",
    badgeClass: "bg-state-warning/12 text-state-warning border-state-warning/30",
    iconClass: "bg-state-warning/12 text-state-warning",
    explanation: "Registration numbers are generated after the bank scroll is reconciled, which takes 24 to 48 working hours. Please do not pay again in the meantime. If nothing changes after 48 hours, contact the helpdesk with the transaction ID below.",
  },
}

export function TransactionStatusPage() {
  const location = useLocation()
  const [hasCheckedBank, setHasCheckedBank] = useState(false)
  const transaction = (location.state as { transaction?: PaymentTransaction } | null)?.transaction

  // Reached without a lookup, so there is no transaction to report on.
  if (!transaction) {
    return <Navigate replace to="/payment-reconciliation" />
  }

  const view = outcomeViews[hasCheckedBank ? transaction.outcome : "located"]

  return (
    <div className="mx-auto w-full max-w-container-max px-margin-mobile py-8 md:px-margin-desktop md:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-headline-md text-xl text-primary">{view.heading}</h1>
            <p className="mt-1 text-sm text-on-surface-variant">{view.summary}</p>
          </div>
          <Link className={cn(buttonVariants({ size: "lg", variant: "outline" }))} to="/payment-reconciliation">
            <MaterialIcon>search</MaterialIcon>
            New Lookup
          </Link>
        </div>

        <Card className="border border-outline-variant bg-surface-container-lowest shadow-sm">
          <CardContent className="pt-4">
            <div className="flex flex-col gap-4 border-b border-outline-variant/50 pb-5 sm:flex-row sm:items-center sm:justify-around">
              <div className="flex items-center gap-3">
                <div className={`flex size-12 shrink-0 items-center justify-center rounded-full ${view.iconClass}`}>
                  <MaterialIcon className="text-2xl">{view.icon}</MaterialIcon>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.06em] text-on-surface-variant">Transaction ID</p>
                  <p className="mt-1 font-headline-md text-xl text-primary">{transaction.transactionId}</p>
                </div>
              </div>
              <Badge className={view.badgeClass} variant="outline">{view.badge}</Badge>
            </div>

            <dl className="grid justify-around gap-x-8 gap-y-5 py-6 sm:grid-cols-[auto_auto]">
              <Detail label="Date & Time" value={transaction.attemptedOn} />
              <Detail label="Amount" value={transaction.amount} />
              <Detail label="Payment Method" value={transaction.method} />
              <Detail label="Paid By" value={transaction.applicantName} />
              <div className="sm:col-span-2"><Detail label="Public Authority" value={transaction.authority} /></div>
              <Detail label="Paid For" value={transaction.purpose} />
              {hasCheckedBank && transaction.registrationNumber ? <Detail label="Registration Number" value={transaction.registrationNumber} /> : null}
              {hasCheckedBank && transaction.refundReference ? <Detail label="Refund Reference" value={transaction.refundReference} /> : null}
            </dl>

            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
              <p className="text-sm font-semibold text-primary">What does this mean?</p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">{view.explanation}</p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Link className={cn(buttonVariants({ size: "lg", variant: "outline" }))} to="/">Return Home</Link>
              <Button disabled={hasCheckedBank} onClick={() => setHasCheckedBank(true)} size="lg" type="button">
                <MaterialIcon>sync</MaterialIcon>
                {hasCheckedBank ? "Status Updated" : "Check Latest Status"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Payment continuously failing or status not updating?{" "}
          <Link className="font-semibold text-primary hover:underline" to="/contact-us">Contact the helpdesk</Link>
        </p>
      </div>
    </div>
  )
}
