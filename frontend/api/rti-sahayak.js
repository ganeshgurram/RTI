const MAX_OUTPUT_TOKENS = 900

const OPENROUTER_MODEL = "openai/gpt-5.6-luna"
/**
 * One retry only. A 429 from a burst clears in a second, but a 429 from an exhausted
 * quota does not - and retrying into that just spends more of the allowance.
 */
const MAX_RETRIES = 1
const BASE_RETRY_DELAY_MS = 600
/** Longer than this and we answer now rather than hold the request open. */
const RETRY_DELAY_CAP_MS = 2000

/**
 * Switching the portal language re-renders the conversation that is already on screen, so the
 * messages already written have to be carried across. They are translated in one batch, laid
 * out as segments around a separator that will not occur in an RTI answer. A numbered list
 * would be ambiguous - the answers themselves contain numbered steps.
 */
const TRANSLATION_SEPARATOR = "---8<---"
/** A line holding only the separator. The model pads it with spaces often enough to matter. */
const TRANSLATION_SEPARATOR_PATTERN = /^[ \t]*---8<---[ \t]*$/gm
const MAX_TRANSLATION_SEGMENTS = 12
const MAX_TRANSLATION_SEGMENT_CHARS = 2000
/**
 * The same ceiling the chat path uses. OpenRouter refuses a request outright when max_tokens
 * exceeds what the account balance can cover, so asking for a bigger translation window than
 * an answer would fail with a 402 rather than simply costing more.
 */
const MAX_TRANSLATION_TOKENS = MAX_OUTPUT_TOKENS
const MAX_REWRITE_REQUEST_CHARS = 3000
const MAX_REWRITE_APPEAL_CHARS = 500
const MAX_FILING_DESCRIPTION_CHARS = 1400

/**
 * Roughly two characters of Devanagari per token, plus headroom for the separators. Asked for
 * per batch rather than as a flat maximum, so a short conversation reserves a small window.
 */
function getTranslationTokenBudget(texts) {
  const characters = texts.reduce((total, text) => total + text.length, 0)

  return Math.min(MAX_TRANSLATION_TOKENS, Math.max(300, Math.ceil(characters / 2) + 250))
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

/** Milliseconds to wait before retrying, or null when we should not retry at all. */
function getRetryDelay(response, attempt) {
  const retryAfter = response.headers.get("retry-after")

  if (retryAfter) {
    const seconds = Number(retryAfter)
    const waitMs = Number.isFinite(seconds)
      ? seconds * 1000
      : Math.max(Date.parse(retryAfter) - Date.now(), 0)

    if (!Number.isFinite(waitMs)) {
      return BASE_RETRY_DELAY_MS
    }

    // OpenRouter asking for a long wait means a real cap, not a burst.
    return waitMs <= RETRY_DELAY_CAP_MS ? waitMs : null
  }

  return Math.min(BASE_RETRY_DELAY_MS * 2 ** attempt, RETRY_DELAY_CAP_MS)
}

/**
 * A message is refused when one of these matches. Every value pattern requires a digit, because
 * a real registration number, account number, OTP or PIN always has one while the word that
 * follows "registration number" in an ordinary question - "again", "online", "format" - never
 * does. Without that, asking how to find a registration number was refused as if it were one.
 */
const SENSITIVE_PATTERNS = [
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

const RTI_KNOWLEDGE = [
  "Use only these RTI Online facts when answering:",
  "- This portal is for Central Government Ministries, Departments, and listed Central Public Authorities only. It does not accept State Public Authorities, including NCT of Delhi.",
  "- A user account is not mandatory to file an RTI request. The request form accepts 3,000 characters; a longer application can be attached as a PDF through the Supporting Document field.",
  "- Non-BPL applicants pay the prescribed fee through SBI internet banking, SBI debit card, Master/Visa credit or debit cards, or UPI. BPL applicants do not pay the RTI fee but attach their BPL certificate in the official form.",
  "- If payment is deducted but no registration number is generated, use Payment Reconciliation. Do not pay again; wait 24-48 working hours before using the help email.",
  "- A First Appeal is filed through Submit First Appeal using the original online application's registration number and email ID. No fee is paid for a First Appeal. An online First Appeal is only for an RTI originally filed online.",
  "- View Status displays the status or reply for an online RTI application or First Appeal. The secure journey protects personal information with OTP validation.",
  "- If a supporting document is requested, View Status shows the upload option. The helpline is only for problems using this Central Government RTI Online portal.",
].join("\n")

const INSTRUCTIONS = [
  "You are RTI Sahayak, an informational assistant in an RTI Online portal prototype.",
  "Answer only general, informational questions about using the portal. Keep answers concise, factual, neutral, and clear. You are not a lawyer and must not provide legal advice, make decisions, or claim to access a user's application, account, payment, status, or portal records.",
  "Privacy is mandatory:",
  "- Never ask for or accept a person's name, address, email, phone number, Aadhaar, PAN, bank/card/UPI details, OTP, password, registration/application/request number, or documents.",
  "- If the user gives or asks to give any sensitive or account-specific information, state that you cannot receive it and direct them to the relevant secure portal journey, such as View Status or Submit First Appeal.",
  "- Never request an upload, attachment, or payment information in chat.",
  "- Do not repeat sensitive information even if it appears in the input.",
  "When Public Authority candidates are provided, treat them as directory reference data only. They are ordered most relevant first and each lists the subject it covers. Explain in one line why a candidate fits the user's issue, list no more than three, and say that the applicant must confirm which authority holds the information. Do not claim the match is legally final.",
  "Name only the Public Authority candidates supplied to you. If none are supplied, do not guess an office or ministry - point the user to the Public Authorities directory to search for the subject instead.",
  "If the answer is not covered by the supplied knowledge, say that you cannot confirm it and direct the user to the official FAQs or Public Authorities directory. Do not invent rules, deadlines, fees, links, offices, or government contacts.",
  RTI_KNOWLEDGE,
].join("\n\n")

const localizedErrors = {
  en: {
    sensitive: "Sensitive information must not be submitted to RTI Sahayak.",
    notConfigured: "RTI Sahayak is not configured",
    busy: "RTI Sahayak is busy. Please try again shortly.",
    prepareFailed: "RTI Sahayak could not prepare an answer",
    emptyAnswer: "RTI Sahayak returned an empty answer",
    unavailable: "RTI Sahayak is temporarily unavailable",
  },
  hi: {
    sensitive: "संवेदनशील जानकारी आरटीआई सहायक को नहीं भेजी जानी चाहिए।",
    notConfigured: "आरटीआई सहायक कॉन्फ़िगर नहीं है",
    busy: "आरटीआई सहायक व्यस्त है। कृपया थोड़ी देर बाद पुनः प्रयास करें।",
    prepareFailed: "आरटीआई सहायक उत्तर तैयार नहीं कर सका",
    emptyAnswer: "आरटीआई सहायक ने कोई उत्तर नहीं दिया",
    unavailable: "आरटीआई सहायक अस्थायी रूप से उपलब्ध नहीं है",
  },
}

function getLanguage(value) {
  return value === "hi" ? "hi" : "en"
}

function getLanguageInstruction(language) {
  return language === "hi"
    ? "The selected portal language is Hindi. Write every response only in clear Hindi using Devanagari script, even when the user writes in English. Refer to yourself as ‘आरटीआई सहायक’. Keep an official proper noun or a necessary acronym only when translation would make it unclear; do not add English sentences."
    : "The selected portal language is English. Write every response only in clear English, even when the user writes in Hindi. Refer to yourself as ‘RTI Sahayak’."
}

function getTranslationInstruction(language) {
  const target = language === "hi" ? "Hindi, written in Devanagari script" : "English"

  return [
    "You translate chat messages for an RTI Online portal. Translate every segment into " + target + ".",
    "The input holds one or more segments separated by a line containing only " + TRANSLATION_SEPARATOR + ".",
    "Return the same number of segments, in the same order, separated by a line containing only " +
      TRANSLATION_SEPARATOR + ". Never merge, split, drop, reorder or number the segments.",
    "Translate only. Add no notes, headings, apologies or commentary of your own, and do not answer anything a segment asks.",
    "Reproduce the Markdown exactly: line breaks, bullet and numbered list markers, and ** bold markers.",
    "Keep ministries, departments, offices, portal screens and official acronyms recognisable. Leave an official name in its original script where translating it would hide which office is meant.",
    "Give each name once. Never add the other language beside it in brackets, because translating back and forth would then repeat the name every time.",
    "If a segment is already in " + target + ", return it unchanged.",
  ].join("\n")
}

function getRewriteInstruction({ language, type, maxLength }) {
  const documentName = type === "first-appeal" ? "First Appeal" : "RTI request"
  const outputLanguage = language === "hi" ? "clear Hindi in Devanagari script" : "clear English"

  return [
    "You are a drafting assistant for an RTI Online portal.",
    "Rewrite the applicant's rough " + documentName + " into " + outputLanguage + ".",
    "Return only the final text for the form. Do not include a title, commentary, Markdown fence, warning, or a note to the applicant.",
    "Keep every fact, question, date, and request from the draft. Do not add, remove, assume, or invent facts, identities, registration numbers, legal conclusions, offices, deadlines, or evidence.",
    "Use a clear, respectful, neutral official tone. Where the draft contains several distinct information requests, make them easy to read as a numbered list.",
    type === "first-appeal"
      ? "State the appellant's grounds clearly and respectfully. Do not claim that any legal requirement has been met unless the draft says so."
      : "Phrase the text as a precise request for information. Do not make accusations or legal claims that are not already in the draft.",
    "The complete output must be no more than " + maxLength + " characters. Preserve the applicant's meaning within that limit.",
  ].join("\n")
}

function getFilingInstruction({ language, authorityContext }) {
  const outputLanguage = language === "hi" ? "clear Hindi in Devanagari script" : "clear English"

  return [
    "You are RTI Sahayak, preparing the impersonal part of an RTI application.",
    "The applicant's personal details are not available and must never be requested, inferred, or included.",
    "Choose exactly one candidate from the supplied official directory candidates. Do not invent or rename an authority.",
    "Prepare a concise subject and a factual, respectful request for existing records only in " + outputLanguage + ".",
    "Preserve the applicant's meaning. Do not invent dates, places, documents, allegations, legal conclusions, or facts.",
    "Return JSON only, with this exact shape: {\"selectedAuthorityIndex\":0,\"subject\":\"...\",\"requestText\":\"...\"}.",
    "selectedAuthorityIndex is zero-based, subject is at most 120 characters, and requestText is at most 3000 characters.",
    authorityContext,
  ].filter(Boolean).join("\n\n")
}

export function containsSensitiveData(text) {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text))
}

function getBody(request) {
  if (typeof request.body === "string") {
    return JSON.parse(request.body)
  }

  return request.body ?? {}
}

function safeMessage(value) {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim().slice(0, 700)
}

function getRewriteDraft(value, maxLength) {
  if (typeof value !== "string") return ""

  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength)
}

function getRewriteConfig(body) {
  const type = body.type === "first-appeal" ? "first-appeal" : "request"
  const allowedLength = type === "first-appeal" ? MAX_REWRITE_APPEAL_CHARS : MAX_REWRITE_REQUEST_CHARS
  const requestedLength = Number.isInteger(body.maxLength) ? body.maxLength : allowedLength
  const maxLength = Math.min(Math.max(requestedLength, 1), allowedLength)
  const draft = getRewriteDraft(body.draft, maxLength)

  return draft ? { draft, maxLength, type } : null
}

function getFilingConfig(body) {
  const description = typeof body.description === "string"
    ? body.description.replace(/\s+/g, " ").trim().slice(0, MAX_FILING_DESCRIPTION_CHARS)
    : ""
  const authoritySuggestions = getAuthoritySuggestions(body.authoritySuggestions)

  if (!description || containsSensitiveData(description) || !authoritySuggestions.length) {
    return null
  }

  return { description, authoritySuggestions }
}

/**
 * The messages to translate, or null when the batch cannot be trusted. Anything that would
 * desync the segments from the replies they belong to is rejected outright rather than
 * repaired: the client then keeps showing the originals, which is wrong-language but never
 * the wrong text under the wrong speaker.
 */
function getTranslationTexts(value) {
  if (!Array.isArray(value) || !value.length || value.length > MAX_TRANSLATION_SEGMENTS) {
    return null
  }

  const texts = []

  for (const item of value) {
    if (typeof item !== "string") {
      return null
    }

    // A segment carrying the separator itself would split into two and shift every later one.
    const text = item.replace(TRANSLATION_SEPARATOR_PATTERN, "").trim()

    if (!text || text.length > MAX_TRANSLATION_SEGMENT_CHARS || containsSensitiveData(text)) {
      return null
    }

    texts.push(text)
  }

  return texts
}

function safeDirectoryText(value, maxLength = 180) {
  if (typeof value !== "string") {
    return ""
  }

  return value
    .replace(/[^A-Za-z0-9&(),.'\-/\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
}

function getAuthoritySuggestions(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .slice(0, 3)
    .map((item) => ({
      authorityName: safeDirectoryText(item?.authorityName),
      ministryName: safeDirectoryText(item?.ministryName),
      matchReason: safeDirectoryText(item?.matchReason, 120),
      relatedOffices: Array.isArray(item?.relatedOffices)
        ? item.relatedOffices.slice(0, 3).map((office) => safeDirectoryText(office, 140)).filter(Boolean)
        : [],
    }))
    .filter((item) => item.authorityName)
}

function buildAuthorityContext(suggestions) {
  if (!suggestions.length) {
    return ""
  }

  return [
    "Official directory candidates for the user's general issue, most relevant first:",
    ...suggestions.map((suggestion, index) => [
      (index + 1) + ". Public Authority: " + suggestion.authorityName,
      suggestion.ministryName ? "Ministry: " + suggestion.ministryName : "",
      suggestion.matchReason ? "Best matching ministry for the subject: " + suggestion.matchReason : "",
      suggestion.relatedOffices.length ? "Related offices: " + suggestion.relatedOffices.join("; ") : "",
    ].filter(Boolean).join("\n")),
  ].join("\n")
}

function extractOutput(payload) {
  const content = payload?.choices?.[0]?.message?.content

  if (typeof content === "string") {
    return content.trim()
  }

  return (Array.isArray(content) ? content : [])
    .map((item) => item?.text ?? "")
    .join("")
    .trim()
}

function getUsage(usage) {
  const inputTokens = usage?.prompt_tokens ?? usage?.input_tokens
  const outputTokens = usage?.completion_tokens ?? usage?.output_tokens
  const totalTokens = usage?.total_tokens

  if (
    typeof inputTokens !== "number" ||
    typeof outputTokens !== "number" ||
    typeof totalTokens !== "number"
  ) {
    return undefined
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens,
  }
}

function sendJson(response, statusCode, payload) {
  if (typeof response.status === "function") {
    return response.status(statusCode).json(payload)
  }

  response.statusCode = statusCode
  response.setHeader("Content-Type", "application/json; charset=utf-8")
  response.end(JSON.stringify(payload))
  return undefined
}

/** Calls OpenRouter, retrying once when the rate limit looks like a burst rather than a cap. */
async function requestCompletion(apiKey, requestBody) {
  let openRouterResponse
  let payload
  let status
  let isRateLimited

  for (let attempt = 0; ; attempt += 1) {
    openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: requestBody,
    })

    payload = await openRouterResponse.json().catch(() => undefined)
    const upstreamCode = payload?.error?.code
    status =
      typeof upstreamCode === "number" && upstreamCode >= 400 && upstreamCode < 600
        ? upstreamCode
        : openRouterResponse.status
    isRateLimited = status === 429 || upstreamCode === "rate_limit_exceeded"

    if (!isRateLimited || attempt >= MAX_RETRIES) {
      break
    }

    const delay = getRetryDelay(openRouterResponse, attempt)
    if (delay === null) {
      break
    }

    console.warn("[RTI Sahayak] Rate limited, retrying once", { delayMs: delay })
    await sleep(delay)
  }

  const failed = !openRouterResponse.ok || Boolean(payload?.error)

  return { response: openRouterResponse, payload, status, isRateLimited, failed }
}

function logUpstreamFailure({ response, payload, status, isRateLimited }) {
  console.warn("[RTI Sahayak] OpenRouter request failed", {
    status,
    // OpenRouter puts the reason here; type/requestId are often absent on 429.
    message: payload?.error?.message ?? "(no message returned)",
    retryAfter: response.headers.get("retry-after"),
    requestId: response.headers.get("x-request-id"),
  })

  if (isRateLimited) {
    console.warn(
      "[RTI Sahayak] Falling back to local guidance. These models are shared across " +
        "OpenRouter users, so this is usually upstream saturation rather than a credit " +
        "problem. Connecting your own provider key at " +
        "https://openrouter.ai/settings/integrations gives this app its own rate limit."
    )
  }
}

/** Re-renders messages that are already on screen into the newly selected portal language. */
async function translateMessages(response, { apiKey, language, texts, safetyIdentifier, errors }) {
  const result = await requestCompletion(apiKey, JSON.stringify({
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: getTranslationInstruction(language) },
      { role: "user", content: texts.join("\n" + TRANSLATION_SEPARATOR + "\n") },
    ],
    max_completion_tokens: getTranslationTokenBudget(texts),
    reasoning: { effort: "low" },
    user: safetyIdentifier,
    provider: { data_collection: "deny" },
  }))

  if (result.failed) {
    logUpstreamFailure(result)
    return sendJson(response, result.isRateLimited ? 429 : 502, {
      error: result.isRateLimited ? errors.busy : errors.prepareFailed,
    })
  }

  const translations = extractOutput(result.payload)
    // The model occasionally wraps the whole batch in a fence because the segments look like data.
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/\n?```$/, "")
    .split(TRANSLATION_SEPARATOR_PATTERN)
    .map((segment) => segment.trim())

  if (translations.length !== texts.length || translations.some((segment) => !segment)) {
    console.warn("[RTI Sahayak] Translation did not come back one segment per message", {
      expected: texts.length,
      received: translations.length,
    })
    return sendJson(response, 502, { error: errors.prepareFailed })
  }

  const usage = getUsage(result.payload.usage)
  if (usage) {
    console.info("[RTI Sahayak] translation token usage", {
      model: result.payload.model ?? OPENROUTER_MODEL,
      segments: texts.length,
      ...usage,
    })
  }

  return sendJson(response, 200, { translations, usage })
}

async function rewriteDraft(response, { apiKey, language, rewrite, safetyIdentifier, errors }) {
  const result = await requestCompletion(apiKey, JSON.stringify({
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: getRewriteInstruction({ language, type: rewrite.type, maxLength: rewrite.maxLength }) },
      { role: "user", content: rewrite.draft },
    ],
    max_completion_tokens: rewrite.type === "first-appeal" ? 300 : MAX_OUTPUT_TOKENS,
    reasoning: { effort: "low" },
    user: safetyIdentifier,
    provider: { data_collection: "deny" },
  }))

  if (result.failed) {
    logUpstreamFailure(result)
    return sendJson(response, result.isRateLimited ? 429 : 502, {
      error: result.isRateLimited ? errors.busy : errors.prepareFailed,
    })
  }

  const output = extractOutput(result.payload)
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/\n?```$/, "")
    .trim()

  if (!output || output.length > rewrite.maxLength) {
    return sendJson(response, 502, { error: errors.prepareFailed })
  }

  return sendJson(response, 200, { rewrite: output })
}

async function prepareFiling(response, { apiKey, language, filing, safetyIdentifier, errors }) {
  const authorityContext = buildAuthorityContext(filing.authoritySuggestions)
  const result = await requestCompletion(apiKey, JSON.stringify({
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: getFilingInstruction({ language, authorityContext }) },
      { role: "user", content: filing.description },
    ],
    max_completion_tokens: MAX_OUTPUT_TOKENS,
    reasoning: { effort: "low" },
    user: safetyIdentifier,
    provider: { data_collection: "deny" },
  }))

  if (result.failed) {
    logUpstreamFailure(result)
    return sendJson(response, result.isRateLimited ? 429 : 502, {
      error: result.isRateLimited ? errors.busy : errors.prepareFailed,
    })
  }

  let prepared
  try {
    prepared = JSON.parse(extractOutput(result.payload).replace(/^```json\s*/i, "").replace(/\s*```$/, ""))
  } catch {
    return sendJson(response, 502, { error: errors.prepareFailed })
  }

  const index = prepared?.selectedAuthorityIndex
  const subject = typeof prepared?.subject === "string" ? prepared.subject.trim() : ""
  const requestText = typeof prepared?.requestText === "string" ? prepared.requestText.trim() : ""
  if (!Number.isInteger(index) || index < 0 || index >= filing.authoritySuggestions.length || !subject || subject.length > 120 || !requestText || requestText.length > 3000) {
    return sendJson(response, 502, { error: errors.prepareFailed })
  }

  return sendJson(response, 200, { selectedAuthorityIndex: index, subject, requestText })
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST")
    return sendJson(response, 405, { error: "Method not allowed" })
  }

  let body
  try {
    body = getBody(request)
  } catch {
    return sendJson(response, 400, { error: "Invalid request body" })
  }

  const language = getLanguage(body.language)
  const messagesForLanguage = localizedErrors[language]
  const safetyIdentifier =
    typeof body.safetyIdentifier === "string" &&
    /^rti-sahayak-[a-f0-9-]{36}$/i.test(body.safetyIdentifier)
      ? body.safetyIdentifier
      : "rti-sahayak-anonymous"
  const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY

  if (!apiKey) {
    return sendJson(response, 503, { error: messagesForLanguage.notConfigured })
  }

  if (body.task === "translate") {
    const texts = getTranslationTexts(body.texts)

    if (!texts) {
      return sendJson(response, 400, { error: messagesForLanguage.prepareFailed })
    }

    try {
      return await translateMessages(response, {
        apiKey,
        language,
        texts,
        safetyIdentifier,
        errors: messagesForLanguage,
      })
    } catch {
      return sendJson(response, 502, { error: messagesForLanguage.unavailable })
    }
  }

  if (body.task === "rewrite") {
    const rewrite = getRewriteConfig(body)

    if (!rewrite) {
      return sendJson(response, 400, { error: messagesForLanguage.prepareFailed })
    }

    try {
      return await rewriteDraft(response, { apiKey, language, rewrite, safetyIdentifier, errors: messagesForLanguage })
    } catch {
      return sendJson(response, 502, { error: messagesForLanguage.unavailable })
    }
  }

  if (body.task === "filing") {
    const filing = getFilingConfig(body)

    if (!filing) {
      return sendJson(response, 400, { error: messagesForLanguage.prepareFailed })
    }

    try {
      return await prepareFiling(response, { apiKey, language, filing, safetyIdentifier, errors: messagesForLanguage })
    } catch {
      return sendJson(response, 502, { error: messagesForLanguage.unavailable })
    }
  }

  const message = safeMessage(body.message)
  if (!message) {
    return sendJson(response, 400, { error: "A message is required" })
  }

  if (containsSensitiveData(message)) {
    return sendJson(response, 400, {
      error: messagesForLanguage.sensitive,
    })
  }

  const history = Array.isArray(body.history)
    ? body.history
        .slice(-4)
        .map((item) => ({
          role: item?.role === "assistant" ? "assistant" : "user",
          content: safeMessage(item?.content),
        }))
        .filter((item) => item.content && !containsSensitiveData(item.content))
    : []
  const authorityContext = buildAuthorityContext(getAuthoritySuggestions(body.authoritySuggestions))

  const requestBody = JSON.stringify({
    model: OPENROUTER_MODEL,
    messages: [
      {
        role: "system",
        content: [INSTRUCTIONS, getLanguageInstruction(language), authorityContext].filter(Boolean).join("\n\n"),
      },
      ...history,
      { role: "user", content: message },
    ],
    max_completion_tokens: MAX_OUTPUT_TOKENS,
    reasoning: { effort: "low" },
    user: safetyIdentifier,
    // data_collection "deny" keeps the provider from training on these questions. Zero data
    // retention (zdr) is deliberately not requested: it restricts routing to a small pool of
    // certified endpoints that is saturated, which failed every request with a 429.
    provider: { data_collection: "deny" },
  })

  try {
    const result = await requestCompletion(apiKey, requestBody)

    if (result.failed) {
      logUpstreamFailure(result)

      return sendJson(response, result.isRateLimited ? 429 : 502, {
        error: result.isRateLimited ? messagesForLanguage.busy : messagesForLanguage.prepareFailed,
      })
    }

    const reply = extractOutput(result.payload)
    if (!reply) {
      return sendJson(response, 502, { error: messagesForLanguage.emptyAnswer })
    }

    const usage = getUsage(result.payload.usage)
    if (usage) {
      // model is logged too, so a fallback to the sibling model is visible in the terminal.
      console.info("[RTI Sahayak] token usage", { model: result.payload.model ?? OPENROUTER_MODEL, ...usage })
    }

    return sendJson(response, 200, { reply, usage })
  } catch {
    return sendJson(response, 502, { error: messagesForLanguage.unavailable })
  }
}
