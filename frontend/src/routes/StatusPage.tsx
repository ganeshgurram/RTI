import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Navigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useAuth } from "@/auth/AuthContext"
import { DeadlineNotice } from "@/components/DeadlineTracker"
import { RequestTimeline } from "@/components/RequestTimeline"
import { IconTooltip } from "@/components/IconTooltip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type RtiRequest } from "@/requests/RequestContext"
import { api } from "@/services/api"
import { getRequestDeadline } from "@/services/statutory-deadlines"
import { MaterialIcon } from "@/routes/stitch-shell"

const captchaCodes = ["7KQ2P", "M4N8R", "T6B3X"]
const fieldClassName = "w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
const captchaRefreshClassName = "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-on-surface outline-none transition-all hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px"

type LookupErrors = {
  registrationNumber?: string
  email?: string
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

export function StatusPage() {
  const { isAuthenticated } = useAuth()
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [email, setEmail] = useState("")
  const [captcha, setCaptcha] = useState("")
  const [captchaIndex, setCaptchaIndex] = useState(0)
  const [errors, setErrors] = useState<LookupErrors>({})
  const [request, setRequest] = useState<RtiRequest | null>(null)
  const requestDetailsRef = useRef<HTMLElement>(null)
  const { t } = useTranslation()
  // Declared above the signed-in redirect below, so every hook runs on every render.
  const today = useMemo(() => new Date(), [])

  const activeCaptcha = captchaCodes[captchaIndex]
  const deadline = request ? getRequestDeadline({ request, today }) : null

  useEffect(() => {
    if (request) requestDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [request])

  if (isAuthenticated) return <Navigate replace to="/request-history" />

  const refreshCaptcha = () => {
    setCaptchaIndex((current) => (current + 1) % captchaCodes.length)
    setCaptcha("")
    setErrors((current) => ({ ...current, captcha: undefined }))
  }

  const checkStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: LookupErrors = {}

    if (!registrationNumber.trim()) nextErrors.registrationNumber = t("status.errorRegistration")
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = t("status.errorEmail")
    if (captcha.trim().toUpperCase() !== activeCaptcha) nextErrors.captcha = t("status.errorCaptcha")

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setRequest(null)
      return
    }

    try {
      const result = await api.lookupRequest(registrationNumber.trim(), email.trim())
      setRequest(result.request as RtiRequest)
    } catch {
      setRequest(null)
      setErrors({ lookup: t("status.errorLookup") })
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-container-max flex-1 flex-col items-center px-margin-mobile py-stack-lg md:px-margin-desktop md:py-8">
      <div className="w-full max-w-3xl">
        <header className="pb-3">
          <div className="mb-stack-sm flex items-center justify-between gap-4">
            <h1 className="font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">{t("status.title")}</h1>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <MaterialIcon className="text-2xl">manage_search</MaterialIcon>
            </div>
          </div>
          <p className="text-body-md text-on-surface-variant">{t("status.subtitle")}</p>
        </header>
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 md:p-6">
            <form className="flex flex-col gap-3" noValidate onSubmit={checkStatus}>
              <div className="flex flex-col gap-stack-sm md:flex-row md:items-start md:gap-5">
                <label className="flex items-center font-label-lg text-label-lg text-on-surface md:mt-2 md:w-1/3" htmlFor="registration-number">{t("status.registrationNumber")}</label>
                <div className="flex-grow">
                <input aria-invalid={Boolean(errors.registrationNumber)} className={fieldClassName} id="registration-number" onChange={(event) => { setRegistrationNumber(event.target.value); setErrors((current) => ({ ...current, registrationNumber: undefined, lookup: undefined })) }} placeholder="RTI-2026-11842" type="text" value={registrationNumber} />
                {errors.registrationNumber ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors.registrationNumber}</p> : null}
                </div>
              </div>
              <div className="flex flex-col gap-stack-sm md:flex-row md:items-start md:gap-5">
                <label className="flex items-center font-label-lg text-label-lg text-on-surface md:mt-2 md:w-1/3" htmlFor="request-email">{t("status.emailAddress")}</label>
                <div className="flex-grow">
                <input aria-invalid={Boolean(errors.email)} className={fieldClassName} id="request-email" onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: undefined, lookup: undefined })) }} placeholder="user@domain.com" type="email" value={email} />
                {errors.email ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors.email}</p> : null}
                </div>
              </div>
              <div className="flex flex-col gap-stack-sm pt-1 md:flex-row md:items-start md:gap-5">
                <label className="flex items-center font-label-lg text-label-lg text-on-surface md:mt-2 md:w-1/3" htmlFor="status-captcha">{t("status.captcha")}</label>
                <div className="flex flex-grow flex-col gap-stack-sm">
                  <div className="flex max-w-md items-center gap-2">
                  <input aria-invalid={Boolean(errors.captcha)} className={`${fieldClassName} h-10 flex-1 py-0`} id="status-captcha" onChange={(event) => { setCaptcha(event.target.value); setErrors((current) => ({ ...current, captcha: undefined, lookup: undefined })) }} placeholder={t("status.enterCaptcha")} type="text" value={captcha} />
                  <span aria-label="Captcha code" className="flex h-10 min-w-24 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low px-3 font-mono text-sm font-bold tracking-[0.2em] text-primary">{activeCaptcha}</span>
                  <IconTooltip label={t("status.refreshCaptcha")} render={<button aria-label={t("status.refreshCaptcha")} className={captchaRefreshClassName} onClick={refreshCaptcha} type="button" />}><MaterialIcon className="text-lg">refresh</MaterialIcon></IconTooltip>
                  </div>
                  {errors.captcha ? <p className="text-xs font-medium text-destructive">{errors.captcha}</p> : null}
                </div>
              </div>
              {errors.lookup ? <p className="rounded-md border border-error-container bg-error-container/20 p-3 text-sm font-medium text-error" role="alert">{errors.lookup}</p> : null}
              <div className="mt-2 flex justify-center border-t border-surface-container-high pt-4 md:justify-start md:pl-[calc(33.333%+1.25rem)]">
                <button className="min-w-30 rounded-lg bg-primary px-6 py-2 font-label-lg text-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary-container" type="submit"><MaterialIcon className="mr-1 text-lg">search</MaterialIcon>{t("status.checkStatus")}</button>
              </div>
            </form>
        </div>

        {request ? (
          <section className="print-request-details mt-6" aria-live="polite" ref={requestDetailsRef}>
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-headline-md text-xl text-primary">{t("status.requestDetails")}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{t("status.lastUpdated", { date: request.lastUpdated })}</p>
              </div>
              <Button className="print-hidden" onClick={() => window.print()} size="lg" type="button" variant="outline"><MaterialIcon>print</MaterialIcon>{t("status.printApplication")}</Button>
            </div>
            <Card className="border border-outline-variant bg-surface-container-lowest shadow-sm">
              <CardContent className="pt-4">
                <div className="flex flex-col justify-between gap-4 border-b border-outline-variant/50 pb-5 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.06em] text-on-surface-variant">{t("status.registrationNumber")}</p>
                    <p className="mt-1 font-headline-md text-xl text-primary">{request.id}</p>
                  </div>
                  <Badge className={request.statusClass} variant="outline">{request.status}</Badge>
                </div>
                <dl className="grid gap-x-8 gap-y-5 py-6 sm:grid-cols-2">
                  <Detail label={t("status.applicant")} value={request.applicantName} />
                  <Detail label={t("status.emailAddress")} value={request.applicantEmail} />
                  <Detail label={t("status.publicAuthority")} value={request.authority} />
                  <Detail label={t("status.dateSubmitted")} value={request.submittedOn} />
                  <div className="sm:col-span-2"><Detail label={t("status.informationRequested")} value={request.subject} /></div>
                  <Detail label={t("status.currentStatus")} value={request.status} />
                  <Detail label={t("status.nextAction")} value={request.nextAction} />
                </dl>
                <div className="mb-4 border-t border-outline-variant/50 pt-5">
                  <RequestTimeline request={request} />
                </div>
                {deadline ? (
                  <div className="mb-4">
                    <DeadlineNotice appealFor={{ email: request.applicantEmail, registrationNumber: request.id }} deadline={deadline} />
                  </div>
                ) : null}
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <p className="text-sm font-semibold text-primary">{t("status.latestUpdate")}</p>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">{t("status.latestUpdateText", { status: request.status, nextAction: request.nextAction })}</p>
                </div>
              </CardContent>
            </Card>
          </section>
        ) : null}
      </div>
    </div>
  )
}
