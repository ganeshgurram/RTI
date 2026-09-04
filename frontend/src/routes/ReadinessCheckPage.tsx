import { useState } from "react"
import { Link } from "react-router-dom"

import { useAuth } from "@/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { usePortalLanguage } from "@/i18n"
import { MaterialIcon } from "@/routes/stitch-shell"

type Screen = "scope" | "records" | "authority" | "previous" | "appeal"
type Result = "ready" | "find" | "appeal" | "commission" | "grievance" | "status"

const copy = {
  en: {
    title: "RTI Readiness Check", subtitle: "Answer a few quick questions to find the right next step. This takes under two minutes and does not ask for personal information.", privacy: "Your answers stay only in this page and are not saved.", question: "Question", back: "Back", restart: "Start over",
    scope: "Is the information likely held by a Central Government Ministry, Department, or Central Public Authority?", central: "Yes, Central Government", state: "No, it is a State or local authority", unsure: "I am not sure",
    records: "Are you asking for existing records, documents, reports, or data?", recordsYes: "Yes, existing information", recordsNo: "No, I need an action, explanation, or grievance resolved",
    authority: "Do you know which Central Public Authority holds those records?", authorityYes: "Yes, I know the authority", authorityNo: "No, help me find it",
    previous: "Have you already filed an RTI application about this matter?", previousYes: "Yes", previousNo: "No",
    appeal: "What happened to that RTI application?", noReply: "No reply was received", dissatisfied: "I am dissatisfied with the reply", waiting: "It is still within the response period", appealDecision: "I already received a First Appeal decision",
    results: {
      ready: ["You are ready to file an RTI request", "Your question appears suited to a request for existing Central Government records. Read the filing guidelines, then complete and review the official form.", "Start RTI request", "/submit-request", "fact_check"],
      find: ["Find the right Public Authority first", "Use the directory to identify the office that holds the records. Filing with the right authority makes the request clearer and easier to process.", "Find Public Authorities", "/public-authorities", "account_balance"],
      appeal: ["A First Appeal may be the right next step", "If no reply was received or the reply is unsatisfactory, use the First Appeal journey for the original online RTI request. No fee is required for a First Appeal.", "Start First Appeal", "/submit-first-appeal", "gavel"],
      commission: ["Use the relevant Information Commission route", "State and local authority matters use the relevant State Information Commission. A Second Appeal for a Central Public Authority is handled independently by the Central Information Commission.", "Learn about Second Appeal", "/second-appeal", "account_balance"],
      grievance: ["This may be a grievance rather than an RTI request", "RTI asks for existing records. For an action, correction, service problem, or personal decision, use the responsible authority’s grievance mechanism instead.", "Find the responsible authority", "/public-authorities", "support_agent"],
      status: ["Check the current request status", "The normal response period may still be running. Check the request status before choosing an appeal route.", "View status", "/status", "query_stats"],
    },
  },
  hi: {
    title: "आरटीआई तैयारी जाँच", subtitle: "सही अगला कदम जानने के लिए कुछ छोटे प्रश्नों के उत्तर दें। इसमें दो मिनट से कम समय लगता है और कोई व्यक्तिगत जानकारी नहीं पूछी जाती।", privacy: "आपके उत्तर केवल इस पृष्ठ पर रहते हैं और सहेजे नहीं जाते।", question: "प्रश्न", back: "वापस", restart: "फिर से शुरू करें",
    scope: "क्या जानकारी संभवतः केंद्र सरकार के मंत्रालय, विभाग या केंद्रीय लोक प्राधिकरण के पास है?", central: "हाँ, केंद्र सरकार", state: "नहीं, राज्य या स्थानीय प्राधिकरण", unsure: "मुझे निश्चित नहीं है",
    records: "क्या आप मौजूदा रिकॉर्ड, दस्तावेज़, रिपोर्ट या डेटा मांग रहे हैं?", recordsYes: "हाँ, मौजूदा जानकारी", recordsNo: "नहीं, मुझे कार्रवाई, स्पष्टीकरण या शिकायत का समाधान चाहिए",
    authority: "क्या आप जानते हैं कि इन रिकॉर्ड का धारक कौन-सा केंद्रीय लोक प्राधिकरण है?", authorityYes: "हाँ, मैं प्राधिकरण जानता/जानती हूँ", authorityNo: "नहीं, उसे खोजने में मदद चाहिए",
    previous: "क्या आपने इस विषय पर पहले ही आरटीआई आवेदन दायर किया है?", previousYes: "हाँ", previousNo: "नहीं",
    appeal: "उस आरटीआई आवेदन के साथ क्या हुआ?", noReply: "कोई उत्तर नहीं मिला", dissatisfied: "मैं उत्तर से संतुष्ट नहीं हूँ", waiting: "उत्तर की अवधि अभी चल रही है", appealDecision: "मुझे प्रथम अपील का निर्णय मिल चुका है",
    results: {
      ready: ["आप आरटीआई आवेदन दायर करने के लिए तैयार हैं", "आपका प्रश्न केंद्र सरकार के मौजूदा रिकॉर्ड के अनुरोध के लिए उपयुक्त लगता है। दिशानिर्देश पढ़ें, फिर आधिकारिक फ़ॉर्म भरें और समीक्षा करें।", "आरटीआई आवेदन शुरू करें", "/submit-request", "fact_check"],
      find: ["पहले सही लोक प्राधिकरण खोजें", "रिकॉर्ड रखने वाले कार्यालय की पहचान के लिए निर्देशिका का उपयोग करें। सही प्राधिकरण के पास आवेदन अधिक स्पष्ट और संसाधित करना आसान होता है।", "लोक प्राधिकरण खोजें", "/public-authorities", "account_balance"],
      appeal: ["प्रथम अपील सही अगला कदम हो सकता है", "यदि उत्तर नहीं मिला या उत्तर असंतोषजनक है, तो मूल ऑनलाइन आरटीआई आवेदन के लिए प्रथम अपील यात्रा का उपयोग करें। प्रथम अपील के लिए कोई शुल्क नहीं है।", "प्रथम अपील शुरू करें", "/submit-first-appeal", "gavel"],
      commission: ["संबंधित सूचना आयोग का मार्ग अपनाएँ", "राज्य और स्थानीय प्राधिकरण के मामले संबंधित राज्य सूचना आयोग के लिए हैं। केंद्रीय लोक प्राधिकरण की द्वितीय अपील केंद्रीय सूचना आयोग स्वतंत्र रूप से संभालता है।", "द्वितीय अपील जानें", "/second-appeal", "account_balance"],
      grievance: ["यह आरटीआई के बजाय शिकायत हो सकती है", "आरटीआई मौजूदा रिकॉर्ड मांगती है। कार्रवाई, सुधार, सेवा समस्या या व्यक्तिगत निर्णय के लिए संबंधित प्राधिकरण की शिकायत व्यवस्था का उपयोग करें।", "जिम्मेदार प्राधिकरण खोजें", "/public-authorities", "support_agent"],
      status: ["वर्तमान आवेदन स्थिति जाँचें", "सामान्य उत्तर अवधि अभी चल रही हो सकती है। अपील मार्ग चुनने से पहले आवेदन की स्थिति जाँचें।", "स्थिति देखें", "/status", "query_stats"],
    },
  },
} as const

export function ReadinessCheckPage() {
  const { language } = usePortalLanguage(); const { user } = useAuth(); const text = copy[language]
  const [screen, setScreen] = useState<Screen>("scope"); const [history, setHistory] = useState<Screen[]>([]); const [result, setResult] = useState<Result | null>(null)
  const options: Record<Screen, Array<[string, Screen | Result]>> = {
    scope: [[text.central, "records"], [text.state, "commission"], [text.unsure, "find"]], records: [[text.recordsYes, "authority"], [text.recordsNo, "grievance"]], authority: [[text.authorityYes, "previous"], [text.authorityNo, "find"]], previous: [[text.previousYes, "appeal"], [text.previousNo, "ready"]], appeal: [[text.noReply, "appeal"], [text.dissatisfied, "appeal"], [text.waiting, "status"], [text.appealDecision, "commission"]],
  }
  const questions: Record<Screen, string> = { scope: text.scope, records: text.records, authority: text.authority, previous: text.previous, appeal: text.appeal }
  const choose = (next: Screen | Result) => {
    if (["ready", "find", "appeal", "commission", "grievance", "status"].includes(next)) { setResult(next as Result); return }
    setHistory((items) => [...items, screen]); setScreen(next as Screen)
  }
  const back = () => { const previous = history.at(-1); if (previous) { setHistory((items) => items.slice(0, -1)); setScreen(previous) } }
  const restart = () => { setScreen("scope"); setHistory([]); setResult(null) }
  const outcome = result ? text.results[result] : null
  const outcomePath = result === "status" && user ? "/request-history" : outcome?.[3]

  return <main className="mx-auto w-full max-w-3xl px-margin-mobile py-stack-lg md:px-margin-desktop md:py-8"><header className="mb-6 text-center"><div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><MaterialIcon>route</MaterialIcon></div><h1 className="font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">{text.title}</h1><p className="mx-auto mt-2 max-w-2xl text-body-md leading-6 text-on-surface-variant">{text.subtitle}</p></header><section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">{!outcome ? <><div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3 text-sm text-muted-foreground sm:px-6"><span>{text.question} {history.length + 1} / 5</span><span>{(history.length + 1) * 20}%</span></div><div className="p-5 sm:p-7"><h2 className="font-headline-md text-xl leading-8 text-primary">{questions[screen]}</h2><div className="mt-6 grid gap-3">{options[screen].map(([label, next]) => <button className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-4 text-left text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20" key={label} onClick={() => choose(next)} type="button"><span>{label}</span><MaterialIcon className="text-primary">arrow_forward</MaterialIcon></button>)}</div><div className="mt-6 flex items-center justify-between border-t border-border pt-4"><Button disabled={!history.length} onClick={back} type="button" variant="outline">{text.back}</Button><Button onClick={restart} type="button" variant="ghost">{text.restart}</Button></div></div></> : <div className="p-5 sm:p-7"><div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><MaterialIcon className="text-2xl">{outcome[4]}</MaterialIcon></div><h2 className="mt-5 font-headline-md text-2xl text-primary">{outcome[0]}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">{outcome[1]}</p><p className="mt-5 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-on-surface-variant"><MaterialIcon className="text-base text-primary">privacy_tip</MaterialIcon>{text.privacy}</p><div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-5"><Button onClick={restart} type="button" variant="outline">{text.restart}</Button><Button asChild><Link to={outcomePath ?? "/"}>{outcome[2]}<MaterialIcon className="text-[18px]">arrow_forward</MaterialIcon></Link></Button></div></div>}</section></main>
}
