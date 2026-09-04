import { useState, type FormEvent } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { IconTooltip } from "@/components/IconTooltip"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { type PaymentTransaction } from "@/data/mock-transactions"
import { cn } from "@/lib/utils"
import { usePortalLanguage } from "@/i18n"
import { usePayments } from "@/payments/PaymentContext"
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
  const { reconcilePayment } = usePayments()
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [captcha, setCaptcha] = useState("")
  const [captchaIndex, setCaptchaIndex] = useState(0)
  const [errors, setErrors] = useState<LookupErrors>({})
  const { t } = useTranslation()

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

  const locateTransaction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: LookupErrors = {}

    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = t("payment.errorEmail")
    if (captcha.trim().toUpperCase() !== activeCaptcha) nextErrors.captcha = t("payment.errorCaptcha")

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length) return

    try {
      const transaction = await reconcilePayment(email, mobile)
      navigate("/transaction-status", { state: { transactionId: transaction.transactionId } })
    } catch {
      setErrors({ lookup: t("payment.errorLookup") })
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-container-max flex-1 flex-col items-center px-margin-mobile py-stack-lg md:px-margin-desktop md:py-12">
      <div className="w-full max-w-3xl">
        <header className="pb-stack-md">
          <div className="mb-stack-sm flex items-center justify-between gap-4">
            <h1 className="font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">{t("payment.title")}</h1>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <MaterialIcon className="text-2xl">receipt_long</MaterialIcon>
            </div>
          </div>
          <p className="text-body-md text-on-surface-variant">{t("payment.subtitle")}</p>
        </header>
        <Card className="border border-outline-variant bg-surface-container-lowest shadow-sm">
          <CardContent className="p-stack-lg">
            <form className="flex flex-col gap-stack-md" noValidate onSubmit={locateTransaction}>
              <div className="flex flex-col gap-stack-sm md:flex-row md:items-start md:gap-gutter">
                <label className="flex items-center gap-1 font-label-lg text-label-lg text-on-surface md:mt-2 md:w-1/3" htmlFor="reconciliation-email"><span className="text-error">*</span> {t("status.emailAddress")}</label>
                <div className="flex-grow">
                <Input aria-invalid={Boolean(errors.email)} id="reconciliation-email" onChange={(event) => { setEmail(event.target.value); clearErrors() }} placeholder="user@domain.com" type="email" value={email} />
                {errors.email ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors.email}</p> : null}
                </div>
              </div>
              <div className="flex flex-col gap-stack-sm md:flex-row md:items-start md:gap-gutter">
                <label className="flex items-center font-label-lg text-label-lg text-on-surface md:mt-2 md:w-1/3" htmlFor="reconciliation-mobile">{t("payment.mobileOptional")}</label>
                <div className="flex-grow">
                <Input aria-invalid={Boolean(errors.mobile)} id="reconciliation-mobile" maxLength={10} onChange={(event) => { setMobile(event.target.value); clearErrors() }} placeholder="98765 43210" type="tel" value={mobile} />
                {errors.mobile ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors.mobile}</p> : null}
                </div>
              </div>
              <div className="flex flex-col gap-stack-sm pt-stack-sm md:flex-row md:gap-gutter">
                <label className="flex items-center gap-1 font-label-lg text-label-lg text-on-surface md:mt-2 md:w-1/3" htmlFor="reconciliation-captcha"><span className="text-error">*</span> {t("status.captcha")}</label>
                <div className="flex flex-grow flex-col gap-stack-sm">
                  <div className="flex max-w-md items-center gap-2">
                  <Input aria-invalid={Boolean(errors.captcha)} id="reconciliation-captcha" onChange={(event) => { setCaptcha(event.target.value); clearErrors() }} placeholder={t("status.enterCaptcha")} value={captcha} />
                  <span aria-label="Captcha code" className="flex h-8 min-w-24 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low px-3 font-mono text-sm font-bold tracking-[0.2em] text-primary">{activeCaptcha}</span>
                  <IconTooltip label={t("status.refreshCaptcha")} render={<Button aria-label={t("status.refreshCaptcha")} onClick={refreshCaptcha} size="icon" type="button" variant="outline" />}><MaterialIcon>refresh</MaterialIcon></IconTooltip>
                  </div>
                  <p className="text-xs text-on-surface-variant">{t("payment.allCaseInsensitive")}</p>
                  {errors.captcha ? <p className="text-xs font-medium text-destructive">{errors.captcha}</p> : null}
                </div>
              </div>
              {errors.lookup ? <p className="rounded-md border border-error-container bg-error-container/20 p-3 text-sm font-medium text-error" role="alert">{errors.lookup}</p> : null}
              <div className="mt-stack-md flex justify-center gap-stack-md border-t border-surface-container-high pt-stack-lg md:justify-start md:pl-[33%]">
                <Button onClick={resetForm} size="lg" type="button" variant="outline">{t("requestForm.reset")}</Button>
                <Button size="lg" type="submit"><MaterialIcon>search</MaterialIcon>{t("payment.locate")}</Button>
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

const hindiOutcomeText: Record<"located" | PaymentTransaction["outcome"], Pick<OutcomeView, "heading" | "summary" | "badge" | "explanation">> = {
  located: {
    heading: "लेन-देन मिल गया",
    summary: "भुगतान का एक हालिया प्रयास आपके विवरण से मेल खाता है।",
    badge: "बैंक में प्रक्रिया जारी है",
    explanation: "भुगतान शुरू किया गया था, लेकिन बैंक ने अभी अंतिम पुष्टि नहीं भेजी है। नीचे नवीनतम स्थिति जाँचें और प्रक्रिया पूरी होने तक दोबारा भुगतान न करें।",
  },
  confirmed: {
    heading: "भुगतान की पुष्टि हो गई",
    summary: "बैंक ने इस भुगतान की पुष्टि कर दी है और एक पंजीकरण नंबर बनाया गया है।",
    badge: "भुगतान की पुष्टि हुई",
    explanation: "शुल्क प्राप्त हो गया है और अनुरोध पंजीकृत है। स्थिति जाँचते या अपील दायर करते समय नीचे दिया पंजीकरण नंबर लिखें।",
  },
  refunded: {
    heading: "भुगतान वापस किया गया",
    summary: "भुगतान पूरा नहीं हुआ और बैंक ने राशि वापस कर दी है।",
    badge: "रिफंड शुरू किया गया",
    explanation: "कोई पंजीकरण नंबर नहीं बना, इसलिए कुछ भी दायर नहीं हुआ। राशि 5 से 7 कार्य दिवसों में नीचे दिए रिफंड संदर्भ के साथ स्रोत खाते में लौट आएगी। आप अनुरोध फिर से दायर कर सकते हैं।",
  },
  awaitingBank: {
    heading: "लेन-देन अभी बैंक में है",
    summary: "बैंक ने अभी इस लेन-देन का निपटारा नहीं किया है।",
    badge: "बैंक की पुष्टि की प्रतीक्षा है",
    explanation: "बैंक स्क्रॉल के मिलान के बाद पंजीकरण नंबर बनाए जाते हैं, जिसमें 24 से 48 कार्य घंटे लग सकते हैं। इस बीच दोबारा भुगतान न करें। 48 घंटे बाद स्थिति न बदले तो लेन-देन आईडी के साथ सहायता डेस्क से संपर्क करें।",
  },
}

export function TransactionStatusPage() {
  const location = useLocation()
  const [hasCheckedBank, setHasCheckedBank] = useState(false)
  const { payments } = usePayments()
  const { t } = useTranslation()
  const { language } = usePortalLanguage()
  const routeState = location.state as { transaction?: PaymentTransaction; transactionId?: string } | null
  const transaction = routeState?.transactionId
    ? payments.find((payment) => payment.transactionId === routeState.transactionId)
    : routeState?.transaction

  // Reached without a lookup, so there is no transaction to report on.
  if (!transaction) {
    return <Navigate replace to="/payment-reconciliation" />
  }

  const outcome = hasCheckedBank ? transaction.outcome : "located"
  const baseView = outcomeViews[outcome]
  const view = language === "hi" ? { ...baseView, ...hindiOutcomeText[outcome] } : baseView

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
            {t("payment.newLookup")}
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
                  <p className="text-xs font-semibold uppercase tracking-[0.06em] text-on-surface-variant">{t("payment.transactionId")}</p>
                  <p className="mt-1 font-headline-md text-xl text-primary">{transaction.transactionId}</p>
                </div>
              </div>
              <Badge className={view.badgeClass} variant="outline">{view.badge}</Badge>
            </div>

            <dl className="grid justify-around gap-x-8 gap-y-5 py-6 sm:grid-cols-[auto_auto]">
              <Detail label={t("payment.dateTime")} value={transaction.attemptedOn} />
              <Detail label={t("payment.amount")} value={transaction.amount} />
              <Detail label={t("payment.paymentMethod")} value={transaction.method} />
              <Detail label={t("payment.paidBy")} value={transaction.applicantName} />
              <div className="sm:col-span-2"><Detail label={t("payment.publicAuthority")} value={transaction.authority} /></div>
              <Detail label={t("payment.paidFor")} value={transaction.purpose} />
              {hasCheckedBank && transaction.registrationNumber ? <Detail label={t("status.registrationNumber")} value={transaction.registrationNumber} /> : null}
              {hasCheckedBank && transaction.refundReference ? <Detail label={t("payment.refundReference")} value={transaction.refundReference} /> : null}
            </dl>

            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
              <p className="text-sm font-semibold text-primary">{t("payment.meaning")}</p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">{view.explanation}</p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Link className={cn(buttonVariants({ size: "lg", variant: "outline" }))} to="/">{t("payment.returnHome")}</Link>
              <Button disabled={hasCheckedBank} onClick={() => setHasCheckedBank(true)} size="lg" type="button">
                <MaterialIcon>sync</MaterialIcon>
                {hasCheckedBank ? t("payment.statusUpdated") : t("payment.checkLatest")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          {t("payment.contactHelpdesk")}{" "}
          <Link className="font-semibold text-primary hover:underline" to="/contact-us">{t("payment.contactLink")}</Link>
        </p>
      </div>
    </div>
  )
}
