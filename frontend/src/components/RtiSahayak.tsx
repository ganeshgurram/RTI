import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"

import { IconTooltip } from "@/components/IconTooltip"
import { Button } from "@/components/ui/button"
import { usePortalLanguage, type PortalLanguage } from "@/i18n"
import type { AuthoritySuggestion } from "@/services/authority-recommendations"
import {
  askRtiSahayak,
  containsSensitiveData,
  translateChatMessages,
  type ChatRole,
  type LocalizedText,
} from "@/services/rti-sahayak"
import {
  requestVoiceToggle,
  VOICE_MESSAGE_EVENT,
  VOICE_STATUS_EVENT,
  VOICE_TRANSCRIPT_EVENT,
  type VoiceMessageEventDetail,
  type VoiceStatusEventDetail,
  type VoiceTranscriptEventDetail,
} from "@/services/voice-conversation"

type ChatMessage = {
  id: string
  role: ChatRole
  /**
   * The message in every language it is known in. Switching the portal language keeps the
   * conversation and shows the other side of this, translating it first where it is missing.
   */
  text: LocalizedText
  /** What the message was originally written in - the fallback when a translation is missing. */
  sourceLanguage: PortalLanguage
  authoritySuggestions?: AuthoritySuggestion[]
  source?: "gpt-5.6-luna" | "gemini-live" | "local"
  /** A Gemini Live reply that is still receiving word-level transcription updates. */
  isStreaming?: boolean
}

type ChatCopy = {
  name: string
  voiceAssistant: string
  welcome: string
  subtitle: string
  privacyWarning: string
  privacyNotice: string
  authorityTitle: string
  backToTop: string
  relatedOffices: string
  whySuggested: string
  confirmAuthority: string
  fileRti: string
  preparing: string
  askLabel: string
  placeholder: string
  sendMessage: string
  browseFaqs: string
  clearChat: string
  closeChat: string
  openChat: string
  translating: string
  translationFailed: string
  guidedFiling: string
  suggestions: string[]
}

const chatCopy: Record<PortalLanguage, ChatCopy> = {
  en: {
    name: "RTI Sahayak",
    voiceAssistant: "Voice assistant",
    welcome:
      "Namaste! I am RTI Sahayak. I can answer general questions about filing an RTI, fees, appeals, Public Authorities, and using View Status.",
    subtitle: "General RTI guidance - no personal data",
    privacyWarning: "Never share contact details, IDs, application numbers, OTPs, passwords, payment details, or documents.",
    privacyNotice:
      "That message was not sent. For your privacy, do not share names, contact details, Aadhaar/PAN, registration numbers, OTPs, passwords, payment details, or documents.",
    authorityTitle: "Possible filing targets",
    backToTop: "Back to top",
    relatedOffices: "Related offices",
    whySuggested: "Why this is suggested",
    confirmAuthority: "Confirm in Public Authorities",
    fileRti: "File RTI",
    preparing: "RTI Sahayak is preparing an answer...",
    askLabel: "Ask RTI Sahayak",
    placeholder: "Describe the issue in general terms...",
    sendMessage: "Send message",
    browseFaqs: "Browse official FAQs",
    clearChat: "Clear chat",
    closeChat: "Close RTI Sahayak",
    openChat: "Open RTI Sahayak",
    translating: "Translating this conversation into English...",
    translationFailed: "Some earlier messages could not be translated, and are shown as they were written.",
    guidedFiling: "Prepare an RTI filing with RTI Sahayak",
    suggestions: [
      "Which department handles a passport issue?",
      "What is the RTI fee?",
      "How do I file a First Appeal?",
      "How can I check my status?",
    ],
  },
  hi: {
    name: "आरटीआई सहायक",
    voiceAssistant: "वॉइस सहायक",
    welcome:
      "नमस्ते! मैं आरटीआई सहायक हूँ। मैं आरटीआई आवेदन, शुल्क, अपील, लोक प्राधिकरण और स्थिति देखने से जुड़े सामान्य प्रश्नों में आपकी सहायता कर सकता हूँ।",
    subtitle: "सामान्य आरटीआई मार्गदर्शन - कोई व्यक्तिगत जानकारी नहीं",
    privacyWarning: "संपर्क विवरण, पहचान पत्र, आवेदन संख्या, ओटीपी, पासवर्ड, भुगतान विवरण या दस्तावेज़ कभी साझा न करें।",
    privacyNotice:
      "वह संदेश भेजा नहीं गया। आपकी गोपनीयता के लिए नाम, संपर्क विवरण, आधार/पैन, पंजीकरण संख्या, ओटीपी, पासवर्ड, भुगतान विवरण या दस्तावेज़ साझा न करें।",
    authorityTitle: "संभावित दाखिला प्राधिकरण",
    backToTop: "ऊपर जाएँ",
    relatedOffices: "संबंधित कार्यालय",
    whySuggested: "यह सुझाव क्यों दिया गया है",
    confirmAuthority: "लोक प्राधिकरणों में पुष्टि करें",
    fileRti: "आरटीआई दायर करें",
    preparing: "आरटीआई सहायक उत्तर तैयार कर रहा है...",
    askLabel: "आरटीआई सहायक से पूछें",
    placeholder: "समस्या को सामान्य शब्दों में लिखें...",
    sendMessage: "संदेश भेजें",
    browseFaqs: "आधिकारिक सामान्य प्रश्न देखें",
    clearChat: "चैट साफ़ करें",
    closeChat: "आरटीआई सहायक बंद करें",
    openChat: "आरटीआई सहायक खोलें",
    translating: "इस बातचीत का हिन्दी में अनुवाद हो रहा है...",
    translationFailed: "कुछ पुराने संदेशों का अनुवाद नहीं हो सका, वे मूल रूप में दिखाए जा रहे हैं।",
    guidedFiling: "आरटीआई सहायक के साथ आरटीआई आवेदन तैयार करें",
    suggestions: [
      "पासपोर्ट संबंधी समस्या के लिए कौन-सा विभाग जिम्मेदार है?",
      "आरटीआई शुल्क कितना है?",
      "मैं प्रथम अपील कैसे दर्ज करूँ?",
      "मैं अपनी स्थिति कैसे देख सकता हूँ?",
    ],
  },
  te: {
    name: "RTI సహాయక్",
    voiceAssistant: "వాయిస్ సహాయకుడు",
    welcome:
      "నమస్కారం! నేను RTI సహాయక్. RTI దరఖాస్తు దాఖలు, రుసుములు, అప్పీలు, ప్రజా అధికారాలు మరియు స్థితిని వీక్షించడం గురించి సాధారణ ప్రశ్నలకు సమాధానం ఇవ్వగలను.",
    subtitle: "సాధారణ RTI మార్గదర్శకం – వ్యక్తిగత సమాచారం లేదు",
    privacyWarning: "సంప్రదింపు వివరాలు, గుర్తింపు వివరాలు, దరఖాస్తు సంఖ్యలు, OTPలు, పాస్‌వర్డ్‌లు, చెల్లింపు వివరాలు లేదా పత్రాలను ఎప్పుడూ పంచుకోకండి.",
    privacyNotice:
      "ఆ సందేశం పంపబడలేదు. మీ గోప్యత కోసం, పేర్లు, సంప్రదింపు వివరాలు, ఆధార్/PAN, నమోదు సంఖ్యలు, OTPలు, పాస్‌వర్డ్‌లు, చెల్లింపు వివరాలు లేదా పత్రాలను పంచుకోకండి.",
    authorityTitle: "సాధ్యమైన దాఖలు కార్యాలయాలు",
    backToTop: "పైకి వెళ్ళండి",
    relatedOffices: "సంబంధిత కార్యాలయాలు",
    whySuggested: "ఈ సూచనకు కారణం",
    confirmAuthority: "ప్రజా అధికారాల జాబితాలో నిర్ధారించండి",
    fileRti: "RTI దాఖలు చేయండి",
    preparing: "RTI సహాయక్ సమాధానాన్ని సిద్ధం చేస్తోంది...",
    askLabel: "RTI సహాయక్‌ను అడగండి",
    placeholder: "సమస్యను సాధారణ పదాల్లో వివరించండి...",
    sendMessage: "సందేశాన్ని పంపండి",
    browseFaqs: "అధికారిక FAQలను చూడండి",
    clearChat: "చాట్‌ను క్లియర్ చేయండి",
    closeChat: "RTI సహాయక్‌ను మూసివేయండి",
    openChat: "RTI సహాయక్‌ను తెరవండి",
    translating: "ఈ సంభాషణను తెలుగులోకి అనువదిస్తోంది...",
    translationFailed: "కొన్ని పాత సందేశాలను అనువదించలేకపోయాం; అవి వ్రాయబడిన విధంగానే చూపబడతాయి.",
    guidedFiling: "RTI సహాయక్‌తో RTI దరఖాస్తును సిద్ధం చేయండి",
    suggestions: [
      "పాస్‌పోర్ట్ సమస్యను ఏ శాఖ నిర్వహిస్తుంది?",
      "RTI రుసుము ఎంత?",
      "నేను మొదటి అప్పీల్‌ను ఎలా దాఖలు చేయాలి?",
      "నా స్థితిని ఎలా తనిఖీ చేయాలి?",
    ],
  },
  kn: {
    name: "RTI ಸಹಾಯಕ",
    voiceAssistant: "ಧ್ವನಿ ಸಹಾಯಕ",
    welcome:
      "ನಮಸ್ಕಾರ! ನಾನು RTI ಸಹಾಯಕ. RTI ಅರ್ಜಿ ಸಲ್ಲಿಕೆ, ಶುಲ್ಕಗಳು, ಮೇಲ್ಮನವಿಗಳು, ಸಾರ್ವಜನಿಕ ಪ್ರಾಧಿಕಾರಗಳು ಮತ್ತು ಸ್ಥಿತಿಯನ್ನು ನೋಡುವ ಬಗ್ಗೆ ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಬಹುದು.",
    subtitle: "ಸಾಮಾನ್ಯ RTI ಮಾರ್ಗದರ್ಶನ – ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ ಇಲ್ಲ",
    privacyWarning: "ಸಂಪರ್ಕ ವಿವರಗಳು, ಗುರುತಿನ ವಿವರಗಳು, ಅರ್ಜಿ ಸಂಖ್ಯೆಗಳು, OTPಗಳು, ಪಾಸ್‌ವರ್ಡ್‌ಗಳು, ಪಾವತಿ ವಿವರಗಳು ಅಥವಾ ದಾಖಲೆಗಳನ್ನು ಎಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.",
    privacyNotice:
      "ಆ ಸಂದೇಶವನ್ನು ಕಳುಹಿಸಲಾಗಿಲ್ಲ. ನಿಮ್ಮ ಗೌಪ್ಯತೆಗಾಗಿ, ಹೆಸರುಗಳು, ಸಂಪರ್ಕ ವಿವರಗಳು, ಆಧಾರ್/PAN, ನೋಂದಣಿ ಸಂಖ್ಯೆಗಳು, OTPಗಳು, ಪಾಸ್‌ವರ್ಡ್‌ಗಳು, ಪಾವತಿ ವಿವರಗಳು ಅಥವಾ ದಾಖಲೆಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.",
    authorityTitle: "ಸಂಭಾವ್ಯ ಅರ್ಜಿ ಸಲ್ಲಿಕೆ ಕಚೇರಿಗಳು",
    backToTop: "ಮೇಲಕ್ಕೆ ಹೋಗಿ",
    relatedOffices: "ಸಂಬಂಧಿತ ಕಚೇರಿಗಳು",
    whySuggested: "ಈ ಸಲಹೆಗೆ ಕಾರಣ",
    confirmAuthority: "ಸಾರ್ವಜನಿಕ ಪ್ರಾಧಿಕಾರಗಳ ಪಟ್ಟಿಯಲ್ಲಿ ದೃಢೀಕರಿಸಿ",
    fileRti: "RTI ಸಲ್ಲಿಸಿ",
    preparing: "RTI ಸಹಾಯಕ ಉತ್ತರವನ್ನು ಸಿದ್ಧಪಡಿಸುತ್ತಿದೆ...",
    askLabel: "RTI ಸಹಾಯಕನನ್ನು ಕೇಳಿ",
    placeholder: "ಸಮಸ್ಯೆಯನ್ನು ಸಾಮಾನ್ಯ ಪದಗಳಲ್ಲಿ ವಿವರಿಸಿ...",
    sendMessage: "ಸಂದೇಶ ಕಳುಹಿಸಿ",
    browseFaqs: "ಅಧಿಕೃತ FAQಗಳನ್ನು ನೋಡಿ",
    clearChat: "ಚಾಟ್ ತೆರವುಗೊಳಿಸಿ",
    closeChat: "RTI ಸಹಾಯಕನನ್ನು ಮುಚ್ಚಿ",
    openChat: "RTI ಸಹಾಯಕನನ್ನು ತೆರೆಯಿರಿ",
    translating: "ಈ ಸಂಭಾಷಣೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಅನುವಾದಿಸಲಾಗುತ್ತಿದೆ...",
    translationFailed: "ಕೆಲವು ಹಿಂದಿನ ಸಂದೇಶಗಳನ್ನು ಅನುವಾದಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ; ಅವುಗಳನ್ನು ಬರೆದಂತೆಯೇ ತೋರಿಸಲಾಗುತ್ತಿದೆ.",
    guidedFiling: "RTI ಸಹಾಯಕನೊಂದಿಗೆ RTI ಅರ್ಜಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಿ",
    suggestions: [
      "ಪಾಸ್‌ಪೋರ್ಟ್ ಸಮಸ್ಯೆಯನ್ನು ಯಾವ ಇಲಾಖೆ ನಿರ್ವಹಿಸುತ್ತದೆ?",
      "RTI ಶುಲ್ಕ ಎಷ್ಟು?",
      "ನಾನು ಮೊದಲ ಮೇಲ್ಮನವಿಯನ್ನು ಹೇಗೆ ಸಲ್ಲಿಸಬೇಕು?",
      "ನನ್ನ ಸ್ಥಿತಿಯನ್ನು ಹೇಗೆ ಪರಿಶೀಲಿಸಬಹುದು?",
    ],
  },
}

function createWelcomeMessage(language: PortalLanguage): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    // Portal copy, so each supported language is already written and never needs a model call.
    text: { en: chatCopy.en.welcome, hi: chatCopy.hi.welcome, te: chatCopy.te.welcome, kn: chatCopy.kn.welcome },
    sourceLanguage: language,
    source: "local",
  }
}

function localize(language: PortalLanguage, text: string): LocalizedText {
  return { [language]: text }
}

function getMessageText(message: ChatMessage, language: PortalLanguage) {
  return message.text[language] ?? message.text[message.sourceLanguage] ?? ""
}

function getTranslationKey(message: ChatMessage, language: PortalLanguage) {
  return message.id + ":" + language
}

function needsTranslation(
  message: ChatMessage,
  language: PortalLanguage,
  failedTranslations: ReadonlySet<string>
) {
  return (
    !message.isStreaming
    && message.text[language] === undefined
    && !failedTranslations.has(getTranslationKey(message, language))
  )
}

function createMessageId() {
  return crypto.randomUUID()
}

function createSafetyIdentifier() {
  return "rti-sahayak-" + crypto.randomUUID()
}

/**
 * The model answers in Markdown, so a reply rendered as plain text shows its own asterisks.
 * This turns the little of it that actually appears - bold, bullets, numbered steps, stray
 * heading marks - into elements. Built as React nodes rather than injected HTML, so a reply
 * can never smuggle markup into the page.
 */
function renderInline(text: string, keyPrefix: string) {
  const nodes: ReactNode[] = []
  const pattern = /\*\*(.+?)\*\*|__(.+?)__/g
  let lastIndex = 0
  let match = pattern.exec(text)

  while (match) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    nodes.push(
      <strong className="font-semibold" key={`${keyPrefix}-${match.index}`}>
        {match[1] ?? match[2]}
      </strong>
    )
    lastIndex = match.index + match[0].length
    match = pattern.exec(text)
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length ? nodes : [text]
}

function FormattedMessage({ content }: { content: string }) {
  const blocks: ReactNode[] = []
  let paragraph: string[] = []
  let listItems: string[] = []
  let listIsOrdered = false

  const flushParagraph = () => {
    if (!paragraph.length) return
    const text = paragraph.join(" ")
    blocks.push(<p key={`p-${blocks.length}`}>{renderInline(text, `p${blocks.length}`)}</p>)
    paragraph = []
  }

  const flushList = () => {
    if (!listItems.length) return
    const items = listItems.map((item, index) => (
      <li key={`li-${index}`}>{renderInline(item, `l${blocks.length}-${index}`)}</li>
    ))
    blocks.push(
      listIsOrdered
        ? <ol className="list-decimal space-y-1 pl-5" key={`ol-${blocks.length}`}>{items}</ol>
        : <ul className="list-disc space-y-1 pl-5" key={`ul-${blocks.length}`}>{items}</ul>
    )
    listItems = []
  }

  content.split("\n").forEach((line) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      flushParagraph()
      return
    }

    const bullet = /^[-*•]\s+(.*)$/.exec(trimmed)
    const numbered = /^\d+[.)]\s+(.*)$/.exec(trimmed)

    if (bullet ?? numbered) {
      flushParagraph()
      if (!listItems.length) {
        listIsOrdered = Boolean(numbered)
      }
      listItems.push((numbered ?? bullet)![1])
      return
    }

    flushList()
    paragraph.push(trimmed.replace(/^#{1,6}\s+/, ""))
  })

  flushList()
  flushParagraph()

  return <div className="space-y-2">{blocks}</div>
}

function AuthorityMatches({
  copy,
  onFileRti,
  suggestions,
}: {
  copy: ChatCopy
  onFileRti: (suggestion: AuthoritySuggestion) => void
  suggestions: AuthoritySuggestion[]
}) {
  if (!suggestions.length) {
    return null
  }

  return (
    <section className="mt-3 border-t border-border pt-3">
      <p className="mb-2 text-xs font-semibold text-foreground">{copy.authorityTitle}</p>
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <div className="rounded-lg border border-border bg-muted/40 p-2.5" key={suggestion.authorityId}>
            <p className="text-xs font-semibold leading-5 text-foreground">{suggestion.authorityName}</p>
            {suggestion.ministryName && (
              <p className="mt-1 text-xs leading-4 text-muted-foreground">{suggestion.ministryName}</p>
            )}
            {suggestion.matchReason && (
              <p className="mt-1.5 text-xs leading-4 text-muted-foreground">
                <span className="font-medium text-foreground">{copy.whySuggested}:</span> {suggestion.matchReason}
              </p>
            )}
            {suggestion.relatedOffices.length > 0 && (
              <p className="mt-1.5 text-xs leading-4 text-muted-foreground">
                {copy.relatedOffices}: {suggestion.relatedOffices.join("; ")}
              </p>
            )}
            <button
              aria-label={copy.fileRti + ": " + suggestion.authorityName}
              className="mt-2 inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={() => onFileRti(suggestion)}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-sm">edit_document</span>
              {copy.fileRti}
            </button>
          </div>
        ))}
      </div>
      <Link className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline" to="/public-authorities">
        {copy.confirmAuthority}
        <span aria-hidden="true" className="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
      </Link>
    </section>
  )
}

function VoiceWaveform({
  compact = false,
  prefersReducedMotion,
  status,
}: {
  compact?: boolean
  prefersReducedMotion: boolean | null
  status: VoiceStatusEventDetail["status"]
}) {
  if (status === "connecting") {
    return (
      <motion.span
        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
        aria-hidden="true"
        className={`material-symbols-outlined ${compact ? "text-base" : "text-lg"}`}
        style={prefersReducedMotion ? undefined : { willChange: "transform" }}
        transition={prefersReducedMotion ? undefined : { duration: 1.1, ease: "linear", repeat: Infinity }}
      >
        progress_activity
      </motion.span>
    )
  }

  if (status === "permissionRequired" || status === "unavailable") {
    return <span aria-hidden="true" className={`material-symbols-outlined ${compact ? "text-base" : "text-lg"}`}>mic_off</span>
  }

  const levels = status === "answering"
    ? [[0.45, 0.85, 0.55], [0.8, 0.4, 0.9], [0.5, 1, 0.45], [0.75, 0.45, 0.8]]
    : [[0.45, 0.9, 0.55], [0.75, 0.4, 0.8], [0.5, 1, 0.45], [0.7, 0.45, 0.9]]

  return (
    <span aria-hidden="true" className={`flex items-center justify-center gap-0.5 ${compact ? "h-4" : "h-5"}`}>
      {levels.map((scaleY, index) => (
        <motion.span
          animate={prefersReducedMotion ? { scaleY: 1 } : { scaleY }}
          className={`rounded-full bg-current ${compact ? "h-3 w-0.5" : "h-4 w-1"}`}
          key={index}
          style={prefersReducedMotion ? undefined : { willChange: "transform" }}
          transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.08, duration: status === "answering" ? 0.48 : 0.62, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
        />
      ))}
    </span>
  )
}

function VoiceFeedback({
  inChat = false,
  label,
  prefersReducedMotion,
  status,
}: {
  inChat?: boolean
  label: string | null
  prefersReducedMotion: boolean | null
  status: VoiceStatusEventDetail["status"]
}) {
  const isListening = status === "listening"
  const isVoiceActive = status === "connecting" || isListening || status === "answering"

  return (
    <AnimatePresence initial={false} mode="wait">
      {status !== "idle" && label && (
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          aria-live="polite"
          className={inChat
            ? "mr-5 flex w-fit max-w-[calc(100%-1.25rem)] items-center gap-2.5 rounded-2xl rounded-bl-sm border border-primary/20 bg-background/95 px-3 py-2 text-left shadow-sm shadow-primary/10 supports-backdrop-filter:backdrop-blur-xl"
            : "mb-2 flex max-w-[min(34rem,calc(100vw-2.5rem))] items-center gap-2.5 rounded-2xl border border-primary/20 bg-background/95 px-3 py-2 text-left shadow-lg shadow-primary/10 supports-backdrop-filter:backdrop-blur-xl"}
          exit={{ opacity: 0, scale: 0.98, y: 6 }}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98, y: 6 }}
          key={status}
          style={prefersReducedMotion ? undefined : { willChange: "transform, opacity" }}
          transition={prefersReducedMotion ? { duration: 0 } : { bounce: 0.04, type: "spring", visualDuration: 0.22 }}
        >
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isListening && !prefersReducedMotion && [0, 0.75].map((delay) => (
              <motion.span
                animate={{ opacity: [0.55, 0], scale: [1, 1.9] }}
                className="absolute inset-0 rounded-full border border-primary/45"
                key={delay}
                style={{ willChange: "transform, opacity" }}
                transition={{ delay, duration: 1.5, ease: "easeOut", repeat: Infinity }}
              />
            ))}
            <VoiceWaveform prefersReducedMotion={prefersReducedMotion} status={status} />
          </span>
          <span className="min-w-0 flex-1 text-xs font-medium leading-4 text-foreground">{label}</span>
          {isVoiceActive && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary" />}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function RtiSahayak() {
  const { language } = usePortalLanguage()
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const copy = chatCopy[language]
  const [isOpen, setIsOpen] = useState(false)
  const [hasScrolledDown, setHasScrolledDown] = useState(false)
  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatusEventDetail>({
    isActive: false,
    label: null,
    status: "idle",
  })
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage(language)])
  const [hasPrivacyNotice, setHasPrivacyNotice] = useState(false)
  /** Messages whose translation was already tried and failed - retrying would loop forever. */
  const [failedTranslations, setFailedTranslations] = useState<ReadonlySet<string>>(() => new Set())
  const [isTranslating, setIsTranslating] = useState(false)
  const safetyIdentifier = useRef(createSafetyIdentifier())
  const activeConversation = useRef(0)
  const portalLanguageRef = useRef(language)
  const translationRunRef = useRef(0)
  const launcherRef = useRef<HTMLDivElement>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  const draftRef = useRef<HTMLTextAreaElement>(null)

  const translationFailed = messages.some(
    (message) =>
      message.text[language] === undefined && failedTranslations.has(getTranslationKey(message, language))
  )

  // Keep every new message in the exact language in which it arrived. Existing chat history is
  // translated only when the applicant deliberately changes the portal language.
  useEffect(() => {
    const previousLanguage = portalLanguageRef.current
    portalLanguageRef.current = language
    const run = translationRunRef.current + 1
    translationRunRef.current = run
    if (previousLanguage === language) {
      return
    }

    const pending = messages.filter((message) => needsTranslation(message, language, failedTranslations))
    if (!pending.length) {
      setIsTranslating(false)
      return
    }

    const targetLanguage = language
    setIsTranslating(true)

    void (async () => {
      let remaining = pending

      while (remaining.length && translationRunRef.current === run) {
        const result = await translateChatMessages({
          texts: remaining.map((message) => getMessageText(message, targetLanguage)),
          language: targetLanguage,
          safetyIdentifier: safetyIdentifier.current,
        })

        if (translationRunRef.current !== run) return

        if (!result) {
          setFailedTranslations((current) => {
            const next = new Set(current)
            remaining.forEach((message) => next.add(getTranslationKey(message, targetLanguage)))
            return next
          })
          break
        }

        const batch = remaining.slice(0, result.translations.length)
        const translated = new Map(result.translations.map((text, index) => [batch[index]?.id, text] as const))
        setMessages((currentMessages) =>
          currentMessages.map((message) => {
            const text = translated.get(message.id)
            return text ? { ...message, text: { ...message.text, [targetLanguage]: text } } : message
          })
        )
        remaining = remaining.slice(batch.length)
      }

      if (translationRunRef.current === run) setIsTranslating(false)
    })()
  }, [language])

  // Grow the box to fit what has been typed instead of making the user scroll inside it.
  // Height is cleared first so the box also shrinks back when text is deleted.
  useLayoutEffect(() => {
    const field = draftRef.current
    if (!field) {
      return
    }

    field.style.height = "auto"
    field.style.height = `${field.scrollHeight}px`
  }, [draft, isOpen])

  // Keep the newest message in view: on send, on reply, and when the panel is reopened.
  useEffect(() => {
    const list = messageListRef.current
    if (list) {
      list.scrollTop = list.scrollHeight
    }
  }, [messages, isSending, isTranslating, isOpen, voiceStatus.status])

  // Keep the launcher clear of the site footer as it enters the viewport, and reveal the
  // back-to-top button once the page has moved about a screenful.
  useEffect(() => {
    const updateFixedChrome = () => {
      const footer = document.querySelector<HTMLElement>("[data-site-footer]")
      const offset = footer ? Math.max(0, Math.round(window.innerHeight - footer.getBoundingClientRect().top)) : 0
      const launcher = launcherRef.current

      if (launcher) {
        launcher.style.bottom = `calc(1.25rem + ${offset}px)`
      }

      setHasScrolledDown(window.scrollY > 400)
    }

    updateFixedChrome()
    window.addEventListener("scroll", updateFixedChrome, { passive: true })
    window.addEventListener("resize", updateFixedChrome)

    return () => {
      window.removeEventListener("scroll", updateFixedChrome)
      window.removeEventListener("resize", updateFixedChrome)
    }
  }, [])

  const startRequestFor = (suggestion: AuthoritySuggestion) => {
    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user")

    setIsOpen(false)
    navigate("/file-with-sahayak", {
      state: {
        initialDescription: latestUserMessage ? getMessageText(latestUserMessage, language) : "",
        initialAuthorityId: suggestion.authorityId,
      },
    })
  }

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })
  }

  const sendMessage = async (rawMessage: string): Promise<string | undefined> => {
    const message = rawMessage.trim()
    if (!message || isSending) {
      return undefined
    }

    setDraft("")

    if (containsSensitiveData(message)) {
      setHasPrivacyNotice(true)
      return copy.privacyNotice
    }

    setHasPrivacyNotice(false)
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      text: localize(language, message),
      sourceLanguage: language,
    }
    const nextMessages = [...messages, userMessage]
    const conversationId = activeConversation.current
    setMessages(nextMessages)
    setIsSending(true)

    const history = nextMessages
      .filter((item) => item.id !== "welcome")
      .slice(-4)
      .map((item) => ({ role: item.role, content: getMessageText(item, language) }))

    try {
      const response = await askRtiSahayak({
        message,
        history,
        language,
        safetyIdentifier: safetyIdentifier.current,
      })

      // Ignore a reply that belonged to a conversation the user has since cleared.
      if (conversationId !== activeConversation.current) {
        return undefined
      }

      const reply = response.reply[language] ?? response.reply.en ?? response.reply.hi ?? ""

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          role: "assistant",
          text: response.reply,
          // The language the answer was asked in, which may no longer be the selected one.
          sourceLanguage: language,
          authoritySuggestions: response.authoritySuggestions,
          source: response.source,
        },
      ])
      return reply
    } finally {
      if (conversationId === activeConversation.current) {
        setIsSending(false)
      }
    }
  }

  const handleVoiceMessage = useEffectEvent(({ message, onError, onReply }: VoiceMessageEventDetail) => {
    setIsOpen(true)

    void sendMessage(message).then((reply) => {
      if (reply) {
        onReply(reply)
      } else {
        onError()
      }
    })
  })

  const handleVoiceTranscript = useEffectEvent(({
    id,
    isDiscarded,
    isFinal = true,
    role,
    text,
    language: transcriptLanguage,
  }: VoiceTranscriptEventDetail) => {
    const transcript = text.trim()
    if (!transcript && !isDiscarded) return

    setIsOpen(true)
    setHasPrivacyNotice(false)
    setMessages((currentMessages) => {
      if (role === "assistant" && id) {
        if (isDiscarded) return currentMessages.filter((message) => message.id !== id)

        const streamedMessage: ChatMessage = {
          id,
          role,
          text: localize(transcriptLanguage, transcript),
          sourceLanguage: transcriptLanguage,
          source: "gemini-live",
          isStreaming: !isFinal,
        }
        const existingIndex = currentMessages.findIndex((message) => message.id === id)
        if (existingIndex === -1) return [...currentMessages, streamedMessage]

        return currentMessages.map((message) => message.id === id ? streamedMessage : message)
      }

      return [
        ...currentMessages,
        {
          id: createMessageId(),
          role,
          text: localize(transcriptLanguage, transcript),
          sourceLanguage: transcriptLanguage,
          source: role === "assistant" ? "gemini-live" : undefined,
        },
      ]
    })
  })

  // Voice requests deliberately pass through sendMessage so their transcript, history, privacy
  // checks and assistant reply are the exact same ones shown in the chat panel.
  useEffect(() => {
    const onVoiceMessage = (event: Event) => {
      handleVoiceMessage((event as CustomEvent<VoiceMessageEventDetail>).detail)
    }
    const onVoiceTranscript = (event: Event) => {
      handleVoiceTranscript((event as CustomEvent<VoiceTranscriptEventDetail>).detail)
    }
    const onVoiceStatus = (event: Event) => {
      setVoiceStatus((event as CustomEvent<VoiceStatusEventDetail>).detail)
    }

    window.addEventListener(VOICE_MESSAGE_EVENT, onVoiceMessage)
    window.addEventListener(VOICE_TRANSCRIPT_EVENT, onVoiceTranscript)
    window.addEventListener(VOICE_STATUS_EVENT, onVoiceStatus)
    return () => {
      window.removeEventListener(VOICE_MESSAGE_EVENT, onVoiceMessage)
      window.removeEventListener(VOICE_TRANSCRIPT_EVENT, onVoiceTranscript)
      window.removeEventListener(VOICE_STATUS_EVENT, onVoiceStatus)
    }
  }, [])

  const clearConversation = () => {
    activeConversation.current += 1
    setFailedTranslations(new Set())
    setMessages([createWelcomeMessage(language)])
    setDraft("")
    setHasPrivacyNotice(false)
    setIsSending(false)
    safetyIdentifier.current = createSafetyIdentifier()
  }

  const submitFromComposer = () => {
    setIsOpen(true)
    void sendMessage(draft)
  }

  const toggleVoiceFromComposer = () => {
    setIsOpen(true)
    requestVoiceToggle()
  }

  const closeComposer = () => {
    if (voiceStatus.isActive) requestVoiceToggle()
    setIsOpen(false)
  }

  const voiceLabel = voiceStatus.label ?? copy.voiceAssistant

  return (
    // items-end keeps the chat panel and its persistent composer aligned to the right edge.
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end" ref={launcherRef}>
      <AnimatePresence initial={false} mode="wait">
      {isOpen ? (
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex flex-col items-end"
          exit={{ opacity: 0, scale: 0.98, y: 12 }}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98, y: 12 }}
          key="rti-sahayak-composer"
          style={{ willChange: "transform, opacity" }}
          transition={prefersReducedMotion ? { duration: 0 } : { bounce: 0.06, type: "spring", visualDuration: 0.32 }}
        >
        <section
          aria-label={copy.name + " chat"}
          className="mb-3 flex h-[min(42rem,calc(100svh/var(--app-scale)-7.5rem))] w-[calc(100vw-2.5rem)] max-w-[34rem] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:w-[34rem]"
        >
          <header className="flex items-start gap-2.5 bg-primary px-3.5 py-2.5 text-primary-foreground">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
              <span aria-hidden="true" className="material-symbols-outlined text-lg">support_agent</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-headline-md text-base font-semibold">{copy.name}</h2>
              <p className="text-[11px] leading-4 text-primary-foreground/75">{copy.subtitle}</p>
            </div>
            <IconTooltip
              label={copy.closeChat}
              render={
                <Button
                  aria-label={copy.closeChat}
                  className="shrink-0 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
                  onClick={closeComposer}
                  size="icon-sm"
                  variant="ghost"
                />
              }
              side="left"
            >
              <span aria-hidden="true" className="material-symbols-outlined">close</span>
            </IconTooltip>
          </header>

          <div className="border-b border-border bg-muted/40 px-3.5 py-1.5 text-[11px] leading-4 text-muted-foreground">
            <span aria-hidden="true" className="material-symbols-outlined mr-1 align-[-2px] text-sm">shield</span>
            {copy.privacyWarning}
          </div>

          <div className="border-b border-border bg-background px-3.5 py-2">
            <Link className="group flex w-full items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-2 text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2" onClick={closeComposer} to="/file-with-sahayak">
              <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><span className="material-symbols-outlined text-sm">auto_awesome</span></span>
              <span className="min-w-0 flex-1 text-xs font-semibold leading-4">{copy.guidedFiling}</span>
              <span aria-hidden="true" className="material-symbols-outlined shrink-0 text-base transition-transform group-hover:translate-x-0.5">arrow_forward</span>
            </Link>
          </div>

          <div aria-live="polite" className="flex-1 space-y-2.5 overflow-y-auto bg-muted/20 p-3" ref={messageListRef}>
            {messages.map((message) => (
              <div
                className={message.role === "user" ? "ml-6 whitespace-pre-wrap rounded-xl rounded-br-sm bg-primary px-3 py-2 text-sm leading-5 text-primary-foreground" : "mr-2 rounded-xl rounded-bl-sm border border-border bg-background px-3 py-2 text-sm leading-5 text-foreground shadow-sm"}
                key={message.id}
              >
                {message.role === "assistant"
                  ? <FormattedMessage content={getMessageText(message, language)} />
                  : getMessageText(message, language)}
                {message.role === "assistant" && message.isStreaming && (
                  <motion.span
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [0.35, 1, 0.35] }}
                    aria-hidden="true"
                    className="ml-1 inline-flex align-middle text-primary"
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 1, ease: "easeInOut", repeat: Infinity }}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-sm">more_horiz</span>
                  </motion.span>
                )}
                {message.role === "assistant" && message.authoritySuggestions && (
                  <AuthorityMatches copy={copy} onFileRti={startRequestFor} suggestions={message.authoritySuggestions} />
                )}
              </div>
            ))}
            <VoiceFeedback inChat label={voiceStatus.label} prefersReducedMotion={prefersReducedMotion} status={voiceStatus.status} />
            {isTranslating && (
              <div className="flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                <span aria-hidden="true" className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                {copy.translating}
              </div>
            )}
            {isSending && (
              <div className="mr-5 flex w-fit items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
                <span aria-hidden="true" className="material-symbols-outlined animate-pulse text-base">more_horiz</span>
                {copy.preparing}
              </div>
            )}
          </div>

          <div className="border-t border-border bg-background p-3">
            {messages.length === 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {copy.suggestions.map((suggestion) => (
                  <button
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSending}
                    key={suggestion}
                    onClick={() => void sendMessage(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {hasPrivacyNotice && (
              <p className="mb-2 rounded-md bg-destructive/10 px-2.5 py-2 text-xs leading-4 text-destructive" role="alert">
                {copy.privacyNotice}
              </p>
            )}

            {translationFailed && !isTranslating && (
              <p className="mb-2 rounded-md bg-muted px-2.5 py-2 text-xs leading-4 text-muted-foreground">
                {copy.translationFailed}
              </p>
            )}

            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <Link className="rounded-md px-2 py-1 font-medium text-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" to="/faq">{copy.browseFaqs}</Link>
              <button className="rounded-md px-2 py-1 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" onClick={clearConversation} type="button">{copy.clearChat}</button>
            </div>
          </div>
        </section>

      <form
        aria-label={copy.name}
        className="flex w-[calc(100vw-2.5rem)] max-w-[34rem] items-end gap-1.5 rounded-2xl border border-border bg-background p-1.5 shadow-xl shadow-black/10 sm:w-[34rem]"
        onSubmit={(event) => {
          event.preventDefault()
          submitFromComposer()
        }}
      >
        <span aria-hidden="true" className="mb-1.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-lg">support_agent</span>
        </span>
        <label className="sr-only" htmlFor="rti-sahayak-message">{copy.askLabel}</label>
        <textarea
          className="max-h-28 min-h-10 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-2 text-sm leading-5 outline-none placeholder:text-muted-foreground focus-visible:outline-none"
          disabled={isSending}
          id="rti-sahayak-message"
          maxLength={700}
          onChange={(event) => setDraft(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            // Enter sends, Shift+Enter starts a new line. isComposing guards Indic and other
            // IME input, where Enter is how a candidate word gets committed.
            if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
            event.preventDefault()
            submitFromComposer()
          }}
          placeholder={copy.placeholder}
          ref={draftRef}
          rows={1}
          value={draft}
        />
        <IconTooltip
          label={voiceLabel}
          render={
            <Button
              aria-label={voiceLabel}
              aria-pressed={voiceStatus.isActive}
              className={voiceStatus.isActive ? "mb-0.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" : "mb-0.5 rounded-xl"}
              onClick={toggleVoiceFromComposer}
              size="icon"
              type="button"
              variant={voiceStatus.isActive ? "default" : "ghost"}
            />
          }
        >
          <span className="relative flex size-5 items-center justify-center">
            {voiceStatus.status === "listening" && !prefersReducedMotion && (
              <motion.span
                animate={{ opacity: [0.5, 0], scale: [1, 1.6] }}
                aria-hidden="true"
                className="absolute inset-0 rounded-full border border-current"
                style={{ willChange: "transform, opacity" }}
                transition={{ duration: 1.25, ease: "easeOut", repeat: Infinity }}
              />
            )}
            {voiceStatus.isActive
              ? <VoiceWaveform compact prefersReducedMotion={prefersReducedMotion} status={voiceStatus.status} />
              : <span aria-hidden="true" className="material-symbols-outlined">mic</span>}
          </span>
        </IconTooltip>
        <IconTooltip
          label={copy.sendMessage}
          render={<Button aria-label={copy.sendMessage} className="mb-0.5 rounded-xl" disabled={!draft.trim() || isSending} size="icon" type="submit" />}
        >
          <span aria-hidden="true" className="material-symbols-outlined">send</span>
        </IconTooltip>
      </form>
        </motion.div>
      ) : (
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex flex-col items-end"
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
          key="rti-sahayak-launcher"
          style={{ willChange: "transform, opacity" }}
          transition={prefersReducedMotion ? { duration: 0 } : { bounce: 0.04, type: "spring", visualDuration: 0.24 }}
        >
          {hasScrolledDown ? (
            <IconTooltip
              label={copy.backToTop}
              render={
                <Button
                  aria-label={copy.backToTop}
                  className="mb-3 size-12 rounded-full border-primary-foreground/25 bg-primary/55 text-primary-foreground shadow-lg shadow-primary/20 supports-backdrop-filter:backdrop-blur-xl supports-backdrop-filter:backdrop-saturate-150 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
                  onClick={scrollToTop}
                  size="icon-lg"
                />
              }
              side="left"
            >
              <span aria-hidden="true" className="material-symbols-outlined">arrow_upward</span>
            </IconTooltip>
          ) : null}

          <Button
            aria-expanded={false}
            aria-label={copy.openChat}
            className="group/sahayak h-12 w-12 justify-start gap-0 overflow-hidden rounded-full border-primary-foreground/25 bg-primary/55 px-0 text-primary-foreground shadow-lg shadow-primary/20 transition-[width,background-color,box-shadow] duration-200 ease-out hover:w-[9.25rem] hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 focus-visible:w-[9.25rem] motion-reduce:transition-none supports-backdrop-filter:backdrop-blur-xl supports-backdrop-filter:backdrop-saturate-150"
            onClick={() => setIsOpen(true)}
            size="lg"
          >
            <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center">
              <span className="material-symbols-outlined">support_agent</span>
            </span>
            <span className="max-w-0 overflow-hidden whitespace-nowrap pr-0 opacity-0 transition-[max-width,opacity,padding] duration-200 ease-out group-hover/sahayak:max-w-28 group-hover/sahayak:pr-3 group-hover/sahayak:opacity-100 group-focus-visible/sahayak:max-w-28 group-focus-visible/sahayak:pr-3 group-focus-visible/sahayak:opacity-100 motion-reduce:transition-none">
              {copy.name}
            </span>
          </Button>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
