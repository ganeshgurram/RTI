import { useEffect, useRef, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { usePortalLanguage } from "@/i18n"
import { RequestGuidelinesContext, type RequestAuthority } from "@/request-guidelines/RequestGuidelinesContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const guidelines = [
  "This portal may be used by Indian citizens to file RTI applications and first appeals online for the Government of India ministries and departments covered by this service.",
  "Use Submit Request to enter the application details. Fields marked with an asterisk (*) are mandatory.",
  "Enter your request in the application text field. The application text is limited to 3,000 characters and supports letters, numbers, and common punctuation.",
  "If your application is longer, upload it as a supporting document. Do not upload Aadhaar, PAN, or other personal identity documents unless you are claiming BPL status. PDF file names must not contain spaces.",
  "Select Make Payment after completing the request. Online payments can be made through internet banking, cards, UPI, or RuPay, subject to the applicable RTI Rules, 2012 fee.",
  "Do not submit the request again if payment is completed but a registration number is not displayed. Allow 24 to 48 hours for confirmation and contact support with your transaction details if needed.",
  "Applicants below the poverty line are not required to pay the fee, but a valid BPL certificate must be uploaded with the request.",
  "A unique registration number is issued after submission. The request is sent to the Nodal Officer of the concerned public authority and then to the appropriate CPIO for processing.",
  "If an additional fee is required, its details and payment status will be available through the portal and may also be communicated by email or SMS.",
  "You can submit a first appeal online when you are dissatisfied with the response or have not received one. No fee is charged for filing a first appeal through this portal.",
  "Use the View Status service and your registration number to track an application or appeal. The provisions of the RTI Act, 2005 and its rules apply to all requests filed here.",
]

const firstAppealGuidelines = [
  "A First Appeal may be filed online only for an RTI request that was originally filed through this portal.",
  "Keep the original RTI request registration number and the email address used to file it ready. They are used to identify the request being appealed.",
  "Choose the ground that best explains your appeal and state the facts clearly in the appeal text. The appeal text is limited to 500 characters.",
  "A First Appeal may be filed when information is refused, no response is received within the time limit, an unreasonable fee is requested, or information supplied is incomplete, misleading, or false.",
  "No fee is charged for filing a First Appeal through this portal.",
  "A First Appeal should normally be filed within 30 days of receiving the response, or from the date the response was due. The First Appellate Authority normally decides it within 30 days, extendable to 45 days where reasons are recorded.",
  "Do not enter Aadhaar, PAN, bank details, OTPs, or passwords in the appeal text or supporting document. Upload only a relevant PDF, up to 1 MB.",
  "After submission, save the First Appeal registration number and use the portal to track its progress.",
]

const hindiGuidelines = [
  "इस पोर्टल का उपयोग भारतीय नागरिक भारत सरकार के उन मंत्रालयों और विभागों के लिए आरटीआई आवेदन और प्रथम अपील ऑनलाइन दर्ज करने हेतु कर सकते हैं, जो इस सेवा के अंतर्गत आते हैं।",
  "आवेदन विवरण भरने के लिए अनुरोध जमा करें चुनें। तारांकन चिह्न (*) वाले फ़ील्ड अनिवार्य हैं।",
  "अपना अनुरोध आवेदन-पाठ फ़ील्ड में दर्ज करें। पाठ की सीमा 3,000 वर्ण है और इसमें अक्षर, अंक तथा सामान्य विराम चिह्नों का उपयोग किया जा सकता है।",
  "यदि आपका आवेदन लंबा है तो उसे सहायक दस्तावेज़ के रूप में अपलोड करें। जब तक आप बीपीएल स्थिति का दावा नहीं कर रहे हैं, आधार, पैन या अन्य पहचान दस्तावेज़ अपलोड न करें। पीडीएफ फ़ाइल नाम में रिक्त स्थान नहीं होना चाहिए।",
  "आवेदन पूरा करने के बाद भुगतान करें चुनें। लागू आरटीआई नियम, 2012 के अनुसार इंटरनेट बैंकिंग, कार्ड, यूपीआई या रुपे से ऑनलाइन भुगतान किया जा सकता है।",
  "यदि भुगतान पूरा हो गया है लेकिन पंजीकरण नंबर दिखाई नहीं देता है, तो आवेदन फिर से जमा न करें। पुष्टि के लिए 24 से 48 घंटे प्रतीक्षा करें और अपने लेन-देन विवरण के साथ सहायता से संपर्क करें।",
  "गरीबी रेखा से नीचे के आवेदकों को शुल्क नहीं देना होता है, परंतु अनुरोध के साथ वैध बीपीएल प्रमाणपत्र अपलोड करना आवश्यक है।",
  "जमा करने के बाद एक विशिष्ट पंजीकरण नंबर जारी होता है। अनुरोध संबंधित लोक प्राधिकरण के नोडल अधिकारी और फिर उपयुक्त सीपीआईओ को भेजा जाता है।",
  "यदि अतिरिक्त शुल्क आवश्यक हो, तो उसका विवरण और भुगतान स्थिति पोर्टल पर तथा ईमेल या एसएमएस द्वारा उपलब्ध कराई जा सकती है।",
  "यदि आप उत्तर से असंतुष्ट हैं या उत्तर प्राप्त नहीं हुआ है, तो आप प्रथम अपील ऑनलाइन जमा कर सकते हैं। प्रथम अपील के लिए कोई शुल्क नहीं है।",
  "आवेदन या अपील को ट्रैक करने के लिए अपनी पंजीकरण संख्या के साथ स्थिति देखें सेवा का उपयोग करें। सूचना का अधिकार अधिनियम, 2005 और उसके नियम इस पोर्टल पर दाखिल सभी अनुरोधों पर लागू होते हैं।",
]

const hindiFirstAppealGuidelines = [
  "प्रथम अपील केवल उसी आरटीआई अनुरोध के विरुद्ध ऑनलाइन दायर की जा सकती है जो मूल रूप से इस पोर्टल के माध्यम से दायर हुआ हो।",
  "मूल आरटीआई अनुरोध का पंजीकरण नंबर और उसे दायर करने में प्रयुक्त ईमेल पता तैयार रखें। इनसे उस अनुरोध की पहचान की जाती है जिसके विरुद्ध अपील करनी है।",
  "वह आधार चुनें जो आपकी अपील को सबसे अच्छे रूप से बताता है और अपील-पाठ में तथ्य स्पष्ट रूप से लिखें। अपील-पाठ की सीमा 500 वर्ण है।",
  "जानकारी देने से इनकार, समय-सीमा में उत्तर न मिलने, अनुचित शुल्क मांगे जाने, या अपूर्ण, भ्रामक अथवा गलत जानकारी दिए जाने पर प्रथम अपील की जा सकती है।",
  "इस पोर्टल के माध्यम से प्रथम अपील दायर करने के लिए कोई शुल्क नहीं लिया जाता है।",
  "सामान्यतः उत्तर मिलने की तिथि या उत्तर देय होने की तिथि से 30 दिनों के भीतर प्रथम अपील दायर की जानी चाहिए। प्रथम अपीलीय प्राधिकारी सामान्यतः 30 दिनों में निर्णय देता है, जिसे कारण दर्ज कर 45 दिनों तक बढ़ाया जा सकता है।",
  "अपील-पाठ या सहायक दस्तावेज़ में आधार, पैन, बैंक विवरण, ओटीपी या पासवर्ड न लिखें। केवल प्रासंगिक पीडीएफ, अधिकतम 1 एमबी, अपलोड करें।",
  "जमा करने के बाद प्रथम अपील पंजीकरण नंबर सुरक्षित रखें और उसकी प्रगति ट्रैक करने के लिए पोर्टल का उपयोग करें।",
]

// Kept as source material for any future First Appeal-specific guidance update. The dialog
// intentionally presents the primary RTI guidelines for both journeys.
void firstAppealGuidelines
void hindiFirstAppealGuidelines

export function RequestGuidelinesDialogProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { language } = usePortalLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [hasAcknowledged, setHasAcknowledged] = useState(false)
  const [hasReachedEnd, setHasReachedEnd] = useState(false)
  const [cancelTo, setCancelTo] = useState<number | string | null>(null)
  const [authority, setAuthority] = useState<RequestAuthority | null>(null)
  const [journey, setJourney] = useState<"request" | "firstAppeal">("request")
  const guidelinesScrollRef = useRef<HTMLDivElement>(null)

  const updateScrollProgress = () => {
    const scrollArea = guidelinesScrollRef.current

    if (!scrollArea) {
      return
    }

    if (scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 8) {
      setHasReachedEnd(true)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const frame = window.requestAnimationFrame(updateScrollProgress)
    return () => window.cancelAnimationFrame(frame)
  }, [isOpen])

  const closeDialog = (shouldReturn = false) => {
    const destination = cancelTo
    setIsOpen(false)
    setHasAcknowledged(false)
    setHasReachedEnd(false)
    setCancelTo(null)
    // Cleared with the rest, so a later visit from the home page or top nav does not
    // silently reuse the office picked in the directory earlier.
    setAuthority(null)
    setJourney("request")

    if (shouldReturn && destination !== null) {
      if (typeof destination === "number") {
        navigate(destination)
      } else {
        navigate(destination)
      }
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setIsOpen(true)
      setHasAcknowledged(false)
      setHasReachedEnd(false)
      return
    }

    closeDialog(true)
  }

  const handleSubmit = () => {
    const destination = journey === "firstAppeal" ? "/submit-first-appeal" : "/submit-request"
    const state = journey === "firstAppeal"
      ? { guidelinesAccepted: true }
      : { guidelinesAccepted: true, authority }

    closeDialog()
    navigate(destination, { state })
  }

  const isFirstAppeal = journey === "firstAppeal"
  const isHindi = language === "hi"
  // The primary RTI guidance is the single source of truth for both journeys. The First Appeal
  // title and destination remain specific to that flow, but applicants acknowledge the same
  // main portal guidance before proceeding.
  const activeGuidelines = isHindi ? hindiGuidelines : guidelines

  return (
    <RequestGuidelinesContext.Provider
      value={{
        openRequestGuidelines: (options) => {
          setHasAcknowledged(false)
          setHasReachedEnd(false)
          setCancelTo(options?.cancelTo ?? null)
          setAuthority(options?.authority ?? null)
          setJourney(options?.journey ?? "request")
          setIsOpen(true)
        },
      }}
    >
      {children}
      <Dialog onOpenChange={handleOpenChange} open={isOpen}>
        <DialogContent
          className="grid max-h-[calc(100svh/var(--app-scale)_-_2rem)] w-[calc(100%_-_2rem)] grid-rows-[auto_minmax(0,1fr)_auto_auto] gap-0 overflow-hidden p-0 sm:max-w-3xl"
        >
          <DialogHeader className="border-b border-outline-variant px-5 py-4 pr-12 sm:px-6">
            <DialogTitle className="font-headline-md text-xl font-bold text-primary">
              {isFirstAppeal
                ? (isHindi ? "प्रथम अपील दायर करने के दिशानिर्देश" : "Guidelines for Filing a First Appeal")
                : (isHindi ? "आरटीआई अनुरोध दायर करने के दिशानिर्देश" : "Guidelines for Filing an RTI Request")}
            </DialogTitle>
            <DialogDescription className="text-on-surface-variant">
              {isFirstAppeal
                ? (isHindi ? "जिस आरटीआई अनुरोध के विरुद्ध अपील करनी है, उसे जाँचने से पहले इन दिशानिर्देशों को पढ़ें।" : "Please read these guidelines before checking the RTI request you want to appeal.")
                : (isHindi ? "आवेदन शुरू करने से पहले इन दिशानिर्देशों को पढ़ें।" : "Please read these guidelines before starting your application.")}
            </DialogDescription>
          </DialogHeader>

          <div
            className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6"
            onScroll={updateScrollProgress}
            ref={guidelinesScrollRef}
          >
            <ol className="space-y-4 pl-5 text-sm leading-6 text-on-surface-variant marker:font-semibold marker:text-primary">
              {activeGuidelines.map((guideline) => (
                <li key={guideline}>{guideline}</li>
              ))}
            </ol>
          </div>

          <div className="border-t border-outline-variant px-5 py-4 sm:px-6">
            <label className={`flex items-start gap-3 text-sm font-medium leading-5 text-on-surface ${hasReachedEnd ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}>
              <input
                checked={hasAcknowledged}
                className="mt-0.5 size-4 shrink-0 rounded border-outline text-primary accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed"
                disabled={!hasReachedEnd}
                onChange={(event) => setHasAcknowledged(event.target.checked)}
                type="checkbox"
              />
              <span>{isHindi ? "मैंने उपर्युक्त दिशानिर्देशों को पढ़ और समझ लिया है।" : "I have read and understood the above guidelines."}</span>
            </label>
            {/* {!hasReachedEnd ? (
              <p className="mt-2 pl-7 text-xs text-on-surface-variant">Scroll to the end of the guidelines to acknowledge them.</p>
            ) : null} */}
          </div>

          <DialogFooter className="mx-0 mb-0 border-t border-outline-variant bg-surface-container-low px-5 py-4 sm:px-6">
            <Button onClick={() => closeDialog(true)} type="button" variant="outline">
              {isHindi ? "रद्द करें" : "Cancel"}
            </Button>
            <Button disabled={!hasAcknowledged} onClick={handleSubmit} type="button">
              {isFirstAppeal ? (isHindi ? "प्रथम अपील के लिए आगे बढ़ें" : "Continue to First Appeal") : (isHindi ? "अनुरोध जमा करें" : "Submit Request")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RequestGuidelinesContext.Provider>
  )
}
