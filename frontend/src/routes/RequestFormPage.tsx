import { forwardRef, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useAuth } from "@/auth/AuthContext"
import { AiRewriteAssistant } from "@/components/AiRewriteAssistant"
import { IconTooltip } from "@/components/IconTooltip"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { indianStates, indianUnionTerritories } from "@/data/indian-states"
import { ministryNames } from "@/data/ministry-names"
import type { RequestFormFocusSection, RequestReviewDraft } from "@/data/request-review"
import { useFormDraft } from "@/hooks/useFormDraft"
import type { RequestAuthority } from "@/request-guidelines/RequestGuidelinesContext"
import { MaterialIcon } from "@/routes/stitch-shell"

const inputClassName = "h-10 w-full rounded-lg border border-input bg-background px-3 text-body-md text-on-surface shadow-sm outline-none transition-colors placeholder:text-on-surface-variant focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"
const labelClassName = "block text-label-lg font-semibold text-on-surface"
// Matches the security check on Payment Reconciliation: a quiet code chip beside the input, with
// the refresh as an outline icon button on the right.
const captchaCodeClassName = "flex h-10 min-w-24 shrink-0 items-center justify-center rounded-lg border border-input bg-muted px-3 font-mono text-sm font-bold tracking-[0.2em] text-primary"
const captchaRefreshClassName = "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-on-surface outline-none transition-all hover:bg-muted focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 active:translate-y-px"

const FormSection = forwardRef<HTMLElement, {
  children: ReactNode
  icon: string
  title: string
}>(function FormSection({ children, icon, title }, ref) {
  return (
    <section className="scroll-mt-24 rounded-xl border border-border bg-card shadow-sm" ref={ref}>
      <div className="flex items-center gap-3 border-b border-border bg-muted/45 px-5 py-3.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><MaterialIcon className="text-[19px]">{icon}</MaterialIcon></span>
        <h2 className="font-headline-md text-headline-md text-primary">{title}</h2>
      </div>
      {children}
    </section>
  )
})

function Required() {
  return <span className="text-error"> *</span>
}

function FormGuidance({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <aside className={`flex gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5 text-sm leading-5 text-on-surface-variant ${className}`}>
      <MaterialIcon className="mt-0.5 shrink-0 text-base text-primary">lightbulb</MaterialIcon>
      <p>{children}</p>
    </aside>
  )
}

type DirectoryAuthority = {
  id: string
  parentId: string
  level: number
  name: string
}

type DirectoryData = {
  authorities: DirectoryAuthority[]
}

type DirectoryOption = {
  id: string
  label: string
  ministryName?: string
}

function ministryFor(authority: DirectoryAuthority, authoritiesById: Map<string, DirectoryAuthority>) {
  let current = authority

  while (current.parentId) {
    if (ministryNames[current.parentId]) return ministryNames[current.parentId]

    const parent = authoritiesById.get(current.parentId)
    if (!parent) break
    current = parent
  }

  return current.name
}

function SearchableDirectorySelect({
  disabled = false,
  id,
  name,
  onOptionSelect,
  options,
  placeholder,
  value,
}: {
  disabled?: boolean
  id: string
  name: string
  onOptionSelect: (option: DirectoryOption) => void
  options: DirectoryOption[]
  placeholder: string
  value: string
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const matchingOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return options

    return options.filter((option) => (
      option.label.toLocaleLowerCase().includes(normalizedQuery) ||
      option.ministryName?.toLocaleLowerCase().includes(normalizedQuery)
    ))
  }, [options, query])
  const visibleOptions = matchingOptions.slice(0, 100)

  return (
    <Select
      disabled={disabled}
      name={name}
      onOpenChange={(open) => { if (!open) setQuery("") }}
      onValueChange={(selectedLabel) => {
        const selectedOption = options.find((option) => option.label === selectedLabel)
        if (selectedOption) onOptionSelect(selectedOption)
      }}
      required
      value={value || null}
    >
      <SelectTrigger className="!w-full !h-10 text-body-md text-on-surface" id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false} className="max-h-72">
        <div className="sticky top-0 z-10 border-b border-border bg-popover p-2">
          <div className="relative">
            <input
              className="h-9 w-full rounded-md border border-input bg-background px-3 pr-9 text-sm text-on-surface outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder={placeholder}
              value={query}
            />
            <MaterialIcon aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-base text-muted-foreground">search</MaterialIcon>
          </div>
        </div>
        {visibleOptions.map((option) => (
          <SelectItem key={option.id} value={option.label}>
            <span className="flex min-w-0 flex-col py-0.5 text-left">
              <span className="truncate font-medium">{option.label}</span>
              {option.ministryName ? <span className="truncate text-xs text-muted-foreground">{option.ministryName}</span> : null}
            </span>
          </SelectItem>
        ))}
        {!visibleOptions.length ? <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t("requestForm.noMatches")}</p> : null}
        {matchingOptions.length > visibleOptions.length ? <p className="px-3 py-2 text-xs text-muted-foreground">{t("requestForm.firstMatches")}</p> : null}
      </SelectContent>
    </Select>
  )
}

/**
 * A one-line title for the history list, taken from the opening of the request. The request text
 * itself is stored alongside it: the portal used to pass the whole 3,000-character body in as the
 * subject, where it was truncated to 120 characters and the rest was lost.
 */
function deriveSubject(requestText: string) {
  const cleaned = requestText.trim().replace(/s+/g, " ")
  const [firstSentence] = cleaned.split(/(?<=[.?])s/)
  const candidate = firstSentence && firstSentence.length <= 120 ? firstSentence : cleaned

  return candidate.length <= 120 ? candidate : `${candidate.slice(0, 117).trimEnd()}…`
}

export function RequestFormPage({
  authority,
  draft,
  focusSection,
}: {
  authority?: RequestAuthority
  draft?: RequestReviewDraft
  focusSection?: RequestFormFocusSection
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const formDraft = useFormDraft("rti-demo-request-draft-v1", { exclude: ["captcha", "supportingDocument"] })
  const [captchaIndex, setCaptchaIndex] = useState(0)
  const [paymentMessage, setPaymentMessage] = useState("")
  const [submissionError, setSubmissionError] = useState("")
  const [isBplApplicant, setIsBplApplicant] = useState(draft?.isBplApplicant ?? formDraft.value("bpl") === "Yes")
  const [directory, setDirectory] = useState<DirectoryData | null>(null)
  const [hasDirectoryError, setHasDirectoryError] = useState(false)
  const [selectedMinistry, setSelectedMinistry] = useState(draft?.ministry ?? formDraft.value("ministry", authority?.ministryName ?? ""))
  const [selectedAuthority, setSelectedAuthority] = useState(draft?.authority ?? formDraft.value("authority", authority?.name ?? ""))
  const [requestText, setRequestText] = useState(draft?.requestText ?? formDraft.value("requestText", ""))
  const [formResetKey, setFormResetKey] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const authoritySectionRef = useRef<HTMLElement>(null)
  const personalSectionRef = useRef<HTMLElement>(null)
  const requestSectionRef = useRef<HTMLElement>(null)
  const captchaCodes = ["915267", "418903", "672154"]
  const captchaCode = captchaCodes[captchaIndex]
  const applicantProfile = user?.profile ?? null
  // Keep only the last ten digits: the profile stores "+91 98765 43210" and the +91 is already
  // rendered as a fixed prefix beside this input, so the country code must not be repeated in it.
  const profileMobile = applicantProfile?.mobile.replace(/\D/g, "").slice(-10)
  const { t } = useTranslation()
  const saveDraft = () => window.requestAnimationFrame(() => formDraft.save(formRef.current))

  useEffect(() => {
    let isCurrent = true

    void fetch("/data/public-authorities.json")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load the directory")
        return response.json() as Promise<DirectoryData>
      })
      .then((data) => { if (isCurrent) setDirectory(data) })
      .catch(() => { if (isCurrent) setHasDirectoryError(true) })

    return () => { isCurrent = false }
  }, [])

  useEffect(() => {
    if (!focusSection) return

    const section = {
      authority: authoritySectionRef.current,
      personal: personalSectionRef.current,
      request: requestSectionRef.current,
    }[focusSection]

    window.requestAnimationFrame(() => section?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }, [focusSection])

  const { authorityOptions, ministryOptions } = useMemo(() => {
    if (!directory) return { authorityOptions: [] as DirectoryOption[], ministryOptions: [] as DirectoryOption[] }

    const authoritiesById = new Map(directory.authorities.map((entry) => [entry.id, entry]))
    const allAuthorityOptions = directory.authorities
      .map((entry) => ({ id: entry.id, label: entry.name, ministryName: ministryFor(entry, authoritiesById) }))
      .sort((left, right) => left.label.localeCompare(right.label))
    const allMinistryOptions = [...new Set(allAuthorityOptions.map((option) => option.ministryName ?? option.label))]
      .sort((left, right) => left.localeCompare(right))
      .map((name) => ({ id: `ministry-${name}`, label: name }))

    return { authorityOptions: allAuthorityOptions, ministryOptions: allMinistryOptions }
  }, [directory])

  const authoritiesForSelectedMinistry = selectedMinistry
    ? authorityOptions.filter((option) => option.ministryName === selectedMinistry)
    : authorityOptions

  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const confirmedEmail = String(formData.get("confirmEmail") ?? "").trim()
    const enteredCaptcha = String(formData.get("captcha") ?? "").trim()

    if (email.toLowerCase() !== confirmedEmail.toLowerCase()) {
      setSubmissionError(t("requestForm.errorEmailMismatch"))
      return
    }

    if (enteredCaptcha !== captchaCode) {
      setSubmissionError(t("requestForm.errorSecurity"))
      return
    }

    const selectedAuthorityOption = authorityOptions.find((option) => (
      option.label === selectedAuthority && option.ministryName === selectedMinistry
    ))

    if (!selectedAuthorityOption) {
      setSubmissionError(t("requestForm.errorAuthority"))
      return
    }

    const submittedText = String(formData.get("requestText") ?? "")
    const value = (name: string) => String(formData.get(name) ?? "").trim()
    const document = formData.get("supportingDocument")
    const requestDraft: RequestReviewDraft = {
      applicantEmail: email,
      applicantName: value("fullName"),
      applicantPhone: `+91 ${value("mobile")}`,
      authority: selectedAuthorityOption.label,
      requestText: submittedText,
      subject: deriveSubject(submittedText),
      ministry: selectedMinistry,
      isBplApplicant,
      citizenship: value("citizenship"),
      applicant: {
        gender: value("request-gender"),
        addressLine1: value("addressLine1"),
        addressLine2: value("addressLine2"),
        addressLine3: value("addressLine3"),
        pincode: value("pincode"),
        country: value("country"),
        state: value("state"),
        areaType: value("request-area"),
        educationalStatus: value("request-education"),
      },
      bpl: isBplApplicant ? {
        cardNumber: value("bplCardNumber"),
        issueYear: value("bplIssueYear"),
        issuingAuthority: value("bplIssuingAuthority"),
        supportingDocumentName: document instanceof File ? document.name : "",
      } : undefined,
    }

    formDraft.clear()
    navigate("/request-review", { state: { draft: requestDraft } })
  }

  const resetRequest = () => {
    formDraft.clear()
    setPaymentMessage("")
    setSubmissionError("")
    setIsBplApplicant(false)
    setSelectedMinistry(authority?.ministryName ?? "")
    setSelectedAuthority(authority?.name ?? "")
    setRequestText("")
    setFormResetKey((current) => current + 1)
  }

  return (
    <form className="mx-auto w-full max-w-5xl space-y-5 px-margin-mobile py-stack-lg md:px-margin-desktop md:py-8" key={formResetKey} onChange={saveDraft} onReset={resetRequest} onSubmit={submitRequest} ref={formRef}>
      <header className="mb-2">
        <h1 className="mb-2 font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">{t("requestForm.title")}</h1>
        <p className="text-body-md text-on-surface-variant">
          {t("requestForm.mandatoryNote", { asterisk: "*" })}
        </p>
        {applicantProfile ? <p className="mt-2 flex items-center gap-2 text-sm text-state-success"><MaterialIcon className="text-lg">check_circle</MaterialIcon>{t("requestForm.profileFilled")}</p> : null}
        {authority ? <p className="mt-2 flex items-center gap-2 text-sm text-state-success"><MaterialIcon className="text-lg">account_balance</MaterialIcon>{t("requestForm.filingTo", { authority: authority.name })}</p> : null}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-on-surface-variant">
          {formDraft.wasRestored ? <span className="flex items-center gap-1.5"><MaterialIcon className="text-base text-state-success">restore</MaterialIcon>{t("formDraft.restored")}</span> : null}
          {formDraft.saveState === "saving" ? <span>{t("formDraft.saving")}</span> : null}
          {formDraft.saveState === "saved" ? <span className="flex items-center gap-1.5"><MaterialIcon className="text-base text-state-success">save</MaterialIcon>{t("formDraft.saved")}</span> : null}
          {formDraft.hasDraft ? <Button className="h-auto px-1.5 py-0.5 text-sm" onClick={resetRequest} type="button" variant="ghost">{t("formDraft.discard")}</Button> : null}
        </div>
      </header>

      <FormSection icon="account_balance" title={t("requestForm.authorityDetails")} ref={authoritySectionRef}>
        <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-ministry">{t("requestForm.ministry")}<Required /></label>
            <SearchableDirectorySelect disabled={!directory} id="request-ministry" name="ministry" onOptionSelect={(option) => { setSelectedMinistry(option.label); setSelectedAuthority(""); saveDraft() }} options={ministryOptions} placeholder={directory ? t("requestForm.searchMinistry") : t("requestForm.loadingDirectory")} value={selectedMinistry} />
          </div>
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-authority">{t("requestForm.selectAuthority")}<Required /></label>
            <SearchableDirectorySelect disabled={!directory} id="request-authority" name="authority" onOptionSelect={(option) => { setSelectedAuthority(option.label); setSelectedMinistry(option.ministryName ?? ""); saveDraft() }} options={authoritiesForSelectedMinistry} placeholder={directory ? t("requestForm.searchAuthority") : t("requestForm.loadingDirectory")} value={selectedAuthority} />
          </div>
          {hasDirectoryError ? <p className="text-sm font-medium text-error md:col-span-2" role="alert">{t("requestForm.directoryError")}</p> : null}
          <FormGuidance className="md:col-span-2">{t("formGuidance.authority")}</FormGuidance>
        </div>
      </FormSection>

      <FormSection icon="person" title={t("requestForm.personalDetails")} ref={personalSectionRef}>
        <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-email">{t("requestForm.email")}<Required /></label>
            <input className={inputClassName} defaultValue={draft?.applicantEmail ?? formDraft.value("email", user?.email)} id="request-email" name="email" placeholder={t("requestForm.enterEmail")} required type="email" />
          </div>
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-mobile">{t("requestForm.mobile")}<Required /></label>
            <div className="flex gap-2">
              <span className="inline-flex h-10 items-center rounded-lg border border-input bg-muted px-3 text-body-md text-on-surface-variant">+91</span>
              <input className={`${inputClassName} flex-1`} defaultValue={draft?.applicantPhone.replace(/\D/g, "").slice(-10) ?? formDraft.value("mobile", profileMobile)} id="request-mobile" maxLength={10} name="mobile" pattern="[0-9]{10}" placeholder={t("requestForm.enterMobile")} required type="tel" />
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-confirm-email">{t("requestForm.confirmEmail")}<Required /></label>
            <input className={inputClassName} defaultValue={draft?.applicantEmail ?? formDraft.value("confirmEmail", user?.email)} id="request-confirm-email" name="confirmEmail" placeholder={t("requestForm.reenterEmail")} required type="email" />
          </div>
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-name">{t("requestForm.name")}<Required /></label>
            <input className={inputClassName} defaultValue={draft?.applicantName ?? formDraft.value("fullName", user?.fullName)} id="request-name" name="fullName" placeholder={t("requestForm.enterName")} required type="text" />
          </div>
          <fieldset className="space-y-1">
            <legend className={labelClassName}>{t("requestForm.gender")}<Required /></legend>
            <div className="flex h-10 flex-wrap items-center gap-x-4 gap-y-1">
              {['Male', 'Female', 'Third Gender'].map((gender) => (
                <label className="inline-flex items-center text-body-md" key={gender}>
                  <input className="size-4 border-outline-variant text-primary focus:ring-primary" defaultChecked={(draft?.applicant.gender ?? formDraft.value("request-gender", applicantProfile?.gender)) === gender} name="request-gender" required type="radio" value={gender} />
                  <span className="ml-2">{t(`requestForm.${gender === "Male" ? "male" : gender === "Female" ? "female" : "thirdGender"}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="space-y-1 md:col-span-2">
            <label className={labelClassName} htmlFor="request-address-line-1">{t("requestForm.address")}<Required /></label>
            <div className="space-y-2">
              <input className={inputClassName} defaultValue={draft?.applicant.addressLine1 ?? formDraft.value("addressLine1", applicantProfile?.address.line1)} id="request-address-line-1" name="addressLine1" placeholder={t("requestForm.line", { number: 1 })} required type="text" />
              <input className={inputClassName} defaultValue={draft?.applicant.addressLine2 ?? formDraft.value("addressLine2", applicantProfile?.address.line2)} name="addressLine2" placeholder={t("requestForm.line", { number: 2 })} type="text" />
              <input className={inputClassName} defaultValue={draft?.applicant.addressLine3 ?? formDraft.value("addressLine3", applicantProfile ? `${applicantProfile.address.city}, ${applicantProfile.address.district}` : undefined)} name="addressLine3" placeholder={t("requestForm.line", { number: 3 })} type="text" />
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-pincode">{t("requestForm.pinCode")}<Required /></label>
            <input className={inputClassName} defaultValue={draft?.applicant.pincode ?? formDraft.value("pincode", applicantProfile?.address.pincode)} id="request-pincode" inputMode="numeric" maxLength={6} name="pincode" pattern="[0-9]{6}" placeholder={t("requestForm.enterPin")} required type="text" />
          </div>
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-country">{t("requestForm.country")}<Required /></label>
            <Select defaultValue={draft?.applicant.country ?? formDraft.value("country", applicantProfile?.country ?? "India")} name="country" onValueChange={saveDraft} required>
              <SelectTrigger className="!w-full !h-10 text-body-md text-on-surface" id="request-country"><SelectValue placeholder={t("requestForm.country")} /></SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}><SelectItem value="India">{t("requestForm.india")}</SelectItem><SelectItem value="Other">{t("requestForm.other")}</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="request-state">{t("requestForm.state")}<Required /></label>
            <Select defaultValue={draft?.applicant.state ?? formDraft.value("state", applicantProfile?.address.state ?? "")} name="state" onValueChange={saveDraft} required>
              <SelectTrigger className="!w-full !h-10 text-body-md text-on-surface" id="request-state"><SelectValue placeholder={t("requestForm.selectState")} /></SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false} className="max-h-72">
                <SelectGroup><SelectLabel>{t("requestForm.statesGroup")}</SelectLabel>{indianStates.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectGroup>
                <SelectGroup><SelectLabel>{t("requestForm.unionTerritoriesGroup")}</SelectLabel>{indianUnionTerritories.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <fieldset className="space-y-1">
            <legend className={labelClassName}>{t("requestForm.areaType")}</legend>
            <div className="flex h-10 items-center gap-4">
              {['Rural', 'Urban'].map((status) => <label className="inline-flex items-center text-body-md" key={status}><input className="size-4 border-outline-variant text-primary focus:ring-primary" defaultChecked={(draft?.applicant.areaType ?? formDraft.value("request-area", applicantProfile?.areaType)) === status} name="request-area" type="radio" value={status} /><span className="ml-2">{t(`requestForm.${status === "Rural" ? "rural" : "urban"}`)}</span></label>)}
            </div>
          </fieldset>
          <fieldset className="space-y-1">
            <legend className={labelClassName}>{t("requestForm.educationalStatus")}</legend>
            <div className="flex h-10 items-center gap-4">
              {['Literate', 'Illiterate'].map((status) => <label className="inline-flex items-center text-body-md" key={status}><input className="size-4 border-outline-variant text-primary focus:ring-primary" defaultChecked={(draft?.applicant.educationalStatus ?? formDraft.value("request-education", applicantProfile?.educationalStatus)) === status} name="request-education" type="radio" value={status} /><span className="ml-2">{t(`requestForm.${status === "Literate" ? "literate" : "illiterate"}`)}</span></label>)}
            </div>
          </fieldset>
        </div>
      </FormSection>

      <FormSection icon="description" title={t("requestForm.requestDetails")} ref={requestSectionRef}>
        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-1">
              <label className={labelClassName} htmlFor="request-citizenship">{t("requestForm.citizenship")}<Required /></label>
              <Select defaultValue={draft?.citizenship ?? formDraft.value("citizenship", applicantProfile?.citizenship ?? "Indian")} name="citizenship" onValueChange={saveDraft} required>
                <SelectTrigger className="!w-full !h-10 text-body-md text-on-surface" id="request-citizenship"><SelectValue placeholder={t("requestForm.citizenship")} /></SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}><SelectItem value="Indian">{t("requestForm.indian")}</SelectItem><SelectItem value="Other">{t("requestForm.other")}</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 border-t border-border pt-5 md:grid-cols-2">
            <div className="space-y-1">
              <label className={labelClassName} htmlFor="request-bpl">{t("requestForm.bplQuestion")}<Required /></label>
              <Select name="bpl" onValueChange={(value) => { setIsBplApplicant(value === "Yes"); saveDraft() }} value={isBplApplicant ? "Yes" : "No"}>
                <SelectTrigger className="!w-full !h-10 text-body-md text-on-surface" id="request-bpl"><SelectValue /></SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}><SelectItem value="No">{t("requestForm.no")}</SelectItem><SelectItem value="Yes">{t("requestForm.yes")}</SelectItem></SelectContent>
              </Select>
              <p className="text-sm leading-5 text-on-surface-variant">{t("formGuidance.bpl")}</p>
            </div>
            <div className={`${isBplApplicant ? "grid" : "hidden"} gap-5 rounded-xl border border-border bg-muted/50 p-4 md:col-span-2 md:grid-cols-2`}>
              <p className="text-label-sm text-error italic md:col-span-2">{t("requestForm.bplProof")}</p>
              <div className="space-y-1"><label className={labelClassName} htmlFor="request-bpl-card">{t("requestForm.bplCard")}<Required /></label><input className={inputClassName} defaultValue={draft?.bpl?.cardNumber ?? formDraft.value("bplCardNumber")} disabled={!isBplApplicant} id="request-bpl-card" name="bplCardNumber" required={isBplApplicant} type="text" /></div>
              <div className="space-y-1"><label className={labelClassName} htmlFor="request-bpl-year">{t("requestForm.issueYear")}<Required /></label><input className={inputClassName} defaultValue={draft?.bpl?.issueYear ?? formDraft.value("bplIssueYear")} disabled={!isBplApplicant} id="request-bpl-year" inputMode="numeric" name="bplIssueYear" required={isBplApplicant} type="text" /></div>
              <div className="space-y-1"><label className={labelClassName} htmlFor="request-bpl-authority">{t("requestForm.issuingAuthority")}<Required /></label><input className={inputClassName} defaultValue={draft?.bpl?.issuingAuthority ?? formDraft.value("bplIssuingAuthority")} disabled={!isBplApplicant} id="request-bpl-authority" name="bplIssuingAuthority" required={isBplApplicant} type="text" /></div>
            </div>
            {isBplApplicant ? <div className="rounded-lg border border-state-success/30 bg-state-success/10 p-4 md:col-span-2"><p className="flex items-center gap-2 text-body-md font-semibold text-on-surface"><MaterialIcon className="text-state-success">verified</MaterialIcon>{t("requestForm.noFeeBpl")}</p></div> : null}
            <div className={`${isBplApplicant ? "hidden" : ""} rounded-lg border border-error-container bg-error-container/20 p-4 md:col-span-2`}>
              <p className="flex items-center gap-2 text-body-md font-semibold text-error"><MaterialIcon>info</MaterialIcon>{t("requestForm.feeRequired")}</p>
            </div>
          </div>
          <div className="space-y-4 border-t border-border pt-5">
            <label className={labelClassName} htmlFor="request-text">{t("requestForm.requestText")}<Required /></label>
            <p className="rounded-lg border border-primary-fixed-dim bg-primary-fixed/30 px-3 py-2 text-label-sm text-surface-tint">{t("requestForm.requestTextNote")}</p>
            <FormGuidance>{t("formGuidance.requestText")}</FormGuidance>
            {/* Above the field, not below it: the textarea is 192px tall at minimum, so anything
                after it fell past the fold and the one control that helps with a blank page went unseen. */}
            <AiRewriteAssistant draft={requestText} maxLength={3000} onUseRewrite={setRequestText} type="request" />
            <textarea className="min-h-48 w-full rounded-lg border border-input bg-background p-3 text-body-md text-on-surface shadow-sm outline-none transition-colors placeholder:text-on-surface-variant focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15" id="request-text" maxLength={3000} name="requestText" onChange={(event) => setRequestText(event.target.value)} placeholder={t("requestForm.requestTextPlaceholder")} required rows={8} value={requestText} />
          </div>
          <div className={`${isBplApplicant ? "block" : "hidden"} space-y-2 border-t border-border pt-5`}>
            <label className={labelClassName} htmlFor="request-document">{t("requestForm.supportingDocument")} <span className="font-normal text-label-sm text-on-surface-variant">({t("requestForm.pdfLimit")})</span><Required /></label>
            <p className="text-label-sm text-error italic">{t("requestForm.bplUpload")}</p>
            {draft?.bpl?.supportingDocumentName ? <p className="text-sm text-on-surface-variant">{draft.bpl.supportingDocumentName}</p> : null}
            {formDraft.wasRestored && !draft?.bpl?.supportingDocumentName ? <p className="text-sm leading-5 text-on-surface-variant">{t("formDraft.attachment")}</p> : null}
            <input accept=".pdf" className="block w-full cursor-pointer rounded-lg border border-input bg-background text-body-md text-on-surface-variant file:mr-4 file:border-0 file:bg-muted file:px-4 file:py-2 file:font-label-lg file:text-primary hover:file:bg-muted/80" disabled={!isBplApplicant} id="request-document" name="supportingDocument" required={isBplApplicant && !draft?.bpl?.supportingDocumentName} type="file" />
          </div>
        </div>
      </FormSection>

      <section className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="max-w-md space-y-2">
          <label className={labelClassName} htmlFor="request-captcha">{t("requestForm.securityCode")}<Required /></label>
          <div className="flex items-center gap-2">
            <input className={`${inputClassName} flex-1`} id="request-captcha" name="captcha" placeholder={t("requestForm.enterCode")} required type="text" />
            <span aria-label={t("requestForm.securityCode")} className={captchaCodeClassName}>{captchaCode}</span>
            <IconTooltip
              label={t("requestForm.refreshSecurity")}
              render={<button aria-label={t("requestForm.refreshSecurity")} className={captchaRefreshClassName} onClick={() => setCaptchaIndex((current) => (current + 1) % captchaCodes.length)} type="button" />}
            >
              <MaterialIcon className="text-lg">refresh</MaterialIcon>
            </IconTooltip>
          </div>
        </div>
        {paymentMessage ? <p className="rounded-md border border-primary-fixed-dim bg-primary-fixed/30 p-3 text-sm font-medium text-primary" role="status">{paymentMessage}</p> : null}
        {submissionError ? <p className="rounded-md border border-error-container bg-error-container/20 p-3 text-sm font-medium text-error" role="alert">{submissionError}</p> : null}
        {!isBplApplicant ? <Link className="flex w-full items-center gap-2 text-sm font-semibold text-surface-tint hover:underline" to="/payment-reconciliation"><MaterialIcon className="text-lg">receipt_long</MaterialIcon>{t("requestForm.paymentHelp")}</Link> : null}
        <div className="flex flex-wrap gap-3 border-t border-border pt-5">
          <Button className={`${isBplApplicant ? "inline-flex" : "hidden"} h-10 px-5`} type="submit"><MaterialIcon className="text-[18px]">fact_check</MaterialIcon>{t("requestReview.reviewRequest")}</Button>
          <Button className={`${isBplApplicant ? "hidden" : "inline-flex"} h-10 px-5`} type="submit"><MaterialIcon className="text-[18px]">fact_check</MaterialIcon>{t("requestReview.reviewRequest")}</Button>
          <Button className="h-10 px-5" type="reset" variant="outline">{t("requestForm.reset")}</Button>
        </div>
      </section>
    </form>
  )
}
