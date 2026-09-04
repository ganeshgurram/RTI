import { type FormEvent, type ReactNode, useRef, useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useAuth } from "@/auth/AuthContext"
import { AiRewriteAssistant } from "@/components/AiRewriteAssistant"
import { IconTooltip } from "@/components/IconTooltip"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { indianStates, indianUnionTerritories } from "@/data/indian-states"
import { useFormDraft } from "@/hooks/useFormDraft"
import { useRequests } from "@/requests/RequestContext"
import { MaterialIcon } from "@/routes/stitch-shell"

const fieldClassName = "h-10 w-full rounded-lg border border-input bg-background px-3 text-body-md text-on-surface shadow-sm outline-none transition-colors placeholder:text-on-surface-variant focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted disabled:text-on-surface-variant read-only:bg-muted/50"
const labelClassName = "block text-label-lg font-semibold text-on-surface"
// Matches the security check on Payment Reconciliation: a quiet code chip beside the input, with
// the refresh as an outline icon button on the right.
const captchaCodeClassName = "flex h-10 min-w-24 shrink-0 items-center justify-center rounded-lg border border-input bg-muted px-3 font-mono text-sm font-bold tracking-[0.2em] text-primary"
const captchaRefreshClassName = "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-on-surface outline-none transition-all hover:bg-muted focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 active:translate-y-px"

function AppealRow({ children, className = "", label, hint, required = false }: { children: ReactNode; className?: string; label: string; hint?: string; required?: boolean }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className={`${labelClassName} ${hint ? "flex flex-col" : ""}`}>
        {label}{required ? <span className="text-error"> *</span> : null}
        {hint ? <span className="font-normal text-label-sm italic text-error">{hint}</span> : null}
      </label>
      {children}
    </div>
  )
}

function AppealSection({ children, icon, title }: { children: ReactNode; icon: string; title: string }) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border bg-muted/45 px-5 py-3.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><MaterialIcon className="text-[19px]">{icon}</MaterialIcon></span>
        <h2 className="font-headline-md text-headline-md text-primary">{title}</h2>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}

function HelpIcon({ title }: { title: string }) {
  // A button rather than the bare span it used to be: the hint was unreachable by keyboard while
  // it lived in a title attribute, and a tooltip only opens on a trigger that can take focus.
  return (
    <IconTooltip label={title} render={<button aria-label={title} className="cursor-help text-outline" type="button" />}>
      <MaterialIcon>help</MaterialIcon>
    </IconTooltip>
  )
}

function AppealGuidance({ children }: { children: ReactNode }) {
  return <aside className="flex gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5 text-sm leading-5 text-on-surface-variant"><MaterialIcon className="mt-0.5 shrink-0 text-base text-primary">lightbulb</MaterialIcon><p>{children}</p></aside>
}

export function FirstAppealFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { createFirstAppeal, requests } = useRequests()
  const { t } = useTranslation()
  const appealDraft = useFormDraft(`rti-demo-first-appeal-form-v1:${(location.state as { requestId?: string } | null)?.requestId ?? "unknown"}`, { exclude: ["appealCaptcha", "appealSupportingDocument"] })
  const [captchaIndex, setCaptchaIndex] = useState(0)
  const [appealText, setAppealText] = useState(appealDraft.value("appealText", ""))
  const [formResetKey, setFormResetKey] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
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

  const submitAppeal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const phone = `+91 ${String(formData.get("mobile") ?? "").trim()}`
    const appeal = await createFirstAppeal({
      originalRequest: request,
      applicantEmail: email,
      applicantPhone: phone,
      appealText,
      ground: String(formData.get("appealGround") ?? ""),
    })

    appealDraft.clear()
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

  const resetAppeal = () => {
    appealDraft.clear()
    setAppealText("")
    setFormResetKey((current) => current + 1)
  }

  const saveDraft = () => window.requestAnimationFrame(() => appealDraft.save(formRef.current))

  return (
    <main className="mx-auto w-full max-w-5xl px-margin-mobile py-8 md:px-margin-desktop">
      <header className="mb-5">
        <h1 className="mb-2 font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">{t("firstAppeal.title")}</h1>
        <p className="flex items-center gap-1 text-body-md text-on-surface-variant"><MaterialIcon className="text-sm text-error">info</MaterialIcon>{t("firstAppeal.mandatoryNote")}</p>
        <p className="mt-2 flex items-center gap-2 text-sm text-state-success"><MaterialIcon className="text-lg">gavel</MaterialIcon>{t("firstAppeal.appealingAgainst", { id: request.id, subject: request.subject })}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-on-surface-variant">
          {appealDraft.wasRestored ? <span className="flex items-center gap-1.5"><MaterialIcon className="text-base text-state-success">restore</MaterialIcon>{t("formDraft.restored")}</span> : null}
          {appealDraft.saveState === "saving" ? <span>{t("formDraft.saving")}</span> : null}
          {appealDraft.saveState === "saved" ? <span className="flex items-center gap-1.5"><MaterialIcon className="text-base text-state-success">save</MaterialIcon>{t("formDraft.saved")}</span> : null}
          {appealDraft.hasDraft ? <Button className="h-auto px-1.5 py-0.5 text-sm" onClick={resetAppeal} type="button" variant="ghost">{t("formDraft.discard")}</Button> : null}
        </div>
      </header>

      <form className="space-y-5" key={formResetKey} onChange={saveDraft} onReset={resetAppeal} onSubmit={submitAppeal} ref={formRef}>
        <AppealSection icon="account_balance" title={t("firstAppeal.publicAuthorityDetails")}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <AppealRow className="md:col-span-2" label={t("requestForm.ministry")} required>
              <div className="flex items-center gap-2"><Select defaultValue={request.authority} disabled><SelectTrigger className="!w-full !h-10 text-body-md text-on-surface"><SelectValue /></SelectTrigger><SelectContent align="start" alignItemWithTrigger={false}><SelectItem value={request.authority}>{request.authority}</SelectItem></SelectContent></Select><HelpIcon title="The authority the original request was filed with" /></div>
            </AppealRow>
          </div>
        </AppealSection>

        <AppealSection icon="person" title={t("firstAppeal.appellantDetails")}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <AppealRow label={t("firstAppeal.registrationNumber")} required><div className="flex items-center gap-2"><input className={fieldClassName} defaultValue={request.id} readOnly type="text" /><HelpIcon title="Registration Number of the original request" /></div></AppealRow>
            <AppealRow label={t("firstAppeal.requestDate")} required><div className="flex items-center gap-2"><input className={fieldClassName} defaultValue={request.submittedOn} readOnly type="text" /><HelpIcon title="Date when original request was filed" /></div></AppealRow>
            <AppealRow label={t("requestForm.name")}><input className={fieldClassName} defaultValue={request.applicantName} readOnly type="text" /></AppealRow>
            <AppealRow label={t("requestForm.gender")}><div className="flex h-10 flex-wrap items-center gap-x-4 gap-y-1">{['Male', 'Female', 'Third gender'].map((option) => <label className="flex items-center gap-2 text-body-md" key={option}><input className="size-4 border-input text-primary focus:ring-primary" defaultChecked={appealDraft.value("appeal-gender", appellantProfile?.gender ?? "Male") === option} name="appeal-gender" type="radio" value={option} />{t(`requestForm.${option === "Male" ? "male" : option === "Female" ? "female" : "thirdGender"}`)}</label>)}</div></AppealRow>
            <AppealRow className="md:col-span-2" label={t("requestForm.address")} required><div className="space-y-2"><div className="flex items-center gap-2"><input className={fieldClassName} defaultValue={appealDraft.value("appealAddressLine1", appellantProfile?.address.line1 ?? "")} name="appealAddressLine1" type="text" /><HelpIcon title="Address line 1" /></div><input className={fieldClassName} defaultValue={appealDraft.value("appealAddressLine2", appellantProfile?.address.line2 ?? "")} name="appealAddressLine2" type="text" /><input className={fieldClassName} defaultValue={appealDraft.value("appealAddressLine3", appellantProfile ? `${appellantProfile.address.city}, ${appellantProfile.address.district}` : "")} name="appealAddressLine3" type="text" /></div></AppealRow>
            <AppealRow label={t("requestForm.pinCode")}><div className="flex items-center gap-2"><input className={fieldClassName} defaultValue={appealDraft.value("appealPincode", appellantProfile?.address.pincode ?? "")} inputMode="numeric" name="appealPincode" type="text" /><HelpIcon title={t("requestForm.pinCode")} /></div></AppealRow>
            <AppealRow label={t("requestForm.country")}><div className="flex h-10 items-center gap-4">{['India', 'Other'].map((option) => <label className="flex items-center gap-2 text-body-md" key={option}><input className="size-4 border-input text-primary focus:ring-primary" defaultChecked={appealDraft.value("appeal-country", appellantProfile?.country ?? "India") === option} name="appeal-country" type="radio" value={option} />{t(`requestForm.${option === "India" ? "india" : "other"}`)}</label>)}</div></AppealRow>
            <AppealRow label={t("requestForm.state")}><Select defaultValue={appealDraft.value("appealState", appellantProfile?.address.state ?? "")} name="appealState" onValueChange={saveDraft}><SelectTrigger className="!w-full !h-10 text-body-md text-on-surface"><SelectValue placeholder={t("requestForm.selectState")} /></SelectTrigger><SelectContent align="start" alignItemWithTrigger={false} className="max-h-72"><SelectGroup><SelectLabel>{t("requestForm.statesGroup")}</SelectLabel>{indianStates.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectGroup><SelectGroup><SelectLabel>{t("requestForm.unionTerritoriesGroup")}</SelectLabel>{indianUnionTerritories.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectGroup></SelectContent></Select></AppealRow>
            <AppealRow label={t("requestForm.areaType")}><div className="flex h-10 items-center gap-4">{['Rural', 'Urban'].map((option) => <label className="flex items-center gap-2 text-body-md" key={option}><input className="size-4 border-input text-primary focus:ring-primary" defaultChecked={appealDraft.value("appeal-area", appellantProfile?.areaType ?? "Urban") === option} name="appeal-area" type="radio" value={option} />{t(`requestForm.${option === "Rural" ? "rural" : "urban"}`)}</label>)}</div></AppealRow>
            <AppealRow label={t("requestForm.educationalStatus")}><div className="flex h-10 items-center gap-4">{['Literate', 'Illiterate'].map((option) => <label className="flex items-center gap-2 text-body-md" key={option}><input className="size-4 border-input text-primary focus:ring-primary" defaultChecked={appealDraft.value("appeal-education", appellantProfile?.educationalStatus ?? "Literate") === option} name="appeal-education" type="radio" value={option} />{t(`requestForm.${option === "Literate" ? "literate" : "illiterate"}`)}</label>)}</div></AppealRow>
            <AppealRow hint={t("firstAppeal.smsHint")} label={t("requestForm.mobile")}><div className="flex items-center gap-2"><span className="inline-flex h-10 items-center rounded-lg border border-input bg-muted px-3 text-body-md text-on-surface-variant">+91</span><input className={`${fieldClassName} flex-1`} defaultValue={appealDraft.value("mobile", appellantMobile)} name="mobile" type="tel" /><HelpIcon title={t("requestForm.mobile")} /></div></AppealRow>
            <AppealRow label={t("requestForm.email")} required><div className="flex items-center gap-2"><input className={fieldClassName} defaultValue={appealDraft.value("email", request.applicantEmail)} name="email" type="email" /><HelpIcon title={t("status.emailAddress")} /></div></AppealRow>
          </div>
        </AppealSection>

        <AppealSection icon="gavel" title={t("firstAppeal.appealDetails")}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <AppealRow label={t("requestForm.citizenship")}><Select defaultValue="Indian" disabled><SelectTrigger className="!w-full !h-10 text-body-md text-on-surface"><SelectValue /></SelectTrigger><SelectContent align="start" alignItemWithTrigger={false}><SelectItem value="Indian">{t("requestForm.indian")}</SelectItem></SelectContent></Select></AppealRow>
            <AppealRow label={t("requestForm.bplQuestion")} required><Select defaultValue={appealDraft.value("appealBpl", "No")} name="appealBpl" onValueChange={saveDraft}><SelectTrigger className="!w-full !h-10 text-body-md text-on-surface"><SelectValue /></SelectTrigger><SelectContent align="start" alignItemWithTrigger={false}><SelectItem value="Yes">{t("requestForm.yes")}</SelectItem><SelectItem value="No">{t("requestForm.no")}</SelectItem></SelectContent></Select></AppealRow>
            <AppealRow className="md:col-span-2" label={t("firstAppeal.ground")} required><Select defaultValue={appealDraft.value("appealGround", "")} name="appealGround" onValueChange={saveDraft} required><SelectTrigger className="!w-full !h-10 text-body-md text-on-surface"><SelectValue placeholder={t("firstAppeal.select")} /></SelectTrigger><SelectContent align="start" alignItemWithTrigger={false}><SelectItem value={t("firstAppeal.refused")}>{t("firstAppeal.refused")}</SelectItem><SelectItem value={t("firstAppeal.noResponse")}>{t("firstAppeal.noResponse")}</SelectItem><SelectItem value={t("firstAppeal.unreasonableFee")}>{t("firstAppeal.unreasonableFee")}</SelectItem><SelectItem value={t("firstAppeal.incompleteInfo")}>{t("firstAppeal.incompleteInfo")}</SelectItem><SelectItem value={t("firstAppeal.otherGround")}>{t("firstAppeal.otherGround")}</SelectItem></SelectContent></Select><AppealGuidance>{t("formGuidance.appealGround")}</AppealGuidance></AppealRow>
            <div className="space-y-4 rounded-xl border border-border bg-muted/40 p-4 md:col-span-2">
              <p className="text-label-sm text-on-surface-variant">{t("firstAppeal.appealTextHint")}</p>
              <p className="flex items-center gap-1 text-label-sm font-medium italic text-surface-tint">{t("firstAppeal.appealTextNote")}</p>
              <AppealRow label={t("firstAppeal.appealText")} required>
                <div className="space-y-3">
                  <AiRewriteAssistant draft={appealText} maxLength={500} onUseRewrite={setAppealText} type="first-appeal" />
                  <textarea className={`${fieldClassName} min-h-36 resize-y py-3`} id="appeal-text" maxLength={500} name="appealText" onChange={(event) => setAppealText(event.target.value)} required rows={6} value={appealText} />
                </div>
              </AppealRow>
            </div>
            <AppealRow className="md:col-span-2" hint={t("requestForm.pdfLimit")} label={t("requestForm.supportingDocument")}><input accept=".pdf" className="block w-full cursor-pointer rounded-lg border border-input bg-background text-sm text-on-surface-variant file:mr-4 file:border-0 file:bg-muted file:px-4 file:py-2 file:font-label-lg file:text-primary hover:file:bg-muted/80" name="appealSupportingDocument" type="file" /></AppealRow>
            <AppealRow className="md:col-span-2" label={t("firstAppeal.securityCode")} required>
              <div className="flex max-w-md items-center gap-2">
                <input className={`${fieldClassName} flex-1`} name="appealCaptcha" placeholder={t("requestForm.enterCode")} type="text" />
                <span aria-label={t("firstAppeal.securityCode")} className={captchaCodeClassName}>{captchaCodes[captchaIndex]}</span>
                <IconTooltip label={t("firstAppeal.refresh")} render={<button aria-label={t("firstAppeal.refresh")} className={captchaRefreshClassName} onClick={() => setCaptchaIndex((current) => (current + 1) % captchaCodes.length)} type="button" />}><MaterialIcon className="text-lg">refresh</MaterialIcon></IconTooltip>
              </div>
            </AppealRow>
          </div>
        </AppealSection>

        <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="flex flex-wrap gap-3"><Button className="h-10 px-5" type="submit">{t("firstAppeal.submit")}</Button><Button className="h-10 px-5" type="reset" variant="outline">{t("firstAppeal.reset")}</Button></div></section>
      </form>
    </main>
  )
}
