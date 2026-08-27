import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"

import { useRequests } from "@/requests/RequestContext"
import { MaterialIcon } from "@/routes/stitch-shell"

const codes = ["726958", "318402", "604791"]

type LookupErrors = {
  registrationNumber?: string
  email?: string
  captcha?: string
  lookup?: string
}

export function SubmitFirstAppealPage() {
  const navigate = useNavigate()
  const { requests } = useRequests()
  const [captchaIndex, setCaptchaIndex] = useState(0)
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [email, setEmail] = useState("")
  const [captcha, setCaptcha] = useState("")
  const [errors, setErrors] = useState<LookupErrors>({})

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

    if (!registrationNumber.trim()) nextErrors.registrationNumber = "Enter the registration number of the original request."
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Enter the email address used for that request."
    if (captcha.trim() !== activeCaptcha) nextErrors.captcha = "Security code does not match. Please try again."
    if (!nextErrors.registrationNumber && !nextErrors.email && !nextErrors.captcha) {
      if (!matchingRequest || email.trim().toLowerCase() !== matchingRequest.applicantEmail.toLowerCase()) {
        nextErrors.lookup = "No online RTI request matches those details. Check the registration number and the email address it was filed with."
      }
    }

    setErrors(nextErrors)

    if (!Object.keys(nextErrors).length && matchingRequest) {
      navigate("/first-appeal-form", { state: { requestId: matchingRequest.id } })
    }
  }

  const resetLookup = () => {
    setRegistrationNumber("")
    setEmail("")
    setCaptcha("")
    setErrors({})
  }

  const refreshCaptcha = () => {
    setCaptchaIndex((current) => (current + 1) % codes.length)
    setCaptcha("")
    setErrors((current) => ({ ...current, captcha: undefined }))
  }

  return (
    <div className="mx-auto flex w-full max-w-container-max flex-1 flex-col items-center px-margin-mobile py-stack-lg md:px-margin-desktop md:py-12">
      <div className="w-full max-w-3xl">
        <header className="mb-stack-lg border-b border-outline-variant pb-stack-md">
          <h1 className="mb-stack-sm font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">Online RTI First Appeal Form</h1>
          <p className="text-body-md text-on-surface-variant">Enter the registration number and email address of the original online RTI request you want to appeal against.</p>
        </header>

        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg">
          <form className="flex flex-col gap-stack-md" noValidate onReset={resetLookup} onSubmit={beginAppeal}>
            <div className="flex flex-col gap-stack-sm md:flex-row md:items-start md:gap-gutter">
              <label className="flex items-center gap-1 font-label-lg text-label-lg text-on-surface md:mt-2 md:w-1/3" htmlFor="appeal-registration-number"><span className="text-error">*</span> RTI Request Registration No.</label>
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <input aria-invalid={Boolean(errors.registrationNumber)} className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary" id="appeal-registration-number" onChange={(event) => { setRegistrationNumber(event.target.value); setErrors((current) => ({ ...current, registrationNumber: undefined, lookup: undefined })) }} placeholder="RTI-2026-11842" type="text" value={registrationNumber} />
                  <button aria-label="Help with registration number" className="text-surface-tint transition-colors hover:text-primary" title="Help with Registration Number" type="button"><MaterialIcon className="text-[20px]">help</MaterialIcon></button>
                </div>
                {errors.registrationNumber ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors.registrationNumber}</p> : null}
              </div>
            </div>
            <div className="flex flex-col gap-stack-sm md:flex-row md:items-start md:gap-gutter">
              <label className="flex items-center gap-1 font-label-lg text-label-lg text-on-surface md:mt-2 md:w-1/3" htmlFor="appeal-email"><span className="text-error">*</span> Enter Email Id</label>
              <div className="flex-grow">
                <input aria-invalid={Boolean(errors.email)} className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary" id="appeal-email" onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: undefined, lookup: undefined })) }} placeholder="Enter Email Address" type="email" value={email} />
                {errors.email ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors.email}</p> : null}
              </div>
            </div>
            <div className="flex flex-col gap-stack-sm pt-stack-sm md:flex-row md:gap-gutter">
              <label className="flex items-center gap-1 font-label-lg text-label-lg text-on-surface md:mt-2 md:w-1/3" htmlFor="appeal-captcha"><span className="text-error">*</span> Enter Security code</label>
              <div className="flex flex-grow flex-col gap-stack-sm">
                <div className="flex items-center gap-stack-md">
                  <div aria-label="Security code" className="relative overflow-hidden rounded-md border border-outline-variant bg-surface-container-high px-4 py-2 font-mono text-headline-md tracking-[0.2em] text-on-surface">{activeCaptcha}</div>
                  <button className="flex items-center gap-1 text-sm font-label-lg text-surface-tint underline transition-colors hover:text-primary" onClick={refreshCaptcha} type="button"><MaterialIcon className="text-[16px]">refresh</MaterialIcon>refresh</button>
                </div>
                <input aria-invalid={Boolean(errors.captcha)} className="w-48 rounded-md border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary" id="appeal-captcha" onChange={(event) => { setCaptcha(event.target.value); setErrors((current) => ({ ...current, captcha: undefined })) }} placeholder="Enter code" type="text" value={captcha} />
                {errors.captcha ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors.captcha}</p> : null}
              </div>
            </div>
            {errors.lookup ? <p className="rounded-md border border-error-container bg-error-container/20 p-3 text-sm font-medium text-error" role="alert">{errors.lookup}</p> : null}
            <div className="mt-stack-md flex justify-center gap-stack-md border-t border-surface-container-high pt-stack-lg md:justify-start md:pl-[33%]">
              <button className="min-w-30 rounded-lg bg-primary px-6 py-2 font-label-lg text-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary-container" type="submit">Submit</button>
              <button className="min-w-30 rounded-lg border border-outline-variant bg-surface-container px-6 py-2 font-label-lg text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface" type="reset">Reset</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
