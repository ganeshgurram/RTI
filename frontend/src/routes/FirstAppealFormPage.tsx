import { type FormEvent, type ReactNode, useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useAuth } from "@/auth/AuthContext"
import { useRequests } from "@/requests/RequestContext"
import { MaterialIcon } from "@/routes/stitch-shell"

const fieldClassName = "w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface shadow-sm outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant"
const labelClassName = "text-label-lg font-semibold text-on-surface"
// Matches the security check on Payment Reconciliation: a quiet code chip beside the input, with
// the refresh as an outline icon button on the right.
const captchaCodeClassName = "flex h-10 min-w-24 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low px-3 font-mono text-sm font-bold tracking-[0.2em] text-primary"
const captchaRefreshClassName = "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-on-surface outline-none transition-all hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px"
const stateOptions = ["Delhi", "Kerala", "Maharashtra", "Tamil Nadu"]

function AppealRow({ children, label, hint, required = false }: { children: ReactNode; label: string; hint?: string; required?: boolean }) {
  return (
    <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-3">
      <label className={`${labelClassName} ${hint ? "flex flex-col" : ""}`}>
        {label}{required ? <span className="text-error"> *</span> : null}
        {hint ? <span className="font-normal text-label-sm italic text-error">{hint}</span> : null}
      </label>
      <div className="md:col-span-2">{children}</div>
    </div>
  )
}

function AppealSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="border-b border-outline-variant last:border-b-0">
      <div className="border-b border-outline-variant bg-surface-container-low px-6 py-4"><h2 className="font-headline-md text-headline-md text-primary">{title}</h2></div>
      <div className="space-y-6 p-6">{children}</div>
    </section>
  )
}

function HelpIcon({ title }: { title: string }) {
  return <span title={title}><MaterialIcon className="cursor-help text-outline">help</MaterialIcon></span>
}

export function FirstAppealFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { createFirstAppeal, requests } = useRequests()
  const [captchaIndex, setCaptchaIndex] = useState(0)
  const captchaCodes = ["290563", "572946", "814307"]
  const requestId = (location.state as { requestId?: string } | null)?.requestId
  const request = requests.find((item) => item.id === requestId)

  // An appeal is always against one specific request. Reaching this form without one means the
  // lookup was skipped, so send the appellant back to it rather than inventing a request.
  if (!request) {
    return <Navigate replace to="/submit-first-appeal" />
  }

  // Name, email and phone come from the request being appealed rather than from the session:
  // the appellant is whoever filed it, which is also the only answer that works signed out.
  // The rest of the personal details are not held on a request, so they fall back to the
  // signed-in profile and are left blank when there is none.
  const appellantProfile = user?.profile ?? null
  const appellantMobile = request.applicantPhone.replace(/\D/g, "").slice(-10)
  const { t } = useTranslation()

  const submitAppeal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const phone = `+91 ${String(formData.get("mobile") ?? "").trim()}`
    const appeal = createFirstAppeal({
      originalRequest: request,
      applicantEmail: email,
      applicantPhone: phone,
    })

    navigate("/appeal-submission-success", {
      state: {
        appeal: {
          registrationNumber: appeal.id,
          name: request.applicantName,
          date: appeal.submittedOn,
          authority: request.authority,
          phone,
          email,
          againstRequestId: request.id,
        },
      },
    })
  }

  return (
    <main className="mx-auto w-full max-w-container-max px-margin-mobile py-8 md:px-margin-desktop">
      <header className="mb-8">
        <h1 className="mb-2 font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">{t("firstAppeal.title")}</h1>
        <p className="flex items-center gap-1 text-body-md text-on-surface-variant"><MaterialIcon className="text-sm text-error">info</MaterialIcon>{t("firstAppeal.mandatoryNote")}</p>
        <p className="mt-2 flex items-center gap-2 text-sm text-state-success"><MaterialIcon className="text-lg">gavel</MaterialIcon>{t("firstAppeal.appealingAgainst", { id: request.id, subject: request.subject })}</p>
      </header>

      <form className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm" onSubmit={submitAppeal}>
        <AppealSection title={t("firstAppeal.publicAuthorityDetails")}>
          <AppealRow label={t("requestForm.ministry")} required>
            <div className="flex items-center gap-2"><select className={fieldClassName} defaultValue={request.authority} disabled><option>{request.authority}</option></select><HelpIcon title="The authority the original request was filed with" /></div>
          </AppealRow>
        </AppealSection>

        <AppealSection title={t("firstAppeal.appellantDetails")}>
          <AppealRow label={t("firstAppeal.registrationNumber")} required>
            <div className="flex items-center gap-2"><input className={`${fieldClassName} md:w-2/3`} defaultValue={request.id} readOnly type="text" /><HelpIcon title="Registration Number of the original request" /></div>
          </AppealRow>
          <AppealRow label={t("firstAppeal.requestDate")} required>
            <div className="flex items-center gap-2"><input className={`${fieldClassName} md:w-1/3`} defaultValue={request.submittedOn} readOnly type="text" /><HelpIcon title="Date when original request was filed" /></div>
          </AppealRow>
          <AppealRow label={t("requestForm.name")}><input className={`${fieldClassName} md:w-2/3`} defaultValue={request.applicantName} readOnly type="text" /></AppealRow>
          <AppealRow label={t("requestForm.gender")}>
            <div className="flex flex-wrap gap-4">
              {['Male', 'Female', 'Third gender'].map((option) => <label className="flex items-center gap-2 text-body-md" key={option}><input defaultChecked={(appellantProfile?.gender ?? "Male") === option} name="appeal-gender" type="radio" value={option} />{t(`requestForm.${option === "Male" ? "male" : option === "Female" ? "female" : "thirdGender"}`)}</label>)}
            </div>
          </AppealRow>
          <AppealRow label={t("requestForm.address")} required>
            <div className="space-y-2"><div className="flex items-center gap-2"><input className={fieldClassName} defaultValue={appellantProfile?.address.line1 ?? ""} type="text" /><HelpIcon title="Address line 1" /></div><input className={fieldClassName} defaultValue={appellantProfile?.address.line2 ?? ""} type="text" /><input className={fieldClassName} defaultValue={appellantProfile ? `${appellantProfile.address.city}, ${appellantProfile.address.district}` : ""} type="text" /></div>
          </AppealRow>
          <AppealRow label={t("requestForm.pinCode")}><div className="flex items-center gap-2"><input className={`${fieldClassName} md:w-1/3`} defaultValue={appellantProfile?.address.pincode ?? ""} inputMode="numeric" type="text" /><HelpIcon title={t("requestForm.pinCode")} /></div></AppealRow>
          <AppealRow label={t("requestForm.country")}><div className="flex gap-4">{['India', 'Other'].map((option) => <label className="flex items-center gap-2 text-body-md" key={option}><input defaultChecked={(appellantProfile?.country ?? "India") === option} name="appeal-country" type="radio" value={option} />{t(`requestForm.${option === "India" ? "india" : "other"}`)}</label>)}</div></AppealRow>
          <AppealRow label={t("requestForm.state")}><select className={`${fieldClassName} md:w-1/3`} defaultValue={appellantProfile?.address.state ?? ""}><option disabled value="">{t("requestForm.selectState")}</option>{stateOptions.map((option) => <option key={option}>{option}</option>)}</select></AppealRow>
          <AppealRow label={t("requestForm.areaType")}><div className="flex gap-4">{['Rural', 'Urban'].map((option) => <label className="flex items-center gap-2 text-body-md" key={option}><input defaultChecked={(appellantProfile?.areaType ?? "Urban") === option} name="appeal-area" type="radio" value={option} />{t(`requestForm.${option === "Rural" ? "rural" : "urban"}`)}</label>)}</div></AppealRow>
          <AppealRow label={t("requestForm.educationalStatus")}><div className="flex gap-4">{['Literate', 'Illiterate'].map((option) => <label className="flex items-center gap-2 text-body-md" key={option}><input defaultChecked={(appellantProfile?.educationalStatus ?? "Literate") === option} name="appeal-education" type="radio" value={option} />{t(`requestForm.${option === "Literate" ? "literate" : "illiterate"}`)}</label>)}</div></AppealRow>
          <AppealRow hint={t("firstAppeal.smsHint")} label={t("requestForm.mobile")}><div className="flex items-center gap-2"><div className="flex w-full md:w-2/3"><input className="w-16 rounded-l border border-r-0 border-outline-variant bg-surface-container-lowest px-3 py-2 text-center text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" defaultValue="+91" type="text" /><input className="flex-grow rounded-r border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" defaultValue={appellantMobile} name="mobile" type="tel" /></div><HelpIcon title={t("requestForm.mobile")} /></div></AppealRow>
          <AppealRow label={t("requestForm.email")} required><div className="flex items-center gap-2"><input className={`${fieldClassName} md:w-2/3`} defaultValue={request.applicantEmail} name="email" type="email" /><HelpIcon title={t("status.emailAddress")} /></div></AppealRow>
        </AppealSection>

        <AppealSection title={t("firstAppeal.appealDetails")}>
          <AppealRow label={t("requestForm.citizenship")}><select className={`${fieldClassName} md:w-1/3`} defaultValue="Indian" disabled><option>{t("requestForm.indian")}</option></select></AppealRow>
          <AppealRow label={t("requestForm.bplQuestion")} required><select className={`${fieldClassName} md:w-1/3`} defaultValue="No"><option>{t("requestForm.yes")}</option><option>{t("requestForm.no")}</option></select></AppealRow>
          <AppealRow label={t("firstAppeal.ground")} required><select className={`${fieldClassName} md:w-2/3`} defaultValue="" required><option disabled value="">{t("firstAppeal.select")}</option><option>{t("firstAppeal.refused")}</option><option>{t("firstAppeal.noResponse")}</option><option>{t("firstAppeal.unreasonableFee")}</option><option>{t("firstAppeal.incompleteInfo")}</option><option>{t("firstAppeal.otherGround")}</option></select></AppealRow>
          <div className="rounded border border-outline-variant bg-surface p-4">
            <p className="mb-2 text-label-sm text-on-surface-variant">{t("firstAppeal.appealTextHint")}</p>
            <p className="mb-4 flex items-center gap-1 text-label-sm font-medium italic text-surface-tint">{t("firstAppeal.appealTextNote")}</p>
            <AppealRow label={t("firstAppeal.appealText")} required><textarea className={`${fieldClassName} min-h-36 resize-y`} maxLength={500} rows={6} /></AppealRow>
          </div>
          <AppealRow hint={t("requestForm.pdfLimit")} label={t("requestForm.supportingDocument")}><input accept=".pdf" className="block w-full cursor-pointer text-sm text-on-surface-variant file:mr-4 file:rounded file:border file:border-outline-variant file:bg-surface-container file:px-4 file:py-2 file:font-label-lg file:text-on-surface hover:file:bg-surface-container-high md:w-2/3" type="file" /></AppealRow>
          <AppealRow label={t("firstAppeal.securityCode")} required>
            <div className="flex max-w-md items-center gap-2">
              <input className={`${fieldClassName} h-10 flex-1`} placeholder={t("requestForm.enterCode")} type="text" />
              <span aria-label={t("firstAppeal.securityCode")} className={captchaCodeClassName}>{captchaCodes[captchaIndex]}</span>
              <button aria-label={t("firstAppeal.refresh")} className={captchaRefreshClassName} onClick={() => setCaptchaIndex((current) => (current + 1) % captchaCodes.length)} title={t("firstAppeal.refresh")} type="button">
                <MaterialIcon className="text-lg">refresh</MaterialIcon>
              </button>
            </div>
          </AppealRow>
        </AppealSection>

        <div className="flex justify-center gap-4 border-t border-outline-variant bg-surface-container-low px-6 py-4">
          <button className="rounded bg-surface-tint px-8 py-2 font-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary" type="submit">{t("firstAppeal.submit")}</button>
          <button className="rounded bg-surface-tint px-8 py-2 font-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary" type="reset">{t("firstAppeal.reset")}</button>
        </div>
      </form>
    </main>
  )
}
