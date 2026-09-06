import {
  findAuthoritySuggestions,
  findUnresolvedShortForms,
  type AuthoritySuggestion,
} from "@/services/authority-recommendations"

export type ChatRole = "assistant" | "user"
export type RtiSahayakLanguage = "en" | "hi"

export type ChatHistoryMessage = {
  role: ChatRole
  content: string
}

/**
 * One message held in every language it is known in. Text the portal itself writes is filled in
 * for both at once; text the model wrote exists in one language until it is translated.
 */
export type LocalizedText = Partial<Record<RtiSahayakLanguage, string>>

export type RtiSahayakReply = {
  reply: LocalizedText
  source: "gpt-5.6-luna" | "local"
  authoritySuggestions: AuthoritySuggestion[]
}

/** A prepared filing never contains profile data. The authority candidates come from the local directory. */
export type FilingPreparation = {
  authoritySuggestions: AuthoritySuggestion[]
  selectedAuthorityIndex: number
}

export type TranslationResult = {
  /**
   * Translations for the first N of the texts given, in order. A batch that would be too large
   * is cut short here rather than sent whole; the caller translates the remainder on a later pass.
   */
  translations: string[]
}

/**
 * Kept in step with the same limits in api/rti-sahayak.js, which rejects an oversized batch.
 * The character budget is what one response window can hold once translated, not a preference:
 * a batch that needs a larger window than the account can pay for is refused outright.
 */
const MAX_TRANSLATION_SEGMENTS = 12
const MAX_TRANSLATION_BATCH_CHARS = 1600

/**
 * A message is refused when one of these matches. Every value pattern requires a digit, because
 * a real registration number, account number, OTP or PIN always has one while the word that
 * follows "registration number" in an ordinary question - "again", "online", "format" - never
 * does. Without that, asking how to find a registration number was refused as if it were one.
 */
const sensitivePatterns = [
  /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i,
  // Aadhaar is 12 digits and never starts below 2, so the 13-19 digit card rule misses it.
  /\b[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}\b/,
  /\b(?:\d[ -]?){13,19}\b/,
  // Separators allowed inside: the portal itself writes a mobile as "+91 98765 43210".
  /\b(?:\+?91[\s-]?)?[6-9](?:[ -]?\d){9}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  // A stated password needs an explicit is/:/=, or "my password is wrong" is refused as one.
  /\b(?:password|passcode|passphrase)\s*(?:is|:|=)\s*(?=\S*[\d@#$%^&*!])\S{4,}/i,
  // "pin code" is a postal code, not a secret, and belongs in the form rather than in chat.
  /\b(?:otp|cvv|upi\s*pin|pin(?!\s*code))\s*(?:is|:|=|-)?\s*(?=[A-Z0-9]*\d)[A-Z0-9]{3,}\b/i,
  /\b(?:registration|application|request)\s*(?:number|no\.?|#)\s*(?:is|:|=|-)?\s*(?=[A-Z0-9/-]*\d)[A-Z0-9/-]{5,}\b/i,
  /\b(?:bank\s*account|account\s*number|ifsc)\s*(?:is|:|=|-)?\s*(?=[A-Z0-9/-]*\d)[A-Z0-9/-]{5,}\b/i,
]

export function containsSensitiveData(text: string) {
  return sensitivePatterns.some((pattern) => pattern.test(text))
}

function getShortFormClarification(shortForms: string[]) {
  const list = shortForms.map((shortForm) => "'" + shortForm + "'").join(", ")
  const question = shortForms.length === 1 ? "does it stand for" : "do they stand for"
  return "I could not identify " + list + " as a public-authority subject. What " + question + " in your case? Please spell it out without sharing personal or application details. I will then briefly explain the relevant department and suggest the most appropriate Central Public Authority."
}

/**
 * Step 1 uses the official local directory only. The selected authority is
 * deliberately sent to the model in Step 2, where the model produces the
 * subject and RTI request text.
 */
export async function prepareRtiFiling({
  description,
}: {
  description: string
  language: RtiSahayakLanguage
  safetyIdentifier: string
}): Promise<FilingPreparation> {
  const trimmed = description.trim()

  if (!trimmed || containsSensitiveData(trimmed)) {
    throw new Error("sensitive")
  }

  const authoritySuggestions = await findAuthoritySuggestions(trimmed).catch(() => [])

  return {
    authoritySuggestions,
    selectedAuthorityIndex: 0,
  }
}

export async function prepareAuthorityDraft({
  authority,
  description,
  language,
  safetyIdentifier,
}: {
  authority: AuthoritySuggestion
  description: string
  language: RtiSahayakLanguage
  safetyIdentifier: string
}) {
  const trimmed = description.trim()

  if (!trimmed || containsSensitiveData(trimmed)) {
    throw new Error("sensitive")
  }

  const response = await fetch("/api/rti-sahayak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task: "authority-draft",
      description: trimmed,
      language,
      safetyIdentifier,
      authoritySuggestions: [authority],
      selectedAuthorityIndex: 0,
    }),
  })

  const data = (await response.json().catch(() => ({}))) as {
    error?: unknown
    subject?: unknown
    requestText?: unknown
  }

  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "RTI Sahayak service is unavailable")
  }

  const subject = typeof data.subject === "string" ? data.subject : ""
  const requestText = typeof data.requestText === "string" ? data.requestText : ""

  if (!subject || subject.length > 120 || !requestText || requestText.length > 3000) {
    throw new Error("RTI Sahayak returned an invalid draft")
  }

  return { subject, requestText }
}

function getHindiLocalReply(message: string, suggestions: AuthoritySuggestion[]): string {
  const query = message.toLowerCase()

  if (suggestions.length) {
    const subject = suggestions[0].matchReason

    return (subject ? "आपका प्रश्न " + subject + " विषय से सबसे अधिक मेल खाता है। " : "") +
      "नीचे दिए गए केंद्रीय लोक प्राधिकरण इस विषय को संभालते हैं। आवेदन करने से पहले लोक प्राधिकरण निर्देशिका में पुष्टि करें कि सूचना किस कार्यालय के पास है। ये केवल सुझाव हैं, अंतिम कानूनी निर्णय नहीं।"
  }

  if (/(first appeal|1st appeal|प्रथम अपील|पहली अपील)/u.test(query)) {
    return "प्रथम अपील दर्ज करने के लिए ‘प्रथम अपील दर्ज करें’ चुनें और मूल ऑनलाइन आरटीआई आवेदन में उपयोग की गई पंजीकरण संख्या तथा ईमेल आईडी सुरक्षित अपील फॉर्म में भरें। प्रथम अपील के लिए कोई शुल्क नहीं है। ये विवरण यहाँ साझा न करें।"
  }

  if (/(second appeal|2nd appeal|द्वितीय अपील|दूसरी अपील)/u.test(query)) {
    return "द्वितीय अपील उन मामलों के लिए है जिनमें आप प्रथम अपीलीय प्राधिकारी के निर्णय से संतुष्ट नहीं हैं। आरटीआई सहायक प्रक्रिया समझा सकता है; अपने मामले के विवरण के लिए आधिकारिक अपील फॉर्म का उपयोग करें।"
  }

  if (/(fee|payment|upi|debit|credit|bpl|money|deducted|शुल्क|भुगतान|कटा)/u.test(query)) {
    return "गैर-बीपीएल आवेदक आवेदन फॉर्म पूरा करने के बाद निर्धारित आरटीआई शुल्क देते हैं। पोर्टल एसबीआई इंटरनेट बैंकिंग, एसबीआई डेबिट कार्ड, मास्टर/वीज़ा कार्ड और यूपीआई का समर्थन करता है। बीपीएल आवेदक शुल्क नहीं देते, लेकिन आधिकारिक फॉर्म में आवश्यक बीपीएल प्रमाणपत्र संलग्न करते हैं। भुगतान कटने पर भी पंजीकरण संख्या न बने तो भुगतान मिलान का उपयोग करें और सहायता लेने से पहले 24-48 कार्य घंटे प्रतीक्षा करें।"
  }

  if (/(status|track|reply|registration|स्थिति|ट्रैक|पंजीकरण)/u.test(query)) {
    return "ऑनलाइन आरटीआई आवेदन या प्रथम अपील की स्थिति अथवा उत्तर ‘स्थिति देखें’ से देखा जा सकता है। गोपनीयता के लिए पंजीकरण संख्या, ईमेल या ओटीपी चैट में भेजने के बजाय सुरक्षित स्थिति प्रक्रिया का उपयोग करें।"
  }

  if (/(state|central|public authority|ministry|department|राज्य|केंद्रीय|लोक प्राधिकरण|मंत्रालय|विभाग)/u.test(query)) {
    return "यह आरटीआई ऑनलाइन पोर्टल केवल केंद्र सरकार के मंत्रालयों, विभागों और सूचीबद्ध केंद्रीय लोक प्राधिकरणों के लिए है। दिल्ली के राष्ट्रीय राजधानी क्षेत्र सहित राज्य लोक प्राधिकरणों के आवेदन इस पोर्टल पर दर्ज नहीं किए जाने चाहिए।"
  }

  if (/(file|submit|request|apply|दर्ज|आवेदन|अनुरोध)/u.test(query)) {
    return "आरटीआई अनुरोध ‘अनुरोध दर्ज करें’ से सीधे दायर किया जा सकता है; खाता बनाना अनिवार्य नहीं है। फॉर्म में अनुरोध का पाठ 3,000 वर्णों तक भरा जा सकता है। लंबा अनुरोध हो तो आधिकारिक फॉर्म के सहायक दस्तावेज़ क्षेत्र से पीडीएफ संलग्न करें।"
  }

  if (/(document|upload|attachment|supporting|दस्तावेज|अपलोड|संलग्न)/u.test(query)) {
    return "यदि किसी लोक प्राधिकरण ने सहायक दस्तावेज़ मांगा है, तो सुरक्षित पोर्टल में ‘स्थिति देखें’ खोलें। आवेदन की स्थिति में दस्तावेज़ अपलोड करने का विकल्प दिखेगा। दस्तावेज़ चैट में न भेजें और न चिपकाएँ।"
  }

  return "मैं आरटीआई आवेदन, शुल्क, प्रथम या द्वितीय अपील, केंद्रीय लोक प्राधिकरण चुनने और ‘स्थिति देखें’ के बारे में सहायता कर सकता हूँ। समस्या को सामान्य शब्दों में लिखें, मैं संभावित विभागों का सुझाव दूँगा। व्यक्तिगत विवरण, पंजीकरण संख्या, ओटीपी, भुगतान विवरण या दस्तावेज़ साझा न करें।"
}

function getLocalReply(message: string, suggestions: AuthoritySuggestion[], language: RtiSahayakLanguage): string {
  if (language === "hi") {
    return getHindiLocalReply(message, suggestions)
  }

  const query = message.toLowerCase()

  if (suggestions.length) {
    const subject = suggestions[0].matchReason

    return (subject ? "Your question looks closest to " + subject + ". " : "") +
      "The Central Public Authorities below are the ones that handle that subject. Please open the directory to confirm which office holds the information before filing. These are suggestions, not a final legal determination."
  }

  if (/(first appeal|1st appeal)/.test(query)) {
    return "To file a First Appeal, choose Submit First Appeal and enter the registration number and email ID used for the original online RTI application. No fee is required for a First Appeal. Please use the secure appeal form for those details - do not share them here."
  }

  if (/(second appeal|2nd appeal)/.test(query)) {
    return "A Second Appeal is for cases where you are dissatisfied with the First Appellate Authority's decision. RTI Sahayak can explain the process, but please use the official appeal form for case-specific details."
  }

  if (/(fee|payment|upi|debit|credit|bpl|money|deducted)/.test(query)) {
    return "A non-BPL applicant pays the prescribed RTI fee after completing the request form. The portal supports SBI internet banking, SBI debit card, Master/Visa cards, and UPI. BPL applicants do not pay the RTI fee, but must attach the required BPL certificate in the official form. If money was deducted but no registration number was generated, use Payment Reconciliation and wait 24-48 working hours before escalating."
  }

  if (/(status|track|reply|registration)/.test(query)) {
    return "You can view the status or reply for an online RTI application or First Appeal from View Status. For privacy, use the secure status journey rather than sending a registration number, email address, or OTP in this chat."
  }

  if (/(state|central|public authority|ministry|department)/.test(query)) {
    return "This RTI Online portal is for Central Government Ministries, Departments, and listed Central Public Authorities. Requests to State Public Authorities, including NCT of Delhi, should not be filed through this portal."
  }

  if (/(file|submit|request|apply)/.test(query)) {
    return "You can file an RTI request directly from Submit Request; creating an account is not mandatory. Enter the request text in the form (up to 3,000 characters) and upload a supporting PDF through the official form if it is longer."
  }

  if (/(document|upload|attachment|supporting)/.test(query)) {
    return "If a Public Authority asks for supporting documents, open View Status through the secure portal. The application status will show the option to upload the requested document. Please do not upload or paste documents in chat."
  }

  return "I can help with RTI filing, fees, First or Second Appeals, selecting a Central Public Authority, and using View Status. Describe the issue in general terms and I will suggest possible departments. Do not share personal details, registration numbers, OTPs, payment details, or documents."
}

export async function askRtiSahayak({
  message,
  history,
  language,
  safetyIdentifier,
}: {
  message: string
  history: ChatHistoryMessage[]
  language: RtiSahayakLanguage
  safetyIdentifier: string
}): Promise<RtiSahayakReply> {
  if (containsSensitiveData(message)) {
    return {
      // Written by the portal, so both languages are known without asking the model.
      reply: {
        en: "For your privacy, I have not sent that message. Please do not share personal details, registration numbers, OTPs, payment details, passwords, or documents here. Use the secure portal journey for account- or application-specific help.",
        hi: "आपकी गोपनीयता के लिए वह संदेश भेजा नहीं गया। व्यक्तिगत विवरण, पंजीकरण संख्या, ओटीपी, भुगतान विवरण, पासवर्ड या दस्तावेज़ यहाँ साझा न करें। खाते या आवेदन से जुड़ी सहायता के लिए सुरक्षित पोर्टल प्रक्रिया का उपयोग करें।",
      },
      source: "local",
      authoritySuggestions: [],
    }
  }

  const authoritySuggestions = await findAuthoritySuggestions(message).catch(() => [])
  const unresolvedShortForms = await findUnresolvedShortForms(message).catch(() => [])

  if (unresolvedShortForms.length) {
    const clarification = getShortFormClarification(unresolvedShortForms)
    return {
      reply: { en: clarification, hi: clarification },
      source: "local",
      authoritySuggestions: [],
    }
  }

  try {
    const response = await fetch("/api/rti-sahayak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history,
        language,
        safetyIdentifier,
        authoritySuggestions,
      }),
    })

    if (!response.ok) {
      throw new Error("RTI Sahayak service is unavailable")
    }

    const data = (await response.json()) as { reply?: unknown }
    if (typeof data.reply !== "string" || !data.reply.trim()) {
      throw new Error("RTI Sahayak returned an empty response")
    }

    return {
      reply: { [language]: data.reply.trim() },
      source: "gpt-5.6-luna",
      authoritySuggestions,
    }
  } catch {
    return {
      // The local reply is written from a fixed script, so both languages cost nothing here and
      // the fallback answer survives a language switch even while the service is unreachable.
      reply: {
        en: getLocalReply(message, authoritySuggestions, "en"),
        hi: getLocalReply(message, authoritySuggestions, "hi"),
      },
      source: "local",
      authoritySuggestions,
    }
  }
}

/**
 * Translates messages already on screen into the newly selected portal language. Returns null
 * when the translation cannot be trusted - the caller then keeps showing the original text,
 * which reads in the wrong language but is never the wrong words.
 */
export async function translateChatMessages({
  texts,
  language,
  safetyIdentifier,
}: {
  texts: string[]
  language: RtiSahayakLanguage
  safetyIdentifier: string
}): Promise<TranslationResult | null> {
  const batch: string[] = []
  let remainingChars = MAX_TRANSLATION_BATCH_CHARS

  for (const text of texts) {
    // A single message longer than the whole budget still goes, alone, rather than never.
    if (batch.length && (batch.length >= MAX_TRANSLATION_SEGMENTS || text.length > remainingChars)) {
      break
    }

    batch.push(text)
    remainingChars -= text.length
  }

  if (!batch.length) {
    return null
  }

  try {
    const response = await fetch("/api/rti-sahayak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: "translate", texts: batch, language, safetyIdentifier }),
    })

    if (!response.ok) {
      throw new Error("RTI Sahayak could not translate the conversation")
    }

    const data = (await response.json()) as { translations?: unknown }
    const translations = data.translations

    if (
      !Array.isArray(translations) ||
      translations.length !== batch.length ||
      translations.some((item) => typeof item !== "string" || !item.trim())
    ) {
      throw new Error("RTI Sahayak returned a mismatched translation")
    }

    return { translations: (translations as string[]).map((item) => item.trim()) }
  } catch {
    return null
  }
}
