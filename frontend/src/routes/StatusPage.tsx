import { useEffect, useRef, useState, type FormEvent } from "react"
import { Navigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useAuth } from "@/auth/AuthContext"
import { IconTooltip } from "@/components/IconTooltip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRequests } from "@/requests/RequestContext"
import { MaterialIcon } from "@/routes/stitch-shell"

const captchaCodes = ["7KQ2P", "M4N8R", "T6B3X"]

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
  const { requests } = useRequests()
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [email, setEmail] = useState("")
  const [captcha, setCaptcha] = useState("")
  const [captchaIndex, setCaptchaIndex] = useState(0)
  const [errors, setErrors] = useState<LookupErrors>({})
  const [requestId, setRequestId] = useState<string | null>(null)
  const requestDetailsRef = useRef<HTMLElement>(null)
  const { t } = useTranslation()

  const activeCaptcha = captchaCodes[captchaIndex]
  const request = requests.find((item) => item.id === requestId)

  useEffect(() => {
    if (request) requestDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [request])

  if (isAuthenticated) return <Navigate replace to="/request-history" />

  const refreshCaptcha = () => {
    setCaptchaIndex((current) => (current + 1) % captchaCodes.length)
    setCaptcha("")
    setErrors((current) => ({ ...current, captcha: undefined }))
  }

  const checkStatus = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: LookupErrors = {}
    const matchingRequest = requests.find((item) => item.id.toLowerCase() === registrationNumber.trim().toLowerCase())

    if (!registrationNumber.trim()) nextErrors.registrationNumber = t("status.errorRegistration")
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = t("status.errorEmail")
    if (captcha.trim().toUpperCase() !== activeCaptcha) nextErrors.captcha = t("status.errorCaptcha")
    if (!nextErrors.registrationNumber && !nextErrors.email && !nextErrors.captcha) {
      if (!matchingRequest || email.trim().toLowerCase() !== matchingRequest.applicantEmail.toLowerCase()) {
        nextErrors.lookup = t("status.errorLookup")
      }
    }

    setErrors(nextErrors)
    setRequestId(Object.keys(nextErrors).length ? null : matchingRequest?.id ?? null)
  }

  return (
    <div className="mx-auto w-full max-w-container-max px-margin-mobile py-8 md:px-margin-desktop md:py-12">
      <header className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <MaterialIcon className="text-2xl">manage_search</MaterialIcon>
        </div>
        <h1 className="font-headline-lg text-3xl text-primary md:text-headline-lg">{t("status.title")}</h1>
        <p className="mt-3 text-base leading-7 text-on-surface-variant">{t("status.subtitle")}</p>
      </header>

      <div className="mx-auto max-w-3xl">
        <Card className="border border-outline-variant bg-surface-container-lowest shadow-sm">
          <CardHeader className="border-b border-outline-variant/50">
            <CardTitle className="text-primary">{t("status.lookupTitle")}</CardTitle>
            <CardDescription>{t("status.lookupDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-5 md:grid-cols-2" noValidate onSubmit={checkStatus}>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="registration-number">{t("status.registrationNumber")}</label>
                <Input aria-invalid={Boolean(errors.registrationNumber)} id="registration-number" onChange={(event) => { setRegistrationNumber(event.target.value); setErrors((current) => ({ ...current, registrationNumber: undefined, lookup: undefined })) }} placeholder="RTI-2026-11842" value={registrationNumber} />
                {errors.registrationNumber ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors.registrationNumber}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="request-email">{t("status.emailAddress")}</label>
                <Input aria-invalid={Boolean(errors.email)} id="request-email" onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: undefined, lookup: undefined })) }} placeholder="user@domain.com" type="email" value={email} />
                {errors.email ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors.email}</p> : null}
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="status-captcha">{t("status.captcha")}</label>
                <div className="flex max-w-md gap-2">
                  <Input aria-invalid={Boolean(errors.captcha)} id="status-captcha" onChange={(event) => { setCaptcha(event.target.value); setErrors((current) => ({ ...current, captcha: undefined, lookup: undefined })) }} placeholder={t("status.enterCaptcha")} value={captcha} />
                  <span aria-label="Captcha code" className="flex h-8 min-w-24 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low px-3 font-mono text-sm font-bold tracking-[0.2em] text-primary">{activeCaptcha}</span>
                  <IconTooltip label={t("status.refreshCaptcha")} render={<Button aria-label={t("status.refreshCaptcha")} onClick={refreshCaptcha} size="icon" type="button" variant="outline" />}><MaterialIcon>refresh</MaterialIcon></IconTooltip>
                </div>
                {errors.captcha ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors.captcha}</p> : null}
              </div>
              {errors.lookup ? <p className="text-sm font-medium text-destructive md:col-span-2" role="alert">{errors.lookup}</p> : null}
              <div className="flex justify-end md:col-span-2">
                <Button size="lg" type="submit"><MaterialIcon>search</MaterialIcon>{t("status.checkStatus")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

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
