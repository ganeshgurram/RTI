import { useRef, useState, type FormEvent } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { DeadlineNotice } from "@/components/DeadlineTracker"
import { IconTooltip } from "@/components/IconTooltip"
import { Button } from "@/components/ui/button"
import { useFormDraft } from "@/hooks/useFormDraft"
import type { FirstAppealPrefill } from "@/request-guidelines/RequestGuidelinesContext"
import { useRequests } from "@/requests/RequestContext"
import { canFileFirstAppeal, getRequestDeadline, type RequestDeadline } from "@/services/statutory-deadlines"
import { MaterialIcon } from "@/routes/stitch-shell"

const codes = ["726958", "318402", "604791"]

// Matches the security check on Payment Reconciliation: a quiet code chip beside the input, with
// the refresh as an outline icon button on the right.
const captchaCodeClassName = "flex h-10 min-w-24 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low px-3 font-mono text-sm font-bold tracking-[0.2em] text-primary"
const captchaRefreshClassName = "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-on-surface outline-none transition-all hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px"

type LookupErrors = {
  registrationNumber?: string
  email?: string
  captcha?: string
  lookup?: string
  /** Kept apart from `lookup`: being early is not a mistake, and is not shown as one. */
  timing?: string
}

export function SubmitFirstAppealPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { requests } = useRequests()
  // Filled in when the appellant arrived from a specific request rather than from the top nav.
  // The security code is still theirs to enter: it is the check, and prefilling it would remove it.
  const prefill = (location.state as { appeal?: FirstAppealPrefill } | null)?.appeal
  const lookupDraft = useFormDraft("rti-demo-first-appeal-lookup-draft-v1", { exclude: ["appealCaptcha"] })
  const [captchaIndex, setCaptchaIndex] = useState(0)
  const [registrationNumber, setRegistrationNumber] = useState(prefill?.registrationNumber ?? lookupDraft.value("registrationNumber", ""))
  const [email, setEmail] = useState(prefill?.email ?? lookupDraft.value("email", ""))
  const [captcha, setCaptcha] = useState("")
  const [errors, setErrors] = useState<LookupErrors>({})
  const [blockedDeadline, setBlockedDeadline] = useState<RequestDeadline | null>(null)
  const [formResetKey, setFormResetKey] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const { t } = useTranslation()

  const activeCaptcha = codes[captchaIndex]

  /**
   * An online first appeal can only be filed against an RTI that was filed online, so the appeal
   * has to start from a request that actually exists. Registration number plus the email it was
   * filed with is the same pair View Status matches on.
   */
  const beginAppeal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: LookupErrors = {}
    const matchingRequest = requests.find((item) => item.id.toLowerCase() === registrationNumber.trim().toLowerCase())

    if (!registrationNumber.trim()) nextErrors.registrationNumber = t("firstAppeal.errorRegistration")
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = t("firstAppeal.errorEmail")
    if (captcha.trim() !== activeCaptcha) nextErrors.captcha = t("firstAppeal.errorSecurity")
    if (!nextErrors.registrationNumber && !nextErrors.email && !nextErrors.captcha) {
      if (!matchingRequest || email.trim().toLowerCase() !== matchingRequest.applicantEmail.toLowerCase()) {
        nextErrors.lookup = t("firstAppeal.errorLookup")
      }
    }

    const today = new Date()
    let deadline: RequestDeadline | null = null

    /**
     * s.19(1) gives an appeal to someone who received no decision in time, or who is aggrieved by
     * one. Those are independent, so a reply that has arrived can be appealed at once and only
     * silence has to wait out the thirty days.
     */
    if (!Object.keys(nextErrors).length && matchingRequest) {
      const eligibility = canFileFirstAppeal({ request: matchingRequest, requestId: matchingRequest.id, today })

      if (!eligibility.allowed) {
        deadline = getRequestDeadline({ request: matchingRequest, today })

        if (eligibility.reason === "waiting") {
          nextErrors.timing = eligibility.daysRemaining === 0
            ? t("deadline.gateWaitingToday", { date: deadline?.dueOn, unlocksOn: eligibility.unlocksOn })
            : t("deadline.gateWaiting", { count: eligibility.daysRemaining ?? 0, date: deadline?.dueOn, unlocksOn: eligibility.unlocksOn })
        } else {
          nextErrors.timing = t(eligibility.reason === "appealRow" ? "deadline.gateAppealRow" : "deadline.gateAlreadyAppealed")
        }
      }
    }

    setErrors(nextErrors)
    setBlockedDeadline(deadline)

    if (!Object.keys(nextErrors).length && matchingRequest) {
      lookupDraft.clear()
      navigate("/first-appeal-form", { state: { requestId: matchingRequest.id } })
    }
  }

  const resetLookup = () => {
    lookupDraft.clear()
    setRegistrationNumber("")
    setEmail("")
    setCaptcha("")
    setErrors({})
    setFormResetKey((current) => current + 1)
  }

  const refreshCaptcha = () => {
    setCaptchaIndex((current) => (current + 1) % codes.length)
    setCaptcha("")
    setErrors((current) => ({ ...current, captcha: undefined }))
  }

  const saveDraft = () => window.requestAnimationFrame(() => lookupDraft.save(formRef.current))

  return (
    <div className="mx-auto flex w-full max-w-container-max flex-1 flex-col items-center px-margin-mobile py-stack-lg md:px-margin-desktop md:py-8">
      <div className="w-full max-w-3xl">
        <header className="pb-3">
          <div className="mb-stack-sm flex items-center justify-between gap-4">
            <h1 className="font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">{t("firstAppeal.title")}</h1>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <MaterialIcon className="text-2xl">gavel</MaterialIcon>
            </div>
          </div>
          <p className="text-body-md text-on-surface-variant">{t("firstAppeal.lookupDescription")}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-on-surface-variant">
            {lookupDraft.wasRestored ? <span className="flex items-center gap-1.5"><MaterialIcon className="text-base text-state-success">restore</MaterialIcon>{t("formDraft.restored")}</span> : null}
            {lookupDraft.saveState === "saving" ? <span>{t("formDraft.saving")}</span> : null}
            {lookupDraft.saveState === "saved" ? <span className="flex items-center gap-1.5"><MaterialIcon className="text-base text-state-success">save</MaterialIcon>{t("formDraft.saved")}</span> : null}
            {lookupDraft.hasDraft ? <Button className="h-auto px-1.5 py-0.5 text-sm" onClick={resetLookup} type="button" variant="ghost">{t("formDraft.discard")}</Button> : null}
          </div>
        </header>

        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 md:p-6">
          <form className="flex flex-col gap-3" key={formResetKey} noValidate onChange={saveDraft} onReset={resetLookup} onSubmit={beginAppeal} ref={formRef}>
            <div className="flex flex-col gap-stack-sm md:flex-row md:items-start md:gap-5">
              <label className="flex items-center gap-1 font-label-lg text-label-lg text-on-surface md:mt-2 md:w-1/3" htmlFor="appeal-registration-number"><span className="text-error">*</span> {t("firstAppeal.registrationNumber")}</label>
              <div className="flex-grow">
                <input aria-invalid={Boolean(errors.registrationNumber)} className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary" id="appeal-registration-number" name="registrationNumber" onChange={(event) => { setRegistrationNumber(event.target.value); setErrors((current) => ({ ...current, registrationNumber: undefined, lookup: undefined, timing: undefined })) }} placeholder="RTI-2026-11842" type="text" value={registrationNumber} />
                {errors.registrationNumber ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors.registrationNumber}</p> : null}
              </div>
            </div>
            <div className="flex flex-col gap-stack-sm md:flex-row md:items-start md:gap-5">
              <label className="flex items-center gap-1 font-label-lg text-label-lg text-on-surface md:mt-2 md:w-1/3" htmlFor="appeal-email"><span className="text-error">*</span> {t("firstAppeal.emailPrompt")}</label>
              <div className="flex-grow">
                <input aria-invalid={Boolean(errors.email)} className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary" id="appeal-email" name="email" onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: undefined, lookup: undefined, timing: undefined })) }} placeholder={t("status.emailAddress")} type="email" value={email} />
                {errors.email ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors.email}</p> : null}
              </div>
            </div>
            <div className="flex flex-col gap-stack-sm pt-1 md:flex-row md:items-start md:gap-5">
              <label className="flex items-center gap-1 font-label-lg text-label-lg text-on-surface md:mt-2 md:w-1/3" htmlFor="appeal-captcha"><span className="text-error">*</span> {t("firstAppeal.securityCode")}</label>
              <div className="flex flex-grow flex-col gap-stack-sm">
                <div className="flex max-w-md items-center gap-2">
                  <input aria-invalid={Boolean(errors.captcha)} className="h-10 flex-1 rounded-md border border-outline-variant bg-surface px-3 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary" id="appeal-captcha" name="appealCaptcha" onChange={(event) => { setCaptcha(event.target.value); setErrors((current) => ({ ...current, captcha: undefined })) }} placeholder={t("requestForm.enterCode")} type="text" value={captcha} />
                  <span aria-label={t("firstAppeal.securityCode")} className={captchaCodeClassName}>{activeCaptcha}</span>
                  <IconTooltip label={t("firstAppeal.refresh")} render={<button aria-label={t("firstAppeal.refresh")} className={captchaRefreshClassName} onClick={refreshCaptcha} type="button" />}><MaterialIcon className="text-lg">refresh</MaterialIcon></IconTooltip>
                </div>
                {errors.captcha ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors.captcha}</p> : null}
              </div>
            </div>
            {errors.lookup ? <p className="rounded-md border border-error-container bg-error-container/20 p-3 text-sm font-medium text-error" role="alert">{errors.lookup}</p> : null}
            {errors.timing ? (
              <div className="flex flex-col gap-3">
                <p className="rounded-md border border-state-warning/30 bg-state-warning/12 p-3 text-sm font-medium text-state-warning" role="alert">{errors.timing}</p>
                {blockedDeadline ? <DeadlineNotice deadline={blockedDeadline} showAppealAction={false} /> : null}
              </div>
            ) : null}
            <div className="mt-2 flex justify-center gap-stack-md border-t border-surface-container-high pt-4 md:justify-start md:pl-[calc(33.333%+1.25rem)]">
              <button className="min-w-30 rounded-lg bg-primary px-6 py-2 font-label-lg text-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary-container" type="submit">{t("firstAppeal.submit")}</button>
              <button className="min-w-30 rounded-lg border border-outline-variant bg-surface-container px-6 py-2 font-label-lg text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface" type="reset">{t("firstAppeal.reset")}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
