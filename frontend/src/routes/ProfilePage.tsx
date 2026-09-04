import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/auth/AuthContext"
import { indianStatesAndTerritories } from "@/data/indian-states"
import { mockProfile, type ApplicantProfile } from "@/data/mock-profile"
import { useAccountRequests } from "@/requests/RequestContext"
import { countOverdueDeadlines } from "@/services/statutory-deadlines"
import { MaterialIcon } from "@/routes/stitch-shell"

type ApplicantForm = {
  fullName: string
  email: string
  confirmEmail: string
  mobile: string
  gender: string
  address: string
  pincode: string
  country: string
  countryName: string
  state: string
  areaType: string
  educationalStatus: string
  alternatePhone: string
}

type FieldName = keyof ApplicantForm
type FormErrors = Partial<Record<FieldName, string>>

const digitsOnly = (value: string) => value.replace(/\D/g, "").slice(-10)

function createInitialApplicant(source: ApplicantProfile): ApplicantForm {
  return {
    fullName: source.fullName,
    email: source.email,
    confirmEmail: "",
    mobile: digitsOnly(source.mobile),
    gender: source.gender,
    address: source.addressText,
    pincode: source.address.pincode,
    country: source.country,
    countryName: source.countryName,
    state: source.address.state,
    areaType: source.areaType,
    educationalStatus: source.educationalStatus,
    alternatePhone: digitsOnly(source.alternateMobile),
  }
}

function FieldLabel({ children, htmlFor, required, description }: { children: string; htmlFor?: string; required?: boolean; description?: string }) {
  return (
    <div className="mb-2">
      <label className="text-sm font-medium text-foreground" htmlFor={htmlFor}>
        {children}{required ? <span aria-hidden="true" className="ml-1 text-destructive">*</span> : null}
      </label>
      {description ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1.5 text-xs font-medium text-destructive" role="alert">{message}</p> : null
}

function ReadOnlyField({ label, value, description, badge }: { label: string; value: string; description?: string; badge?: ReactNode }) {
  const { t } = useTranslation()

  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm leading-relaxed text-foreground">
        <span className={value.trim() ? undefined : "text-muted-foreground"}>{value.trim() || t("profile.notProvided")}</span>
        {badge}
      </dd>
      {description ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
    </div>
  )
}

function RadioChoices({ name, options, value, onChange }: { name: string; options: string[]; value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation()
  const optionKey: Record<string, string> = { Male: "male", Female: "female", "Third Gender": "thirdGender", Rural: "rural", Urban: "urban", Literate: "literate", Illiterate: "illiterate" }

  return (
    <div aria-label={name} className="flex flex-wrap gap-x-5 gap-y-2" role="radiogroup">
      {options.map((option) => (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground" key={option}>
          <input checked={value === option} className="size-4 accent-primary" name={name} onChange={() => onChange(option)} type="radio" value={option} />
          {t(`requestForm.${optionKey[option] ?? option}`)}
        </label>
      ))}
    </div>
  )
}

function PhoneInput({ id, value, onChange, error, required }: { id: string; value: string; onChange: (value: string) => void; error?: string; required?: boolean }) {
  const { t } = useTranslation()

  return (
    <div>
      <div className="flex">
        <span className="flex h-8 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm font-medium text-muted-foreground">+91</span>
        <Input
          aria-invalid={Boolean(error)}
          className="rounded-l-none"
          id={id}
          inputMode="numeric"
          maxLength={10}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder={t("requestForm.mobile")}
          required={required}
          value={value}
        />
      </div>
      <FieldError message={error} />
    </div>
  )
}

function ProfileCard({ title, description, icon, children }: { title: string; description?: string; icon: string; children: ReactNode }) {
  return (
    <Card className="border border-outline-variant bg-surface-container-lowest shadow-sm">
      <CardHeader className="border-b border-outline-variant/50">
        <CardTitle className="flex items-center gap-2 text-primary">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary-fixed text-primary"><MaterialIcon className="text-lg">{icon}</MaterialIcon></span>
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const requests = useAccountRequests()
  const accountProfile = user?.profile ?? mockProfile
  const [profile, setProfile] = useState<ApplicantForm>(() => createInitialApplicant(accountProfile))
  const [draft, setDraft] = useState<ApplicantForm>(() => createInitialApplicant(accountProfile))
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [didSave, setDidSave] = useState(false)
  const [stateSearch, setStateSearch] = useState("")
  const { t } = useTranslation()

  useEffect(() => {
    if (isEditing) return
    const next = createInitialApplicant(accountProfile)
    setProfile(next)
    setDraft(next)
  }, [accountProfile, isEditing])

  const updateField = (field: FieldName, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[field]
      if (field === "email" || field === "confirmEmail") delete next.confirmEmail
      return next
    })
  }

  const startEditing = () => {
    setDraft({ ...profile, confirmEmail: profile.email })
    setErrors({})
    setDidSave(false)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setDraft({ ...profile, confirmEmail: "" })
    setErrors({})
    setIsEditing(false)
  }

  const validate = (values: ApplicantForm): FormErrors => {
    const nextErrors: FormErrors = {}
    if (values.fullName.trim().length < 2) nextErrors.fullName = "Please enter your full name."
    if (!/^\S+@\S+\.\S+$/.test(values.email)) nextErrors.email = "Please enter a valid email address."
    if (values.confirmEmail !== values.email) nextErrors.confirmEmail = "Email addresses do not match."
    if (!/^\d{10}$/.test(values.mobile)) nextErrors.mobile = "Please enter a valid 10-digit mobile number."
    if (!values.gender) nextErrors.gender = "Please select your gender."
    if (values.address.trim().length < 10) nextErrors.address = "Please enter your complete residential address."
    if (!/^\d{6}$/.test(values.pincode)) nextErrors.pincode = "PIN code must contain exactly 6 digits."
    if (!values.country) nextErrors.country = "Please select your country."
    if (values.country === "India" && !values.state) nextErrors.state = "Please select your state or Union Territory."
    if (values.country === "Other" && values.countryName.trim().length < 2) nextErrors.countryName = "Please enter your country name."
    if (!values.areaType) nextErrors.areaType = "Please select your area type."
    if (values.alternatePhone && !/^\d{10}$/.test(values.alternatePhone)) nextErrors.alternatePhone = "Please enter a valid 10-digit phone number."
    return nextErrors
  }

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const savedForm = {
      ...draft,
      fullName: draft.fullName.trim(),
      email: draft.email.trim(),
      address: draft.address.trim(),
      countryName: draft.countryName.trim(),
      confirmEmail: "",
    }
    const nameParts = savedForm.fullName.split(/\s+/)
    const nextProfile: ApplicantProfile = {
      ...accountProfile,
      initials: nameParts.map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
      fullName: savedForm.fullName,
      email: savedForm.email,
      mobile: `+91 ${savedForm.mobile}`,
      alternateMobile: savedForm.alternatePhone ? `+91 ${savedForm.alternatePhone}` : "",
      gender: savedForm.gender,
      country: savedForm.country,
      countryName: savedForm.countryName,
      areaType: savedForm.areaType,
      educationalStatus: savedForm.educationalStatus,
      addressText: savedForm.address,
      address: {
        ...accountProfile.address,
        line1: savedForm.address,
        line2: "",
        city: "",
        district: "",
        state: savedForm.state,
        pincode: savedForm.pincode,
      },
    }
    const saveError = await updateProfile(nextProfile)
    if (saveError) {
      setErrors({ email: "We could not save your profile. Please try again." })
      return
    }

    setProfile(savedForm)
    setDraft(savedForm)
    setIsEditing(false)
    setDidSave(true)
  }

  const profileName = profile.fullName || accountProfile.fullName
  const initials = profileName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()
  const filteredStates = indianStatesAndTerritories.filter((state) => state.toLowerCase().includes(stateSearch.toLowerCase()))
  const requestMetrics = [
    { label: t("history.totalRequests"), value: String(requests.length), icon: "description" },
    { label: t("history.pending"), value: String(requests.filter((request) => request.status === "Processing" || request.status === "Pending Verification").length), icon: "hourglass_top" },
    { label: t("history.replies"), value: String(requests.filter((request) => request.status === "Reply received" || request.status === "Satisfied").length), icon: "mark_email_read" },
    { label: t("history.appeals"), value: String(requests.filter((request) => request.status.includes("Appeal")).length), icon: "gavel" },
    { label: t("deadline.lapsedMetric"), value: String(countOverdueDeadlines({ requests, today: new Date() })), icon: "event_busy" },
  ]

  return (
    <div className="mx-auto flex w-full max-w-container-max flex-col gap-6 px-margin-mobile py-8 md:px-margin-desktop md:py-10">
      <header className="flex flex-col justify-between gap-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm sm:flex-row sm:items-center md:p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-on-primary">{initials}</div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-headline-lg text-2xl text-primary">{profileName}</h1>
              <Badge className="border-state-success/20 bg-state-success/10 text-state-success" variant="outline">{accountProfile.account.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-on-surface-variant">{t("profile.subtitle")}</p>
            <p className="mt-2 text-xs text-on-surface-variant">Citizen ID: {accountProfile.id} · @{accountProfile.username}</p>
          </div>
        </div>
        {!isEditing ? (
          <Button onClick={startEditing} size="lg" type="button"><MaterialIcon>edit</MaterialIcon>{t("profile.edit")}</Button>
        ) : (
          <Badge className="self-start bg-primary-fixed text-primary sm:self-auto" variant="outline">{t("profile.editing")}</Badge>
        )}
      </header>

      {didSave ? (
        <div className="flex items-center gap-2 rounded-lg border border-state-success/25 bg-state-success/10 px-4 py-3 text-sm text-state-success" role="status">
          <MaterialIcon className="text-lg">check_circle</MaterialIcon>
          {t("profile.updated")}
        </div>
      ) : null}

      <section aria-label="RTI activity overview" className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {requestMetrics.map((metric) => (
          <Card className="border border-outline-variant bg-surface-container-lowest py-4 shadow-sm" key={metric.label}>
            <CardContent>
              <div className="flex items-center justify-between"><span className="text-sm text-on-surface-variant">{metric.label}</span><MaterialIcon className="text-primary">{metric.icon}</MaterialIcon></div>
              <p className="mt-3 text-3xl font-bold text-primary">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {isEditing ? (
        <form className="flex flex-col gap-6" noValidate onSubmit={saveProfile}>
          <ProfileCard description={t("profile.descriptions.core")} icon="person" title={t("profile.basic")}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="full-name" required>{t("requestForm.name")}</FieldLabel>
                <Input aria-invalid={Boolean(errors.fullName)} id="full-name" onChange={(event) => updateField("fullName", event.target.value)} placeholder="Enter your full name" required value={draft.fullName} />
                <FieldError message={errors.fullName} />
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">{t("requestForm.gender")} <span aria-hidden="true" className="text-destructive">*</span></legend>
                <RadioChoices name="gender" onChange={(value) => updateField("gender", value)} options={["Male", "Female", "Third Gender"]} value={draft.gender} />
                <FieldError message={errors.gender} />
              </fieldset>
              <div>
                <FieldLabel htmlFor="email" required>{t("status.emailAddress")}</FieldLabel>
                <Input aria-invalid={Boolean(errors.email)} id="email" onChange={(event) => updateField("email", event.target.value)} placeholder="user@domain.com" required type="email" value={draft.email} />
                <FieldError message={errors.email} />
              </div>
              <div>
                <FieldLabel htmlFor="confirm-email" required>{t("requestForm.confirmEmail")}</FieldLabel>
                <Input aria-invalid={Boolean(errors.confirmEmail)} id="confirm-email" onChange={(event) => updateField("confirmEmail", event.target.value)} placeholder="user@domain.com" required type="email" value={draft.confirmEmail} />
                <FieldError message={errors.confirmEmail} />
              </div>
              <div>
                <FieldLabel description={t("firstAppeal.smsHint")} htmlFor="mobile" required>{t("requestForm.mobile")}</FieldLabel>
                <PhoneInput error={errors.mobile} id="mobile" onChange={(value) => updateField("mobile", value)} required value={draft.mobile} />
              </div>
            </div>
          </ProfileCard>

          <ProfileCard description={t("profile.descriptions.address")} icon="home" title={t("profile.address")}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldLabel htmlFor="address" required>{t("requestForm.address")}</FieldLabel>
                <Textarea aria-invalid={Boolean(errors.address)} id="address" onChange={(event) => updateField("address", event.target.value)} placeholder="House / Flat No., Street, Locality, City" required rows={3} value={draft.address} />
                <FieldError message={errors.address} />
              </div>
              <div>
                <FieldLabel htmlFor="pincode" required>{t("requestForm.pinCode")}</FieldLabel>
                <Input aria-invalid={Boolean(errors.pincode)} id="pincode" inputMode="numeric" maxLength={6} onChange={(event) => updateField("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="673601" required value={draft.pincode} />
                <FieldError message={errors.pincode} />
              </div>
              <div>
                <FieldLabel required>{t("requestForm.country")}</FieldLabel>
                <Select onValueChange={(value) => updateField("country", value ?? "India")} value={draft.country}>
                  <SelectTrigger aria-invalid={Boolean(errors.country)} className="w-full"><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent><SelectItem value="India">India</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                </Select>
                <FieldError message={errors.country} />
              </div>
              {draft.country === "Other" ? (
                <div>
                  <FieldLabel htmlFor="country-name" required>{t("profile.countryName")}</FieldLabel>
                  <Input aria-invalid={Boolean(errors.countryName)} id="country-name" onChange={(event) => updateField("countryName", event.target.value)} placeholder="Enter country name" required value={draft.countryName} />
                  <FieldError message={errors.countryName} />
                </div>
              ) : (
                <div>
                  <FieldLabel required>{t("requestForm.state")}</FieldLabel>
                  <Select onValueChange={(value) => { updateField("state", value ?? ""); setStateSearch("") }} value={draft.state}>
                    <SelectTrigger aria-invalid={Boolean(errors.state)} className="w-full"><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      <div className="sticky top-0 z-10 bg-popover p-1">
                        <Input aria-label="Search state or Union Territory" className="h-8" onChange={(event) => setStateSearch(event.target.value)} onKeyDown={(event) => event.stopPropagation()} placeholder="Search state" value={stateSearch} />
                      </div>
                      {filteredStates.length ? filteredStates.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>) : <p className="px-2 py-2 text-sm text-muted-foreground">No state found.</p>}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.state} />
                </div>
              )}
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">{t("requestForm.areaType")} <span aria-hidden="true" className="text-destructive">*</span></legend>
                <RadioChoices name="area-type" onChange={(value) => updateField("areaType", value)} options={["Rural", "Urban"]} value={draft.areaType} />
                <FieldError message={errors.areaType} />
              </fieldset>
            </div>
          </ProfileCard>

          <ProfileCard description={t("profile.descriptions.additional")} icon="contact_phone" title={t("profile.additional")}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">{t("requestForm.educationalStatus")}</legend>
                <RadioChoices name="educational-status" onChange={(value) => updateField("educationalStatus", value)} options={["Literate", "Illiterate"]} value={draft.educationalStatus} />
              </fieldset>
              <div>
                <FieldLabel htmlFor="alternate-phone">{t("profile.alternatePhone")}</FieldLabel>
                <PhoneInput error={errors.alternatePhone} id="alternate-phone" onChange={(value) => updateField("alternatePhone", value)} value={draft.alternatePhone} />
              </div>
            </div>
          </ProfileCard>

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-outline-variant pt-6 sm:flex-row">
            <Button onClick={cancelEditing} size="lg" type="button" variant="outline">{t("common.cancel")}</Button>
            <Button size="lg" type="submit"><MaterialIcon>save</MaterialIcon>{t("profile.save")}</Button>
          </div>
        </form>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <ProfileCard description={t("profile.descriptions.core")} icon="person" title={t("profile.basic")}>
              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <ReadOnlyField label={t("requestForm.name")} value={profile.fullName} />
                <ReadOnlyField label={t("requestForm.gender")} value={profile.gender} />
                <ReadOnlyField badge={<Badge className="border-state-success/20 bg-state-success/10 text-state-success" variant="outline">{t("profile.verified")}</Badge>} label={t("status.emailAddress")} value={profile.email} />
                <ReadOnlyField description={t("firstAppeal.smsHint")} label={t("requestForm.mobile")} value={`+91 ${profile.mobile}`} />
              </dl>
            </ProfileCard>

            <ProfileCard description={t("profile.descriptions.address")} icon="home" title={t("profile.address")}>
              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <div className="sm:col-span-2"><ReadOnlyField label={t("requestForm.address")} value={profile.address} /></div>
                <ReadOnlyField label={t("requestForm.pinCode")} value={profile.pincode} />
                <ReadOnlyField label={t("requestForm.country")} value={profile.country === "Other" ? profile.countryName : profile.country} />
                <ReadOnlyField label={t("requestForm.state")} value={profile.country === "India" ? profile.state : t("profile.notApplicable")} />
                <ReadOnlyField label={t("requestForm.areaType")} value={profile.areaType} />
              </dl>
            </ProfileCard>

            <ProfileCard description={t("profile.descriptions.additional")} icon="contact_phone" title={t("profile.additional")}>
              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <ReadOnlyField label={t("requestForm.educationalStatus")} value={profile.educationalStatus} />
                <ReadOnlyField label={t("profile.alternatePhone")} value={profile.alternatePhone ? `+91 ${profile.alternatePhone}` : t("profile.notProvided")} />
              </dl>
            </ProfileCard>

            <ProfileCard description={t("profile.descriptions.account")} icon="manage_accounts" title={t("profile.account")}>
              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <ReadOnlyField label="Citizen ID" value={accountProfile.id} />
                <ReadOnlyField label="Username" value={`@${accountProfile.username}`} />
                <ReadOnlyField label="Member Since" value={accountProfile.account.memberSince} />
                <ReadOnlyField label="Last Sign In" value={accountProfile.account.lastLogin} />
              </dl>
            </ProfileCard>
          </section>
        </>
      )}

      <Separator />
      <p className="pb-2 text-center text-xs text-muted-foreground">Your details are used only to process and communicate about RTI applications.</p>
    </div>
  )
}
