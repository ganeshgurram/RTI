import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "@/auth/AuthContext"
import { Button } from "@/components/ui/button"
import type { RequestReviewDraft } from "@/data/request-review"
import { usePortalLanguage, type PortalLanguage } from "@/i18n"
import { MaterialIcon } from "@/routes/stitch-shell"
import type { AuthoritySuggestion } from "@/services/authority-recommendations"
import { prepareRtiFiling, type FilingPreparation } from "@/services/rti-sahayak"

type FilingCopy = {
  title: string
  subtitle: string
  describeTitle: string
  describeHint: string
  placeholder: string
  privacy: string
  prepare: string
  preparing: string
  confirmTitle: string
  confirmHint: string
  authority: string
  whySuggested: string
  verifyAuthority: string
  noAuthority: string
  subject: string
  requestText: string
  personalDetails: string
  signedIn: string
  signedOut: string
  continue: string
  restart: string
  directory: string
  error: string
  noDirectSubmit: string
  step: string
}

const copy: Record<PortalLanguage, FilingCopy> = {
  en: {
    title: "File with RTI Sahayak",
    subtitle: "Describe the information you need in plain language. RTI Sahayak suggests an authority and prepares an editable draft.",
    describeTitle: "What information are you looking for?",
    describeHint: "Use general facts only. Do not include your name, contact details, application number, OTP, payment details, or documents.",
    placeholder: "For example: I need records of passport appointment waiting times at Kochi PSK during 2026.",
    privacy: "Only the issue, possible authority, and request draft are handled here. Personal details stay in your profile or the secure form.",
    prepare: "Find authority and prepare draft",
    preparing: "Preparing your filing…",
    confirmTitle: "Review the prepared filing",
    confirmHint: "Check the authority and edit the subject or request before moving to the official form.",
    authority: "Suggested public authority",
    whySuggested: "Why this is suggested",
    verifyAuthority: "Verify or change in Public Authorities",
    noAuthority: "We could not confidently match a Central Public Authority. Search the directory, then begin the official form.",
    subject: "Request subject",
    requestText: "RTI request text",
    personalDetails: "Personal details",
    signedIn: "Your profile details will be filled privately in the next form.",
    signedOut: "Personal details are collected privately in the next form and are never sent to RTI Sahayak.",
    continue: "Continue to official form",
    restart: "Start over",
    directory: "Search Public Authorities",
    error: "Please describe the issue without personal, account, or payment information.",
    noDirectSubmit: "This does not submit an application. You will still read the guidelines, complete the official form, review it, and make payment if required.",
    step: "Step",
  },
  hi: {
    title: "आरटीआई सहायक के साथ आवेदन तैयार करें",
    subtitle: "अपनी आवश्यक जानकारी सामान्य भाषा में लिखें। आरटीआई सहायक एक संभावित प्राधिकरण और संपादित किया जा सकने वाला मसौदा सुझाता है।",
    describeTitle: "आपको कौन-सी जानकारी चाहिए?",
    describeHint: "केवल सामान्य तथ्य लिखें। नाम, संपर्क विवरण, आवेदन संख्या, ओटीपी, भुगतान विवरण या दस्तावेज़ न लिखें।",
    placeholder: "उदाहरण: मुझे 2026 में कोच्चि पीएसके में पासपोर्ट अपॉइंटमेंट प्रतीक्षा समय के रिकॉर्ड चाहिए।",
    privacy: "यहाँ केवल विषय, संभावित प्राधिकरण और आवेदन मसौदा संभाला जाता है। व्यक्तिगत विवरण आपकी प्रोफ़ाइल या सुरक्षित फ़ॉर्म में रहते हैं।",
    prepare: "प्राधिकरण खोजें और मसौदा बनाएँ",
    preparing: "आपका आवेदन तैयार हो रहा है…",
    confirmTitle: "तैयार आवेदन की समीक्षा करें",
    confirmHint: "आधिकारिक फ़ॉर्म में जाने से पहले प्राधिकरण जाँचें तथा विषय या आवेदन संपादित करें।",
    authority: "सुझाया गया लोक प्राधिकरण",
    whySuggested: "यह सुझाव क्यों दिया गया है",
    verifyAuthority: "लोक प्राधिकरण निर्देशिका में जाँचें या बदलें",
    noAuthority: "हमें कोई केंद्रीय लोक प्राधिकरण विश्वसनीय रूप से नहीं मिला। निर्देशिका में खोजें, फिर आधिकारिक फ़ॉर्म शुरू करें।",
    subject: "आवेदन का विषय",
    requestText: "आरटीआई आवेदन पाठ",
    personalDetails: "व्यक्तिगत विवरण",
    signedIn: "आपकी प्रोफ़ाइल के विवरण अगले फ़ॉर्म में निजी रूप से भर दिए जाएंगे।",
    signedOut: "व्यक्तिगत विवरण अगले फ़ॉर्म में निजी रूप से भरे जाते हैं और आरटीआई सहायक को कभी नहीं भेजे जाते।",
    continue: "आधिकारिक फ़ॉर्म में आगे बढ़ें",
    restart: "फिर से शुरू करें",
    directory: "लोक प्राधिकरण खोजें",
    error: "कृपया व्यक्तिगत, खाता या भुगतान जानकारी के बिना समस्या का वर्णन करें।",
    noDirectSubmit: "इससे आवेदन जमा नहीं होता। आपको दिशानिर्देश पढ़ने, आधिकारिक फ़ॉर्म पूरा करने, समीक्षा करने और आवश्यक होने पर भुगतान करने की आवश्यकता होगी।",
    step: "चरण",
  },
}

function AuthorityChoice({
  authority,
  copy: text,
  isSelected,
  onSelect,
}: {
  authority: AuthoritySuggestion
  copy: FilingCopy
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={`rounded-lg border p-4 text-left transition-colors ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/50"}`}
      onClick={onSelect}
      type="button"
    >
      <span className="block text-sm font-semibold leading-5 text-foreground">{authority.authorityName}</span>
      {authority.ministryName ? <span className="mt-1 block text-xs leading-4 text-muted-foreground">{authority.ministryName}</span> : null}
      {authority.matchReason ? (
        <span className="mt-3 block border-t border-border pt-3 text-xs leading-4 text-muted-foreground">
          <span className="font-semibold text-foreground">{text.whySuggested}:</span> {authority.matchReason}
        </span>
      ) : null}
    </button>
  )
}

export function ConversationalFilingPage() {
  const { language } = usePortalLanguage()
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const text = copy[language]
  const initial = (location.state as { initialDescription?: string } | null)?.initialDescription ?? ""
  const [description, setDescription] = useState(initial)
  const [prepared, setPrepared] = useState<FilingPreparation | null>(null)
  const [selected, setSelected] = useState(0)
  const [subject, setSubject] = useState("")
  const [requestText, setRequestText] = useState("")
  const [error, setError] = useState("")
  const [isPreparing, setIsPreparing] = useState(false)
  const [identifier] = useState(() => `rti-sahayak-${crypto.randomUUID()}`)

  const prepare = async () => {
    if (description.trim().length < 12) {
      setError(text.error)
      return
    }

    setError("")
    setIsPreparing(true)

    try {
      const result = await prepareRtiFiling({ description, language, safetyIdentifier: identifier })
      setPrepared(result)
      setSelected(result.selectedAuthorityIndex)
      setSubject(result.subject)
      setRequestText(result.requestText)
    } catch {
      setError(text.error)
    } finally {
      setIsPreparing(false)
    }
  }

  const continueToForm = () => {
    const authority = prepared?.authoritySuggestions[selected]

    if (!authority || !subject.trim() || !requestText.trim()) {
      return
    }

    const profile = user?.profile
    const draft: RequestReviewDraft = {
      applicantEmail: profile?.email ?? "",
      applicantName: profile?.fullName ?? "",
      applicantPhone: profile?.mobile ?? "",
      authority: authority.authorityName,
      ministry: authority.ministryName ?? authority.authorityName,
      subject: subject.trim(),
      requestText: requestText.trim(),
      isBplApplicant: false,
      citizenship: profile?.citizenship ?? "Indian",
      applicant: {
        gender: profile?.gender ?? "",
        addressLine1: profile?.address.line1 ?? "",
        addressLine2: profile?.address.line2 ?? "",
        addressLine3: profile?.address.city ?? "",
        pincode: profile?.address.pincode ?? "",
        country: profile?.country ?? "India",
        state: profile?.address.state ?? "",
        areaType: profile?.areaType ?? "",
        educationalStatus: profile?.educationalStatus ?? "",
      },
    }

    navigate("/submit-request", {
      state: {
        authority: { name: authority.authorityName, ministryName: authority.ministryName ?? authority.authorityName },
        reviewDraft: draft,
      },
    })
  }

  const restart = () => {
    setPrepared(null)
    setSubject("")
    setRequestText("")
    setError("")
  }

  const hasAuthority = Boolean(prepared?.authoritySuggestions[selected])

  return (
    <main className="mx-auto w-full max-w-4xl px-margin-mobile py-stack-lg md:px-margin-desktop md:py-8">
      <header className="mb-4">
        <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><MaterialIcon>auto_awesome</MaterialIcon></div>
        <p className="text-sm font-semibold text-primary">{text.step} {prepared ? "2" : "1"} / 2</p>
        <h1 className="mt-1 font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">{text.title}</h1>
        <p className="mt-2 max-w-3xl text-body-md text-on-surface-variant">{text.subtitle}</p>
      </header>

      {!prepared ? (
        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-4 sm:p-5">
            <h2 className="font-headline-md text-lg text-primary">{text.describeTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{text.describeHint}</p>
          </div>
          <div className="space-y-3 p-4 sm:p-5">
            <textarea className="min-h-48 w-full rounded-lg border border-input bg-background p-3 text-sm leading-6 text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15" maxLength={1400} onChange={(event) => setDescription(event.target.value)} placeholder={text.placeholder} value={description} />
            <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm leading-5 text-on-surface-variant"><MaterialIcon className="mr-2 align-[-3px] text-base text-primary">shield</MaterialIcon>{text.privacy}</p>
            {error ? <p className="text-sm font-medium text-destructive" role="alert">{error}</p> : null}
            <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
              <Button asChild type="button" variant="outline"><Link to="/public-authorities">{text.directory}</Link></Button>
              <Button disabled={isPreparing || !description.trim()} onClick={() => void prepare()} type="button"><MaterialIcon className="text-[18px]">auto_awesome</MaterialIcon>{isPreparing ? text.preparing : text.prepare}</Button>
            </div>
          </div>
        </section>
      ) : (
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-4 sm:p-5">
              <h2 className="font-headline-md text-lg text-primary">{text.confirmTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{text.confirmHint}</p>
            </div>
            <div className="space-y-4 p-4 sm:p-5">
              {prepared.authoritySuggestions.length ? (
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold text-foreground">{text.authority}</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {prepared.authoritySuggestions.map((authority, index) => <AuthorityChoice authority={authority} copy={text} isSelected={index === selected} key={authority.authorityId} onSelect={() => setSelected(index)} />)}
                  </div>
                  <Button asChild className="mt-4" size="sm" type="button" variant="outline"><Link to="/public-authorities"><MaterialIcon className="text-[17px]">manage_search</MaterialIcon>{text.verifyAuthority}</Link></Button>
                </fieldset>
              ) : (
                <p className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-foreground">{text.noAuthority}</p>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-foreground"><span>{text.subject}</span><input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15" maxLength={120} onChange={(event) => setSubject(event.target.value)} value={subject} /></label>
                <div className="rounded-lg border border-border bg-muted/35 p-3"><p className="text-sm font-semibold text-foreground">{text.personalDetails}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{user ? text.signedIn : text.signedOut}</p></div>
              </div>
              <label className="block space-y-1.5 text-sm font-medium text-foreground"><span>{text.requestText}</span><textarea className="min-h-56 w-full rounded-lg border border-input bg-background p-3 text-sm font-normal leading-6 outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15" maxLength={3000} onChange={(event) => setRequestText(event.target.value)} value={requestText} /></label>
            </div>
          </section>

          <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-5 text-on-surface-variant"><MaterialIcon className="mr-2 align-[-3px] text-base text-primary">info</MaterialIcon>{text.noDirectSubmit}</p>
          <div className="flex flex-wrap justify-end gap-3">
            <Button onClick={restart} type="button" variant="outline">{text.restart}</Button>
            {hasAuthority ? <Button disabled={!subject.trim() || !requestText.trim()} onClick={continueToForm} type="button"><MaterialIcon className="text-[18px]">arrow_forward</MaterialIcon>{text.continue}</Button> : <Button asChild type="button"><Link to="/public-authorities">{text.directory}</Link></Button>}
          </div>
        </div>
      )}
    </main>
  )
}
