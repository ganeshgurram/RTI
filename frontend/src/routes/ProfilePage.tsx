import { useState, type FormEvent, type ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/auth/AuthContext"
import { mockProfile } from "@/data/mock-profile"
import { useRequests } from "@/requests/RequestContext"
import { MaterialIcon } from "@/routes/stitch-shell"

const indianStatesAndTerritories = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
]

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

function createInitialApplicant(source: typeof mockProfile): ApplicantForm {
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
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm leading-relaxed text-foreground">
        <span>{value}</span>
        {badge}
      </dd>
      {description ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
    </div>
  )
}

function RadioChoices({ name, options, value, onChange }: { name: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div aria-label={name} className="flex flex-wrap gap-x-5 gap-y-2" role="radiogroup">
      {options.map((option) => (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground" key={option}>
          <input checked={value === option} className="size-4 accent-primary" name={name} onChange={() => onChange(option)} type="radio" value={option} />
          {option}
        </label>
      ))}
    </div>
  )
}

function PhoneInput({ id, value, onChange, error, required }: { id: string; value: string; onChange: (value: string) => void; error?: string; required?: boolean }) {
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
          placeholder="Mobile Number"
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
  const { user } = useAuth()
  const { requests } = useRequests()
  const accountProfile = user?.profile ?? mockProfile
  const [profile, setProfile] = useState<ApplicantForm>(() => createInitialApplicant(accountProfile))
  const [draft, setDraft] = useState<ApplicantForm>(() => createInitialApplicant(accountProfile))
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [didSave, setDidSave] = useState(false)
  const [stateSearch, setStateSearch] = useState("")

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

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setProfile({
      ...draft,
      fullName: draft.fullName.trim(),
      email: draft.email.trim(),
      address: draft.address.trim(),
      countryName: draft.countryName.trim(),
      confirmEmail: "",
    })
    setIsEditing(false)
    setDidSave(true)
  }

  const profileName = profile.fullName || accountProfile.fullName
  const initials = profileName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()
  const filteredStates = indianStatesAndTerritories.filter((state) => state.toLowerCase().includes(stateSearch.toLowerCase()))
  const requestMetrics = [
    { label: "Total requests", value: String(requests.length), icon: "description" },
    { label: "Pending", value: String(requests.filter((request) => request.status === "Processing" || request.status === "Pending Verification").length), icon: "hourglass_top" },
    { label: "Replies received", value: String(requests.filter((request) => request.status === "Reply received" || request.status === "Satisfied").length), icon: "mark_email_read" },
    { label: "Appeals", value: String(requests.filter((request) => request.status.includes("Appeal")).length), icon: "gavel" },
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
            <p className="mt-1 text-sm text-on-surface-variant">Applicant Profile · Personal and contact details used for RTI applications</p>
            <p className="mt-2 text-xs text-on-surface-variant">Citizen ID: {accountProfile.id} · @{accountProfile.username}</p>
          </div>
        </div>
        {!isEditing ? (
          <Button onClick={startEditing} size="lg" type="button"><MaterialIcon>edit</MaterialIcon>Edit Profile</Button>
        ) : (
          <Badge className="self-start bg-primary-fixed text-primary sm:self-auto" variant="outline">Editing profile</Badge>
        )}
      </header>

      {didSave ? (
        <div className="flex items-center gap-2 rounded-lg border border-state-success/25 bg-state-success/10 px-4 py-3 text-sm text-state-success" role="status">
          <MaterialIcon className="text-lg">check_circle</MaterialIcon>
          Your applicant profile has been updated for this demo.
        </div>
      ) : null}

      <section aria-label="RTI activity overview" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          <ProfileCard description="Your core details for RTI communications." icon="person" title="Basic Information">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="full-name" required>Full Name</FieldLabel>
                <Input aria-invalid={Boolean(errors.fullName)} id="full-name" onChange={(event) => updateField("fullName", event.target.value)} placeholder="Enter your full name" required value={draft.fullName} />
                <FieldError message={errors.fullName} />
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">Gender <span aria-hidden="true" className="text-destructive">*</span></legend>
                <RadioChoices name="gender" onChange={(value) => updateField("gender", value)} options={["Male", "Female", "Third Gender"]} value={draft.gender} />
                <FieldError message={errors.gender} />
              </fieldset>
              <div>
                <FieldLabel htmlFor="email" required>Email Address</FieldLabel>
                <Input aria-invalid={Boolean(errors.email)} id="email" onChange={(event) => updateField("email", event.target.value)} placeholder="user@domain.com" required type="email" value={draft.email} />
                <FieldError message={errors.email} />
              </div>
              <div>
                <FieldLabel htmlFor="confirm-email" required>Confirm Email Address</FieldLabel>
                <Input aria-invalid={Boolean(errors.confirmEmail)} id="confirm-email" onChange={(event) => updateField("confirmEmail", event.target.value)} placeholder="user@domain.com" required type="email" value={draft.confirmEmail} />
                <FieldError message={errors.confirmEmail} />
              </div>
              <div>
                <FieldLabel description="Used for SMS alerts and application notifications" htmlFor="mobile" required>Mobile Number</FieldLabel>
                <PhoneInput error={errors.mobile} id="mobile" onChange={(value) => updateField("mobile", value)} required value={draft.mobile} />
              </div>
            </div>
          </ProfileCard>

          <ProfileCard description="Your residential and postal address for RTI applications." icon="home" title="Address Details">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldLabel htmlFor="address" required>Address</FieldLabel>
                <Textarea aria-invalid={Boolean(errors.address)} id="address" onChange={(event) => updateField("address", event.target.value)} placeholder="House / Flat No., Street, Locality, City" required rows={3} value={draft.address} />
                <FieldError message={errors.address} />
              </div>
              <div>
                <FieldLabel htmlFor="pincode" required>PIN Code</FieldLabel>
                <Input aria-invalid={Boolean(errors.pincode)} id="pincode" inputMode="numeric" maxLength={6} onChange={(event) => updateField("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="673601" required value={draft.pincode} />
                <FieldError message={errors.pincode} />
              </div>
              <div>
                <FieldLabel required>Country</FieldLabel>
                <Select onValueChange={(value) => updateField("country", value ?? "India")} value={draft.country}>
                  <SelectTrigger aria-invalid={Boolean(errors.country)} className="w-full"><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent><SelectItem value="India">India</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                </Select>
                <FieldError message={errors.country} />
              </div>
              {draft.country === "Other" ? (
                <div>
                  <FieldLabel htmlFor="country-name" required>Country Name</FieldLabel>
                  <Input aria-invalid={Boolean(errors.countryName)} id="country-name" onChange={(event) => updateField("countryName", event.target.value)} placeholder="Enter country name" required value={draft.countryName} />
                  <FieldError message={errors.countryName} />
                </div>
              ) : (
                <div>
                  <FieldLabel required>State / Union Territory</FieldLabel>
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
                <legend className="mb-2 text-sm font-medium text-foreground">Area Type <span aria-hidden="true" className="text-destructive">*</span></legend>
                <RadioChoices name="area-type" onChange={(value) => updateField("areaType", value)} options={["Rural", "Urban"]} value={draft.areaType} />
                <FieldError message={errors.areaType} />
              </fieldset>
            </div>
          </ProfileCard>

          <ProfileCard description="Optional details that help us contact you." icon="contact_phone" title="Additional Information">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">Educational Status</legend>
                <RadioChoices name="educational-status" onChange={(value) => updateField("educationalStatus", value)} options={["Literate", "Illiterate"]} value={draft.educationalStatus} />
              </fieldset>
              <div>
                <FieldLabel htmlFor="alternate-phone">Alternate Phone Number</FieldLabel>
                <PhoneInput error={errors.alternatePhone} id="alternate-phone" onChange={(value) => updateField("alternatePhone", value)} value={draft.alternatePhone} />
              </div>
            </div>
          </ProfileCard>

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-outline-variant pt-6 sm:flex-row">
            <Button onClick={cancelEditing} size="lg" type="button" variant="outline">Cancel</Button>
            <Button size="lg" type="submit"><MaterialIcon>save</MaterialIcon>Save Changes</Button>
          </div>
        </form>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <ProfileCard description="Primary details used to identify your RTI applications." icon="person" title="Basic Information">
              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <ReadOnlyField label="Full Name" value={profile.fullName} />
                <ReadOnlyField label="Gender" value={profile.gender} />
                <ReadOnlyField badge={<Badge className="border-state-success/20 bg-state-success/10 text-state-success" variant="outline">Verified</Badge>} label="Email Address" value={profile.email} />
                <ReadOnlyField description="Used for SMS alerts and application notifications" label="Mobile Number" value={`+91 ${profile.mobile}`} />
              </dl>
            </ProfileCard>

            <ProfileCard description="Your residential and postal address for RTI applications." icon="home" title="Address Details">
              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <div className="sm:col-span-2"><ReadOnlyField label="Address" value={profile.address} /></div>
                <ReadOnlyField label="PIN Code" value={profile.pincode} />
                <ReadOnlyField label="Country" value={profile.country === "Other" ? profile.countryName : profile.country} />
                <ReadOnlyField label="State / Union Territory" value={profile.country === "India" ? profile.state : "Not applicable"} />
                <ReadOnlyField label="Area Type" value={profile.areaType} />
              </dl>
            </ProfileCard>

            <ProfileCard description="Additional contact and educational details." icon="contact_phone" title="Additional Information">
              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <ReadOnlyField label="Educational Status" value={profile.educationalStatus} />
                <ReadOnlyField label="Alternate Phone Number" value={profile.alternatePhone ? `+91 ${profile.alternatePhone}` : "Not provided"} />
              </dl>
            </ProfileCard>

            <ProfileCard description="Your secure access details for this RTI portal." icon="manage_accounts" title="Account Details">
              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <ReadOnlyField label="Citizen ID" value={accountProfile.id} />
                <ReadOnlyField label="Username" value={`@${accountProfile.username}`} />
                <ReadOnlyField label="Member Since" value={accountProfile.account.memberSince} />
                <ReadOnlyField label="Last Sign In" value={accountProfile.account.lastLogin} />
              </dl>
            </ProfileCard>
          </section>

          {/* Request history has its own page, available from the profile menu.
          <section>
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-headline-lg text-xl text-primary">RTI Request History</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Your latest applications, appeal status, and next action.</p>
              </div>
              <Button size="lg" type="button" variant="outline"><MaterialIcon>download</MaterialIcon>Download Report</Button>
            </div>
            <Card className="border border-outline-variant bg-surface-container-lowest shadow-sm">
              <div className="flex flex-col gap-3 border-b border-outline-variant/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full sm:max-w-sm">
                  <label className="sr-only" htmlFor="request-search">Search request history</label>
                  <Input id="request-search" onChange={(event) => { setRequestSearch(event.target.value); setRequestPage(1) }} placeholder="Search by request ID, subject, or authority" value={requestSearch} />
                </div>
                <div className="w-full sm:w-48">
                  <label className="sr-only" htmlFor="request-status">Filter by status</label>
                  <Select onValueChange={(value) => { setRequestStatus(value ?? "all"); setRequestPage(1) }} value={requestStatus}>
                    <SelectTrigger aria-label="Filter requests by status" className="w-full" id="request-status"><SelectValue placeholder="All statuses" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {requestStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                      <th className="px-5 py-4 font-semibold">Request ID</th>
                      <th className="px-5 py-4 font-semibold">Subject / Authority</th>
                      <th className="px-5 py-4 font-semibold">Submitted</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 font-semibold">Next Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/50 text-sm text-on-surface">
                    {visibleRequests.map((request) => (
                      <tr className="transition-colors hover:bg-surface-container/30" key={request.id}>
                        <td className="px-5 py-4 font-semibold text-primary">{request.id}</td>
                        <td className="max-w-[300px] px-5 py-4"><p className="font-medium">{request.subject}</p><p className="mt-1 text-xs text-on-surface-variant">{request.authority}</p></td>
                        <td className="px-5 py-4 text-on-surface-variant"><p>{request.submittedOn}</p><p className="mt-1 text-xs">Updated {request.lastUpdated}</p></td>
                        <td className="px-5 py-4"><span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${request.statusClass}`}>{request.status}</span></td>
                        <td className="px-5 py-4 text-on-surface-variant">{request.nextAction}</td>
                      </tr>
                    ))}
                    {!visibleRequests.length ? <tr><td className="px-5 py-10 text-center text-sm text-on-surface-variant" colSpan={5}>No RTI requests match your filters.</td></tr> : null}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t border-outline-variant/50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-on-surface-variant">Showing {firstVisibleRequest}–{lastVisibleRequest} of {filteredRequests.length} request{filteredRequests.length === 1 ? "" : "s"}</p>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <p className="text-xs text-on-surface-variant">Page {activeRequestPage} of {requestPageCount}</p>
                  <div className="flex gap-2">
                    <Button disabled={activeRequestPage === 1} onClick={() => setRequestPage((page) => Math.max(1, page - 1))} size="sm" type="button" variant="outline"><MaterialIcon>chevron_left</MaterialIcon>Previous</Button>
                    <Button disabled={activeRequestPage === requestPageCount} onClick={() => setRequestPage((page) => Math.min(requestPageCount, page + 1))} size="sm" type="button" variant="outline">Next<MaterialIcon>chevron_right</MaterialIcon></Button>
                  </div>
                </div>
              </div>
            </Card>
          </section>
          */}
        </>
      )}

      <Separator />
      <p className="pb-2 text-center text-xs text-muted-foreground">Your details are used only to process and communicate about RTI applications.</p>
    </div>
  )
}
