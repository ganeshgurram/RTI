import { useState, type FormEvent, type ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"

import { useAuth } from "@/auth/AuthContext"
import type { RequestAuthority } from "@/request-guidelines/RequestGuidelinesDialog"
import { useRequests } from "@/requests/RequestContext"
import { MaterialIcon } from "@/routes/stitch-shell"

const inputClassName = "h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface shadow-sm outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
const selectClassName = `${inputClassName} cursor-pointer`
const labelClassName = "block text-label-lg font-semibold text-on-surface"

function FormSection({
  children,
  icon,
  title,
}: {
  children: ReactNode
  icon: string
  title: string
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-surface-variant bg-surface-container-lowest">
      <div className="flex items-center gap-2 border-b border-surface-variant bg-surface-container-low px-6 py-4">
        <MaterialIcon>{icon}</MaterialIcon>
        <h2 className="font-headline-md text-headline-md text-primary">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Required() {
  return <span className="text-error"> *</span>
}

const ministryOptions = [
  "Department of Personnel and Training",
  "Ministry of Water Resources, River Development & Ganga Rejuvenation",
]

const authorityOptions = [
  "Central Information Commission",
  "Department of Personnel and Training",
]

/**
 * The directory holds 2,907 offices and this form lists two, so an office chosen there is
 * almost never already an option. Adding it keeps the applicant's choice instead of asking
 * them to pick again from a list that does not contain it.
 */
function withSelected(options: string[], selected?: string) {
  return selected && !options.includes(selected) ? [selected, ...options] : options
}

export function RequestFormPage({ authority }: { authority?: RequestAuthority }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { createRequest } = useRequests()
  const [captchaIndex, setCaptchaIndex] = useState(0)
  const [paymentMessage, setPaymentMessage] = useState("")
  const [submissionError, setSubmissionError] = useState("")
  const [isBplApplicant, setIsBplApplicant] = useState(false)
  const captchaCodes = ["915267", "418903", "672154"]
  const captchaCode = captchaCodes[captchaIndex]
  const applicantProfile = user?.profile ?? null
  const profileMobile = applicantProfile?.mobile.replace(/\D/g, "")

  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const confirmedEmail = String(formData.get("confirmEmail") ?? "").trim()
    const enteredCaptcha = String(formData.get("captcha") ?? "").trim()

    if (email.toLowerCase() !== confirmedEmail.toLowerCase()) {
      setSubmissionError("Email addresses do not match.")
      return
    }

    if (enteredCaptcha !== captchaCode) {
      setSubmissionError("The security code does not match. Please try again.")
      return
    }

    const request = createRequest({
      applicantEmail: email,
      applicantName: String(formData.get("fullName") ?? "").trim(),
      applicantPhone: `+91 ${String(formData.get("mobile") ?? "").trim()}`,
      authority: String(formData.get("authority") ?? ""),
      subject: String(formData.get("requestText") ?? ""),
    })

    navigate("/request-submission-success", { state: { requestId: request.id } })
  }

  const resetRequest = () => {
    setPaymentMessage("")
    setSubmissionError("")
    setIsBplApplicant(false)
  }

  return (
    <form className="mx-auto w-full max-w-container-max space-y-stack-lg px-margin-mobile py-stack-lg md:px-margin-desktop md:py-8" onReset={resetRequest} onSubmit={submitRequest}>
      <header className="mb-stack-md">
        <h1 className="mb-2 font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">Online RTI Request Form</h1>
        <p className="text-body-md text-on-surface-variant">
          Please fill in all mandatory fields marked with an asterisk (<span className="text-error">*</span>).
        </p>
        {applicantProfile ? <p className="mt-2 flex items-center gap-2 text-sm text-state-success"><MaterialIcon className="text-lg">check_circle</MaterialIcon>Your personal details have been filled from your applicant profile. You can edit them for this request if needed.</p> : null}
        {authority ? <p className="mt-2 flex items-center gap-2 text-sm text-state-success"><MaterialIcon className="text-lg">account_balance</MaterialIcon>Filing to {authority.name}, selected from the Public Authorities directory. You can change it below.</p> : null}
      </header>

      <FormSection icon="account_balance" title="Public Authority Details">
        <div className="grid grid-cols-1 gap-gutter p-6 md:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-ministry">Ministry/Department/Apex body<Required /></label>
            <select className={selectClassName} defaultValue={authority?.ministryName ?? ""} id="request-ministry" name="ministry" required>
              <option disabled value="">Select Ministry/Department/Apex body</option>
              {withSelected(ministryOptions, authority?.ministryName).map((name) => <option key={name}>{name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-authority">Select Public Authority<Required /></label>
            <select className={selectClassName} defaultValue={authority?.name ?? ""} id="request-authority" name="authority" required>
              <option disabled value="">Select Public Authority</option>
              {withSelected(authorityOptions, authority?.name).map((name) => <option key={name}>{name}</option>)}
            </select>
          </div>
        </div>
      </FormSection>

      <FormSection icon="person" title="Personal Details of RTI Applicant">
        <div className="grid grid-cols-1 gap-gutter p-6 md:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-email">Email-ID<Required /></label>
            <input className={inputClassName} defaultValue={user?.email} id="request-email" name="email" placeholder="Enter Email-ID" required type="email" />
          </div>
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-mobile">Mobile Number<Required /></label>
            <div className="flex gap-2">
              <span className="inline-flex h-10 items-center rounded border border-outline-variant bg-surface-container-low px-3 text-body-md text-on-surface-variant">+91</span>
              <input className={`${inputClassName} flex-1`} defaultValue={profileMobile} id="request-mobile" maxLength={10} name="mobile" pattern="[0-9]{10}" placeholder="Enter 10 digit mobile number" required type="tel" />
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-confirm-email">Confirm Email-ID<Required /></label>
            <input className={inputClassName} defaultValue={user?.email} id="request-confirm-email" name="confirmEmail" placeholder="Re-enter Email-ID" required type="email" />
          </div>
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-name">Name<Required /></label>
            <input className={inputClassName} defaultValue={user?.fullName} id="request-name" name="fullName" placeholder="Enter Full Name" required type="text" />
          </div>
          <fieldset className="space-y-1">
            <legend className={labelClassName}>Gender<Required /></legend>
            <div className="flex h-10 flex-wrap items-center gap-x-4 gap-y-1">
              {['Male', 'Female', 'Third Gender'].map((gender) => (
                <label className="inline-flex items-center text-body-md" key={gender}>
                  <input className="size-4 border-outline-variant text-primary focus:ring-primary" defaultChecked={applicantProfile?.gender === gender} name="request-gender" required type="radio" value={gender} />
                  <span className="ml-2">{gender}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="space-y-1 md:col-span-2">
            <label className={labelClassName} htmlFor="request-address-line-1">Address<Required /></label>
            <div className="space-y-2">
              <input className={inputClassName} defaultValue={applicantProfile?.address.line1} id="request-address-line-1" name="addressLine1" placeholder="Line 1" required type="text" />
              <input className={inputClassName} defaultValue={applicantProfile?.address.line2} placeholder="Line 2" type="text" />
              <input className={inputClassName} defaultValue={applicantProfile ? `${applicantProfile.address.city}, ${applicantProfile.address.district}` : undefined} placeholder="Line 3" type="text" />
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-pincode">Pin code<Required /></label>
            <input className={inputClassName} defaultValue={applicantProfile?.address.pincode} id="request-pincode" inputMode="numeric" maxLength={6} name="pincode" pattern="[0-9]{6}" placeholder="Enter 6 digit PIN code" required type="text" />
          </div>
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-country">Country<Required /></label>
            <select className={selectClassName} defaultValue={applicantProfile?.country ?? "India"} id="request-country" name="country" required><option>India</option><option>Other</option></select>
          </div>
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-state">State<Required /></label>
            <select className={selectClassName} defaultValue={applicantProfile?.address.state ?? ""} id="request-state" name="state" required><option disabled value="">Select State</option><option>Delhi</option><option>Kerala</option><option>Maharashtra</option><option>Tamil Nadu</option></select>
          </div>
          <fieldset className="space-y-1">
            <legend className={labelClassName}>Status</legend>
            <div className="flex h-10 items-center gap-4">
              {['Rural', 'Urban'].map((status) => <label className="inline-flex items-center text-body-md" key={status}><input className="size-4 border-outline-variant text-primary focus:ring-primary" defaultChecked={applicantProfile?.areaType === status} name="request-area" type="radio" value={status} /><span className="ml-2">{status}</span></label>)}
            </div>
          </fieldset>
          <fieldset className="space-y-1">
            <legend className={labelClassName}>Educational Status</legend>
            <div className="flex h-10 items-center gap-4">
              {['Literate', 'Illiterate'].map((status) => <label className="inline-flex items-center text-body-md" key={status}><input className="size-4 border-outline-variant text-primary focus:ring-primary" defaultChecked={applicantProfile?.educationalStatus === status} name="request-education" type="radio" value={status} /><span className="ml-2">{status}</span></label>)}
            </div>
          </fieldset>
        </div>
      </FormSection>

      <FormSection icon="description" title="Request Details">
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            <div className="space-y-1">
              <label className={labelClassName} htmlFor="request-citizenship">Citizenship<Required /></label>
              <select className={selectClassName} defaultValue={applicantProfile?.citizenship ?? "Indian"} id="request-citizenship" name="citizenship" required><option>Indian</option><option>Other</option></select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-gutter border-t border-surface-variant pt-6 md:grid-cols-2">
            <div className="space-y-1">
              <label className={labelClassName} htmlFor="request-bpl">Is the Applicant Below Poverty Line ?<Required /></label>
              <select className={selectClassName} id="request-bpl" name="bpl" onChange={(event) => setIsBplApplicant(event.target.value === "Yes")} value={isBplApplicant ? "Yes" : "No"}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>
            <div className={`${isBplApplicant ? "grid" : "hidden"} gap-gutter rounded-lg border border-surface-variant bg-surface-container-low p-4 md:col-span-2 md:grid-cols-2`}>
              <p className="text-label-sm text-error italic md:col-span-2">(Proof of BPL may be provided as an attachment)</p>
              <div className="space-y-1"><label className={labelClassName} htmlFor="request-bpl-card">BPL Card No.<Required /></label><input className={inputClassName} disabled={!isBplApplicant} id="request-bpl-card" required={isBplApplicant} type="text" /></div>
              <div className="space-y-1"><label className={labelClassName} htmlFor="request-bpl-year">Year of Issue<Required /></label><input className={inputClassName} disabled={!isBplApplicant} id="request-bpl-year" inputMode="numeric" required={isBplApplicant} type="text" /></div>
              <div className="space-y-1"><label className={labelClassName} htmlFor="request-bpl-authority">Issuing Authority<Required /></label><input className={inputClassName} disabled={!isBplApplicant} id="request-bpl-authority" required={isBplApplicant} type="text" /></div>
            </div>
            {isBplApplicant ? <div className="rounded-lg border border-secondary/35 bg-secondary/10 p-4 md:col-span-2"><p className="flex items-center gap-2 text-body-md font-semibold text-on-surface"><MaterialIcon className="text-secondary">verified</MaterialIcon>No RTI fee is required for BPL applicants.</p></div> : null}
            <div className={`${isBplApplicant ? "hidden" : ""} rounded-lg border border-error-container bg-error-container/20 p-4 md:col-span-2`}>
              <p className="flex items-center gap-2 text-body-md font-semibold text-error"><MaterialIcon>info</MaterialIcon>You are required to pay the RTI fee of ₹ 10</p>
            </div>
          </div>
          <div className="space-y-4 border-t border-surface-variant pt-6">
            <label className={labelClassName} htmlFor="request-text">Text for RTI Request application<Required /></label>
            <p className="rounded border border-primary-fixed-dim bg-primary-fixed/30 p-2 text-label-sm text-surface-tint">Note:- Only alphabets A-Z a-z number 0-9 and special characters , . - _ ( ) / @ : &amp; ? \ % are allowed in Text for RTI Request application.</p>
            <textarea className="min-h-48 w-full rounded border border-outline-variant bg-surface-container-lowest p-3 text-body-md text-on-surface shadow-sm outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary" id="request-text" maxLength={3000} name="requestText" placeholder="Enter Text for RTI Request application upto 3000 characters" required rows={8} />
          </div>
          <div className={`${isBplApplicant ? "block" : "hidden"} space-y-2 border-t border-surface-variant pt-6`}>
            <label className={labelClassName} htmlFor="request-document">Supporting document <span className="font-normal text-label-sm text-on-surface-variant">(only pdf upto 1 MB)</span><Required /></label>
            <p className="text-label-sm text-error italic">(Upload the proof of BPL status if applicable)</p>
            <input accept=".pdf" className="block w-full cursor-pointer rounded border border-outline-variant bg-surface-container-lowest text-body-md text-on-surface-variant file:mr-4 file:border-0 file:bg-surface-container file:px-4 file:py-2 file:font-label-lg file:text-primary hover:file:bg-surface-container-high" disabled={!isBplApplicant} id="request-document" required={isBplApplicant} type="file" />
          </div>
        </div>
      </FormSection>

      <section className="space-y-6 rounded-lg border border-surface-variant bg-surface-container-lowest p-6">
        <div className="max-w-md space-y-2">
          <label className={labelClassName} htmlFor="request-captcha">Enter security code<Required /></label>
          <div className="flex items-center gap-3">
            <input className={`${inputClassName} h-12 flex-1`} id="request-captcha" name="captcha" placeholder="Enter code" required type="text" />
            <div className="flex shrink-0 items-center">
              <button aria-label="Refresh security code" className="flex size-12 cursor-pointer items-center justify-center rounded-l border border-r-0 border-primary bg-primary text-on-primary transition-colors hover:bg-primary/85 active:translate-y-px" onClick={() => setCaptchaIndex((current) => (current + 1) % captchaCodes.length)} title="Refresh security code" type="button">
                <MaterialIcon className="text-lg!">refresh</MaterialIcon>
              </button>
              <div className="flex h-12 items-center rounded-r border border-outline-variant bg-surface-variant px-4 font-mono text-headline-md font-bold tracking-[0.2em] text-on-surface sm:px-6">{captchaCode}</div>
            </div>
          </div>
        </div>
        {paymentMessage ? <p className="rounded-md border border-primary-fixed-dim bg-primary-fixed/30 p-3 text-sm font-medium text-primary" role="status">{paymentMessage}</p> : null}
        {submissionError ? <p className="rounded-md border border-error-container bg-error-container/20 p-3 text-sm font-medium text-error" role="alert">{submissionError}</p> : null}
        {!isBplApplicant ? <Link className="flex w-full items-center gap-2 text-sm font-semibold text-surface-tint hover:underline" to="/payment-reconciliation"><MaterialIcon className="text-lg">receipt_long</MaterialIcon>Payment unsuccessful or status not updated? Reconcile your payment.</Link> : null}
        <div className="flex flex-wrap gap-4 border-t border-surface-variant pt-6">
          <button className={`${isBplApplicant ? "" : "hidden"} rounded bg-primary px-8 py-3 font-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary-container`} type="submit">Submit</button>
          <button className={`${isBplApplicant ? "hidden" : "flex"} items-center gap-2 rounded bg-surface-tint px-8 py-3 font-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary-container`} type="submit"><MaterialIcon className="text-[18px]">payments</MaterialIcon>Make Payment</button>
          <button className="rounded border border-outline-variant bg-surface-container px-8 py-3 font-label-lg text-on-surface transition-colors hover:bg-surface-container-high" type="reset">Reset</button>
        </div>
      </section>
    </form>
  )
}
