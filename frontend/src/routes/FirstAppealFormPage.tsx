import { type FormEvent, type ReactNode, useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "@/auth/AuthContext"
import { useRequests } from "@/requests/RequestContext"
import { MaterialIcon } from "@/routes/stitch-shell"

const fieldClassName = "w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface shadow-sm outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant"
const labelClassName = "text-label-lg font-semibold text-on-surface"
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

function formatAppealDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date)
}

export function FirstAppealFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { requests } = useRequests()
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
  const appellantLandline = appellantProfile?.alternateMobile.replace(/\D/g, "").slice(-10) ?? ""

  const submitAppeal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const now = new Date()

    navigate("/appeal-submission-success", {
      state: {
        appeal: {
          registrationNumber: `RTI-A-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`,
          name: request.applicantName,
          date: formatAppealDate(now),
          authority: request.authority,
          phone: `+91 ${String(formData.get("mobile") ?? "").trim()}`,
          email: String(formData.get("email") ?? "").trim(),
          againstRequestId: request.id,
        },
      },
    })
  }

  return (
    <main className="mx-auto w-full max-w-container-max px-margin-mobile py-8 md:px-margin-desktop">
      <header className="mb-8">
        <h1 className="mb-2 font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">Online RTI First Appeal Form</h1>
        <p className="flex items-center gap-1 text-body-md text-on-surface-variant"><MaterialIcon className="text-sm text-error">info</MaterialIcon>Note: Fields marked with * are Mandatory.</p>
        <p className="mt-2 flex items-center gap-2 text-sm text-state-success"><MaterialIcon className="text-lg">gavel</MaterialIcon>Appealing against {request.id} — {request.subject}.</p>
      </header>

      <form className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm" onSubmit={submitAppeal}>
        <AppealSection title="Public Authority Details">
          <AppealRow label="Select Ministry/Department/Apex body" required>
            <div className="flex items-center gap-2"><select className={fieldClassName} defaultValue={request.authority} disabled><option>{request.authority}</option></select><HelpIcon title="The authority the original request was filed with" /></div>
          </AppealRow>
        </AppealSection>

        <AppealSection title="Personal Details of Appellant">
          <AppealRow label="Request Registration Number" required>
            <div className="flex items-center gap-2"><input className={`${fieldClassName} md:w-2/3`} defaultValue={request.id} readOnly type="text" /><HelpIcon title="Registration Number of the original request" /></div>
          </AppealRow>
          <AppealRow label="Request Registration Date" required>
            <div className="flex items-center gap-2"><input className={`${fieldClassName} md:w-1/3`} defaultValue={request.submittedOn} readOnly type="text" /><HelpIcon title="Date when original request was filed" /></div>
          </AppealRow>
          <AppealRow label="Name"><input className={`${fieldClassName} md:w-2/3`} defaultValue={request.applicantName} readOnly type="text" /></AppealRow>
          <AppealRow label="Gender">
            <div className="flex flex-wrap gap-4">
              {['Male', 'Female', 'Third gender'].map((option) => <label className="flex items-center gap-2 text-body-md" key={option}><input defaultChecked={(appellantProfile?.gender ?? "Male") === option} name="appeal-gender" type="radio" value={option} />{option}</label>)}
            </div>
          </AppealRow>
          <AppealRow label="Address" required>
            <div className="space-y-2"><div className="flex items-center gap-2"><input className={fieldClassName} defaultValue={appellantProfile?.address.line1 ?? ""} type="text" /><HelpIcon title="Address line 1" /></div><input className={fieldClassName} defaultValue={appellantProfile?.address.line2 ?? ""} type="text" /><input className={fieldClassName} defaultValue={appellantProfile ? `${appellantProfile.address.city}, ${appellantProfile.address.district}` : ""} type="text" /></div>
          </AppealRow>
          <AppealRow label="Pincode"><div className="flex items-center gap-2"><input className={`${fieldClassName} md:w-1/3`} defaultValue={appellantProfile?.address.pincode ?? ""} inputMode="numeric" type="text" /><HelpIcon title="Postal code" /></div></AppealRow>
          <AppealRow label="Country"><div className="flex gap-4">{['India', 'Other'].map((option) => <label className="flex items-center gap-2 text-body-md" key={option}><input defaultChecked={(appellantProfile?.country ?? "India") === option} name="appeal-country" type="radio" value={option} />{option}</label>)}</div></AppealRow>
          <AppealRow label="State"><select className={`${fieldClassName} md:w-1/3`} defaultValue={appellantProfile?.address.state ?? ""}><option disabled value="">Select State</option>{stateOptions.map((option) => <option key={option}>{option}</option>)}</select></AppealRow>
          <AppealRow label="Status"><div className="flex gap-4">{['Rural', 'Urban'].map((option) => <label className="flex items-center gap-2 text-body-md" key={option}><input defaultChecked={(appellantProfile?.areaType ?? "Urban") === option} name="appeal-area" type="radio" value={option} />{option}</label>)}</div></AppealRow>
          <AppealRow label="Educational Status"><div className="flex gap-4">{['Literate', 'Illiterate'].map((option) => <label className="flex items-center gap-2 text-body-md" key={option}><input defaultChecked={(appellantProfile?.educationalStatus ?? "Literate") === option} name="appeal-education" type="radio" value={option} />{option}</label>)}</div></AppealRow>
          <AppealRow label="Phone Number"><div className="flex items-center gap-2"><div className="flex w-full md:w-2/3"><input className="w-16 rounded-l border border-r-0 border-outline-variant bg-surface-container-lowest px-3 py-2 text-center text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" defaultValue="+91" type="text" /><input className="flex-grow rounded-r border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" defaultValue={appellantLandline} type="tel" /></div><HelpIcon title="Landline number" /></div></AppealRow>
          <AppealRow hint="(For receiving SMS alerts)" label="Mobile Number"><div className="flex items-center gap-2"><div className="flex w-full md:w-2/3"><input className="w-16 rounded-l border border-r-0 border-outline-variant bg-surface-container-lowest px-3 py-2 text-center text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" defaultValue="+91" type="text" /><input className="flex-grow rounded-r border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" defaultValue={appellantMobile} name="mobile" type="tel" /></div><HelpIcon title="Mobile number" /></div></AppealRow>
          <AppealRow label="Email-Id" required><div className="flex items-center gap-2"><input className={`${fieldClassName} md:w-2/3`} defaultValue={request.applicantEmail} name="email" type="email" /><HelpIcon title="Email address" /></div></AppealRow>
        </AppealSection>

        <AppealSection title="Appeal Details">
          <AppealRow hint="(Only Indian citizens can file RTI Request application)" label="Citizenship"><select className={`${fieldClassName} md:w-1/3`} defaultValue="Indian" disabled><option>Indian</option></select></AppealRow>
          <AppealRow label="Is the Applicant Below Poverty Line ?" required><select className={`${fieldClassName} md:w-1/3`} defaultValue="No"><option>Yes</option><option>No</option></select></AppealRow>
          <AppealRow label="Ground For Appeal" required><select className={`${fieldClassName} md:w-2/3`} defaultValue="---Select---"><option>---Select---</option><option>Refusal of information</option><option>No response received</option></select></AppealRow>
          <div className="rounded border border-outline-variant bg-surface p-4">
            <p className="mb-2 text-label-sm text-on-surface-variant">(Enter Text for RTI first appeal application upto 500 characters)</p>
            <p className="mb-4 flex items-center gap-1 text-label-sm font-medium italic text-surface-tint"><span className="font-bold not-italic text-error">Note:-</span>Only alphabets A-Z a-z number 0-9 and special characters , . - _ ( ) / @ : &amp; \ ? % are allowed in Text for RTI first appeal application.</p>
            <AppealRow label="Text for RTI first appeal application" required><textarea className={`${fieldClassName} min-h-36 resize-y`} maxLength={500} rows={6} /></AppealRow>
          </div>
          <AppealRow hint="(only pdf upto 1 MB)" label="Supporting document"><input accept=".pdf" className="block w-full cursor-pointer text-sm text-on-surface-variant file:mr-4 file:rounded file:border file:border-outline-variant file:bg-surface-container file:px-4 file:py-2 file:font-label-lg file:text-on-surface hover:file:bg-surface-container-high md:w-2/3" type="file" /></AppealRow>
          <AppealRow label="Enter security code" required>
            <div className="flex items-center gap-4"><div className="flex flex-col items-center"><div className="rounded border border-outline-variant bg-surface-variant px-6 py-2 font-mono text-headline-md tracking-[0.2em] text-on-surface">{captchaCodes[captchaIndex]}</div><button className="mt-1 text-label-sm text-surface-tint hover:underline" onClick={() => setCaptchaIndex((current) => (current + 1) % captchaCodes.length)} type="button">Refresh</button></div><input className={`${fieldClassName} w-32 text-center`} type="text" /></div>
          </AppealRow>
        </AppealSection>

        <div className="flex justify-center gap-4 border-t border-outline-variant bg-surface-container-low px-6 py-4">
          <button className="rounded bg-surface-tint px-8 py-2 font-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary" type="submit">Submit</button>
          <button className="rounded bg-surface-tint px-8 py-2 font-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary" type="reset">Reset</button>
        </div>
      </form>
    </main>
  )
}
