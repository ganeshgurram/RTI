import { useState } from "react"

import { Button } from "@/components/ui/button"
import { usePortalLanguage, type PortalLanguage } from "@/i18n"

const storageKey = "rti-demo-first-visit-guide-dismissed"

type GuideCopy = {
  title: string
  description: string
  dismiss: string
  steps: { icon: string; title: string; body: string; action: string; path: string }[]
}

const copy: Record<PortalLanguage, GuideCopy> = {
  en: {
    title: "New here? Start with these three steps",
    description: "A short guide to finding the right authority, filing an RTI, and tracking what happens next.",
    dismiss: "Got it",
    steps: [
      { icon: "account_balance", title: "1. Find an authority", body: "Search the Public Authorities Directory or ask RTI Sahayak to find the department most likely to hold the records.", action: "Find an authority", path: "/public-authorities" },
      { icon: "edit_document", title: "2. Submit an RTI request", body: "Read the filing guidelines, fill the request, review it, and use the simulated payment journey if a fee applies.", action: "Start a request", path: "/submit-request" },
      { icon: "track_changes", title: "3. Track progress", body: "Use View Status with the registration number, or sign in to see the request history and the next action.", action: "View status", path: "/status" },
    ],
  },
  hi: {
    title: "नए हैं? इन तीन चरणों से शुरू करें",
    description: "सही प्राधिकरण खोजने, आरटीआई दायर करने और आगे की प्रगति ट्रैक करने के लिए एक छोटा मार्गदर्शक।",
    dismiss: "समझ गया",
    steps: [
      { icon: "account_balance", title: "1. प्राधिकरण खोजें", body: "लोक प्राधिकरण निर्देशिका खोजें या आरटीआई सहायक से उस विभाग के बारे में पूछें जिसके पास रिकॉर्ड होने की संभावना है।", action: "प्राधिकरण खोजें", path: "/public-authorities" },
      { icon: "edit_document", title: "2. आरटीआई अनुरोध दायर करें", body: "दिशानिर्देश पढ़ें, अनुरोध भरें, उसकी समीक्षा करें और शुल्क लागू होने पर सिमुलेटेड भुगतान यात्रा का उपयोग करें।", action: "अनुरोध शुरू करें", path: "/submit-request" },
      { icon: "track_changes", title: "3. प्रगति ट्रैक करें", body: "पंजीकरण संख्या के साथ स्थिति देखें का उपयोग करें, या अनुरोध इतिहास और अगला कदम देखने के लिए साइन इन करें।", action: "स्थिति देखें", path: "/status" },
    ],
  },
  te: {
    title: "కొత్తవారా? ఈ మూడు దశలతో ప్రారంభించండి",
    description: "సరైన అధికారిని కనుగొనడం, RTI దాఖలు చేయడం, ఆ తర్వాత జరిగే ప్రగతిని తెలుసుకోవడం కోసం చిన్న మార్గదర్శకం.",
    dismiss: "అర్థమైంది",
    steps: [
      { icon: "account_balance", title: "1. అధికారిని కనుగొనండి", body: "పబ్లిక్ అథారిటీస్ డైరెక్టరీలో వెతకండి లేదా రికార్డులు ఉండే అవకాశం ఉన్న శాఖను కనుగొనమని RTI సహాయక్‌ను అడగండి.", action: "అధికారిని కనుగొనండి", path: "/public-authorities" },
      { icon: "edit_document", title: "2. RTI అభ్యర్థనను సమర్పించండి", body: "దాఖలు మార్గదర్శకాలను చదవండి, అభ్యర్థనను పూరించండి, దానిని సమీక్షించండి; రుసుము వర్తిస్తే అనుకరణ పేమెంట్ ప్రయాణాన్ని ఉపయోగించండి.", action: "అభ్యర్థన ప్రారంభించండి", path: "/submit-request" },
      { icon: "track_changes", title: "3. ప్రగతిని ట్రాక్ చేయండి", body: "నమోదు సంఖ్యతో స్థితిని చూడండి ఉపయోగించండి లేదా అభ్యర్థన చరిత్ర, తదుపరి చర్య చూడటానికి సైన్ ఇన్ చేయండి.", action: "స్థితిని చూడండి", path: "/status" },
    ],
  },
  kn: {
    title: "ಹೊಸದಾಗಿ ಬಂದಿದ್ದೀರಾ? ಈ ಮೂರು ಹಂತಗಳಿಂದ ಆರಂಭಿಸಿ",
    description: "ಸರಿಯಾದ ಪ್ರಾಧಿಕಾರವನ್ನು ಹುಡುಕಲು, RTI ಸಲ್ಲಿಸಲು ಮತ್ತು ಮುಂದೆ ಏನಾಗುತ್ತದೆ ಎಂಬುದನ್ನು ಗಮನಿಸಲು ಈ ಚಿಕ್ಕ ಮಾರ್ಗದರ್ಶಿ ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
    dismiss: "ಅರ್ಥವಾಯಿತು",
    steps: [
      { icon: "account_balance", title: "1. ಪ್ರಾಧಿಕಾರವನ್ನು ಹುಡುಕಿ", body: "ಸಾರ್ವಜನಿಕ ಪ್ರಾಧಿಕಾರಗಳ ಡೈರೆಕ್ಟರಿಯಲ್ಲಿ ಹುಡುಕಿ ಅಥವಾ ದಾಖಲೆಯನ್ನು ಹೊಂದಿರುವ ಸಾಧ್ಯತೆಯಿರುವ ಇಲಾಖೆಯನ್ನು ಹುಡುಕಲು RTI ಸಹಾಯಕರನ್ನು ಕೇಳಿ.", action: "ಪ್ರಾಧಿಕಾರವನ್ನು ಹುಡುಕಿ", path: "/public-authorities" },
      { icon: "edit_document", title: "2. RTI ವಿನಂತಿ ಸಲ್ಲಿಸಿ", body: "ಸಲ್ಲಿಕೆ ಮಾರ್ಗಸೂಚಿಗಳನ್ನು ಓದಿ, ವಿನಂತಿಯನ್ನು ಭರ್ತಿ ಮಾಡಿ, ಪರಿಶೀಲಿಸಿ; ಶುಲ್ಕ ಅನ್ವಯಿಸಿದರೆ ನಕಲಿ ಪಾವತಿ ಪ್ರಕ್ರಿಯೆಯನ್ನು ಬಳಸಿ.", action: "ವಿನಂತಿ ಆರಂಭಿಸಿ", path: "/submit-request" },
      { icon: "track_changes", title: "3. ಪ್ರಗತಿಯನ್ನು ಗಮನಿಸಿ", body: "ನೋಂದಣಿ ಸಂಖ್ಯೆಯೊಂದಿಗೆ ಸ್ಥಿತಿ ವೀಕ್ಷಿಸಿ ಬಳಸಿ, ಅಥವಾ ವಿನಂತಿ ಇತಿಹಾಸ ಮತ್ತು ಮುಂದಿನ ಕ್ರಮವನ್ನು ನೋಡಲು ಸೈನ್ ಇನ್ ಮಾಡಿ.", action: "ಸ್ಥಿತಿ ವೀಕ್ಷಿಸಿ", path: "/status" },
    ],
  },
}

function hasDismissedGuide() {
  try {
    return localStorage.getItem(storageKey) === "true"
  } catch {
    return false
  }
}

export function FirstVisitGuide() {
  const { language } = usePortalLanguage()
  const [isVisible, setIsVisible] = useState(() => !hasDismissedGuide())
  const text = copy[language]

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, "true")
    } catch {
      // The guide will appear again after a reload if local storage is unavailable.
    }
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <section aria-labelledby="first-visit-guide-title" className="mx-auto mb-8 max-w-container-max px-margin-mobile md:px-margin-desktop">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">RTI Online</p>
            <h2 className="mt-1 font-headline-md text-xl text-primary" id="first-visit-guide-title">{text.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">{text.description}</p>
          </div>
          <Button onClick={dismiss} type="button" variant="outline">{text.dismiss}</Button>
        </div>
        <ol className="mt-5 grid gap-3 md:grid-cols-3">
          {text.steps.map((step) => (
            <li className="rounded-lg border border-border bg-background/70 p-4" key={step.path}>
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><span aria-hidden="true" className="material-symbols-outlined text-xl">{step.icon}</span></span>
              <h3 className="mt-3 text-sm font-semibold text-on-surface">{step.title}</h3>
              <p className="mt-1 min-h-15 text-sm leading-5 text-on-surface-variant">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
